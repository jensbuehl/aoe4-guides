# Phase 0 — Research: Step Time Resolution

**Feature**: `022-step-time-resolution` | **Date**: 2026-08-05 | **Spec**: [spec.md](spec.md)

Nine findings. Two of them (**R-1**, **R-2**) invalidate statements in the spec and are corrected in
[plan.md](plan.md#spec-corrections--applied-2026-08-05). The rest fix the shape of the work.

---

## R-1 — The stored field shadows the fix **on list cards only**. A backfill is worth doing, not blocking.

> **CORRECTED 2026-08-05, during implementation.** The original finding claimed the fixes were
> invisible on *every* surface until a backfill ran. That was wrong, and the error was not checking
> which components actually call the memoized composable.
>
> [AgeTimeline.vue:182](../../../src/components/builds/AgeTimeline.vue#L182) calls
> **`getAgeTimings(props.steps)` directly**, deriving fresh on every render, and
> [FocusMode.vue:346](../../../src/components/builds/FocusMode.vue#L346) calls `getTimings()` the same
> way. Neither touches the stored field. The economy plot is fed by `AgeTimeline`, so it is fresh too.
>
> The stored field has exactly **one** consumer:
> [BuildListCard.vue:277](../../../src/components/builds/BuildListCard.vue#L277). So the backfill
> affects the **age chips on list cards and home lanes** and nothing else. The details view, Focus
> mode and the plot are correct the moment the code ships.
>
> The backfill is therefore **desirable but not blocking**: without it, a list card can advertise an
> age time that the detail page it links to contradicts. Worth fixing; not worth gating a release on.
> What follows is the original reasoning, still valid for that one surface.

**Decision**: Re-run `scripts/backfill-age-timings.mjs` so list-card and home-lane chips agree with
the detail page. Not a release gate.

**Rationale**: [useAgeTimings.js:332](../../../src/composables/builds/useAgeTimings.js#L332) prefers
the stored field over deriving:

```js
return fromStoredAgeTimings(value.ageTimings) ?? getAgeTimings(value.steps);
```

Every build saved since `020` carries `ageTimings: { feudal: { t, e }, … }` computed by the **current,
defective** resolver. `t` is the second, `e` the estimated flag. The detail page, the list card and
the home lanes all read that stored value; `getAgeTimings` is only the fallback for builds that
predate the field.

So a build whose Castle time is wrong today because of D2 keeps showing the wrong number after this
feature ships. The resolver would be correct and invisible.

The instrument already exists. [scripts/backfill-age-timings.mjs](../../../scripts/backfill-age-timings.mjs)
was written for `020`, runs through the Admin SDK, defaults to a dry run, batches at 500, and prints
the target project before touching anything. It needs no changes — it calls `getAgeTimings` +
`toStoredAgeTimings`, which is exactly the path this feature rewrites underneath it.

**Cost** (Principle IV): ~4k documents, one write each, one time. Firestore's free tier allows 20k
writes/day, so the backfill is roughly a fifth of one day's free allowance. `updateHomeSnapshot` runs
hourly and copies `ageTimings` straight through
([updateHomeSnapshot.js:31](../../../functions/builds/updateHomeSnapshot.js#L31)), so the home lanes
correct themselves within an hour at no extra write cost. No second backfill.

**Alternatives considered**:

- *Drop the stored field, always derive.* Rejected on Principle IV — the home lanes read a
  pre-generated summary with no `steps` at all, which is the entire reason the field exists.
- *Let the field self-heal as authors re-save.* Rejected: most of 4k builds will never be edited
  again, so "eventually" means "never" for the long tail.
- *Bump a version marker and re-derive lazily on read.* Rejected on Principle I and IV — it adds a
  migration concept and turns a one-time 4k-write job into a per-page-load derivation.

**Spec impact**: **NFR-002 is wrong** where it says "no backfill". Corrected in the plan.

---

## R-2 — `derived` has five consumers, not two. Keep the boolean; add provenance beside it.

**Decision**: `getAgeTimings()` keeps returning `derived: boolean` **and** gains
`provenance: "stated" | "interpolated" | "extrapolated"`. `derived` stays true for both derived
tiers. No existing consumer changes.

**Rationale**: The spec's FR-016 says provenance replaces "today's `derived` boolean", and SC-006
lists three components. Both are wrong — `derived` is read in **five** places across three components:

| File | Lines | What it drives |
|---|---|---|
| `AgeTimeline.vue` | 37, 40, 45, 52, 53 | `~` prefix ×3, the footnote, the de-emphasis class |
| `AgeChips.vue` | 14, 18 | chip `variant="outlined"` and the `~` prefix |
| `BuildListCard.vue` | 209, 213 | `.blc-agerow--derived` and the tooltip |

`AgeChips` and `BuildListCard` are the **home lanes and list cards** — high-traffic surfaces the spec
never mentions. Replacing the boolean means touching them for no user-visible gain: they draw a
two-tier fact/estimate distinction and FR-019 explicitly keeps `~` meaning one thing across both
derived tiers, so their rendering is already correct.

Additive is also what `fromStoredAgeTimings` wants. It reconstitutes from `{ t, e }` where `e` is one
bit, so a stored-field read can honestly produce `derived` but not the finer tier (see R-3).

**Alternatives considered**:

- *Replace `derived` with `provenance` everywhere.* Rejected: five call sites, three files, zero
  user-visible change, and it widens the diff on two surfaces this feature has no business touching.
- *Derive `derived` in each template from `provenance !== "stated"`.* Same diff, more repetition.

**Spec impact**: **FR-016 and SC-006 are wrong.** Corrected in the plan.

---

## R-3 — The stored field cannot carry the third tier without a schema change, and should not try.

**Decision**: `{ t, e }` stays exactly as it is. `fromStoredAgeTimings` returns
`provenance: e ? "interpolated" : "stated"`.

**Rationale**: `e` is one bit and the field is on 4k documents. Widening it to a tri-state costs a
schema change, a second backfill of the home snapshot's copy, and a compatibility branch for old
documents — to distinguish two estimate tiers on a card whose entire treatment of them is identical
(R-2).

**Consequence accepted, and it is real**: a build read from the stored field reports an extrapolated
age as `interpolated`. The `~` is right either way, so the chip and the list card are unaffected; the
only casualty is the **detail page footnote** (FR-020), which would say "estimated from villager
count" where "projected past the last stated time" is more accurate.

This is bounded by an accident of the data: an age boundary is a step the author almost always
stamps, and extrapolation only reaches steps *after* the last anchor. A build with an extrapolated
*age* is one that stopped stamping before reaching that age — uncommon, and exactly the build where
the coarser label errs toward humility rather than overclaiming.

**Alternatives considered**:

- *Widen `e` to `p: 0|1|2`.* Rejected on Principle I + IV for the reasons above. Revisit only if the
  footnote's accuracy is ever shown to matter.
- *Have the detail page ignore the stored field and always derive.* Rejected — it would undo R-1's
  reason for the field to exist and add a derivation to every detail-page load.

---

## R-4 — Only `startTime` crosses the `getTimings()` boundary.

**Decision**: The strict wrapper returns `[{ startTime }]` per entry, or `null`. The four other
fields on today's timing objects (`villagers`, `villagerOffsetNextStep`,
`villagerOffsetNextValidStep`, `type`) are internal scaffolding and are deleted with the old
algorithm.

**Rationale**: Verified every call site. All three read `startTime` and nothing else:

- [FocusMode.vue:351](../../../src/components/builds/FocusMode.vue#L351) — `stepsTimings.value[index].startTime`
- [useAgeTimings.js:201](../../../src/composables/builds/useAgeTimings.js#L201) — `timings?.[index]?.startTime`
- [useEcoSeries.js:50](../../../src/composables/builds/useEcoSeries.js#L50) — `timings?.[index]?.startTime`

The offsets exist only to feed the old proportional formula. Keeping them would preserve a shape
nobody reads and quietly invite a sixth consumer.

---

## R-5 — Focus mode needs two changes, not one, and the second is the awkward one.

**Decision**: `FocusMode.vue` reads provenance from the resolver directly rather than inferring it,
and applies the `~` at the point it writes `step.time`.

**Rationale**: Today Focus mode **mutates the step objects** it cloned, writing a formatted string
back onto `step.time` for every step when autoplay is supported
([FocusMode.vue:350-352](../../../src/components/builds/FocusMode.vue#L350-L352)):

```js
steps.value.forEach((step, index) => {
  step.time = getFormattedTime(toDateFromSeconds(stepsTimings.value[index].startTime));
});
```

That is where FR-015a's `~` has to be applied, and it is also where D1's `"alid"` is produced — the
same line. Two consequences:

1. The marker cannot be a template concern, because the value has already been flattened into a
   string by the time the template sees it. It goes on at write time.
2. The write is **unconditional over all steps**, including ones whose author stated a time. Those
   must not gain a `~`, so the loop needs the per-step provenance, which the wrapper's
   `[{ startTime }]` alone does not carry.

Resolution: `FocusMode` calls `resolveStepTimes()` for the provenance and keeps `getTimings()` for
the gate. Two calls over the same steps, ~30 entries, both memo-free and trivially cheap — cleaner
than widening the strict wrapper's return shape for one consumer (R-4).

**Alternatives considered**:

- *Widen the wrapper to `[{ startTime, provenance }]`.* Rejected — it makes the strict contract carry
  a field only one of three callers wants, and blurs the "strict" boundary R-4 just sharpened.
- *Stop mutating `step.time` and render the marker in the template.* The right long-term fix, and out
  of scope: the mutation feeds `setElapsedTimeToCurrentStepStartTime` and the progress maths. Noted
  as a TODO per Principle II.

---

## R-6 — The dashed tail costs one polyline per resource, and needs a split point the series must supply.

> **SUPERSEDED during implementation.** This finding assumed the dash marks *the extrapolated tail*,
> so one split position would do. Shown a real chart, the rule changed: **a segment is solid only
> when both its endpoints are moments the author recorded** (FR-022), because roughly half of all
> builds are stamped sparsely and a position-based split drew long derived stretches as confident
> solid line.
>
> `lastAnchorSeconds` is therefore gone, replaced by a per-point `stated` flag; `EcoLines` merges
> consecutive like segments into runs that share their boundary points. The reasoning below about
> sharing the boundary point and reusing `.eco-guide`'s dash vocabulary still holds — only the rule
> deciding *which* segments dash has changed. The dash pattern was also loosened to `7 4`, since
> heavy dashing is now the common case rather than the exception.

**Original decision**: `useEcoSeries` adds `lastAnchorSeconds` to its return. `EcoLines` draws up to
two polylines per resource — solid up to and including that second, dashed from it onward — for ten
elements worst case, five when a build has no extrapolated tail.

**Rationale**: Today it is one `<polyline>` per resource with a single flattened points string
([EcoLines.vue:42-48](../../../src/components/builds/EcoLines.vue#L42-L48)). SVG has no way to dash
part of a path without splitting it, so the split is unavoidable. The segments must **share** the
boundary point or the line visibly breaks.

`lastAnchorSeconds` rather than a per-point flag: the split is one x-position for all five lines, and
a scalar keeps `EcoLines` a pure renderer — it already takes everything it draws as props, which is
what keeps it on the same x-scale as the track by construction.

The dash pattern reuses `.eco-guide`'s existing dashed vocabulary rather than introducing a second
one. Colours, widths, end caps and the legend are untouched (FR-023).

**Alternatives considered**:

- *Per-point `provenance` on each series point.* Rejected as more data for the same one split.
- *Fade the tail's opacity instead of dashing.* Rejected — `021` deliberately removed a faded tail
  when carry-forward went away, and five half-opacity lines crossing each other read as a rendering
  bug.

---

## R-7 — The backfill's dry run is the offline validation instrument A-9 asked for.

**Decision**: Horizon constants (FR-009) are tuned by running the backfill in dry-run mode against
production credentials and reading its output. No new tooling.

**Rationale**: A-9 says the constants are "validated offline against a real-build sample" because the
site has no analytics. The backfill script already does exactly that and writes nothing by default:
it walks all ~4k builds, prints the first 20 derived timings, and reports how many builds yield no
derivable timings at all. Instrumenting the resolver to also count provenance per build turns it into
a distribution report for the cost of a counter.

That distribution — *how many builds gain age timings, how many gain them only through extrapolation,
how many run past a given horizon* — is the evidence for both consequences A-11 names, and it is
recorded in [quickstart.md](quickstart.md).

**Alternatives considered**: exporting a sample to a local fixture file. Rejected — same numbers, an
extra artefact to keep in sync, and the script already handles paging and credentials safely.

---

## R-8 — The 0:00 bound must not manufacture an anchor.

**Decision**: `0:00` is a **lower clamp** and an interpolation left-endpoint. It never becomes an
anchor, never sets a villager count, and never causes a step to report a `stated` time.

**Rationale**: An anchor needs a time *and* a villager count. The count at 0:00 is the civ's starting
population — which differs across the roster and is precisely the modelling SC-008 forbids. Treating
0:00 as a real anchor would smuggle a civ-dependent constant into the one design that promised not to
have one.

As a bound it needs no count at all: it stops derived times going negative (US1.6) and gives a build
whose first step is unstamped a left endpoint to interpolate from (US2.4). Both are pure geometry.

**Consequence accepted**: a span from 0:00 to the first real anchor has no villager delta to
distribute by, so it falls to even spacing (FR-007). For the usual opening — a handful of steps in
the first ninety seconds — the error is small and always bounded by a measured right endpoint.

---

## R-9 — SC-005 needs a golden file, because "unchanged to the second" is not eyeballable.

**Decision**: Before any behaviour change lands, dump `getTimings()` output for the fixture set on
`main` to a JSON file in the scratchpad. After the rewrite, dump again and diff.

**Rationale**: SC-005 is the feature's main regression guard and the constitution requires no formal
suite, so it has to be checkable by hand — but "every build that autoplays today announces every step
at the same second" is not something anyone can verify by looking at a screen. A two-file diff makes
it a single command, and it is the only way to distinguish *fixing* a wrong time (intended, D1–D4)
from *changing* a right one (a regression).

The probe harness from the spec's Evidence phase
(`scratchpad/probe.mjs`) already reproduces the helper standalone and is the base for it.

**Consequence accepted**: the golden file covers the nine synthetic fixtures, not 4k real builds. The
backfill dry run (R-7) is the wider net — its per-age output can be diffed the same way, which turns
SC-005 from a sample check into a population check for one extra dry run.
