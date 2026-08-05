# Feature Specification: Economy Lines — Collapsible Villager Distribution

**Feature Branch**: `021-economy-lines`

**Created**: 2026-08-04

**Status**: Clarified — ready for `/speckit-plan`

**Input**: "A build's shape — how eco splits across food/wood/gold/stone over time — is its real
identity, and it is currently only visible by reading 30 table rows. Show it as a chart." Resolved
after mocking six treatments: **four unstacked absolute lines, revealed by a collapsed-by-default
disclosure inside the existing Timeline card.**

## Scope & Non-Goals *(read first)*

**In scope:**

- `src/components/builds/AgeTimeline.vue` — a disclosure row beneath the existing track, and the
  plot it reveals. The card's collapsed appearance MUST be unchanged.
- A new component `src/components/builds/EcoLines.vue` — the read-only SVG plot.
- A new composable `src/composables/builds/useEcoSeries.js` — per-step series + coverage gate.
- One atomic refactor: extract the step-flattening loop from `useAgeTimings.js` into a shared
  helper both composables call, so the two charts can never disagree about step indices
  (Principle II — separate commit, no behaviour change).
- Persisting the open/closed state across builds.

**Explicitly NOT in scope (leave exactly as-is):**

- `src/composables/builds/villagerAggregator.js` — **read-only reuse, including its known defects**
  (see assumption A-1). The chart must agree with the `N vils` markers even where both are wrong.
- `src/composables/builds/timingsHelper.js` — read-only reuse (the `020` contract). Its
  all-or-nothing return is **deliberate and load-bearing elsewhere**: Focus mode gates autoplay on
  it, and autoplay is genuinely binary — a build either has a time for every step or it cannot be
  played automatically. This feature works around that contract; it must never relax it. See A-9.
- The list card (`BuildListCard.vue`), the age rail, the home lanes, the filter bar.
- The build editor, Focus mode, the overlay export, Firestore rules, the build schema.
- Sorting or filtering by anything derived here.

> No new data is fetched, no new dependency is added. The chart is hand-written SVG — a charting
> library for five polylines would not survive Principle I.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read a build's economy without reading 30 rows (Priority: P1)

A player opens a build, expands **Economy**, and sees when food flattens, when gold ramps, and
whether stone was ever touched — against the age-up lines already on the card.

**Why this priority**: This is the feature. If only this ships, it is worth shipping.

**Independent Test**: Open a build with well-filled resource cells at ≥960 px. Expand Economy.
Four lines render across the same 0–16:00 span as the age track directly above, with the age-up
moments marked by the same vertical positions.

**Acceptance Scenarios**:

1. **Given** a build with usable timings and resource cells, **When** the reader expands Economy,
   **Then** five lines — builders, food, wood, gold, stone — are drawn as absolute villager counts
   against the card's existing time scale, each in its column colour, with a legend naming all five.
2. **Given** the expanded plot, **When** it renders, **Then** dashed vertical guides sit at each
   age-up second, at the same x as the crest markers above them.
3. **Given** a build that never assigns stone, **When** the plot renders, **Then** the stone line
   is drawn flat at zero and still appears in the legend (its absence is information). The same
   holds for builders on a build that never pulls anyone onto construction.
4. **Given** any build, **When** the plot renders, **Then** **no** total-villager line is drawn —
   the count is already on each age marker.
5. **Given** any build, **When** the plot renders, **Then** the villager counts at each point MUST
   sum to the same total the `N vils` markers show for that step — the plot and those markers read
   the cells identically, so they can never disagree about a row.

---

### User Story 2 - The card costs nothing to readers who don't want it (Priority: P1)

A player who only wants age times sees the card exactly as it is today, plus one row of chrome.

**Why this priority**: This is what makes the feature affordable. The Timeline card sits above the
build order; permanent height there is expensive.

**Independent Test**: Load a build. The card's collapsed height matches today's plus the
disclosure row, and the build order has not moved further down the page than one row's worth.

**Acceptance Scenarios**:

1. **Given** a build details page on first load, **When** the card renders, **Then** the plot is
   **collapsed**, and no layout shift or expand animation occurs on mount.
2. **Given** the collapsed card, **When** the reader activates the Economy row, **Then** the plot
   expands with the standard Vuetify expand transition and the chevron rotates.
3. **Given** a reader who expanded Economy on one build, **When** they open a different build,
   **Then** Economy is already expanded (the preference is remembered, not the build).
4. **Given** a keyboard user, **When** they tab to the row, **Then** it is focusable, activates on
   Enter/Space, and exposes `aria-expanded`.

---

### User Story 3 - Never show a chart the data can't support (Priority: P1)

A player opens a build whose author filled in three resource cells and wrote the rest in prose.
They see no Economy row at all.

**Why this priority**: A chart of four points spread over sixteen minutes reads as a bug. This is
the single largest quality risk in the feature.

**Independent Test**: Take a build where fewer than half the steps state any resource cell. The
disclosure row is absent — not present-but-empty.

**Acceptance Scenarios**:

1. **Given** a build where fewer than **50 %** of flattened steps state at least one resource cell,
   **When** the card renders, **Then** the Economy row is not rendered.
2. **Given** a short build where **fewer than 4** steps state any resource cell — even though the
   ratio passes — **When** the card renders, **Then** the Economy row is not rendered. A passing
   ratio on a 6-step build would otherwise draw a three-point chart.
3. **Given** a build with **no plottable points** — no step states a time and none can be
   interpolated — **When** the card renders, **Then** the Economy row is not rendered. Note that a
   build whose *trailing* steps are unstamped still charts the part that is known: the row is
   suppressed only when nothing at all can be placed on the axis.
4. **Given** a build whose author stops filling cells partway but whose ages continue, **When** the
   plot renders, **Then** the lines end at the last step that assigned anybody and the legend area
   carries the note **"No villagers assigned after m:ss"** — so the early ending reads as the
   description stopping, not the build stopping.
5. **Given** a blank cell on a step that assigns somebody elsewhere, **When** the series is built,
   **Then** that column reads **zero** for that point — matching the `N vils` total on the same row,
   which counts a blank as nobody.

---

### User Story 4 - Phones (Priority: P3)

**Independent Test**: At xs/sm, the card shows what it shows today; no Economy row.

**Acceptance Scenarios**:

1. **Given** xs/sm, **When** the card renders, **Then** the Economy row and plot are absent — the
   card already falls back to age chips at that width, and five lines in a 320 px box is not a
   chart. (Matches the existing `d-none d-md-block` split in `AgeTimeline.vue`.)

---

### Edge Cases

- Legacy flat builds (no sections): no age timings today, therefore no card, therefore no row.
- A step with all-zero cells: `aggregateVillagers` returns `null` for it, but the per-column series
  must still read `0` rather than skipping the point.
- A build running past 16:00: the plot MUST use `AgeTimeline`'s already-extended `scaleSeconds`,
  not its own — the two must never disagree by a pixel.
- A build with one villager on stone for two steps: the stone line must remain visible (min stroke,
  no smoothing that erases a two-point excursion).
- Duplicated timestamps or times that run backwards: sort by the timing value, clamp x to the track.
- Skeleton/loading cards must not derive anything.

## Requirements *(mandatory)*

### Functional Requirements

**Series (composable)**

- **FR-001**: `useEcoSeries.js` MUST return, from `build.steps`, an ordered point list
  `{ seconds, builders, food, wood, gold, stone }` plus `{ coverage, lastStatedSeconds }`.
- **FR-002**: It MUST flatten sections into steps with the **same** helper `useAgeTimings.js` uses,
  so indices align with the age boundaries drawn on the same card.
- **FR-003**: A step that assigns anybody states its **whole** distribution: its blank cells mean
  nobody is on that resource, **not** that the previous number still stands. Values MUST NOT be
  carried forward. This is what `aggregateVillagers` already does for the `N vils` markers — it sums
  the five cells and reads a blank as zero — so carrying forward would put the plot and those
  markers in open disagreement about the same row.
- **FR-004**: A step that assigns **nobody at all** — an age-up, a comment, a bare timestamp — says
  nothing about the economy and MUST contribute no point, rather than dragging every line to zero.
  It still counts against coverage: the author left it empty.
- **FR-005**: Values MUST be parsed with the existing `villagerAggregator` parsing, unmodified, so
  the plot and the `N vils` markers can never contradict each other.
- **FR-006**: It MUST resolve each step's position on the time axis **independently**, in this
  order: the step's own stated timestamp; failing that, the interpolated time for that step when one
  is available; failing that, the step is not plottable and contributes no point — though its stated
  cells still carry forward, surfacing at the next point that can be placed.

  A build-wide failure to resolve every step MUST NOT suppress the chart. Builds whose authors stop
  stamping partway are the common case and the exact shape the faded tail exists for; refusing them
  a chart would hide the feature on the builds it was designed for.
- **FR-006a**: It MUST return `null` when the build fails **either** half of the coverage gate. Both
  halves must pass:
  - **ratio** — at least **50 %** of flattened steps state at least one resource cell, and
  - **floor** — at least **4 plotted points** state at least one resource cell.

  The ratio catches prose-heavy builds; the floor catches short builds, where a passing ratio can
  still yield a three-point chart. The floor counts plotted points rather than stated steps because,
  under FR-006, the two are no longer the same number. A build that fails either half — or that
  yields no plottable points at all — shows no Economy row: there is no degraded or sparse
  rendering.
- **FR-007**: It MUST be memoized per build and MUST NOT throw on any malformed step shape.

**Plot**

- **FR-008**: `EcoLines.vue` MUST draw exactly five polylines — builders, food, wood, gold, stone —
  of absolute villager counts, in the order the build order table lists its columns. **No stacking
  and no total line.** Builders are drawn despite being transient: they are villagers pulled off
  gathering, so a build holding four on construction has a different economy from one holding none,
  and omitting them made that invisible.
- **FR-009**: The x-axis MUST be the `scaleSeconds` passed down from `AgeTimeline.vue`.
- **FR-010**: The y-axis MUST be a floor of 16 villagers, extended in whole steps when a build
  exceeds it, with gridlines and labels on every step — so two builds compared in two tabs are
  comparable. The floor is sized to what a *single resource* reaches. An earlier draft used 24, which
  was sized for the total-villager line the design later dropped (§Rejected), and left most builds
  drawing in the bottom third of an empty box.
- **FR-010a**: The step MUST widen from 4 to 8 to 16 as needed to keep the grid at **6 lines or
  fewer**. A late-game build peaking near 48 villagers on one resource ruled twelve gridlines behind
  five polylines, and the grid began reading as the chart. Widening the step — rather than labelling
  every other line — keeps the top gridline on a round number and on the axis top.
- **FR-011**: Age-up seconds MUST be drawn as dashed vertical guides at the same x as the crests.
- **FR-012**: There are no points past `lastStatedSeconds` to fade — under FR-003 every point is a
  moment the build actually described, so a line simply ends where the author stopped assigning
  villagers. When the build **continues past that moment** (an age is reached later), the legend area
  MUST carry the note **"No villagers assigned after m:ss"**, so an early-ending line reads as the
  description stopping rather than the build stopping.
- **FR-013**: A legend MUST name all five columns with their line colours, and MUST NOT list any
  series the plot does not draw.
- **FR-014**: The plot MUST be non-interactive (no tooltips, no crosshair) in this feature.
- **FR-021**: The plot MUST be hidden from assistive technology (`aria-hidden`), and MUST NOT be
  reachable by keyboard focus. Every value it draws is already present, in accessible form, in the
  build order table below it — the graphic is a visual restatement, so it is marked decorative
  rather than given a text alternative. The disclosure row itself stays fully accessible per FR-016.

**Disclosure**

- **FR-015**: The plot MUST be collapsed on first load for a reader with no stored preference.
- **FR-016**: The row MUST be a Vuetify control (`v-btn variant="text" block` or `v-list-item`) with
  `mdi-chart-line`, the label **Economy**, a subtitle, and a rotating `mdi-chevron-down`. The
  subtitle MUST be the same string open and closed — the row reads as a heading, and a heading that
  rewrites itself on click is movement without meaning.
- **FR-017**: Expansion MUST use `v-expand-transition`, and MUST NOT animate on mount.
- **FR-018**: The open state MUST persist across builds and sessions as a **device-local user
  preference**, not per build. It survives reload and new tabs on the same browser; it does not
  follow the reader to another browser or device. Behaviour MUST be identical signed-in and
  signed-out — the preference is never read from or written to the reader's account.
- **FR-019**: The row MUST NOT render when `useEcoSeries` returns `null`, and MUST NOT render at xs/sm.
- **FR-020**: The collapsed card MUST be pixel-identical to today's apart from the added row.

### Non-Functional / Constitution

- **NFR-001**: Vuetify components only; the plot is inline SVG, no charting dependency (I + III).
- **NFR-002**: No new Firestore reads, no schema change, no new index (IV).
- **NFR-003**: Both themes via theme tokens; the five column colours declared per theme (III).
- **NFR-004**: Series derivation < 5 ms for a 30-step build on a mid-range phone; it runs only when
  the card renders, and the SVG only when expanded.
- **NFR-005**: The flatten extraction ships as its own commit with no behaviour change (II).

### Key Entities

- **Economy series**: the ordered set of moments a build passes through, each carrying a second on
  the timeline, one villager count per resource (food, wood, gold, stone), and whether the author
  actually stated anything at that moment. Derived only — nothing is stored or fetched.
- **Coverage**: how much of a build its author actually filled in — both as a share of steps and as
  an absolute count of stated steps. Together these are the gate that decides whether a build has
  an economy worth charting at all.
- **Last stated moment**: the time after which the author stopped filling cells. Everything past it
  is carry-forward, not observation, and must be presented as such.
- **Economy-open preference**: a reader's choice to see the plot expanded, remembered for the
  reader rather than for the build.

## Success Criteria

### Measurable Outcomes

- **SC-001**: On a build with full cells, expanding Economy draws five lines whose age-up guides sit
  at the same x (±0 px) as the crest markers above them.
- **SC-001a**: On any charted build, every point's five counts sum to the `N vils` figure shown for
  that step in the build order table. This is the check that catches the plot and the markers
  drifting apart.
- **SC-002**: A fixture set of seven builds — full / sparse-tail / **trailing-unstamped** /
  under-ratio / short-build-under-floor / no-timestamps-at-all / legacy-flat — renders per FR-006,
  FR-006a, FR-012 and FR-019 with no console errors. The trailing-unstamped fixture MUST chart the
  part that is known; it is the case the original `getTimings` gate would have hidden.
- **SC-003**: The collapsed card's height differs from today's by exactly the disclosure row.
- **SC-004**: Expanding on build A and opening build B shows B expanded.
- **SC-006**: No diffs outside `AgeTimeline.vue`, `EcoLines.vue`, `useEcoSeries.js`, the flatten
  extraction in `useAgeTimings.js`, and the one-line parser export in `villagerAggregator.js`.
- **SC-007**: `timingsHelper.js` is byte-identical to `main`. Focus mode's autoplay gate
  (`autoplaySupported = getTimings(steps) ? true : false`) still behaves exactly as it does today.

### Design Notes (non-blocking)

- **SC-005 (demoted, does not gate the feature)**: Three archetype builds (boom / feudal all-in /
  stone) should be distinguishable by shape alone by a reader who cannot see the titles. This is
  the read test the stacked version failed, and it remains the reason the lines are unstacked — but
  it is a design conviction carried over from the mock, not a gate the implementation must clear.
  Worth a look while building; not a reason to hold the feature. **Consequence accepted**: nothing
  in the acceptance path re-tests the silhouette read on real data, so if it turns out weaker on
  live builds than it was on the mock, that surfaces after ship rather than before.

## Assumptions

Reasonable defaults taken where the handoff did not decide, and constraints inherited on purpose.

- **A-1 — Inherited counting defects are a feature, not a bug (was NC-3).** The existing villager
  parser reads only the first two `+` operands (`"4+1+2"` drops the 2) and counts a fishing boat as
  a villager. This feature deliberately inherits both, unchanged, so the plot and the `N vils`
  markers on the same card can never contradict each other. Fixing the parser is its own feature —
  it changes every villager number on the site and must not be folded in here.
- **A-2 — Preference mechanism follows the theme precedent.** The open/closed state uses the same
  device-local mechanism the app already uses for the theme choice, rather than introducing a
  second one or becoming the app's first account-synced preference. Resolved — see FR-018.
- **A-3 — Desktop-only is intentional, not a phase-1 cut.** Four lines in a 320 px box is not a
  chart, and the card already degrades to age chips at xs/sm. There is no planned phone treatment.
- **A-4 — No new data.** Everything charted is already on the build document and already read by
  the page. No fetch, no schema field, no index, no backfill.
- **A-10 — A blank cell and a typed `"0"` are the same thing, and the build order table already
  says so.** `hasResourceValue()` renders both as `–`
  ([BuildOrderSectionEditor.vue:285](../../../src/components/builds/BuildOrderSectionEditor.vue#L285)),
  and `aggregateVillagers` counts both as nobody. The plot follows suit. An earlier draft treated a
  typed `"0"` as a distinct "abandoned this resource" statement, which would have made a line drop
  for a reason invisible in the rows above it.
- **A-5 — The plot is a still image.** No tooltips, crosshair, hover readout, or toggles in this
  feature. Share-of-population lines are explicitly deferred as a possible later toggle.
- **A-6 — Readers compare builds in two tabs**, which is why the y-axis has a fixed floor and steps
  rather than auto-fitting each build.
- **A-7 — Authors fill resource cells inconsistently**, which is why coverage gating and the faded
  tail exist at all rather than being polish.
- **A-8 — The gate constants are tuned offline, not measured in production.** The app carries no
  analytics, and adding some for this would be disproportionate. The 50 % / 4-point numbers are
  checked against a sample of real builds while implementing, and that sample's distribution is
  recorded so a later reader can see why the constants are what they are.
- **A-9 — `getTimings()` stays all-or-nothing, because Focus mode needs it that way.** Its habit of
  discarding a whole build when one step is unresolvable looks like a bug from this feature's angle,
  and it is not: Focus mode sets `autoplaySupported` directly from whether the call returned
  anything, and autoplay has no partial mode — a build either plays or it does not. A chart is
  different: it can honestly draw the part that is known. So this feature changes **how it reads the
  result**, never the helper. Making `getTimings` return partial timings would silently hand
  autoplay builds it cannot play (SC-007 guards this).

## Clarifications

### Session 2026-08-05

- Q: How far does the Economy-open preference reach — device-local, account-bound, or session-only?
  → A: Device-local. Stored the same way the theme choice already is; identical signed-in and
  signed-out; does not follow the reader to another browser or device.

- Q: Is the 50 % coverage threshold the shipping value, and what should a just-under build see?
  → A: Two-part gate — **≥50 % of steps stated AND ≥4 stated steps**, both required. A build that
  fails either half shows no row; there is no sparse or degraded rendering. The numbers are
  validated offline against a real-build sample during implementation (the app has no analytics, so
  runtime instrumentation was not an option), and the sampled distribution is recorded in the
  quickstart so the constants are not left unexplained.

- Q: What is the pass bar and the judge for SC-005 ("distinguishable by shape alone")?
  → A: Demoted. SC-005 no longer gates the feature; it moves to Success Criteria > Design Notes as
  a non-blocking design conviction. The feature ships on the functional criteria alone.

- Q: What does a screen-reader user get when the plot is expanded?
  → A: Nothing — the plot is `aria-hidden` and not focusable (FR-021). The build order table below
  already carries every value accessibly, so the chart is treated as a visual restatement rather
  than given a generated text alternative. **Consequence accepted**: the shape reading — the one
  thing the chart adds over the table — is not conveyed non-visually.

### Session 2026-08-05 (post-plan)

- Q: Phase 0 found that `getTimings()` returns `null` for any build whose trailing steps are
  unstamped, which would hide the Economy row on the builds the feature was designed for. Relax it?
  → A: Relax it **for the chart only**. `useEcoSeries` resolves each step's time independently
  (FR-006) and no longer treats a build-wide `null` as fatal. `getTimings` itself keeps its
  all-or-nothing contract untouched, because Focus mode's autoplay gate depends on it and autoplay
  is genuinely binary — there is no half-auto, half-manual playback (A-9, SC-007).

### Session 2026-08-05 (during implementation, from screenshots)

- Q: Should a blank resource cell carry the previous value forward, or read as zero?
  → A: **Zero.** Carry-forward was wrong. `aggregateVillagers` sums the five cells with a blank as
  nobody, so the `N vils` column on a step showing only `wood 7` reads **7** — while a carried plot
  claimed 13 on the same row. A step that assigns *nobody at all* is different: it says nothing and
  contributes no point. FR-003, FR-004, US1 scenario 5, new SC-001a.
- Q: Include builders in the plot?
  → A: Yes, as a brown fifth line, in the build order table's column order. They are villagers
  pulled off gathering, so leaving them out hid a real difference between builds — and with
  carry-forward gone, their dips no longer misread as economy lost. FR-008, FR-013.
- Q: Keep the y-axis floor at 24?
  → A: No — 16, gridlines every 4. The 24 was sized for the total-villager line the design dropped,
  and left real builds drawing in the bottom third of an empty box. FR-010.
- Q: Should the disclosure row's subtitle change between open and closed?
  → A: No. It reads as a heading; a heading that rewrites itself on click is movement without
  meaning. Fixed at "villagers per resource". FR-016.

> **NC-1 and NC-2 are resolved** — see the session above, FR-018 and FR-006a.
> **NC-3 is resolved, not open** — it is recorded as assumption A-1 above.
