# Tasks: Mobile Build View & Editor Layout

**Input**: Design documents from `specs/013-mobile-build-layout/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, design-input.md ✅

**Tests**: No automated test suite (Constitution). Manual golden-path per spec acceptance criteria — see checkpoints.

**Organization**: Tasks grouped by user story. **Current scope: US1 (read/viewer) only.** US2 (editor) and US3 (management actions) are deferred until US1 ships.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different concerns, no incomplete dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 2: Foundational — Slim Shared Header ✅ COMPLETE

**Purpose**: `BuildHeader.vue` is the shared integration point for the slim header used by **both** the view route (US1) and the edit route (US2). Complete before starting either story.

- [x] T001 Add slim mobile `v-app-bar` row to `src/components/builds/BuildHeader.vue` — `density="compact"`, flat, `color="surface"`, `hidden-md-and-up` wrapper; 1px bottom border `border-bottom: 1px solid rgb(var(--v-theme-primary))`; title slot = brand wordmark. See design-input.md §2 row "Slim app header row".
- [x] T002 Add lean mobile hero card to `src/components/builds/BuildHeader.vue` — `v-card flat rounded="lg"` shown only on mobile (`hidden-md-and-up`); `v-card-title` for build title (wraps, never truncated); `v-chip-group` with 3 `v-chip size="small"`: status (`color="primary" variant="tonal"`), civ-as-text (`color="secondary" variant="tonal"`), season (`variant="outlined"`). **No** `v-img` flag column. Overflow ⋮ `v-btn icon` pinned top-right. See design-input.md §2 rows "Hero card", "Status / civ / season chips", "Overflow ⋮".

**Checkpoint**: ✅ Slim header renders correctly on a 390 px viewport for both routes; desktop (`md-and-up`) is untouched.

---

## Phase 3: User Story 1 — Read a Build on a Phone (Priority: P1) 🎯 MVP

**Goal**: A player can open any published build on a 390 px phone and read the entire build order — header, hero, steps with resources + icons, description, video — with zero horizontal scroll and no pinch-zoom.

**Independent Test**: Load a published build on a 390 px viewport. Confirm: slim header row visible, lean hero shows title + 3 chips only (no flag, no map/strategy), every build-order step shows 5 resource positions with inline icons in the note, Description card collapses/expands, Video card appears after the build order. No horizontal scroll anywhere. SC-001/SC-002/SC-003 pass.

### ✅ Done

- [x] T003 [US1] Wire `BuildHeader.vue` into `src/views/builds/BuildDetails.vue` for mobile — on `hidden-md-and-up`, replace the existing multi-row hero with the slim header + lean hero from `BuildHeader.vue`; leave `md-and-up` markup byte-for-byte unchanged (SC-006).
- [x] T004 [US1] Add collapsible Description card to `src/views/builds/BuildDetails.vue` — `v-card` with clickable header row (chevron `v-icon` toggling direction); `v-expand-transition` body; equal `paddingTop`/`paddingBottom` on the title when collapsed so it stays vertically centered (FR-016). Mobile-only; desktop description rendering unchanged.
- [x] T005 [P] [US1] Add skeleton loading state to `src/views/builds/BuildDetails.vue` — `v-skeleton-loader` rows matching the structural outline of header + hero + N step placeholders, shown while build data is fetching; on Firestore error, show inline error message with retry (no blank screen, no full-page spinner) (FR-021, Edge Cases).
- [x] T006 [US1] Position Video card after build order in `src/views/builds/BuildDetails.vue` — `v-card` placed below the build-order section; padded with `px-4 pb-4`, `border-radius: 8px; overflow: hidden`, `aspect-ratio: 16/9`; card omitted entirely if `build.video` is empty (FR-017, Edge Cases).

### ⏳ Remaining

- [x] T007 [US1] Redesign mobile view-mode step layout in `src/components/builds/BuildOrderSectionEditor.vue` — **Replace** the existing `hidden-sm-and-up` resource row (7 equal `v-col` blocks) with a proper two-row card per step: (1) **top bar**: timestamp as plain text left-aligned + villager-total chip (`v-chip size="x-small"` with villager icon + sum) right-aligned; (2) **resource grid**: CSS `display:grid; grid-template-columns:repeat(5,1fr); gap:4px;` in fixed order Builder · Food · Wood · Gold · Stone — each slot shows a small resource icon (`v-img`, 20px) + the value text below it; an unset slot (null/0) still occupies its grid cell but renders at `opacity:0.35` so the column position is always stable (FR-005, SC-001). Scope: **xs breakpoint only** — keep the existing `hidden-sm-and-up` guard (`hidden-sm-and-up`). Desktop template (`hidden-xs`) is **untouched**.
- [x] T008 [P] [US1] Fix villager total display in the new mobile step layout in `src/components/builds/BuildOrderSectionEditor.vue` — the `aggregateVillagers(item)` result is already computed; render it as `v-chip size="x-small" label` with a 14px villager icon (`v-img src="/assets/resources/villager.webp"`) prepended and the numeric value as the chip label; never directly editable in view mode (FR-006). This task depends on the grid structure from T007 being in place.
- [x] T009 [P] [US1] Fix timestamp display in view mode in `src/components/builds/BuildOrderSectionEditor.vue` — render `step.time` as a plain `<span class="text-caption">` in the top bar of each step card (left-aligned, beside the villager chip); no input or contenteditable; stored verbatim (FR-007). Depends on T007 top-bar structure.
- [x] T010 [US1] Fix icon-rendered step note in view mode in `src/components/builds/BuildOrderSectionEditor.vue` — **remove** the `v-table > tbody > tr > td` wrapper around the description; replace with a `<div class="px-3 py-2" v-html="item.description">` directly in the step card body below the resource grid. Icon CSS `:deep(.icon)` etc. already in scoped styles — verify they apply and icons render as tiles (not raw `::id::` text). Icon size in mobile context: add `:deep(.icon), :deep([class^="icon-"])` rule scoped to the xs step card reducing width to `28px` so icons fit the phone width without overflow (FR-008, SC-001, SC-003).

**Checkpoint**: US1 complete — 390 px viewport, published build. Zero horizontal scroll, slim header, lean 3-chip hero, 5-slot step grid with inline icon notes, description collapses/expands, video card present. SC-001 / SC-002 / SC-003 satisfied.

---

## Phase 4: User Story 2 — Edit a Build Step on a Phone (Priority: P1) ⏸ DEFERRED

> **Deferred** — US1 (read experience) must ship and validate first. Do not start until US1 checkpoint passes.

- [ ] T011 [US2] Create `src/composables/useIconRichText.js` — implement: `mount(initialString)`, `serialize()`, `savedRange` tracking, and focused/blurred write-gating. Round-trip identity contract: `serialize(deserialize(s)) ≡ s`. (FR-013, SC-004, plan.md "Critical: WYSIWYG — Failure mode A")
- [ ] T012 [US2] Add `insertIcon(token)` to `src/composables/useIconRichText.js` — restore `savedRange`, insert `<img contenteditable="false" data-token>` + trailing space, place caret immediately after; use `@mousedown.prevent` on picker trigger. (FR-012, SC-005, plan.md "Critical: WYSIWYG — Failure mode B")
- [ ] T013 [US2] Wire `useIconRichText` as the WYSIWYG step-note host in edit mode in `src/components/builds/BuildOrderSectionEditor.vue` — mobile edit branch; `mount()` called once on step load; `@input` calls `serialize()` debounced; Vue never re-writes innerHTML while focused. (FR-013, FR-015)
- [ ] T014 [US2] Add focus-revealed Insert-icon button + `v-bottom-sheet` picker in `src/components/builds/BuildOrderSectionEditor.vue` — `v-btn` shown only while step note is focused; `@mousedown.prevent`; wraps existing `IconSelector.vue`; on select calls `useIconRichText.insertIcon(token)`. (FR-015, FR-012)
- [ ] T015 [US2] Wire `IconAutoCompleteMenu` to the WYSIWYG note — on select, delete `::query` range, then call `useIconRichText.insertIcon(token)`. (FR-008)
- [ ] T016 [P] [US2] Add tap-to-type resource slots in edit mode — `v-text-field type="number" density="compact" hide-details variant="plain"` bound to each of 5 slots; villager total recomputes live. (FR-005, FR-006)
- [ ] T017 [P] [US2] Add editable timestamp in edit mode — `v-text-field density="compact" hide-details style="width:56px"` bound to `step.time`; stores verbatim. (FR-007)
- [ ] T018 [US2] Add age-up ✕ remove with age-down confirmation — `v-btn icon mdi-close` per age-up row; `v-dialog` explaining removal of age-up + all subsequent steps; destructive confirm only. (FR-010, FR-011, SC-007)
- [ ] T019 [P] [US2] Add step ✕ remove — `v-btn icon mdi-close` per step; removes immediately, no confirmation; same ✕ shape as age-up. (FR-010)
- [ ] T020 [US2] Wire `BuildHeader.vue` slim header into `src/views/builds/BuildEditor.vue` for mobile; Video card on edit route shows URL field. (FR-017, SC-006)

**Checkpoint** (when reached): 390 px edit mode. Resource change recomputes villager total. Icon inserts at caret. Step add/remove works. Age-down dialog correct. SC-004 / SC-005 pass.

---

## Phase 5: User Story 3 — Manage a Build from a Phone (Priority: P2) ⏸ DEFERRED

> **Deferred** — start after US1 + US2 both ship.

- [ ] T021 [US3] Implement owner-gated view-route overflow in `src/views/builds/BuildDetails.vue` — wire the ⋮ `v-menu`: non-owner list = Favorite · Duplicate · Copy to overlay · Download · Open in RTS Overlay · — · Report; owner list adds Edit + Delete (owner-gated via existing `useVerificationGuard`). (FR-019)
- [ ] T022 [P] [US3] Implement edit-route overflow in `src/views/builds/BuildEditor.vue` — Duplicate · Copy to overlay · Download · — · Discard changes. **No** Delete. **No** Preview. (FR-019)
- [ ] T023 [US3] Add sticky bottom action bar to `src/views/builds/BuildEditor.vue` — `position:fixed; bottom:0; left:0; right:0`; Unsaved-changes chip + Draft + Publish buttons; page gets matching `padding-bottom`; bar scrolls off when keyboard opens (not pinned above keyboard). (FR-018)

**Checkpoint** (when reached): Owner sees Delete on view route only; edit overflow has no Delete/Preview; sticky bar shows correct actions.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Acceptance criteria validation spanning all stories. Run after US1 (and US2/US3 when they ship).

- [ ] T024 [P] Desktop regression check — open `BuildHeader.vue`, `BuildOrderSectionEditor.vue`, `BuildDetails.vue` at `md-and-up` viewport; verify every screen is pixel-identical to before this branch (SC-006). All mobile additions are behind `hidden-sm-and-up` / `d-md-none` guards.
- [ ] T025 [P] Icon rendering check — load a published build with ≥ 3 icons in step notes on a 390 px viewport; verify icons render as tiles (not raw `::id::` text), are ≤ 28px wide so they don't cause horizontal overflow, and the step cards have no horizontal scroll (SC-001, FR-008).
- [ ] T026 [P] Touch target audit — on 390 px viewport, inspect all interactive controls on the view route (overflow ⋮, description collapse toggle). Every control must measure ≥ 44 × 44 px (SC-002).
- [ ] T027 [P] Legibility audit — on 390 px viewport, verify: build-order step text ≥ 13 px; villager total chip, timestamp, resource values all readable without pinch-zoom (SC-003).
- [ ] T028 [P] Theme test — verify all modified mobile surfaces (header, hero, step cards, description card, video card) render correctly in both `customDarkTheme` and `customLightTheme`. (Edge Cases, design-input.md §1)

---

## Dependencies & Execution Order

### Current Focus

```text
Phase 2 ✅ → Phase 3 (T003–T006 ✅, T007–T010 ⏳) → Phase 6 polish
```

### Remaining US1 Tasks (sequential)

```text
T007 (redesign mobile step layout)
  → T008 [P] (villager chip — depends on T007 top-bar structure)
  → T009 [P] (timestamp span — depends on T007 top-bar structure)
  → T010 (description div + icon sizing — depends on T007 card body structure)
```

T008 and T009 can run in parallel after T007 lands (different parts of the top bar). T010 follows the grid structure from T007.

---

## Implementation Strategy

### Current Sprint: Finish US1

1. ✅ Phase 2 complete
2. ✅ T003–T006 complete
3. ⏳ T007 → T008/T009 (parallel) → T010
4. **STOP and VALIDATE**: 390 px published build. Zero scroll, 5-slot grid, inline icons, description collapse, video card. SC-001/002/003.
5. Ship mobile read experience, then start US2.

---

## Notes

- `[P]` tasks touch different concerns — safe to run in parallel.
- `[US]` label maps every task to its user story for traceability.
- Mobile step layout scope is **xs only** (`hidden-sm-and-up` guard) — landscape xs and sm+ stay as-is per user instruction.
- All mobile additions are **additive** behind `hidden-sm-and-up` or `d-md-none` — desktop markup is never touched.
- No automated test suite; validate manually at each checkpoint using Chrome DevTools at 390 px (iPhone 14 Pro preset).
- Commit after each task or logical group using Conventional Commits (`feat:`, `fix:`, `refactor:`, `style:`).
