# Tasks: Focus Mode — Floating Window (Document Picture-in-Picture)

**Input**: Design documents from `.specify/specs/023-focus-mode-pip/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/useStepPiP.md](./contracts/useStepPiP.md),
[design-input.md](./design-input.md) (authoritative for every number)

**Tests**: No automated suite exists in this project and none is requested. The constitution asks for
manual golden-path verification, so the verification tasks below are the test plan — SC-001…SC-007
from the spec, scripted in [quickstart.md](./quickstart.md).

**Organization**: Grouped by user story. All four stories are P1; the phase order below follows
plan.md's commit sequence, which is also the dependency order — the layout (US3) must exist before
the floating window (US1) has anything legible to show at 400×230.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

**Note on [P] scarcity**: this feature concentrates in one file. `FocusMode.vue` carries US1 and US3
almost entirely, so tasks within those phases are sequential by necessity, not by choice.

## Path Conventions

Single-project SPA, paths relative to the repository root:

- Components: `src/components/builds/`
- Views: `src/views/builds/`
- Composables: `src/composables/` (app-wide) and `src/composables/builds/` (build-specific)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Orientation and a baseline to measure the NFR-004 "no behaviour change" gate against.
No project initialization is needed — this is an established codebase with no new dependency
(NFR-002).

- [X] T001 Read and note the current wiring before touching anything: the `keyup` registration
      ([`FocusMode.vue:446`](../../../src/components/builds/FocusMode.vue#L446)), the wake lock
      ([`:329`](../../../src/components/builds/FocusMode.vue#L329),
      [`:424`](../../../src/components/builds/FocusMode.vue#L424),
      [`:443`](../../../src/components/builds/FocusMode.vue#L443)), the timer
      ([`:477`](../../../src/components/builds/FocusMode.vue#L477)) and the `speak`/`stop` calls, plus
      the play button in `src/components/builds/BuildOrderEditor.vue`, the focus dialog and share
      dialog wiring in `src/views/builds/BuildDetails.vue`, and the QR view in
      `src/components/builds/BuildShareDialog.vue`
- [ ] T002 [P] Run `npm run dev` and capture baseline screenshots of focus mode at 1920×1080 and
      390×844 and of the Build Order card header at ≥960 px into
      `.specify/specs/023-focus-mode-pip/assets/baseline/` — T010 and T043 compare against these

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The wall-clock clock fix (FR-016) and the two measurements the design leans on. FR-016
is a **prerequisite, not a deliverable of this branch** — it ships as a standalone `fix:` on `main`
because it repairs a live bug for all users and because SC-001 measures drift against it.

**⚠️ CRITICAL**: T003–T005 must land on `main` and this branch must be rebased onto them before
Phase 3 begins. T006 does not block shipping — it only decides whether layer 3 is ever built.

- [X] T003 On **`main`**, not this branch: replace tick-counting with wall-clock derivation in
      `src/components/builds/FocusMode.vue` — add `anchorElapsed` (seconds) and `anchorWallClock`
      (`Date.now()` ms), and derive
      `elapsed = anchorElapsed + (Date.now() − anchorWallClock) / 1000` inside `updateStepProgress()`
      ([`:463`](../../../src/components/builds/FocusMode.vue#L463)) instead of
      `totalElapsedTime.setSeconds(+1)` at
      [`:464`](../../../src/components/builds/FocusMode.vue#L464) (FR-016, data-model §4)
- [X] T004 On **`main`**: re-anchor the clock in `src/components/builds/FocusMode.vue` on session
      start (`onMounted`, [`:415`](../../../src/components/builds/FocusMode.vue#L415)), on manual
      previous/next (`setElapsedTimeToCurrentStepStartTime()`,
      [`:498`](../../../src/components/builds/FocusMode.vue#L498)) and on resume from pause
      (`handleTogglePlayback()`, [`:508`](../../../src/components/builds/FocusMode.vue#L508)) —
      omitting any of the three breaks manual navigation (research.md R-3)
- [ ] T005 On **`main`**: verify on a long build that autoplay transitions match the stated step
      times and that manual prev/next still snaps elapsed time to the step start, then commit as
      `fix: derive elapsed time from a wall clock instead of counting ticks` and rebase
      `023-focus-mode-pip` onto it
- [X] T006 [P] Spike, **not committed**: measure whether a PiP-scheduled `setInterval` survives an
      opener hidden for more than five minutes, using the snippet in
      [quickstart.md](./quickstart.md) "T005 spike". Ticks holding at ~1/s means layer 3 is never
      built; ~1/min means the Web Worker fallback is needed (T049). Record the result in T048

**Checkpoint**: elapsed time is derived from a wall clock, so a late tick can only produce a late
render — never a wrong one. Story work can begin.

---

## Phase 3: User Story 3 - The step is readable in a 320 px window and on a phone (Priority: P1)

**Goal**: Restructure focus mode into a fixed-row grid with three container-query density tiers, so
the same component works in a full-screen dialog, on a phone and in a 320×150 box.

**Independent Test**: Resize a plain browser window from 1200 px down to 320×150 with focus mode
open. No horizontal scrollbar, no clipped control, no text below 11 px, every hit target ≥26 px, and
a step that states no wood/gold/stone shows no column for them.

**Why first**: US1 opens a window at 400×230 and asserts it renders at the compact tier (US1
scenario 1). Without this phase there is no compact tier, and the floating window is a demo.

### Commit A — `refactor: restructure focus mode as a fixed-row grid` (no behaviour change, NFR-004)

- [X] T007 [US3] Replace the `v-row`/`v-col` stack in `src/components/builds/FocusMode.vue`
      (template lines 1–283) with a single grid root, `grid-template-rows: auto auto 1fr auto`
      (header / bars / step / dock) sized to its container, where only the step row flexes and
      nothing scrolls. Keep every existing handler binding, the `v-touch` swipe directive
      ([`:34`](../../../src/components/builds/FocusMode.vue#L34)) and both `v-progress-linear`
      bars (FR-008, design-input §2)
- [X] T008 [US3] Add `container-type: size; container-name: focus;` to the grid root in
      `src/components/builds/FocusMode.vue` and move all **full-tier** sizing into
      `@container focus (...)` blocks — icons 48 px, step type 19 px, play 56 px, other controls
      40 px, title 2 lines (FR-009, design-input §2)
- [X] T009 [US3] Collapse the duplicated xs
      ([`:59`](../../../src/components/builds/FocusMode.vue#L59)) and non-xs
      ([`:107`](../../../src/components/builds/FocusMode.vue#L107)) resource markup in
      `src/components/builds/FocusMode.vue` into one data-driven strip that renders time (in
      `primary`) and villager count always, then only the resource columns the current step states —
      absent, not blank. Keep `aggregateVillagers`/`hasResourceValue` parsing exactly as-is and
      delete the `$vuetify.display.xs` branch (FR-010, design-input §2)
- [ ] T010 [US3] Verify against the T002 baseline at 1920×1080 and 390×844: identical content, no
      console errors, swipe and `←`/`→`/`space` unchanged, `.fm-time--derived` marker still applied.
      Commit as `refactor:` only once this passes (NFR-004)

### Commit B — `feat: density tiers for focus mode`

- [X] T011 [US3] Add the **compact** tier to `src/components/builds/FocusMode.vue` at
      `@container focus (max-width: 520px) or (max-height: 300px)` — icons 38 px, step type 16 px,
      play 40 px, other controls 30 px, single-line ellipsised title, dock padding 7 px (FR-009,
      design-input §2)
- [X] T012 [US3] Add the **micro** tier to `src/components/builds/FocusMode.vue` at
      `@container focus (max-width: 340px) or (max-height: 190px)` — header row dropped, preview line
      dropped, dock becomes one row (resources left, transport right), icons 34 px, step type 14 px,
      play 32 px, others 26 px, resources reduced to time + villagers (FR-009, design-input §2)
- [X] T013 [US3] Move the villager-announcements control
      ([`:244`](../../../src/components/builds/FocusMode.vue#L244)) into a `v-menu` overflow in
      compact and micro in `src/components/builds/FocusMode.vue`, so it can never push the transport
      off the row. Keep it hidden entirely when audio is off, as today (FR-012, NFR-001)
- [X] T014 [US3] Add the next-step preview line to the step row in
      `src/components/builds/FocusMode.vue`: `next m:ss` plus **at most one** token — an age-up
      (`⬆ Feudal`) wins, else the resource delta the next step introduces (`+1 gold`), else nothing.
      11.5 px, secondary colour, omitted on the last step and in micro (FR-011, design-input §2)
- [X] T015 [US3] Make play/pause the visually primary control in
      `src/components/builds/FocusMode.vue` — filled `primary`, 56/40/32 px by tier, with the other
      four as ghost circles on `primary @ 12%` (FR-012, design-input §2)
- [X] T016 [US3] Audit `src/components/builds/FocusMode.vue` for FR-014: no text below 11 px
      anywhere, hit targets ≥44 px at full and ≥26 px at compact and micro; theme tokens only, no
      hex literals outside the existing `:deep(.icon-*)` gradients (NFR-003)
- [ ] T017 [US3] Resize-test in a plain browser window from 1200 px down to 320×150 and at 390×844:
      no scrollbar, no clipping, no empty resource columns, no vertical void in the step row
      (SC-003 partial, SC-006). Commit as `feat:`

**Checkpoint**: focus mode is legible and operable from full screen down to 320×150 — on every
browser, with or without Document PiP.

---

## Phase 4: User Story 1 - Build order above the game on one monitor (Priority: P1) 🎯 MVP

**Goal**: Move the live focus-mode DOM node into a Document Picture-in-Picture window so the session
floats above a windowed-fullscreen game, without restarting the timer, step index or voice-over.

**Independent Test**: In Chrome, open a build, pop out focus mode, click any other application. The
window stays on top, the timer keeps running, and the step advances at its stated time. Close the
window and focus mode is back on the page in the state the window left it in.

**Depends on**: Phase 3 (compact tier), Phase 2 (wall-clock anchor).

- [ ] T018 [US1] **Probe first, before writing the composable**: confirm whether the `v-menu`
      overflow added in T013 teleports to the *opener's* `body` when its subtree is moved into
      another document. Move a node containing the menu into a hand-opened PiP window from the
      console. If it misbehaves, the fix is `:attach` pointed at the focus-mode root — record which
      applies (plan.md Risks, contracts failure modes)
- [X] T019 [US1] Create `src/composables/builds/useStepPiP.js` exposing `supported`
      (`'documentPictureInPicture' in window`, a plain boolean, not a ref), `active` (ref), `open()`
      and `close()`, accepting `{ rootRef, onEnter, onLeave }`. Nothing may touch the DOM until
      `open()` is called (FR-001, contract C-1, C-2)
- [X] T020 [US1] Add a `carryStyles(pipWindow)` helper in `src/composables/builds/useStepPiP.js` that
      copies every `document.styleSheets` entry rule-by-rule into a `<style>` in the PiP head, with a
      `<link>` clone as the fallback for any sheet whose `cssRules` throws `SecurityError`, and
      copies `documentElement.className` plus `colorScheme` (FR-003, research.md R-5)
- [X] T021 [US1] Implement `open()` in `src/composables/builds/useStepPiP.js`:
      `requestWindow({ width: 400, height: 230 })` — no `disallowReturnToOpener`, no
      `preferInitialWindowPlacement` (research.md R-6) — then `carryStyles`, then capture
      `returnParent = rootRef.value.parentElement` **before** the move, then
      `pipWindow.document.body.appendChild(rootRef.value)`. Move, never clone; never mount a second
      instance (FR-002, contract C-3, C-4)
- [X] T022 [US1] Implement `returnNode()` in `src/composables/builds/useStepPiP.js` bound to the PiP
      window's `pagehide`: append the root back to the captured `returnParent`, dispose the PiP
      listeners, set `active` false and call `onLeave()` (FR-004, contract C-4)
- [X] T023 [US1] Make `open()` idempotent in `src/composables/builds/useStepPiP.js` — when
      `documentPictureInPicture.window` is non-null, `focus()` it and return rather than requesting a
      second window (FR-006, contract C-5)
- [X] T024 [US1] Handle a rejected `requestWindow` in `src/composables/builds/useStepPiP.js`: leave
      `active === false`, leave the DOM untouched, and reject with the underlying reason so the
      caller can fall back. No partial state (FR-007, contract C-6)
- [X] T025 [US1] Bind the existing `keyup` handler to `pipWindow.document` for the lifetime of
      `active` via VueUse `useEventListener` in `src/composables/builds/useStepPiP.js`, **without**
      unbinding the opener's own registration at
      [`FocusMode.vue:446`](../../../src/components/builds/FocusMode.vue#L446) (FR-005, contract C-8,
      research.md R-7)
- [X] T026 [US1] On owner unmount in `src/composables/builds/useStepPiP.js` (`onScopeDispose` /
      `onBeforeUnmount`): return the node **and** close the PiP window, because the parent it came
      from is being destroyed. Returning the node alone is not sufficient (FR-004a, contract C-7)
- [X] T027 [US1] Watch the Vuetify theme in `src/composables/builds/useStepPiP.js` and re-run
      `carryStyles` plus the class-list copy when it changes while the window is open — the clones
      are a static snapshot (spec edge cases, research.md R-5)
- [X] T028 [US1] In `src/components/builds/FocusMode.vue`: expose the grid root from T007 as a
      template ref, call `useStepPiP({ rootRef, onEnter, onLeave })`, and render a pop-out control in
      the header when `supported && !active` and a return-to-page control when `active`. The root must
      **not** sit under a `v-if` that could destroy it while `active` (FR-013, contract caller rules)
- [X] T029 [US1] Wire the wake lock into `onEnter`/`onLeave` in
      `src/components/builds/FocusMode.vue` — `release()` on move to the floating window,
      `request("screen")` on return, both guarded so a refusal degrades silently as today (FR-015)
- [X] T030 [US1] Swap the tick source in `src/components/builds/FocusMode.vue`: while `active`,
      schedule the session interval on `pipWindow` (`pipWindow.setInterval`) instead of the opener,
      reverting on return. The swap must clear and reissue only the interval **handle** — it must not
      re-anchor the clock, restart, skip or double-fire, and step index, elapsed time and the pending
      speech queue stay continuous in both directions (FR-024, FR-025, data-model §4)
- [X] T031 [US1] In `src/views/builds/BuildDetails.vue`: close the floating window and end the
      session cleanly on any navigation away from the build page — the platform will **not** do this
      for a client-side route change (research.md R-4). Tear down timer, speech queue and wake lock;
      cover both the route guard and `focusDialog` being closed (FR-004a, US1 scenario 4)
- [ ] T032 [US1] Verify SC-001 (10 autoplay steps in the floating window with another application
      focused, drift ≤1 s), SC-002 (pop out and close mid-session on a 42-step build, state
      preserved both ways, current step **not** re-spoken) and SC-003 (operable at 320×150, 400×230,
      600×340). Commit as `feat: document picture-in-picture target for focus mode`

**Checkpoint**: the feature works end to end from inside focus mode. A player can pop out, alt-tab
into the game and follow the build. The entry point on the build page is still the old text link.

---

## Phase 5: User Story 2 - Play is the obvious action on a build page (Priority: P1)

**Goal**: Replace the text play link in the Build Order header with a filled split button whose menu
offers the three play targets, remembering the last one used.

**Independent Test**: Load a build at ≥960 px and at 360 px. In both, the play control is the only
filled button in the Build Order card, its body runs the last-used target, and the caret lists
exactly Play here / Floating window / Send to phone.

**Depends on**: Phase 4 for the Floating window target to have somewhere to go. Everything else in
this phase stands alone.

- [X] T033 [P] [US2] Create `src/composables/usePlayTargetPreference.js` mirroring
      `src/composables/useThemePreference.js`: exported `PLAY_TARGET_STORAGE_KEY =
      "aoe4-guides-play-target"`, a getter returning `'here' | 'floating' | 'phone' | null` that
      yields `null` for anything unrecognised, and a setter (FR-021, research.md R-8, data-model §1)
- [X] T034 [US2] Replace the text `v-btn` and its wrapping `v-tooltip` at
      [`BuildOrderEditor.vue:21-40`](../../../src/components/builds/BuildOrderEditor.vue#L21) with a
      Vuetify `v-btn-group`, `density="comfortable"`: body `color="primary" variant="flat"
      prepend-icon="mdi-play"` labelled **Play**, 28 px tall, plus a 26 px `mdi-menu-down` caret. The
      `build-card-section-header` must stay 36 px (FR-017, FR-018, NFR-001, design-input §4)
- [X] T035 [US2] Add the `v-menu` to `src/components/builds/BuildOrderEditor.vue`, anchored
      bottom-end at 268 px wide, containing exactly three `v-list-item`s with icon, title and
      one-line description per design-input §4 — `mdi-play-circle-outline` Play here,
      `mdi-picture-in-picture-bottom-right` Floating window,
      `mdi-cellphone-link` Send to phone. No badges, no decoration. Floating window is **omitted
      entirely** when `useStepPiP`'s `supported` is false — never present-and-disabled (FR-019,
      US2 scenario 4)
- [X] T036 [US2] Route the chosen target from `src/components/builds/BuildOrderEditor.vue` through
      to `src/views/builds/BuildDetails.vue`: extend the `activateFocusMode` emit to carry the target
      and have `BuildDetails` open the full-screen dialog for `here`, open the dialog and immediately
      pop out for `floating`, and the share dialog for `phone`
      ([`BuildDetails.vue:234`](../../../src/views/builds/BuildDetails.vue#L234))
- [X] T037 [US2] Wire **Send to phone** in `src/views/builds/BuildDetails.vue` to the existing
      `shareDialog` ([`:31`](../../../src/views/builds/BuildDetails.vue#L31)) — reuse
      `BuildShareDialog.vue` and its QR view unchanged, no new QR generation, and leave the share
      entry in the overflow menu where it is
- [X] T038 [US2] Persist the target in `src/views/builds/BuildDetails.vue` **after** it runs
      successfully, never on click, so a `floating` attempt that falls back to the dialog does not
      become sticky; read it on mount in `src/components/builds/BuildOrderEditor.vue` so the button
      body runs it, defaulting to **Play here** when absent (FR-020, FR-021, data-model §1)
- [X] T039 [US2] Degrade a stored `floating` to `here` in
      `src/components/builds/BuildOrderEditor.vue` when the platform lacks Document PiP, and
      degrade any unrecognised stored value to `here`, so the button body can never be dead
      (FR-021, US2 scenario 5, data-model §1)
- [X] T040 [US2] On xs, render the group as a full-width `block` button directly beneath the section
      header in `src/components/builds/BuildOrderEditor.vue`, with the menu offering only the targets
      that apply on that device (FR-022, US2 scenario 6, design-input §4)
- [X] T041 [US2] Confirm the old tooltip copy at
      [`BuildOrderEditor.vue:26`](../../../src/components/builds/BuildOrderEditor.vue#L26) is gone
      with no replacement tooltip on the primary button, and that the editor (`readonly` false) still
      renders no play control at all (FR-023, US2 scenario 7)
- [X] T042 [US2] Add the failure path in `src/views/builds/BuildDetails.vue`: catch a rejected
      `open()`, dispatch the existing `showSnackbar` action with **"Your browser blocked the floating
      window. Playing here instead."**, and open the full-screen dialog. Never a dead click (FR-007,
      design-input §4)
- [ ] T043 [US2] Verify SC-005 (Build Order section header still 36 px, card still aligned with
      Description and Timeline — compare against `main` side by side) and SC-007 (the play control is
      the only filled button in the card). Commit as
      `feat: promote play to a split button with targets`

**Checkpoint**: a player who has never used focus mode can find and start a build, and lands in
whichever target they used last.

---

## Phase 6: User Story 4 - Nothing regresses for browsers without the API (Priority: P1)

**Goal**: Confirm the two unconditional changes cost nothing to users who cannot have the third.

**Independent Test**: Run the full focus-mode flow in Firefox and Safari. It behaves exactly as it
does today, plus the new button and the new layout.

- [X] T044 [US4] Audit the diff for user-agent sniffing: every capability check must be
      `'documentPictureInPicture' in window` and every tier must come from a container query, never
      `$vuetify.display` and never a UA string (NFR-006, FR-009)
- [ ] T045 [P] [US4] Firefox: split button works, menu has exactly two items, focus mode opens
      full-screen and behaves as on `main`, wake lock / swipe / `←` `→` `space` unchanged, and no
      console warning mentions picture-in-picture (SC-004, US4 scenarios 1 and 2)
- [ ] T046 [P] [US4] Safari: same checks as T045 (SC-004)
- [ ] T047 [US4] Legacy flat builds (steps with no `type`) and builds with no parseable timings: no
      autoplay, transport shows only prev/next as today, and the floating window is still offered
      (spec edge cases)

**Checkpoint**: all four stories are independently verified.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T048 Record the T006 spike outcome in [research.md](./research.md) R-1 and close the "Open
      items carried into implementation" row, so the next reader is not left with an unresolved
      load-bearing assumption
- [X] T049 ~~Web Worker fallback~~ — **not needed, cancelled 2026-08-06.** T006 measured no drift and on-time speech over 11 minutes hidden, so the tick never needed rescuing. Original condition: **Only if T006 showed ~1/min throttling**: add the layer-3 Web Worker holding a wall-clock
      deadline per [research.md](./research.md) R-3. Do not write this speculatively — Principle I
      and the plan's Constitution Check both gate it on the measurement
- [ ] T050 Real-device check on Chrome/Windows, Edge and macOS: with the opener hidden for more than
      five minutes, steps still advance on time and voice-over still speaks. If speech alone fails,
      issue the utterance against the PiP window's own `speechSynthesis` before considering anything
      larger (spec edge cases)
- [X] T051 Scope guard: `git diff main --stat` shows changes only in
      `src/components/builds/FocusMode.vue`, `src/components/builds/BuildOrderEditor.vue`,
      `src/views/builds/BuildDetails.vue`, `src/composables/builds/useStepPiP.js`,
      `src/composables/usePlayTargetPreference.js` and this spec directory
- [X] T052 `npm run build` completes clean, and the browser console is free of warnings across the
      full flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: T003–T005 land on `main` and **block every story** — SC-001 measures
  drift against them. T006 blocks only T048/T049
- **US3 (Phase 3)**: depends on Phase 2. Blocks US1
- **US1 (Phase 4)**: depends on US3 — the window opens at 400×230 and asserts the compact tier
- **US2 (Phase 5)**: depends on US1 for the Floating window menu item only; T033, T034, T037, T040,
  T041 could be built against a stubbed `supported = false` if staffed in parallel
- **US4 (Phase 6)**: verification only — depends on US1, US2 and US3 being complete
- **Polish (Phase 7)**: depends on everything

### Story Dependency Graph

```
Phase 2 (FR-016 on main)
        │
        ▼
      US3 ──────▶ US1 ──────▶ US2
   (layout)      (PiP)    (entry point)
        └───────────┴───────────┴──────▶ US4 (regression sweep)
```

This is the one place the tasks depart from the template's "stories are independent" default, and it
is deliberate: US3 and US1 are two halves of one screen, and plan.md's commit sequence already
encodes the order.

### Within Each Story

- Phase 3 Commit A (T007–T010) must land with **no behaviour change** before Commit B (T011–T017)
  begins — NFR-004, and T010 is the gate
- Phase 4: T018 first, before any composable code — it is the most likely source of unplanned work
- Phase 4: composable (T019–T027) before the component wiring (T028–T031)
- Phase 5: T033 before T038/T039 (they read it)

### Parallel Opportunities

Thin, by the shape of the feature — `FocusMode.vue` is a single-writer file for two whole phases.

- T002 runs alongside T001
- T006 (spike) runs alongside T003–T005, and alongside all of Phase 3
- T033 (new file) runs alongside anything in Phase 4
- T045 and T046 are two browsers, one script — run them side by side

---

## Parallel Example: Phase 2

```bash
# The spike needs no code and blocks nothing that ships — start it and let it run
# for the five-plus minutes Chrome's intensive throttling needs, while the fix lands:
Task: "T006 measure PiP-scheduled setInterval under a hidden opener"
Task: "T003 wall-clock derivation in FocusMode.vue on main"
```

---

## Implementation Strategy

### MVP

The MVP is **Phase 2 + US3 + US1** — the floating window is the feature, and it cannot be
demonstrated without the layout that makes a 400×230 box legible. That is 32 tasks, T001–T032, and it
ends at a state worth showing: a player pops out focus mode from the dialog and follows a build over
their game.

US2 is what makes anyone find it, so it should not ship far behind — but it is a separable commit and
a separable review.

### Incremental Delivery

1. Phase 2 → `fix:` on `main`, shipped to everyone, valuable on its own (it repairs live drift)
2. Phase 3 Commit A → `refactor:`, no behaviour change, reviewable as pure structure
3. Phase 3 Commit B → `feat:`, tiers, ships value to phone users before any PiP code exists
4. Phase 4 → `feat:`, the floating window (**MVP complete**)
5. Phase 5 → `feat:`, the entry point
6. Phase 6 → verification, no code expected

Each of steps 2–5 is one commit, per plan.md's Phase Sequencing table and quickstart.md's commit
sequence.

### Solo Sequencing Note

This is a single-developer project. The parallel markers above are honest about how little can
actually overlap; the useful concurrency is **T006's five-minute wait**, which should be started
early and read later, and **T045/T046**, which are the same script in two browsers.

---

## Notes

- **Contract C-3 and C-4 are the feature.** Cloning the node instead of moving it, or inferring the
  return parent after the move, restarts the player's session — the one outcome the whole design
  exists to prevent
- Every number comes from [design-input.md](./design-input.md). Do not re-derive geometry, tokens or
  copy
- `textToSpeechHelper.js`, `timingsHelper.js` and `villagerAggregator.js` are **read-only reuse,
  defects included** — the resource strip must never be able to disagree with the build order table
- Theme tokens only, never hex literals, and both themes must be carried into the PiP document
  (NFR-003)
- The symptom→cause table in [quickstart.md](./quickstart.md) covers the seven failures this design
  is most likely to produce. Read it before debugging, not after
- Exclusive-fullscreen players cannot see any always-on-top window. That is an OS behaviour, a
  documentation matter, and not a bug to chase
- Commit per phase, not per task, per the sequence in quickstart.md
