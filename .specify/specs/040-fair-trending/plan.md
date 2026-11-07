# Implementation Plan: Fair Trending

**Branch**: `040-fair-trending` | **Date**: 2026-11-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.specify/specs/040-fair-trending/spec.md`

## Summary

Three changes, shipped in this order:

1. **Rules**: counters can only be stepped by one, scores only written by the scheduled jobs, and
   `authorUid` can no longer be rewritten on update. That last one closes a takeover hole found while
   planning (research R2): today any signed-in user can claim someone else's build.
2. **Client**: editor saves stop sending counters; a view counts once per build per browser per 24 h
   and never for the author.
3. **Trending**: a new daily job keeps a decayed recent-activity score (`trend`, half-life 7 days)
   next to the old weekly one for a shadow week. A one-line switch then makes it write `score`, which
   every Trending surface already sorts by.

Steps 1 and 2 go out in one release, because the new rules refuse the old editor's saves. Step 3's
switch waits for at least 7 days of data.

## Technical Context

**Language/Version**: JavaScript. Vue 3 `setup()` components and ES modules in `src/`; CommonJS
Node 22 in `functions/`; Firestore rules v2

**Primary Dependencies**: Firebase JS SDK 10.14, `firebase-functions` v6 (v2 scheduler API),
`firebase-admin` 13; **new dev dependency** `@firebase/rules-unit-testing@^3`

**Storage**: Firestore `builds` (three new server-owned fields: `trend`, `trendBase`, `trendAt`),
`contributors` (rules only); `localStorage["aoe4guides.viewed"]` in the browser

**Testing**: rules test on the Firestore emulator (`npm run test:rules`, needs Java 21). For the
`viewMemory` module and the trend arithmetic, a throwaway Node harness in the repo root (CLAUDE.md
pattern), deleted afterwards. `npm run check:setup`, `check:steps`. Manual golden path on
`aoe4-guides-dev` (quickstart)

**Target Platform**: the web SPA on Netlify; Cloud Functions in `us-central1`; Cloud Scheduler in UTC

**Project Type**: web application plus scheduled backend jobs

**Performance Goals**: no added latency on the build page (the view write is fire-and-forget, as
today); the daily job finishes well inside its timeout for ~4,200 builds

**Constraints**: Netlify Node 22.1.0 rule (CLAUDE.md) does not apply, since nothing new runs on deploy.
`functions/` is CommonJS and cannot import from `src/`. The activity weighting lives in two places
(old and new job) only until the old job is deleted

**Scale/Scope**: ~4,200 builds; ~78k reads/day and ~10k writes/day site-wide (Aug 2026)

## Constitution Check

| Principle | Assessment |
|---|---|
| I. Simplicity First | ✅ The score is three numbers per build, not a history. The switch is a constant, not a config document. No trigger for deletion: an owner-only rule does it (R4). One new dev dependency, justified below. |
| II. Incremental Quality | ✅ Fixes the stale-counter overwrite (R3) and the misleading `+ 1` on delete (R4) where they sit. The old score job is deleted once the switch has held (quickstart §5), not left behind. |
| III. Consistent UX | ✅ No UI changes. Trending looks the same with a different order. |
| IV. Cost-Conscious | ✅ ≈ €0.07/month in reads; writes stay inside the free tier; view writes go down (R8). |
| V. Secure Defaults | ✅ This feature *is* a rules review. It also closes the `authorUid` takeover (R2). Rules get an automated test for the first time. |

**Gate**: pass. The one addition worth naming is `@firebase/rules-unit-testing`: the only way to verify
rules without deploying them. It's a dev-only dependency and adds nothing to the bundle. The emulator
also needs a Java runtime on the machine, the owner's call (research R9).

*Re-check after design*: unchanged. The design adds no service, no trigger, no index, and no read on
any page.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/040-fair-trending/
├── spec.md
├── plan.md               # this file
├── research.md           # R1–R9: every decision and what it was checked against
├── data-model.md         # fields, who writes them, trend lifecycle
├── quickstart.md         # verification and the switch routine
├── contracts/
│   ├── firestore-rules.md   # allowed/refused writes = the rules test list
│   └── trending-score.md    # who reads `score` and what they are promised
└── checklists/requirements.md
```

### Source Code

```text
firestore.rules                              # builds: split by operation, stepped counters,
                                             #   server-only fields, immutable authorUid
                                             # contributors: stepped viewCount/boCount
tests/rules/builds.rules.test.mjs            # NEW — contract cases B*/A*/C*
package.json                                 # devDependency + "test:rules" script

src/composables/data/viewMemory.js           # NEW — import-free: claim(buildId, now)
src/composables/data/buildService.js         # updateBuild drops COUNTER/SERVER keys;
                                             #   recordView(build) gate + both increments
src/views/builds/BuildDetails.vue            # onMounted: recordView instead of two increments;
                                             #   delete: decrement by views (no +1)

functions/builds/trend.js                    # NEW — TRENDING_SOURCE, activityTotal, nextTrend
functions/builds/updateBuildTrend.js         # NEW — daily 23:30 UTC job + comparison log
functions/builds/updateBuildScore.js         # returns early when TRENDING_SOURCE === "recency";
                                             #   uses activityTotal from trend.js
functions/index.js                           # export updateBuildTrend
```

**Structure Decision**: Existing layout, nothing moves. `trend.js` holds the pure parts (constant,
total, next value), so the arithmetic can be tested without Firestore and both jobs share one
weighting. `viewMemory.js` is import-free for the same reason: a Node harness can drive it.

## Design notes

**Rules**: see [contracts/firestore-rules.md](contracts/firestore-rules.md). Rules need no loops: the
five counters and five server fields are listed out in two helper functions, `stepped(f, allowDown)`
and `untouched(fields)`. The counter-step branch requires `affectedKeys().size() == 1`, which is what
every client write already is. A comment at the rule records *why* `request.resource.data.authorUid`
must never be what grants an update (R2), since that's the trap that made the old rule look right.

**`recordView(build)`** in `buildService.js`:
1. `await auth.authStateReady()` (R5: not the store flag, which is committed before the user).
2. Return if `auth.currentUser?.uid === build.authorUid` (FR-010).
3. Return unless `viewMemory.claim(build.id, Date.now())` (FR-009, claim before write).
4. `incrementViews(build.id)` and `incrementContributorViews(build.authorUid)`, independent and not
   awaited, as today. They're not batched: a build whose author has no contributor document would
   then lose its view as well (FR-011 is about the decision, not atomicity).

**`updateBuild`** drops the keys `views, likes, upvotes, downvotes, comments, score, scoreAllTime,
trend, trendBase, trendAt` from its own copy before `saveable()`. The list is one exported constant,
which the rules comment points to, so the two change together.

**`updateBuildTrend`**: `select()` of `views, likes, upvotes, downvotes, isDraft, score, trend,
trendBase, trendAt`; compute per R7; batches of ≤ 500, writing only changed documents. When `"recency"`,
also write `score = ln(1 + trend)`. Then one structured log line: counts (seeded / held / updated /
unchanged) and the two top-8 lists.

## Follow-up (out of scope, decided enough to note)

**Server-side view counting.** An endpoint that checks App Check, then deduplicates on a hash of
`dailySalt + (IPv4 | IPv6 /64) + user agent + buildId`, storing only the hash, never the address.
This makes the unit one browser per household per day. Private windows, cleared storage and a second
tab stop counting extra; a second browser in the same home still counts. Shared networks (mobile
carriers, student halls, LAN events) argue for this key over a plain per-IP limit. Cost is roughly
one extra write per counted view. Worth building if Trending still looks gamed once this feature has
shut the reload loop.

## Complexity Tracking

No violations to justify.
