# Research: Screen Wake Lock in Focus Mode

**Feature**: 018-wake-lock-focus-mode | **Date**: 2026-07-31

All Technical Context unknowns are resolved below. No NEEDS CLARIFICATION items remain.

---

## R1. Build our own composable, or keep the existing dependency?

**Decision**: Keep `useWakeLock` from `@vueuse/core` (already a direct dependency, `^13.0.0`). Do **not** create `src/composables/useWakeLock.js`.

**Rationale**: The feature description proposed a hand-written composable next to `useThemePreference.js`. Auditing the installed dependency first showed that all three "gotchas" that motivated the custom code are already handled inside it (see R2). Writing our own would add ~40 lines of new, untested code that reimplements a working, already-bundled utility.

Constitution I (Simplicity First) asks what a new abstraction solves that an existing primitive cannot. Here the answer is nothing. The same principle also constrains new abstractions to cases where "duplication has appeared at least twice" — wake lock is used on exactly one surface.

`@vueuse/core` is not a new dependency and is not tree-shaken away by this choice: `useEventListener` from the same package is already imported two lines above in the same file.

**Alternatives considered**:

- *Hand-written `useWakeLock.js` composable* — rejected. Duplicates working code, adds surface area, and would need its own visibility-change handling that the dependency already provides correctly.
- *Thin local wrapper around the VueUse composable* (to centralise the try/catch) — rejected. It would be a one-consumer abstraction; the error handling is two `catch` clauses at a single call site, which is smaller inline than as a file.

---

## R2. What does `@vueuse/core@13.0.0`'s `useWakeLock` actually do?

Read from `node_modules/@vueuse/core/index.mjs:7506-7554`. Mapping to the three gotchas raised in the feature description:

| Gotcha | Handled? | Mechanism |
|---|---|---|
| Browser silently releases the lock when the tab is hidden; must re-acquire on visibility change | **Yes** | A `release` listener on the sentinel records the released type into `requestedType`. A `whenever(documentVisibility === "visible" && document.visibilityState === "visible" && requestedType)` watcher then calls `forceRequest(type)`. Re-arms on every cycle, so it survives unlimited hide/show rounds. |
| Requires a secure context and a visible document; the promise rejects otherwise | **Partially** | The composable does not catch. `forceRequest` awaits `navigator.wakeLock.request(type)` bare, so a rejection propagates to the caller. Guarding is the caller's job — and our call site does not guard. **This is the real gap.** |
| Must feature-detect `"wakeLock" in navigator` | **Yes** | `isSupported = useSupported(() => navigator && "wakeLock" in navigator)`, and `forceRequest` short-circuits to `sentinel = null` when unsupported (so it cannot throw on unsupported browsers). |

Two further behaviours matter for the design:

- **No automatic release on scope dispose.** The composable registers no `tryOnScopeDispose`. The sentinel outlives the component unless `release()` is called explicitly. The existing `release()` in `onBeforeUnmount` is therefore load-bearing, not belt-and-braces — it must stay.
- **`isActive` is `!!sentinel && documentVisibility === "visible"`**, i.e. it reflects *currently holding*, not *ever requested*. That makes it exactly the right signal for the FR-013 indicator.

---

## R3. The `request()` no-argument defect

**Finding**: [FocusMode.vue:371](../../../src/components/builds/FocusMode.vue#L371) calls `await request()` with no argument. This is a latent bug on one path.

`request(type)` branches:

```js
async function request(type) {
  if (documentVisibility.value === "visible")
    await forceRequest(type);      // path A
  else
    requestedType.value = type;    // path B
}
```

- **Path A (document visible — the normal case)**: `forceRequest(undefined)` → `navigator.wakeLock.request(undefined)`. The Web IDL signature is `optional WakeLockType type = "screen"`, and passing `undefined` explicitly triggers the declared default. So this works today.
- **Path B (document hidden at open time)**: sets `requestedType.value = undefined`. The re-acquire watcher guards on `&& requestedType.value`, and `undefined` is falsy — so the watcher **never fires** and the lock is never acquired for that session.

Path B is precisely the "focus mode opened while the tab is hidden" edge case in the spec.

**Decision**: Pass the type explicitly — `request("screen")`. One-word change, removes the dead path, and stops the correct behaviour from resting on an IDL default.

---

## R4. When does the request actually reject?

This determines whether the try/catch is theoretical or load-bearing.

`navigator.wakeLock` is `[SecureContext]`-gated by the platform, so on an insecure origin the property is absent entirely → `isSupported` is `false` → `forceRequest` returns `null` without calling anything. **Insecure origins take the unsupported path, not the rejection path.**

Rejection (`NotAllowedError`) therefore remains reachable in these supported-but-refused cases:

- Device in battery-saver / low-power mode (the most common real cause on the phones this feature targets).
- The document is not "fully active" — e.g. the request lands during a bfcache restore or while the page is in a prerender state.
- User-agent or OS policy refusal.

**Consequence**: the guard is not defensive theatre. On the exact device state this feature exists to serve — a phone propped up, likely on battery — refusal is a realistic outcome, and today it becomes an unhandled promise rejection because `await request()` is the final statement of an `async` `onMounted` callback with no `catch`.

**Decision**: Wrap both `request` and `release` at the call site and swallow. `release()` is called from a synchronous lifecycle hook, so it takes `.catch(() => {})` rather than `try`/`await`.

---

## R5. Initialisation ordering (FR-008)

Current order inside `onMounted`:

```
… synchronous step/timing setup …
await initTextToSpeech();     // line 364
… speak() …
await request();              // line 371  ← last statement
```

If `initTextToSpeech()` rejects, execution leaves the callback and the wake lock is **never requested at all**. Voice-over setup can silently disable screen-awake — two unrelated capabilities coupled by nothing but statement order.

**Decision**: Move the guarded wake-lock acquisition *above* `await initTextToSpeech()`. Ordering alone satisfies FR-008 in both directions, with no new try/catch around the TTS call and no restructuring.

**Performance note (NFR-002)**: reordering cannot delay first paint of the step. `steps`, `currentStep`, and the timing strings are all assigned synchronously before either `await`, so the first step is readable before any promise is awaited.

**Observation, out of scope**: `initTextToSpeech()` rejecting would still abort the remainder of `onMounted` (the initial `speak()` call). That predates this feature and is not in scope here; noted for a future cleanup rather than silently widened into this change.

---

## R6. Indicator design (FR-013)

**Decision**: A non-interactive `v-icon` in the existing control row, rendered only when `isSupported`, with the glyph and tooltip driven by `isActive`.

**Rationale**: The control row at [FocusMode.vue:158-277](../../../src/components/builds/FocusMode.vue#L158-L277) already establishes the pattern — `v-tooltip location="top"` wrapping an `accent`-coloured control with `class="ma-2"`, conditionally rendered via `v-if` (`v-if="autoplaySupported"`, `v-if="audio"`). The indicator follows it exactly, satisfying Constitution III without a custom component.

Non-interactive because the Assumptions section rules out a manual off switch — closing focus mode is how you stop it. A `v-btn` would imply an action that does not exist, so `v-icon` is the honest control.

Hidden entirely when unsupported rather than shown in an "off" state: a permanently-dead icon is clutter, and hiding matches how every other conditional control in this row behaves.

**Glyphs**: `mdi-sleep-off` when held, `mdi-sleep` when supported but not currently held. Both exist in the MDI set already used throughout this file. This reads as a statement about the *screen*, which is what the lock covers — it does not overpromise, satisfying FR-013's "MUST NOT display such an indication when the screen is not actually being held awake".

**Side effect**: this consumes `isSupported` and `isActive`, which are currently destructured/returned but never rendered. FR-012 is closed by *using* the dead state rather than deleting it.

---

## R7. Verification constraints — how this can actually be tested

**Finding**: `localhost` is a secure context, so `npm run dev` on the dev machine has full wake-lock support. But reaching the Vite dev server **from a phone over the LAN IP** (`http://192.168.x.x:5173`) is an *insecure* origin — `navigator.wakeLock` is absent there.

**Consequence**: the single most important manual test (phone screen stays lit) will silently exercise the *unsupported* path if run against the dev server over LAN. The tester would observe the screen dimming and conclude the feature is broken, when in fact it was never active.

**Decision**: All on-device verification runs against an HTTPS origin — a Netlify deploy preview for the branch, or an HTTPS tunnel to the dev server. This is called out at the top of `quickstart.md` because getting it wrong produces a convincing false negative.

Automated testing is not applicable: the project has no test framework (`package.json` defines only `dev`, `build`, `preview`, `check:icons`), and the constitution requires manual golden-path testing rather than a suite. Whether a physical display dims is not observable from a browser context in any case.

---

## R8. Scope confirmation — surfaces and lifecycle

`FocusMode` is mounted in exactly one place: [BuildDetails.vue:2-4](../../../src/views/builds/BuildDetails.vue#L2-L4), inside a `v-dialog` bound to `focusDialog`. Vuetify 3 dialogs do not render their content until first opened and unmount it on close (no `eager` prop is set), so `onBeforeUnmount` fires reliably on every close — including close-by-navigation, since the dialog unmounts with its parent view.

This confirms FR-003, FR-010, and FR-011 need no new mechanism: component lifecycle already bounds the lock to exactly the period focus mode is open, provided `release()` is reached. Guarding `release()` against rejection (R4) is what keeps that guarantee intact.
