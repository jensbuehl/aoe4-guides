# Feature Specification: Screen Wake Lock in Focus Mode

**Feature Branch**: `018-wake-lock-focus-mode`

**Created**: 2026-07-31

**Status**: Draft

**Input**: User description: "Screen wake lock in focus mode. FocusMode.vue is explicitly the 'follow along while playing' surface — it has autoplay, a step timer, TTS, and swipe gestures. On a phone propped next to the monitor, the screen dims after 30s and the whole feature dies mid-build. On desktop it's the screensaver. Acquire whenever focus mode is open, not just when autoplay runs. Re-acquire when the tab becomes visible again. Never surface an error. Feature-detect and degrade silently."

## Context: Existing Behaviour

A screen wake lock is **already acquired** when focus mode opens and released when it closes (added in commit `b9b1897`). The current implementation also already re-acquires the lock when the page becomes visible again, and already feature-detects support.

This specification therefore covers two things:

1. **Confirming and protecting** the behaviours that already exist, so they are stated as testable requirements rather than incidental properties of a dependency.
2. **Closing the gaps** that remain: failures are not swallowed, and the wake-lock state is not observable by the person using the feature.

Requirements that describe already-satisfied behaviour are marked *(already satisfied — regression guard)*. They still need acceptance coverage; they do not necessarily need new code.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Screen stays lit for the whole follow-along session (Priority: P1)

A player props their phone next to their monitor, opens a build order in focus mode, and starts a match. They advance steps by swiping between build actions, sometimes leaving a step on screen for over a minute while they execute it in game. The phone screen stays lit and readable for the entire session without the player touching it.

**Why this priority**: This is the whole point of the feature. Without it, the screen dims after roughly 30 seconds and the follow-along surface becomes unusable exactly when it is needed most — mid-build, with both hands on mouse and keyboard.

**Independent Test**: Open focus mode on a mobile device with a short display-sleep setting, do not touch the screen, and confirm the display remains lit past the device's normal sleep timeout. Delivers the core value on its own.

**Acceptance Scenarios**:

1. **Given** focus mode is open and autoplay is running, **When** the device's normal display-sleep timeout elapses without any user input, **Then** the screen remains lit and the current step stays readable.
2. **Given** focus mode is open and autoplay is **not** running (the player is advancing steps manually), **When** the device's normal display-sleep timeout elapses without any user input, **Then** the screen still remains lit.
3. **Given** focus mode is open on a desktop browser, **When** the operating system's screensaver or display-blank timeout elapses, **Then** the display does not blank.
4. **Given** focus mode is open with the screen held awake, **When** the player closes focus mode, **Then** the screen returns to the device's normal sleep behaviour and no longer stays lit.
5. **Given** focus mode is open with the screen held awake, **When** the player navigates away from the build page entirely (browser back, link, or tab close), **Then** the screen returns to normal sleep behaviour.

---

### User Story 2 - Wake lock survives switching away and back (Priority: P1)

An AoE4 player alt-tabs constantly — to the game, to a browser tab, to another app. Each time they come back to the focus-mode tab, the screen must still be held awake. The protection must not be a one-shot that silently stops working after the first switch.

**Why this priority**: Equal to P1 because the failure mode is invisible and total. The feature appears to work in a five-second test, then dies the first time the player does the single most common thing they do. Shipping User Story 1 without User Story 2 delivers a feature that breaks within the first minute of real use.

**Independent Test**: Open focus mode, switch to another tab or app, wait a few seconds, switch back, then leave the device untouched past its display-sleep timeout and confirm the screen stays lit.

**Acceptance Scenarios**:

1. **Given** focus mode is open and the screen is held awake, **When** the player switches to another tab or application and then returns to the focus-mode tab, **Then** the screen is held awake again without any user action.
2. **Given** the player has switched away from and back to the focus-mode tab several times in a row, **When** the device's display-sleep timeout elapses, **Then** the screen remains lit — the protection is not exhausted by repeated switching.
3. **Given** the player switches away from the focus-mode tab, **When** the tab is hidden, **Then** no wake lock is held for the hidden tab (the browser reclaims it), and the device may sleep normally.
4. **Given** the player switches away from the focus-mode tab and closes focus mode *without* returning to it (for example, the tab is closed while hidden), **When** focus mode is torn down, **Then** no wake lock remains held.

---

### User Story 3 - Silent, harmless degradation where wake lock is unavailable (Priority: P2)

A player on an older iOS version, an in-app browser, a device in low-power mode, or a non-secure context opens focus mode. Everything in focus mode — steps, timer, autoplay, voice-over, swipe — works exactly as it does today. They simply do not get the screen-awake benefit. They are never shown an error, a warning, or a permission prompt about it.

**Why this priority**: P2 because it protects the existing experience rather than adding new value, but it is not optional — a rejected request that surfaces as a console error or a broken load would make focus mode worse than before the feature existed for the users least able to work around it.

**Independent Test**: Open focus mode in an environment where screen wake lock is unavailable or the request is refused, and confirm every other focus-mode capability behaves identically to today with no user-visible error.

**Acceptance Scenarios**:

1. **Given** a browser that does not support screen wake lock, **When** the player opens focus mode, **Then** focus mode loads and functions normally and no error is shown or logged as an unhandled failure.
2. **Given** a browser that supports screen wake lock but refuses the request (low battery, power-saving mode, non-secure context, or page not fully active), **When** the player opens focus mode, **Then** focus mode loads and functions normally and the refusal is not surfaced to the player.
3. **Given** the wake-lock request fails, **When** the player uses voice-over, autoplay, the step timer, or swipe navigation, **Then** all of them work exactly as they would have without the feature.
4. **Given** the wake-lock request or release fails at any point, **When** the failure occurs, **Then** it does not produce an unhandled error and does not interrupt focus-mode setup or teardown.

---

### User Story 4 - The player can tell whether their screen is being held awake (Priority: P3)

A player who is about to rely on focus mode during a real match can see, at a glance, whether the screen will stay lit — so they know whether they need to change their device's display settings before the match starts instead of discovering it mid-build.

**Why this priority**: P3 because the feature is valuable without it, and an always-silent implementation is a defensible product choice. It is included because the current implementation gives no signal at all, which makes both User Story 1 and User Story 3 impossible for a player (or a tester) to distinguish from each other.

**Independent Test**: Open focus mode in a supporting environment and in a non-supporting environment, and confirm the two are visually distinguishable without opening developer tools.

**Acceptance Scenarios**:

1. **Given** focus mode is open and the screen is being held awake, **When** the player looks at the focus-mode controls, **Then** an indication that the screen is being kept on is visible.
2. **Given** focus mode is open in an environment where wake lock is unavailable or was refused, **When** the player looks at the focus-mode controls, **Then** no misleading "screen stays on" indication is shown.
3. **Given** the indicator is present, **When** the player is mid-session, **Then** the indicator does not obscure the current step, the resource row, or any existing control.

---

### Edge Cases

- **Rapid open/close of focus mode**: opening and closing focus mode several times in quick succession must not leave a wake lock held after the last close, and must not accumulate multiple locks.
- **Focus mode opened while the tab is hidden**: if focus mode somehow initialises while the document is not visible, the request must not fail loudly, and the screen must be held awake once the tab becomes visible.
- **Voice-over initialisation failure**: a failure while preparing text-to-speech must not prevent the screen from being held awake. The two capabilities must not be able to break each other during focus-mode setup.
- **Device enters low battery mode mid-session**: the browser may reclaim the lock. Focus mode must not error; the screen reverts to normal sleep behaviour.
- **Player locks the device manually**: an explicit lock by the player always wins. The feature must never attempt to defeat a deliberate device lock.
- **Long sessions**: a build order followed for 30+ minutes must keep the screen lit for the whole session, not only for an initial window.
- **Non-secure origin (local development over plain HTTP)**: the request will be refused; focus mode must behave as in User Story 3 rather than breaking for developers.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST request that the device screen stay awake as soon as focus mode is opened, regardless of whether autoplay is running. *(already satisfied — regression guard)*
- **FR-002**: The system MUST keep the screen awake for the entire time focus mode is open, including while the player advances steps manually and while a single step remains on screen indefinitely. *(already satisfied — regression guard)*
- **FR-003**: The system MUST release the screen-awake request when focus mode closes or is otherwise torn down, so the device returns to its normal display-sleep behaviour. *(already satisfied — regression guard)*
- **FR-004**: The system MUST re-establish the screen-awake request without user action whenever the focus-mode page becomes visible again after having been hidden, and MUST continue to do so across an unlimited number of hide/show cycles. *(already satisfied — regression guard)*
- **FR-005**: The system MUST detect whether the environment supports holding the screen awake, and MUST NOT attempt the request where it is unsupported. *(already satisfied — regression guard)*
- **FR-006**: The system MUST treat any failure to acquire the screen-awake request as a no-op: focus mode MUST continue to load and operate normally, and the failure MUST NOT surface to the player or escape as an unhandled error.
- **FR-007**: The system MUST treat any failure to release the screen-awake request as a no-op that does not interrupt focus-mode teardown or escape as an unhandled error.
- **FR-008**: A failure in any other part of focus-mode initialisation (notably voice-over setup) MUST NOT prevent the screen-awake request from being made, and a failure of the screen-awake request MUST NOT prevent the rest of focus-mode initialisation.
- **FR-009**: The system MUST NOT show the player any error, warning, prompt, or permission dialog related to keeping the screen awake, in any environment.
- **FR-010**: The system MUST NOT hold a screen-awake request at any time when focus mode is not open.
- **FR-011**: The system MUST NOT attempt to keep the screen awake on any surface other than focus mode.
- **FR-012**: The system MUST NOT retain any unused state or references related to the screen-awake capability that are not used by the interface or the behaviour above.
- **FR-013**: The system SHOULD give the player a visible, non-intrusive indication of whether the screen is currently being held awake, and MUST NOT display such an indication when the screen is not actually being held awake. *(User Story 4; may be deferred without affecting FR-001 to FR-012)*

### Non-Functional Requirements

- **NFR-001**: The feature MUST NOT introduce any server-side component, stored data, schema change, or per-use cost.
- **NFR-002**: The feature MUST NOT measurably delay the time from opening focus mode to the first step being readable.
- **NFR-003**: The feature MUST NOT require the player to grant a permission or make a choice before focus mode becomes usable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a mobile device configured with a 30-second display-sleep timeout, a player following a build order in focus mode without touching the screen keeps a readable display for the full duration of a 20-minute build order — 100% of the session, versus roughly the first 30 seconds today.
- **SC-002**: After 10 consecutive switches away from and back to the focus-mode tab, the screen is still held awake on return — the protection succeeds on the 10th return as reliably as on the 1st.
- **SC-003**: In environments where holding the screen awake is unavailable or refused, 100% of existing focus-mode capabilities (step navigation, autoplay, timer, voice-over, swipe) behave identically to their behaviour before the feature, and zero errors or warnings are shown to the player.
- **SC-004**: Zero unhandled errors originate from the screen-awake capability across supported, unsupported, and refusing environments, in both setup and teardown.
- **SC-005**: Within 100 focus-mode open/close cycles, the device's normal display-sleep behaviour is restored every time focus mode is closed — no session leaves the screen held awake afterwards.
- **SC-006**: A player can determine whether their screen will stay lit within 5 seconds of opening focus mode, without leaving the page or opening developer tools. *(depends on FR-013)*

## Assumptions

- **Scope is focus mode only.** Build detail pages, the build editor, and all list views are excluded. A player reading a build order outside focus mode is not "following along while playing" and should get normal display-sleep behaviour.
- **The behaviour is automatic, not opt-in.** Anyone who opens focus mode wants to follow along while playing; requiring a toggle to be flipped first would mean most players hit the dim-screen failure at least once. No preference is stored, and nothing is persisted.
- **No manual off switch is provided.** Closing focus mode is the way to stop holding the screen awake. A dedicated disable control is out of scope; if player feedback later shows it is wanted, it can be added without changing anything specified here.
- **The screen-awake request covers the display only.** Keeping the device's processor or network alive is explicitly out of scope.
- **Failures are invisible by design.** There is no fallback trick (silent looping media, synthetic input, or similar) when the request is refused. The player simply gets today's behaviour.
- **Verification of "screen stays lit" is manual.** Whether a physical display dims cannot be asserted from an automated browser test; automated coverage is limited to the observable request/release/re-acquire behaviour and the silent-failure guarantees, with the physical outcome confirmed by manual device testing.
- **Production is served over a secure origin**, so the request is not refused for that reason in real use. Local development over a non-secure origin is expected to fall into the User Story 3 path.
- **The existing dependency is retained.** The already-integrated wake-lock capability from the project's existing utility library is assumed to remain the mechanism; the requirements above are written against observable behaviour, so they hold whether that dependency is kept or replaced.
