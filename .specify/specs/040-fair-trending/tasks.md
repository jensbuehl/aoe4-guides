# Tasks: Fair Trending

**Input**: Design documents from `.specify/specs/040-fair-trending/`
**Prerequisites**: plan.md, spec.md (Clarifications 2026-11-07), research.md (R1–R9), data-model.md,
contracts/firestore-rules.md, contracts/trending-score.md, quickstart.md

**Tests**: The spec asks for one automated test (SC-001): the rules test, on the emulator. Everything
else uses throwaway Node harnesses in the repo root, deleted after use (CLAUDE.md pattern), plus the
static checks and the manual steps in quickstart.

**Deploys are outward-facing.** Every task that deploys rules or functions, or pushes to `main`, is
marked **(owner)**. It is run or explicitly approved by the owner, never as a side effect of another
task. Nothing is committed unless asked.

## Phase 1: Setup

- [X] T001 **(owner)** *(Done for this session with a portable Temurin 21 JRE in the scratchpad, on PATH only for the test command — nothing installed system-wide. A permanent install is still the owner's call.)* Install a Java runtime for the Firestore emulator (quickstart §0): `winget install EclipseAdoptium.Temurin.21.JDK`, open a new terminal, confirm `java -version` prints 21. Until this is done, T005/T012 fall back to the manual check on `aoe4-guides-dev` (quickstart §1), and the report must say so.
- [X] T002 Add `"@firebase/rules-unit-testing": "^3.0.4"` to `devDependencies` in `package.json` (peer `firebase ^10`; installed 10.14.1, research R9) and the script `"test:rules": "firebase emulators:exec --only firestore --project demo-aoe4-guides \"node --test tests/rules/\""`. Run `npm install`. Confirm nothing under `src/` imports it, since it must not reach the bundle.

---

## Phase 2: Foundational: the `authorUid` takeover hotfix (can ship alone, ahead of everything)

**Why first**: today any signed-in user can update someone else's build by putting their own uid into
`authorUid` in the same write (research R2). It is independent of every story and breaks no
legitimate write, so it can go out as its own release.

- [X] T003 Create `tests/rules/builds.rules.test.mjs` with `node:test` + `@firebase/rules-unit-testing`: `initializeTestEnvironment({ projectId: "demo-aoe4-guides", firestore: { rules: readFileSync("firestore.rules", "utf8") } })`; a `beforeEach` that clears Firestore and seeds `builds/b1` (authorUid `alice`, every counter at a known non-zero value, `score`, `scoreAllTime`) and `contributors/alice` (`viewCount`, `boCount`) via `withSecurityRulesDisabled`. Helpers for `anon`, `alice` (author) and `bob` (other) contexts. Add cases **B8** (bob sets `authorUid: "bob"` plus `title`) → refused, **B12** (alice sets `authorUid: "bob"`) → refused, **A5** (alice edits `title`, `steps`, `isDraft`, `timeCreated`, `timeUpdated`) → succeeds, **A7** (alice deletes) → succeeds, and bob deletes → refused. Imports only `node:` builtins and the test package. Nothing from `src/`.
- [X] T004 Split the owner rule in `firestore.rules` (lines 4-9) by operation: `allow read;` stays in the public block; `allow create: if request.auth != null && request.resource.data.authorUid == request.auth.uid;` `allow update: if request.auth != null && resource.data.authorUid == request.auth.uid && request.resource.data.authorUid == resource.data.authorUid;` `allow delete: if request.auth != null && resource.data.authorUid == request.auth.uid;`. Replace the "S1 fix" comment with one explaining why `request.resource.data.authorUid` must never be what grants an update: it is the value the caller just supplied. Leave the public counter rule (lines 10-14) untouched in this task.
- [X] T005 Run `npm run test:rules`. All T003 cases must pass. Without Java (T001), run quickstart §1's manual check for B8 on `aoe4-guides-dev` instead, and report which of the two was done.
- [X] T006 **(owner)** Deploy the hotfix rules: `npx firebase deploy --only firestore:rules --project dev`, check that an edit and a delete still work on dev, then `--project prod`. No client change is needed for this phase.

**Checkpoint**: the takeover hole is closed in production. The stories below build on this rules file.

---

## Phase 3: User Story 1: counters cannot be set, only stepped (P1) 🎯 MVP

**Goal**: views +1 only by anyone; likes/votes/comments ±1 by signed-in users only; scores and trend
fields only by the jobs; author edits leave counters alone (FR-001 – FR-008).

**Independent Test**: `npm run test:rules` passes every case in contracts/firestore-rules.md;
quickstart §2 step 4 (a view arriving during an edit survives the save).

- [X] T007 [US1] Extend `tests/rules/builds.rules.test.mjs` with the rest of contracts/firestore-rules.md: **B1–B7, B9–B11, B13, B14** refused; **A1–A4, A6, A8** as specified (A6 uses the editor's create payload from `src/views/builds/BuildEditor.vue:475-481` and also checks a remix payload, which has no `upvotes`/`downvotes`); and **C1–C7** on `contributors/alice`. Use `increment()` for the step writes, as the app does. Run it: the new cases must **fail** against the T004 rules, which shows the tests can catch the hole.
- [X] T008 [US1] In `firestore.rules`, `builds/{build}`: add the helper functions `stepped(f, allowDown)` (`request.resource.data.get(f, 0) == resource.data.get(f, 0) + 1`, or `− 1` when `allowDown`) and `untouched(keys)` (`!request.resource.data.diff(resource.data).affectedKeys().hasAny(keys)`). Tighten T004's `update` with `untouched(['views','likes','upvotes','downvotes','comments','score','scoreAllTime','trend','trendBase','trendAt'])`. Tighten `create`: each of `views, likes, upvotes, downvotes, comments, score, scoreAllTime` is absent or `== 0`, and none of `trend, trendBase, trendAt` is in `request.resource.data`. Replace the public `allow update` (lines 12-13) with the counter-step branch from the contract: `affectedKeys().size() == 1` and either `hasOnly(['views']) && stepped('views', false)`, or signed in && `hasOnly([f]) && stepped(f, true)` for each of `likes, upvotes, downvotes, comments`. Comment at the field lists: they mirror `NON_EDITABLE_FIELDS` in `src/composables/data/buildService.js` (T010), and the two change together.
- [X] T009 [US1] In `firestore.rules`, `contributors/{contributor}`: replace the stat `allow update` (lines 87-91) with the contract's three branches: `viewCount` +1 by anyone; `viewCount` decrease by the contributor themselves (build deletion, research R4); `boCount` ±1 by the contributor themselves. Rewrite the "Intentionally public" comment to say what is public now (a +1 step) and why the decrease is owner-only.
- [X] T010 [US1] In `src/composables/data/buildService.js`: export `NON_EDITABLE_FIELDS = ["views","likes","upvotes","downvotes","comments","score","scoreAllTime","trend","trendBase","trendAt"]` with a comment naming `firestore.rules` as its mirror. In `updateBuild` (≈ line 739), build the payload from a **shallow copy** with those keys deleted, after `withAgeTimings` and before `saveable()`. The caller's `build` object must keep its counters (the store and the page display them). Comment: why (research R3: a stale copy overwrote counters gained while editing, and the rules now refuse it). `addBuild` stays unchanged.
- [X] T011 [US1] In `src/views/builds/BuildDetails.vue` `handleDelete` (≈ line 777): change `decrementViews(build.value.authorUid, build.value.views + 1)` to `build.value.views ?? 0`, and replace the misleading "icrement contributor views" comment with the reason. The `+ 1` paid for the deleting visit's own view, which is no longer counted (FR-010). Views gained since the page opened stay on the total, an accepted drift (research R4).
- [X] T012 [US1] Run `npm run test:rules` (all B/A/C cases green), `npm run check:setup`, `npm run build` (if it exits with code 139, rerun; see the local-build-segfaults memory). Report each outcome plainly, and name the emulator-vs-manual fallback if T001 is not done.

**Checkpoint**: US1 is complete in code. It must not be deployed without US2's client in the same
release (see Phase 6, T024). It can be, but the shipping unit is US1 + US2.

---

## Phase 4: User Story 2: a view is a person looking, not a page load (P1)

**Goal**: one view per build per browser per 24 h; never the author's own; the page never breaks
when storage is unavailable (FR-009 – FR-012).

**Independent Test**: quickstart §2 steps 1, 2, 3 and 5 in a browser against dev.

- [X] T013 [P] [US2] Create `src/composables/data/viewMemory.js` per research R6. **No imports.** Constants `STORAGE_KEY = "aoe4guides.viewed"`, `WINDOW_MS = 24 * 60 * 60 * 1000`; a module-level `Map` fallback; export `claim(buildId, now = Date.now())`. It reads the stored map (try/catch, any parse failure counts as empty) and returns `false` if the entry is younger than `WINDOW_MS`. Otherwise it records `now`, prunes entries older than the window, writes back (try/catch), and returns `true`. When storage is unreadable or throws, it decides with the `Map` alone: once per page load. Header comment: what is stored, that it never leaves the device, the rolling-window meaning, and why it claims before the write is sent.
- [X] T014 [US2] Verify T013 with a throwaway harness `viewMemory.harness.mjs` in the **repo root**, run with plain `node` (no alias loader needed, since the module imports nothing). Give `globalThis.localStorage` an in-memory shim. Cases: first claim `true`, immediate second `false`; `now + WINDOW_MS + 1` → `true`; pruning removes an entry older than the window; a shim whose `getItem` and `setItem` throw → first `true`, second `false` (the `Map`); a corrupt JSON value → treated as empty. Print `ok`, then **delete** the harness.
- [X] T015 [US2] In `src/composables/data/buildService.js`: export `async function recordView(build)`. Steps: `await auth.authStateReady()` (`auth` from `@/firebase`, research R5: not the store flag); return if `auth.currentUser?.uid === build.authorUid`; return unless `claim(build.id)`; then call `incrementViews(build.id)` and contributorService's `incrementViews(build.authorUid)` (import aliased as `incrementContributorViews`), neither awaited, as today. Swallow and `console.warn` failures, since a lost view must never surface. contributorService does not import buildService, so there is no cycle.
- [X] T016 [US2] In `src/views/builds/BuildDetails.vue` `onMounted` (≈ lines 620-627): replace `incrementViews(props.id)` and `incrementContributorViews(build.value.authorUid)` with `recordView({ ...build.value, id: props.id })` (the cached build may lack `id`; check, and pass whichever is reliable). Remove imports that are now unused (`incrementViews` from buildService, `incrementContributorViews`); keep `decrementViews`/`decrementBuilds`. Comment: one view per browser per day, never the author (FR-009/FR-010).
- [X] T017 [US2] Run `npm run check:setup`, `npm run check:steps` and `npm run build`; report plainly. State that quickstart §2 (reload count, 24 h expiry, author, storage blocked) is browser-only and not yet verified.

**Checkpoint**: US1 + US2 are the shippable unit (Phase 6, T024).

---

## Phase 5: User Story 3: Trending shows what people are using now (P2)

**Goal**: a daily decayed recent-activity score, shadowed for ≥ 7 days, then written to `score`
(FR-013 – FR-022). **Do not switch (T023) before US1 + US2 are live in production (FR-023).**

**Independent Test**: T019 harness prints `ok`; the T021 seed run logs every build as seeded; the
comparison logs during the shadow week; quickstart §4 after the switch.

- [X] T018 [P] [US3] Create `functions/builds/trend.js` (CommonJS, **no requires**). Exports: `TRENDING_SOURCE = "legacy"` (comment: the switch routine, quickstart §4, and that it mirrors the `FEATURED_CONTRIBUTOR` edit-and-deploy pattern in `updateHomeSnapshot.js`); `HALF_LIFE_DAYS = 7`; `TREND_FLOOR = 0.1`; `activityTotal(b)` = `(b.views ?? 0) + 5*(b.upvotes ?? 0) − 10*(b.downvotes ?? 0) + 50*(b.likes ?? 0)`; `nextTrend(b, total, nowMs)` returns `{ kind, trend, trendBase }` per research R7, with `kind` ∈ `seeded | held | updated | unchanged`. `seeded` when `trendBase` is absent; `held` when `isDraft` (trend 0, base = total); otherwise `max(0, trend·0.5^(days/HALF_LIFE_DAYS) + (total − trendBase))` with `days` taken from `trendAt` (a Firestore Timestamp: accept `.toMillis()`, or a number for the harness), floored to 0 below `TREND_FLOOR`; `unchanged` when the resulting trend and base equal the stored ones. Also `scoreFromTrend(t) = Math.log1p(t)`.
- [X] T019 [US3] Verify T018 with a throwaway `trend.harness.cjs` in the repo root that `require("./functions/builds/trend.js")`. Cases: a missing `trendBase` → `seeded`, trend 0; `isDraft` with a large delta → `held`, trend 0, base = total; trend 100, no delta, 7 days → 50 (±1e-9), 14 days → 25; one run 2 days later equals two 1-day runs (with no delta between them); a negative delta larger than the trend → 0; trend 0.15 after 7 days → 0; trend 0 with no delta → `unchanged`; `activityTotal({})` is 0 (not NaN). Print `ok`, then **delete** the harness.
- [X] T020 [US3] Create `functions/builds/updateBuildTrend.js`: `onSchedule({ schedule: "30 23 * * *", timeZone: "UTC", timeoutSeconds: 540 })`. Read `db.collection("builds").select("views","likes","upvotes","downvotes","isDraft","score","trend","trendBase","trendAt").get()`. For each doc, `nextTrend(...)`; skip `unchanged`; otherwise queue `{ trend, trendBase, trendAt: Timestamp.now() }`, plus `score: scoreFromTrend(trend)` when `TRENDING_SOURCE === "recency"` and it differs from the stored score. Commit in batches of ≤ 500, following `updateBuildScore.js`. Finally log one structured entry, `updateBuildTrend: comparison`, with counts per `kind` and two top-8 lists (by new `trend`, among non-draft builds, and by stored `score`), each `{ id, trend, score }`. *As built: `title` is selected too and logged with each entry. A few bytes per build, and a comparison of bare ids would be unreadable during the shadow week.* Header comment: why this exists (spec Background), why 23:30 UTC (before the 00:00 home snapshot), why `select()` (research R8).
- [X] T021 [US3] In `functions/builds/updateBuildScore.js`: at the top of the handler, `if (TRENDING_SOURCE === "recency") { logger.log("updateBuildScore: skipped, trending is recency-based"); return; }`. Replace the hand-written sum in `calculateScore` with `activityTotal(build)` from `./trend`. Note in the commit message that a build missing `views` used to score `NaN` and now scores from 0. Leave `updateBuildAllTimeScore.js` untouched (FR-022).
- [X] T022 [US3] In `functions/index.js`: export `updateBuildTrend` next to `updateBuildScore`. Run `node --check` on the three changed function files, then `node -e "require('./functions/index.js')"` from the `functions/` directory, if it loads without credentials. Otherwise report that it was skipped. *As run: all four pass `node --check`; `index.js` does not load locally because `resend` (notifyCommenters) is not installed in `functions/node_modules`. That gap is pre-existing and unrelated; `updateBuildTrend.js` and `updateBuildScore.js` load on their own.*
- [X] T023 [US3] **(owner)** *Done. Shadow deployed and seeded 2026-11-07 (gcloud runs with the SDK's bundled Python, see the scale-and-costs memory). Switched to `"recency"` on 2026-11-10, after three daily runs instead of seven, on the owner's call: a stable top 5, and originals ahead of their copies. `score` rewritten on 4,092 builds. Home snapshot, a live `orderBy("score")` query and the public API showed the same top 8.* Shadow deploy and the switch, strictly in quickstart order: §3 deploy with `"legacy"` and force-run once to seed; read the comparison log daily for ≥ 7 days; only after US1 + US2 are live in production (FR-023), §4: switch to `"recency"`, deploy, force-run `updateBuildTrend`, then `updateHomeSnapshot`, and check the four surfaces in contracts/trending-score.md. Back-out path: quickstart §4.

**Checkpoint**: Trending runs on recent activity, everywhere.

---

## Phase 6: Polish & cross-cutting

- [X] T024 **(owner)** Release US1 + US2 together, **client first, rules second**: push the client (Netlify deploys `main`), wait for the deploy to finish, then deploy the rules (`--project dev` first, quickstart §2 on dev, then `--project prod`). Rules first would refuse saves from the old client whenever a counter changed during the edit. Tabs still running the old client are left with the same small window afterwards: a refused save shows "Document could not be updated", and saving again after a reload works. Releases are a `chore: X.Y.Z` commit, with main rebased onto the weekly CI commits, never force-pushed (memories).
- [X] T025 Confirm the trending contract holds without changes in `aoe4-guides-api` (`BuildOrderByField` still `"score"`, model description still accurate per contracts/trending-score.md). Read only; no change expected. *Holds. Note: the API returns `doc.data()` raw, so `trend`, `trendBase` and `trendAt` will appear in its JSON after the first run. They are harmless (publicly readable from Firestore anyway), and recorded in the contract.*
- [X] T026 Reconcile documents: tick tasks here, and check that spec/plan/research/data-model still describe the code as built (CLAUDE.md "harvest after every push"). In particular, if T016 found that cached builds lack `id`, record it where it surprised you.
- [ ] T027 [Deferred, ≥ a few weeks after T023] Delete `updateBuildScore` (its export in `functions/index.js`; `firebase deploy` asks to delete the function) and the `TRENDING_SOURCE` switch, including the "legacy" branch in `updateBuildTrend.js` (quickstart §5).

---

## Dependencies & execution order

```
T001 (Java) ─┐
T002 ────────┴─► Phase 2: T003 → T004 → T005 → T006 (owner, can ship alone)
                                   │
                                   ▼
               Phase 3 (US1): T007 → T008 → T009 → T010 → T011 → T012
               Phase 4 (US2): T013 → T014 ; T015 → T016 → T017      (independent of US1 code)
                                   │
                                   ▼
                          T024 (owner): release US1 + US2, client then rules
Phase 5 (US3): T018 → T019 ; T020 → T021 → T022 ──► T023 shadow (any time)
                                                    └─► T023 switch (only after T024 + ≥ 7 days)
Polish: T025 any time; T026 after each push; T027 deferred
```

- US2's code does not depend on US1's. **Shipping** does: they release together (T024).
- US3's code and its *shadow* deploy can start at any time, even before T024, because shadow mode
  writes only the `trend*` fields, which no reader uses. Only the **switch** waits for T024.
- `firestore.rules` is edited by T004, T008 and T009 in sequence; `buildService.js` by T010 then T015;
  `BuildDetails.vue` by T011 then T016.

## Parallel opportunities

- T013 (`viewMemory.js`) and T018 (`trend.js`) are new, import-free files with no dependencies, so
  they can be written alongside Phase 3.
- T007's test cases and T010 (`buildService.js`) touch different files.
- Per the owner's preference, subagents (if used at all) run **one at a time**, not fanned out.

## Implementation strategy

1. **Hotfix first** (Phase 2). Small, and closes the worst hole on its own.
2. **MVP = US1 + US2**, released together (T024). That ends reload-spam and arbitrary values, and
   brings an honest view count from release day on.
3. **US3 shadow** can run right after, or even before; switch once US1 + US2 are live and the
   comparison week looks right.
4. Then decide on server-side counting (plan, follow-up) from what the numbers show.
