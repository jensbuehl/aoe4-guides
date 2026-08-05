# Tasks — 023 Focus mode: floating window

Conventional Commits. Each phase is a separate commit; Phase 1 must land with **no behaviour
change** (Constitution II). Check items off in place.

## Phase 0 — Groundwork

- [ ] **T001** Read `FocusMode.vue`, `BuildOrderEditor.vue`, `BuildDetails.vue`,
      `BuildShareDialog.vue` and `textToSpeechHelper.js` before touching anything. Note where the
      `keyup` listener, the wake lock and the speech calls live.
- [x] **T002** ~~Confirm NC-1~~ — **resolved in clarification**: the theme toggle uses a composable
      wrapping `localStorage` under a namespaced key (`useThemePreference.js`), not Vuex. The
      last-used play target follows the same pattern.
- [x] **T003** ~~Decide NC-5~~ — **resolved in clarification**: the FR-016 wall-clock fix ships as a
      standalone `fix:` commit on `main` **ahead of** this branch. See T004.
- [ ] **T004** *(prerequisite, on `main`, not this branch)* `fix:` derive elapsed time from a
      wall-clock reference instead of counting ticks
      ([`FocusMode.vue:460`](../../../src/components/builds/FocusMode.vue#L460)). Land and verify
      before starting Phase 1, so SC-001 measures against a correct baseline.
- [ ] **T005** Verify the load-bearing assumption behind Phase 3: that a **visible PiP window is not
      throttled** while the opener tab is hidden. Prototype before committing to the design. Also
      note whether Chrome exempts a tab with open Document PiP from intensive throttling — if it
      does, FR-024 is belt-and-braces; it is implemented either way.

## Phase 1 — `refactor: restructure focus mode as a three-row grid`

No new features. Same controls, same handlers, same behaviour at desktop size.

- [ ] **T010** Replace the `v-row`/`v-col` stack in `FocusMode.vue` with a three-row grid root
      (header / bars / step / dock) sized to its container. Keep every existing handler binding.
- [ ] **T011** Add `container-type: size; container-name: focus;` to the root and move all sizing
      into `@container focus (...)` blocks for the **full** tier only.
- [ ] **T012** Collapse the duplicated xs / non-xs resource markup into one strip driven by data,
      rendering only stated columns (FR-010). Delete the `$vuetify.display.xs` branch.
- [ ] **T013** Verify against the previous release at 1920×1080 and 390×844: same content, no
      console errors, swipe and keys unchanged.

## Phase 2 — `feat: density tiers for focus mode`

- [ ] **T020** Add the **compact** tier per `design-input.md` §2 (icons 38, type 16, play 40,
      others 30, single-line title).
- [ ] **T021** Add the **micro** tier (header dropped, single-row dock, resources reduced to time +
      villagers, play 32, others 26).
- [ ] **T022** Move the villager-announcements control into a `v-menu` overflow in compact and
      micro (FR-012).
- [ ] **T023** Add the next-step preview line with the one-token rule (FR-011): age-up wins, else
      resource delta, else nothing; omitted on the last step and in micro.
- [ ] **T024** Make play/pause visually primary at every tier (56 / 40 / 32 px).
- [ ] **T025** Resize-test in a plain browser window from 1200 px down to 320×150: no scrollbar, no
      clipping, no text below 11 px, hit targets per FR-014.

## Phase 3 — `feat: document picture-in-picture target for focus mode`

- [ ] **T030** Create `src/composables/builds/useStepPiP.js` exposing `supported`, `active`,
      `open()`, `close()` (FR-001).
- [ ] **T031** Implement `open()`: request 400×230, clone `<style>` and `<link rel=stylesheet>`,
      copy `documentElement.className` and `colorScheme`, remember the current parent, move the
      focus-mode root into the PiP body (FR-002, FR-003).
- [ ] **T032** Implement return on `pagehide` **and** on component unmount, restoring the element to
      its remembered parent (FR-004).
- [ ] **T033** Bind the existing `keyup` handler to `pipWindow.document` while open; unbind on close
      without disturbing the opener's listener (FR-005).
- [ ] **T034** Reuse and focus `documentPictureInPicture.window` when one is already open (FR-006).
- [ ] **T035** Release the wake lock while active; re-request on return (FR-015).
- [ ] **T036** Re-apply theme class and re-clone the Vuetify theme stylesheet when the theme changes
      while the window is open.
- [ ] **T037** Add the pop-out / return control to the focus-mode header, shown only when supported
      (FR-013).
- [ ] **T038** Catch a rejected request, fall back to the full-screen dialog, show the snackbar copy
      from `design-input.md` §4 (FR-007).
- [ ] **T039** Close the window when the opener leaves the build page — any navigation away, not
      just to another build — tearing down timer, speech queue and wake lock (FR-004a).
- [ ] **T03A** Drive the session tick from the visible PiP document while active, reverting to the
      opener on return, with no restart, skip or double-fire across the swap (FR-024, FR-025).
      Depends on T005.

## Phase 4 — `feat: promote play to a split button with targets`

- [ ] **T040** Replace the text `v-btn` in the Build Order header with a `v-btn-group`: flat
      `primary` **Play** plus caret. Keep the header at 36 px (FR-018).
- [ ] **T041** Build the `v-menu` with the three items and their descriptions per
      `design-input.md` §4; omit Floating window when unsupported (FR-019, FR-004 of US2).
- [ ] **T042** Wire **Send to phone** to the existing share dialog's QR view — no new QR code.
- [ ] **T043** Persist and read the last-used target in the store chosen in T002; button body runs
      it, defaulting to Play here (FR-020, FR-021).
- [ ] **T044** xs: render the group as a full-width button beneath the section header (FR-022).
- [ ] **T045** Remove the old tooltip; confirm the editor (non-readonly) still renders no play
      control.
- [x] **T046** ~~Add the *New* badge~~ — **cut in clarification (NC-4)**: no badge, no badge
      mechanism. Menu items carry icon, title and one line of description only.
- [ ] **T047** An unrecognised or unsupported stored play target falls back to **Play here**, so a
      persisted `floating` can never produce a dead button on a browser without the API (FR-021).

## Phase 5 — Verification

- [ ] **T050** SC-001: 10 autoplay steps in the floating window while another app has focus; drift
      ≤ 1 s.
- [ ] **T051** SC-002: pop out and close mid-session on a 42-step build; state preserved both ways.
- [ ] **T052** SC-003: operable at 320×150, 400×230, 600×340.
- [ ] **T053** SC-004: Firefox and Safari unchanged; no PiP warnings in the console.
- [ ] **T054** SC-005 / SC-006: header height 36 px, cards aligned; phone shows no empty resource
      columns and no vertical void.
- [ ] **T055** Real-device check on Chrome/Windows, Edge and macOS: with the opener hidden for more
      than five minutes, steps still advance on time and voice-over still speaks. This validates
      T005's assumption end to end. If speech alone fails, try the PiP window's own
      `speechSynthesis` before escalating to a separate feature.
- [ ] **T056** SC-007: diff review — no files touched outside the five in scope.
