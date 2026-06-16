# Tasks: AOE4World Sync Pipeline Improvement

**Input**: Design documents from `specs/016-aoe4world-sync-pipeline/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ quickstart.md ✅

**Target file**: `src/views/Admin.vue` (all changes are in this single file)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (independent logic, no intermediate dependency)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: No project init required — single-file modification to an existing Vue SFC. This phase sets up the static configuration that all stories depend on.

- [x] T001 Add `CATEGORY_CONFIG` constant inside `setup()` in `src/views/Admin.vue` — 12 entries with `key`, `filename`, `sourceKeys[]`, `exploreType`, and `data` reference (per data-model.md table); each entry replaces one of the existing `syncData(…); downloadObjectAsJSONFile(…)` call pairs

**Checkpoint**: CATEGORY_CONFIG correctly describes all 12 categories including the two combined-source cases (`landmarks` = buildings+technologies, `abilityHero` = abilities+technologies)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Reactive state and pure matching function that all three user stories build on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Add reactive state refs in `setup()` in `src/views/Admin.vue`: `syncPhase` (`'idle'|'fetching'|'preview'|'downloading'`), `fetchStatus` (object with `units/buildings/technologies/abilities` each `'idle'|'loading'|'success'|'error'`), `sourceData` (object with same keys, values `array|null`), `categoryResults` (`ref([])`)
- [x] T003 Replace `syncData(source, target, type)` with a pure `runMatchPass(sourceArray, localEntries)` function in `src/views/Admin.vue` — returns `{ matched: [], unmatched: [] }` where each `matched` entry is `{ local, source }` and `unmatched` is the local entry itself; matching logic unchanged (`source.id === local.id || source.name === local.title`); function does NOT mutate any array
- [x] T004 Add `canDownload` computed in `src/views/Admin.vue` — `true` when `syncPhase.value === 'preview'`, at least one non-errored category exists, and every non-errored category has zero entries in its `unmatched` array; expose in `return` object

**Checkpoint**: Foundation ready — `runMatchPass` can be called with sample data and returns correct matched/unmatched split; `canDownload` starts as `false`

---

## Phase 3: User Story 1 — Preview Sync Results (Priority: P1) 🎯 MVP

**Goal**: Admin clicks sync, sees per-source fetch progress chips, then sees a per-category preview with matched counts and unmatched entries listed.

**Independent Test**: Click "Sync Data with AOE4WORLD". Each of the 4 source chips updates from loading → ✓/✗ as fetches complete. Once all settle, a preview panel shows 12 category rows each with a matched count. Categories backed by a failed fetch show an error badge. No files are downloaded.

### Implementation for User Story 1

- [x] T005 [US1] Refactor `updateImageMetaData` into `startSync()` in `src/views/Admin.vue` — sets `syncPhase = 'fetching'`; fires all 4 fetches using individual `async/await` wrapped in `try/catch` (each updates `fetchStatus[source]` to `'loading'` before fetch and `'success'`/`'error'` after); after all 4 settle, builds `categoryResults.value` by calling `runMatchPass` per category (using `sourceData` entries; categories with a failed source get `errored: true`); transitions `syncPhase = 'preview'`
- [x] T006 [US1] Add fetch-progress UI section to the template in `src/views/Admin.vue` — rendered when `syncPhase === 'fetching'`; shows 4 rows (units, buildings, technologies, abilities) each with a `v-chip` whose color/icon reflects `fetchStatus[source]` (`loading` = grey spinner, `success` = green ✓, `error` = red ✗)
- [x] T007 [US1] Add preview panel UI to the template in `src/views/Admin.vue` — rendered when `syncPhase === 'preview'`; lists all 12 `categoryResults` rows showing: category `key`, matched count (`category.matched.length`), and an error `v-chip` if `category.errored`; for each `unmatched` entry shows the entry `title` as a placeholder row (resolution UI added in US2)

**Checkpoint**: Full US1 flow works end-to-end — fetch progress visible, preview panel appears, matched counts correct, errored categories flagged

---

## Phase 4: User Story 2 — Resolve Mismatches (Priority: P2)

**Goal**: For each unmatched entry in the preview, the admin can pick the correct AOE4World item via a search dropdown or skip it.

**Independent Test**: Temporarily rename a local entry's `title` to force a mismatch. After preview, that entry shows a `v-autocomplete` dropdown. Typing 2+ characters filters candidates by name. Selecting an item marks the entry resolved; clicking Skip marks it skipped. `canDownload` updates accordingly.

### Implementation for User Story 2

- [x] T008 [US2] Add `resolveEntry(categoryKey, localEntry, sourceEntry)` and `skipEntry(categoryKey, localEntry)` functions in `setup()` in `src/views/Admin.vue` — `resolveEntry` moves `localEntry` from the category's `unmatched` array to `resolved` as `{ local, source: sourceEntry }`; `skipEntry` moves it to `skipped`; expose both in `return` object
- [x] T009 [P] [US2] Replace the unmatched entry placeholder rows in the template in `src/views/Admin.vue` with a `v-autocomplete` component per entry — `:items` bound to the combined source array for that category's `sourceKeys` (from `sourceData`), `item-title="name"`, `:custom-filter` doing case-insensitive substring match requiring ≥ 2 chars typed; `@update:model-value` calls `resolveEntry`
- [ ] T010 [P] [US2] Add a "Skip" `v-btn` (variant="text") next to each `v-autocomplete` in `src/views/Admin.vue` that calls `skipEntry(category.key, entry)`; add a resolved/skipped summary chip per unmatched entry showing current state

**Checkpoint**: All mismatch resolution flows work — resolve via dropdown, skip via button, `canDownload` becomes `true` once all mismatches handled

---

## Phase 5: User Story 3 — Apply and Download (Priority: P3)

**Goal**: Once all mismatches are resolved or skipped, the admin clicks "Apply & Download" and the enriched JSON files are downloaded.

**Independent Test**: After resolving all mismatches in the preview, click "Apply & Download". Verify that browser downloads are triggered for every non-errored category. Open a downloaded file and confirm matched entries have `description`, `age`, `id`, `type`, `costs`, and `exploreUrl` populated; skipped entries retain original data unchanged. Errored categories are not downloaded.

### Implementation for User Story 3

- [ ] T011 [US3] Add `applyAndDownload()` function in `setup()` in `src/views/Admin.vue` — sets `syncPhase = 'downloading'`; iterates `categoryResults.value` filtering out `errored` categories; for each eligible category builds enriched JSON array: starts with deep clone of `localEntries`, applies `matched` and `resolved` enrichment (copies `description`, `age`, `id`, `type`, `costs`, `exploreUrl` using same field logic as old `syncData`; also copies `influences` if present), leaves `skipped` entries with original data; calls `downloadObjectAsJSONFile(enrichedArray, category.filename)` for each; after all downloads triggered sets `syncPhase = 'idle'`; expose in `return`
- [ ] T012 [US3] Add "Apply & Download" `v-btn` to the preview panel in `src/views/Admin.vue` — `:disabled="!canDownload"`, `@click="applyAndDownload()"`; add a brief "Downloading…" text shown when `syncPhase === 'downloading'`

**Checkpoint**: Complete happy path works — fetch → preview → resolve → download → idle; downloaded JSONs contain correct enriched data

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Remove dead code, validate the full flow manually.

- [ ] T013 Remove the now-unused old `updateImageMetaData`, `syncData`, and `sortByNameCompareFunction` function bodies from `src/views/Admin.vue`; clean up `return` object to only expose what the template uses
- [ ] T014 Manual golden-path test per `quickstart.md` in `specs/016-aoe4world-sync-pipeline/quickstart.md` — full sync cycle: fetch all 4 sources, verify 12 category rows in preview with correct matched counts, resolve or skip any real-world mismatches, click Apply & Download, verify downloaded JSON files open correctly and contain enriched data

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start here
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — first MVP deliverable
- **Phase 4 (US2)**: Depends on Phase 3 preview panel existing (T007 adds the placeholder rows that US2 replaces)
- **Phase 5 (US3)**: Depends on Phase 3 (preview + canDownload) and Phase 4 (resolution state used in applyAndDownload)
- **Phase 6 (Polish)**: Depends on all stories complete

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational — independent MVP
- **US2 (P2)**: Depends on US1 (preview panel rows created in T007 are replaced in T009)
- **US3 (P3)**: Depends on US1 (`syncPhase`, `canDownload`) and US2 (`resolved`/`skipped` arrays used in `applyAndDownload`)

### Within US2: Parallel Opportunities

T009 and T010 touch different parts of the same template section and can be done in parallel if needed, but sequentially is fine for a single-dev project.

---

## Parallel Example: Foundational Phase

```
# T002 and T003 can be written in parallel (different functions, no dependency):
Task T002: Add reactive state refs (syncPhase, fetchStatus, sourceData, categoryResults)
Task T003: Write runMatchPass pure function
# T004 depends on T002 (reads syncPhase and categoryResults)
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Phase 1: T001
2. Complete Phase 2: T002 → T003 → T004
3. Complete Phase 3: T005 → T006 → T007
4. **STOP and VALIDATE**: fetch progress chips work, preview panel shows correct counts
5. This alone eliminates the silent-drop problem for the matched majority

### Full Delivery

1. MVP above
2. Phase 4 (US2): T008 → T009 + T010
3. Phase 5 (US3): T011 → T012
4. Phase 6 (Polish): T013 → T014

---

## Notes

- All 14 tasks modify only `src/views/Admin.vue`
- No new files, no new npm dependencies
- T009 and T010 are marked [P] — they touch adjacent but non-conflicting template sections
- Commit after each phase checkpoint to keep history clean
- The Chrome 10-download limit is unchanged; existing `downloadObjectAsJSONFile` helper is reused as-is
