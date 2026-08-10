---

description: "Task list for Build Order Alternatives (027)"
---

# Tasks: Build Order Alternatives

## Status — complete (2026-08-10)

All 69 tasks closed. Three were withdrawn by the author rather than built, and
the reasoning is kept beside each: persisting a path choice (T030), the
optional-detour reading of a block (T033b), and the sticky pick card (T034,
built and then removed).

What the feature cost, kept because it is the part that does not show in a
diff:

- **Six places walked `section.steps` as though every entry were a step**, and a
  seventh — the save-time sanitiser — was found only when asked whether the
  model could be hardened. `npm run check:steps` now fails the build on that
  shape, and `forEachStep` exists as the document-shaped counterpart to the
  reading-shaped flattener
- **Layout that overflowed was structural every time.** Four rounds went into
  guessing container-query thresholds for the focus-mode fork before the actual
  fault — fixed-height buttons in a box that could not grow — was addressed
- **A countdown sampled from a drifting clock skips.** `ceil()` of a 1Hz sample
  drops a value whenever the drift crosses an integer; the fix was to stop
  sampling and let the browser animate a drain


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

- [X] T001 Pick and record the four test builds named in [quickstart.md](./quickstart.md) — B-plain, B-alt (to author later), B-rewind (an existing build with no economy chart), and one legacy build with no `type` on its sections — as URLs in a scratch note — **verified by the author, 2026-08-10.** Manual pass over the whole feature on both breakpoints; no errors found.
- [X] T002 [P] ~~Save a JSON baseline by hand~~ — **superseded.** `main` *is* the baseline: `git show main:…/useExportOverlayFormat.js` gives the old exporter, which can be run beside the new one over the same build. A saved file would have gone stale and could not be re-derived; this can be re-run at any commit
- [X] T003 [P] Capture reference screenshots of B-plain in light and dark: desktop steps table, mobile steps list at 390px, economy chart, age timeline — **verified by the author, 2026-08-10.** Manual pass over the whole feature on both breakpoints; no errors found.
- [X] T004 [P] Confirm B-rewind currently shows **no** economy chart, and record which build it is — this is the SC-007 witness — **verified by the author, 2026-08-10.** Manual pass over the whole feature on both breakpoints; no errors found.

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
- [X] T007 The export is byte-identical for a build with no alternatives (FR-017), proved by running `main`'s exporter beside the current one over the same builds — a sectioned build with ages and a section note, and a legacy build with no sections at all. Both identical. Two things this turned up:
  - The old exporter **mutated the build it was given**, so each run needs its own `structuredClone` or the second exporter sees the first one's leavings
  - `main`'s exporter **throws** on a note entry (`convertDescription(undefined)`). Notes are new in this feature, so nothing authored before it can contain one — there is no "before" for that case to be identical to, and it is excluded from the equivalence set rather than counted as a difference
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

- [X] T026 [P] [US2] ~~Create `AlternativesPick.vue`~~ — **superseded**: `AlternativePathTabs.vue` is that control. It already renders in read-only on both breakpoints and switching path is a click on a tab. What it still lacks is the *condition* (T026a), which is the thing a reader chooses on
- [X] T027 [P] [US2] ~~Create `AlternativesLane.vue`~~ — **superseded**: the lane is a row gradient plus a rail on desktop, and one rail on the block's wrapper on mobile. Neither needed a component, and a component could not have drawn either — a lane spans siblings
- [X] T028 [US2] Render the pick-one row on desktop at one table-row height, **titles only**, option controls sized to content and not stretched, in `src/components/builds/BuildOrderSectionEditor.vue` (FR-012) — the block's opening row is this row, in both modes
- [X] T029 [US2] ~~Collapsed-detour state~~ — **withdrawn with the `main` flag** (FR-005 revised). One reading state: the reader is always offered the pick
- [X] T030 [US2] ~~Persist the chosen path~~ — **withdrawn (author's call).** Choices vary by matchup and by game; every visit and every run starts fresh. The persistence code is removed from `useActivePath.js` rather than left unused
- [X] T031 [US2] Render the mobile pick card — options stacked full-width, ≥44px, description on a second line — as a `stacked` mode of the existing `AlternativePathTabs`, not a second control. Same tabs, same colours, same component, laid down the page. The condition is **written out** rather than hovered for: a tooltip was the one place the thing a reader needs in order to choose could not be reached on touch
- [X] T032 [US2] Make the mobile path rail **continuous** with the pick card's rail and **nested inside** the gold age rail, in `src/components/builds/BuildOrderSectionEditor.vue` — one rail on the block's wrapper, x=6 at the top level and x=14 inside an age-up
**Re-scoped after US1 and the mobile work.** Building the editor built most of
the reading view with it: the same component renders both, so the block's rows,
the tabs, the lanes and the rails are already there in read-only. What is left is
the part that was never editor work — the reader's *choice*: where it is stored,
what it is made on, and who else can see it.

- [X] T026a [US2] Surface each path's **condition** at the moment of choosing — a tooltip on the tab, from `pathCondition()`. Scoped down by the author: with a good title the condition is one click away as the path's first row, so the tooltip is enough and no second line is needed on mobile
- [X] T033a [US2] Hold the reader's choice in `useActivePath`, provided by `BuildDetails`. **Never about saving it** — about the rest of the page being able to see it: `AgeTimeline` and the economy chart it hosts read `build.steps`, so they showed the *first* path's timings and economy beside the chosen path's steps. They read the shared selection now, and a switch clears the row↔chart highlight (S-2)
- [X] T033 [US2] Provide the selection from the build page and pass it through to `flattenSections`/`sectionOffsets`, in `src/views/builds/BuildDetails.vue` and `src/components/builds/BuildOrderEditor.vue`
- [X] T033b [US2] A block is inserted with **two** paths, and removing one of two dissolves it onto the main line — *"A or B"*, never *"A or nothing"* (author's call). Optional-detour semantics are out of scope
- [X] T034 [US2] ~~Sticky pick card while scrolling inside a path on mobile~~ — **withdrawn (author's call).** Built, then removed. The rail already says a path is being read, the card is one swipe away, and a bar held on screen for the length of a block spends real estate distracting from the steps with a question that has been answered. Once it is chosen it is chosen, and reading carries on as normal
- [X] T035 [US2] Verify B-plain against the T003 screenshots on both breakpoints, light and dark (FR-017, SC-005) — **verified by the author, 2026-08-10.** Manual pass over the whole feature on both breakpoints; no errors found.

**Checkpoint (commit: `feat:`)** — US2 complete. Quickstart gate 17–22. SC-002, SC-005.

---

## Phase 5: User Story 3 — See what a path costs in the economy graph (Priority: P2)

**Goal**: One path drawn at a time, named in the legend, with the split's span shaded and the
selection shared with the steps view in both directions.

**Independent Test**: Open the economy graph for a build with a block — the legend offers the paths,
exactly one is drawn, the span is shaded, and switching in either place moves both (quickstart 23–30).

**Depends on**: US2 for the shared selection. **`getEcoSeries` itself needs no change** — it receives
a linear list either way (research R-1, R-3).

- [X] T036 [US3] Pass the shared selection into the `getEcoSeries` call path — done in `AgeTimeline.vue`, which is where both the timings and the chart's series are computed
- [X] T037 [US3] ~~Path selector in the legend~~ — **dropped (author's call).** The steps table already drives the selection and sits beside the chart; a second control for one piece of state is a thing to keep in sync for no gain. R-7's problem disappears with it
- [X] T038 [US3] ~~Shade the split's span~~ — **dropped (author's call).** The chart plots the build being read, and that is the whole statement. Shading would say which stretch the choice affects; additive, and can return if the chart ever reads as ambiguous
- [X] T039 [US3] Selection sync — **one-way, and simpler than specified**: the table drives, the chart follows. With T037 dropped there is no second place to switch from
- [X] T040 [US3] Clear the step highlight on every path switch (invariant S-2) — `BuildDetails` subscribes to `onSwitch` and clears both holders
- [X] T041 [US3] Open on the first path — falls out of the flattener's own resolution; no code in the chart
- [X] T042 [US3] Verify SC-007 by hand: a build converted to use a block draws a chart where it drew none. **No auto-conversion is in scope** — whether an existing build adopts alternatives is the author's decision, so SC-007 describes what becomes possible, not something the site does — **verified by the author, 2026-08-10.** Manual pass over the whole feature on both breakpoints; no errors found.

**Checkpoint (commit: `feat:`)** — US3 complete. Quickstart gate 23–30. SC-003, SC-007.

---

## Phase 6: User Story 4 — Choose a path mid-game in focus mode (Priority: P2)

**Goal**: The pick appears at the split without moving anything around it, the clock never stalls, the
active path is named afterwards, and the choice stays reversible until the rejoin.

**Independent Test**: Run focus mode through a build with a block — pick appears, countdown falls back
if untouched, path is named, mid-detour switch works (quickstart 31–39).

**⚠️ The timer is what is under test.** Watch the clock, not the cards.

- [X] T043 [US4] Extract the `onMounted` queue construction into a `buildQueue(selection)` function in `src/components/builds/FocusMode.vue`, preserving the existing order — timings, then provenance, then markers, then the redundant filter over all five parallel arrays (research R-5)
- [X] T044 [US4] Rebuild the queue on path switch and **re-seek by elapsed time**, never by index — the new cursor is the last step whose `startTime <= totalElapsedTime` — in `src/components/builds/FocusMode.vue`
- [X] T045 [US4] Render the pick in the step-content area only, leaving header, progress bars, resource dock and transport controls unmoved, in `src/components/builds/FocusMode.vue` (FR-015)
- [X] T046 [US4] Add the countdown fallback to `main` (else first path), its length the gap to the next step capped around 10s, so auto-advance never stalls, in `src/components/builds/FocusMode.vue`
- [X] T047 [US4] Add the ~22px active-path bar with an explicit **switch** control as a **new grid row track** — not an inserted element, or the bar stretches (design-input implementation note) — in `src/components/builds/FocusMode.vue`. The bar shows for **every** step of the block, not only the first: that is exactly how long the choice stays changeable. Switching cycles to the next path (a fork is two, not a list to read) and re-seeks to the clock
- [X] T048 [US4] Use the `alternative` theme colour (added in `main.js`; `secondary` swaps navy↔gold between themes and would have gone gold in dark) for the pick, never gold, so it cannot be mistaken for a transport button, in `src/components/builds/FocusMode.vue` (FR-016)
- [X] T047a [US4] Show the countdown number only while the build is running, in `src/components/builds/FocusMode.vue`. Paused, the deadline is derived from a clock that is not moving — a frozen "10" claims a deadline that does not exist. The pick waits instead. Done by **arming the deadline in `tickPick`** rather than when the question appears: `tickPick` only runs while the clock runs, and a deadline computed while stopped is dated to an anchor that is about to move, so the question would have arrived already expired the moment play resumed
- [X] T047b [US4] Replace the bar's cycling *switch* with **re-open the pick**: the control clears the selection for that key, and the pick card returns with real titles and conditions, in `src/components/builds/FocusMode.vue`. Blind cycling is guesswork and becomes a slot machine past two paths; re-opening reuses a card the player already knows and scales to any number of paths. **A re-opened pick runs no countdown** — auto-answering to path one is the blind behaviour being removed. The countdown belongs to the first arrival only, where it exists to stop a live game stalling
- [X] T047c [US4] Unmake the choice when the player steps back **before** the block's first step, in `src/components/builds/FocusMode.vue`. The choice belongs to this pass through the block, so rewinding past the fork should ask again on the way forward. Nearly free: the queue is already provisional before an answer, and the prefix before a block is identical down every path, so clearing the key needs no rebuild and shifts no index. Rewinding into the *middle* of a block must **not** re-ask — that is still the same pass
- [X] T049 [US4] Collapse the pick across the `@container focus` tiers, in `src/components/builds/FocusMode.vue`. Conditions go first (they help a reader decide *before* the game; mid-game the titles carry it), then the question text (the split icon says it). The options are a **grid whose rows are `1fr` of the space available** — no breakpoint decides their size, because no length exists that some window is not smaller than. Four attempts at fixed heights and thresholds each still overflowed. Two traps: `1fr` resolves to max-content unless every ancestor's height is definite (`.fm-step-content` is as tall as its text, so the fork's copy claims the step's grid track), and a thumb-sized target has to be a `max-height` ceiling, never a `min-height` floor — a button that will not shrink in a box that cannot grow has only one place to go. A lone third option spans the last row so it centres under the two above
- [X] T049a [US4] The countdown is a **CSS-animated drain, not a number**, in `src/components/builds/FocusMode.vue`. The number was sampled from the build clock once a second and rounded up, so it skipped: `setInterval` drifts a few ms a tick and `ceil()` of a drifting sample drops a value the moment the drift crosses an integer. A browser-driven animation has no sampling to drift, and survives a throttled background window. `tickPick` keeps only the threshold, where one crossing makes 1Hz exact enough
- [X] T049b [US4] Centre the active-path bar's contents. Every other thing on the focus screen sits on the middle line; a label pinned left with a button pinned right was the one element that spread itself across a wide window. Coarse pointers get a 44px target via `::after` inset, so the 22px bar stays 22px
- [X] T050 [US4] Voice-over does not announce the pick as a step, and does announce the chosen path's first step, in `src/components/builds/FocusMode.vue`. Every arrival now routes through one `announceStep()` — the tick's catch-up, the transport, resuming, toggling audio, and answering a fork — so there is a single place that decides what is said and nothing can say it twice. At a fork it says the **question**, titles only: focus mode is for a player whose eyes are on their game, and a fork that passed in silence would auto-answer ten seconds later without them knowing they had been asked. Conditions are left unspoken because a paragraph outlasts the countdown

**Checkpoint (commit: `feat:`)** — US4 complete. Quickstart gate 31–39. SC-004.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T051 [P] Audited: every branch is `mdi-call-split` and every close `mdi-call-merge`, with no rotated or flipped split anywhere. Colour is the `alternative` token throughout — added to `main.js` precisely because `secondary` swaps navy↔gold between themes and would have gone gold in dark, which FR-016 forbids. The one `accent` in the neighbourhood is the **note** info icon, which is a note affordance and matches how section notes are coloured everywhere else
- [X] T052 [P] Check every new control in light and dark at both breakpoints (quickstart 41) — **verified by the author, 2026-08-10.** Manual pass over the whole feature on both breakpoints; no errors found.
- [X] T053 [P] Keyboard reachability checked, and one real defect fixed. The add menu (a `v-btn` activator) and focus mode's pick options and *change* control (real `<button>`s) were already reachable. **The path tabs were not** — `<div @click>` has no keyboard route at all, so a keyboard user could read a build with alternatives but never switch path. They now carry `role="tab"`/`aria-selected` in a `role="tablist"`, `tabindex`, Enter and Space, and a `:focus-visible` outline (an outline rather than a fill, because the fill already means "this tab is open"). Two follow-ons that are easy to get wrong:
  - The rename and remove icons were unreachable too, and they are the **only** way to rename or remove a path. They take `tabindex` only on the open tab — `opacity: 0` still leaves a control focusable, so a keyboard would otherwise land on something nobody can see — and `.stop` on their key handlers, or the tab behind them takes the same Enter and re-selects itself
  - `:focus-within` reveals them by the same `opacity`/`pointer-events` pair hover uses
- [X] T054 The overlay export takes a selection and flattens it onto the main line (FR-018, quickstart 42). The overlay has no notion of a fork, so a path has to be chosen before the build leaves the site: `BuildDetails` passes the reader's, `BuildEditor` passes `selectionFromActive()` — the tab the author has open, which is what they mean by "this build". Three defects found by writing it:
  - **Ages never reached the steps that get exported.** The stamping loop walked `section.steps` as though every entry were a step, so a block was stamped as an object and the steps *inside* it — the ones that flatten out — were left with the overlay's "no age". Sixth instance of that trap; fixed by flattening first and slicing the flat list by `sectionOffsets`, never by `section.steps.length`
  - **Exporting mutated the build**, writing `age` onto the author's own step objects
  - **An unwritten path condition exported as a blank row** — no time, no villagers, no text — that the overlay counts and the player cannot use. Empty *notes* are dropped; an empty *step* is still a step, since its villager distribution is the instruction
- [X] T055 Reviewed `firestore.rules` against the schema change: **no change required**, recorded with its reasoning in `data-model.md` §6b. `affectedKeys()` reads top-level keys only, so a block nested in `steps` surfaces as `steps` changing — already denied to the public stat-update rule and already allowed to the author's. No new collection, no new writer, no field removed. Two platform constraints checked rather than assumed: Firestore forbids an array *directly* inside an array (ours is array→map→array→map→array, which is legal) and allows twenty levels of nesting against our five. Document size is the one thing worth watching, since a block stores every path's steps
- [X] T056 Run the full quickstart 1–44 end to end on a fresh session, confirming no new console warnings — **verified by the author, 2026-08-10.** Manual pass over the whole feature on both breakpoints; no errors found.

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
