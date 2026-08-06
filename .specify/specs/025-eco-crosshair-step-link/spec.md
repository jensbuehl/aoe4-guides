# Feature Specification: Crosshair Readout & Step ↔ Timeline Linking

**Feature Branch**: `025-eco-crosshair-step-link`

**Created**: 2026-08-06

**Status**: Implemented (code complete, manual verification outstanding) — see
*Deviations accepted during implementation* below

**Input**: "In the timeline and eco graph it is sometimes hard to follow a certain resource." Resolved
in two parts. The first — hover a line or a legend entry to dim the other four — **shipped ahead of
this spec** and is the baseline this builds on. This spec covers the second: **a crosshair that
snaps to the moments the author actually described, and a two-way link between that crosshair and
the build order rows below.**

## Scope & Non-Goals *(read first)*

**In scope:**

- `src/components/builds/EcoLines.vue` — a snapped vertical rule, dots on all five lines at the
  snapped moment, and a floating readout. The plot's resting appearance MUST be unchanged.
- `src/composables/builds/useEcoSeries.js` — each point additionally carries the **flat step index**
  it came from. Additive only; the existing gates, sorting and `stated` flag are untouched.
- `src/components/builds/AgeTimeline.vue` — renders the rule on the age track as well as the plot,
  so a moment is locatable even when the economy plot is collapsed or absent.
- `src/views/builds/BuildDetails.vue` — owns and provides the shared highlight state. It is the
  only place that knows both halves exist.
- `src/components/builds/BuildOrderEditor.vue` and `BuildOrderSectionEditor.vue` — publish the
  hovered row outward, consume the highlighted step inward, and expose a scroll target per row.
- A new composable, `src/composables/builds/useStepHighlight.js` — a **factory**, called once per
  build page, never module-level state.

**Explicitly NOT in scope (leave exactly as-is):**

- **A sticky timeline** that rides along while the reader scrolls the build order. It is the thing
  that would make step → chart pay off fully, it overlaps with Focus mode's existing "current step"
  concept, and it deserves its own decision. See A-7.
- **Redrawing the series as a step line** (holding each distribution flat until the next stated
  step). It would make a free-floating readout defensible, but it changes the silhouette of every
  chart on the site to buy what snapping already gives. See A-2.
- `src/composables/builds/villagerAggregator.js`, `timingsHelper.js`, `stepVisibility.js` —
  read-only reuse, including their known defects. The `020`/`021`/`022` contracts hold.
- `src/components/builds/FocusMode.vue` and `useStepPiP.js` — Focus mode's `currentStepIndex` is a
  *playback position*, not a *hover*. The two MUST NOT be merged in this feature. See A-7.
- The build editor (`readonly: false`). The Timeline card renders on the view route only, so there
  is no chart for an editing reader to link to.
- The `xs` layout. Below `md` the card falls back to `AgeChips` and the plot is not rendered at all.
- The build order table's own columns, sorting, filtering, and the `N vils` markers.
- Firestore rules, the build schema, any network call. **This feature reads nothing new.**

> No new data is fetched and no dependency is added. The readout is a Vuetify tooltip; the rule and
> dots are the same positioned-HTML-over-SVG approach the card already uses for its guides and caps.

## Clarifications

### Session 2026-08-06

- **Q: Where do the five villager counts appear when the crosshair snaps?**
  **A: A floating readout that follows the crosshair.** Chosen over folding the values into the
  legend row. The values stay next to the point they describe, which is the whole point of a
  crosshair, and the legend keeps its job of naming colours. The cost — a 140 px plot is short
  enough that a naive tooltip covers the lines it describes — is paid for by FR-011 (side flipping)
  rather than by moving the readout somewhere it reads worse.

- **Q: Clicking a line currently pins a resource. Clicking the crosshair is meant to jump to a step.
  What does a click inside the plot mean?**
  **A: Any click inside the plot jumps to that step; pinning moves to the legend only.** One
  surface, one meaning. Splitting by target would make the same gesture mean two different things
  six pixels apart, and with 12 px hit strokes "not on a line" is a smaller target than it looks.
  Nothing is lost: the legend still pins, and the pin is what lets a reader take the pointer off a
  line and keep it emphasised.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read the numbers at a moment without tracing a line (Priority: P1)

A player expands **Economy**, moves the pointer across the plot, and reads all five villager counts
at a given moment directly — instead of following one line with their eye across four crossings.

**Why this priority**: This is the feature. It is also the most complete answer to the original
complaint: you stop needing to *follow* a line once you can *read* every line at once.

**Independent Test**: Open a build with a drawn economy plot at ≥ 960 px. Move the pointer across
the plot. A vertical rule, five dots and a readout appear and track the pointer in discrete jumps.

**Acceptance Scenarios**:

1. **Given** an expanded plot, **When** the pointer moves within the plot area, **Then** a vertical
   rule appears at the moment nearest the pointer, with one dot per resource on its line, and a
   readout naming the time and all five villager counts.
2. **Given** the pointer moves continuously left to right, **When** it crosses the midpoint between
   two adjacent points, **Then** the rule jumps to the next point rather than sliding — the rule is
   never drawn anywhere except at a moment the build describes.
3. **Given** the pointer leaves the plot area, **When** it does, **Then** the rule, dots and readout
   disappear together and the plot returns to its resting appearance.
4. **Given** a resource is emphasised (hovered or pinned via the legend), **When** the crosshair is
   active, **Then** both are shown at once — the readout's row for that resource takes the emphasis,
   and the other four lines stay dimmed.

---

### User Story 2 - Never show a number the author did not write (Priority: P1)

The readout quotes only what the build states. It never samples the sloping line between two points.

**Why this priority**: A number in a readout is quoted as fact in a way a sloping line is not. The
plot already refuses to draw values the author never wrote; a readout that undoes that would be a
regression dressed as a feature.

**Independent Test**: Hover between two points on a sparsely stamped build. The readout shows one of
the two neighbouring moments verbatim — never an interpolated figure, never a fractional villager.

**Acceptance Scenarios**:

1. **Given** the pointer sits between two points, **When** the readout renders, **Then** every count
   shown is an integer taken verbatim from one described moment — no averaging, no interpolation.
2. **Given** a point whose time the site resolved rather than the author stating it, **When** it is
   snapped to, **Then** the time carries the site's existing `~` marker.
3. **Given** a point whose time the author stated, **When** it is snapped to, **Then** no `~`
   appears.
4. **Given** the counts shown for a moment, **When** compared with the `N vils` marker on the
   corresponding build order row, **Then** they sum to the same total — the two read the same cells.
5. **Given** the pointer is to the right of the last drawn point, **When** it moves there, **Then**
   no crosshair is shown at all — it does not snap backwards into the region the plot leaves empty.

---

### User Story 3 - From the chart to the step (Priority: P2)

A reader sees an interesting inflection — gold ramping, food flattening — and wants the row that
caused it. Hovering identifies it; clicking takes them there.

**Why this priority**: This turns the chart from a picture into a way of navigating the build. It
depends on US1 but delivers value on its own.

**Independent Test**: Hover a moment on the plot with the build order visible below; the matching
row is highlighted. Click; the page scrolls to that row.

**Acceptance Scenarios**:

1. **Given** the crosshair is snapped to a moment, **When** it is, **Then** the build order row that
   moment came from is highlighted using the row-hover treatment the table already has.
2. **Given** the crosshair is snapped to a moment, **When** the reader clicks anywhere inside the
   plot, **Then** the page scrolls that row into view and it remains highlighted long enough to be
   found by eye.
3. **Given** a build with more than one section, **When** any moment is snapped to, **Then** the
   highlighted row is in the correct section — indices are resolved in flattened order, not
   per-section order.
4. **Given** the reader clicks inside the plot, **When** they do, **Then** no resource is pinned or
   unpinned as a side effect.

---

### User Story 4 - From the step to the chart (Priority: P2)

A reader working through the build order wants to know where a step sits in the game — which age,
how far in — without leaving the row.

**Why this priority**: The reverse direction closes the loop, but it is the weaker half: the card
sits above a long build order, so much of the time the output would be off-screen. Gating it on
visibility is what keeps it honest.

**Independent Test**: With the Timeline card visible, hover a build order row. The rule appears at
that step's moment. Scroll the card off-screen and hover another row; nothing is tracked.

**Acceptance Scenarios**:

1. **Given** the Timeline card is visible on screen, **When** the reader hovers a build order row
   with a resolved time, **Then** the rule appears at that step's moment on the age track, and on
   the economy plot too if it is expanded.
2. **Given** the hovered row describes no villagers — a comment, an age-up, a lone timestamp —
   **When** it is hovered, **Then** the rule still appears at its moment on the age track, with no
   dots and no counts, because the row's position in the game is itself the answer.
3. **Given** the Timeline card is scrolled out of view, **When** the reader hovers rows, **Then**
   nothing is highlighted and no work is done.
4. **Given** the economy plot is collapsed, **When** a row is hovered, **Then** the plot MUST NOT
   expand itself — the rule appears on the age track only.
5. **Given** the reader scrolls the page with the pointer resting still over the table, **When**
   rows move beneath the stationary pointer, **Then** rows do not light up in passing.
6. **Given** a row whose time could not be resolved, **When** it is hovered, **Then** nothing is
   highlighted and the card is unchanged.

---

### User Story 5 - Readers who do not use it pay nothing (Priority: P3)

A reader who never moves the pointer over the plot or the rows sees the card and table exactly as
they are today.

**Why this priority**: The Timeline card sits above the build order. Anything permanent there is
expensive, and this feature earns none of that budget.

**Independent Test**: Load a build and read it without hovering. Compare against `main`: identical.

**Acceptance Scenarios**:

1. **Given** a build page at rest, **When** it renders, **Then** the card's height, layout and
   contents are unchanged from before this feature.
2. **Given** a build whose data supports no economy plot, **When** the page renders, **Then** the
   age track behaves exactly as it does today and step → chart still works against it.

---

### Edge Cases

- **Two steps resolving to the same second.** The series is sorted by time and does not de-duplicate.
  The later flat index wins, on the reading that a later step describing the same moment is the
  author's correction.
- **A point whose time was derived, not stated.** Snapping is unaffected; only the displayed time
  gains `~`. The counts are authored either way.
- **Fewer than two points.** No line is drawn today, so no crosshair is offered either.
- **Points closer together than the rule is wide.** Accepted. The rule still lands on exactly one
  moment; visual crowding is a property of a densely stamped build, not an error.
- **The pointer enters the plot already inside it** (page scrolled under a stationary pointer, or a
  keyboard-driven scroll). The crosshair appears on the first pointer *move*, not on entry.
- **A row is hovered while the crosshair is also being driven from the plot.** The most recent
  interaction wins; the two sources MUST NOT both hold the highlight.
- **The reader clicks inside the plot when nothing is snapped** — for example, past the last point.
  Nothing happens.
- **A build order long enough that the scrolled-to row lands under a sticky header.** The scroll
  MUST account for whatever sticky chrome is above it rather than putting the row underneath it.
- **Reduced-motion readers.** The click-to-scroll MUST respect `prefers-reduced-motion` and jump
  rather than animate.

## Requirements *(mandatory)*

### Functional Requirements

**Snapping and the readout (US1, US2)**

- **FR-001**: Each economy series point MUST carry the flat step index it was derived from, in
  `flattenSections` order.
- **FR-002**: The plot MUST track pointer movement across its whole area, not only over the drawn
  lines.
- **FR-003**: The active moment MUST be the series point whose time is nearest the pointer's
  horizontal position, measured in time, with no maximum distance — the plot's width partitions
  into bands around the points so that no position inside the drawn range is dead.
- **FR-004**: The active moment MUST be cleared when the pointer's position falls outside the range
  spanned by the first and last drawn points.
- **FR-005**: The vertical rule MUST be drawn at the active moment's own position, never at the
  pointer's.
- **FR-006**: One dot per resource MUST be drawn at the active moment, on that resource's line.
- **FR-007**: The readout MUST list all five resources with their villager counts at the active
  moment, in the same order as the build order table's columns.
- **FR-008**: Every count in the readout MUST be a value the author entered for that step. The
  system MUST NOT compute, interpolate, average or round any displayed count.
- **FR-009**: The readout MUST show the active moment's time, marked with `~` when that time was
  resolved by the site rather than stated by the author, matching the convention already used by the
  age markers.
- **FR-010**: The crosshair MUST respond immediately, with no intent delay — unlike the legend, its
  meaning is positional rather than a statement of interest.
- **FR-011**: The readout MUST NOT cover the active moment's dots. It MUST move to the opposite side
  of the rule when it would otherwise overflow the plot's horizontal bounds.
- **FR-012**: When a resource is emphasised via the legend, the readout's row for that resource MUST
  carry the same emphasis, and the crosshair MUST NOT clear or override that emphasis.
- **FR-013**: The crosshair MUST NOT interfere with the existing line-hover behaviour: hovering a
  line still dims the other four while the crosshair is active.

**Chart → step (US3)**

- **FR-014**: While a moment is active, the build order row at its flat step index MUST be
  highlighted, reusing the table's existing row-hover treatment rather than introducing a new one.
- **FR-015**: A click anywhere inside the plot while a moment is active MUST scroll that row into
  view.
- **FR-016**: A click inside the plot MUST NOT change which resource is pinned. Pinning is available
  from the legend only.
- **FR-017**: After a click-to-scroll, the target row MUST remain visibly marked long enough for a
  reader to locate it, independent of where the pointer ends up.
- **FR-018**: The scroll MUST position the row clear of any sticky page chrome, and MUST jump rather
  than animate for readers who prefer reduced motion.

**Step → chart (US4)**

- **FR-019**: Hovering a build order row MUST set the active moment to that step's resolved time.
- **FR-020**: The active moment MUST be expressible as a time alone. A step with a resolved time but
  no series point MUST still place the rule on the age track; it MUST NOT produce dots or counts.
- **FR-021**: A step with no resolvable time MUST produce no highlight.
- **FR-022**: Row hovering MUST NOT be tracked while the Timeline card is outside the viewport.
- **FR-023**: Row hovering MUST use the same intent delay as the legend, so a pointer travelling
  across rows does not light each one in passing.
- **FR-024**: Row highlighting MUST be suppressed while the page is scrolling, so rows moving under
  a stationary pointer do not light up.
- **FR-025**: A row hover MUST NOT expand a collapsed economy plot.
- **FR-026**: The age track MUST render the rule whether or not the economy plot is present, so the
  link works on builds that have no chartable economy.

**Shared state (all)**

- **FR-027**: The highlight state MUST be owned by the build page and shared with both halves
  without either half importing the other.
- **FR-028**: The highlight state MUST be per-build-page instance. Two builds rendered at once MUST
  NOT share a highlight.
- **FR-029**: Step identity MUST be the flat index across all sections. Any per-section index MUST
  be translated before it crosses between the two halves.
- **FR-030**: Only one source may hold the highlight at a time; the most recent interaction wins.

### Non-Functional / Constitution

- **NFR-001** (Principle I): No charting or tooltip-positioning dependency. The readout is a Vuetify
  tooltip driven by coordinates; the rule and dots follow the positioned-HTML-over-SVG pattern the
  card already uses for its gridlines, age guides and end caps.
- **NFR-002** (Principle III): Vuetify first for the readout surface, per the project's standing
  preference. Bespoke elements are limited to the rule and dots, which have no Vuetify equivalent.
- **NFR-003** (Principle II): Carrying the step index onto series points is a separate, atomic,
  behaviour-preserving change ahead of the feature work.
- **NFR-004** (Principle IV): No reads, no writes, no network. Cost impact is nil.
- **NFR-005**: Pointer tracking MUST NOT cause layout thrash while moving — the plot's geometry is
  read once per resize, not per pointer move.
- **NFR-006**: The figure stays `aria-hidden`. Every value the crosshair reveals is present in the
  build order table below, in a form that reads aloud, so nothing is exclusive to the hover. No
  focusable control may be introduced inside the hidden subtree.

### Deviations accepted during implementation

- **A-4 assumed a row-hover treatment to reuse. There wasn't one.**
  `BuildOrderSectionEditor` tracks `hoverRowIndex` but nothing in its template
  reads it — the state was there, the visual never arrived. So a treatment had to
  be introduced rather than borrowed: `.step-row--linked`, an accent left edge
  plus a faint tint. It is deliberately **not** wired to the table's own hover.
  Lighting every row a pointer crosses would drown the one signal this feature
  exists to send, and pointing at a row with a mouse is not a claim about it.
  The intent of A-4 — one visual language for "this row is the one" — survives:
  the chart's highlight and the post-scroll mark are the same treatment.

- **FR-022's viewport gate moved from the table to the page.** The contract puts
  gates in the calling component, but `BuildOrderEditor` cannot see the Timeline
  card. `BuildDetails` owns the observer and passes the result down as
  `linkEnabled`. The composable still holds no policy, which was the point.

- **The tooltip spike (T015) was not run interactively.** Its mitigation was
  applied up front instead: one tooltip instance whose coordinate target moves,
  with transitions and open/close delays disabled. Whether it is *enough* is the
  main thing manual verification must answer.

- **The readout carries its own `aria-hidden`.** Vuetify teleports overlay
  content to the body, so it escapes the figure's `aria-hidden` and would have
  become the one part of this chart exposed to assistive technology — restating
  table rows that already read aloud. Not anticipated by NFR-006, but required
  by it.

- **Rows are addressed by `data-step-index`, not by position.** A read-only view
  drops rows that say nothing, so the *n*th rendered `tr.step-row` is not the
  *n*th step. Existing code that indexes rendered rows is editor-only and was
  left alone.

### Key Entities

- **Series point** — one described moment: its time, whether that time was stated, five villager
  counts, and (new) the flat step index it came from.
- **Active moment** — what both halves agree is currently highlighted. Expressible as a time alone,
  optionally resolving to a series point and a step index. The weaker form is what lets a comment
  row light up the age track.
- **Highlight source** — which half is currently driving: the plot or the table. Holds only so the
  two cannot fight over the state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reader can name all five villager counts at a chosen moment in a single pointer
  movement, without tracing any line across the plot.
- **SC-002**: Every number the readout displays can be found verbatim in the build order table.
  Across a sample of ten builds — sparsely and densely stamped, one section and several — zero
  displayed counts are absent from the table.
- **SC-003**: The rule only ever comes to rest at a moment the build describes. There is no pointer
  position inside the drawn range that produces a rule between two described moments.
- **SC-004**: A reader who spots an inflection on the chart reaches the row that caused it in one
  click.
- **SC-005**: Hovering a build order row while the card is visible identifies that step's position
  in the game — including for rows that assign no villagers.
- **SC-006**: A reader who never hovers sees a page indistinguishable from before the feature: same
  card height, same layout, same resting appearance.
- **SC-007**: Scrolling the build order with the pointer at rest produces no visible highlighting.
- **SC-008**: The feature does nothing measurable when the Timeline card is off-screen.

## Assumptions

- **A-1**: The three stages ship in order and each stands alone. US1+US2 is a complete, shippable
  feature on its own; US3 and US4 each add value without the other.
- **A-2**: Straight segments between described moments remain a *drawing convention*, not a claim
  about the values between them. This is the premise the whole snapping design rests on, and it is
  inherited from `021` — which refused splines for the same reason. If the series is ever redrawn as
  a step line, this decision should be revisited, but not before.
- **A-3**: The uncertainty in this chart is horizontal, not vertical. A point only exists where the
  author filled cells, so its five counts are always authored; only its *time* may be derived. This
  is what makes a snapped readout safe to quote.
- **A-4**: Reusing the table's existing row-hover treatment for the highlight is correct — a second
  visual language for "this row" would be worse than a shared one, even if the two hovers arrive
  from different places.
- **A-5**: `BuildOrderSectionEditor`'s existing `hoverRowIndex` is section-local. It is widened to
  publish outward rather than replaced, and translation to flat indices happens at the boundary.
- **A-6**: Desktop only. The plot renders from `md` up and the `xs` fallback is `AgeChips`, which has
  no time axis to point at. Touch input is therefore not a concern for this feature.
- **A-7**: A sticky timeline is the thing that would make US4 pay off in full, and Focus mode
  already owns a "current step" concept. Both are deliberately left alone: this feature must not
  create a third notion of "the step in question", and merging the two is a decision that deserves
  its own spec.
- **A-8**: `resolveStepTimes` places nearly every step, and `getEcoSeries` deliberately drops some
  of them. The gap between the two is expected, not a defect, and FR-020 is the accommodation.
- **A-9**: No test suite exists; verification is manual against the golden path, per the project's
  workflow. Builds used for verification must include at least one multi-section build, one sparsely
  stamped build, and one build with no chartable economy.
