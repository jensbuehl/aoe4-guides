# Feature Specification: Step Time Resolution — Correctness, Provenance and Reach

**Feature Branch**: `022-step-time-resolution`

**Created**: 2026-08-05

**Status**: Clarified — ready for `/speckit-plan`

**Input**: "Give me a recommendation on how to improve timing interpolation. Maybe based on TC build
times also interpolate outside of given boundaries? How to incorporate civ specifics? Build or
technology specifics? Or keep it simple with default vil build time for now?"

Resolved after probing the current interpolator with the four shapes it is suspected of mishandling
(see [Evidence](#evidence-the-four-confirmed-defects)): **keep it simple, but make "simple" mean
*empirical* rather than *nominal*** — fix what is provably broken, extend the reach of what is left
using the build's own observed rate, and model neither civs nor technologies.

## Scope & Non-Goals *(read first)*

**In scope:**

- `src/composables/builds/timingsHelper.js` — the file `021` deliberately left byte-identical is
  the subject of this feature. A new `resolveStepTimes()` becomes the single place a step gets a
  time; `getTimings()` becomes a thin, strict wrapper over it that preserves Focus mode's contract.
- `src/composables/builds/useAgeTimings.js` — consumes the resolver and drops its local leniency
  workaround (the `try`/`catch` around `getTimings` and the "bonus, not a precondition" comment).
- `src/composables/builds/useEcoSeries.js` — same: `resolveSeconds()` collapses into a read of the
  resolver's output.
- `src/components/builds/FocusMode.vue` — its autoplay gate **widens** to builds whose tail is
  extrapolated (Q1), which obliges it to start marking estimated times. It marks nothing today.
- `src/components/builds/AgeTimeline.vue` and `src/components/builds/EcoLines.vue` — the minimum
  needed to distinguish an extrapolated time from an interpolated one (Q2): footnote copy on the
  timeline, a dashed stroke past the last anchor in the plot. No layout, colour or geometry change.
- **Running `scripts/backfill-age-timings.mjs`** (the script's code is unchanged). Without it every
  existing build keeps reading its old, wrong time from the stored field — the fixes would be correct
  and invisible. NFR-002a, [research.md](research.md) R-1.

**Explicitly NOT in scope (leave exactly as-is):**

- **Civilization-specific production modelling.** No civ table, no per-civ villager rate, no read of
  the build's civ field. See [A-4](#assumptions) for why this is a decision rather than an omission.
- **Technology- and building-specific modelling.** No Wheelbarrow/Textiles/second-TC detection. See
  [A-5](#assumptions).
- `src/composables/builds/villagerAggregator.js` — read-only reuse, **including its known defects**,
  unchanged from `021`'s A-1. It reads only the first two `+` operands and counts a fishing boat as
  a villager. Fixing it moves every villager number on the site and is its own feature.
- Every visual, layout, colour and geometry decision in `AgeTimeline.vue` and `EcoLines.vue` beyond
  the two changes named above. This feature changes *which* numbers those components receive, and
  how confident a number looks — never where anything sits.
- The `~` marker itself. It already means "not stated by the author" and keeps meaning exactly that;
  this feature spreads it to a place that lacks it rather than inventing a second symbol (A-10).
- `src/components/builds/AgeChips.vue` and `src/components/builds/BuildListCard.vue` — the home lanes
  and list cards. They read `derived`, which FR-016 retains, so they need **no change at all** and
  SC-009 requires them to stay byte-identical.
- The `{ t, e }` shape of the stored `ageTimings` field. Not widened to carry the third tier: one bit
  on 4k documents plus a second copy in the home snapshot, to separate two tiers that render
  identically everywhere but one footnote (R-3).
- The build editor, the overlay export, Firestore rules, the build schema, the stored `ageTimings`
  field's shape.

> No new data is fetched, no new dependency is added, and no game-data table is introduced. Every
> number this feature derives comes from the build being read.

## Evidence: the four confirmed defects

Reproduced against the shipping helper before this spec was written, not inferred from reading it.
Each row is a shape that occurs in real builds.

| # | Shape | What happens today | Why it matters |
|---|---|---|---|
| **D1** | Two consecutive anchors with the **same** villager count (`10:00` 10 vils → `11:00` 10 vils) | The proportional divisor is `0`, so the in-between step resolves to `NaN`. The validity check tests `!== null`, which `NaN` passes — so the whole build is reported **valid**. | Not chart-only. Focus mode then renders that step's time as the literal string **`"alid"`** (`"Invalid Date"` sliced by the time formatter). This is shipping today. |
| **D2** | A cell-less step (an age-up click, a bare comment) **inside** an anchored span | The villager delta for that step is computed against a count of `0` instead of the running count, so it claims the full next count as its own gain. In the probe, a span running `2:00 → 4:00` placed a later step at **8:00** — four minutes past the span it lives in. | Silently reorders the economy plot and pushes age markers off the track. The overshoot is unbounded. |
| **D3** | A `gameplan` note as an inline entry (legacy flat builds) | Notes never receive a time, and the validity check does not exempt them, so `getTimings()` returns `null` for the entire build. | **Every legacy flat build containing a note has autoplay silently disabled** in Focus mode. |
| **D4** | Villager count **decreasing** between two anchors | The divisor goes negative and the interpolated time runs backwards relative to its neighbours. Nothing clamps it. | `EcoLines` hides this by sorting; the age timeline does not. |

The common root cause: the interpolator is a telescoping sum that lands correctly **only if** the
per-step villager deltas sum to the span's total delta. D2, D3 and D4 each break that identity, and
nothing detects the breakage or bounds the result.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A time is never nonsense (Priority: P1)

A player opens a build and every time they see is either right, honestly labelled as an estimate, or
absent. Never `"alid"`, never a step placed after the age-up that follows it, never a moment that
runs backwards.

**Why this priority**: This is a live correctness bug with a user-visible garbage string in it. If
only this ships, the feature was worth doing.

**Independent Test**: Run the four probe shapes in the Evidence table through the resolver. None
produces `NaN`, an overshoot past the next anchor, or a non-monotonic sequence.

**Acceptance Scenarios**:

1. **Given** a span whose two anchors state the **same** villager count, **When** the steps between
   them are resolved, **Then** every one receives a finite time inside the span, and no step
   anywhere in the build resolves to `NaN` or `Infinity`.
2. **Given** a cell-less step inside an anchored span, **When** the span is resolved, **Then** that
   step's villager count is read as the **last stated running count** (not zero), so it contributes
   a delta of zero rather than claiming the next step's full count.
3. **Given** any resolved build, **When** the derived times are read in step order, **Then** they are
   **monotonically non-decreasing**, and every interpolated time lies within `[left anchor, right
   anchor]` inclusive.
4. **Given** a span whose villager count **decreases**, **When** it is resolved, **Then** the span is
   treated as having no usable villager signal and falls back to even spacing — not to a negative
   slope.
5. **Given** a build with a `gameplan` note among its steps, **When** the build is resolved, **Then**
   the note is not required to have a time, is never used as an anchor, and does not by itself make
   the build unresolvable.
6. **Given** any build, **When** it is resolved, **Then** no resolved time is negative.

---

### User Story 2 - The chart reaches past where the author stopped stamping (Priority: P1)

A player opens a build whose author stamped the opening carefully and then stopped. Today the lines
and markers stop dead at the last timestamp. They should continue — visibly as an estimate — for as
long as the estimate is worth anything, and then stop.

**Why this priority**: This is the capability the feature was asked for. It is the difference between
a chart that describes the build and one that describes the author's stamina.

**Independent Test**: Take a build stamped through Feudal and blank thereafter. The timeline and plot
extend past the last stamp, every extended point is marked as an estimate, and the extension stops at
the horizon rather than running to the end of a long build.

**Acceptance Scenarios**:

1. **Given** a build with at least one usable anchor span, **When** steps after the last anchor are
   resolved, **Then** they are placed using the **seconds-per-villager rate observed in that build's
   own last usable span**, and each is marked as extrapolated.
2. **Given** a build with **no** usable anchor span (a single stamped step, or none with villagers),
   **When** its later steps are resolved, **Then** a nominal fallback rate is used and the results
   are still marked as extrapolated.
3. **Given** a build whose steps continue far past its last anchor, **When** they are resolved,
   **Then** extrapolation stops at the horizon (FR-009) and every step beyond it resolves to *no
   time* rather than to a guess — a line that ends is honest, a line that runs on for eight minutes
   of invention is not.
4. **Given** a build whose **first** step states no time, **When** the build is resolved, **Then**
   an implicit `0:00` bound is used so that no step resolves before the start of the game, and steps
   before the first real anchor are interpolated rather than left unplaced.
5. **Given** a build where extrapolation applies, **When** the age timeline and the economy plot both
   render, **Then** they place the same step at the same second — they read one resolver, so they
   cannot disagree.

---

### User Story 3 - An estimate never passes for a fact (Priority: P1)

A player can tell, without reading the source, which times a build's author actually wrote down and
which the site worked out — and how confidently.

**Why this priority**: The site already promises this (`"about 3:40, estimated"`). Extrapolation is a
materially weaker claim than interpolation, and folding both into one `derived` boolean would quietly
degrade a promise the UI already makes.

**Independent Test**: Resolve a mixed build. Every step carries one of four provenance values, and
the counts match the build by inspection.

**Acceptance Scenarios**:

1. **Given** any resolved step, **When** its provenance is read, **Then** it is exactly one of
   **stated**, **interpolated**, **extrapolated**, or **unresolved**.
2. **Given** a step whose author wrote a timestamp, **When** it is resolved, **Then** its provenance
   is **stated** and its value is that timestamp — a stated time is never overridden, recomputed or
   smoothed, even when it conflicts with its neighbours.
3. **Given** an age reached at a **stated** time, **When** the timeline renders, **Then** it reads as
   fact, exactly as today — no marker, full emphasis.
4. **Given** an age reached at an **interpolated** time, **When** the timeline renders, **Then** it
   carries the `~` marker and the footnote reads **"~ estimated from villager count"** — exactly as
   today.
5. **Given** an age reached at an **extrapolated** time, **When** the timeline renders, **Then** it
   carries the same `~` marker but the footnote reads **"~ projected past the last stated time"** —
   the tier is conveyed by the explanation, not by a second symbol.
6. **Given** a build whose ages span both derived tiers, **When** the timeline renders, **Then** the
   footnote names the **weaker** of the two, so it never overstates the build's evidence.
7. **Given** the economy plot on a build with an extrapolated tail, **When** it renders, **Then** the
   segments past the last anchor are **dashed** and the segments before it are solid.

---

### User Story 4 - Focus mode plays more builds, and admits which times it invented (Priority: P2)

A player opens Focus mode on a build stamped through Feudal and blank after. Autoplay is offered —
where today it is refused — and the steps past the last stamp show a visibly estimated time rather
than passing themselves off as the author's own.

**Why this priority**: Two things at once. Widening the gate is the reward for a trustworthy
resolver; marking the times is the obligation that comes with it. Focus mode marks nothing today,
which was safe only because it ran exclusively on fully-stated builds. Shipping the widening without
the marking would be a regression in honesty even as it is an improvement in reach.

**Independent Test**: A build that plays automatically today still does, at the same times, with the
same unmarked display. A stamped-then-blank build now also plays, with `~` on every step past the
last stamp.

**Acceptance Scenarios**:

1. **Given** a build that supports autoplay today, **When** Focus mode opens it, **Then** autoplay is
   still offered and every step's announced time is unchanged **to the second**. Its interpolated
   steps do newly show `~` (scenario 6) — a presentation change, deliberate, and the only thing
   about today's autoplay builds that this feature is permitted to alter.
2. **Given** any build offered autoplay, **When** its step times are rendered, **Then** none of them
   is `"alid"` or any other artefact of an unrepresentable time.
3. **Given** a legacy flat build containing a note, **When** Focus mode opens it, **Then** autoplay is
   offered if every actual **step** resolves — the note's lack of a time no longer disqualifies the
   build (D3).
4. **Given** a build stamped partway and blank after, **When** Focus mode opens it, **Then** autoplay
   **is** offered, and every step resolved by extrapolation displays its time prefixed with `~`.
5. **Given** a build whose steps run past the extrapolation horizon, **When** Focus mode opens it,
   **Then** autoplay is **not** offered — the horizon is where a build stops being playable, not a
   point past which playback improvises.
6. **Given** an interpolated step in an autoplaying build, **When** its time is displayed, **Then** it
   too carries `~`. The marker means "not stated by the author", and Focus mode applying it only to
   the extrapolated tail would imply the interpolated middle was stated.

---

### Edge Cases

- A build where **no** step states a time: no anchors, so nothing is interpolated. The implicit
  `0:00` bound alone is not enough to extrapolate from — a build with one bound and no measured rate
  would be estimated end to end, which is invention. Such a build resolves to *unresolved*
  throughout, exactly as today.
- Duplicate timestamps on consecutive steps: both are stated, both are kept as stated, and the
  monotonic rule is satisfied by equality.
- Timestamps typed **out of order** (`4:00` then `2:00`): stated times are never rewritten (US3
  scenario 2), so the sequence genuinely is non-monotonic. The monotonic guarantee in US1 scenario 3
  binds only *derived* values — they may not make an out-of-order build any worse.
- A single step in the whole build: no span, no rate, nothing to extrapolate from.
- The last anchor is the last step: nothing to extrapolate; the horizon is never engaged.
- Legacy flat builds: fully supported by the resolver, which reads a flat step list. Age timings
  remain unavailable for them for the unrelated reason that they carry no age sections.
- Skeleton/loading builds must derive nothing.

## Requirements *(mandatory)*

### Functional Requirements

**The resolver**

- **FR-001**: A new `resolveStepTimes(steps)` MUST accept a flat, ordered step list and return one
  entry per input step, in the same order, each carrying a time in seconds (or none) and a
  **provenance** of `stated`, `interpolated`, `extrapolated`, or `unresolved`.
- **FR-002**: It MUST be the **only** place in the codebase where a step is assigned a time. Every
  consumer reads its output; none re-derives, and none keeps a private fallback.
- **FR-003**: A step's own stated timestamp MUST always win, and MUST be returned unmodified.
- **FR-004**: An **anchor** is a step whose own timestamp parses. Interpolation happens between
  consecutive anchors; extrapolation happens after the last one. The step's villager count is *not*
  required to make it an anchor — it decides only whether the span the anchor opens can be divided
  proportionally (FR-006) or falls back to even spacing (FR-007).

  *(An earlier draft required both a timestamp and a villager count, matching the old algorithm.
  Implementation showed that costs the common "stamped only at the age-ups" build every one of its
  times, because such a build has no villager trail — the exact shape the spec elsewhere calls out as
  common. A stamped step is a measured moment whether or not its author also filled in the resource
  cells. Widening this made the `age-ups-only` fixture resolve fully and gain autoplay.)*
- **FR-005**: The villager count in force at a step MUST be the **running** count — the last count
  actually stated at or before it. A step that states no cells inherits, and therefore contributes a
  delta of zero. (Fixes D2. This is the rule `useAgeTimings.villagersAt()` already applies for the
  `N vils` markers, so adopting it also removes an existing disagreement between the two.)
- **FR-006**: Between two anchors, the measured span MUST be distributed in proportion to running
  villager deltas, and the result MUST be clamped to the span and forced non-decreasing. No output
  may be `NaN`, `Infinity`, or negative. (Fixes D1, D4.)
- **FR-007**: When a span's villager signal is unusable — zero total delta, negative total delta, or
  no stated counts at all — the span MUST fall back to **even spacing by step position**. This is
  still `interpolated`: the span's endpoints are measured, only its interior shape is assumed.
- **FR-007a**: When a span's villagers are present but imply a rate slower than **30 seconds per
  villager**, the interior MUST be placed at the **nominal rate from the left anchor** instead of
  being spread proportionally across the span.

  Spreading proportionally assumes villagers were produced steadily across the whole span. A span
  implying, say, 240 s per villager is not a build producing glacially — it is an author skipping
  ahead in their account. Villagers are made at roughly one per 20 s, so placing them at that pace
  from the measured left edge and letting the unexplained time sit before the next thing the author
  wrote down describes the game better than smearing three villagers over twelve minutes.

  *(Found from a real screenshot: a span stamped `1:00` → `13:00` gaining 3 villagers was placing
  steps at `~5:00` and `~9:00`. They now read `~1:20` and `~1:40`. FR-008a's threshold was already in
  place for extrapolation; this extends the same judgement to interpolation, which is where a reader
  actually meets it.)*
- **FR-008**: After the last anchor, steps MUST be placed using a **seconds-per-villager rate derived
  from the build's own last usable anchor span**. Only when the build offers no usable span at all
  may a nominal rate be used. Results are `extrapolated`.
- **FR-008a**: Extrapolation MUST choose its advance by what the step actually says, in this order:

  | The step… | Advance by |
  |---|---|
  | adds villagers, and the measured rate is **≤ 30 s/villager** | `gained × measured rate` |
  | adds villagers, and the measured rate is **> 30 s/villager** | `gained × nominal (20 s)` |
  | adds **nobody** | the span's step cadence |

  A single town centre at full uptime produces a villager every ~20 s, so a much slower measured rate
  means either that the author left resource cells blank across the span, or that villager production
  has stopped as it does late in a game.

  The distinction is by **signal, not preference**. A step that adds villagers took as long as those
  villagers took to make, so charging it a five-minute step cadence is the same implausibility this
  rule exists to reject. Only a step that adds nobody has no villager signal at all — production
  stopped, or recording did — and there the build's own rhythm is all that is left.

  Faster-than-nominal rates are **not** capped: multiple town centres legitimately produce well under
  20 s per villager, and clamping that would misread a real boom.

  *(An earlier draft sent every implausible case to step cadence. That was wrong for the
  adds-villagers case and was caught on a real build, where a final step gaining one villager was
  projected five minutes out instead of twenty seconds.)*
- **FR-009**: Extrapolation MUST stop at a horizon past the last anchor, beyond which steps resolve
  to `unresolved` rather than to a guess. The horizon is **8 steps**, or a duration equal to
  **25% of the build's own measured span** (first anchor to last), floored at **120 seconds** —
  whichever binds first.

  The duration bound is **relative, not absolute**, because a step is not a unit of time in this
  game: Dark Age steps land ~20 s apart, while a single Imperial step can be four minutes. A flat
  cap is therefore calibrated for the opening and mis-calibrated for the end.
- **FR-009a**: The **first** step past the last anchor MUST always be placed, regardless of the
  duration bound. It is the least speculative projection available — one step of rate error — and
  refusing it costs the build its entire autoplay, because one `unresolved` step fails the gate
  (FR-014). Only from the second step out does the horizon begin deciding.

  *(FR-009 and FR-009a were both rewritten from live evidence during implementation: a real 10-step
  build stamped to 18:00 was refused autoplay because its single trailing step exceeded a flat 120 s
  cap on its own. See [quickstart.md](quickstart.md)'s recorded results.)*
- **FR-010**: **The first step of a build is always `0:00`, and this rule outranks every other rule
  here — including the author's own timestamp.** A build order describes a game from its opening, so
  the first step is the one moment that needs no measuring and admits no estimate. It is applied
  before anchors are found, so every build gains a real left endpoint and its opening steps
  interpolate against something instead of dangling.

  It is recorded as **stated**, not derived: the start of a game is a fact. The first step therefore
  never carries the `~`.
- **FR-010a**: A build whose *only* anchor is the forced `0:00` MUST NOT be extrapolated. It has
  measured nothing, and projecting an entire build from a nominal rate off one synthetic point is
  invention rather than estimation. Extrapolation requires the author to have stamped at least one
  time of their own.

  *(FR-010 replaces an earlier draft in which `0:00` was a lower bound only, explicitly "never
  reported as a stated time". Changed on instruction during implementation. FR-010a is the guard that
  keeps the stronger rule from making entirely-unstamped builds fully playable on invented times.)*
- **FR-011**: A `gameplan` note MUST NOT be usable as an anchor, MUST NOT be required to carry a
  time, and MUST NOT prevent the steps around it from resolving. (Fixes D3.)
- **FR-012**: The resolver MUST NOT throw on any malformed step shape, and MUST NOT read the build's
  civilization, landmarks, technologies, or any field other than the step's own time and resource
  cells.

**The strict wrapper**

- **FR-013**: `getTimings()` MUST become a thin wrapper over the resolver, returning the same shape
  it returns today or `null`, so that no caller outside this feature needs changing to keep working.
- **FR-014**: `getTimings()` MUST return `null` unless every actual **step** resolved as `stated`,
  `interpolated`, **or `extrapolated`**. Notes are exempt (FR-011). A single `unresolved` step —
  which, under FR-009, means the build runs past its horizon — still fails the whole build, because
  playback genuinely cannot continue past a step it has no time for.
- **FR-015**: Focus mode's autoplay gate MUST continue to read a single boolean from that call. Every
  build that autoplays today MUST still autoplay, announcing every step at the same second.
- **FR-015a**: Because FR-014 admits estimated times into playback, Focus mode MUST mark any moment
  it did not read from the author — both `interpolated` and `extrapolated` — with the `~` prefix and
  a muted weight. It marks nothing today, which was only safe while the gate admitted fully-stated
  builds alone.

  The marking belongs on the **displayed clock** (`totalElapsedTimeFormattedString`, rendered in both
  the phone row and the desktop table), **not** on `step.time`. `step.time` is never rendered — it is
  only re-parsed for the elapsed-time and progress maths — so writing a marker into it would decorate
  a value nobody sees while polluting one that gets parsed.

  Focus mode therefore reads **two** functions: `getTimings()` for the binary gate and
  `resolveStepTimes()` for the per-step provenance. The strict wrapper MUST NOT be widened to carry
  provenance for this one caller — that would make "strict" mean less. See R-4 and R-5.

  *(An earlier draft put the marker into `step.time`. It rendered nowhere, which is how the omission
  was caught — by looking at the running app rather than at the diff.)*

**Consumers**

- **FR-016**: `useAgeTimings.js` MUST take each boundary's time from the resolver rather than
  combining a stated read with a `try`/`catch`ed `getTimings()` call, and MUST expose the boundary's
  provenance **alongside** today's `derived` boolean, which is **retained**.

  `derived` is read in five places across three components — including `AgeChips.vue` and
  `BuildListCard.vue`, which render the home lanes and list cards. Those two surfaces draw a
  two-tier fact/estimate distinction that FR-019 keeps correct, so replacing the boolean would mean
  touching high-traffic components for no user-visible gain. See [research.md](research.md) R-2.
  *(This requirement replaces an earlier draft in which provenance replaced the boolean.)*
- **FR-017**: `useEcoSeries.js` MUST take each point's time from the resolver, and MUST continue to
  omit points that resolve to no time. Its coverage gate (`≥50%` of steps, `≥4` plotted points) is
  unchanged in both halves.
- **FR-018**: The stored `ageTimings` field MUST remain readable and writable in its current shape.
  Whether it records the finer provenance or keeps collapsing to the existing estimated flag is an
  implementation decision, provided old documents keep rendering correctly with no backfill.

**Presentation of the three tiers**

- **FR-019**: The `~` prefix MUST keep its single existing meaning — *this time was not stated by the
  author* — and MUST be applied to both derived tiers everywhere a time is shown. No second symbol is
  introduced: `~` and `≈` are indistinguishable at chip size, and the reader's decision is identical
  in both tiers ("do not quote this as fact").
- **FR-020**: The two derived tiers MUST instead be distinguished by the timeline's existing
  footnote, which already exists to explain the marker:
  - `interpolated` → **"~ estimated from villager count"** (today's copy, unchanged)
  - `extrapolated` → **"~ projected past the last stated time"**
- **FR-021**: When a build's shown ages span both derived tiers, the footnote MUST name the
  **weaker** one, so the note never claims more evidence than the build has.
- **FR-022**: In the economy plot, a line segment MUST be drawn **solid only when both of its
  endpoints are moments the author recorded**. Every other segment is dashed — whether its
  uncertainty comes from a gap between two stamps or from running past the last one.

  One rule, no exceptions, and deliberately not "dashed after the last anchor". Roughly **half of all
  builds are stamped sparsely**, and a position-based rule drew those as a single confident solid
  line built from two measurements. The line now shows how much of itself the author actually
  established.

  Consecutive segments of the same kind merge into one polyline, and adjacent runs **share** their
  boundary point rather than abutting it, or the line would break exactly where it most needs to read
  as continuous. A fully-stamped build draws five polylines, as before.

  **Consequence accepted**: a build stamped every *other* step draws entirely dashed, because every
  segment then has one derived end. That is the rule working, not a bug — but it is more aggressive
  than "mostly stamped looks mostly solid", and it is the reason the dash pattern is long and
  open-spaced rather than tight.

  *(Rewritten after implementation. The original position-based rule was correct about the tail and
  silent about the middle, which is where most of the uncertainty in this corpus actually lives.)*
- **FR-023**: No change to marker placement, chip geometry, colour, or the `.age-time--derived`
  de-emphasis. An extrapolated time is de-emphasised exactly as an interpolated one is.
- **FR-024**: The build order table MUST show the resolved time for a step whose author left the time
  cell empty — same column, muted, prefixed `~`. Same column rather than a new one because the table
  is already dense and a second time column would cost horizontal space to say one thing; muted plus
  `~` because that marker already means "not stated by the author" everywhere else on the site.

  This is where the resolver becomes visible at all. Without it the work surfaces only as three age
  crests and a plot, and a reader scanning thirty rows still sees blanks where the site knows the
  answer. Applies at every breakpoint.
- **FR-024a**: Estimates MUST NOT appear in the **editor**. The time cell there is an input bound to
  the step's own value, so offering an author a time they did not write invites them to save it —
  poisoning the anchor set every future read of that build depends on. Read-only rendering only, and
  never persisted.

### Non-Functional / Constitution

- **NFR-001**: No new dependency and no new game-data table (I). The one permitted constant is the
  nominal fallback rate in FR-008.
- **NFR-002**: No new Firestore read, no new index, no schema change, no new collection (IV).
- **NFR-002a**: A one-time backfill of ~4k build documents **SHOULD** be run, but does **not** gate
  the release. It affects **only the age chips on list cards and home lanes** — the single surface
  that reads the stored `ageTimings` field
  ([BuildListCard.vue:277](../../../src/components/builds/BuildListCard.vue#L277)). The details view,
  Focus mode and the economy plot all derive fresh and are correct as soon as the code ships.

  Without it, a list card can advertise an age time the detail page it links to contradicts — worth
  fixing, not worth blocking on. Cost: ~4k writes once, against a 20k/day free-tier allowance; the
  home snapshot copies the field through on its next hourly run, so there is no second backfill.

  *(Two corrections deep. The original draft excluded backfill entirely; Phase 0 over-corrected to
  "mandatory, the feature is invisible without it"; implementation found the true scope is one
  surface. See [research.md](research.md) R-1.)*
- **NFR-003**: The work MUST ship as three separable groups so a regression bisects to one of them
  (II): **(a)** the correctness fixes and the resolver seam (US1, US3 provenance), which change no
  behaviour a reader can see except that wrong times become right; **(b)** extrapolation and the
  horizon (US2), which extends what is drawn; **(c)** the widened autoplay gate and the `~` marking
  (US4), which must land together — the gate without the marking would ship estimated times into
  playback unlabelled, and is the one ordering this feature forbids.
- **NFR-004**: Resolution MUST stay under 5 ms for a 30-step build — the budget `021` set for the
  series it feeds.
- **NFR-005**: The resolver MUST be verifiable by a throwaway Node harness covering at minimum the
  four Evidence shapes, matching the approach `020` and `021` used. It is not committed as a suite
  (constitution: manual golden-path testing).

### Key Entities

- **Resolved step time**: a moment on the build's clock, plus how it was arrived at. The provenance
  is not decoration — it is what lets the UI keep its promise that an estimate never reads as a fact.
- **Anchor**: a step that states both a time and a villager count, and can therefore bound a span.
  Anchors are the only measured points in a build; everything else is derived from the distance
  between them.
- **Anchor span**: the stretch between two consecutive anchors. Its duration is measured, so the
  interpolation inside it is self-normalizing — it needs no villager production rate, and therefore
  absorbs the author's civilization, town centre count and idle time without modelling any of them.
  This is the property the whole design is built to preserve.
- **Observed rate**: seconds per villager, measured from a build's own last usable span. The reason
  no civilization table is needed: a build that measured itself has already priced in its civ.
- **Horizon**: how far past its last measurement a build may be extended before an estimate stops
  being worth more than an absence.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Each of the four Evidence shapes, run through the resolver, produces finite,
  non-negative, non-decreasing times inside their spans. Specifically: D1 yields no `NaN`, D2 places
  no step outside `2:00–4:00`, D3 resolves without returning `null`, D4 does not run backwards.
- **SC-002**: The string `"alid"` cannot be produced for any step of any build. Verified by resolving
  a fixture set and asserting every rendered time matches `m:ss`.
- **SC-003**: A fixture set of nine builds — fully stamped / stamped-then-blank / **runs past the
  horizon** / age-ups-only / same-count-span (D1) / cell-less-step-in-span (D2) /
  legacy-flat-with-note (D3) / decreasing-villagers (D4) / no-timestamps-at-all — resolves with no
  console errors and with the provenance distribution recorded in the quickstart. The same nine are
  the fixtures SC-005a and SC-005b are checked against.
- **SC-004**: On a build stamped through Feudal and blank after, the age timeline and economy plot
  place the last extrapolated step at the same second, and neither draws anything past the horizon.
- **SC-005**: Every build that offers autoplay today still offers it, and announces every step at the
  same second as before. Verified by diffing resolved times against `main` across the fixture set.
  The only permitted difference on those builds is the newly shown `~` on interpolated steps.
- **SC-005a**: The stamped-then-blank fixture, which is refused autoplay on `main`, is offered it
  after this feature — and the fixture that runs past the horizon is still refused.
- **SC-005b**: No time displayed anywhere in the app is both derived and unmarked. Checked across the
  fixture set in Focus mode, on the age timeline, and in the age tooltip.
- **SC-006**: No diffs outside `timingsHelper.js`, `useAgeTimings.js`, `useEcoSeries.js`,
  `FocusMode.vue`, `AgeTimeline.vue`, `EcoLines.vue`, and — for FR-024 — `BuildOrderEditor.vue` and
  `BuildOrderSectionEditor.vue`. In the components, no diff that moves any element: only marker,
  footnote copy, stroke-dash, and the previously-empty time cell.
- **SC-009**: `AgeChips.vue` and `BuildListCard.vue` are **byte-identical** to `main`, and the home
  lanes and list cards render pixel-identically. Any diff there means `derived` was replaced instead
  of retained (FR-016) — the fastest signal that R-2 was ignored.
- **SC-010**: After the backfill, three spot-checked builds whose age times were wrong under D1/D2/D4
  show the corrected times on the detail page, the list card, **and** the home lane. Before the
  backfill they still show the old values — which is the observation that proves NFR-002a is load
  bearing rather than precautionary.
- **SC-007**: `villagerAggregator.js` is byte-identical to `main`. This feature changes when a step
  happens, never how many villagers it has.
- **SC-008**: No file in the repository gains a mapping from civilization, landmark, or technology to
  a production rate.

## Assumptions

- **A-1 — The anchor span is the design's load-bearing idea.** Between two stamped steps the elapsed
  time is *measured*, so distributing it proportionally needs no villager train time at all. That is
  why the current scheme survives contact with 16 civilizations, multiple town centres and idle
  production without knowing about any of them. Every requirement here is written to preserve that
  property, and extrapolation is bounded precisely because it is the one place the property does not
  hold.
- **A-2 — Empirical beats nominal.** A rate measured from the build itself already encodes its civ,
  its town centre count and its author's real (not theoretical) uptime. A nominal constant encodes
  none of those. The nominal rate is therefore a last resort, not a baseline.
- **A-3 — The nominal fallback rate is ~20 seconds per villager**, the game's base villager training
  time, used only for builds that offer no measured span. It is one constant, not a model. Builds
  relying on it are the ones with the least data, so they are also the ones whose estimates are least
  trusted anyway.
- **A-4 — Civilization modelling is deliberately excluded, and this is the main design decision.**
  Not because civ production differences are unreal — they are, and at the extremes (much faster and
  much slower villager production both exist in the roster) they are large. Three reasons: the
  observed rate in FR-008 **already captures the civ bonus** on any build with two or more anchors,
  which is most of them; civ bonuses are second-order next to what is *still* unmodelled (town centre
  count, idle time, and the fact that anchors are hand-typed approximations), so a civ multiplier
  would add precision to the wrong decimal place; and a per-civ table is re-tuned every balance
  season, where a stale number is worse than no number because the UI labels it "estimated" and
  readers read that as "estimated *well*". Civ data would only help builds with fewer than two
  anchors — exactly the builds that should show *less*, not guess more.
- **A-5 — Technology modelling is excluded, and that axis is nearly empty anyway.** This model
  interpolates by **villager production**, and almost no technology affects villager production
  *speed* — Wheelbarrow, Textiles and the rest change gather rates and survivability. The one genuine
  first-order effect is an additional town centre, which roughly halves seconds-per-villager and
  dwarfs any civ bonus — and which FR-008 already absorbs automatically, because a build stamped
  after its second town centre has measured the new rate.
- **A-6 — Inherited counting defects stay inherited.** `villagerAggregator` still reads only the
  first two `+` operands and still counts a fishing boat as a villager (`021`'s A-1). This feature
  reads villager counts through it unchanged so the resolver, the `N vils` markers and the economy
  plot cannot drift apart. Fixing the parser remains its own feature.
- **A-7 — Stated times are sacred.** The resolver never rewrites, smooths, or reorders a timestamp
  its author typed, even one that contradicts its neighbours. Authors are describing games they
  played; the site's job is to fill gaps, not to correct the record.
- **A-8 — `021` is merged and released.** This feature starts from `main` at `1.15.0`, with
  `EcoLines.vue` and `useEcoSeries.js` in place, and modifies the `timingsHelper.js` that `021`'s
  SC-007 required to be untouched. That constraint expired with `021`; its *reason* (Focus mode's
  binary autoplay gate) did not, which is why FR-013 through FR-015 exist.
- **A-9 — The site carries no analytics**, so FR-009's horizon constants are validated against a
  sample of real builds offline during implementation, exactly as `021`'s gate constants were.
- **A-10 — `~` already exists and already means the right thing.** `AgeTimeline.vue` prefixes derived
  times with it in three places and explains it in a footnote. This feature therefore spreads an
  established marker into Focus mode rather than inventing a vocabulary. The consequence accepted is
  that `~` alone cannot tell the two derived tiers apart — deliberate, per FR-019: the distinction is
  a sentence, so it lives in the footnote (FR-020) and in the plot's stroke (FR-022), not in a glyph
  that would have to be legible at 11 px.
- **A-11 — The horizon is now load-bearing in two ways.** Under FR-014 it no longer only decides how
  far a line is drawn; it decides whether a build can be autoplayed at all. That raises the cost of
  setting it too tight (builds lose autoplay they could have had) and of setting it too loose
  (playback drifts further from reality before it stops). A-9's offline validation is therefore run
  against both consequences, not just the visual one.

## Clarifications

### Session 2026-08-05

- **Q: How far may Focus mode's autoplay gate loosen — may extrapolated times play a build?**
  → A: **Yes, but they must be marked and visible.** `getTimings()` admits `stated`, `interpolated`
  and `extrapolated`; only an `unresolved` step (i.e. a build running past its horizon) still fails
  the build. In exchange, Focus mode — which marks nothing today — must prefix every time it did not
  read from the author with `~`. FR-014, FR-015a, US4 scenarios 4–6, SC-005a, SC-005b.

  **Consequence accepted**: playback on a stamped-then-blank build drifts from the real game across
  its extrapolated tail. The `~` tells the player which steps to distrust, but it cannot tell them by
  how much, and a player following audio cues may not be looking at the marker at all.

- **Q: How is an extrapolated time presented, versus an interpolated one?**
  → A: **One marker, three tiers, distinguished by explanation rather than by glyph.** Investigation
  during clarification found `~` is already the site's marker for a derived time
  ([AgeTimeline.vue:40](../../../src/components/builds/AgeTimeline.vue#L40),
  [:53](../../../src/components/builds/AgeTimeline.vue#L53)), so the `~2:00` proposed for
  extrapolation was already taken by interpolation and would have merged the two tiers rather than
  separated them. Instead: `~` keeps its single meaning and spreads to Focus mode; the tiers are
  told apart by the timeline footnote (FR-020) and by a dashed stroke past the last anchor in the
  plot (FR-022). FR-019 through FR-023, US3 scenarios 5–7, A-10.

  **Consequence accepted**: on the timeline, a reader who does not read the footnote cannot tell a
  projected age time from an interpolated one — both show `~8:30` in the same de-emphasised style.
  Judged the right trade: `≈` versus `~` is unreadable at chip size, and the reader's decision is the
  same in both tiers.

### Session 2026-08-05 (post-plan, from Phase 0)

- Q: Do the correctness fixes reach existing builds on their own?
  → A: **No.** `useAgeTimings` prefers the stored `ageTimings` field over deriving, and all ~4k stored
  values came from the defective resolver. A one-time backfill is mandatory and now ships with the
  feature. NFR-002a, SC-010, R-1. *The earlier draft's "no backfill" was simply wrong.*

- Q: Should provenance replace the `derived` boolean?
  → A: **No — additive.** `derived` has five consumers across three components, two of which
  (`AgeChips.vue`, `BuildListCard.vue`) render the home lanes and list cards and were never in scope.
  They draw a two-tier distinction that stays correct, so replacing the boolean would be diff without
  gain. FR-016, SC-009, R-2.

- Q: Should the stored field widen to carry the third tier?
  → A: **No.** `{ t, e }` stays. **Consequence accepted**: a build read from the stored field reports
  an extrapolated age as interpolated, so its footnote errs toward the humbler claim. Bounded,
  because an age boundary is a step authors nearly always stamp. R-3.

### Session 2026-08-05 (continued)

- **Q: Does the D3 fix alone widen autoplay, independently of extrapolation?**
  → A: Yes, and it would have even under the strictest reading of Q1. A `gameplan` note is not a step
  and was never going to have a time; requiring one was simply a defect. Legacy flat builds with
  notes gain autoplay on the correctness commits alone, before any extrapolation ships. FR-011,
  US4 scenario 3.
