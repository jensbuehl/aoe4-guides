# Implementation Plan: Age-Up Band — Drawing the Transition as a Span

**Branch**: `026-age-up-band` | **Date**: 2026-08-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.specify/specs/026-age-up-band/spec.md`

## Summary

Draw each age transition as a **band on the timeline track**, running from click-up to arrival, so
its width is its duration. The card already computes that duration and already shows it — but only
to a reader who hovers a crest, which means only to a reader who already suspected it was there.

The design turns on one structural fact, found in Phase 0 and load-bearing everywhere below:
**`getAgeSegments()` cuts the track into runs over `[0, scaleSeconds]`, and the track is a flex
row.** Adding bands is therefore not "drawing something on top of the track" but "cutting the track
into more pieces". FR-007 — every second accounted for exactly once, with the age segments yielding
the band's width — stops being arithmetic to get right and becomes a property of the construction
(research [R-1](./research.md#r-1--the-band-is-a-flex-child-not-an-overlay)).

Two findings shrank the work and one grew it:

- The band's colour needs **no lookup**. The ramp index is positional, so a band leading into
  `ages[i]` shares an index with the run that follows it ([R-4](./research.md#r-4--which-ramp-step-a-band-takes-worked-out)).
- One of the spec's edge cases — a transition running past the end of the scale — is **unreachable**
  ([R-6](./research.md#r-6--one-edge-case-in-the-spec-cannot-occur)).
- FR-010 as written was **unsatisfiable**, which is what first surfaced the provenance treatment as
  a real design question rather than a detail. It was resolved during implementation by **withdrawing
  US2 altogether**: every band is striped, because that is how an age-up in progress reads in the
  game, and the `~` on the crest already carries provenance. See *Design change* below.

## Technical Context

**Language/Version**: JavaScript (ES2022), Vue 3 — Options API `setup()`, matching both files touched

**Primary Dependencies**: Vue 3, Vuetify 3.8. **No new dependency, no new import, and no CSS feature
newer than `rgba()`.** Colours are held as channel triplets in custom properties — the form the track's
own background already uses, and Vuetify's own token convention
([R-8](./research.md#r-8--channel-triplets-not-color-mix-revised-during-implementation))

**Storage**: None. Nothing persisted, no schema change, no `localStorage`. Every value drawn is
already returned by `getAgeTimings()`

**Testing**: No automated suite (constitution; spec A-6). [quickstart.md](./quickstart.md) items
1–24 are the test script, gated per phase; SC-001…SC-007 map onto them

**Target Platform**: Web, desktop only. The track renders `d-none d-md-block`; below `md` the card
falls back to `AgeChips`, which has no time axis for a span to sit on (spec A-5)

**Project Type**: Single-page web application, frontend only

**Performance Goals**: None meaningfully changed. `getAgeSegments` goes from `ages.length + 1` to at
most `2 × ages.length + 1` array entries — a maximum of 7 flex children where there were 4

**Constraints**: Card height and crest positions must not move (FR-019, FR-020) — structurally safe,
see [R-7](./research.md#r-7--height-and-crest-positions-are-structurally-safe). A band must be
visible at its narrowest with **no minimum width**, since a floor would make a short transition look
longer than it was (FR-008)

**Scale/Scope**: **2 source files**, 1 function extended, **0 template lines changed**, ~30 lines of
CSS. No query, no read, no write — pure client-side presentation over data the page already holds

## Constitution Check

*GATE: passed before Phase 0. Re-checked after Phase 1 — see bottom.*

| Principle | Assessment | Verdict |
|---|---|---|
| **I. Simplicity First** | No new dependency, no new component, no new composable, no new derivation. The one extension is to a function with exactly one caller ([R-2](./research.md#r-2--getagesegments-has-exactly-one-caller)). Two tidier designs were rejected as YAGNI: splitting `key` into `{ key, kind, step }` (nothing needs it until a second consumer exists) and an age→colour map (index already carries colour). | **PASS** |
| **II. Incremental Quality** | Two commits, each atomic. The first is a behaviour-neutral `refactor:` that **removes** a duplicated colour literal rather than adding one — the light theme's per-step overrides collapse into one property block. Phase 1 is guarded by a byte-identical-output requirement (I-3), verified across 13 cases. | **PASS** |
| **III. Consistent UX & Component Reuse** | The band is part of the existing track, styled from the existing ramp — no new component and no second colour scale (FR-005, NFR-002). The channel-triplet form is the one `.age-track`'s own background already uses. The stripe borrows the game's own reading of an age-up in progress rather than inventing a treatment. | **PASS** |
| **IV. Cost-Conscious Infrastructure** | Zero backend impact. No Firestore read or write, no Function, no Cloud Run, no schema change, no network. | **PASS** |
| **V. Secure Defaults** | No auth surface, no user data, no rules change, nothing persisted. Renders data the page already fetched and already shows in the tooltip. | **PASS** |

**No violations. Complexity Tracking section omitted as unnecessary.**

One note recorded rather than waived, against Principle I: the ramp becomes four CSS custom
properties where four literals stood. That is one layer of indirection added to something that
worked. It earns its place because FR-005 — *extend the ramp, do not introduce a second one* — is
otherwise only an assertion. With the properties there is one place each colour is written and the
band provably has no colour literal of its own.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/026-age-up-band/
├── spec.md                  # Feature spec (clarified 2026-08-06)
├── plan.md                  # This file
├── research.md              # Phase 0 — R-1…R-10
├── data-model.md            # Phase 1 — run shapes, invariants, admission rules
├── quickstart.md            # Phase 1 — the manual test script, gated per phase
├── contracts/
│   └── age-segments.md      # Phase 1 — getAgeSegments() interface contract
├── checklists/              # (empty)
└── tasks.md                 # Phase 2 output — /speckit-tasks, NOT created here
```

### Source Code (repository root)

```text
src/
├── components/builds/
│   └── AgeTimeline.vue          # MODIFIED — ramp → custom properties; striped band CSS
└── composables/builds/
    └── useAgeTimings.js         # MODIFIED — getAgeSegments() emits transition bands
```

**Structure Decision**: The established single-project SPA layout, unchanged. Nothing new is
created. The band logic goes in `getAgeSegments()` rather than a new helper because the band is a
*run of the track*, and the track's runs are what that function exists to produce — a separate
`getTransitionBands()` would hand `AgeTimeline` two lists to interleave, which is exactly the seam
FR-007 exists to prevent.

## Phase Sequencing

| Phase | Commit | Content | Gate |
|---|---|---|---|
| **0** | `refactor:` | Lift the four ramp colours into `--age-1…--age-4` on `.age-track`, per theme, as channel triplets. `.age-seg-N` reads the property. | **No visual change.** Pixel-identical on B1 in both themes. Composable diff empty. Quickstart 1–3 |
| **1** | `feat:` | `getAgeSegments()` admits and emits bands; the striped band CSS | US1, US3, US4 — SC-001, SC-004, SC-005, SC-006. Quickstart 4–24 |

Two commits, not three. The third — hatching for estimated bands — disappeared with US2.

Phase 0 must land before Phase 1, which builds the stripe from the properties; landing it after
would mean writing band literals that Phase 0 immediately deletes.

**Phase 1 is now shippable on its own**, which was not true of the original plan. The reason it was
not is the reason US2 existed: an undifferentiated band put a worked-out duration on screen as a
drawn width. That objection was answered by moving provenance off the track rather than by adding a
second treatment to it — see below.

## Design Change During Implementation *(2026-08-07)*

**US2 is withdrawn. Every band is striped.** Recorded here because it reverses a clarification the
spec had already settled, and because the original answer is the obvious one and will be suggested
again.

**What the spec said**: a band with both ends stated is solid; a band with either end derived is the
same band, hatched. Lightness says "transition", texture says "estimated".

**What was found**: FR-010 required the hatched band to match the solid one *exactly* in lightness,
which is unsatisfiable — any texture is a lightness modulation. Research
[R-9](./research.md#r-9--one-striped-treatment-for-every-band-superseded-during-implementation)
worked around it with a symmetric modulation, and that was implemented.

**Why it was withdrawn instead**:

1. **Stripes are the right treatment for every band**, not just uncertain ones — it is how an age-up
   in progress reads in the game. That leaves no spare channel for provenance without inventing one.
2. **Provenance is already on screen without hovering.** The crest prints `~` on its face
   ([AgeTimeline.vue:73-75](../../../src/components/builds/AgeTimeline.vue#L73-L75)), and its
   tooltip names click-up, arrival and duration each with `~`, plus a footnote naming the tier.

**Accepted cost**, recorded rather than waived: the `~` describes the *times*, not the width, so a
reader comparing two band widths is not told which is measured. It sits on the crest immediately
beside the band, so the answer is one glance away rather than hidden.

**Spec changes**: US2 marked withdrawn with its reasoning kept; FR-009 revised to require every band
be drawn identically; FR-010 removed; FR-011 revised to cover stripe legibility; FR-012 promoted to
load-bearing; SC-002, A-3 and one edge case revised. FR-001…FR-008 and FR-013…FR-020 are untouched.

**Net effect on the code**: a deletion. The run shape lost its `estimated` field, the template lost
its conditional modifier class, and the CSS lost a rule.

## Phase 0 Findings That Changed the Design

Full reasoning in [research.md](./research.md).

1. **The band is a cut, not an overlay** (R-1). The track is already a flex row over runs summing to
   100%, so FR-007 is satisfied by construction rather than by arithmetic. The obvious alternative —
   absolutely-positioned bands over unchanged segments — would leave the segments computed from age
   boundaries alone, so a band would *cover* an age instead of being cut out of it.
2. **The ramp index is positional, not the age number** (R-4). `age-seg-1` is Dark, and segment `n`
   is the *n*th age of the build's life. A band leading into `ages[i]` therefore takes key
   `age-band-${i + 2}` and inherits the right colour with no lookup and no way to drift.
3. **Zero-duration click-ups are real data** (R-5). `getAgeTimings` admits `clickUp.seconds <=
   arrival` — note `<=`. The naive `if (age.clickUp)` emits a zero-width flex child. The filter must
   live in `getAgeSegments`, not `getAgeTimings`, because FR-012 requires the tooltip to keep showing
   that click-up.
4. **`key` is also the CSS class** (R-3). Age runs therefore keep their key byte for byte, and
   NFR-003's byte-identical requirement is guaranteed by the diff rather than verified after it.
5. **One spec edge case cannot happen** (R-6). A band requires a resolved arrival, and `scaleSeconds`
   always reaches the last arrival — so a transition cannot run past the end of the scale.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| The stripe is illegible at the width of a short age-up, defeating FR-011 | **Medium** | 4px period at 45° — three stripes on a 6px band. Quickstart 17 is the specific check. If it fails, the fallback is a coarser angle (90°, vertical), not a wider period |
| Two touching bands merge on a fast double age-up | Low | Different ramp steps means a hue change, which survives the alpha (R-10). Quickstart 8 is the overturn check; the fix is a hairline on band-follows-band only, never on every band |
| A band is drawn where the click-up is nonsense, misrepresenting the build | Low | Three admission rules, all refusals rather than repairs (data-model §4). Nothing is clamped or inferred |
| Float rounding leaves a sub-pixel seam or a 100.0001% overflow | Low | `.age-track` already has `overflow: hidden`; flex shrinks proportionally. **Verified**: widths sum to 100 across 13 cases |
| A striped track reads as texture rather than as a timeline | **Medium** | Now applies to *every* build with age-ups, not just sparsely stamped ones — this risk grew when US2 was withdrawn. Quickstart 18 |

The two risks that were most likely to cost unplanned time — matching mean lightness between a
hatched and a solid band, and the `color-mix` fallback — **no longer exist**. Both were consequences
of having two band treatments and one colour function; there is now one of each.

## Constitution Re-check (post-design)

Re-evaluated after Phase 1 artifacts. **Still PASS on all five.**

The design added no dependency, no component, no composable, no backend surface and nothing
persistent. Since the pre-check, two things moved *toward* the principles: the ramp refactor turned
out to be a net simplification of the light theme's overrides rather than an addition (Principle II),
and the band's colour was found to need no lookup at all (Principle I, R-4).

The contract's non-goals section is the guard worth keeping: `getAgeSegments` reports geometry and
provenance, and explicitly refuses to repair data or to decide what a band *means*. That refusal is
what keeps spec A-1 — absence is information, not a gap to fill — enforceable in code rather than
merely intended.
