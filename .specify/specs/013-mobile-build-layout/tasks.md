# Tasks: Mobile Build View & Editor Layout

**Input**: Design documents from `specs/013-mobile-build-layout/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, design-input.md ✅

**Tests**: No automated test suite (Constitution). Manual golden-path per spec acceptance criteria — see checkpoints.

**Organization**: Tasks grouped by user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different concerns, no incomplete dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 2: Foundational — Slim Shared Header ✅ COMPLETE

- [x] T001 Add slim mobile `v-app-bar` row to `src/components/builds/BuildHeader.vue`
- [x] T002 Add lean mobile hero card to `src/components/builds/BuildHeader.vue`

**Checkpoint**: ✅ Complete.

---

## Phase 3: User Story 1 — Read a Build on a Phone ✅ COMPLETE

- [x] T003 [US1] Wire `BuildHeader.vue` into `src/views/builds/BuildDetails.vue` for mobile
- [x] T004 [US1] Add collapsible Description card to `src/views/builds/BuildDetails.vue`
- [x] T005 [P] [US1] Add skeleton loading state to `src/views/builds/BuildDetails.vue`
- [x] T006 [US1] Position Video card after build order in `src/views/builds/BuildDetails.vue`
- [x] T007 [US1] Redesign mobile view-mode step layout in `src/components/builds/BuildOrderSectionEditor.vue`
- [x] T008 [P] [US1] Fix villager total display in the new mobile step layout
- [x] T009 [P] [US1] Fix timestamp display in view mode
- [x] T010 [US1] Fix icon-rendered step note in view mode

**Checkpoint**: ✅ Complete — 390 px viewer, zero scroll, 5-slot grid, inline icons, description collapse, video card.

---

## Phase 4: User Story 2 — Edit a Build Step on a Phone (Priority: P1) 🎯 NOW

**Goal**: Replace the existing mobile edit layout (ugly column grid) with the same `.step-card-xs` card style used in the reader. Add only the edit-mode extensions: editable inputs per slot, editable timestamp, ✕ remove step, insert-icon trigger, add-step button. Keep the existing WYSIWYG contenteditable behavior byte-for-byte — no new composable. No sticky action bar (Publish stays in overflow only).

**Scope constraints**:
- Reuse all existing `@focusout`, `@input`, `@paste`, `v-for` bindings and handlers — layout change only
- WYSIWYG description field: keep existing `contenteditable`, `handlePaste`, `handleResourceInput`, `updateStepDescription` as-is
- No `useIconRichText` composable — existing behavior is sufficient
- No sticky Draft/Publish action bar
- Keep existing `IconSelector` and `IconAutoCompleteMenu` as-is; only expose an insert-icon trigger button in the new layout
- Desktop (`hidden-xs`) template: **untouched**

**Independent Test**: Open the build editor on a 390 px viewport. Verify: each step renders as a card matching the reader style; tapping a resource slot activates numeric input; timestamp is editable; ✕ removes a step (via existing confirmation dialog); the insert-icon button opens the existing icon selector; adding a step appends a new card; description WYSIWYG icons still insert via `::` autocomplete.

### Tasks

- [x] T011 [US2] Replace the existing `<template v-if="!readonly">` mobile step rows in `src/components/builds/BuildOrderSectionEditor.vue` — rewrite the `hidden-sm-and-up` edit-mode `v-row`/`v-col` block with a `div.xs-steps-container` → `div.step-card-xs` per step structure mirroring the readonly template (same CSS classes, same top bar + grid + description layout). Preserve all existing `v-for`, `v-on:keyup`, `@focusin`, `@mousedown`, `@mouseover`, `@mouseleave` bindings on the per-step loop. Desktop template (`hidden-xs`) is byte-for-byte untouched.

- [x] T012 [P] [US2] Add editable resource inputs inside the 5-slot grid (edit mode) in `src/components/builds/BuildOrderSectionEditor.vue` — in each of the 5 slot divs replace the static `.slot-val` span with a `<input type="number" class="slot-input-xs">` styled to fill the slot cell (no border, transparent background, centered, same font weight/size as `.slot-val`, `min-width:0`). Wire each to the existing `@focusout="updateStep($event, index, 'builders')"` / `food` / `wood` / `gold` / `stone` handlers using `:value="item.builders"` etc. Villager total remains the read-only `.step-pop-xs` badge computed via `aggregateVillagers`. Add scoped CSS for `.slot-input-xs`: `background:transparent; border:none; outline:none; width:100%; text-align:center; font-size:14px; font-weight:800; color:#fff; padding:0;`.

- [x] T013 [P] [US2] Add editable timestamp in the top bar (edit mode) in `src/components/builds/BuildOrderSectionEditor.vue` — in the `.step-time-xs` pill replace the `<span>{{ item.time }}</span>` with `<input type="text" class="time-input-xs" :value="item.time" @focusout="updateStep($event, index, 'time')" @paste="handlePaste">`. Style `.time-input-xs` to be transparent/borderless, inherit the pill's color and font, `width:48px; background:transparent; border:none; outline:none; font-size:12.5px; font-weight:700; color:inherit;`.

- [x] T014 [P] [US2] Add ✕ remove-step button to each step card in `src/components/builds/BuildOrderSectionEditor.vue` — in the `.stepc-top-xs` top bar add a `<v-btn icon size="x-small" variant="text" @click="removeStepConfirmationDialog = true; delteRowIndex = index"><v-icon size="14">mdi-close</v-icon></v-btn>` at the far right (after the villager badge). The existing `removeStepConfirmationDialog` and `removeStep` logic is unchanged. Push the button to the right using `<div style="flex:1"></div>` between the villager badge and the ✕.

- [x] T015 [US2] Add insert-icon trigger button in the step description area (edit mode) in `src/components/builds/BuildOrderSectionEditor.vue` — below the `.step-grid-xs` resource grid, render a row with: (1) the existing `contenteditable` description div (class `step-desc-xs-edit`) wired to existing `@paste="handlePaste"` / `@input="handleResourceInput"` / `@focusout="updateStepDescription($event, index)"` / `v-html="item.description"` / `:contenteditable="true"` handlers; (2) a `<v-btn size="x-small" variant="text" color="accent" @mousedown.prevent="openIconSelector(index)"><v-icon>mdi-image-plus</v-icon></v-btn>` that calls a new `openIconSelector(index)` method storing `selectedRowIndex = index` then triggering the existing `IconSelector` via a `ref` or the existing `iconSelectorVisible` reactive flag (check how desktop currently opens `IconSelector` and replicate that trigger). Keep `IconAutoCompleteMenu` wired to the same `searchText` / `autocompletePos` props as before.

- [x] T016 [P] [US2] Add "add step" button below the steps container (edit mode) in `src/components/builds/BuildOrderSectionEditor.vue` — after the `div.xs-steps-container` closing tag (inside the `<template v-if="!readonly">`), add `<div class="px-4 pb-2"><v-btn variant="text" color="accent" size="small" @click="addStep(steps.length - 1)"><v-icon start>mdi-plus</v-icon>Add step</v-btn></div>`. This reuses the existing `addStep` function.

- [x] T017 [US2] Wire `BuildHeader.vue` slim header into `src/views/builds/BuildEditor.vue` for mobile — mirror the T003 pattern: import `BuildHeader`, replace the existing mobile hero markup inside `hidden-md-and-up` with `<BuildHeader :build="build" :readonly="false"><template v-slot:actions>…overflow btn…</template></BuildHeader>`. Desktop `d-none d-md-block` markup untouched. Check what overflow items the editor currently shows and pass them through the slot.

**Checkpoint**: 390 px edit mode. Each step is a card matching the reader. Resource inputs are tappable. Timestamp is editable. ✕ triggers existing removal dialog. Insert-icon button opens existing selector. Add-step button appends a new card. Description icons still work via `::` autocomplete. Desktop editor is pixel-unchanged.

---

## Phase 5: User Story 3 — Manage a Build from a Phone (Priority: P2) ⏸ DEFERRED

> **Deferred** — start after US1 + US2 both ship.

- [ ] T021 [US3] Implement owner-gated view-route overflow in `src/views/builds/BuildDetails.vue`
- [ ] T022 [P] [US3] Implement edit-route overflow in `src/views/builds/BuildEditor.vue`
- [ ] T023 ~~[US3] Add sticky bottom action bar~~ — **EXPLICITLY EXCLUDED**: Publish/Draft remain in the overflow menu only; no sticky bar this iteration.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T024 [P] Desktop regression check — open `BuildHeader.vue`, `BuildOrderSectionEditor.vue`, `BuildDetails.vue`, `BuildEditor.vue` at `md-and-up` viewport; verify pixel-identical to before this branch (SC-006).
- [ ] T025 [P] Icon rendering check — load a published build with ≥ 3 icons in step notes on 390 px edit viewport; verify icons render as tiles (not raw `::id::` text), WYSIWYG round-trip is lossless.
- [ ] T026 [P] Touch target audit — all interactive controls (✕, add step, insert icon, resource inputs) ≥ 44 × 44 px (SC-002).
- [ ] T027 [P] Legibility audit — resource values, timestamp, villager total all ≥ 13 px and readable without zoom (SC-003).
- [ ] T028 [P] Theme test — step cards render correctly in both `customDarkTheme` and `customLightTheme`.

---

## Dependencies & Execution Order

```text
Phase 2 ✅ → Phase 3 ✅ → Phase 4 (T011 → T012/T013/T014 [P] → T015 → T016/T017 [P]) → Phase 6
```

T012, T013, T014, T016 are parallel after T011 (different concerns within the same card structure). T015 depends on T011 (description row placement). T017 is independent (different file).

---

## Implementation Strategy

### Current Sprint: US2 Edit Layout

1. ✅ Phase 2 + Phase 3 complete
2. T011 — port card shell to edit mode (unblocks all others)
3. T012 / T013 / T014 in parallel — inputs + ✕ button
4. T015 — description + icon trigger
5. T016 / T017 in parallel — add-step + editor header
6. **STOP and VALIDATE**: 390 px edit mode manual test per checkpoint above
7. Ship, then start US3 if needed.

---

## Notes

- `[P]` tasks touch different concerns — safe to run in parallel.
- Mobile step layout is **xs only** (`hidden-sm-and-up` guard).
- All mobile additions are **additive** behind `hidden-sm-and-up` or `d-md-none` — desktop is never touched.
- The existing WYSIWYG contenteditable system (`handlePaste`, `handleResourceInput`, `updateStepDescription`, `IconAutoCompleteMenu`) is **preserved unchanged** — this is a layout-only refactor for the edit experience.
- No automated test suite; validate manually at 390 px (Chrome DevTools, iPhone 14 Pro preset).
- Commit after each task or logical group using Conventional Commits.
