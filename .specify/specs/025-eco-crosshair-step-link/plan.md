# Implementation Plan: Crosshair Readout & Step ↔ Timeline Linking

**Branch**: `025-eco-crosshair-step-link` | **Date**: 2026-08-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.specify/specs/025-eco-crosshair-step-link/spec.md`

## Summary

Give the economy plot a crosshair that **snaps to the moments the author described** rather than
following the pointer, and use the step identity that snapping requires to link the chart and the
build order table in both directions.

The design turns on one observation, stated as spec A-3 and load-bearing everywhere below:
**the uncertainty in this chart is horizontal, not vertical.** A series point only exists where the
author filled cells, so its five counts are always authored; only its *time* may be derived. That is
what makes a snapped readout safe to quote verbatim — and what makes reading the sloping line
between two points unsafe, since the slope is a drawing convention inherited from `021`, not a
claim about the values along it.

The link is keyed on **time**, not on series points. Roughly half of a build's steps produce no
point (`getEcoSeries` drops redundant, non-stating and unplaceable ones) but nearly all of them have
a resolved time, so a comment or age-up row can still light up its moment on the age track. The
Active Moment is therefore *time-required, point-optional* — see
[data-model.md](./data-model.md#2-active-moment-new).

## Technical Context

**Language/Version**: JavaScript (ES2022), Vue 3 — Options API `setup()` as used by the components
being touched

**Primary Dependencies**: Vue 3, Vuetify 3.8, `@vueuse/core` 13 (`useElementVisibility`),
`scroll-into-view-if-needed` 3.1. **No new dependency** — both of the latter are already installed
and already used elsewhere in the app (research R-4, R-5)

**Storage**: None. Nothing is persisted — not Firestore, not `localStorage`. The state lives for one
page view

**Testing**: No automated suite in this project. Manual golden-path verification per the
constitution; [quickstart.md](./quickstart.md) items 1–23 are the test script, and SC-001…SC-008 map
onto them

**Target Platform**: Web, desktop only. The plot renders from `md` up; below that the card falls
back to `AgeChips`, which has no time axis to point at (spec A-6)

**Project Type**: Single-page web application, frontend only

**Performance Goals**: Pointer tracking must not thrash layout — plot geometry is read once per
resize, not per pointer move (NFR-005). Nearest-point search is a linear scan over ≤ ~60 points
(research R-8)

**Constraints**: The card's resting appearance must be unchanged (SC-006). The figure stays
`aria-hidden` with no focusable control introduced inside it (NFR-006). The readout must never cover
the dots it describes, on a plot only 140 px tall (FR-011)

**Scale/Scope**: 6 source files touched, 1 new composable. ~4 000 builds, but this feature issues no
query — it is pure client-side presentation over data the page already holds

## Constitution Check

*GATE: passed before Phase 0. Re-checked after Phase 1 — see bottom.*

| Principle | Assessment | Verdict |
|---|---|---|
| **I. Simplicity First** | No new dependency; the two libraries used are already installed for other features. The one new abstraction — the section-offset helper — is extracted because the duplication **already exists twice** (research R-3), which is exactly the bar the principle sets. A binary search over the points and a Web-Worker-free scroll latch were both rejected as YAGNI. The composable's surface is deliberately small: no policy, no timers, no listeners. | **PASS** |
| **II. Incremental Quality** | Four commits, each atomic and independently reviewable. The first two are behaviour-neutral (`refactor:` extracting the offset walk, then `feat:` adding `stepIndex` to points) and can land on their own. The offset extraction **removes** a duplicated loop rather than adding a third copy. | **PASS** |
| **III. Consistent UX & Component Reuse** | The readout is a `v-tooltip`, not a bespoke floating div (research R-1). The row highlight reuses the table's existing hover treatment rather than inventing a second visual language for "this row" (spec A-4). The rule and dots follow the positioned-HTML pattern the card already uses for gridlines, guides and end caps (research R-7). Scrolling reuses the package and options already used in `IconAutoCompleteMenu.vue`. | **PASS** |
| **IV. Cost-Conscious Infrastructure** | Zero backend impact. No Firestore read or write, no Function, no Cloud Run, no schema change. | **PASS** |
| **V. Secure Defaults** | No auth surface, no user data, no rules change, nothing persisted. Renders only data the page already fetched and already displays in the table below. | **PASS** |

**No violations. Complexity Tracking section omitted as unnecessary.**

One note recorded rather than waived, against Principle I: the Active Moment's *time-required,
point-optional* shape is more machinery than "the highlighted point". It earns its place because the
simpler shape cannot express the case in FR-020 — a row that says nothing about villagers but still
has a position in the game — and that case is roughly half of all rows, not an edge.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/025-eco-crosshair-step-link/
├── spec.md                     # Feature spec (clarified 2026-08-06)
├── plan.md                     # This file
├── research.md                 # Phase 0 — R-1…R-10
├── data-model.md               # Phase 1 — client-side entities and state transitions
├── quickstart.md               # Phase 1 — how to run and verify it
├── contracts/
│   └── useStepHighlight.md     # Phase 1 — composable interface contract
├── checklists/
│   └── requirements.md         # Spec quality checklist
└── tasks.md                    # Phase 2 output — /speckit-tasks, NOT created here
```

### Source Code (repository root)

```text
src/
├── components/builds/
│   ├── EcoLines.vue                  # MODIFIED — pointer tracking, snapped rule, dots, readout
│   ├── AgeTimeline.vue               # MODIFIED — renders the rule on the age track too
│   ├── BuildOrderEditor.vue          # MODIFIED — uses the extracted offsets; owns row scrolling
│   └── BuildOrderSectionEditor.vue   # MODIFIED — publishes row hover, consumes row highlight
├── composables/builds/
│   ├── useStepHighlight.js           # NEW — the shared channel (factory, provide/inject)
│   ├── useEcoSeries.js               # MODIFIED — stepIndex on each point (additive)
│   └── useAgeTimings.js              # MODIFIED — shared section-offset helper (extraction)
└── views/builds/
    └── BuildDetails.vue              # MODIFIED — creates and provides the highlight
```

**Structure Decision**: The established single-project SPA layout, unchanged. The new composable is
build-specific, so it joins `useEcoSeries.js`, `useAgeTimings.js` and `timingsHelper.js` under
`src/composables/builds/` rather than the app-wide `src/composables/` root — matching the split
`023` established when it put `useStepPiP.js` there and `usePlayTargetPreference.js` at the root.

The section-offset helper goes into `useAgeTimings.js` because that is where `flattenSections`
already lives, and the offsets are a property of that same flattening — putting them anywhere else
would separate two halves of one idea.

## Phase Sequencing

Ordered so each commit is independently reviewable, and so the two behaviour-neutral changes land
before anything user-visible.

| Phase | Commit | Content | Gate |
|---|---|---|---|
| **0** | `refactor:` | Extract the per-section offset walk from `BuildOrderEditor.vue:218-235` into `useAgeTimings.js`; call it from both existing callers | **No behaviour change.** `resolvedTimes` produces identical output on B3 (multi-section) |
| **1** | `feat:` | `stepIndex` on every series point | **No visible change.** A build that charts today charts identically |
| **2** | `feat:` | `useStepHighlight.js`; pointer tracking, snapped rule, dots, readout in `EcoLines.vue`; provide from `BuildDetails.vue` | SC-001, SC-002, SC-003 — quickstart 1–8 |
| **3** | `feat:` | Chart → step: row highlight, click-to-scroll | SC-004 — quickstart 9–13 |
| **4** | `feat:` | Step → chart: row hover out, viewport gate, scroll latch, rule on the age track | SC-005, SC-007, SC-008 — quickstart 14–21 |

Phase 0 must land before Phase 3, because the row highlight is where a section-local index would
silently produce the wrong row. Phases 3 and 4 are independent of each other and can swap.

**Phase 2 is a complete, shippable feature on its own.** If phases 3 and 4 never happen, the
crosshair still answers the original complaint — you stop needing to *follow* a line once you can
*read* all five at once.

## Phase 0 Findings That Changed the Design

Full reasoning in [research.md](./research.md).

1. **The section→flat mapping already exists twice** (R-3), written out in `BuildOrderEditor.vue`
   and implied in `useEcoSeries.js` — with a comment at `BuildOrderEditor.vue:213-216` explicitly
   noting it was the second caller and would be worth extracting on a third. This feature is the
   third. What was scoped as new work is now a deletion plus a phase-0 refactor.
2. **Both libraries this feature needs are already installed** (R-4, R-5).
   `scroll-into-view-if-needed` is already used for the same shape of problem in
   `IconAutoCompleteMenu.vue:73-90`, and `@vueuse/core` gives `useElementVisibility` for the
   viewport gate. The dependency budget for this feature is zero.
3. **A timeout is the wrong way to suppress hover during scroll** (R-6). The obvious latch-and-expire
   approach guesses at a duration with no good value. Releasing the latch on a pointer move that
   *actually changed coordinates* uses the real signal — with the caveat that some browsers
   synthesise a `mousemove` after scrolling, which is why the coordinate comparison is required
   rather than merely tidy.
4. **Vuetify's own tooltip flipping is the right answer to the wrong question** (R-2). It flips
   against the viewport, not against the rule, so it would sit on top of the dots in the middle of a
   wide plot. The side is computed from the rule's position instead.
5. **`points[i].stepIndex !== i`.** Points are sorted by time after indices are attached, so a build
   with out-of-order timestamps has non-monotonic indices. Array position is never a step index.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Rows light up in sequence while scrolling with a stationary pointer | **Medium** | R-6's coordinate-comparing latch. Quickstart item 19 exists specifically to catch it; the timeout fallback is documented if the comparison proves unreliable |
| Section-local index reaches the shared state and highlights the wrong row | Medium | Phase 0 makes one implementation the only route. **All index checks run on B3**; a single-section build cannot distinguish the two spaces |
| `v-tooltip` re-renders or animates on every snap, making the readout flicker as it jumps | **Medium** | The most likely source of unplanned time. Keep one tooltip instance and move its coordinate target rather than mounting per moment; disable the open/close transition if it fights the jumps |
| The readout still covers something worth reading at narrow `md` widths | Medium | Side is computed, not flipped (R-2). If `md` proves too narrow for any side to be clear, the fallback is the legend-row readout the author rejected in clarification — recorded so the option is not re-litigated from scratch |
| Vuetify's overlay teleports the readout to `body`, escaping the card's stacking context | Low | Standard `v-tooltip` behaviour and generally desirable; verify it does not sit under the sticky header |
| The crosshair fights the 12 px line hit strokes shipped ahead of this spec | Low | Different event surfaces — the plot tracks `pointermove` on its container, the hit strokes handle `mouseenter`. FR-013 requires both to work; quickstart item 8 checks it |

The tooltip-flicker risk is the one most likely to cost unplanned time, and it is not visible in the
spec. Worth probing in the first hour of Phase 2 rather than discovering at the end — a readout that
strobes as the rule jumps would undermine the whole snapping design, which depends on the jump
reading as deliberate.

## Constitution Re-check (post-design)

Re-evaluated after Phase 1 artifacts. **Still PASS on all five.**

The design added no dependency, no backend surface and nothing persistent. Since the pre-check, two
things moved *toward* the principles rather than away: the offset extraction became a net deletion
of duplicated code (Principle II), and the readout was confirmed to need no custom positioning code
at all (Principle III, research R-1).

The only addition is `useStepHighlight.js`, and its contract is deliberately minimal — no policy, no
timers, no listeners, three writers and three readers. Its non-goals section explicitly refuses to
become a general step-selection bus, which is the shape this kind of composable usually rots into.
