# Research: Fair Trending

Everything here was checked against the code or the installed dependency on 2026-11-07, not assumed.

## R1 — Can a rule tell `increment(1)` from `views: 1000000`?

**Decision**: Yes. Compare `request.resource.data[f]` with `resource.data[f]` in the rule.

**Rationale**: Firestore resolves field transforms (`increment()`) *before* the rules run, so the rule
sees the post-write value. `after == before + 1` is exactly "this write was a +1 step", whichever way
the client expressed it. Fields missing from old documents read as 0 through `.get(f, 0)`; an
`increment(1)` on a missing field produces 1, which passes.

**Alternatives considered**: Moving every counter write to a callable (rejected for now: that is the
server-side follow-up, and it costs an invocation per view; the rule closes the arbitrary-value hole
at zero cost).

## R2 — The owner rule is wider than it looks

**Finding**: `firestore.rules:6-8` grants `read, write` when
`request.auth.uid == request.resource.data.authorUid || request.auth.uid == resource.data.authorUid`.
On an **update**, `request.resource.data` is the document *after* the write. So any signed-in user can
update **someone else's** build by setting `authorUid` to their own uid in the same write: the first
clause is satisfied by the value they just supplied. That takes over the build (and any field on it,
counters included).

**Decision**: Split the rule by operation. `create` checks the incoming `authorUid`; `update` and
`delete` check the **existing** `authorUid`, and `update` also requires `authorUid` to be unchanged.
This is a security fix in its own right and goes in the first commit (constitution V).

**Rationale**: Every legitimate write already satisfies this — the editor sends the build's existing
`authorUid` back unchanged; a remix is a `create` with the new author; display-name changes run on the
Admin SDK (`functions/users/updateUserDisplayName.js`), which bypasses rules.

## R3 — Editor saves clobber counters

**Finding**: `updateBuild` (`buildService.js:739`) sends the whole loaded build through `saveable()`,
counters included. Both callers — the editor save (`BuildEditor.vue:735`) and publish
(`BuildDetails.vue:802`) — pass a build loaded earlier, so every view, like and vote that arrived in
between is overwritten with the old number. It also means the new rule would refuse every edit of a
build that had gained a view meanwhile.

**Decision**: `updateBuild` drops the counter and server-owned keys before writing. `updateDoc` leaves
absent keys untouched, so the database keeps its current values. `addBuild` is unchanged: a new build
legitimately starts at zero.

## R4 — Contributor totals: the delete path needs a decrease of more than 1

**Finding**: `BuildDetails.vue:777` calls `decrementViews(authorUid, build.views + 1)` after deleting a
build. A strict ±1 rule on `viewCount` would refuse it. Only the author can delete a build (no admin
path writes builds: `Admin.vue` has no build writes; account deletion runs on the Admin SDK in
`functions/users/accountCleanup.js`).

**Decision**: On `contributors/{uid}`:
- `viewCount` +1 — anyone (as today, but stepped).
- `viewCount` decrease by any amount — only the contributor themselves. Lowering one's own total is
  harmless and is exactly what deletion needs.
- `boCount` ±1 — only the contributor themselves (create and delete are both author actions).

And the `+ 1` goes: it compensated for the deleting visit's own view, and after this feature the
author's visits are not counted. The decrement uses the views loaded when the page opened, so views
gained since then stay on the author's total; that drift is today's too, and too small to justify a
read before every delete.

**Alternatives considered**: An `onDocumentDeleted` trigger on `builds` (rejected: this project's
`eur3` database needs its triggers in `europe-west4` while the other functions run in `us-central1` —
see the scale-and-costs memory — a regional split for one decrement; and the owner-only decrease rule
does the job).

## R5 — When is the signed-in user known on the build page?

**Finding**: `BuildDetails.vue:589-593` documents that Firestore queues every read until auth reports
its first user, so a build loaded from Firestore cannot arrive before the user is known. But the
cached path (`store.state.cache.builds`, line 617) skips the read, and the comment's guarantee is about
Firestore's queue, not about our store's `user`.

**Decision**: The view recorder does `await auth.authStateReady()` (Firebase Auth, present in the
installed 10.14 SDK) and then reads `auth.currentUser?.uid`, with `auth` from `@/firebase`. Cheap, and
it makes FR-010 hold by construction rather than by a timing argument.

**Not `store.state.authIsReady`**: the store's `onAuthStateChanged` handler (`store/index.js:613-617`)
commits `setAuthIsReady(true)` *before* `setUser`, so waiting on the flag and then reading
`store.state.user` depends on the order of two commits. Firebase's own promise and `currentUser` do not.

## R6 — Remembering past views

**Decision**: A small import-free module `src/composables/data/viewMemory.js`:
- `localStorage` key `aoe4guides.viewed`, value `{ [buildId]: lastCountedMs }`.
- `claim(buildId, now)` returns `true` and records `now` if the build was not counted in the last
  24 h, otherwise `false`. It records **before** the write is sent, so two quick mounts (back/forward)
  cannot both count.
- Entries older than 24 h are pruned on every write, so the map holds at most a day of builds.
- A module-level `Map` backs it up when storage throws. That gives "once per page load" when storage
  is unavailable (FR-012), not "once per mount".
- Every storage access is in `try/catch`, the convention in `homeService.js` and `AgeTimeline.vue`.

**Rationale**: The "once per 24 h" is a rolling window per build, the usual meaning of "one view per
person per day", and it needs no date or time-zone logic.

**Privacy**: Build ids and timestamps only, never sent anywhere. No fingerprinting (regulators treat it
as consent-requiring tracking; browsers actively randomise the signals).

## R7 — Trending recalculation

**Decision**: A new scheduled function `updateBuildTrend`, daily at 23:30 UTC (`timeZone: "UTC"` set
explicitly; the SDK sends none and Cloud Scheduler then defaults to UTC, but saying it costs nothing).
23:30 so the 00:00 home snapshot picks up the fresh order.

Per build:

```
total   = (views ?? 0) + 5·(upvotes ?? 0) − 10·(downvotes ?? 0) + 50·(likes ?? 0)
if trendBase is missing:            seed  → trend 0,   trendBase total, trendAt now     (FR-017)
else if isDraft:                    hold  → trend 0,   trendBase total, trendAt now     (FR-019)
else:
  days    = (now − trendAt) / 1 day
  next    = max(0, trend · 0.5^(days / 7) + (total − trendBase))
  if next < 0.1: next = 0                                                                (FR-020)
  →                                        trend next, trendBase total, trendAt now
write only if trend or trendBase actually changed
```

Decay uses the **elapsed time**, not "one day per run", so a missed or late run is exact rather than
off by a day. A skipped write is lossless for the same reason: base and timestamp stay put, and the
next run covers both days.

**The score field**: Every Trending surface — home lane and hero (`updateHomeSnapshot.js:165`), the
build list's sort (`FilterConfig.vue:447`, `configDefaultProvider.js:21`), the civ dashboard
(`Dashboard.vue:206`), the public API (`BuildOrderByField = "score"`) — orders by `score`, and the
composite indexes in `firestore.indexes.json` are built on it. So after the switch the job writes
`score = ln(1 + trend)`. Same field: no index, client, snapshot or API change (FR-021). The logarithm
keeps the order identical to ordering by `trend` and keeps `score` in the same order of magnitude as
today for API consumers who read the number.

**Shadow week and switch** (FR-018): one constant, `TRENDING_SOURCE` in `functions/builds/trend.js`,
`"legacy"` or `"recency"`. While `"legacy"`, the new job writes only the `trend*` fields and the weekly
job runs as now. On `"recency"` the new job also writes `score`, and the weekly job returns at once.
Switching either way is: edit the constant, `npm run deploy` in `functions/`, then force-run the job
whose turn it now is from Cloud Scheduler so the order changes the same day. That is the
`FEATURED_CONTRIBUTOR` routine `updateHomeSnapshot.js` already uses — no site release.

**Comparison** (SC-005): every run logs the top 8 by `trend` beside the top 8 by `score` (title, id,
both numbers) as one structured log entry, readable in Cloud Logging. No new page, no new storage.
`title` is therefore in the job's `select()` alongside the nine scoring fields.

**Alternatives considered**:
- Store daily history and sum the last 7 days (rejected: an array per build, more bytes, a sharp
  cliff after the 7th day; the decayed sum has no cliff and needs three fields).
- Hacker-News style `points / age^g` (rejected: it ranks *total* points against age, so it keeps the
  incumbent advantage and penalises an old build that becomes useful again after a patch).
- Writing `trend` straight into `score` without a log (rejected: same order, but it changes the
  number's scale for API readers for no gain).
- A config document read by the job instead of a constant (rejected: one more read and one more place
  to look; the constant matches the existing routine).

**Known small gap**: Because the score floors at 0, unliking and re-liking a build *across* two runs
can add up to 50 when the build's score is below 50. It needs a signed-in account, one cycle per day,
and gains less than one like. Accepted.

## R8 — Cost (constitution IV)

- Reads: ~4,200 per daily run → ~126k/month. The site already exceeds the 50k/day free reads, so
  these are billable: 126k × €0.053/100k ≈ **€0.07/month**. The job uses `select()` on the nine fields
  it needs, so it does not pull `steps` (7.9 of ~8.5 KB per build) into the function.
- Writes: only builds whose trend or base changed. Builds with non-zero trend change every day as they
  decay, so expect up to ~2–3k/day at first, falling as old builds reach 0 and stop being written.
  Today's ~10k/day plus that stays under the 20k/day free writes.
- View counting: fewer writes than today (every reload used to write twice).
- Removing the old weekly job saves ~4,200 reads + ~4,200 writes a week, once it is deleted.

## R9 — Testing the rules

**Decision**: Add `@firebase/rules-unit-testing@^3` (peer `firebase ^10`; installed `firebase` is
10.14.1) as a dev dependency, a test file under `tests/rules/`, and an npm script `test:rules` running
`firebase emulators:exec --only firestore --project demo-aoe4-guides "node --test tests/rules/"`.
`firebase-tools` is already a dev dependency. The `demo-` project id keeps the emulator from touching
either real project.

**Rationale**: SC-001 asks for a rerunnable check, and rules cannot be verified any other way short of
deploying them. The constitution requires no test suite but does not forbid one; this is one file
testing the one place where a mistake is a security hole.

**Prerequisite**: The Firestore emulator needs a Java runtime (JDK 21 for `firebase-tools` 15). This
machine has none (`java` not found). One-time install, e.g. `winget install EclipseAdoptium.Temurin.21.JDK`.
The owner's call; until then the rules are verified against `aoe4-guides-dev` by hand (quickstart).

**Alternatives considered**: Testing against the deployed dev project with the client SDK (rejected
as the *automated* check: needs App Check on dev, real accounts, and leaves test writes behind; kept
as the manual fallback).

## R10: Non-numeric counters in production (found after release, 2026-11-07)

**Finding**: The first comparison log showed `score: None`. In production, **20 builds held
`upvotes: NaN`**, written by some client under the old open rules (cause not traced; an old client
doing arithmetic on a missing field is the likely one). One more build has no `views` at all. The old
jobs turned both into `NaN` scores (21 builds, `score` and `scoreAllTime`), and the first seed copied
the NaN into `trendBase`/`trend`. One NaN in a sort makes its comparator meaningless, so the whole
comparison list was wrong.

**Decision**: `activityTotal` counts missing *and* non-finite fields as 0; `nextTrend` re-seeds a
non-finite base; the comparison log treats a non-finite stored score as 0; `updateBuildAllTimeScore`
uses the shared `activityTotal`. All three jobs redeployed; the next trend run re-seeded exactly
those 20 builds.

**Still open**: the 20 stored `upvotes: NaN`. Under the new rules `NaN + 1` matches nothing, so those
builds cannot be upvoted until the field is set to a number. A one-off repair (set to 0; the real count
is lost either way) needs the owner's go, since it writes production data. `score` heals at the next
Friday run, `scoreAllTime` on the 1st.
