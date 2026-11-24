# Tasks: Map Types and Strategy Guidance

**Input**: Design documents from `.specify/specs/045-map-types-strategy-guidance/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/firestore-rules.md, quickstart.md

**Tests**: Rules tests are required (SC-003, CLAUDE.md "add the case first"). Normaliser checks use a
throwaway harness that is not committed. There is no unit suite in this project.

**Commits**: Never commit or push unless the owner asks. The main worktree is shared with parallel
sessions (042, 046, 047): do not switch branches over their untracked work.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Create branch `045-map-types-strategy-guidance` from up-to-date `main` in a **separate worktree** (e.g. `../aoe4-guides-045`), following the 043 pattern. The main worktree is on `042-vote-integrity` with other sessions' uncommitted work. In the new worktree: copy `.env`, junction `node_modules` (see the "Worktree needs .env" memory), copy `.specify/specs/045-map-types-strategy-guidance/` across, and point that worktree's `.specify/feature.json` at it.
- [X] T002 Save the deployed rules for the test-first check in T016: `git show main:firestore.rules > <scratchpad>/rules-deployed.rules`, before any rules edit.

---

## Phase 2: Foundational (blocks every story)

**Purpose**: the single source of allowed values and the normalisers (FR-007, FR-008, research R1/R2).

- [X] T003 [P] Rewrite `src/composables/filter/mapDefaultProvider.js`:
  - the list becomes `Land`, `Water`, `Hybrid`;
  - export `MAP_TYPES` (plain array of titles), `DEFAULT_MAP = "Land"`, and `normaliseMap(value)`, which trims and case-folds: water → `Water`, hybrid → `Hybrid`, everything else (including `""`, `null`, `undefined`, `"Arabia"`, `"Open"`, `"Closed"`) → `Land`;
  - keep the exported `maps` ref, built from `MAP_TYPES`;
  - add a header comment saying the list is mirrored in `allowedFacets()` in `firestore.rules`, and that both change together.
- [X] T004 [P] Extend `src/composables/filter/strategyDefaultProvider.js`:
  - give each option a `subtitle` with the wording in data-model.md;
  - export `STRATEGY_TITLES` (plain array) and `normaliseStrategy(value)`: `null`/`undefined` → `""`; trim and case-fold; an exact option match → the option; otherwise check option names longest first, and if exactly one is contained → that option; else `""`;
  - add the same mirror comment as T003;
  - normalisers must not touch the `ref`, so Node scripts can import them.
- [X] T005 Verify T003/T004 with a throwaway harness at the repo root (alias loader from CLAUDE.md, run with `--experimental-loader`) against the table in `quickstart.md` §1. Also run every distinct `strategy` and `map` value in `data/seo-snapshot.ndjson` through it and confirm the result matches research R2's table. Delete the harness and loader afterwards.

**Checkpoint**: allowed values and normalisers exist; nothing uses them yet.

---

## Phase 3: User Story 1 - Find builds for the kind of map I play (P1)

**Goal**: map is Land / Water / Hybrid in the editor and filter, and is shown only when not Land.

**Independent Test**: The editor offers 3 maps with Land preselected and no clear button. The filter
(select and phone sheet chips) offers 3 maps. A Land build's card and details page show no map; a
Water build shows "Water".

- [X] T006 [US1] In `src/views/builds/BuildEditor.vue`:
  - the map `v-select` (around lines 243–258): remove `clearable`, bind `:model-value="build.map"` and `@update:model-value="(value) => (build.map = value)"`;
  - the new-build default (around line 472): `map: DEFAULT_MAP`, imported from `mapDefaultProvider`;
  - narrow the comment above the selects so the `|| null` explanation refers to strategy only;
  - *(As built: the selects bind the normalised value for display only; see research R5.)* Do **not** normalise values when a build loads: `map`/`strategy` are `DRAFT_FIELDS` in `useEditorDraft`, so a load-time rewrite would register as an edit (research R5). The save path (T019) covers it.
- [X] T007 [P] [US1] In `src/components/builds/BuildListCard.vue` (`showMap`, around line 337), add the condition `props.build?.map !== DEFAULT_MAP` and update the comment above it to cite spec 045 FR-004.
- [X] T008 [P] [US1] In `src/components/builds/BuildMetaLines.vue` (lines 69–71 and `hasStats` around line 119), show the map only when `build.map && build.map !== DEFAULT_MAP`, via a `showMapLabel` computed used in all three places. This also covers the details page, through `BuildHeader`.
- [X] T009 [P] [US1] Amend `.specify/specs/020-age-up-timeline-strip/spec.md` FR-022 with a one-line note: "Amended by 045 FR-004: Land is never shown."

**Checkpoint**: US1 works in the browser for new and cleaned builds. The filter's 3 options (select and sheet chips) come from T003.

---

## Phase 4: User Story 2 - Choose a strategy without knowing the jargon (P1)

**Goal**: every strategy option shows its one-line explanation wherever it is offered (FR-006).

**Independent Test**: The editor's and desktop filter's strategy selects show a subtitle under each of
the six options. The phone sheet has a "What do these mean?" toggle under the Strategy chips that
reveals the same six lines. Strategy can still be cleared, and Publish with no strategy shows no prompt.

- [X] T010 [US2] *(Built with T006, same block. The shared `strategyItemProps` / `STRATEGY_MENU_PROPS` replaced the inline item-props after T027 measured truncation and a 620px menu; see research R5.)* In `src/views/builds/BuildEditor.vue` (after T006, same file), add `:item-props="(item) => ({ subtitle: item.subtitle })"` to the strategy `v-select` (around lines 262–270). Keep it `clearable`. Check that the menu stays readable at 360 px, where subtitles must wrap, not overflow.
- [X] T011 [US2] In `src/components/filter/FilterConfig.vue`, add the same `item-props` to the strategy `v-autocomplete` (around lines 327–340). Leave the map autocomplete unchanged: it already reads `maps`.
- [X] T012 [US2] *(As built: a link-style native button, not a v-btn, so its text starts on the chips' edge without a negative margin; research R5.)* In `src/components/filter/FilterConfig.vue` (after T011, same file), the phone bottom sheet (`chipFacets` loop, around lines 188–212), under the **Strategy** chip group only:
  - add a `variant="text"`, `size="small"` button "What do these mean?";
  - it toggles a compact list of `Title: subtitle` lines, read from `strategies` (no copied text);
  - collapsed by default, with `aria-expanded` on the button;
  - give the facet entry a flag (e.g. `explain: true` on the strategy facet) rather than special-casing the field name in the template.
- [X] T013 [US2] Confirm that no Publish path checks strategy (`BuildEditor.vue` publish handler, `BuildDetails.vue:759`). FR-016 is a no-change requirement; just record the check in the task note.

**Checkpoint**: US2 is complete on its own.

---

## Phase 5: User Story 3 - Every stored value is one the app offers (P1)

**Goal**: normalise on every write and on import, clean the existing data, and enforce in rules.

**Independent Test**: An overlay import with `map: "Arabia"`, `strategy: "Aggression"` shows and saves
Land with no strategy. A console write of `strategy: "Aggression"` is refused. A second dry run of the
cleanup reports 0 changes.

### Rules tests first

- [X] T014 [US3] Create `tests/rules/facets.rules.test.mjs` covering F1–F14 from `contracts/firestore-rules.md`, in the style of `tests/rules/builds.rules.test.mjs` (same emulator setup, imports nothing from `src/`). For F14, reuse the batched like pattern from `tests/rules/votes.rules.test.mjs`.
- [X] T015 [US3] Run `RULES_FILE=<scratchpad>/rules-deployed.rules npm run test:rules` and confirm F1–F8 **fail** there (see the "Rules test needs Java" memory for the JRE path).
- [X] T016 [US3] In `firestore.rules`, inside `match /builds/{build}`, add `allowedFacets()` exactly as research R6 has it, with a comment mirroring T003/T004 ("transcribed, rules cannot import: change both"). AND it into `allow create` and the **author's** `allow update` only, not the counter branch. Rebase on whatever 042 has merged into `firestore.rules` first.
- [X] T017 [US3] Run `npm run test:rules`. All of F1–F14 and every existing 040/042 case must pass.

### Write paths

- [X] T018 [P] [US3] In `src/composables/converter/useImportOverlayFormat.js` (lines 23–24), use `map: normaliseMap(build.map)` and `strategy: normaliseStrategy(build.strategy)`.
- [X] T019 [US3] In `src/composables/data/buildService.js`, add `withFacets(build)` next to `withAgeTimings()`. It sets `build.map = normaliseMap(build.map)` and `build.strategy = normaliseStrategy(build.strategy)`, with a doc comment in the style of `withAgeTimings`. Call it in `addBuild` (next to `withAgeTimings(build)`) and in `updateBuild` (`saveable(withFacets(withAgeTimings(build)))`).
- [X] T020 [P] [US3] In `src/components/builds/BuildImportDialog.vue` (line 193, the preview summary), show `normaliseStrategy(obj.strategy) || null`, so the preview matches what will be saved.

### Cleanup

- [X] T021 [US3] Create `scripts/backfill-map-strategy.mjs`, modelled on `scripts/backfill-age-timings.mjs`:
  - same header (purpose, esbuild bundle line, credentials, dry-run default), project print and refusal when the project is unknown, pages of 500, batches of 500;
  - for each doc, compute `normaliseMap`/`normaliseStrategy`;
  - update **only** docs where either changes, writing **only** `{ map, strategy }` (FR-013);
  - the dry run prints an old → new table with counts, split by published vs draft (`isDraft`), plus totals (expect about 4,244 published map changes and 206 strategy changes, per the snapshot).
- [X] T022 [US3] *(Superseded 2026-11-24: no dev key was available, so the dry run went straight to production, read-only, and the owner reviewed that table before anything was written; see T029.)* **Originally: needs a dev service-account key** (`GOOGLE_APPLICATION_CREDENTIALS`), which this session does not have. The bundle builds and runs up to credentials (verified 2026-11-24). Bundle (`npx esbuild scripts/backfill-map-strategy.mjs --bundle --platform=node --external:firebase-admin --alias:@=./src --outfile=scripts/.build/map-strategy.cjs`) and dry-run against **dev**. Check that the table matches research R2, then `--apply` on dev and re-run: 0 changes.

**Checkpoint**: on dev, all three stories pass quickstart §2–§4.

---

## Phase 6: Filter integrity — the 30-combination guard (FR-017, research R10)

**Goal**: the filter never applies a selection the database would refuse.

**Independent Test**: 3 seasons × 2 maps × 6 strategies disables Apply with the reason, with no
console error. Dropping one strategy re-enables it.

- [X] T023 Reproduce on dev, before any code: apply 3 seasons × 2 maps × 6 strategies, and note exactly what a user sees today (error, empty list or stuck loader) in research R10.
- [X] T024 [P] In `src/composables/data/queryParameterBuilder.js`, export `MAX_DISJUNCTIONS = 30` and `disjunctionCount(config)`: the product of the lengths of `seasons`, `maps` and `strategies`, each counted as 1 when empty or missing. Add a comment citing the Firestore limit and FR-017.
- [X] T025 In `src/components/filter/FilterConfig.vue` (after T012, same file), add a `tooManyCombinations` computed (`disjunctionCount(draft.value) > MAX_DISJUNCTIONS`) and:
  - pass `enabled: computed(() => isDirty.value && !tooManyCombinations.value)` to `useFilterCountPreview`;
  - return early from `handleApply` when it is true;
  - disable the sheet's Apply button and the card's apply bar;
  - show one line, "Too many combinations — remove a season, map or strategy.", in both places.

---

## Phase 7: Polish & Release

- [X] T026 Gates: `npm run build`, `npm run check:setup`, `npm run check:steps`. No new `mdi-*` icons are expected; if any were added, run the `mdiIcons` comm check from CLAUDE.md.
- [X] T027 Browser pass with the `ux-gate` rig: quickstart §4 (items 1–7) at 393 (Android UA) and 1280, light and dark. Pay attention to:
  - subtitle wrapping in both strategy menus;
  - the expanded explanation list still fitting the sheet;
  - card meta rows without a map;
  - the guard message.
- [X] T028 *(2026-11-24: 1.27.0, merged and pushed to main; CI green; the new filter code confirmed in production's bundle.)* Release step 1: the owner merges and deploys the app (one Netlify build).
- [X] T029 *(2026-11-24: prod dry run 5,314 of 5,430 builds, 13 typed-in strategies removed, approved by the owner. The write was done by a parallel session ahead of the rules deploy; the 045 session's own --apply then found 0 changes. Verified read-only: map Land 5,310 / Water 64 / Hybrid 56, every strategy allowed.)* Release step 2: prod cleanup. Show the owner the dry-run table, including every removed strategy; `--apply` only after their go-ahead; then a second dry run must report 0 changes (SC-001).
- [X] T030 *(2026-11-24, earlier than "a few days": deployed with 042's and 047's rules from main at 85d766b, after the cleanup had reached 0.)* Release step 3, a few days after T028: `npm run test:rules` passes, then `firebase deploy --only firestore:rules`, with the owner's go-ahead.
- [X] T031 *(Project memories record the release state and the hand-mirrored lists; research R5/R10 record what implementation found.)* Harvest (CLAUDE.md):
  - record in a project memory that strategy/map values are enforced by rules and mirrored by hand in two places;
  - note in tasks.md any task that turned out unnecessary;
  - reconcile research R10 with what T023 found. *(Done during implementation: R10 records the verified error and the silent empty list.)*

---

## Dependencies & Execution Order

- **Setup (T001–T002)** comes first.
- **Foundational (T003–T005)** blocks US1–US3. Phase 6 does not depend on it.
- **US1 (T006–T009)**, **US2 (T010–T013)** and **US3 (T014–T022)** are independent of each other.
- **Same-file chains**, each strictly sequential:
  - `BuildEditor.vue`: T006 → T010.
  - `FilterConfig.vue`: T011 → T012 → T025.
- **US3**:
  - T014 → T015 → T016 → T017 is strictly sequential (test first).
  - T018–T020 depend only on Foundational.
  - T021 → T022 depend on Foundational.
- **Phase 6**: T023 before T024/T025.
- **Release (T028 → T029 → T030)** is strictly ordered (research R8):
  - rules before the cleanup would refuse authors editing legacy builds;
  - rules before the app would refuse the old editor's empty map.

## Parallel Opportunities

- T003 ∥ T004 (different files).
- After Foundational: T007 ∥ T008 ∥ T009 ∥ T018 ∥ T020 ∥ T014 ∥ T024.
- The owner prefers one agent at a time (memory "Agents one at a time"). Parallel here means "order
  doesn't matter", not "fan out subagents".

## Implementation Strategy

- **MVP**: Foundational + US3's write paths (T018–T020) + US1. That fixes the misleading map filter
  and stops new junk.
- Then US2 and the guard (small, and both touch `FilterConfig.vue`).
- Then rules and the cleanup, which carry the release ordering.
- Everything ships in **one** app deploy (T028). Cleanup and rules are separate steps outside Netlify.
