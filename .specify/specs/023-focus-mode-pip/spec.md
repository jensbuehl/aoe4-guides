# Feature Specification: Focus Mode — Floating Window (Document Picture-in-Picture)

**Feature Branch**: `023-focus-mode-pip`

**Created**: 2026-08-05

**Status**: Draft

**Input**: "Render the current focus-mode step in a Document Picture-in-Picture window and a player
on a single monitor gets a build-order overlay floating above their windowed-fullscreen game — no
external tool, no install." Plus two changes the mock resolved alongside it: make play the primary
action on the build page, and make the focus-mode layout work in a 400×230 box as well as on a
phone.

**Handoff package**: `README.md` (rationale and rejected alternatives), `design-input.md` (resolved
geometry, tiers, tokens, copy, PiP lifecycle), `assets/Focus Mode PiP.html` (the approved mock).
Where `design-input.md` states a number, that number is the decision — this spec does not re-derive it.

## Scope & Non-Goals *(read first)*

**In scope:**

- `src/components/builds/FocusMode.vue` — restructured into fixed rows (header / bars / step / dock)
  with three density tiers; a pop-out control; container-query CSS.
- A new composable `src/composables/builds/useStepPiP.js` — open, style-carry, move-and-return,
  key rebinding, lifecycle.
- `src/components/builds/BuildOrderEditor.vue` — the play text button becomes a split button with
  a target menu.
- `src/views/builds/BuildDetails.vue` — pass the chosen target through to the focus dialog.
- The last-used play target, persisted as a user preference.

**Explicitly NOT in scope (leave exactly as-is):**

- `src/composables/builds/textToSpeechHelper.js`, `timingsHelper.js`, `villagerAggregator.js` —
  read-only reuse, defects included.
- `BuildShareDialog.vue` — the QR handoff keeps its current behaviour and its place in the overflow
  menu; the play menu links to the same dialog rather than reimplementing it.
- The overlay export (`aoe4-overlay` JSON) — unchanged, and it stays in the overflow menu.
- The build editor, the build schema, Firestore rules, any Cloud Function.
- Autoplay timing logic, the voice-over text, villager announcements — behaviour is carried over
  verbatim.

**Prerequisite, not deliverable:**

- The elapsed-time drift fix (**FR-016**) lands as a standalone `fix:` commit on `main` *before*
  this branch. It is stated here because SC-001 measures against it, but this branch does not
  deliver it and the scope guard does not count it.

> No new dependency. Document PiP is a platform API; the tiers are CSS. A wrapper library for one
> `requestWindow` call would not survive Principle I.

## Clarifications

### Session 2026-08-05

- Q: NC-1 — where does the last-used play target persist? → A: **Resolved by inspection, not asked.**
  The spec's own rule was "match whatever the theme toggle uses". The theme toggle uses a dedicated
  composable wrapping `localStorage` under a namespaced key
  ([`useThemePreference.js`](../../../src/composables/useThemePreference.js)); the Vuex store at
  [`src/store/index.js`](../../../src/store/index.js) holds only session/runtime state (user,
  filterConfig, cache), never durable device preferences. The play target follows the composable +
  `localStorage` pattern.
- Q: NC-3 — the opener tab is hidden while the player is in the game, so its timer may be throttled
  to once per minute. What drives the focus-mode clock while the floating window is open? → A: While
  the floating window is open, the tick is driven from the **visible PiP document**, not the hidden
  opener. Same component instance, swapped clock source.

- Q: NC-2 — the floating window is open and the player navigates the opener tab to a different
  build. What should happen? → A: **Close the window** and end the session cleanly. Any navigation
  away from the build page closes it. Accepted cost: a player who browses another build mid-game
  loses the overlay and restarts it.

- Q: NC-5 — how does the elapsed-time drift fix (FR-016) ship? → A: As a **standalone `fix:` commit
  on `main`, ahead of this branch**. It repairs a live bug for all users independently of the
  floating window, and gives SC-001 a correct baseline to measure drift against.

- Q: NC-4 — how is the *New* badge on the Floating window menu item gated? → A: **No badge at all.**
  Dropped rather than gated: no badge mechanism exists to copy, and none is introduced (Principle I).
  This removes a task rather than adding one.

**Why NC-3 was reframed**: as originally written it asked whether speech survives a backgrounded
tab. That is the wrong subsystem. Speech synthesis is a browser-level service and is not itself
throttled; the *trigger* for speech is the autoplay timer at
[`FocusMode.vue:475`](../../../src/components/builds/FocusMode.vue#L475), which runs in the opener.
A hidden tab has its timers clamped to ~1/second, and after roughly five minutes hidden Chrome may
apply intensive throttling at ~1/minute. The step then never advances, so nothing is ever spoken —
voice-over *looks* suspended while actually being fine. Fixing the clock fixes the speech.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build order above the game on one monitor (Priority: P1)

A player on a single monitor runs the game windowed-fullscreen, clicks play → **Floating window**,
drags the small window to a corner, and alt-tabs into the game. The step stays visible and keeps
advancing.

**Why this priority**: This is the feature, and it is the one thing the site cannot do today
without a third-party install.

**Independent Test**: In Chrome, open a build, choose Floating window, click any other application.
The window remains on top, the timer keeps running, and the step advances at its stated time.

**Acceptance Scenarios**:

1. **Given** a supporting browser, **When** the user chooses Floating window, **Then** a PiP window
   opens at 400×230 containing focus mode at its compact tier, and the full-screen dialog does not
   open.
2. **Given** an autoplay session already running in the full-screen dialog, **When** the user hits
   pop-out, **Then** the window opens with the **same** elapsed time, step index, autoplay state
   and audio state — no restart, no re-speak of the current step.
3. **Given** the floating window, **When** the user closes it, **Then** focus mode returns to the
   page in the state the window left it in, and the dialog is showing.
4. **Given** the floating window, **When** the user navigates the opener tab away from the build —
   to a different build or anywhere else — or closes the tab, **Then** the window closes and the
   session ends cleanly (no orphaned timer, no speech left queued, wake lock released). The window
   never outlives the build page it was opened from.
5. **Given** the floating window has focus, **When** the user presses ←, → or space, **Then** the
   same handlers run as in the dialog.

---

### User Story 2 - Play is the obvious action on a build page (Priority: P1)

A player who has picked a build wants to start it. The control is a filled gold button in the Build
Order header, not a text link the size of the section label.

**Why this priority**: The floating window is worthless if nobody finds the door. This also fixes a
standing hierarchy problem on the page.

**Independent Test**: Load a build at ≥960 px and at 360 px. In both, the play control is the only
filled button in the build order card and is reachable without hunting.

**Acceptance Scenarios**:

1. **Given** a read-only build page, **When** the Build Order card renders, **Then** the header
   shows a filled `primary` split button labelled **Play** with a caret, and the section header
   height is unchanged from today (36 px).
2. **Given** the split button, **When** the user clicks its body, **Then** the last-used target runs
   immediately, defaulting to **Play here** for a user with no stored preference.
3. **Given** the caret, **When** the user opens it, **Then** the menu lists **Play here**, **Floating
   window** and **Send to phone**, and nothing else — no badges, no decoration beyond each item's
   icon, title and one-line description.
4. **Given** a browser without Document PiP, **When** the menu opens, **Then** Floating window is
   **absent** — not present-and-disabled, not present-with-an-error.
5. **Given** a user who last played in the floating window, **When** they open another build,
   **Then** the button body opens the floating window directly.
6. **Given** xs, **When** the card renders, **Then** the control is a full-width button directly
   under the section header, and the menu offers only the targets that apply on that device.
7. **Given** the build editor (not read-only), **When** the card renders, **Then** there is no play
   control, exactly as today.

---

### User Story 3 - The step is readable in a 320 px window and on a phone (Priority: P1)

A player shrinks the floating window to a strip beside their minimap; another reads the same build
on a phone propped against the monitor. Both see the step, the clock and the controls.

**Why this priority**: A layout that only works at 1080p makes the floating window a demo, not a
feature. Today's layout centres one line in a tall void and prints empty resource columns.

**Independent Test**: Resize the PiP window from 600 px down to 320 px. No horizontal scrollbar, no
clipped control, no text below 11 px, every hit target ≥26 px.

**Acceptance Scenarios**:

1. **Given** any tier, **When** focus mode renders, **Then** it is a fixed-row grid — header, bars,
   step, dock — where only the step row flexes, and nothing scrolls.
2. **Given** a step whose build states no wood/gold/stone, **When** the dock renders, **Then** those
   columns are **absent**, not blank — the dock only shows stated resources plus time and villagers.
3. **Given** a container narrower than 340 px or shorter than 190 px, **When** focus mode renders,
   **Then** the title row is dropped (the OS window title already carries the build name), the dock
   becomes a single row, and only the age crest, time and villager count remain of the resource strip.
3a. **Given** a build laid out in numbered age sections, **When** any step renders, **Then** the
   resource strip opens with the crest of the age the build is in at that step — no label, no extra
   row. **Given** a build whose sections carry no age (legacy flat builds, or a single section left
   at "no particular age"), **Then** the crest is absent rather than guessed.
4. **Given** the full and compact tiers, **When** the step row renders, **Then** it shows the step
   content, and a preview line reading `next m:ss` plus **at most one** token — the resource change
   the next step asks for, or an age-up, which takes priority. Never the next step's full spread.
5. **Given** the phone tier, **When** focus mode renders, **Then** the primary control is the
   play/pause button at 56 px, visibly larger than the four controls around it.
6. **Given** the compact and micro tiers, **When** the controls render, **Then** villager
   announcements collapse into an overflow rather than pushing the transport off the row.

---

### User Story 4 - Nothing regresses for browsers without the API (Priority: P1)

A player on Firefox or Safari sees the improved play button and the improved layout, and loses
nothing. The floating window simply is not offered.

**Why this priority**: Two of the three shipped changes are unconditional. Introducing the third
must not cost the users who cannot have it.

**Independent Test**: Run the full focus-mode flow in Firefox and Safari. It behaves exactly as it
does today.

**Acceptance Scenarios**:

1. **Given** Firefox or Safari, **When** the build page renders, **Then** the split button works,
   the menu has two items, and no console warning mentions picture-in-picture.
2. **Given** any browser, **When** focus mode is open full-screen, **Then** the wake lock, the
   swipe gestures and the keyboard shortcuts behave as they do today.

---

### Edge Cases

- **The browser refuses the request** (permissions policy, not a user gesture, PiP disabled by
  policy): catch it, fall back to the full-screen dialog, and show one snackbar. Never a dead click.
- **A PiP window is already open** for this tab (`documentPictureInPicture.window` is non-null):
  reuse and focus it rather than requesting a second — the platform allows only one.
- **The user switches theme while the window is open**: the cloned stylesheets are static; re-apply
  the theme class and re-clone Vuetify's generated theme sheet on change.
- **The opener tab is backgrounded while the floating window is open**: this is the normal case, not
  an edge case — the player is in the game. The opener's timers are throttled (~1/second when
  hidden, potentially ~1/minute under intensive throttling), so the clock MUST be driven from the
  visible PiP document while the window is open (FR-024). Today's loop also increments by one second
  per tick ([`FocusMode.vue:460`](../../../src/components/builds/FocusMode.vue#L460)) rather than
  reading a clock, so it drifts independently of throttling; that is a pre-existing bug the floating
  window makes visible (FR-016).
- **Speech while the opener is backgrounded**: speech synthesis is a browser-level service and is not
  itself throttled. With the clock driven from the PiP document, utterances are requested on time
  and speak normally. If a real-device check still shows speech failing from a hidden opener, issue
  the utterance against the PiP window's own `speechSynthesis` before considering anything larger.
- **Legacy flat builds** (no `type` on steps) and builds with no parseable timings: no autoplay, so
  the transport shows only prev/next — as today. The floating window must still be offered.
- **A very long build title** in the compact tier: single line, ellipsis; the OS window title
  carries the full string.
- **Wake lock**: request only when *not* in the floating window; release on move, re-request on
  return.

## Requirements *(mandatory)*

### Functional Requirements

**Composable — `useStepPiP.js`**

- **FR-001**: MUST expose `supported` (`'documentPictureInPicture' in window`), `active`, `open()`
  and `close()`, and MUST NOT touch the DOM until `open()` is called.
- **FR-002**: `open()` MUST request a window of 400×230 and MUST move the existing focus-mode root
  element into `pipWindow.document.body` — never clone it, never mount a second instance.
- **FR-003**: It MUST clone every `<style>` and `<link rel="stylesheet">` from the opener document
  into the PiP document, and MUST copy the `<html>` class list and `color-scheme` so the Vuetify
  theme applies.
- **FR-004**: On `pagehide`, it MUST return the element to the exact parent it came from and set
  `active` false.
- **FR-004a**: If the owning component unmounts while the window is open — which is what navigating
  away from the build page does — it MUST **close the window** as well as returning the element,
  and tear the session down cleanly: timer stopped, speech queue cleared, wake lock released.
  Returning the node alone is not sufficient, because the parent it came from is being destroyed.
- **FR-005**: It MUST bind the existing `keyup` handler to the PiP document while open, and unbind
  on close, without unbinding the opener's own handler
  ([`FocusMode.vue:442`](../../../src/components/builds/FocusMode.vue#L442)).
- **FR-006**: It MUST reuse `documentPictureInPicture.window` when one is already open.
- **FR-007**: It MUST reject cleanly on a failed request and surface the reason to the caller.

**Focus mode — `FocusMode.vue`**

- **FR-008**: The root MUST be a fixed-row CSS grid — header, bars, step, dock — sized to its
  container, with `container-type: size` and a container name, and MUST NOT scroll at any supported
  size. Only the step row flexes.
- **FR-009**: Tiers MUST be selected by container query, not by `$vuetify.display`:
  **full** (default), **compact** (`max-width: 520px` or `max-height: 300px`),
  **micro** (`max-width: 340px` or `max-height: 190px`).
- **FR-010**: The dock MUST render only resource columns whose value is stated for the current step,
  always preceded by elapsed time and villager count. This replaces the duplicated xs / non-xs
  markup at [`FocusMode.vue:59`](../../../src/components/builds/FocusMode.vue#L59) and
  [`:107`](../../../src/components/builds/FocusMode.vue#L107) with one data-driven strip.
- **FR-010a**: The strip MUST open with the crest of the age the build is in at the current step,
  as an icon at the same size as the resource icons — no label, and never a row of its own. Age is
  the only state on the dock a player cannot read off the rest of the screen, so it MUST survive the
  micro tier alongside time and villagers, and it MUST NOT live in the header (dropped in micro) or
  in the step content (which is the instruction).
  The age is read from the build's section structure, not from the clock: an `age` section sets the
  age from its first step onwards and an `ageUp` section keeps the age already in force, since a
  player who has clicked up is still in the old age until they arrive — the same reading the
  timeline's coloured segments use. Where a build states no age the crest MUST be absent, never a
  placeholder: a crest that lags the game is worse than none.
- **FR-011**: The step row MUST render a next-step preview: `next m:ss` plus at most one token
  (resource delta, or age-up which wins). It MUST be omitted on the last step and in micro.
- **FR-012**: The transport MUST keep today's actions — previous, play/pause, audio, villager
  announcements, next — with play/pause visually primary. In compact and micro, villager
  announcements MUST move into an overflow menu.
- **FR-013**: A pop-out control MUST appear in the header when `supported && !active`, and a
  return-to-page control when `active`.
- **FR-014**: All hit targets MUST be ≥44 px on the phone tier and ≥26 px in compact and micro.
  No text anywhere in focus mode below 11 px.
- **FR-015**: The wake lock MUST be released while `active` and re-requested on return.
- **FR-016**: Elapsed time MUST be derived from a wall-clock reference on each tick rather than by
  counting ticks, so the session cannot drift against the game. This ships as a **standalone `fix:`
  commit on `main` ahead of this branch** — it repairs a pre-existing bug for all users and is
  independent of the floating window. This branch therefore assumes it as its baseline rather than
  delivering it.

**Entry point — `BuildOrderEditor.vue` / `BuildDetails.vue`**

- **FR-017**: In read-only mode the header MUST render a Vuetify split button — `v-btn-group` with a
  `flat` primary `Play` and a caret opening a `v-menu`. Editor mode renders nothing, as today.
- **FR-018**: The header MUST keep its 36 px height
  ([`BuildOrderEditor.vue:366`](../../../src/components/builds/BuildOrderEditor.vue#L366)); the
  button is sized to fit inside it.
- **FR-019**: The menu MUST contain exactly: **Play here**, **Floating window** (only when
  supported), **Send to phone** (opens the existing share dialog's QR view).
- **FR-020**: The button body MUST run the last-used target; default **Play here**.
- **FR-021**: The last-used target MUST persist as a user preference across builds and sessions,
  via a small composable wrapping `localStorage` under a namespaced key — the same pattern as
  [`useThemePreference.js`](../../../src/composables/useThemePreference.js). It MUST NOT go in the
  Vuex store, which holds session/runtime state only. An unrecognised or unsupported stored value
  MUST fall back to **Play here** rather than producing a dead button.
- **FR-022**: On xs the control MUST render full-width beneath the section header.
- **FR-023**: The tooltip copy at
  [`BuildOrderEditor.vue:26`](../../../src/components/builds/BuildOrderEditor.vue#L26) MUST be
  replaced by the menu's own descriptions; no tooltip on the primary button beyond its label.

**Timing & clock source**

- **FR-024**: While the floating window is `active`, the session tick MUST be driven from the PiP
  document — which is visible and therefore not throttled — and not from the hidden opener. On
  return to the page, the tick MUST revert to the opener. The component instance and its state do
  not change; only the clock source does.
- **FR-025**: Swapping the clock source MUST NOT restart, skip or double-fire the session. Step
  index, elapsed time and the pending speech queue MUST be continuous across the swap in both
  directions, exactly as they are across the DOM move (FR-002, FR-004).

### Deviations accepted during implementation

Three requirements were built differently from how they are written above. Recorded here rather than
silently, because each was a decision made against something the spec could not have known.

- **FR-012 — no overflow menu.** Villager announcements stay a single-click toggle at *every* tier
  instead of collapsing into a `v-menu` below full. The requirement's own justification does not
  hold: the button that opens an overflow is the same width as the button it hides, so it freed no
  room on the transport row and cost a click. It also flickered in a narrow window, because an
  attached overlay is re-measured against a container with nowhere to put it.
- **FR-013 — no return-to-page control while floating.** The pop-out control still appears on the
  page; its return counterpart does not appear in the floating window. The window's own chrome
  already carries two controls that do exactly that — close, and "back to tab" — so ours was a third
  way to say the same thing, competing for a 400 px row. The requirement predates that being clear.
  The **close** control is kept in the window, because it is the only one that can say "end the
  session": close and back-to-tab reach the page as the same `pagehide`, indistinguishable, so that
  event has to mean the non-destructive one.
- **FR-014 over design-input §2 on hit targets.** design-input sizes the non-primary transport
  controls at 40 px at the full tier; FR-014 requires ≥44 px. The control box is 44 px with a 20 px
  icon, so the touch target meets the requirement while reading at about the intended weight. Where
  the mock and an accessibility floor disagree, the floor wins.

### Key Entities

- **Play target**: one of `here`, `floating`, `phone`. The user's last choice is persisted and
  becomes the split button's default action. `floating` is only ever offered — and only ever
  persisted — where the platform supports it; a stored `floating` on an unsupporting browser MUST
  degrade to `here` rather than producing a dead button.
- **Density tier**: `full` | `compact` | `micro`, derived purely from the size of the focus-mode
  container. Not user-selectable, not persisted, never derived from viewport or user agent.
- **Focus session**: the live state that must survive the move in both directions — step index,
  elapsed time, autoplay on/off, audio on/off, villager-announcement on/off, and the pending speech
  queue. It belongs to one component instance; the move must never fork it.
- **Clock source**: which document drives the session tick — the opener while on the page, the PiP
  document while the floating window is open. Not user-visible and not persisted; it changes with
  `active` and must never be observable as a jump in elapsed time (FR-024, FR-025).
- **Next-step preview token**: at most one of an age-up marker or a single resource delta, resolved
  by priority (age-up wins), attached to the `next m:ss` line.

### Non-Functional / Constitution Alignment

- **NFR-001**: Vuetify components only — `v-btn-group`, `v-menu`, `v-list`, `v-btn`. No custom
  dropdown (Principle III).
- **NFR-002**: No new dependency, no new Firestore read or write, no schema change
  (Principles I, IV).
- **NFR-003**: Both themes, via theme tokens rather than hex literals, in the PiP window as well as
  the page (Principle III).
- **NFR-004**: The layout restructure of `FocusMode.vue` ships as its own commit with no behaviour
  change, before the PiP commit (Principle II).
- **NFR-005**: Opening the window MUST take < 300 ms from click to first paint on a mid-range
  laptop; the style clone MUST not block the move.
- **NFR-006**: No feature detection by user-agent string, anywhere — capability detection only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a supporting browser, a build played in the floating window advances through 10
  steps with autoplay while another application has focus, with no drift greater than 1 s against
  the build's stated timings.
- **SC-002**: Popping out mid-session and closing the window preserves step index, elapsed time,
  autoplay and audio state in both directions, verified on a 42-step build.
- **SC-003**: The floating window is legible and fully operable at 320×150, 400×230 and 600×340
  with no clipping and no scrollbar.
- **SC-004**: On browsers without the API, the build page and focus mode produce behaviour identical
  to the previous release apart from the new button styling and the new layout.
- **SC-005**: The Build Order section header height is unchanged (36 px) and the card still aligns
  with Description and Timeline.
- **SC-006**: A phone at 390×844 shows no empty resource columns and no vertical void — the step row
  occupies the space between header and dock.
- **SC-007**: A player who has never used focus mode can start a build from the build page without
  guidance: the play control is the only filled button in the Build Order card.

**Scope guard** (verification, not a user outcome): no diffs outside `FocusMode.vue`,
`useStepPiP.js`, `BuildOrderEditor.vue`, `BuildDetails.vue`, and the preference store.

## Assumptions

- **Supporting browsers are Chromium-based** (Chrome, Edge). Firefox and Safari are treated as
  non-supporting for the lifetime of this feature; support arriving later needs no code change,
  because detection is capability-based (NFR-006).
- **One floating window per tab** is a platform constraint, not a product choice — the spec reuses
  the existing window rather than queueing or refusing.
- **The requested 400×230 is a request, not a guarantee.** The browser may clamp or the user may
  resize; every stated size behaviour is driven by the container query, so a clamped window lands on
  a defined tier rather than an undefined one.
- **A visible PiP window is not throttled.** FR-024 rests on the PiP document being on screen and
  therefore running its callbacks at normal rate while the opener is hidden. This is the
  load-bearing assumption of the whole feature and MUST be verified first in `/speckit-plan`.
  A related open question — whether Chrome exempts a tab with an open Document PiP window from
  intensive throttling outright — is not assumed either way; if it does, FR-024 becomes belt-and-
  braces rather than essential, and is kept regardless because it is correct without the exemption.
- **The existing parsing helpers are reused as-is, defects included** — the resource strip must never
  be able to disagree with the build order table, so it stays on `villagerAggregator`.
- **The mock is the design authority.** `design-input.md` and `assets/Focus Mode PiP.html` carry the
  resolved geometry, tokens and copy; this spec states behaviour and defers numbers to them.
- **No test suite is expected** — the constitution requires manual golden-path verification, which is
  what the Success Criteria are written to be.
- **No badge mechanism is introduced.** The menu items carry an icon, a title and one line of
  description, and nothing else.

## Original Open Questions (all closed)

The handoff package carried five unresolved questions. All were closed in the clarification session
of 2026-08-05; the index is kept so the handoff's own numbering still resolves. Nothing here is
open — the decisions live in **Clarifications** above and in the requirements they changed.

- ~~**NC-1**~~ — **resolved** in Session 2026-08-05 by inspection: composable + `localStorage`,
  matching the theme toggle. See Clarifications.
- ~~**NC-2**~~ — **resolved** in Session 2026-08-05: close the window on any navigation away from
  the build page. See Clarifications and US1 scenario 4.
- ~~**NC-3**~~ — **resolved and reframed** in Session 2026-08-05: the risk is opener-tab timer
  throttling, not speech suspension. The clock is driven from the visible PiP document (FR-024,
  FR-025). See Clarifications. One verification task remains, tracked as an Assumption rather than
  an open question: confirm a visible PiP window is not throttled.
- ~~**NC-4**~~ — **resolved** in Session 2026-08-05: no badge. See Clarifications and US2
  scenario 3.
- ~~**NC-5**~~ — **resolved** in Session 2026-08-05: standalone `fix:` commit on `main` ahead of
  this branch. See Clarifications and FR-016.
