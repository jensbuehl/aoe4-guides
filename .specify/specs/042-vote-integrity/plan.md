# Implementation Plan: Vote Integrity

**Branch**: `042-vote-integrity` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.specify/specs/042-vote-integrity/spec.md`

## Summary

Make one account count once for likes and upvotes by binding each count to the caller's own list in a
single batched write, checked from both sides by the Firestore rules (research R1–R2). Before that,
measure with a read-only two-run check whether anyone has already been inflating counts (R10). Along
the way: drop the 30-favourite cap by loading My Favorites by id and filtering in memory (R8); remove
downvoting and freeze its data (R5); re-weight the activity score to views 1 / upvotes 25 / likes 100
with a per-build weighting version so the switch never registers as activity (R9).

## Technical Context

**Language/Version**: JavaScript (ES modules in `src/`, CommonJS in `functions/`); Node 22.

**Primary Dependencies**: Vue 3, Vuetify 3, Vuex, Firebase JS SDK (Firestore, Auth, App Check);
`firebase-functions` v2 + `firebase-admin` in `functions/`; `@firebase/rules-unit-testing` for rules.

**Storage**: Cloud Firestore — `builds/{id}` (counters, scores), `favorites/{uid}` (an account's
lists). No new collection.

**Testing**: `npm run test:rules` (emulator, needs Java) for every allowed/refused write;
`npm run check:setup` after `.vue` changes; throwaway `@vue/reactivity`/Node harnesses for
`applyListConfig` and `nextTrend` (pure functions); browser checks for the buttons and My Favorites.

**Target Platform**: Web SPA on Netlify; scheduled Cloud Functions.

**Project Type**: Web application (frontend + Firebase backend).

**Performance Goals**: A like still feels instant (optimistic state, one round trip). My Favorites:
median 1 query, at most 2 for the longest measured list (58).

**Constraints**: Rules access calls ≤ 20 per batch, ≤ 10 per document (uses 3 + 3). Firestore `in`
≤ 30 values per query. No migration. Old open tabs will be refused after the rules deploy (accepted).

**Scale/Scope**: 4.4k builds, 5.1k list documents, 7.7k favourites, 2.6k upvotes, 151 downvotes.
Touches 3 components (Favorite, Vote, NoFilterResults), 2 views (BuildDetails, MyFavorites), 4 existing data modules, 1 new service, 1 new pure module, rules, 1 function module,
1 new script, rules tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Simplicity First | Rules + one batch instead of a callable or trigger (R1). No new dependency. In-memory list replaces cursor paging for one page. Downvotes removed rather than secured. | ✅ |
| II. Incremental Quality | Fixes swallowed write errors, the two-copies-of-a-button desync (R7), the latent two-filter failure on My Favorites, and 5 accounts whose My Favorites cannot load today. Dead helpers removed. | ✅ |
| III. Consistent UX & Reuse | Same buttons, snackbar and pending pattern as elsewhere; My Favorites keeps `FilterConfig` and `BuildListCard`. | ✅ |
| IV. Cost-Conscious | My Favorites reads drop for most visits (median 2 vs. 10 + count). Rules add ~3 billed reads per like — ~10k likes+upvotes in the site's history. Check runs ~9.5k reads × 3. Functions unchanged in cost. | ✅ |
| V. Secure Defaults | The point of the feature. Rules tested case-first against the deployed copy; contract lists every case. No values added to `src/` that should not be public (the check's output stays in a gitignored scratch folder). | ✅ |

**Post-design re-check**: unchanged — all ✅. No complexity to track.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/042-vote-integrity/
├── spec.md
├── plan.md              # this file
├── research.md          # R1–R11
├── data-model.md
├── quickstart.md        # check, tests, deploy order, browser checks
├── contracts/
│   ├── firestore-rules.md   # V*/X* cases; which 040 cases change
│   └── client-writes.md     # setReaction, callers, removed helpers
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
firestore.rules                              # builds counter branch; favorites rule (R1–R5)
tests/rules/
├── builds.rules.test.mjs                    # update A2/A3/A8 per contract
└── votes.rules.test.mjs                     # new: V1–V8, X1–X16

scripts/check-vote-gaps.mjs                  # new: read-only check (R10)

functions/builds/
├── trend.js                                 # WEIGHTS, WEIGHTS_VERSION, rebased state (R9)
├── updateBuildTrend.js                      # select + write trendWeights
└── updateBuildAllTimeScore.js               # unchanged code; force-run after deploy

src/firebase/index.js                        # export writeBatch
src/composables/data/
├── collectionService.js                     # export writeWithTokenRetry
├── reactionService.js                       # new: setReaction (contracts/client-writes.md)
├── favoriteService.js                       # remove add/remove helpers
├── buildService.js                          # remove ±likes/±votes; getBuildsByIds; drop favourites cursors; NON_EDITABLE_FIELDS += trendWeights
├── queryParameterBuilder.js                 # drop the favourites `in` filter
└── applyListConfig.js                       # new: pure filter + sort mirroring Firestore (R8)
src/components/
├── Favorite.vue                             # setReaction, no cap, shared state, pending
└── Vote.vue                                 # thumbs-up only
src/views/builds/
├── BuildDetails.vue                         # likes event + :count
└── MyFavorites.vue                          # load by id, page in memory
src/components/notifications/NoFilterResults.vue   # comment mentions thirty favourites
```

**Structure Decision**: Existing web-app layout; no new folders. One new service and one new pure
module, because both have a single, testable job.

## Phases (for /speckit-tasks)

1. **Check** (P1, US1) — `check-vote-gaps.mjs`; run 1 immediately. Gates the rules deploy by ≥ 7 days.
2. **Client write + buttons** (US2 client side, US3) — reactionService, Favorite, Vote, BuildDetails.
3. **My Favorites** (US4) — getBuildsByIds, applyListConfig, MyFavorites, cap removed.
4. **Rules** (US2) — contract cases first, then rules; deploy after check run 2.
5. **Weights** (US5) — trend.js versioning, rules/NON_EDITABLE_FIELDS for `trendWeights`, deploy,
   force jobs.
6. **Harvest** — reconcile 040's contract, CLAUDE.md pointer, memory.

## Complexity Tracking

None.
