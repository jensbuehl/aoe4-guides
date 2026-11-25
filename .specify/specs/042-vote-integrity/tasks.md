# Tasks: Vote Integrity

**Input**: Design documents from `.specify/specs/042-vote-integrity/`
**Prerequisites**: plan.md, spec.md (Clarifications 2026-11-24), research.md (R1–R11), data-model.md,
contracts/firestore-rules.md, contracts/client-writes.md, quickstart.md

**Tests**: The spec requires the rules tests (FR-013): every allowed and refused case in
`contracts/firestore-rules.md`, written first and shown to fail against the deployed rules. Pure
functions (`applyListConfig`, `nextTrend`) are checked with throwaway Node harnesses at the repo root,
deleted after use (CLAUDE.md). Everything visual is checked in a browser (quickstart §5, `ux-gate`).

**Deploys are outward-facing.** Every task that deploys rules or functions, pushes to `main`, or reads
production is marked **(owner)**: run or explicitly approved by the owner, never as a side effect of
another task. Nothing is committed unless asked.

**Timing gate**: the rules deploy (T019) waits for check run 2 (T007), which waits ≥ 7 days after run 1
(T006). Run 1 should therefore happen first — everything else can be built during the wait.

## Phase 1: Setup

- [X] T001 **(owner)** Make a Java runtime available for the Firestore emulator (project memory "Rules test needs Java": portable Temurin JRE, Git Bash PATH in `/c/` form, `functions/index.js` needs `resend` installed locally). Confirm `npm run test:rules` passes on the current `firestore.rules` before any change. *(2026-11-24: portable Temurin 21 JRE in the scratchpad, on PATH for the test command only; 43/43 passed on the old rules.)*
- [X] T002 [P] Add `writeBatch` to the `firebase/firestore` import and the export list in `src/firebase/index.js`; export `writeWithTokenRetry` from `src/composables/data/collectionService.js` (named export beside `collectionService`; its doc comment stays).

---

## Phase 2: Foundational — the one write that changes a like or upvote

**Purpose**: US2 (rules) can only deploy once the app sends this write, and US3 builds its behaviour on it.

- [X] T003 Create `src/composables/data/reactionService.js` exporting `setReaction({ uid, buildId, list, on, currentCount })` exactly as `contracts/client-writes.md`: `list` is `"favorites"` (counter `likes`) or `"upvotes"`; step `+1` when `on`, `−1` when off and `currentCount > 0`, no build write when off and `currentCount <= 0`; a fresh `writeBatch(db)` built inside the `writeWithTokenRetry` callback (a batch commits once); `batch.set(favorites/uid, { [list]: arrayUnion|arrayRemove(buildId), lastChange: { list, buildId } }, { merge: true })`. Throws on failure. Throws `Object.assign(new Error("offline"), { code: "offline" })` without writing when `navigator.onLine === false`. JSDoc explains why the two documents are written together (research R1) and why `lastChange` exists (R2).

**Checkpoint**: nothing calls it yet; `npm run build` is green.

---

## Phase 3: User Story 1 — Find out whether repeated liking has already happened (P1) 🎯 first

**Goal**: A read-only check whose second run lists every build whose like/upvote gap *grew*.

**Independent test**: two runs some days apart change nothing, and the second lists growing gaps or says none.

- [X] T004 [US1] Create `scripts/check-vote-gaps.mjs` (research R10, data-model "Check snapshot"). Imports only `node:` builtins and `firebase-admin` — nothing from `src/`. Prints the project from `GOOGLE_APPLICATION_CREDENTIALS` first and exits if unknown. Reads `builds` with `select("title", "likes", "upvotes", "isDraft")` and `favorites` with `select("favorites", "upvotes")`; counts, per build, the accounts whose list contains it (dedupe each list with a `Set` first). Writes `scripts/.scratch/vote-gaps/<ISO timestamp>.json` (`mkdirSync` recursive). Finds the latest earlier snapshot in that folder and, if there is one, prints: **growing gaps** (gap = count − holders; growth = now − before, before = 0 for a build new since; growth > 0, sorted descending, per counter, with id, title, counts, holders); **drift** (growth < 0) separately; **non-finite counts** separately; builds deleted since are skipped. Always prints the list-length distribution (buckets 0, 1–5, 6–10, 11–20, 21–25, 26–29, 30, 31+; median/p90/p99/max) for `favorites` and `upvotes` (FR-022). Never prints or stores an account id. Header comment: what it reads, what it costs (~9.5k reads), how to run (quickstart §1), and that it writes nothing to Firestore.
- [X] T005 [US1] Verify T004 is read-only: `grep -nE "\.(set|update|delete|create|add|commit)\(|batch\(" scripts/check-vote-gaps.mjs` finds no Firestore write; `node --check scripts/check-vote-gaps.mjs`. Delete `scripts/.scratch/fav-lengths.mjs` (superseded).
- [X] T006 [US1] **(owner)** Run 1 (baseline) against production, quickstart §1. Record the date and the summary line in this task. *(Run 1: 2026-11-24 12:29 UTC — 5,426 builds, 5,099 list documents; 192 builds with a like gap, net −14; no non-finite counts. The comparison path was tested twice: a rerun a minute later showed no growth or drift; a planted earlier snapshot was reported as +28, as spec scenario 2 expects. Run 2 is due on or after 2026-12-01.)*
- [ ] T007 [US1] **(owner)** Run 2, ≥ 7 days after T006 and before T019. Record growing builds (or "none") and the owner's decision for each in `spec.md` under Clarifications (SC-001). If any build grew, decide repair before deploying rules (repair itself is out of scope).

**Checkpoint**: "has anyone done this already?" is answered.

---

## Phase 4: User Story 2 — One account counts once (P1)

**Goal**: The database accepts a like or upvote step only together with the caller's own list change, and freezes downvotes.

**Independent test**: `npm run test:rules` — V1–V8 succeed, X1–X17 are refused; X1–X13, X15 and X17 were allowed by the deployed rules.

### Tests first (FR-013)

- [X] T008 [US2] Create `tests/rules/votes.rules.test.mjs`, same harness as `tests/rules/builds.rules.test.mjs` (`RULES_FILE` env, `demo-aoe4-guides`, nothing from `src/`). Seed `builds/b1` (`likes: 3, upvotes: 5, downvotes: 1`), `builds/b0` (`likes: 0`), `builds/b2`; contexts `alice` = `authenticatedContext("alice", { email_verified: true })`, `una` = `authenticatedContext("una", { email_verified: false })`, `bob`, `anon`. Seed list documents per case via `withSecurityRulesDisabled`. One `it` per case V1–V8 and X1–X17 from `contracts/firestore-rules.md`, ids in the test names; batches built with `writeBatch` exactly as the client contract writes them.
- [X] T009 [US2] Run T008 against the deployed rules: `git show main:firestore.rules > <scratchpad>/deployed.rules`, then `RULES_FILE=<that file> npm run test:rules` (the env var passes through `emulators:exec`; `builds.rules.test.mjs` already reads it). Confirm X1–X5, X7–X13, X15 and X17 **fail** there (the writes go through) — that is what shows each case covers the hole. Note the result in this task. *(Against the deployed rules X1–X5, X7–X13, X15 and X17 FAILED — every one a real hole; X6, X14, X16 were already refused; every V case already passes there, confirming the app can ship before the rules.)*

### Implementation

- [X] T010 [US2] In `firestore.rules`, `builds/{build}` counter branch: replace the `likes`/`upvotes`/`downvotes` alternatives with a `listStep(list, counter)` function per the contract — `+1` needs `request.auth.token.email_verified == true`, the build absent from `get()` of the caller's favourites doc (or the doc absent) and present in `getAfter()`; `−1` needs the reverse and `request.resource.data[counter] >= 0`. Remove `downvotes` from the steppable keys (any change refused). Keep `views` and `comments` exactly as 040 left them. Comment explains the two-sided binding (research R1) and why bare steps are refused.
- [X] T011 [US2] In `firestore.rules`, replace `match /favorites/{userId}`'s single `allow read, write` with: `allow read` for the owner; `allow create, update` for the owner when changed keys ⊆ `[favorites, upvotes, lastChange]`, at most one list changed, and a changed list `L` equals `before ∪ {lastChange.buildId}` (add) or `before ∖ {id}` (remove) **as sets**, with `lastChange.list == L` and the matching build step via `get`/`getAfter` (add: `+1` and `email_verified`; remove: `−1`, or no step when `!exists(build)` or the count is ≤ 0); no `delete`. `before` on a create is `[]`. Comment: why `lastChange` (R2), why sets not sizes (legacy duplicates), why no delete (account cleanup is Admin SDK).
- [X] T012 [US2] Update `tests/rules/builds.rules.test.mjs` cases A2, A3 and A8 per "040 cases this changes" in `contracts/firestore-rules.md`, and add a header line pointing to the 042 contract for likes/upvotes/downvotes.
- [X] T013 [US2] Run `npm run test:rules`: every case in both files passes. *(72/72 after T032. Found on the way: `node --test` runs files in parallel against one emulator, so one file's `clearFirestore` wiped the other's seed — `test:rules` now passes `--test-concurrency=1`, and CLAUDE.md says why.)*
- [X] T014 [US2] `src/components/Favorite.vue`: replace `incrementLikes` + `addFavorite` and `decrementLikes` + `removeFavorite` with one `setReaction({ list: "favorites", ... })` each; add a `pending` ref that ignores taps while a write is out (FR-017); accept a `count` prop for `currentCount`.
- [X] T015 [US2] `src/components/Vote.vue`: thumbs-up only — remove both thumbs-down buttons, `downVote`, `handleAddVoteDown`, `handleRemoveVoteDown`, `removeDownVote` and the `mdi-thumb-down*` icons; up/un-up via one `setReaction({ list: "upvotes", ... })` with the same `pending` guard and `count` prop.
- [X] T016 [P] [US2] Remove the now-unused helpers listed under "Removed" in `contracts/client-writes.md` from `src/composables/data/buildService.js` and `src/composables/data/favoriteService.js`; `grep -rn` for each name in `src` returns nothing. Keep `getUserFavorites` and `createUserFavorites`.
- [X] T017 [US2] `npm run build` and `npm run check:setup`; run the icon check from CLAUDE.md (prints only `mdi-svg` and `mdi-xxx`; `mdi-thumb-down*` may stay in `src/plugins/mdiIcons.js` or be removed there too — remove them if nothing else uses them). *(`mdi-thumb-down` and `-outline` removed from the allowlist; the comm check prints only `mdi-svg` and `mdi-xxx`.)*
- [ ] T018 [US2] **(owner)** Ship the app (push to `main`; Netlify deploys). Safe before the rules: the current rules accept the batched write (research R11).
- [ ] T019 [US2] **(owner)** After T007, T013 and T018: `firebase deploy --only firestore:rules --project aoe4-guides`. Then in production as a verified account: like/unlike once; in the browser console a bare `updateDoc(build, { likes: increment(1) })` is refused.

**Checkpoint**: one account counts once; downvotes cannot change.

---

## Phase 5: User Story 3 — The heart and the vote buttons tell the truth (P2)

**Goal**: A failed like or upvote never shows as done; both mounted copies of each button agree.

**Independent test**: offline or refused like → heart reverts with a message; after reload count and list agree; mobile and desktop rows always show the same state.

- [X] T020 [US3] `src/components/Favorite.vue`: derive `isFavorite` from `props.modelValue.favorites` (computed), not a ref set on mount (research R7); while `pending`, the button shows Vuetify's `loading` state at once (SC-005's immediate feedback) and the heart does not change until the write is acknowledged (FR-016: never shows an unrecorded like); on success update `modelValue.favorites` in place (push / splice) and emit `favoriteAdded`/`favoriteRemoved`; on failure leave the list untouched and show a snackbar — "You're offline — try again when you're back." for `code === "offline"`, "That didn't go through. Please reload and try again." otherwise.
- [X] T021 [US3] `src/components/Vote.vue`: the same for `upVote` from `props.modelValue.upvotes`, with `voteUpAdded`/`voteUpRemoved` emitted only on success.
- [X] T022 [US3] `src/views/builds/BuildDetails.vue`: on both `Favorite` instances (lines ~57 and ~212) add `:count="build.likes"` and `@favoriteAdded="build.likes++"`, `@favoriteRemoved="build.likes--"`; on both `Vote` instances add `:count="build.upvotes"` (the up/down handlers there stay).
- [X] T023 [US3] `npm run build`, `npm run check:setup`, then browser checks per quickstart §5 with the `ux-gate` rig (phone UA at 393 px and desktop 1280 px): like/unlike moves the count by one; both layouts agree after a like (resize across `md`); offline tap leaves the heart as it was, with the message; rapid double tap sends one write (DevTools network). Refusal path (after T019, or with the app pointed at the emulator): open the build in two tabs, like it in tab A, then like it in stale tab B — the write is refused (case X2), B's heart stays empty and shows the message, and after reload both agree. Say plainly what was not verified. *(ux-gate rig on the dev server with a stand-in user and stubbed data modules, so no read or write reached Firestore: 87/87 checks at 393 Android and 1280, light and dark — fallback shows 2 icons; one heart and one thumb; no thumbs-down; loading at once and the icon unchanged until acknowledged; double tap = one write; both mounted copies agree, also across a 1280→800 resize; refused and offline keep the state and show the message; unverified cannot add but can take back. NOT verified: a real write from a browser against Firestore (the rules tests send the exact batch), the two-tab refusal against live rules (needs T019), iOS Safari, a real device.)*

**Checkpoint**: US2 + US3 = the complete integrity change for players.

---

## Phase 6: User Story 4 — Favourite as many builds as you like (P2)

**Goal**: No cap; My Favorites loads by id and filters, sorts, counts and pages in memory exactly like the other lists.

**Independent test**: an account with > 30 favourites (dev project) reaches all of them, filters by two seasons and two maps, every sort matches the Builds list.

- [X] T024 [P] [US4] Create `src/composables/data/applyListConfig.js`: pure `applyListConfig(builds, config)` per research R8 — filters `isDraft === !!config.drafts`, `creatorId`, `authorUid`, `civ`, `season ∈`, `map ∈`, `strategy ∈` (empty = no filter); excludes builds lacking `config.orderBy`; sorts by it descending (`sortTitle` ascending), `null` lowest, Timestamps by `toMillis()`, ties by `id` in the same direction. No Vue, no Firestore imports.
- [X] T025 [US4] Throwaway harness at the repo root (CLAUDE.md alias loader) comparing `applyListConfig` over all builds of the **dev** project with the equivalent Firestore query from `getQueryParametersFromConfig` for: default config, each sort option in `FilterConfig.vue`'s `sortOptions`, two seasons + two maps, a civ, a creator. Order and membership must match. Delete harness and loader afterwards. *(Against PRODUCTION, read-only (no dev key): all 10 configs match Firestore result for result after one fix — builds with no `isDraft` field exist, and Firestore's `isDraft == false` excludes them; `applyListConfig` now matches strictly.)*
- [X] T026 [US4] `src/composables/data/buildService.js`: add `getBuildsByIds(ids)` — dedupe, chunk 30, `where("id", "in", chunk)` queries in parallel through `getAll`, resolve to the flattened array via `cacheBuilds`, or `undefined` if any chunk failed; remove `getUserFavoritesCount`, `getUserFavorites`, `getUserFavoritesFrom`, `getUserFavoritesUntil`. `src/composables/data/queryParameterBuilder.js`: remove the `favorites` parameter and its `in` filter from `getQueryParametersFromConfig`/`getFilterQueryParams` and every caller.
- [X] T027 [US4] `src/views/builds/MyFavorites.vue`: `initData` loads the list document, then `getBuildsByIds(favorites)` (or the cached full array); keep the full array in `store.state.cache.myFavoritesList`; `filtered = applyListConfig(all, filterConfig)`; results count = `filtered.length`; pages are slices of `paginationConfig.limit`; `nextPage`/`previousPage` move the slice without reading. Filter/sort changes (the watches at ~91–122) recompute from the loaded array and do not reload (FR-021); a changed favourites list (heart elsewhere) still resets the cache as today. Keep the `unreadable` and `none` empty states. Ids whose build no longer exists simply come back missing from the `in` queries and are skipped without a message (FR-020); a list made only of such ids shows the `none` state's sibling "no results" rather than `unreadable`.
- [X] T028 [US4] `src/components/Favorite.vue`: remove `maxFavs`, the favourites read before adding, and the "Villagers can only gather up to 30 favorites" snackbar. `src/components/notifications/NoFilterResults.vue`: update the comment that mentions "thirty favorites".
- [X] T029 [US4] `npm run build`, `npm run check:setup`; browser on the dev project with an account holding > 30 favourites (seed via the app): all reachable, two seasons + two maps filter works, each sort matches `/builds` with the same filter, count is right, unlisted favourites hidden. Then on production, one of the 5 accounts above 30 can now load (owner may confirm with any such account they control; otherwise state it as unverified). *(Dev has only 27 published builds, so this ran with 27 + one deleted id rather than 31+: count 27, deleted id skipped, 10 per page, paging and filter changes made zero Firestore requests, two seasons × two maps worked. The 31+ path is the same code with a second chunk; not verified on a real account above 30.)*

**Checkpoint**: the cap is gone everywhere; nothing in the rules counts list length.

---

## Phase 7: User Story 5 — A like counts for what it is (P3)

**Goal**: Weights 1 / 25 / 100 / 0 in both scores, and the switch registers as no activity.

**Independent test**: `nextTrend` fixtures — first run under version 2 adds nothing; afterwards a like adds 100, an upvote 25, a downvote 0.

- [X] T030 [US5] `functions/builds/trend.js`: add `WEIGHTS = { views: 1, upvotes: 25, likes: 100 }` and `WEIGHTS_VERSION = 2` with a comment carrying the 2026-11-24 measurements and the two rules that set them (spec Clarifications); `activityTotal` uses `WEIGHTS` and ignores `downvotes`; `nextTrend` returns a new kind **rebased** when `(build.trendWeights ?? 1) !== WEIGHTS_VERSION` and the build is not being seeded: trend decayed as usual, no delta, floor applied, `trendBase = total`; every non-`unchanged` result carries `trendWeights: WEIGHTS_VERSION`. Export both constants. Update the file header.
- [X] T031 [US5] `functions/builds/updateBuildTrend.js`: add `trendWeights` to `select`; write it with `trend`/`trendBase`/`trendAt`; add `rebased` to `counts`. Check `functions/builds/updateBuildScore.js` (legacy, inert under `"recency"`) still compiles against the changed `activityTotal`.
- [X] T032 [P] [US5] Add `trendWeights` to `serverOwned()` and to the create-time `hasAny([...])` list in `firestore.rules`, and to `NON_EDITABLE_FIELDS` in `src/composables/data/buildService.js` (the comment there names the rules as its mirror). Add cases to `contracts/firestore-rules.md` and `tests/rules/builds.rules.test.mjs`: author edit setting `trendWeights` → refused; create carrying `trendWeights` → refused. Run them against the deployed rules first (they must fail there), then `npm run test:rules`.
- [X] T033 [US5] Throwaway harness at the repo root requiring `functions/builds/trend.js`: a version-1 build (no `trendWeights`, 80 likes, trend 40) → `rebased`, trend = 40 decayed, base = new total; then +1 like → `updated`, trend rises by 100; +1 upvote → 25; +1 downvote → 0; a draft → `held`; a new build → `seeded` with `trendWeights: 2`. Delete afterwards. *(10/10 fixture checks. Plus a read-only dry run over all 5,426 production builds: 4,441 rebased, 983 held, 2 seeded, no trend rises on the switch, and the Trending top 8 is identical — SC-007 holds on real data.)*
- [ ] T034 [US5] **(owner)** Deploy rules (if T032 landed after T019) and functions: `npm run deploy` from `functions/`. Force-run `updateBuildAllTimeScore`, then `updateHomeSnapshot`, from Cloud Scheduler (040 quickstart §4 routine).
- [ ] T035 [US5] **(owner)** After the next 23:30 UTC run: the `updateBuildTrend: done` log shows `rebased` ≈ build count and no build's `trend` rose that day by more than its genuine activity (compare the `comparison` log's top 8 with the previous day's) — SC-007.

**Checkpoint**: all five stories delivered.

---

## Phase 8: Polish & Cross-Cutting

- [X] T036 [P] `.specify/specs/040-fair-trending/contracts/firestore-rules.md`: mark the likes/upvotes/downvotes rows and cases A2/A3/A8 as superseded by the 042 contract, with a link. CLAUDE.md's `test:rules` paragraph names only the 040 contract — add the 042 one.
- [X] T037 [P] Delete `scripts/.scratch/weights.mjs`, `copies.mjs`, `remixes.mjs` only after spec 044 is planned (its numbers come from `remixes.mjs`); until then leave them.
  - *Done* 2026-11-25, after 044 shipped in 1.29.0. `vote-gaps/` stays: T038 compares against its last snapshot.
- [ ] T038 **(owner)** Check run 3, some days after T019 (quickstart §1): no growing gap (SC-003).
- [ ] T039 **(owner, optional)** Announce unlimited favourites in the Home news card (one small card, project convention) — the owner decides whether it is worth a card.
- [ ] T040 Harvest per CLAUDE.md after the push: what surprised (e.g. the two mounted button copies, the `in`/disjunction limits, `lastChange` as a declared-then-proved key) goes to a code comment or memory; reconcile this spec/plan with what shipped.

---

## Dependencies & Execution Order

- **T006 (baseline run) first, today** — it starts the 7-day clock. It needs only T004–T005.
- **Phase 1–2** before US2/US3.
- **US1** (T004–T007) is independent of all code; T007 gates T019 only.
- **US2**: T008–T009 (tests first) → T010–T011 → T012–T013; T014–T017 need T003; T018 before T019.
- **US3** needs T014/T015 (same files); can ship with T018.
- **US4** is independent of US2/US3 except T028 touching `Favorite.vue` (do after T020).
- **US5** is independent of the client; deploy (T034) after T019 so the weights reward a protected signal.
- Polish last.

### Parallel opportunities

- T002 ∥ T004 (different files).
- T008 ∥ T014–T016 (tests vs. client code).
- T024 ∥ anything in US2/US3 (new pure module).
- T030–T033 ∥ US4.
- T036 ∥ T037.

### Parallel example: User Story 4

```text
T024 applyListConfig.js        ┐
T026 buildService/queryParams  ┘ then T025 harness, then T027 MyFavorites, then T028–T029
```

## Implementation Strategy

1. **Today**: T004–T006 — the check and its baseline. Nothing else is time-critical.
2. **During the wait**: Phase 1–2, US2 tests and rules (not deployed), US2/US3 client, US4. Ship the app (T018) when green — it improves honesty and My Favorites without depending on the rules.
3. **After run 2 (T007)**: deploy rules (T019).
4. **Then**: US5 weights (T034–T035).
5. **Finally**: run 3 (T038), polish, harvest.

**MVP**: US1 + US2 + US3 — the integrity fix with an answer to "has it already happened?". US4 and US5
are independent increments.

## Notes

- `[P]` = different files, no dependency on an unfinished task.
- Every `.vue` change: `npm run check:setup` (a green build cannot catch a `setup()` ReferenceError).
- Agents, if used, run one at a time (project feedback memory).
