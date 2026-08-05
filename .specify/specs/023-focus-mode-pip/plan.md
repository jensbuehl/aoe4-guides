# Implementation Plan: Focus Mode — Floating Window (Document Picture-in-Picture)

**Branch**: `023-focus-mode-pip` | **Date**: 2026-08-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.specify/specs/023-focus-mode-pip/spec.md`

## Summary

Put focus mode in a real always-on-top OS window via Document Picture-in-Picture, by **moving** the
existing focus-mode DOM node into the PiP window rather than mounting a second instance — so the
timer, autoplay, step index and voice-over never restart. Ship two changes alongside it that make
the window usable when it gets there: a filled split button that makes Play the obvious action, and
a fixed-row focus-mode layout with container-query density tiers that survives a 320 px box.

The design turns on one Phase 0 finding: **the tick source cannot be trusted, so it must not carry
correctness.** Elapsed time is derived from a wall-clock anchor (FR-016), which makes a throttled
tick produce a *late* update rather than a *wrong* one. Driving the tick from the PiP document
(FR-024) then reduces how late. See [research.md](./research.md) R-1 and R-3.

## Technical Context

**Language/Version**: JavaScript (ES2022), Vue 3 Options+Composition API as used in the existing components

**Primary Dependencies**: Vue 3, Vuetify 3, VueUse (`useEventListener`, `useWakeLock`), vue-router. **No new dependency** — Document PiP is a platform API and the tiers are CSS (NFR-002)

**Storage**: `localStorage` for the play-target preference, via a new composable mirroring `useThemePreference.js`. No Firestore read, write or schema change (NFR-002, Principle IV)

**Testing**: No automated suite in this project. Manual golden-path verification per the constitution; Success Criteria SC-001…SC-007 are written as the test script

**Target Platform**: Web. Floating window on Chromium (Chrome, Edge); all other browsers keep today's behaviour with the feature absent, detected by capability not UA (NFR-006)

**Project Type**: Single-page web application (frontend only for this feature)

**Performance Goals**: < 300 ms from click to first paint of the floating window (NFR-005); no drift > 1 s across 10 autoplay steps while another application has focus (SC-001)

**Constraints**: Nothing scrolls in focus mode at any size; no text below 11 px; hit targets ≥ 44 px full tier and ≥ 26 px compact/micro; usable range 320×150 to full screen (FR-008, FR-009, FR-014)

**Scale/Scope**: 5 source files touched plus one new composable. ~4 000 builds, but this feature adds no query — it is pure client-side presentation

## Constitution Check

*GATE: passed before Phase 0. Re-checked after Phase 1 — see bottom.*

| Principle | Assessment | Verdict |
|---|---|---|
| **I. Simplicity First** | No new dependency. The composable is introduced because the PiP lifecycle is genuinely non-trivial (move, style carry, rebind, return, teardown) and is used by one component — not speculative abstraction. A wrapper library for one `requestWindow` call was rejected. The Web Worker fallback is explicitly *not* built unless T005 proves it necessary. | **PASS** |
| **II. Incremental Quality** | Four commits, each atomic: the FR-016 fix lands on `main` first, then a behaviour-neutral layout refactor, then tiers, then PiP, then the entry point. NFR-004 requires the refactor to ship with no behaviour change. Phase 1 also deletes a duplicated xs/non-xs branch rather than adding a third. | **PASS** |
| **III. Consistent UX & Component Reuse** | `v-btn-group`, `v-menu`, `v-list`, `v-btn` only; no custom dropdown. Theme tokens throughout, no hex literals, both themes carried into the PiP document. The resource strip becomes one data-driven component instead of two divergent copies. | **PASS** |
| **IV. Cost-Conscious Infrastructure** | Zero backend impact. No Firestore access, no Function, no Cloud Run. | **PASS** |
| **V. Secure Defaults** | No auth surface, no user data, no rules change. The PiP document is same-origin and receives only DOM this app already rendered. `localStorage` holds one non-sensitive enum. | **PASS** |

**No violations. Complexity Tracking section omitted as unnecessary.**

One note against Principle I, recorded rather than waived: the three-layer clock in R-3 is *more*
machinery than "call `setInterval` on the other window". It earns its place because layer 1 (FR-016)
is a bug fix that must happen regardless, and layers 2–3 are then nearly free — layer 2 is a choice
of which window schedules the same callback, and layer 3 is not built at all unless measured to be
needed.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/023-focus-mode-pip/
├── spec.md              # Feature spec (clarified 2026-08-05)
├── plan.md              # This file
├── research.md          # Phase 0 — R-1…R-8
├── data-model.md        # Phase 1 — client-side entities and state transitions
├── quickstart.md        # Phase 1 — how to run and verify it
├── contracts/
│   └── useStepPiP.md    # Phase 1 — composable interface contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
├── design-input.md      # Resolved geometry, tokens, copy (handoff, authoritative)
├── tasks.md             # Handoff task list; /speckit-tasks would regenerate
└── assets/              # The approved mock
```

### Source Code (repository root)

```text
src/
├── components/builds/
│   ├── FocusMode.vue              # MODIFIED — fixed-row grid, tiers, pop-out, dock, preview
│   └── BuildOrderEditor.vue       # MODIFIED — text Play button → split button + target menu
├── views/builds/
│   └── BuildDetails.vue           # MODIFIED — route the chosen target; close PiP on leave
└── composables/
    ├── usePlayTargetPreference.js # NEW — localStorage enum, mirrors useThemePreference.js
    └── builds/
        └── useStepPiP.js          # NEW — PiP lifecycle: open, carry, move, rebind, return
```

**Structure Decision**: Single-project SPA layout, already established. The feature adds two
composables and modifies three existing files. Composables live under `src/composables/` with the
build-specific one under `src/composables/builds/`, matching the existing split — `useThemePreference.js`
is app-wide and sits at the root, so `usePlayTargetPreference.js` joins it there, while `useStepPiP.js`
is build-specific and joins `timingsHelper.js` and friends.

## Phase Sequencing

Ordered so that each commit is independently reviewable and NFR-004 is honoured.

| Phase | Commit | Content | Gate |
|---|---|---|---|
| **0** | `fix:` on **`main`** | FR-016 wall-clock elapsed time, with re-anchoring on manual step change | Verify autoplay still tracks stated times on a long build |
| **0b** | *(spike, not committed)* | **T005** — measure whether a PiP-scheduled interval survives >5 min of a hidden opener | Decides whether layer 3 is built |
| **1** | `refactor:` | Fixed-row grid, container queries at full tier only, one data-driven resource strip | **No behaviour change** at 1920×1080 and 390×844 |
| **2** | `feat:` | compact and micro tiers, overflow for announcements, next-step preview, play/pause primary | No scrollbar or clipping from 1200 px down to 320×150 |
| **3** | `feat:` | `useStepPiP.js`, pop-out control, tick swap, wake-lock handover, theme re-copy, close-on-leave | SC-001, SC-002, SC-003 |
| **4** | `feat:` | Split button, target menu, preference, xs full-width, tooltip removal | SC-005, SC-007 |

Phase 1 must not begin before Phase 0 lands, because SC-001 measures drift against a baseline that
Phase 0 establishes.

## Phase 0 Findings That Changed the Design

Recorded here because they alter what the spec's requirements mean in practice. Full reasoning in
[research.md](./research.md).

1. **The PiP window's throttling behaviour is undocumented** — not by the WICG explainer, not by
   Chrome's docs. The one shipping Document PiP timer app found (Tomodoro) deliberately avoids
   depending on it, using a Web Worker with a wall-clock deadline instead. FR-024 is therefore
   demoted from *the* mechanism to the latency mechanism, with FR-016 carrying correctness. **This
   makes the feature safe to build before T005 returns an answer.**
2. **`requestAnimationFrame` is the wrong tick.** It is paused for unpainted documents, and an
   occluded window may stop entirely — which is the normal state when a game is in front. Use
   `setInterval` scheduled on the PiP window.
3. **SPA navigation will not close the window for us.** The platform closes the PiP window only when
   the opener loads a *new document*; this is a vue-router SPA, so build→build navigation does not.
   FR-004a is load-bearing, not belt-and-braces.
4. **`copyStyleSheets` no longer exists** in the specification. The manual rule-copy with a `<link>`
   fallback for cross-origin sheets is the only supported route.
5. **Re-anchoring is mandatory** in FR-016. The existing code resets elapsed time to the step start
   on manual navigation, so a naive `Date.now()` difference would break prev/next.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| PiP-scheduled interval is throttled anyway | Unknown — T005 | Layer 1 keeps times correct; build layer 3 (Web Worker) only if measured |
| Moving the DOM node breaks Vue reactivity or event bindings | Low | Vue holds element references, not parent-dependent ones; the node is moved, never re-created. Verify against SC-002 on a 42-step build |
| Vuetify overlays (`v-menu` for the announcements overflow) render into the **opener's** body, not the PiP document | **Medium** | Real risk: teleported overlays would appear in the wrong window. Test the compact-tier overflow menu inside the PiP window early in Phase 3; if it misbehaves, attach the menu to the focus-mode root |
| Theme switch while open leaves stale colours | Medium | Re-copy stylesheets and class list on theme change; already required by spec edge cases |
| Exclusive-fullscreen players see nothing | Certain, by OS design | Document in quickstart — the feature requires windowed/borderless fullscreen |

The `v-menu` teleport risk is the one most likely to cost unplanned time, and it is not mentioned in
the spec or the handoff. Worth probing in the first hour of Phase 3 rather than at the end.

## Constitution Re-check (post-design)

Re-evaluated after Phase 1 artifacts. **Still PASS on all five.** The design added no dependency, no
backend surface and no persistent data beyond one enum. The only addition since the pre-check is the
contingency Web Worker, which is explicitly gated behind a measurement and will not be written
speculatively — consistent with Principle I's "abstractions only when duplication has appeared" and
YAGNI.
