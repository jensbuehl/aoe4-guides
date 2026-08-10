---

description: "Task list for 029-step-reordering"
---

# Tasks: Reorder Steps and Notes

**Input**: Design documents from `.specify/specs/029-step-reordering/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/use-step-reorder.md](./contracts/use-step-reorder.md)

**Tests**: No formal test suite — the constitution requires manual testing of the golden path
instead, and [quickstart.md](./quickstart.md) is that path, gated per phase. One throwaway
harness (T010) covers the move arithmetic, which is the only part worth driving in isolation.

**Organization**: Grouped by user story so each is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel — **different files**, no dependency on incomplete work
- **[Story]**: US1…US5, mapping to the user stories in spec.md

> **[P] is rare in this feature, and that is not an oversight.** Almost all of the work lands
> in one 3,700-line file, `BuildOrderSectionEditor.vue`. Two tasks that both edit it are not
> parallel no matter how unrelated they look, so [P] appears only where the files genuinely
> differ. Marking more would be a lie that costs a merge conflict.

## Path Conventions

Vue 3 SPA, single project. Source under `src/`; no `tests/` directory (see Tests above).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the regression witness **before** anything changes. Half the quickstart
compares against `main`, and that comparison is impossible to make after the fact.

- [ ] T001 Capture the regression baseline from `main` — screenshots of B-plain's build page (steps table, age timeline, economy chart) and its overlay export JSON — saving them outside the repo for quickstart items 41–47
- [ ] T002 [P] Confirm the three fixture builds named in [quickstart.md](./quickstart.md) exist — B-plain, B-alt (one Feudal alternatives block, two paths of differing length, one common step before the age-up), B-long (last section off screen when the first is in view) — authoring B-alt if it does not exist

**Checkpoint**: A baseline exists that later phases can be measured against.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The id fix and the coordinator. Every user story depends on both.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Promote `_nextStepId` from per-`setup()` to module scope in `src/components/builds/BuildOrderSectionEditor.vue`, so two sections mounting in the same millisecond cannot hand out identical `_id` sets (research [R-6](./research.md#r-6--_id-collides-across-sections-today-by-construction))
- [X] T004 [P] Create `src/composables/builds/useStepReorder.js` exporting the `STEP_REORDER` symbol and the factory shell per [contracts/use-step-reorder.md](./contracts/use-step-reorder.md) — a factory, never module-level state, because two builds can be on screen
- [X] T005 Implement `registerSection` / `unregisterSection` and the build-wide drop-position ordering (section index, then draft index) in `src/composables/builds/useStepReorder.js`
- [X] T006 Implement `moveBy` and `canMove` in `src/composables/builds/useStepReorder.js`, where one step is **the adjacent drop position, not the adjacent entry** (research [R-7](./research.md#r-7--the-unit-of-movement-is-the-drop-position-not-the-neighbour))
- [X] T007 Implement the drag session — `begin`, `setTarget`, `commit`, `cancel` — in `src/composables/builds/useStepReorder.js`, including the downward-move index adjustment and the no-op guard that makes an unchanged position emit nothing
- [X] T008 [P] Provide the coordinator from `src/components/builds/BuildOrderEditor.vue` under `STEP_REORDER`, alongside the section refs it already keeps
- [X] T009 Implement the `SectionHandlers` surface — `entryCount`, `entryAt`, `gapInsideBlock`, `detach`, `attach`, `syncEdits`, `emit`, `focusEntry` — in `src/components/builds/BuildOrderSectionEditor.vue`, registering on mount and unregistering on unmount; `detach` and `attach` splice **both** `steps` and `stepsCopy` and **must not emit**
- [X] T010 Verify the move arithmetic — position ordering, marker pass-through, the downward index adjustment, crossing a boundary — with a throwaway harness at the repo root that registers two fake sections over plain arrays, then delete the harness

**Checkpoint**: The coordinator resolves positions and moves entries. No UI yet.

---

## Phase 3: User Story 1 - Fix the order on desktop by dragging (Priority: P1) 🎯 MVP

**Goal**: An author can drag a step or note to a new position within one section, by a handle,
without disturbing text selection in the description cells.

**Independent Test**: Drag a step from position 5 to position 2 within one section, save,
reload → it is at position 2 with its content unchanged.

### Implementation for User Story 1

- [X] T011 [US1] Add the drag handle to the row actions cell in `src/components/builds/BuildOrderSectionEditor.vue`, revealed on row hover the way `.row-x` already is, inside the existing 90px `.step-actions` cell — **no new column**, because the insert rows span `colspan="9"`
- [X] T012 [US1] Implement the pointer drag in `src/components/builds/BuildOrderSectionEditor.vue` — `pointerdown` on the handle, `setPointerCapture`, `pointermove`, `pointerup`, and `Escape` to cancel — calling `begin` / `setTarget` / `commit` / `cancel` on the injected coordinator
- [X] T013 [US1] Resolve the drop position by hit-testing the `.ins-row` elements' bounding boxes in `src/components/builds/BuildOrderSectionEditor.vue`, picking the nearest by vertical midpoint (research [R-2](./research.md#r-2--the-drop-target-already-exists-and-it-already-draws-the-line))
- [X] T014 [US1] Mark the resolved insert row as the active drop position in `src/components/builds/BuildOrderSectionEditor.vue`, styling the line the editor already draws rather than adding a second kind of line
- [X] T015 [US1] Style the lifted row in `src/components/builds/BuildOrderSectionEditor.vue` with a CSS transform, honouring `prefers-reduced-motion`
- [X] T016 [US1] Confirm a drop on the origin position emits nothing and leaves `isDirty` untouched, in `src/components/builds/BuildOrderSectionEditor.vue`
- [ ] T017 [US1] Run `npm run check:setup` and `npm run check:steps`, then the **Phase 0 and Phase 1 gates** of [quickstart.md](./quickstart.md) (items 1–12) in a browser

**Checkpoint**: Desktop reordering works within a section. Shippable on its own.

---

## Phase 4: User Story 2 - Fix the order on a phone (Priority: P1)

**Goal**: The same reordering on a 390px screen, one press per position.

**Independent Test**: Move a step card up two positions with the card's own controls, save,
reload → it is two positions earlier with its content intact.

### Implementation for User Story 2

- [X] T018 [US2] Add persistent move-up and move-down `v-btn`s to `.step-action-row-xs` in `src/components/builds/BuildOrderSectionEditor.vue`, for both the step card and the note card, without increasing the 28px row height
- [X] T019 [US2] Wire both controls to `moveBy`, and their `disabled` state to `canMove`, in `src/components/builds/BuildOrderSectionEditor.vue` — **disabled, not hidden**, so the control row keeps a constant width
- [X] T020 [US2] Keep the moved card in view in `src/components/builds/BuildOrderSectionEditor.vue` by reusing the existing `scroll-into-view-if-needed` call pattern from `scrollToStep`, with its `scrollMode: "if-needed"` and reduced-motion handling
- [ ] T021 [US2] Run `npm run check:setup`, then the **Phase 2 gate** of [quickstart.md](./quickstart.md) (items 13–18) at 390px

**Checkpoint**: Both P1 stories work. This is the point the feature earns its keep.

---

## Phase 5: User Story 3 - Move a step into or out of an alternative (Priority: P2)

**Goal**: An entry crosses a merge line and changes path membership.

**Independent Test**: Move a step from below the merge line to above it, save, reload → it is
stored inside that path; move it back and it is common again.

> **This phase should need almost no code.** Membership is position, so a move across a merge
> line is the same splice as any other. If it turns out to need a special case, the positional
> model has been broken somewhere in Phase 2 or 3 — that is what this phase is for finding.

### Implementation for User Story 3

- [X] T022 [US3] Confirm marker rows expose no drag handle and no move controls in `src/components/builds/BuildOrderSectionEditor.vue`, and that `begin` refuses a marker so a stray handler cannot open a session on one
- [ ] T023 [US3] Verify in a browser that the drop position **above** the merge marker and the one **below** it render as visibly distinct targets, and adjust only the indicator styling in `src/components/builds/BuildOrderSectionEditor.vue` if they read as one line
- [ ] T024 [US3] Run the **Phase 3 gate** of [quickstart.md](./quickstart.md) (items 19–27) on B-alt, paying particular attention to item 25 — the untouched path keeping every step at every point
- [X] T025 [US3] If any special-casing proved necessary, record what and why in [research.md](./research.md); the model predicted none, and a silent exception here is the finding that matters most to whoever reads this next

**Checkpoint**: Alternatives reordering works, and the positional model is confirmed or the
exception is written down.

---

## Phase 6: User Story 4 - Move a step to another age section (Priority: P2)

**Goal**: An entry moves between sections in both directions, carrying its content.

**Independent Test**: Move a step from the last position of one section to the first of the
next, save, reload → it belongs to the second section, content unchanged.

> **All the risk in this feature is in this phase.** Sections do not share state, and until
> now nothing has moved between two of them.

### Implementation for User Story 4

- [X] T026 [US4] Extend the drag hit-test in `src/components/builds/BuildOrderSectionEditor.vue` so insert rows in **other** sections resolve as drop positions, reporting them to the coordinator with their owning section index
- [X] T027 [US4] Implement the cross-section path of `commit` in `src/composables/builds/useStepReorder.js` — `syncEdits()` on **both** sections before either splices, then `detach` from the source, `attach` to the destination, then one `emit()` per touched section, both after the attach
- [X] T028 [US4] Restore focus to the moved entry in the destination section after two `nextTick`s, following the precedent `addStep` already sets, in `src/composables/builds/useStepReorder.js` and `src/components/builds/BuildOrderSectionEditor.vue`
- [X] T029 [US4] Confirm a section emptied by a move keeps existing and shows its ordinary empty state with its insert line, in `src/components/builds/BuildOrderSectionEditor.vue`
- [X] T030 [US4] Enforce in `src/composables/builds/useStepReorder.js` that no single move both crosses a section boundary and joins or leaves a path — an alternatives block lives inside one section, and that invariant must hold at every position, not only at rest
- [X] T031 [US4] Add edge-proximity scrolling during a drag in `src/components/builds/BuildOrderSectionEditor.vue`, so a section that was off screen when the drag began can still be reached
- [ ] T032 [US4] Run `npm run check:setup` and `npm run check:steps`, then the **Phase 4 gate** of [quickstart.md](./quickstart.md) (items 28–36), checking item 35 hardest — no duplicated row, none left behind, none stale

**Checkpoint**: The whole editing model works. Everything after this is reach and polish.

---

## Phase 7: User Story 5 - Reorder without a mouse (Priority: P2)

**Goal**: Every move is reachable by keyboard.

**Independent Test**: With no pointing device, move a step one position in each direction.

### Implementation for User Story 5

- [X] T033 [US5] Make the drag handle focusable with an accessible name saying what it moves, in `src/components/builds/BuildOrderSectionEditor.vue` — the handle **is** the keyboard control, because four buttons do not fit in a 90px cell (research [R-9](./research.md#r-9--the-handle-is-the-keyboard-control))
- [X] T034 [US5] Bind `ArrowUp` / `ArrowDown` on the focused handle to `moveBy` in `src/components/builds/BuildOrderSectionEditor.vue`, keeping focus on the moved entry's handle so repeated presses repeat the move
- [ ] T035 [US5] Run the **Phase 5 gate** of [quickstart.md](./quickstart.md) (items 37–40), including `Tab` reaching both mobile controls at 390px

**Checkpoint**: All five stories complete.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T036 Run the **regression gate** of [quickstart.md](./quickstart.md) (items 41–47) against the T001 baseline — reading view unchanged, economy chart and timeline link still addressing the right entries, focus mode playing through, and the overlay export **byte-identical** for a build nobody reordered
- [X] T037 Reconcile `.specify/specs/027-build-alternatives/spec.md`, whose scope guard and Assumptions both state that drag-and-drop reordering is out of scope — true when written, wrong now that 029 has shipped it. Record that its prediction held: the two-marker pattern made this an insert-and-delete problem with no migration
- [X] T038 Self-review the diff for unused code, duplicated UI patterns, magic numbers and hardcoded strings, per the constitution's pre-merge checklist
- [X] T039 Harvest per the working rules in `CLAUDE.md` — at minimum the `_id` collision (a trap that cost real time to find) and the drop-position-not-neighbour formulation (a cause, not a symptom), each written in one place only

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. Must genuinely come first — T001's baseline cannot be captured retroactively
- **Foundational (Phase 2)**: Depends on Setup. **Blocks every user story**
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on Foundational only — it consumes `moveBy`, not the drag. Genuinely independent of US1
- **US3 (Phase 5)**: Depends on US1 (drag) and US2 (press) to have something to exercise across a merge line
- **US4 (Phase 6)**: Depends on US1 and US2. Independent of US3
- **US5 (Phase 7)**: Depends on US1, since the handle it binds to is US1's
- **Polish (Phase 8)**: Depends on everything intended for the release

### Within Each User Story

Model → coordinator → surface → verify. The gate task closes each phase; do not open the next
phase's gate until it passes.

### Parallel Opportunities

Real ones, and there are only three:

- **T002** alongside T001 — fixture authoring is independent of baseline capture
- **T004** alongside T003 — a new composable file versus an edit to the section editor
- **T008** alongside T005–T007 — `BuildOrderEditor.vue` versus `useStepReorder.js`

Everything else in Phases 3–7 edits `BuildOrderSectionEditor.vue` and must be sequential.

---

## Implementation Strategy

### MVP

Phases 1 → 2 → 3 → 4. Both P1 stories, because shipping desktop drag alone leaves the phone
with no way to reorder at all — which is the state the feature exists to fix.

**Stop and validate** at the Phase 2 gate of quickstart.md before going further.

### Incremental Delivery

1. Setup + Foundational → the coordinator moves entries, nothing renders
2. + US1 → desktop drag within a section
3. + US2 → **MVP: both surfaces reorder**
4. + US3 → alternatives (mostly confirmation)
5. + US4 → cross-section (the risk)
6. + US5 → keyboard
7. Polish → regression, reconciliation, harvest

Each increment leaves the editor working. US4 is the only phase that can plausibly be dropped
from the release without leaving a half-feature behind, since within-section reordering stands
on its own.

### Solo Working Notes

This is a one-developer project, so the template's parallel-team strategy does not apply.
What matters instead:

- **Commit per task or logical group**, in Conventional Commits form, per the constitution
- **`npm run check:setup` after every `.vue` change.** A green `npm run build` compiles
  templates and cannot catch a `ReferenceError` in `setup()`, which throws at render and
  blanks the component behind a passing build
- **`npm run check:steps` after touching anything that reads a build**
- **Say plainly what has not been verified.** Rendering, layout and interaction need a
  browser; no static check in this repo sees any of them
