---

description: "Task list for Build Order Alternatives (027)"
---

# Tasks: Build Order Alternatives

**Input**: Design documents from `.specify/specs/027-build-alternatives/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: No automated test tasks. This project has no test suite by constitutional decision
(*"No formal test suite is required, but manual testing of the golden path MUST be done before
merging"*). [quickstart.md](./quickstart.md) items 1–44 are the verification, and each phase below
ends at the gate that covers it.

**Organization**: Grouped by user story. The commit boundaries from
[plan.md § Phase Sequencing](./plan.md#phase-sequencing) appear as checkpoints — **US1 contains two
of them**, because the add menu ships before alternatives exist.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Touches different files from its neighbours — safe to reorder or interleave
- **[Story]**: US1–US4, matching spec.md
- Paths are repository-relative

---

## Phase 1: Setup (Baselines)

**Purpose**: Capture what "unchanged" means *before* changing anything. FR-017 and SC-005 require
builds without alternatives to be untouched, and that is only provable against a baseline taken now.

- [ ] T001 Pick and record the four test builds named in [quickstart.md](./quickstart.md) — B-plain, B-alt (to author later), B-rewind (an existing build with no economy chart), and one legacy build with no `type` on its sections — as URLs in a scratch note
- [ ] T002 [P] Export B-plain to overlay format from `main` and save the JSON as the byte-diff baseline for quickstart item 3
- [ ] T003 [P] Capture reference screenshots of B-plain in light and dark: desktop steps table, mobile steps list at 390px, economy chart, age timeline
- [ ] T004 [P] Confirm B-rewind currently shows **no** economy chart, and record which build it is — this is the SC-007 witness

**Checkpoint**: Baselines exist. Every later regression claim is now checkable rather than asserted.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Collapse four section-walks into one, then teach that one about paths. Nothing here is
visible to a user; everything after it depends on it.

**⚠️ CRITICAL**: T005–T008 must be behaviour-neutral. If any screenshot or the export JSON changes,
stop and find out why before continuing.

### Retire the duplicate flatteners (plan Phase 0, research R-2)

- [X] T005 Replace the inline section walk in `onMounted` with a `flattenSections(props.build.steps)` call in `src/components/builds/FocusMode.vue`, keeping the `section.gameplan` folding and the `.png`→`.webp` rewrite as a post-pass over the returned list
- [X] T005a Route `readAgeUpMarkers` and `readAgeMarkers` through `sectionOffsets` in `src/components/builds/FocusMode.vue` — **added during implementation**: both kept private cursors over `section.steps.length`, a fifth derivation of the flat index space that would desync the moment a block contributed a different count
- [X] T006 Replace `convertSectionsToSteps` with a `flattenSections` call in `src/composables/converter/useExportOverlayFormat.js`, **preserving the `step.age` stamping exactly as it is** — including that it mutates the source step (pre-existing; not this commit's business)
- [ ] T007 Run quickstart items 1–5 and diff the export JSON against the T002 baseline — must be byte-identical
  - **Code-level equivalence proved** (harness, 8 build shapes): old vs new export flatten, exported payload, focus flatten, and section offsets all match on every well-formed shape, with step identity preserved by reference.
  - **One behaviour change found and accepted**, on a section object with **no `steps` key at all**: the old export emitted an `undefined` entry and then threw `Cannot read properties of undefined`, and the old focus-mode walk threw `"undefined" is not valid JSON`. Both now skip the section. Strictly an improvement, unreachable from any build the editor can produce, but **not** byte-identity — recorded rather than hidden.
  - **Still needed from a browser**: quickstart 1–2 and 4–5 (B-plain renders and plays, legacy build renders, console clean), plus a real export diff against a live build.

**Checkpoint (commit: `refactor:`)** — one flattener, no behaviour change. Quickstart gate 1–5.

### Teach it about paths (research R-1, contract [flatten-sections.md](./contracts/flatten-sections.md))

- [X] T008 Extend `flattenSections(sections, selection?)` in `src/composables/builds/useAgeTimings.js` to splice in a block's active path per the contract — guarantees G-1…G-7, active-path resolution `selection` → `main` → `paths[0]`
- [X] T009 Extend `sectionOffsets(sections, selection?)` in `src/composables/builds/useAgeTimings.js` so a block contributes its active path's step count, satisfying invariant O-1
- [X] T010 Verify the five existing call sites still compile and behave with the optional argument omitted (`AgeTimeline.vue`, `BuildOrderEditor.vue`, `useEcoSeries.js`, `FocusMode.vue`, `useExportOverlayFormat.js`) — this is guarantee G-3, and no build has a block yet, so all output must be unchanged
  - 22 contract checks pass: G-1…G-7, O-1, A-3, A-4, F-3, and every fall-through in active-path resolution (out-of-range, non-integer, stale blockId, no main, two mains). `npm run build` clean.
- [X] T011 [P] Create the shared selection composable in `src/composables/builds/useActivePath.js` — a **factory** provided per page, mirroring `useStepHighlight.js` (module-level state would let two builds on screen share one selection)

**Checkpoint**: The seam exists and is inert. Every user story below is now additive.

---

## Phase 3: User Story 1 — Author two ways to play from one point (Priority: P1) 🎯 MVP

**Goal**: An author can insert a note or an alternatives block where they want it, give each path a
title, a condition and its own steps, and have it survive a reload.

**Independent Test**: In the editor, insert an alternatives block, author two paths with
titles/descriptions/steps, add a common step after the block, save, reload — everything intact
(quickstart 11–16).

### Slice A — the add menu and notes (plan Phase 1; ships alone, touches no existing build data)

- [X] T012 [US1] Replace the two bottom-anchored add buttons with a `v-menu` + `v-list` add menu on the existing inline `ins-zone` rows in `src/components/builds/BuildOrderSectionEditor.vue`, offering Step / Note / Age up / Alternatives
  - Extracted as `src/components/builds/StepInsertMenu.vue` — the menu appears in **7** places across four layout states, and the activator is slotted so each keeps its own styling (Principle III).
  - **Alternatives is not yet an entry**: it lands with T019, in Slice B. Shipping a permanently disabled entry would teach the wrong thing. Slice A's menu is Step / Note / Age up.
  - Also replaced: the bottom-anchored **"Age up to X"** button in `BuildOrderEditor.vue`, which FR-007 covers and the task text did not name. It is now a menu entry, emitted upward as `ageUpRequested`.
- [X] T012a [US1] Read edited contenteditable cells by row index and field name rather than by counting `tr.step-row` and taking column seven, in `src/components/builds/BuildOrderSectionEditor.vue` — **forced by note rows**: a note is one wide cell where a step is nine narrow ones, so the positional read found the wrong cell on the first note in a section and every row after it. Affected `addStep`, `removeStep`, and all three `::` autocomplete entry points
- [X] T013 [US1] Attach the same menu to the mobile `step-insert-xs` dividers in `src/components/builds/BuildOrderSectionEditor.vue`, keeping tap targets ≥44px
- [X] T014 [US1] Render context-invalid entries as **disabled with the reason in a tooltip** rather than hiding them, in `src/components/builds/BuildOrderSectionEditor.vue` (FR-007) — Age up carries two reasons: "An age-up can only be added at the end of the build" and "The build already reaches the Imperial Age"
- [X] T015 [US1] Insert a note as a step carrying `gameplan` at the chosen index in `src/components/builds/BuildOrderSectionEditor.vue` (FR-019, data-model §2b)
- [X] T016 [US1] Render a step-level note — desktop row and mobile card, read and edit — reusing the existing note field with `::` autocomplete and icon picker, in `src/components/builds/BuildOrderSectionEditor.vue`
- [X] T017 [US1] Remove the `|| !readonly` arm at `src/components/builds/BuildOrderSectionEditor.vue:560` so a section with no note shows **no** note row, while an existing section note keeps rendering and stays editable in place (FR-020, no migration) — same change applied to the mobile `gameplan-card-xs`, which was also unconditional in edit mode
- [X] T018 [P] [US1] Carry a note's `gameplan` text into the exported step's `notes` in `src/composables/converter/useExportOverlayFormat.js`, so a note is not exported as an empty step (FR-021)

**Checkpoint (commit: `feat:`)** — menu and notes. Quickstart gate 6–10g. **Shippable on its own.**

*Code complete; `npm run build` clean. Module-level verification passes for the note's four
behaviours (kept by `saysNothing` and `redundantMask`, exempt from the autoplay timing gate,
contributing no economy point, exported with its text and its icon token). **Quickstart 6–10g still
needs a browser** — menu placement, tap targets, tooltips on disabled entries, and the absence of the
old note row are all visual.*

### Slice B — authoring alternatives (plan Phase 2, part 1)

*New in this slice: `src/composables/builds/alternativesDraft.js`. The document
nests a block; the editor needs a flat run with markers, because "above the merge
line" is only meaningful as a position. The two shapes are converted at the edges
— expanded when a section loads, collapsed on every emit — so no marker can ever
reach Firestore. 26 round-trip checks pass, including that deleting a marker
lifts every path's steps back and that an unclosed marker seals rather than
drops work.*

- [X] T019 [US1] Insert the complete bracket in one action — opening marker, one path with one empty step, closing merge marker — with **no "Close" entry anywhere** in the menu, in `src/components/builds/BuildOrderSectionEditor.vue` (FR-008)
- [X] T020 [US1] Render the block in the editor: `mdi-call-split` opening marker, `mdi-call-merge` merge line, `v-tabs` path tabs, **+ Add alternative**, and a **Set as main** toggle, in `src/components/builds/BuildOrderSectionEditor.vue` (FR-009)
- [X] T021 [US1] Add the path `title` field (plain text, one line) and `description` field reusing the **existing** step-note rich field with `::` autocomplete and icon picker, in `src/components/builds/BuildOrderSectionEditor.vue` (FR-010)
- [X] T022 [US1] Implement positional membership — a step inserted above the merge line joins the active path, below it is common — in `src/components/builds/BuildOrderSectionEditor.vue` (FR-006)
- [X] T023 [US1] Deleting either marker removes the bracket and **lifts every path's steps back into the section**, in `src/components/builds/BuildOrderSectionEditor.vue` (FR-011, invariant B-4)
- [X] T024 [US1] Strip markup from `title` on save (matching how `PLAIN_TEXT_STEP_FIELDS` treats `time` and the resource cells) and run `description` through the existing `sanitizeStepDescription`, in `src/components/builds/BuildOrderEditor.vue` (contract: titles reach a chart legend and a focus-mode bar, neither of which renders HTML)
- [X] T025 [US1] Disable the **Alternatives** and **Age up** menu entries with their reasons when the caret is inside a path, in `src/components/builds/BuildOrderSectionEditor.vue` (admission A-4; A-5 needs no enforcement — it is structurally impossible)

**Checkpoint (commit: `feat:`)** — US1 complete. Quickstart gate 11–16. SC-001.

### Slice C — the mobile editor (FR-013a; found during testing, not in the original plan)

- [X] T025a [US1] Extract the path tab bar as `src/components/builds/AlternativePathTabs.vue`, used by the desktop table and the mobile card flow — and by the reader's pick control in US2, which is the same control with the editing affordances off
- [X] T025b [US1] Render block markers as cards in both mobile loops in `src/components/builds/BuildOrderSectionEditor.vue`. **This was a defect, not a gap**: markers matched neither `isNote` nor a step, fell through to the step-card branch, and drew blank editable cards an author could type into
- [X] T025c [US1] Nest the block's rail inside the gold age rail on mobile — each card's rail overhangs 4px, half the 8px card gap, so consecutive rails meet and read as one line

**Checkpoint (commit: `feat:`)** — mobile authoring. Quickstart 9 and 20 cover it.


---

## Phase 4: User Story 2 — Read a build and choose a path (Priority: P1)

**Goal**: A reader sees that a decision exists, picks a path, follows its steps in a coloured lane,
and sees the build continue commonly after it — on both breakpoints.

**Independent Test**: Open a build with a block on desktop and at 390px — a pick control appears, a
choice renders that path's steps in a lane, and the steps after the block show regardless
(quickstart 17–22).

**Depends on**: US1 (there must be a build with a block to read). This is stated in the spec itself.

- [ ] T026 [P] [US2] Create `src/components/builds/AlternativesPick.vue` — the pick control, with desktop-row, mobile-card and focus-beat variants driven by props, using `v-btn-toggle`/`v-btn`
- [ ] T027 [P] [US2] Create `src/components/builds/AlternativesLane.vue` — the rail wrapping an active path's steps, 3px secondary, **no closing cap** in the reading view
- [ ] T028 [US2] Render the pick-one row on desktop at one table-row height, **titles only**, option controls sized to content and not stretched, in `src/components/builds/BuildOrderSectionEditor.vue` (FR-012)
- [ ] T029 [US2] Render the collapsed-detour state when one path carries `main` — main path on the main line exactly as a build without alternatives, others as one slim condition row expanding in place, in `src/components/builds/BuildOrderSectionEditor.vue` (FR-005)
- [ ] T030 [US2] Persist the expanded/collapsed state per build id so it survives a return visit, in `src/composables/builds/useActivePath.js`
- [ ] T031 [US2] Render the mobile pick card — options stacked full-width, ≥44px, description on a second line, sharing the step cards' width, radius and border — in `src/components/builds/BuildOrderSectionEditor.vue` (FR-013)
- [ ] T032 [US2] Make the mobile path rail **continuous** with the pick card's rail and **nested inside** the gold age rail, in `src/components/builds/BuildOrderSectionEditor.vue`
- [ ] T033 [US2] Provide the selection from the build page and pass it through to `flattenSections`/`sectionOffsets`, in `src/views/builds/BuildDetails.vue` and `src/components/builds/BuildOrderEditor.vue`
- [ ] T034 [US2] Sticky pick card while scrolling inside a path on mobile, so the active choice is never off-screen, in `src/components/builds/BuildOrderSectionEditor.vue`
- [ ] T035 [US2] Verify B-plain against the T003 screenshots on both breakpoints, light and dark (FR-017, SC-005)

**Checkpoint (commit: `feat:`)** — US2 complete. Quickstart gate 17–22. SC-002, SC-005.

---

## Phase 5: User Story 3 — See what a path costs in the economy graph (Priority: P2)

**Goal**: One path drawn at a time, named in the legend, with the split's span shaded and the
selection shared with the steps view in both directions.

**Independent Test**: Open the economy graph for a build with a block — the legend offers the paths,
exactly one is drawn, the span is shaded, and switching in either place moves both (quickstart 23–30).

**Depends on**: US2 for the shared selection. **`getEcoSeries` itself needs no change** — it receives
a linear list either way (research R-1, R-3).

- [ ] T036 [US3] Pass the shared selection into the `getEcoSeries` call path in `src/components/builds/EcoLines.vue` and `src/views/builds/BuildDetails.vue`
- [ ] T037 [US3] Add the path selector as its **own control in the legend region** — not a sixth resource entry — in `src/components/builds/EcoLines.vue`, leaving the existing hover-dim and click-pin gestures untouched (research R-7)
- [ ] T038 [US3] Shade the split's time span and bound it with vertical markers, keeping resource colours and icons unchanged, in `src/components/builds/EcoLines.vue`
- [ ] T039 [US3] Wire two-way selection sync so switching in the steps table redraws the chart and switching in the legend moves the table, via `src/composables/builds/useActivePath.js`
- [ ] T040 [US3] Clear the step highlight on every path switch (invariant S-2) in `src/composables/builds/useActivePath.js` — a `stepIndex` taken under the old selection points at a different step under the new one
- [ ] T041 [US3] Open on the `main` path when there is one, else the first path, in `src/components/builds/EcoLines.vue` (FR-014)
- [ ] T042 [US3] Verify SC-007 with the T004 witness: convert B-rewind to use a block and confirm it now draws a chart, **and** that an unconverted rewinding build still correctly draws none

**Checkpoint (commit: `feat:`)** — US3 complete. Quickstart gate 23–30. SC-003, SC-007.

---

## Phase 6: User Story 4 — Choose a path mid-game in focus mode (Priority: P2)

**Goal**: The pick appears at the split without moving anything around it, the clock never stalls, the
active path is named afterwards, and the choice stays reversible until the rejoin.

**Independent Test**: Run focus mode through a build with a block — pick appears, countdown falls back
if untouched, path is named, mid-detour switch works (quickstart 31–39).

**⚠️ The timer is what is under test.** Watch the clock, not the cards.

- [ ] T043 [US4] Extract the `onMounted` queue construction into a `buildQueue(selection)` function in `src/components/builds/FocusMode.vue`, preserving the existing order — timings, then provenance, then markers, then the redundant filter over all five parallel arrays (research R-5)
- [ ] T044 [US4] Rebuild the queue on path switch and **re-seek by elapsed time**, never by index — the new cursor is the last step whose `startTime <= totalElapsedTime` — in `src/components/builds/FocusMode.vue`
- [ ] T045 [US4] Render the pick in the step-content area only, leaving header, progress bars, resource dock and transport controls unmoved, in `src/components/builds/FocusMode.vue` (FR-015)
- [ ] T046 [US4] Add the countdown fallback to `main` (else first path), its length the gap to the next step capped around 10s, so auto-advance never stalls, in `src/components/builds/FocusMode.vue`
- [ ] T047 [US4] Add the ~22px active-path bar with an explicit **switch** control as a **new grid row track** — not an inserted element, or the bar stretches (design-input implementation note) — in `src/components/builds/FocusMode.vue`
- [ ] T048 [US4] Use the secondary colour for the pick, never gold, so it cannot be mistaken for a transport button, in `src/components/builds/FocusMode.vue` (FR-016)
- [ ] T049 [US4] Collapse the pick to two short titles side by side at the micro tier, dropping descriptions and the countdown label but keeping the countdown bar, in `src/components/builds/FocusMode.vue`
- [ ] T050 [US4] Ensure voice-over does not announce the pick as a step, and does announce the chosen path's first step, in `src/components/builds/FocusMode.vue`

**Checkpoint (commit: `feat:`)** — US4 complete. Quickstart gate 31–39. SC-004.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T051 [P] Audit every alternatives affordance for colour and mark: secondary only, never gold; `mdi-call-split` for the branch and `mdi-call-merge` for the close, never a rotated split (FR-016, SC-006)
- [ ] T052 [P] Check every new control in light and dark at both breakpoints (quickstart 41)
- [ ] T053 [P] Check keyboard reachability and operation of the add menu, the pick control and the path tabs (quickstart 43)
- [ ] T054 Export B-alt to overlay format and confirm the active path is flattened onto the main line with no marker row and no empty step (FR-018, quickstart 42)
- [ ] T055 Review `firestore.rules` against the schema change and record the outcome — the block is nested in the existing `build.steps` field, so no rules change is expected, but Principle V requires the review to happen and be stated
- [ ] T056 Run the full quickstart 1–44 end to end on a fresh session, confirming no new console warnings

---

## Dependencies & Execution Order

### Phase order

```
Setup (T001–T004)
   └─> Foundational (T005–T011)          ← blocks everything
          └─> US1 (T012–T025)            ← Slice A shippable at T018
                 └─> US2 (T026–T035)
                        ├─> US3 (T036–T042)
                        └─> US4 (T043–T050)   ← independent of US3
                               └─> Polish (T051–T056)
```

### Story dependencies — stated honestly

The template's default is that user stories are mutually independent. **Here they are not, and
pretending otherwise would produce a wrong plan:**

- **US1** depends only on Foundational. It is the MVP.
- **US2** depends on US1 — there must be a build containing a block before there is anything to read.
  The spec says so directly (*"Depends on Story 1"*).
- **US3** depends on US2 for the shared selection (FR-014 requires one selection across both).
- **US4** depends on US1 only. It holds its **own session selection**, so it could in principle land
  before US2 — but doing so would ship a pick control in focus mode for builds nobody can read
  normally. Sequenced after US3 to match the spec's priorities and to put the lower-risk surface first.

### Within Foundational

T005–T007 (behaviour-neutral refactor) **must complete and be verified** before T008–T009 (the
signature change). Landing them together makes the byte-diff gate meaningless — there would be no
commit at which "nothing changed" is the expected result.

### Parallel opportunities

This is a solo project, so `[P]` means "different files, safe to interleave or reorder" rather than
"assign to another developer":

- **T002, T003, T004** — three independent baseline captures
- **T011** — `useActivePath.js` is a new file, writable any time during Foundational
- **T018** — the export change is in a different file from the rest of Slice A
- **T026, T027** — the two new components are new files and independent of each other
- **T051, T052, T053** — three independent audits

Everything else in US1 and US2 touches `BuildOrderSectionEditor.vue` and must be sequential. That
single file is the critical path of this feature (research R-4).

---

## Implementation Strategy

### Two shippable increments before the feature exists

1. **Setup + Foundational** → one flattener, behaviour unchanged. Ship it. (`refactor:`)
2. **US1 Slice A (T012–T018)** → the add menu and positional notes. Ship it. Design-input records
   that reviewers already found the bottom-anchored add buttons confusing, and this slice fixes that
   whether or not alternatives ever land. (`feat:`)

### Then the feature

3. **US1 Slice B** → authoring works, nothing reads it yet. Validate with quickstart 11–16.
4. **US2** → the payoff. **This is the MVP of the feature proper**; stop and validate here.
5. **US3**, then **US4** → each independently shippable on top.
6. **Polish** → the cross-cutting audits and the full quickstart run.

### Where this will overrun

`BuildOrderSectionEditor.vue` — 2196 lines, four layout states, and US1 and US2 both add to it. If a
phase runs long it is Phase 3 or 4. **Cut mobile polish before cutting the component extraction**
(T026, T027): inlining a fifth state into that file is how it becomes unworkable.

---

## Notes

- `[P]` = different files, no dependency on an incomplete task
- Commit at the five checkpoints; the plan's phase sequencing and these checkpoints are the same
  boundaries
- Every phase ends at a quickstart gate — do not open the next gate until the current one passes
- **Not in scope, deliberately**: splitting `BuildOrderSectionEditor.vue` into desktop and mobile
  components. It deserves a standalone `refactor:`, named in the plan and kept out of this feature
- **Not in scope, per spec Assumptions**: drag-and-drop reordering, overlay round-trip import, civ
  filtering from path descriptions
