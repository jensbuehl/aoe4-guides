# Implementation Plan: Step Time Resolution — Correctness, Provenance and Reach

**Branch**: `022-step-time-resolution` | **Date**: 2026-08-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.specify/specs/022-step-time-resolution/spec.md`

## Summary

One new function — `resolveStepTimes()` — becomes the only place in the codebase where a step is
assigned a time. It fixes four reproduced defects, extends each build's reach past its last timestamp
using that build's own observed villager rate, and reports per-step provenance so an estimate can
never read as a fact. `getTimings()` shrinks to a strict wrapper over it, preserving Focus mode's
binary autoplay gate while widening it in two intended directions.

Three substantive changes from the spec, all found by reading the call sites rather than reasoning
about them:

1. **A backfill is mandatory, not excluded.** `useAgeTimings` prefers the stored `ageTimings` field
   over deriving, and ~4k builds carry values computed by the defective resolver. Without re-running
   `scripts/backfill-age-timings.mjs`, the fixes are correct and **invisible**. See
   [research.md](research.md) R-1.
2. **`derived` is kept, not replaced.** It has five consumers across three components — including
   `AgeChips.vue` and `BuildListCard.vue`, the home lanes and list cards, which the spec never
   mentions. Provenance is added *beside* it. See R-2.
3. **`FocusMode` calls two functions, not one.** Its `~` marking needs per-step provenance, which the
   strict wrapper deliberately does not carry. See R-5.

## Technical Context

**Language/Version**: JavaScript (ES2020+), Vue 3 Options API with `setup()`, matching the
surrounding build composables and components

**Primary Dependencies**: Vue 3, Vuetify 3. **No new dependency.** No game-data table — the single
permitted constant is the nominal fallback rate (A-3)

**Storage**: No schema change. `build.ageTimings` keeps its `{ t, e }` shape (R-3). One **one-time
backfill** of ~4k documents through the existing Admin SDK script (R-1); the home snapshot corrects
itself on the next hourly run at no extra write cost

**Testing**: No formal suite (constitution: manual golden-path testing). A **throwaway** Node harness
verifies the resolver, extending `scratchpad/probe.mjs` from the spec's evidence phase, plus a
golden-file diff for the SC-005 regression guard (R-9)

**Target Platform**: Desktop and mobile web. Unlike `021` this feature is **not** desktop-only — Focus
mode and the age chips are phone surfaces

**Project Type**: Single-page Vue 3 web app, plus one developer script

**Performance Goals**: Resolution < 5 ms for a 30-step build; no new work on the detail-page load path
beyond what `020`/`021` already do

**Constraints**: Every build that autoplays today must still autoplay, announcing every step at the
same second (SC-005). No file gains a civilization → rate mapping (SC-008). `AgeChips.vue` and
`BuildListCard.vue` render pixel-identically

**Scale/Scope**: ~4k builds; six source files, one script, one backfill run

## Constitution Check

*GATE: passed before Phase 0, re-checked after Phase 1 — see below.*

| Principle | Assessment |
|---|---|
| **I. Simplicity First** | **Pass, and Phase 0 pulled it further this way.** No dependency, no civ table, no tech table (SC-008) — the whole design exists to avoid modelling what it can measure. Three simplifications came out of research: `derived` is kept rather than replaced (R-2), the stored field is not widened to a tri-state (R-3), and the strict wrapper is narrowed to one field rather than widened to carry provenance (R-4). The one place complexity grows is the resolver itself, which absorbs complexity from three call sites that were each working around the old contract. |
| **II. Incremental Quality** | **Pass — the principle doing the most work here.** NFR-003 splits the work into three separable groups so a regression bisects. The correctness fixes land first and change nothing a reader sees except that wrong numbers become right. R-5 records a real code smell found on the way (Focus mode mutating `step.time` on the objects it cloned) as a TODO rather than folding an unrelated refactor into this feature. |
| **III. Consistent UX & Component Reuse** | **Pass.** No new component and no new visual vocabulary: `~` already means "not stated by the author" and is reused rather than joined by a second symbol (FR-019, A-10); the dashed tail reuses `.eco-guide`'s existing dash. The only new copy is one footnote string. Business logic stays in composables — the components receive numbers and render them. |
| **IV. Cost-Conscious Infrastructure** | **Pass, with one cost to declare.** No new read, index, collection or schema field. The backfill is ~4k writes, one time, against a 20k/day free-tier allowance — about a fifth of one day (R-1). It is deliberately *not* replaced by live derivation, which would be the expensive option: the home lanes read a pre-generated summary with no `steps` at all. |
| **V. Secure Defaults** | **Not engaged for the app change** — read-only derivation of data already on the page, no auth, no rules, no new route. **Engaged for the backfill**: it runs through the Admin SDK because `firestore.rules` restricts build writes to each build's author, defaults to a dry run, and refuses to write when it cannot identify the target project. All three behaviours already exist in the script and are preserved. |

**Complexity Tracking**: no violations to justify — the table is omitted.

## Spec corrections — applied 2026-08-05

Phase 0 invalidated three statements. All three are fixed in [spec.md](spec.md):

| # | Was | Now | Source |
|---|---|---|---|
| 1 | **NFR-002**: "no Firestore read, write, index, schema change, or **backfill**" | Split: **NFR-002** keeps no read/index/schema change; **NFR-002a** requires the one-time ~4k-write backfill and states its cost. Without it the feature is invisible. | R-1 |
| 2 | **FR-016**: provenance replaces "today's `derived` boolean" | Rewritten — provenance is added **beside** `derived`, which is retained. **SC-006** widened to name `AgeChips.vue` and `BuildListCard.vue` as files that must **not** change, and a new **SC-009** asserts they are byte-identical. | R-2 |
| 3 | **FR-015a** implied Focus mode reads provenance from the gate | Clarified — `FocusMode` calls `resolveStepTimes()` for provenance and `getTimings()` for the gate. The strict wrapper stays one field wide. | R-4, R-5 |
| 4 | **FR-004**: an anchor needs a timestamp **and** a villager count | Widened — an anchor is any step whose timestamp parses. Found during implementation, not Phase 0. Requiring a villager count denies every time to a build stamped only at its age-ups, which the spec elsewhere calls a common shape. Made the `age-ups-only` fixture resolve fully and gain autoplay. | implementation |
| 5 | **NFR-002a**: backfill "mandatory — the feature is invisible without it" | Downgraded to SHOULD. `AgeTimeline` calls `getAgeTimings()` directly and `FocusMode` calls `getTimings()` directly; neither reads the stored field. Its only consumer is `BuildListCard`, so the backfill affects **list-card and home-lane chips alone**. Phase 0 over-corrected an under-corrected draft. | R-1 correction |
| 6 | **FR-009**: flat 8-step / 120-second horizon | Duration bound made **relative** — `max(120 s, 25% of the build's measured span)` — plus new **FR-009a**: the first projected step is always placed. A step is not a unit of time; a flat cap sized for Dark Age refused a real 18:00 build on its single trailing step, costing it all autoplay. | live build `dp327…` |

None changes what the feature *is*. Correction 1 is the significant one: it moves a required step
from "excluded" to "mandatory".

## Project Structure

### Documentation (this feature)

```text
.specify/specs/022-step-time-resolution/
├── plan.md                        # This file
├── research.md                    # Phase 0 — R-1..R-9
├── data-model.md                  # Phase 1 — derived shapes
├── quickstart.md                  # Phase 1 — manual verification pass
├── contracts/
│   ├── resolve-step-times.md      # The new resolver
│   └── get-timings.md             # The strict wrapper
├── checklists/requirements.md
└── tasks.md                       # /speckit-tasks output — NOT created here
```

### Source Code (repository root)

```text
src/
├── components/builds/
│   ├── FocusMode.vue              # MODIFIED — `~` marking; two calls, not one (R-5)
│   ├── AgeTimeline.vue            # MODIFIED — footnote copy per tier. No geometry change
│   ├── EcoLines.vue               # MODIFIED — split polyline, dashed after last anchor
│   ├── AgeChips.vue               # UNTOUCHED — reads `derived`, which is retained (SC-009)
│   └── BuildListCard.vue          # UNTOUCHED — same (SC-009)
├── composables/builds/
│   ├── timingsHelper.js           # REWRITTEN — resolveStepTimes() + strict getTimings()
│   ├── useAgeTimings.js           # MODIFIED — reads the resolver; +provenance, keeps derived
│   ├── useEcoSeries.js            # MODIFIED — reads the resolver; per-point `stated`
│   └── villagerAggregator.js      # UNTOUCHED, byte-identical (SC-007)
└── composables/data/
    └── buildService.js            # UNTOUCHED — stamps via toStoredAgeTimings, unchanged shape

scripts/
└── backfill-age-timings.mjs       # UNCHANGED CODE, but must be RUN (R-1)
```

**Structure Decision**: The existing `components/` + `composables/` split is followed exactly.
`timingsHelper.js` gains one export and loses an algorithm; the two chart composables lose their
local leniency workarounds, which is the diff that makes this feature a net simplification at the
call sites even though the helper grows.

## Implementation Approach

Three separable groups per NFR-003. Group (c) must land as one commit — see below.

### Group A — correctness and the seam *(no visible change except wrong numbers becoming right)*

**A1 — `refactor:` capture the baseline.** Extend `scratchpad/probe.mjs` with a `--dump` mode and
record `golden-main.json` plus a backfill dry-run report **from `main`** (quickstart steps 1–2).
Nothing else can be verified once `main` is left behind.

**A2 — `feat:` the resolver.** `resolveStepTimes()` per
[contracts/resolve-step-times.md](contracts/resolve-step-times.md): running villager counts (D2),
usable-span test covering zero and negative deltas (D1, D4), clamping and monotonicity, notes exempt
(D3), implicit `0:00` bound as a lower clamp only (R-8). No extrapolation yet — the horizon is dead
code in this commit.

**A3 — `refactor:` the strict wrapper.** `getTimings()` reimplemented over the resolver, returning
`[{ startTime }]` (R-4). Notes exempt. Extrapolation still not admitted, so the gate widens only for
D3. `useAgeTimings` and `useEcoSeries` switch to the resolver and delete their `try`/`catch`
workarounds; `useAgeTimings` gains `provenance` beside `derived` (R-2).

### Group B — reach *(extends what is drawn)*

**B1 — `feat:` extrapolation and the horizon.** Observed rate from the build's last usable span,
nominal fallback only when no span exists, stop at 8 steps or 120 seconds (FR-008, FR-009). Tune the
constants against the backfill dry run (R-7) and **write the distribution into the quickstart** — A-9
promises those numbers are recorded, not left as folklore.

**B2 — `feat:` the dashed tail.** `useEcoSeries` marks each point `stated`; `EcoLines` splits each
resource into solid and dashed polylines sharing the boundary point (R-6). Legend, colours, caps and
geometry untouched.

**B3 — `feat:` the footnote tiers.** `AgeTimeline.vue` picks footnote copy from provenance, naming the
weaker tier when a build spans both (FR-020, FR-021). Marker, placement and de-emphasis unchanged.

### Group C — the widened gate *(must land as ONE commit)*

**C1 — `feat:` admit extrapolated times to autoplay, and mark them.** `getTimings()` accepts
`extrapolated`; `FocusMode` calls `resolveStepTimes()` alongside it and prefixes every non-authored
time with `~` at the point it writes `step.time` (R-5).

> **This is the one ordering the feature forbids splitting.** Shipping the widened gate without the
> marking would put estimated times into playback unlabelled — a regression in honesty delivered as
> an improvement in reach. FR-014 and FR-015a are one commit.

### Group D — make it visible

**D1 — `chore:` run the backfill.** Dry run on dev, apply on dev, verify, then prod (quickstart step
7). **Not optional**: until this runs, every existing build still reads its old wrong number from the
stored field (R-1). The script's code does not change.

## Post-Design Constitution Re-Check

Re-evaluated after the contracts were written: **still passing, no new violations.**

Three things were pulled *back* toward simplicity while designing — `derived` kept rather than
replaced (R-2), the stored field left at one bit rather than widened to three states (R-3), and the
strict wrapper narrowed to a single field rather than widened to serve `FocusMode` (R-4). Each
removed work the spec had implied.

One cost grew and is declared rather than hidden: the backfill (R-1), ~4k writes, one time. It was
not in the spec because the spec assumed the fixes would take effect on their own. They would not.

One smell was found and deliberately **not** fixed: `FocusMode` mutates `step.time` on the step
objects it cloned, which is why the `~` has to be applied at write time rather than in the template
(R-5). Untangling it touches the progress and elapsed-time maths and belongs to its own feature.
Recorded as a TODO per Principle II rather than folded in here.
