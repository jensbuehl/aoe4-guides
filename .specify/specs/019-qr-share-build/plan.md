# Implementation Plan: Share a Build — QR Handoff and Native Share

**Branch**: `019-qr-share-build` | **Date**: 2026-07-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.specify/specs/019-qr-share-build/spec.md`

## Summary

Add a **Share** entry to the build detail page's existing overflow menu that opens a dialog offering two ways to get a build somewhere else: a **QR code** encoding the build's *focus-mode* URL (scan it with the phone next to your monitor), and a **native share** hand-off on devices that support it. The two deliberately target different URLs, because the QR is for your own second screen while the shared link is for another person.

A copy-link option was specified and then cut: the build page's address *is* the share URL, so the address bar already copies it on desktop, and native share sheets include "Copy" as a target on mobile. See the spec's *Rejected scope* section.

Everything is client-side. The only new dependency, `qrcode`, is dynamically imported the first time the dialog opens, so it lands in its own lazy chunk and the large majority of page views that never open the share dialog pay nothing for it.

## Technical Context

**Language/Version**: JavaScript (ES2022), Vue 3 Options API with `setup()` — matching the surrounding build components

**Primary Dependencies**: Vue 3.2 · Vuetify 3.8 · `@vueuse/core` 13 (already installed — supplies `useShare`) · **`qrcode` (new, lazy)**

**Storage**: None. No Firestore reads, writes, schema changes, or security-rule changes. Both URLs are derived in the browser from data already on the page.

**Testing**: Manual verification against [quickstart.md](./quickstart.md), per the constitution's Development Workflow. The two headline criteria (physical camera scan, load-time non-regression) are not automatable — see research R6.

**Target Platform**: Modern evergreen browsers, desktop and mobile. Degrades by *omitting* options, never by erroring.

**Project Type**: Single-page web application (Vue SPA on Netlify)

**Performance Goals**: Zero change to build-page initial load (NFR-001). QR visible within ~1 dialog-open beat; a visible pending state if the chunk fetch is slow (NFR-002).

**Constraints**: No server component, no third-party request, no per-use cost (FR-021). No unhandled rejection may escape (FR-014, FR-022, SC-007). QR must scan at 40–60 cm in both themes (FR-008, SC-002).

**Scale/Scope**: One new component, one new menu item, one new dependency. Two files touched, one file added. ~120 lines net.

## Constitution Check

*GATE: evaluated before Phase 0 and re-evaluated after Phase 1 design. Both passes recorded.*

| Principle | Pre-Phase-0 | Post-Phase-1 | Notes |
|---|---|---|---|
| **I. Simplicity First** | ⚠️ → ✅ | ✅ | One new dependency, which the principle requires be justified. No native Vue/Vuetify/Firebase primitive generates QR codes, and hand-rolling Reed–Solomon + mask evaluation is out of the question at this size (research R1). Two lighter alternatives were considered and rejected on written grounds. YAGNI applied elsewhere: no composable extracted for a single consumer, no share-target abstraction, no config change. |
| **II. Incremental Quality** | ✅ | ✅ | Adds no dead code and leaves no TODOs. Three latent traps in existing code were found and documented during research (R5) rather than tripped over; the `?focus=true` finding in particular is written down so it survives this feature. |
| **III. Consistent UX & Component Reuse** | ✅ | ✅ | Vuetify throughout (`v-dialog`, `v-list-item`, `v-btn`) — no custom UI primitives. Reuses the page's established `v-dialog` pattern (delete confirm, focus mode) and its existing overflow menu. One deliberate, reasoned theme exception: the QR stays dark-on-light in dark mode (research R3). |
| **IV. Cost-Conscious Infrastructure** | ✅ | ✅ | Strictly zero marginal cost. No Firestore operation, no Function, no Cloud Run, no third-party call. The QR is computed on the device from a URL the page already knows (SC-008). |
| **V. Secure Defaults** | ✅ | ✅ | No auth, identity, or rules surface touched. FR-019 is a non-goal statement, not new logic: a shared link is a pointer and grants nothing. Drafts stay exactly as protected as they are now — the recipient hits the existing access path. No `v-html`; the QR is a data URL bound to `src`, never injected markup. |

**Gate result: PASS.** The single flagged item (new dependency) is justified in writing per Principle I's own stated test. Nothing in the Complexity Tracking table.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/019-qr-share-build/
├── spec.md              # Phase -1 (/speckit-specify)
├── plan.md              # This file
├── research.md          # Phase 0 — dependency choice, render approach, 3 code traps
├── data-model.md        # Phase 1 — derived view state (no persisted entities)
├── quickstart.md        # Phase 1 — manual verification checklist
├── contracts/
│   └── build-share-dialog.md   # Phase 1 — component + URL contract
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── views/builds/
│   └── BuildDetails.vue          # MODIFIED — "Share" menu item + dialog mount
├── components/builds/
│   ├── BuildShareDialog.vue      # NEW — the whole feature
│   ├── BuildHeader.vue           #   (unchanged — hosts the actions slot)
│   └── FocusMode.vue             #   (unchanged — the scan destination)
└── router/index.js               #   (unchanged — no route or chunk config change)

package.json                      # MODIFIED — adds `qrcode`
vite.config.mjs                   #   (unchanged — see below)
```

**Structure Decision**: One new component in `src/components/builds/`, alongside the other build-scoped components. `BuildDetails.vue` gains a menu item and a dialog mount and nothing else — all QR, share, and copy logic lives inside `BuildShareDialog.vue`, keeping the page a thin assembly of components per Constitution III.

**No composable is extracted.** The QR generation is roughly 25 lines with a single consumer; Constitution I says abstractions wait until duplication appears twice. If a second surface ever needs a QR, that is the moment to lift it into `src/composables/`.

**No build config change.** [vite.config.mjs:48-53](vite.config.mjs#L48-L53) only special-cases `firebase` and `vuetify` in `manualChunks`; everything else keeps Rollup's default per-dynamic-import splitting. A dynamic `import("qrcode")` therefore gets its own chunk automatically — the same path `jszip` and `easy-speech` already take, as the comment in that file describes.

## Design

### Placement

A `Share` item joins the existing overflow menu in [BuildDetails.vue:45-86](src/views/builds/BuildDetails.vue#L45-L86), placed above the export/download group since it is the more common intent. Selecting it opens `BuildShareDialog.vue`.

The QR lives in a **dialog**, not inline in the `v-menu`: the menu is an anchored popover sized to one-line items, while a scannable QR needs ~200 px square (FR-008). The page already uses `v-dialog` for the delete confirmation and for focus mode itself, so this is the established pattern rather than a new one. The dialog also gives FR-010's "code unavailable" message and FR-004's option list somewhere coherent to live.

### Dialog contents

| Element | Behaviour |
|---|---|
| Title — "Share build" | |
| QR image | Encodes the **focus-mode** URL. White padded container in both themes. `alt` text satisfies NFR-004. |
| Caption — "Scan to open on your phone" | Load-bearing: the only cue explaining why the QR differs from the link below. |
| Divider | |
| "Share…" | Rendered only when `useShare().isSupported` (FR-011/012). Sends the **plain** URL + build title. |

The QR is shown on mobile too. Hiding it by viewport would break the genuine case of someone scanning your phone with *their* phone, and a width-capped image costs nothing.

### The two URLs

Both are absolute (FR-018) and derived from `build.id` rather than `props.id`, so the code always matches the build actually rendered (FR-007, research R5.2).

```text
QR        →  {origin}/builds/{build.id}?focus=true      (FR-006)
Share…    →  {origin}/builds/{build.id}                 (FR-017)
```

**`?focus=true` — the value is mandatory.** [BuildDetails.vue:236-238](src/views/builds/BuildDetails.vue#L236-L238) truthiness-tests `route.query.focus`, and a bare `?focus` parses to the empty string, which is falsy. This is the feature's most dangerous detail: it passes code review and desktop click-through, and only fails when someone actually scans. See research R5.1.

### Generation and failure states

`import("qrcode")` fires on **first dialog open**, never at page load (FR-020, NFR-001). The result feeds `toDataURL()` into an `<img>` — chosen over `toCanvas()` because it gives `alt` for free, sidesteps `v-dialog`'s lazy content mounting (a canvas ref is `null` until the dialog opens), and makes FR-009 a one-line CSS rule. Research R2 has the full reasoning.

Three states, all required by FR-010 and NFR-002:

- **pending** — spinner while the chunk loads
- **ready** — the `<img>`
- **failed** — a plain "QR code unavailable" line; the Share option remains fully usable

Every async path is wrapped. `useShare` rejects with `AbortError` when the player dismisses the sheet, and FR-013 says that must never surface — it is caught and swallowed, not logged as an error. Nothing here may escape as an unhandled rejection (SC-007).

## Complexity Tracking

> No Constitution Check violations. Table intentionally empty.

The one item worth naming — adding `qrcode` — is not a violation: Principle I permits new dependencies that pass its stated test, and research R1 records the justification and the rejected alternatives.

## Phase 2 preview (not executed here)

`/speckit-tasks` will expand this into tasks. Expected shape, in dependency order:

1. Add the `qrcode` dependency.
2. `BuildShareDialog.vue` — shell, props/emits, Vuetify layout.
3. Both URL builders, including `?focus=true`.
4. Lazy QR generation with the three-state render.
5. Share option behind `isSupported`, with `AbortError` swallowed.
6. Wire the menu item and dialog into `BuildDetails.vue`.
7. Accessibility pass — `alt`, keyboard reachability (NFR-004).
8. Manual verification per `quickstart.md`, including a real cross-device scan in both themes.
