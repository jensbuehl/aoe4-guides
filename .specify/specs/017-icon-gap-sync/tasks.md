# Tasks: Icon Gap Sync

**Feature**: `017-icon-gap-sync` | **Plan**: [plan.md](plan.md) | **Spec**: [spec.md](spec.md)

**Source files touched**: `src/views/Admin.vue` (all logic + template), `package.json` (JSZip)

**No new source files** — all changes are additions to existing files.

---

## Phase 1: Setup

**Purpose**: Add JSZip dependency so it is available for Phase 5 (US3).

- [X] T001 Install jszip npm package and verify it appears in package.json dependencies (`npm install jszip`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared constants and reactive state that all three user stories depend on. Must be complete before any user story work begins.

**⚠️ CRITICAL**: US1, US2, and US3 all read from these foundations.

- [X] T002 Add `CIV_SLUG_MAP` constant to Admin.vue `setup()` under a `// === ICON GAP SYNC ===` banner — maps all 23 AOE4World civ slugs to local 3-letter codes per plan.md §2 (e.g. `abbasid: "ABB"`, `ayyubids: "AYY"`, …)

- [X] T003 Add Icon Gap Sync reactive state refs to Admin.vue `setup()`: `gapPhase` (`'idle'|'scanning'|'results'`), `gapItems` (array), `gapCivFilter` (string|null), `gapAssignments` (object), `gapImageStatus` (object), `gapJsonSaved` (object), `gapZipSaved` (boolean) — per plan.md §8

- [X] T004 Add derived computeds to Admin.vue `setup()`: `filteredGapItems` (apply `gapCivFilter`), `gapCivOptions` (unique sorted civ slugs from `gapItems`), `canDownloadJsons` (any assignment confirmed), `canDownloadImages` (any new-item assignment with `imageFolder`) — per plan.md §8; add all to `return` object

**Checkpoint**: Foundations in place — US1/US2/US3 can now be implemented

---

## Phase 3: User Story 1 — Gap Detection with Civilization Filter (P1) 🎯 MVP

**Goal**: Admin scans for missing items, sees a filterable list with NEW and CIV+ badges.

**Independent Test**: Scan completes and shows a civ-filtered gap list. No assignment or download needed to verify.

### Implementation

- [X] T005 [US1] Add `buildGapList()` function to Admin.vue `setup()` — iterates all source items (non-deduped), computes `civCountById` map, produces GapItem array with `kind: 'new'` or `kind: 'civ-extension'` per plan.md §3; skip source items whose `civilization` slug is not in `CIV_SLUG_MAP`

- [X] T006 [US1] Add `startGapScan()` and `resetGapScan()` functions to Admin.vue `setup()`: `startGapScan` sets `gapPhase = 'scanning'`, checks if `sourceData` is already populated (reuse it) or triggers the same 4-source fetch as `startSync()`, then calls `buildGapList()` and sets `gapPhase = 'results'`; `resetGapScan` resets all gap state refs — add both to `return` object

- [X] T007 [US1] Add the Icon Gap Sync second card to Admin.vue `<template>` below the existing Sync Data card: header row ("Icon Gap Sync" title + Scan/Reset button), idle state (CTA or "Fetch data first" if sourceData is null), scanning spinner, results state with `v-chip` civ filter strip (All + one chip per `gapCivOptions` entry) and `v-list` of `filteredGapItems` — each row shows kind badge ("NEW" in amber / "CIV+" in blue), item name, civ chip, age + type subtitle; show summary chips ("N new items", "N civ extensions")

**Checkpoint**: US1 independently testable — scan shows filterable gap list with correct kind badges (quickstart.md Story 1 passes)

---

## Phase 4: User Story 2 — Category Assignment and JSON Export (P2)

**Goal**: Admin assigns each gap item to a category (auto-suggested or manual dropdown) and downloads updated JSON files.

**Independent Test**: Assign a gap item, click Download JSONs, verify downloaded file has correct fields and is drop-in compatible (quickstart.md Story 2).

### Implementation

- [X] T008 [US2] Add `suggestCategory(gapItem)` function to Admin.vue `setup()` — returns a category key string or `null`; for `civ-extension` kind return `localCategory.key`; for `new` kind apply the keyword heuristic from plan.md §4 (ability → abilityHero; technology keyword match → techEco/techMilitary; unit keyword match → unitEco/unitReligious/unitHero/unitMilitary; building keyword match → landmarks/buildingReligious/buildingEco/buildingMilitary/buildingTech; else null)

- [X] T009 [US2] Add `initAssignment(gapItem)` function to Admin.vue `setup()` — called when gap scan completes; for each GapItem, creates a `gapAssignments[gapKey]` entry with `categoryKey = suggestCategory(gapItem)`, `autoSuggested = true/false`, `confirmed = (categoryKey !== null)`, `imageFolder = null`, `imgSrc = gapItem.localEntry?.imgSrc ?? ''`

- [X] T010 [US2] Add `confirmManualCategory(gapKey, categoryKey)` function to Admin.vue `setup()` — updates `gapAssignments[gapKey].categoryKey`, sets `confirmed = true`, `autoSuggested = false`; add to `return` object

- [X] T011 [US2] Add `downloadGapJsons()` function to Admin.vue `setup()` — groups confirmed assignments by `categoryKey`; for each affected category deep-clones `CATEGORY_CONFIG[key].data`; appends new-item entries (title, civ:[civCode], age, id, type, description, costs, exploreUrl, imgSrc) and updates civ-extension entries (appends civCode to existing entry's `civ[]`, sorted); calls `downloadObjectAsJSONFile(entries, filename)` and sets `gapJsonSaved[key] = true`; add to `return` object

- [X] T012 [US2] Add category UI to gap list rows in Admin.vue template: for `civ-extension` rows show a read-only category chip (no dropdown, category is fixed); for `new` rows show a `v-chip` with auto-suggested category (if `autoSuggested`) or a `v-select` dropdown listing all 12 CATEGORY_CONFIG keys (if `!confirmed`); add "Download JSONs" footer button bound to `canDownloadJsons` and `downloadGapJsons()`; show per-category saved checkmark chip after download

**Checkpoint**: US2 independently testable — assign items and download JSONs without touching image code (quickstart.md Story 2 passes)

---

## Phase 5: User Story 3 — Image Processing and Zip Export (P3)

**Goal**: Admin processes images for new-item gaps (CDN fetch → Canvas 48×48 WebP → zip download). Civ extensions and existing icons are skipped automatically.

**Independent Test**: Assign one new-item gap, click Process & Download Images, verify zip contains one 48×48 WebP at the correct path; verify civ-extension rows show "skipped" status without a CDN fetch (quickstart.md Story 3 passes).

### Implementation

- [X] T013 [US3] Add `resolveImageFolder(gapItem)` function to Admin.vue `setup()` — implements the 4-civ threshold algorithm from plan.md §5: if `civCount <= 3` return `{prefix}{civSlug}`; else iterate keyword regex table for the item's type to find a functional group folder; return `null` if no match; add to `return` object

- [X] T014 [US3] Add `processGapImage(gapItem, assignment)` async function to Admin.vue `setup()` — implements FR-015: return `{skip:true}` for civ-extension; call `findLocalIconByName(gapItem)` and if found set `assignment.imgSrc` and return `{skip:true, reason:'icon-exists'}`; else fetch CDN PNG (`https://data.aoe4world.com/images/${type}s/${civ}/${id}.png`), draw to 48×48 canvas, call `canvas.toBlob('image/webp', 0.8)`, set `assignment.imgSrc = /assets/pictures/${folder}/${id}.webp`, return `{blob, zipPath: '${folder}/${id}.webp'}`; on fetch error return `{skip:false, error: message}`

- [X] T015 [US3] Add `downloadGapImagesZip()` async function to Admin.vue `setup()` — iterates confirmed new-item assignments that have `imageFolder`; sets `gapImageStatus[gapKey] = 'processing'`; calls `processGapImage`; updates status to `'done'|'exists'|'skipped'|'error'`; adds blobs to JSZip instance; after all items, if zip has files generates blob and triggers download as `icon-gap-sync.zip`; sets `gapZipSaved = true`; add to `return` object

- [X] T016 [US3] Add image folder + status UI to gap list rows in Admin.vue template: for `new` kind rows show folder chip (auto-resolved text chip) or `v-text-field` if `imageFolder === null` (pre-filled with `{prefix}{civSlug}`); show per-item status icon (pending / spinner / ✓ / icon-exists chip / error chip); add "Process & Download Images" footer button bound to `canDownloadImages` and `downloadGapImagesZip()`; show "zip saved" checkmark after download; call `resolveImageFolder` when assignment is created and store result in `assignment.imageFolder`; call `initAssignment` in `buildGapList` after gap list is built

**Checkpoint**: US3 independently testable — full image pipeline works without modifying sync pipeline (quickstart.md Story 3 passes)

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Empty states, error UX, and final validation.

- [X] T017 Add "No gaps found for this civilization" empty state to Icon Gap Sync results in Admin.vue template — shown when `filteredGapItems.length === 0` and `gapCivFilter !== null`; show "All items are already covered" when `gapItems.length === 0` regardless of filter

- [X] T018 Add error UX for image processing in Admin.vue template — items with `gapImageStatus[key] === 'error'` show a red error chip with the error message as tooltip; zip download button remains enabled for partial success (FR-013)

- [ ] T019 Run all three quickstart.md manual test scenarios and fix any issues found in `src/views/Admin.vue`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — blocks all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — no dependency on US2/US3
- **US2 (Phase 4)**: Depends on Phase 2 — can start after Phase 2 even if US1 template is incomplete; depends on `suggestCategory` being callable
- **US3 (Phase 5)**: Depends on Phase 2 + JSZip (T001) — can start after foundations; builds on US2's `gapAssignments` shape
- **Polish (Phase 6)**: Depends on US1+US2+US3 complete

### Within-Phase Task Order

- T002 → T003 → T004 (sequential, same file, state before computeds)
- T005 → T006 → T007 (sequential within US1: algorithm → orchestrator → template)
- T008 → T009 → T010 → T011 → T012 (sequential within US2: heuristic → init → manual confirm → download → template)
- T013 → T014 → T015 → T016 (sequential within US3: folder resolve → image process → zip → template)

### Parallel Opportunities

- T001 (install JSZip) can run in parallel with T002–T004
- T005–T007 (US1) and T008–T012 (US2) can run in parallel once Foundational is done (different logical sections of same file, careful of merge)
- T017 and T018 (Polish) can run in parallel

---

## Implementation Strategy

### MVP (User Story 1 only)

1. T001: Install JSZip (1 min)
2. T002–T004: Foundations (15 min)
3. T005–T007: US1 gap scan + civ filter (45 min)
4. **Validate**: Run quickstart.md Story 1 — gap list appears and filters correctly

### Incremental Delivery

1. Foundations + US1 → gap detection works
2. + US2 → JSON download works (immediate app value — new civs can be added without images)
3. + US3 → image pipeline completes the full workflow
4. + Polish → production-ready

---

## Notes

- All changes go in `src/views/Admin.vue`; the only other file touched is `package.json`
- The `// === ICON GAP SYNC ===` comment banner separates new code from the existing Sync pipeline code
- `findLocalIconByName()` (already in Admin.vue) is reused for FR-015 icon existence check — do not duplicate it
- `downloadObjectAsJSONFile()` (already in Admin.vue) is reused for JSON downloads — do not duplicate it
- `sourceData` ref (already in Admin.vue) is shared between both cards — no re-fetch if Sync was already run
- JSZip import: `import JSZip from 'jszip'` at the top of the `<script>` block
