---

description: "Task list for 025-eco-crosshair-step-link"
---

# Tasks: Crosshair Readout & Step ↔ Timeline Linking

**Input**: Design documents from `.specify/specs/025-eco-crosshair-step-link/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/useStepHighlight.md](./contracts/useStepHighlight.md),
[quickstart.md](./quickstart.md)

**Tests**: No automated test tasks. This project has no test suite; the constitution requires manual
golden-path verification instead, so verification tasks reference numbered
[quickstart.md](./quickstart.md) items rather than test files.

**Organization**: Grouped by user story. Phases 2–6 map one-to-one onto the commit phases in
[plan.md](./plan.md#phase-sequencing).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1…US5)
- Include exact file paths in descriptions

## Path Conventions

Single-page web application, single project. All source under `src/` at the repository root, per
[plan.md](./plan.md#source-code-repository-root).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish what this feature is verified against. There is no project initialisation —
the app, the toolchain and every dependency this feature uses are already in place.

- [ ] T001 Pick four real builds matching shapes B1 (dense, single-section), B2 (sparse, mostly dashed), B3 (multi-section), B4 (no chartable economy) and record their IDs in the table in `.specify/specs/025-eco-crosshair-step-link/quickstart.md`
- [ ] T002 [P] Start `npm run dev`, open B1 at ≥ 960 px, expand **Economy**, and confirm the plot renders, per the run steps in `.specify/specs/025-eco-crosshair-step-link/quickstart.md` — this is the baseline every later comparison is made against

**Checkpoint**: Verification targets fixed. B3 is the one that matters most — a single-section build
cannot distinguish a flat step index from a section-local one.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Two behaviour-neutral changes that every user story depends on. Both are independently
committable and neither is visible to a reader.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete. In particular, US3 will
silently highlight the wrong row on multi-section builds without T003–T005.

- [X] T003 Add `sectionOffsets(sections)` to `src/composables/builds/useAgeTimings.js`, beside `flattenSections`, returning the flat index at which each section's first step sits; sections with no `steps` array contribute length zero, matching the existing walk exactly
- [X] T004 Replace the inline cursor walk in `resolvedTimes` at `src/components/builds/BuildOrderEditor.vue:218-235` with a call to `sectionOffsets`, and update the comment at lines 213-216 — it predicted this extraction, so it should now describe the helper rather than the absence of one
- [ ] T005 Verify **no behaviour change** from T003–T004 in `src/components/builds/BuildOrderEditor.vue`: on B3, every row's resolved time and every `~` marker is identical to before the refactor (`refactor:` commit boundary)
- [X] T006 Attach `stepIndex` — the index into `flattenSections(steps)` — to each point pushed in `getEcoSeries` in `src/composables/builds/useEcoSeries.js`, before the sort at line 168
- [X] T007 Document in `src/composables/builds/useEcoSeries.js` that points are sorted **after** indices are attached, so `stepIndex` is non-monotonic and array position is never a step index
- [ ] T008 Verify **no visible change** from T006–T007 in `src/composables/builds/useEcoSeries.js`: charts on B1, B2 and B3 render identically, and a build that charts today still charts (`feat:` commit boundary, no user-facing effect)

**Checkpoint**: One sanctioned translation between index spaces exists, and every series point knows
which row it came from. User stories can now begin.

---

## Phase 3: User Story 1 - Read the numbers at a moment without tracing a line (Priority: P1) 🎯 MVP

**Goal**: A vertical rule that snaps to described moments, five dots, and a readout listing all five
villager counts and the time.

**Independent Test**: Open B1 at ≥ 960 px, expand Economy, sweep the pointer across the plot. Rule,
dots and readout appear and track in discrete jumps. Quickstart items 1, 5, 6, 7, 8.

- [X] T009 [US1] Create `src/composables/builds/useStepHighlight.js` implementing [contracts/useStepHighlight.md](./contracts/useStepHighlight.md) — factory only, exported `STEP_HIGHLIGHT` Symbol, no module-level `ref`, no timers, no listeners
- [X] T010 [US1] Call the factory once in `src/views/builds/BuildDetails.vue` and `provide` it under `STEP_HIGHLIGHT`
- [X] T011 [US1] Inject the highlight in `src/components/builds/EcoLines.vue` with a `null` default, so the component still renders where nothing provides it
- [X] T012 [US1] Cache the plot's `getBoundingClientRect` in `src/components/builds/EcoLines.vue`, refreshed on resize and never per pointer move (NFR-005)
- [X] T013 [US1] Add a `pointermove` handler on `.eco-plot` in `src/components/builds/EcoLines.vue` converting the pointer's x to seconds against `scaleSeconds`
- [X] T014 [US1] Implement the nearest-point lookup in `src/components/builds/EcoLines.vue` — linear scan over `series.points` comparing time distance, no maximum radius, so the plot partitions into bands with no dead positions (FR-003)
- [ ] T015 [US1] **Spike first**: confirm a single `v-tooltip` instance in `src/components/builds/EcoLines.vue` can have its `:target="[x, y]"` moved between snaps without re-opening or flickering; if it flickers, disable the open/close transition before building the rest of the readout (plan Risks)
- [X] T016 [US1] Render the snapped rule in `src/components/builds/EcoLines.vue` as a positioned HTML span at the **moment's** x, never the pointer's, following the `.eco-guide` pattern (FR-005, research R-7)
- [X] T017 [US1] Render one dot per resource at the snapped moment in `src/components/builds/EcoLines.vue`, following the `.eco-cap` pattern (FR-006)
- [X] T018 [US1] Build the readout body in `src/components/builds/EcoLines.vue` — all five resources with counts, in `RESOURCES` order, plus the time (FR-007)
- [X] T019 [US1] Compute the readout's side in `src/components/builds/EcoLines.vue` from the rule's position relative to the plot's horizontal midpoint, so it never covers the rule or its dots (FR-011, research R-2)
- [X] T020 [US1] In `src/components/builds/EcoLines.vue`, give the readout's row for the hovered or pinned resource the same emphasis the lines have, without the crosshair clearing or overriding that emphasis (FR-012)
- [X] T021 [US1] In `src/components/builds/EcoLines.vue`, call `setFromPlot(point)` on each snap and `clear('plot')` on `pointerleave` of `.eco-plot`, with no intent delay on either (FR-010, FR-030)
- [ ] T022 [US1] Verify in `src/components/builds/EcoLines.vue` that the crosshair and the existing 12 px line hit strokes coexist — hovering a line still dims the other four while the crosshair is active (FR-013, item 8 of `.specify/specs/025-eco-crosshair-step-link/quickstart.md`)
- [ ] T023 [US1] Verify items 1, 5, 6, 7 of `.specify/specs/025-eco-crosshair-step-link/quickstart.md` on B1 and B2: discrete jumps, everything clears together, the readout flips sides at the midpoint, pinning and the crosshair show at once

**Checkpoint**: US1 is shippable on its own. Combined with US2 below it satisfies SC-001, SC-002 and
SC-003.

---

## Phase 4: User Story 2 - Never show a number the author did not write (Priority: P1)

**Goal**: The readout quotes only stated values, and says so when a time was derived.

**Independent Test**: On B2, hover between two distant points. Every count shown appears verbatim in
the table below; nothing is averaged. Quickstart items 2, 3, 4.

> **Ships in the same commit as US1.** Listed separately for traceability, but US1 must not be
> merged without it — a readout that interpolates is a plot that lies, and it would undo the
> no-smoothing decision inherited from `021`.

- [X] T024 [US2] Clear the active moment when the pointer's position falls outside the range spanned by the first and last drawn points in `src/components/builds/EcoLines.vue`, so hovering past the last point shows nothing rather than snapping backwards (FR-004)
- [X] T025 [US2] Render the readout's time with a leading `~` when `point.stated` is false, matching the age markers' existing convention, in `src/components/builds/EcoLines.vue` (FR-009)
- [X] T026 [US2] Confirm no code path formats, rounds, averages or interpolates a displayed count in `src/components/builds/EcoLines.vue` — every number rendered is the integer from the point (FR-008)
- [ ] T027 [US2] Verify items 2, 3, 4 of `.specify/specs/025-eco-crosshair-step-link/quickstart.md` on B2: values match the table verbatim, `~` appears only on derived times, and the crosshair disappears past the last point

**Checkpoint**: The chart can be quoted. **MVP complete — safe to ship without US3, US4 or US5.**

---

## Phase 5: User Story 3 - From the chart to the step (Priority: P2)

**Goal**: The crosshair identifies its build order row; clicking navigates to it.

**Independent Test**: On B3, hover a moment — the correct row in the correct section highlights.
Click — the page scrolls to it. Quickstart items 9, 10, 11, 12, 13.

- [X] T028 [US3] Inject the highlight in `src/components/builds/BuildOrderEditor.vue` with a `null` default and no-op when absent, so the editor route — where no Timeline card exists — is unaffected (contract: absent injection)
- [X] T029 [US3] Pass each section its flat offset from `sectionOffsets` into `src/components/builds/BuildOrderSectionEditor.vue`, so it can translate between its section-local row index and the shared flat index (FR-029)
- [X] T030 [US3] Highlight the row whose flat index matches `highlight.stepIndex` in `src/components/builds/BuildOrderSectionEditor.vue`, reusing the existing `hoverRowIndex` visual treatment rather than adding a second one (FR-014, spec A-4)
- [X] T031 [US3] Add a click handler on `.eco-plot` in `src/components/builds/EcoLines.vue` calling `requestScroll(stepIndex)` while a moment is active, and doing nothing when none is (FR-015)
- [X] T032 [US3] Remove the `@click="togglePin(line.resource)"` handler from the `.eco-hit` strokes in `src/components/builds/EcoLines.vue` — per the spec clarification, pinning is a legend-only gesture and a plot click must never change it (FR-016)
- [X] T033 [US3] Register an `onScrollRequest` handler in `src/components/builds/BuildOrderEditor.vue` that scrolls the row using `scroll-into-view-if-needed` with `scrollMode: "if-needed"`, `block: "center"`, and `behavior` chosen from `prefers-reduced-motion` (FR-018, research R-4)
- [X] T034 [US3] Keep the scrolled-to row visibly marked long enough to find after the pointer leaves the plot, in `src/components/builds/BuildOrderSectionEditor.vue` (FR-017)
- [ ] T035 [US3] Verify items 9–13 of `.specify/specs/025-eco-crosshair-step-link/quickstart.md` **on B3**: correct section in both the first and last section, centred scroll clear of sticky chrome, no pin change on click, no jump when already visible, reduced-motion jumps

**Checkpoint**: The chart is a way of navigating the build. SC-004 met.

---

## Phase 6: User Story 4 - From the step to the chart (Priority: P2)

**Goal**: Hovering a build order row drops the rule at that step's moment — including for rows that
assign nobody.

**Independent Test**: With the card visible, hover rows on B1 and B4. The rule appears on the age
track. Scroll the card off-screen: nothing is tracked. Quickstart items 14–21.

- [X] T036 [US4] Gate row tracking on `useElementVisibility` over the Timeline card in `src/views/builds/BuildDetails.vue`, so nothing is tracked while the card is off-screen (FR-022, research R-5)
- [X] T037 [US4] Implement the scroll latch in `src/components/builds/BuildOrderEditor.vue` — engage on `scroll`, release only on a pointer move whose `clientX`/`clientY` actually changed, so a browser-synthesised `mousemove` cannot release it (FR-024, research R-6)
- [X] T038 [US4] Widen `hoverStep`/`unhoverStep` at `src/components/builds/BuildOrderSectionEditor.vue:1104-1110` to also publish the hovered row outward, keeping its existing local behaviour intact
- [X] T039 [US4] Translate the section-local row index to a flat index and call `setFromTable(seconds, stated, stepIndex)` in `src/components/builds/BuildOrderEditor.vue`, taking the time from `resolvedTimes` (FR-019)
- [X] T040 [US4] In `src/components/builds/BuildOrderEditor.vue`, apply the same 120 ms intent delay used by the legend before a row hover takes effect, so a pointer crossing rows does not light each in passing (FR-023)
- [X] T041 [US4] Render the rule on the age track in `src/components/builds/AgeTimeline.vue` at the active moment's seconds, whether or not the economy plot is present or expanded (FR-026)
- [X] T042 [US4] Handle the time-only moment in `src/components/builds/EcoLines.vue` and `src/components/builds/AgeTimeline.vue` — a rule with no `point` renders no dots and no counts (FR-020)
- [X] T043 [US4] Do nothing when the hovered row has no resolvable time, in `src/components/builds/BuildOrderEditor.vue` (FR-021)
- [X] T044 [US4] Confirm a row hover never expands a collapsed economy plot in `src/components/builds/AgeTimeline.vue` (FR-025)
- [ ] T045 [US4] Verify items 14–21 of `.specify/specs/025-eco-crosshair-step-link/quickstart.md`, **especially item 19** — wheel-scroll with the pointer resting over a row and confirm rows do not light up in sequence; and item 16 on B4, where no plot exists

**Checkpoint**: Both directions work. SC-005, SC-007, SC-008 met.

---

## Phase 7: User Story 5 - Readers who do not use it pay nothing (Priority: P3)

**Goal**: The page at rest is indistinguishable from before the feature.

**Independent Test**: Load a build without hovering; compare against `main`.

- [ ] T046 [US5] Compare a build page at rest against `main` — identical card height, layout and resting appearance, with no crosshair, dots or readout in the DOM until the pointer moves (SC-006, item 22 of `.specify/specs/025-eco-crosshair-step-link/quickstart.md`)
- [ ] T047 [US5] Open a page rendering more than one build (home lanes, preview cards) and confirm highlights are not shared between them — the factory, not module state, is what guarantees this (FR-028, item 23 of `.specify/specs/025-eco-crosshair-step-link/quickstart.md`)

**Checkpoint**: All user stories independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T048 [P] Lift the crosshair's magic numbers in `src/components/builds/EcoLines.vue` into named constants beside `HOVER_DELAY_MS`, each with the reasoning that chose the value — matching the file's existing convention
- [X] T049 Confirm the figure in `src/components/builds/EcoLines.vue` is still `aria-hidden` and that no focusable control was introduced inside it; every value the crosshair reveals is present in the table below (NFR-006)
- [ ] T050 Run the full script in `.specify/specs/025-eco-crosshair-step-link/quickstart.md`, items 1–23, across B1–B4
- [ ] T051 Self-review the diff across every file listed in `.specify/specs/025-eco-crosshair-step-link/plan.md` for unused code, duplicated patterns and hardcoded strings, per the constitution's pre-merge checklist
- [ ] T052 [P] Update **Status** in `.specify/specs/025-eco-crosshair-step-link/spec.md` and record any deviations accepted during implementation, following the pattern `023` used

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **US1 (Phase 3)** → **US2 (Phase 4)**: Same commit; US2's guards must land before US1 is merged
- **US3 (Phase 5)** and **US4 (Phase 6)**: Both depend on US1. **Independent of each other** — either
  order, or in parallel
- **US5 (Phase 7)**: Verification only; depends on whichever stories shipped
- **Polish (Phase 8)**: Last

### Critical path

```text
T003─T005 (offsets)  ──┐
                       ├──►  T009─T023 (US1)  ──►  T024─T027 (US2)  ──►  MVP ships
T006─T008 (stepIndex) ─┘                                │
                                                        ├──►  T028─T035 (US3)
                                                        └──►  T036─T045 (US4)
```

T003–T005 must precede US3. Skipping the extraction and hand-rolling a third offset walk is exactly
how a section-local index reaches the shared state.

### Within each user story

- The `useStepHighlight` contract (T009) before any consumer
- Geometry and lookup (T012–T014) before rendering (T016–T019)
- **T015 before T016–T019** — the tooltip spike gates how the readout is built, not the reverse
- **T032 before T035** — verifying "no pin change on click" is meaningless while the handler is still
  attached

### Parallel Opportunities

- T001 and T002 in Phase 1
- Within Phase 2, T003–T005 and T006–T008 touch different files and can proceed in parallel; both
  must land before US3
- Once US1 is complete, **US3 and US4 can be developed in parallel** — they share only the composable
  and touch different halves of it
- T048 and T052 in Phase 8

---

## Parallel Example: Phase 2

```bash
# Two independent behaviour-neutral changes, different files:
Task: "Add sectionOffsets() to src/composables/builds/useAgeTimings.js and adopt it in BuildOrderEditor.vue"
Task: "Attach stepIndex to each point in src/composables/builds/useEcoSeries.js"
```

## Parallel Example: after US1

```bash
# Different halves of the link, sharing only the composable:
Task: "US3 — chart to step: row highlight and click-to-scroll"
Task: "US4 — step to chart: row hover, viewport gate, scroll latch, age-track rule"
```

---

## Implementation Strategy

### MVP (US1 + US2)

1. Phase 1: Setup — fix the verification builds
2. Phase 2: Foundational — two behaviour-neutral commits
3. Phases 3–4: the crosshair and its honesty guards
4. **STOP and VALIDATE**: quickstart items 1–8
5. Ship. This alone answers the original complaint — you stop needing to *follow* a line once you
   can *read* all five at once

### Incremental Delivery

1. Foundational → nothing visible, two commits safely on `main`
2. + US1/US2 → **MVP**, shippable
3. + US3 → the chart becomes navigation
4. + US4 → the loop closes
5. US5 is verification of all of the above, not new work

### Solo strategy

This is a solo project; the parallel notes above describe what is *safe* to interleave rather than
work to split between people. The practical order is straight down the list, stopping to validate at
each checkpoint.

---

## Notes

- **[P] = different files, no dependencies.** Most of this feature touches the same two components,
  so genuine parallelism is limited to Phase 2 and the US3/US4 split
- Commit at each phase boundary; the boundaries were chosen in
  [plan.md](./plan.md#phase-sequencing) to be independently reviewable
- **Every index-related check runs on B3.** A single-section build cannot tell a flat index from a
  section-local one, so B1 will pass while B3 is broken
- **`points[i].stepIndex !== i`** — points are sorted after indices attach
- The most likely source of unplanned time is T015 (tooltip flicker). It is deliberately placed
  before the readout is built, not after
