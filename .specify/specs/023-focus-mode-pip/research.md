# Research — 023 Focus mode: floating window

Phase 0 output. Resolves the unknowns carried out of `/speckit-clarify`, chiefly the load-bearing
assumption behind FR-024.

---

## R-1: Does a visible PiP window escape the opener's background throttling?

**Status: RESOLVED BY MEASUREMENT, 2026-08-06. Layer 3 is not needed and will not be built.**

### What the measurement showed

Chrome on Windows, autoplay running in the floating window, opener tab hidden behind a game for
more than eleven minutes — well past the five minutes after which Chrome may check a hidden page's
timers only once a minute. Result: **no drift against the build's stated times, and the step that
fell after the eleven-minute mark was spoken on time.**

Two conclusions, and they are worth keeping apart because only the first is certain:

1. **Certain: the three-layer clock works, so the Web Worker fallback is unnecessary.** Whatever the
   tick source did, elapsed time stayed correct. This is what SC-001 measures and it passes.
2. **Strongly indicated, not proven: the PiP-scheduled interval is not throttled.** Layer 1 alone
   guarantees the right *time*, but not a timely *utterance* — a tick clamped to once a minute would
   have announced a step up to a minute after it was due, and that is the kind of lateness a person
   watching for it would notice. Speech landing on time therefore points at the interval running at
   normal rate. It does not distinguish "not throttled at all" from "throttled slightly".

The distinction does not change what gets built, which is the point of the design: correctness never
depended on the answer. It matters only if the tail latency ever needs tightening.

**Consequence**: R-3's layer 3 is cancelled. Tomodoro's Web Worker was the right instinct for a
design whose correctness rests on the tick; ours does not, so it buys nothing here.

**Decision**: Do not depend on the answer. Restructure the clock so that correctness is
*independent* of tick frequency, and treat the tick source as a latency optimisation only.

### What the sources actually say

- The **WICG explainer** does not mention visibility, throttling, `requestAnimationFrame` or
  rendering while the opener is hidden. Not "it works" — simply unaddressed.
- **Chrome's own Document PiP documentation** likewise says nothing about throttling, visibility or
  rAF behaviour.
- **Chrome's timer-throttling rules** are documented and hostile: a hidden page whose timer chain
  count is ≥5, that has been hidden >5 minutes and silent ≥30 s, and is not using WebRTC, has its
  timers checked **once per minute**. Focus mode's `setInterval` at
  [`FocusMode.vue:479`](../../../src/components/builds/FocusMode.vue#L479) meets every one of those
  conditions during normal use.
- **`requestAnimationFrame` is paused in background/hidden documents by design.** This makes rAF a
  *worse* candidate than it first appeared — see R-2.

### The decisive evidence

**Tomodoro**, a shipping pomodoro web app that uses Document PiP, does not rely on the PiP window
being unthrottled. It runs its countdown in a **Web Worker holding a wall-clock deadline**,
specifically "so background-tab throttling can't make it drift."

That is a practitioner who solved this exact problem choosing *not* to trust the PiP window. It is
the strongest signal available, and it argues against making FR-024 the sole mechanism.

### Consequence for the design

The clarification session chose "drive the tick from the PiP document". That remains correct and is
kept — but it is now positioned as the **latency** mechanism, not the **correctness** mechanism.
Correctness comes from FR-016. See R-3 for the resulting three-layer design.

**Alternatives considered**:

| Option | Verdict |
|---|---|
| Trust the PiP window, single `setInterval` there | Rejected — unverified, and the only shipping precedent found deliberately avoids it |
| `requestAnimationFrame` in the PiP window | Rejected as primary — rAF pauses when a document is not being painted, and an occluded window may stop entirely (R-2) |
| Web Worker with wall-clock deadline | Held in reserve — the known-good fallback if T005 fails (R-3, layer 3) |
| Wall-clock derivation, tick source best-effort | **Chosen** — makes the tick source a performance detail rather than a correctness dependency |

---

## R-2: Why `requestAnimationFrame` is the wrong primary tick

**Decision**: Use `setInterval` scheduled on the PiP window, not rAF.

**Rationale**: rAF is explicitly tied to painting. It is paused for hidden documents, and a window
that is **occluded** may stop being painted even while nominally "open". This matters here more than
in most apps, because the whole point of the feature is that the user is looking at a game, not at
the browser:

- **Windowed/borderless fullscreen** (the spec's stated target): the always-on-top PiP window stays
  visible and painted. rAF would work.
- **Exclusive fullscreen**: the PiP window is covered entirely. Painting may stop, and with it rAF.

`setInterval` is not tied to the paint cycle, so it degrades to throttling rather than to a full
stop. Combined with wall-clock derivation (R-3), a throttled interval still produces correct times.

**New constraint worth recording**: a player using *exclusive* fullscreen cannot see an always-on-top
window at all, so the feature implicitly requires windowed or borderless fullscreen. This is a
documentation matter, not a code one, but it belongs in the quickstart.

---

## R-3: The three-layer clock

**Decision**: Separate *what time it is* from *when we look*.

```
Layer 1 — correctness  : elapsed = anchorElapsed + (Date.now() − anchorWallClock)      [FR-016]
Layer 2 — latency      : tick scheduled on the PiP window while active                 [FR-024]
Layer 3 — fallback     : Web Worker holding the deadline, only if T005 fails           [contingency]
```

**Rationale**: With layer 1, a tick that arrives late produces a *late* update, never a *wrong* one.
The session can never drift, which is precisely what SC-001 measures. Layers 2 and 3 only reduce how
late an update can be.

This also explains why today's code is broken in a way that FR-016 alone fixes. The current loop
mutates a `Date` by +1 s per tick at
[`FocusMode.vue:464`](../../../src/components/builds/FocusMode.vue#L464) and advances the step by
comparing that accumulated value against the next step's stated time. Ticks *are* the clock, so any
throttling silently rewrites history rather than delaying it.

**Re-anchoring is required, not optional.** `setElapsedTimeToCurrentStepStartTime()` at
[`FocusMode.vue:498`](../../../src/components/builds/FocusMode.vue#L498) resets elapsed time to the
current step's start whenever the user steps manually. So the clock is not a pure wall clock — it is
"wall clock since the last anchor". The anchor must be reset on: session start, manual prev/next,
and play/pause resume. Any FR-016 implementation that forgets this will break manual navigation.

**Alternatives considered**: keeping tick-counting and merely raising the tick rate — rejected,
because it cannot fix drift, only shrink it, and does nothing under intensive throttling.

---

## R-4: SPA navigation does not close the PiP window

**Decision**: FR-004a must close the window explicitly. It is not redundant with platform behaviour.

**Rationale**: The WICG explainer states the PiP window "will never outlive the opening window", and
that "any navigations that change the opener to a new document (even same-origin navigations) will
cause the PiP window to close."

The operative words are **new document**. This project is a vue-router SPA
([`src/router/index.js`](../../../src/router/index.js)), so moving from build A to build B is a
client-side route change that does *not* create a new document. The platform will therefore **not**
close the window, and the NC-2 decision ("close on any navigation away from the build page") has to
be implemented by us — an `onBeforeUnmount` / route guard on the build view.

This is a case where the platform guarantee reads like it covers us and does not. Worth stating
plainly so it is not discovered late.

**Corollary**: a full page reload or a real document navigation *will* close the window for free,
and `pagehide` fires normally in that case, so FR-004's return path already covers it.

---

## R-5: Stylesheet carry-over

**Decision**: Copy `document.styleSheets` rule-by-rule into a `<style>` element in the PiP head, with
a `<link>` clone as the fallback for any sheet whose `cssRules` throws.

**Rationale**: The `copyStyleSheets` option was in an earlier version of the specification and **was
removed** — it cannot be relied on. Chrome's documented pattern is manual:

```js
[...document.styleSheets].forEach((styleSheet) => {
  try {
    const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
    const style = document.createElement('style');
    style.textContent = cssRules;
    pipWindow.document.head.appendChild(style);
  } catch (e) {
    // cross-origin sheet: clone a <link> instead
  }
});
```

Reading `cssRules` on a cross-origin sheet throws a `SecurityError`, hence the `try`/`catch` and the
`<link>` fallback. This satisfies FR-003.

**Theme changes** (Vuetify writes its palette into a generated stylesheet): the copy is a snapshot,
so a theme switch while the window is open requires re-running the copy and re-applying the `<html>`
class list. Cheap, and already required by the spec's edge cases.

---

## R-6: `requestWindow` options and availability

**Decision**: Request `{ width: 400, height: 230 }` only. Do not pass `disallowReturnToOpener`.

**Rationale**: `disallowReturnToOpener` is Chrome 124+ and `preferInitialWindowPlacement` is
Chrome 130+. The spec wants `disallowReturnToOpener: false` — which is the default — so passing it
adds a version dependency for no behavioural change. Omit it.

`documentPictureInPicture.window` returns the current window or `null`, which is exactly the reuse
check FR-006 needs.

**Feature detection**: `'documentPictureInPicture' in window`, per FR-001 and NFR-006. No UA string
anywhere.

---

## R-7: Where the keyup listener must move

**Decision**: Keep the opener listener registered; add a second one on the PiP document while active.

**Rationale**: The handler is currently registered unconditionally via VueUse's `useEventListener` at
[`FocusMode.vue:446`](../../../src/components/builds/FocusMode.vue#L446), which auto-disposes on
unmount. Keyboard events fire in the document that has focus — while the PiP window is focused, the
opener's `document` never sees them. `useEventListener` accepts a target ref and handles teardown, so
binding a second listener to `pipWindow.document` for the lifetime of `active` satisfies FR-005
without touching the existing registration.

---

## R-8: Preference storage

**Decision**: New composable `src/composables/usePlayTargetPreference.js`, mirroring
[`useThemePreference.js`](../../../src/composables/useThemePreference.js).

**Rationale**: Settled in clarification. The theme composable is 18 lines: an exported storage-key
constant, a validating getter that returns `null` on anything unrecognised, and a setter. Copying
that shape gives FR-021's "unrecognised or unsupported value falls back to Play here" almost for
free, since the getter already validates against a known set.

Storage key: `aoe4-guides-play-target`. Values: `here` | `floating` | `phone`.

**Alternatives considered**: Vuex — rejected, it holds session/runtime state only
([`src/store/index.js`](../../../src/store/index.js)), never durable device preferences.

---

## Open items carried into implementation

| Item | Where | Blocking? |
|---|---|---|
| ~~Is a PiP-scheduled interval throttled when the opener is hidden >5 min?~~ | — | **Closed 2026-08-06** — measured over 11 minutes hidden: no drift, speech on time. See R-1. Layer 3 cancelled |
| Confirm the same on Edge and on macOS | verification | No — one Chromium platform is measured; the others are expected to match and are not load-bearing |
| Exclusive-fullscreen players cannot see any always-on-top window | quickstart | No — documentation only |
