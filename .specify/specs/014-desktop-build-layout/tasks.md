# Tasks: Desktop Build View & Editor Layout (`014-desktop-build-layout`)

**Branch**: `014-desktop-build-layout` | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

**Organization**: Grouped by user story — US1 (view) ships as MVP, US2 (edit parity) follows, US3 (layout polish) is P2.

**No test tasks** — acceptance is manual via SC-001..008 in `spec.md` and the WYSIWYG preservation contract in `research.md`.

**Golden rule**: build view first (US1), then make edit match it (US2). Never the reverse.

## Format: `[ID] [P?] [Story] Description — file`

- **[P]**: Can run in parallel with other [P] tasks in the same phase (different concerns or different files)
- **[Story]**: US1 / US2 / US3
- Setup and Foundational phases have no story label

---

## Phase 1: Setup

- [x] T001 Branch `014-desktop-build-layout` created; NC-1 resolution recorded (ship against current views, not `010`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Complete before any user story work.** T002 + T004 prevent `stepsTable.value.rows[index]` index corruption once insert rows are added.

- [x] T002 Add `<colgroup>` with fixed column widths (64 · 44 · 52×5 · auto [· 30px edit]) to the desktop `v-table` header; mark every data row `class="step-row"` in the `v-for` — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T003 [P] Delete `alignTableColumnWidthsAcrossSections()` and all call-sites (`onMounted`, `nextTick` wrapper, `@textChanged` handler on `<BuildOrderSectionEditor>`) from `BuildOrderEditor.vue`; remove the `textChanged` emit from `BuildOrderSectionEditor.vue`
- [x] T004 Update all 9 `stepsTable.value.rows[index]` accesses to `stepsTable.value.querySelectorAll('tr.step-row')[index]` in `BuildOrderSectionEditor.vue` — full touch-point list in `research.md §1.2`; behavior unchanged, enables insert rows
- [x] T005 [P] Add `const timestampRefs = ref([])` and `registerTimestampRef(el, index)` to `BuildOrderSectionEditor.vue`; bind `:ref="el => registerTimestampRef(el, index)"` on the timestamp element in the desktop `v-for` — needed by T023 (ageUp focus) and T024 (Tab order)

**Checkpoint**: Colgroup widths fixed, DOM selectors updated, timestamp refs wired — US1 and US2 can begin

---

## Phase 3: User Story 1 — Read a build on desktop (Priority: P1) 🎯 MVP

**Goal**: A player on desktop can scan a published build: prominent civ lockup in the hero, fixed resource columns, age-transition lane, inline icon tiles in step notes, delta accents on increases.

**Independent Test (SC-001/005)**: Load a published build at ≥1280 px — civ lockup visually distinct from chips; every resource value sits in a stable column across all rows; age lane gold-bracketed with no row indentation; step notes show inline icon tiles; no horizontal scroll.

- [x] T006 [US1] Render step rows in view mode — `<tr class="step-row">` with: timestamp text, villager total via `aggregateVillagers()`, 5 resource `<td>` cells, description `v-html` — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T007 [P] [US1] Delta accent — add `hasDeltaUp(field, index)` function; apply `.d-up` CSS class (2px `var(--v-theme-primary)` top-border) on resource `<td>` elements that increased vs previous step; no accent on first step or unchanged/decreased cells (FR-014; SC-005) — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T008 [P] [US1] Empty resource cell — render faint dash (no tile, no border) when `!step[field]`; cell still occupies full column width (FR-005) — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T009 [US1] Age-transition lane view mode — "Age up to {age} Age" marker card → lane `<tr>` rows with `box-shadow: inset 3px 0 0 var(--aug)` left-edge (NOT `border-left` or padding — would misalign columns) → "{age} reached" plate card; marker and plate are full-radius gold cards; rows stay column-aligned (FR-013) — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T010 [P] [US1] Section note row (gameplan) view mode — `<tr class="bo-noterow">` with single `<td :colspan="readonly ? 8 : 9">` spanning all columns; content via `v-html` renders icons as class-tinted tiles inline (FR-026) — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T011 [P] [US1] Empty build state view mode (0 steps) — column header row + single centered "No steps yet" placeholder `<tr>` when `steps.length === 0` (edge case in spec) — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T012 [P] [US1] Separator hygiene — remove bottom border from the last step row; remove bottom border from any note row directly above an age-up gold card (prevents double line; FR-024) — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T013 [P] [US1] Civ lockup in desktop hero — in `BuildHeader.vue` desktop section (`d-none d-md-block`): add `v-img` 46×34 `rounded="sm"` + `text-h6 font-weight-bold` civ name as leading flex element in body column (`v-if="civEntry"`); remove civ chip from desktop chip group; mobile section unchanged (FR-001/002) — `src/components/builds/BuildHeader.vue`

**Checkpoint**: US1 independently testable — SC-001, SC-005; confirm mobile layout unchanged

---

## Phase 4: User Story 2 — Edit a build on desktop (Priority: P1)

**Goal**: Every step field is inline-editable in place; the table is pixel-identical to view except for edit affordances; WYSIWYG icon insertion preserves caret; section notes are fully WYSIWYG in edit.

**Independent Test (SC-002/003/004)**: Toggle between view and edit — row heights, column positions, and first-line alignment are identical (±1 px measured). Insert 3+ icons at varied caret positions — each lands immediately after icon with 0 px height change. Section note (gameplan) icons survive save → reload losslessly.

- [x] T014 [US2] Timestamp edit cell — free-text `<input>` aligned with view timestamp position; bind `registerTimestampRef` on this input (FR-007) — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T015 [US2] Resource input cells — 5 `<input>` cells (numeric, `maxlength="2"`); live villager total recomputes via `aggregateVillagers()` on each input; villager total stays read-only; verify view/edit alignment matches T006 positions (FR-005/006/022; SC-002) — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T016 [US2] WYSIWYG step note — `contenteditable` `<td>` in edit mode; rewire existing `contentEditableHelper.js` chain (`updateSearchText`, `addAutocompleteIcon`, `addInlineIcon`, `handleIconSelectorIconSelected`, `saveSelection`/`restoreSelection`) to use `stepsTable.value.querySelectorAll('tr.step-row')[index].cells[descriptionColumnIndex]`; `Enter` inserts `<br>` within note, never creates a new step (FR-015/016/017/019; SC-003) — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T017 [US2] Corner Insert-icon button per step note — icon-insert dialog in the actions column (same column as delete/add-step); `@mousedown.prevent` saves caret before focus loss; button opens `IconSelector` in `v-dialog` (FR-018; SC-004) — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T018 [US2] Section note row (gameplan) edit mode WYSIWYG — existing `gameplanContentEditable` ref + `contentEditableHelper.js` chain already wired; icon-insert via existing `v-menu` in gameplan table (FR-027/028; SC-003) — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T019 [US2] Hover insert rows — `<tr class="ins-row">` before each step row + trailing insert after last step, edit mode only; each row has one `<td :colspan="9">` with gold insert affordance; `@click="addStep(index)"` at correct position (FR-020; SC-007) — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T020 [P] [US2] Empty build state edit mode — leading `<tr class="ins-row">` visible immediately when `steps.length === 0`; no separate "Add step" button (edge case; FR-020) — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T021 [US2] Remove ✕ per row — hover-revealed delete button in the action column (edit mode only); `removeStep(index)` for step rows; emits `ageDownRequested` for age-up rows (FR-011) — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T022 [US2] Age-down confirmation dialog — clicking age-down opens `v-dialog` warning; calls `ageDown()` only on confirm; no removal on dismiss (FR-012; SC-007) — `src/components/builds/BuildOrderEditor.vue`
- [x] T023 [US2] Add age-up seeds + timestamp focus — `ageUp()` in `BuildOrderEditor.vue` now async; calls `timestampRefs.value[0]?.focus()` on new section after `await nextTick()` (FR-021; SC-006) — `src/components/builds/BuildOrderEditor.vue`
- [x] T024 [US2] Tab order — `@keydown.tab.prevent` on step note `<td>`; forward Tab → `timestampRefs[index + 1]?.focus()` (FR-029) — `src/components/builds/BuildOrderSectionEditor.vue`

**Checkpoint**: US2 independently testable — SC-002, SC-003, SC-004, SC-006, SC-007

---

## Phase 5: User Story 3 — Desktop width (Priority: P2)

**Goal**: Build details page reads cleanly at all desktop widths; Publish is reachable in the header; inline title edit has a calm affordance.

**Independent Test**: At ≥1280 px, view route shows header → collapsible description card → build order → video card; edit route shows classification stacked cards above build order; no sticky bottom bar; title editable with no layout shift (US3 acceptance scenarios).

- [x] T025 [US3] Inline title edit mode — calm affordance in `BuildHeader.vue` (`v-text-field variant="plain"` or `contenteditable` with `:focus` accent); no permanent underline; no layout shift versus view (FR-004; SC-002) — `src/components/builds/BuildHeader.vue`
- [x] T026 [US3] Verify page layout and header actions — confirm `BuildDetails.vue` renders header → collapsible description → build order → video in correct order; confirm `BuildEditor.vue` shows Publish as primary action in header with Save as draft / Discard in overflow and no sticky bottom bar (FR-003; US3 scenarios) — code change only if verification finds a gap — `src/views/builds/BuildDetails.vue`, `src/views/builds/BuildEditor.vue`

**Checkpoint**: US3 independently testable — SC-001 at ≥1280 px; edit route header actions

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T027 [P] Dual-theme pass — verify all desktop surfaces in dark and light; age lane stays gold (`var(--aug)`) in both themes; delta accent uses `var(--v-theme-primary)` not hardcoded hex; no new hex colors introduced anywhere (FR-025) — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T028 [P] Icon sizing — set step-note icon tiles to 36 px, legend column icons to 28 px; verify class → gradient color coding is byte-unchanged vs before this feature (FR-009; SC-008) — `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T029 SC regression sweep — run full SC-001..008 checklist from `spec.md`; confirm mobile layout (`011`) is unchanged (visual); confirm `contentEditableHelper.js`, `IconSelector`, `IconAutoCompleteMenu` are untouched; confirm save/publish/delete/export logic unaffected — all source files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Done
- **Phase 2 (Foundational)**: Start immediately; T003 and T005 run in parallel on different files; T004 follows T002 (class must exist to test selector)
- **Phase 3 (US1)**: Depends on Phase 2 complete (especially T002 for colgroup, T004 for selector)
- **Phase 4 (US2)**: Depends on Phase 2 + T006 (step row structure must exist); most US2 tasks can start once T006 is done
- **Phase 5 (US3)**: Can run in parallel with US1/US2 — touches different files (`BuildHeader.vue`, views)
- **Phase 6 (Polish)**: After all desired stories complete

### Within Phase 2

```
T002 (colgroup + step-row class marker)
  ↓
T004 (querySelectorAll update — must follow T002 so class exists to target)
T003 [P] (BuildOrderEditor.vue — no dep on T002)
T005 [P] (timestampRefs — no dep on T002, can run alongside T003)
```

### Within US1

```
T006 (step row structure — base for T007/T008/T009/T010/T011/T012)
├── T007 [P] (delta accent — CSS + function, independent)
├── T008 [P] (empty cell dash — CSS, independent)
├── T009     (age lane — uses T006 row structure)
├── T010 [P] (section note view — independent from step rows)
├── T011 [P] (empty state — conditional, independent)
└── T012 [P] (separator hygiene — CSS, independent)
T013 [P] (BuildHeader.vue — fully independent, different file)
```

### Within US2

```
T014 (timestamp input)
  ↓
T015 (resource inputs — alignment depends on T014)
T016 (WYSIWYG note — depends on T004 querySelectorAll being in place)
  ↓
T017 (corner button — depends on T016 WYSIWYG host)
T018 (gameplan WYSIWYG — independent from T016; uses gameplanContentEditable ref)
T019 (insert rows — depends on T004 querySelectorAll)
T020 [P] (empty state edit — follows T019 pattern)
T021 (remove ✕ — depends on T002 for extra col)
  ↓
T022 (age-down dialog — follows T021)
T023 (BuildOrderEditor.vue ageUp focus — independent from most US2 tasks)
T024 (Tab order — depends on T014 for timestampRefs, T016 for note cell)
```

### Parallel Opportunities

- Phase 2: T003 + T005 run in parallel (different files)
- US1: T007, T008, T010, T011, T012, T013 — all `[P]`, can run simultaneously
- US2: T018 and T020 can run alongside other US2 tasks; T022 and T023 (BuildOrderEditor.vue) run in parallel with all BuildOrderSectionEditor.vue tasks

---

## Implementation Strategy

### MVP (US1 only — Phase 2 + Phase 3)

1. Complete Phase 2 (Foundational)
2. Complete Phase 3 (US1 — view rendering + BuildHeader civ lockup)
3. **STOP and VALIDATE**: SC-001, SC-005; visual mobile regression check
4. Ship: view is materially improved; edit remains functional but cosmetically unchanged

### Full P1 Delivery (US1 + US2)

1. Phase 2 → Phase 3 → Phase 4
2. Validate SC-001..008 after Phase 4

### Complete (All Stories)

1. Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
2. US3 (Phase 5) can be parallelised by a second person after Phase 2 completes

---

## Out of scope (do not touch)

`::id::` shortcode format · `src/composables/builds/contentEditableHelper.js` · `IconSelector` / `IconAutoCompleteMenu` behaviour · **icon-class tile color coding** · **Focus mode** · data model / Firestore / store / routing / `firestore.rules` · save / draft / publish / delete / export / duplicate **logic** · step **reordering** · the entire **mobile layout** (`011`)
