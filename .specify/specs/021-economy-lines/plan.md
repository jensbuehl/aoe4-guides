# Implementation Plan: Economy Lines — Collapsible Villager Distribution

**Branch**: `021-economy-lines` | **Date**: 2026-08-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.specify/specs/021-economy-lines/spec.md`

## Summary

A collapsed-by-default disclosure row inside the existing `AgeTimeline.vue` card reveals five
unstacked polylines — absolute villagers on builders / food / wood / gold / stone — drawn on the
timeline's own x-scale, so age-up guides land exactly under the crests above them. No new data, no
new dependency, no charting library: a derivation composable feeding a pure inline-SVG renderer.

Two substantive changes from the spec, both found by looking at real output rather than reasoning
about it:

1. **How a step gets its x.** Phase 0 established that `getTimings()` returns `null` for any build
   whose trailing steps are unstamped — a very common shape — so the series resolves each step's
   time independently (stated first, interpolated second, unplottable third) instead of gating the
   whole feature on one all-or-nothing call. See [research.md](research.md) R-1.
2. **What a blank cell means.** The spec said "unchanged" and carried values forward. It means
   *zero*: `aggregateVillagers` sums the five cells reading a blank as nobody, so on a step showing
   only `wood 7` the `N vils` marker says 7 while a carried plot claimed 13 — the plot contradicting
   the number printed beside it. Each point now reads its own step, and a step that assigns nobody
   at all contributes no point. See R-10.

## Technical Context

**Language/Version**: JavaScript (ES2020+), Vue 3 Options API with `setup()`, as used by the
surrounding build components

**Primary Dependencies**: Vue 3, Vuetify 3. **No new dependency** — the plot is hand-written SVG

**Storage**: None new. Reads `build.steps`, already loaded by the page. One `localStorage` key for
the open/closed preference. No Firestore read, write, schema field, or index

**Testing**: No formal suite (constitution: manual golden-path testing). A **throwaway** Node
harness verifies the derivation, matching the approach `020` used; it is not committed as a suite

**Target Platform**: Desktop web, `md` breakpoint and wider. The row and plot are absent at xs/sm

**Project Type**: Single-page Vue 3 web app (frontend only for this feature)

**Performance Goals**: Series derivation < 5 ms for a 30-step build; no layout shift on mount; the
SVG mounts only on first expand

**Constraints**: Collapsed card pixel-identical to today's apart from the disclosure row; age-up
guides at `±0 px` from the crests; plot non-interactive and `aria-hidden`

**Scale/Scope**: ~4k builds, five files touched, two of them new

## Constitution Check

*GATE: passed before Phase 0, re-checked after Phase 1 — see below.*

| Principle | Assessment |
|---|---|
| **I. Simplicity First** | **Pass.** No dependency added — five polylines do not justify a charting library. The open-state preference stays inline in `AgeTimeline.vue` rather than becoming a composable, because there is exactly one call site (R-8). `flattenSections` returns a bare array, not a richer object neither caller needs (R-6). |
| **II. Incremental Quality** | **Pass, and this is the principle doing real work here.** The flatten extraction ships as its own `refactor:` commit with no behaviour change, before any feature code, so the two charts cannot drift on step indices. The `parseVillagerCountString` export ships in the same refactor commit. |
| **III. Consistent UX & Component Reuse** | **Pass.** Disclosure row is a Vuetify `v-btn`; reveal is `v-expand-transition`; legend uses Vuetify typography classes. The only bespoke drawing is the SVG itself, which has no Vuetify equivalent — the same justification the existing `.age-track` ramp already carries in this file. Both themes declared. |
| **IV. Cost-Conscious Infrastructure** | **Pass, trivially.** Zero backend surface. No Firestore read, write, index, or schema change; the preference lives in `localStorage` precisely so it does not become a per-page-load document read. |
| **V. Secure Defaults** | **Not engaged.** Read-only rendering of data the page already displays. No auth, no rules, no user input, no new route. |

**Complexity Tracking**: no violations to justify — the table is omitted.

## Spec corrections — applied 2026-08-05

Phase 0 invalidated three statements in the spec. All three are now fixed in [spec.md](spec.md):

| # | Was | Now | Source |
|---|---|---|---|
| 1 | **FR-006** made `getTimings() === null` a null condition for the whole series | Split: **FR-006** defines per-step time resolution and forbids a build-wide failure from suppressing the chart; **FR-006a** carries the coverage gate | [research.md](research.md) R-1 |
| 2 | **US3 scenario 3**: "the whole card is already absent in this case under `020`" | Rewritten — the card is *not* absent; `getAgeTimings` survives a `null` by reading each boundary's own timestamp. The scenario now asserts that a build with **no plottable points** shows no row | R-1 |
| 3 | **FR-006** floor counted "stated steps"; **SC-006** listed four changed files | Floor counts **plotted points** (R-2); SC-006 widened to five files (R-5) | R-2, R-5 |

None of these change what the feature *is* — they change the conditions under which it appears, in
the direction of appearing more often, on the builds it was designed for.

### And one thing deliberately *not* relaxed

`getTimings()` keeps its all-or-nothing contract, and `timingsHelper.js` is byte-identical to `main`
when this merges (**SC-007**, **A-9**). Focus mode gates autoplay directly on it —
`autoplaySupported = getTimings(steps) ? true : false` — and autoplay is genuinely binary: a build
either plays through or it does not. There is no half-auto mode to degrade into.

So the same call is read two ways on purpose: **strictly by the player, leniently by the plot.** All
the leniency lives in `useEcoSeries`. Anyone tempted to "fix" the helper to return partial timings
would silently hand autoplay builds it cannot play.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/021-economy-lines/
├── plan.md                      # This file
├── research.md                  # Phase 0 — R-1..R-9
├── data-model.md                # Phase 1 — derived shapes
├── quickstart.md                # Phase 1 — manual verification pass
├── contracts/
│   ├── eco-series.md            # useEcoSeries contract
│   └── eco-lines.md             # EcoLines props + rendering contract
├── design-input.md              # Handoff — resolved tokens, geometry, copy
├── design-handoff-README.md     # Handoff — why this shape
├── tasks-handoff-draft.md       # Handoff — pre-plan task sketch
├── checklists/requirements.md
└── tasks.md                     # /speckit-tasks output — NOT created here
```

### Source Code (repository root)

```text
src/
├── components/builds/
│   ├── AgeTimeline.vue          # MODIFIED — disclosure row, preference, passes scale + ages down
│   └── EcoLines.vue             # NEW — pure SVG renderer, no store, no derivation
└── composables/builds/
    ├── useAgeTimings.js         # MODIFIED — flattenSections() extracted and exported
    ├── useEcoSeries.js          # NEW — per-step series, time resolution, coverage gate
    ├── villagerAggregator.js    # MODIFIED — export parseVillagerCountString, no logic change
    └── timingsHelper.js         # UNTOUCHED, byte-identical — Focus mode's autoplay gate (SC-007)
```

**Structure Decision**: The existing `src/components/builds/` + `src/composables/builds/` split is
followed exactly — derivation in a composable, rendering in a component, page templates untouched
(Principle III). `EcoLines.vue` takes everything it draws as props and reads no store, which is what
keeps the two charts on one x-scale by construction rather than by discipline.

## Implementation Approach

### Commit 1 — `refactor:` shared flatten + parser export (no behaviour change)

`flattenSections(steps)` is lifted out of `getAgeTimings` and exported; the boundary pass walks
sections a second time with its own cursor where it used to read `flat.length` (R-6).
`parseVillagerCountString` is exported unchanged from `villagerAggregator.js` (R-5). Verified by
rendering an existing build and diffing the timeline against `main` — nothing on screen may move.

### Commit 2 — `feat:` the series

`useEcoSeries.js` per [contracts/eco-series.md](contracts/eco-series.md): flatten via the shared
helper, resolve each step's time (stated → interpolated → unplottable), carry each resource column
forward, treat an explicit `"0"` as stated (**not** via `hasResourceValue`, R-4), then apply the
two-part gate. Wrapped in `try`/`catch` returning `null`, like `getAgeTimings`.

### Commit 3 — `feat:` the plot

`EcoLines.vue` per [contracts/eco-lines.md](contracts/eco-lines.md): five polylines, y floor of 16
extended in fours, gridlines and labels, dashed guides **from the `ages` prop** (R-3), the
"no villagers assigned after" note, legend naming all five columns. `aria-hidden`, non-focusable,
non-interactive. Resource colours declared per theme in scoped style, mirroring `.age-seg-*`.

### Commit 4 — `feat:` the disclosure

`AgeTimeline.vue` gains the row inside the existing `d-none d-md-block` block, `v-expand-transition`
+ `v-if` with no `appear` (R-9), chevron rotation by CSS transform, `aria-expanded`, and the
`localStorage`-backed preference inline (R-8). The collapsed card must remain pixel-identical apart
from the row.

## Post-Design Constitution Re-Check

Re-evaluated after the contracts were written: **still passing, no new violations.** Two things were
pulled *back* toward simplicity while designing — the preference stayed inline instead of becoming a
fifth module, and `flattenSections` kept a one-value return instead of the `{ flat, sectionOffsets }`
shape that would have been convenient for exactly one caller. The one place complexity grew is time
resolution in `useEcoSeries` (three ordered strategies instead of one call), and that buys
correctness on the majority of real builds rather than capability.
