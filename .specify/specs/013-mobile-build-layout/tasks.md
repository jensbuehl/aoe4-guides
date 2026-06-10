# Tasks: Mobile Build View & Editor Layout

**Input**: Design documents from `specs/013-mobile-build-layout/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, design-input.md ✅

**Tests**: No automated test suite (Constitution). Manual golden-path per spec acceptance criteria — see checkpoints.

**Organization**: Tasks grouped by user story. US1 (read) and US2 (edit) are both P1; US3 (manage) is P2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different concerns, no incomplete dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 2: Foundational — Slim Shared Header

**Purpose**: `BuildHeader.vue` is the shared integration point for the slim header used by **both** the view route (US1) and the edit route (US2). Complete before starting either story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T001 Add slim mobile `v-app-bar` row to `src/components/builds/BuildHeader.vue` — `density="compact"`, flat, `color="surface"`, `hidden-md-and-up` wrapper; 1px bottom border `border-bottom: 1px solid rgb(var(--v-theme-primary))`; title slot = brand wordmark. See design-input.md §2 row "Slim app header row".
- [ ] T002 Add lean mobile hero card to `src/components/builds/BuildHeader.vue` — `v-card flat rounded="lg"` shown only on mobile (`hidden-md-and-up`); `v-card-title` for build title (wraps, never truncated); `v-chip-group` with 3 `v-chip size="small"`: status (`color="primary" variant="tonal"`), civ-as-text (`color="secondary" variant="tonal"`), season (`variant="outlined"`). **No** `v-img` flag column. Overflow ⋮ `v-btn icon` pinned top-right (menu wired in US3; stub with empty `v-menu` for now). See design-input.md §2 rows "Hero card", "Status / civ / season chips", "Overflow ⋮".

**Checkpoint**: Slim header renders correctly on a 390 px viewport for both routes; desktop (`md-and-up`) is untouched.

---

## Phase 3: User Story 1 — Read a Build on a Phone (Priority: P1) 🎯 MVP

**Goal**: A player can open any published build on a 390 px phone and read the entire build order — header, hero, steps with resources + icons, description, video — with zero horizontal scroll and no pinch-zoom.

**Independent Test**: Load a published build on a 390 px viewport. Confirm: slim header row visible, lean hero shows title + 3 chips only (no flag, no map/strategy), every build-order step shows 5 resource positions with inline icons in the note, Description card collapses/expands, Video card appears after the build order. No horizontal scroll anywhere. SC-001/SC-002/SC-003 pass.

### Implementation for User Story 1

- [ ] T003 [US1] Wire `BuildHeader.vue` into `src/views/builds/BuildDetails.vue` for mobile — on `hidden-md-and-up`, replace the existing multi-row hero with the slim header + lean hero from `BuildHeader.vue`; leave `md-and-up` markup byte-for-byte unchanged (SC-006).
- [ ] T004 [US1] Add collapsible Description card to `src/views/builds/BuildDetails.vue` — `v-card` with clickable `v-card-title` row (chevron `v-icon` toggling direction); `v-expand-transition` body; equal `paddingTop`/`paddingBottom` on the title when collapsed so it stays vertically centered (FR-016). Mobile-only; desktop description rendering unchanged.
- [ ] T005 [P] [US1] Add skeleton loading state to `src/views/builds/BuildDetails.vue` — `v-skeleton-loader` rows matching the structural outline of header + hero + N step placeholders, shown while build data is fetching; on Firestore error, show inline error message with a retry action (no blank screen, no full-page spinner) (FR-021, Edge Cases).
- [ ] T006 [US1] Position Video card after build order in `src/views/builds/BuildDetails.vue` — `v-card` placed below the build-order section; view mode: `v-img` YouTube thumbnail + play `v-icon` + duration; omit the card entirely if `build.video` is empty (FR-017, Edge Cases). Touch `src/components/builds/BuildOrderEditor.vue` only if a card-wrapping adjustment is needed to accommodate the new card order on mobile.
- [ ] T007 [US1] Add mobile view-mode step layout to `src/components/builds/BuildOrderSectionEditor.vue` — `hidden-md-and-up` template branch: `v-card variant="tonal"` per step; CSS grid `display:grid; grid-template-columns:repeat(5,1fr); gap:5px;` on the resource row; fixed order Builder · Food · Wood · Gold · Stone; unset slot renders as a dim placeholder tile (`opacity:0.35`) so the column position is always stable (FR-005, design-input.md §3 "Fixed 5-slot grid"). Desktop branch untouched.
- [ ] T008 [P] [US1] Add villager total read-only badge in view mode to `src/components/builds/BuildOrderSectionEditor.vue` — computed as `(food ?? 0) + (wood ?? 0) + (gold ?? 0) + (stone ?? 0) + (builder ?? 0)`; displayed as `v-chip size="small"` (villager icon + number, no text label); never directly editable (FR-006, data-model.md "Derived value").
- [ ] T009 [P] [US1] Add timestamp display in view mode to `src/components/builds/BuildOrderSectionEditor.vue` — render `step.time` as a `v-chip` / plain text element (FR-007 — stored verbatim, no derivation).
- [ ] T010 [US1] Add icon-rendered step note in view mode to `src/components/builds/BuildOrderSectionEditor.vue` — mobile branch renders `step.description` using the existing `::id::` → icon-tile path (same as desktop, reusing `IconToolTip` class tints); raw shortcodes must not be visible; step note text ≥ 13 px (SC-003, FR-008). WYSIWYG contenteditable is **not** used in view mode.

**Checkpoint**: US1 complete — 390 px viewport, published build. Zero horizontal scroll, slim header, lean 3-chip hero, 5-slot steps with inline icons, description collapses/expands, video card present. SC-001 / SC-002 / SC-003 satisfied.

---

## Phase 4: User Story 2 — Edit a Build Step on a Phone (Priority: P1)

**Goal**: An author on a 390 px phone can change a resource count (villager total recomputes), edit a timestamp, focus a step note and insert an icon at the caret position, add a step, remove a step, and remove an age-up with the age-down confirmation — all without caret jumps or data desync.

**Independent Test**: On 390 px in edit mode: (1) change a resource slot value, confirm villager total recomputes live; (2) edit a timestamp and confirm it saves verbatim; (3) focus a step note, open icon picker, tap an icon, confirm it is inserted at the caret (not appended); (4) add and remove a step; (5) remove an age-up and confirm the dialog removes the age-up + all subsequent steps on confirm. SC-004 / SC-005 pass.

### Implementation for User Story 2

- [ ] T011 [US2] Create `src/composables/useIconRichText.js` — implement: `mount(initialString)` (shortcodes → DOM, sets innerHTML once), `serialize()` (walks child nodes: text nodes → text, `img.ic[data-token]` → `::token::`), `savedRange` tracking (save on `selectionchange`/`blur` within the host), and focused/blurred write-gating (reactive `value` updated from `serialize()` on `input` debounced; Vue → DOM writes only when NOT focused). Round-trip identity contract: `serialize(deserialize(s)) ≡ s` and `deserialize(serialize(x)) ≡ x`. (FR-013, SC-004, plan.md "Critical: WYSIWYG — Failure mode A")
- [ ] T012 [US2] Add `insertIcon(token)` to `src/composables/useIconRichText.js` — restore `savedRange` (validate it is inside this host), `range.deleteContents()`, create `<img class="ic" data-token="{token}" contenteditable="false">` + trailing ` ` text node, insert via `range.insertNode`, set caret immediately after inserted node (`range.setStartAfter(node); range.collapse(true)`), re-save `savedRange`. Use `@mousedown.prevent` / `pointerdown.prevent` on the picker trigger button so focus never leaves the field. One insert primitive shared by picker and autocomplete. (FR-012, SC-005, plan.md "Critical: WYSIWYG — Failure mode B")
- [ ] T013 [US2] Wire `useIconRichText` as the WYSIWYG step-note host in edit mode in `src/components/builds/BuildOrderSectionEditor.vue` — mobile edit branch: `contenteditable` div styled at `height:26px; border-radius:4px; line-height:1.7; vertical-align:middle; user-select:none` for icon tiles; `mount()` called once on step load; `@input` calls `serialize()` (debounced) to update the reactive value; Vue never re-writes `innerHTML` while the field is focused. Empty note shows placeholder text (disappears on content). (FR-013, FR-015, Edge Cases)
- [ ] T014 [US2] Add focus-revealed Insert-icon button + `v-bottom-sheet` picker in `src/components/builds/BuildOrderSectionEditor.vue` — `v-btn variant="text" size="small"` shown only while the step note is focused (`v-show="noteIsFocused"`); `@mousedown.prevent` preserves caret; opens a `v-bottom-sheet` wrapping the existing `IconSelector.vue` (no reimplementation); on icon selection calls `useIconRichText.insertIcon(token)`. See design-input.md §2 "Insert-icon button" and "Icon picker bottom sheet". (FR-015, FR-012)
- [ ] T015 [US2] Wire `IconAutoCompleteMenu` to the WYSIWYG note in `src/components/builds/BuildOrderSectionEditor.vue` — inline `::` trigger reuses existing `IconAutoCompleteMenu.vue`; on icon select, delete the typed `::query` range first, then call `useIconRichText.insertIcon(token)`. The same `insertIcon` path as the picker — no separate caret logic. (FR-008)
- [ ] T016 [P] [US2] Add tap-to-type resource slots in edit mode to `src/components/builds/BuildOrderSectionEditor.vue` — each of the 5 grid positions: `v-text-field type="number" density="compact" hide-details variant="plain"` bound to `step.food / .wood / .gold / .stone / .builder`; on change, villager total recomputes live (computed property from T008 already covers this). (FR-005, FR-006, clarified NC-2)
- [ ] T017 [P] [US2] Add editable timestamp in edit mode to `src/components/builds/BuildOrderSectionEditor.vue` — `v-text-field density="compact" hide-details style="width:56px"` bound to `step.time`; stores value verbatim (no parsing/validation) (FR-007).
- [ ] T018 [US2] Add age-up ✕ remove with age-down confirmation to `src/components/builds/BuildOrderSectionEditor.vue` — `v-btn icon size="small" mdi-close` on each age-up row; opens `v-dialog max-width="340"` with title `Age down to {previous age}?`, body `This removes the {age} age-up and {N} step(s) after it — everything from this point on. This can't be undone.`, actions `Cancel` (text) + `Age down` (destructive `color="error"`); on confirm, remove the age-up section and all subsequent sections from `buildOrderSections`. (FR-010, FR-011, SC-007, design-input.md §4 "Age-down confirmation")
- [ ] T019 [P] [US2] Add step ✕ remove to `src/components/builds/BuildOrderSectionEditor.vue` — `v-btn icon size="small" mdi-close` on each step row; removes step immediately, no confirmation; same ✕ shape as age-up remove (FR-010). Edge case: removing the last/only step leaves an empty `steps[]` array, not null.
- [ ] T020 [US2] Wire `BuildHeader.vue` slim header into `src/views/builds/BuildEditor.vue` for mobile — on `hidden-md-and-up`, use the slim header component from Phase 2; leave `md-and-up` markup untouched (SC-006). Video card on edit route: `v-card` with URL `v-text-field` + existing YouTube validation/preview, placed after the build order (FR-017).

**Checkpoint**: US2 complete — 390 px edit mode. Resource slot change recomputes villager total. Timestamp saves verbatim. Icon inserts at caret (not appended). Step add/remove works. Age-down dialog removes age-up + all subsequent steps. SC-004 / SC-005 pass.

---

## Phase 5: User Story 3 — Manage a Build from a Phone (Priority: P2)

**Goal**: A build owner on a phone can reach all management actions (Edit, Delete, Duplicate, Export, Download, Discard) from the overflow menus, and save Draft/Publish from the sticky action bar — without those actions cluttering the slim header.

**Independent Test**: As owner on 390 px view route: open ⋮ overflow, confirm all owner actions present including Delete. As non-owner: open overflow, confirm no Delete or Edit. In edit route: open overflow, confirm no Delete and no Preview. Scroll edit route; confirm sticky bar shows Unsaved-changes + Draft + Publish. Focus a resource slot; confirm action bar scrolls off. Dismiss keyboard; confirm bar reappears.

### Implementation for User Story 3

- [ ] T021 [US3] Implement owner-gated view-route overflow in `src/views/builds/BuildDetails.vue` — wire the ⋮ `v-menu` stub from T002: non-owner list = Favorite · Like · Dislike · — · Share · Copy to overlay tool · Download as file · Duplicate to my builds · — · Report; owner list additionally includes Edit + Delete build (destructive, owner-gated via existing `useVerificationGuard`). Exact copy from design-input.md §4 "View hero overflow". (FR-019)
- [ ] T022 [P] [US3] Implement edit-route overflow in `src/views/builds/BuildEditor.vue` — `v-menu` + `v-list`: Duplicate · Copy to overlay tool · Download as file · — · Discard changes. **No** Delete build. **No** Preview. Exact copy from design-input.md §4 "Edit hero overflow". (FR-019)
- [ ] T023 [US3] Add sticky bottom action bar to `src/views/builds/BuildEditor.vue` — `v-sheet` / `div` `position: fixed; left:0; right:0; bottom:0; z-index: ...`; contents: "Unsaved changes" `v-chip`/text (`v-show="isDirty"`), Draft `v-btn variant="outlined"`, Publish `v-btn color="accent"`; add matching `padding-bottom` to the page scroll container so content is never hidden behind the bar. Bar is **not** pinned above the keyboard — relies on browser default scroll behavior so it scrolls off when keyboard opens and reappears on dismiss. (FR-018, clarified keyboard behaviour, design-input.md §2 "Sticky edit action bar")

**Checkpoint**: US3 complete — owner sees Delete on view route only; edit overflow has no Delete/Preview; sticky bar shows Unsaved-changes + Draft + Publish; bar scrolls off when keyboard opens.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation of acceptance criteria that span all stories.

- [ ] T024 [P] Desktop regression check — open `src/components/builds/BuildHeader.vue`, `BuildOrderSectionEditor.vue`, `src/views/builds/BuildDetails.vue`, `BuildEditor.vue` at `md-and-up` viewport and verify every screen renders pixel-identically to before this branch (SC-006). All mobile additions are behind `hidden-md-and-up` / `d-md-none` guards.
- [ ] T025 [P] WYSIWYG round-trip test — create or edit a step with ≥ 3 mixed icons + text; save; reload. Verify: 0 duplicated icons, 0 dropped icons, 0 reordered icons, 0 raw `::id::` shortcodes visible in the rendered view (SC-004, FR-013). Repeat on both dark and light themes.
- [ ] T026 [P] Caret correctness test — perform 20 consecutive icon insertions at varied caret positions (start of empty note, mid-text, end of text, between two existing icons, after a text-then-icon boundary). Verify the caret lands immediately after the inserted icon every time; it never jumps to start or end (SC-005, FR-012).
- [ ] T027 [P] Touch target audit — on 390 px viewport, inspect all interactive controls across view and edit routes. Every control (✕ buttons, chip toggles, overflow ⋮, Insert-icon trigger, action bar buttons) must measure ≥ 44 × 44 px (SC-002).
- [ ] T028 [P] Legibility audit — on 390 px viewport, verify: build-order step text ≥ 13 px; no text on any mobile surface below 12 px; villager total badge, timestamp, resource slot values all readable without pinch-zoom (SC-003).
- [ ] T029 Theme test — verify all modified mobile surfaces (header, hero, step cards, description card, video card, action bar, age-down dialog, icon picker sheet) render correctly in **both** `customDarkTheme` and `customLightTheme`. Check that gold/navy role swap works for the header hairline, chip colours, and action bar accent (Edge Cases, design-input.md §1).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately.
- **US1 (Phase 3)**: Depends on Phase 2 (slim header). Can start as soon as T001–T002 complete.
- **US2 (Phase 4)**: Depends on Phase 2 (slim header). Can start in parallel with US1 after Phase 2.
- **US3 (Phase 5)**: Depends on Phase 2 (overflow stub) + US1 T003 (BuildDetails.vue hero wiring) + US2 T020 (BuildEditor.vue header). In practice, complete US1 + US2 first, then US3.
- **Polish (Phase 6)**: Depends on all stories being complete.

### User Story Dependencies

- **US1** (P1): Starts after Phase 2. Tasks T003–T010 are sequential within BuildDetails.vue + BuildOrderSectionEditor.vue.
- **US2** (P1): Starts after Phase 2. T011 → T012 (sequential in composable) → T013–T020 (mostly sequential in component).
- **US3** (P2): Starts after US1 + US2. T021–T023 can proceed in parallel (T021 is BuildDetails.vue; T022/T023 are BuildEditor.vue).

### Within Each User Story

- WYSIWYG composable (T011 → T012): T012 extends T011 — sequential.
- Resource slots + timestamp edit (T016 [P] + T017 [P]): parallel — different step fields.
- Age-up remove + step remove (T018 + T019 [P]): T019 can start while T018 is in progress (different event paths).
- View overflow + edit overflow (T021 + T022 [P]): parallel — different files.

---

## Parallel Opportunities

```text
# Phase 2 — sequential (same file):
T001 → T002

# Phase 3 — after T003:
T004, T005 [P], T006 can overlap (different sections of BuildDetails.vue)
T008 [P] + T009 [P] can run together (different step-field sub-tasks)

# Phase 4 — sequential core, then parallelizable:
T011 → T012 → T013 → T014 / T015 (can overlap after T013)
T016 [P] + T017 [P] can run together after T013

# Phase 5 — after US1+US2:
T021, T022 [P] can run in parallel (different files)

# Phase 6 — all parallel:
T024 [P] + T025 [P] + T026 [P] + T027 [P] + T028 [P] run together; T029 last
```

---

## Implementation Strategy

### MVP First (User Story 1 Only — 10 tasks)

1. Complete Phase 2: T001, T002 (slim shared header)
2. Complete Phase 3: T003–T010 (view route)
3. **STOP and VALIDATE**: 390 px viewport, published build. Zero scroll, readable steps, working description collapse. (SC-001/002/003)
4. Ship / demo mobile read experience.

### Incremental Delivery

1. Phase 2 → US1 (MVP — read a build) → validate → ship
2. US2 (edit a build step) → validate WYSIWYG gates SC-004/SC-005 → ship
3. US3 (manage build) → validate overflow + action bar → ship
4. Phase 6 (polish) → full acceptance sign-off

---

## Notes

- `[P]` tasks touch different files or independent concerns — safe to run in parallel.
- `[US]` label maps every task to its user story for traceability.
- WYSIWYG composable (`useIconRichText.js`) is the feature's **primary technical risk** — front-load it; see plan.md "Critical: WYSIWYG sync & caret" before starting T011/T012.
- All mobile additions are **additive** behind `hidden-md-and-up` — the desktop markup is never touched.
- No automated test suite; validate manually at each checkpoint using a real device or Chrome DevTools at 390 px.
- Commit after each task or logical group using Conventional Commits (`feat:`, `fix:`, `refactor:`, `style:`).
