# Phase 0 Research: Share a Build — QR Handoff and Native Share

**Feature**: `019-qr-share-build` | **Date**: 2026-07-31

No `NEEDS CLARIFICATION` markers entered this phase — the spec resolved its one open decision (destination split by audience) before planning began. The research below covers the dependency choice, the rendering approach, and three concrete traps found by reading the existing code.

---

## R1. How to generate the QR code

**Decision**: Add `qrcode` (node-qrcode) as a runtime dependency, imported **dynamically** at the moment the share dialog first opens.

**Rationale**: QR encoding is not a thing to hand-roll — it needs Reed–Solomon error correction, version/capacity selection, and the eight mask-pattern evaluations. That is days of work and a permanent correctness liability for a feature budgeted at an hour or two. `qrcode` is the mature, widely-used implementation, ships a browser build, and has no runtime dependencies that matter here.

Constitution I ("New dependencies MUST be justified: what problem does this solve that a native Vue/Vuetify/Firebase primitive cannot?") is satisfied plainly: there is no native browser or Vuetify primitive that produces a QR code. Nothing in the stack can do this.

**Alternatives considered**:

| Option | Rejected because |
|---|---|
| `@vueuse/integrations`' `useQRCode` | Needs **two** new packages (`@vueuse/integrations` *plus* `qrcode`, which it wraps) to save about six lines. Worse on Constitution I than using `qrcode` directly. |
| `qrcode-generator` (~5 KB) | Smaller, but emits raw module data — we would write the rendering, sizing, and quiet-zone logic ourselves. Trades ~15 KB in a lazy chunk for hand-written code in the exact area (quiet zone, contrast) where mistakes are silent and only show up as "it doesn't scan". |
| A QR image web service (`api.qrserver.com` and similar) | Violates **FR-021** (no third-party network request) outright, leaks which builds a player is reading to a third party, and makes a purely local action fail when offline. |
| Pre-generating QR images server-side | Violates FR-021 and the project's cost principle (Constitution IV) — storage and generation cost for 4,000+ builds to serve a feature most page views never touch. |

**Bundle impact**: ~20 KB gzipped, landing in its own Rollup chunk. The `manualChunks` config in [vite.config.mjs:48-53](vite.config.mjs#L48-L53) only special-cases `firebase` and `vuetify`; everything else keeps Rollup's default per-dynamic-import splitting, which is exactly the behaviour the existing comment there describes for `jszip`/`easy-speech`. No config change is needed — this feature follows a path the build is already set up for.

---

## R2. Render to `<img>`, not `<canvas>`

**Decision**: Use `QRCode.toDataURL()` and bind the result to an `<img>`. Do **not** use `toCanvas()` with a template ref.

**Rationale**: three independent wins, all of which map to requirements:

1. **NFR-004 (text alternative) comes free.** An `<img>` takes `alt`. A `<canvas>` is an opaque bitmap to a screen reader and needs a manual `role`/`aria-label` retrofit.
2. **It removes a real timing bug.** `toCanvas()` needs the canvas element to already be in the DOM. Vuetify's `v-dialog` does not mount its content until it opens, so a naive "generate on open" would target a `null` ref and silently draw nothing. Working around that means `nextTick` dances inside a watcher. A data URL has no DOM dependency — generate the string, then let Vue render it whenever it likes.
3. **FR-009 (fits the smallest viewport) becomes one CSS rule.** `max-width: 100%` on an `<img>` is well-trodden; a canvas needs its intrinsic size and CSS size managed separately to avoid blurring.

**Alternatives considered**: `toString()` producing inline SVG scales most crisply and is the theoretically nicest option, but it means injecting markup with `v-html` on a string from a dependency. For a feature this small that is a worse security posture than a data URL for no benefit the player can perceive at 200 px.

---

## R3. The QR stays dark-on-light in both themes

**Decision**: Always render dark modules on a white background, inside an explicitly white, padded container — in dark theme as well as light. The modules use the brand navy `#294790` rather than pure black, so the code reads as part of the design without weakening it (measured **8.76:1** against white, versus 21:1 for black — both far above what scanners need).

**The gold accent is not an option.** `#CCAA55` measures **2.22:1** against white and the dark-theme gold `#e7c05e` measures **1.74:1**. Either would look perfectly on-brand on screen and then fail to scan — the exact silent failure this section exists to prevent. Any future colour change here must be checked numerically, not by eye.

**Rationale**: FR-008 demands the code actually scans, and scanning reliability is not symmetric. Most camera pipelines expect dark-on-light and many will not attempt an inverted code at all; those that do need more light and a steadier hand. A dark-theme-tinted QR is the archetypal silent failure — it looks considered, passes visual review, and then fails at the desk at 50 cm, which is the one measurement SC-002 makes.

The white container also supplies the **quiet zone**. A QR needs roughly 4 modules of clear margin; drop it and scanners fail intermittently in a way that is very hard to attribute. `qrcode`'s default `margin: 4` is correct — the note here is to *not* set it to 0 in pursuit of a tighter-looking dialog.

**Trade-off accepted**: a white square in a dark-themed dialog is not the prettiest thing on the site. Rounding the container and giving it real padding makes it read as a deliberate "card" rather than an unstyled hole. Constitution III favours theme consistency, but a code that does not scan fails the feature outright, and this is a small, contained, and clearly reasoned exception.

---

## R4. Web Share needs no new dependency

**Decision**: Use `useShare` from `@vueuse/core`.

**Rationale**: `@vueuse/core` v13 is **already** a project dependency and already used in this exact area — [FocusMode.vue:284](src/components/builds/FocusMode.vue#L284) imports `useWakeLock` and `useEventListener` from it. `useShare` is confirmed present in the installed build. It supplies a reactive `isSupported` (driving FR-011/FR-012 directly) and wraps `navigator.share` including the detail that matters most here: **a user cancelling the share sheet rejects with an `AbortError`**, which FR-013 says must never surface. That must be caught and swallowed, not merely logged.

**Alternatives considered**: calling `navigator.share` directly is about ten lines and avoids nothing (the package is already installed and shipped). Using the existing composable keeps this consistent with how the neighbouring focus-mode code already consumes VueUse.

---

## R5. Three traps found in the existing code

These are the findings most likely to cost time during implementation, so they are called out explicitly rather than left to be rediscovered.

### R5.1 — The focus-mode URL must be `?focus=true`, not `?focus`

[BuildDetails.vue:236-238](src/views/builds/BuildDetails.vue#L236-L238) reads the flag as a plain truthiness test:

```js
if (route.query) {
  focusMode.value = route.query.focus;
}
```

A bare `?focus` parses to the **empty string**, which is falsy — focus mode would not open, and the QR would appear to work while quietly doing the wrong thing. The value must be non-empty. **`?focus=true`.**

This is the single highest-risk detail in the feature: it is invisible in code review, invisible in a desktop click-through, and only shows up when someone actually scans the code with a phone.

### R5.2 — Build the URL from `build.id`, not `props.id`

FR-007 requires the code to represent *the build currently on screen*. [BuildDetails.vue:214-242](src/views/builds/BuildDetails.vue#L214-L242) fetches inside `onMounted` only, so on an in-app navigation between two `/builds/:id` routes Vue reuses the component and `props.id` updates while the displayed build does not. Deriving the URL from `build.value.id` keeps the code aligned with what the player can actually see, whatever the route says.

(The staleness itself is pre-existing behaviour and out of scope here — this decision just avoids *compounding* it with a QR that points somewhere other than the page it is displayed on.)

### R5.3 — *(retired)* The clipboard support check is `async`

This finding applied to a copy-link option that was cut during planning, so it no longer affects this feature. It is kept because it remains true of the existing code and is worth knowing if that option ever returns:

[useCopyToClipboard.js:28-51](src/composables/converter/useCopyToClipboard.js#L28-L51) returns a **Promise**, because it may query the Permissions API. Treating it as synchronous yields a Promise object — always truthy — so a capability gate built on it would pass everywhere, including where clipboard access is denied. It must be awaited, as [BuildDetails.vue:240](src/views/builds/BuildDetails.vue#L240) already does.

Separately noted while reading that code: the existing "Copy to overlay tool" action at [BuildDetails.vue:333-337](src/views/builds/BuildDetails.vue#L333-L337) discards the boolean `copyToClipboard` returns and shows no confirmation at all, so a silent clipboard failure is invisible to the player. That is a pre-existing gap, out of scope here, and worth a small separate fix.

---

## R6. Testing approach

**Decision**: Manual verification against a written checklist; no automated test suite added.

**Rationale**: The project has no test suite and the constitution's Development Workflow explicitly says none is required, but that manual golden-path testing MUST happen before merge. That fits this feature well, because its two headline criteria are **not automatable in any case**: SC-002 is a physical camera reading a physical display, and SC-006 is a load-time non-regression. The spec already records this under Assumptions. `quickstart.md` carries the checklist, including the cross-device scan that is the only real proof the feature works.

---

## Summary of decisions

| # | Decision |
|---|---|
| R1 | `qrcode` as a dynamically-imported dependency; no new build config |
| R2 | `toDataURL()` into an `<img>`, not `toCanvas()` |
| R3 | Brand navy on white in both themes (8.76:1); default margin kept for the quiet zone; gold rejected at 2.22:1 |
| R4 | `useShare` from the already-installed `@vueuse/core`; swallow `AbortError` |
| R5 | `?focus=true`; derive from `build.id`; (R5.3 retired with the copy-link cut) |
| R6 | Manual verification via `quickstart.md` checklist |
