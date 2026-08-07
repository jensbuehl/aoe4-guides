# Feature Specification: Age-Up Band — Drawing the Transition as a Span

**Feature Branch**: `026-age-up-band`

**Created**: 2026-08-06

**Status**: Clarified — ready for `/speckit-plan`

**Input**: "An age-up is a span, not an instant." The timeline card currently treats it as an
instant — one crest at the arrival second — and the only place the transition's *duration* exists is
inside a tooltip. **Draw it: a band on the track running from click-up to arrival.**

## Scope & Non-Goals *(read first)*

**In scope:**

- `src/composables/builds/useAgeTimings.js` — `getAgeSegments()` learns about transitions. Today it
  walks the age boundaries and emits one segment per age plus a trailing one; `ageUp` sections
  contribute nothing.
- `src/components/builds/AgeTimeline.vue` — the track renders transition bands, and the four-step
  colour ramp grows a transitional treatment.

**Explicitly NOT in scope (leave exactly as-is):**

- **A second crest, of any kind.** This is the idea this feature replaces, and the reasoning is
  recorded below so it is not re-litigated.
- **The arrival crest** — where it sits, what it says, its time, its villager count. `025` has just
  settled what that label means; nothing here touches it.
- The economy plot's dashed age guides, and everything the crosshair does. A guide marks the arrival
  second and continues to.
- `AgeChips` and the `xs` layout. The track is `d-none d-md-block`; below that the card falls back
  to chips, which have no time axis and therefore no span to draw on.
- The list card's age rail, the home lanes, the filter bar.
- `timingsHelper.js`, `villagerAggregator.js`, `stepVisibility.js` — read-only reuse. No new
  derivation: every second this feature draws is already computed.

> No new data, no new dependency, no network. `getAgeTimings()` already returns
> `clickUp: { seconds, duration, derived, provenance }` per age. This feature draws what the card
> already knows and currently hides in a tooltip.

## The idea this replaces

A second, faded crest at the click-up moment. It fails on **geometry, not taste**, and the reasoning
is recorded because it is the obvious suggestion and will be made again:

- A Feudal click-up at 2:00 and arrival at 2:30 is 30 seconds on a scale that often runs to 16:00 —
  about 3% of the width, roughly 22px on a typical track.
- The crests are 22px and would survive that. `.age-tick` is **96px wide and centre-anchored**,
  because it carries a time and a villager count. Two of them 22px apart would sit almost entirely
  on top of each other, and their labels would be unreadable.
- Unlabelled crests are where the problem started, so that is not a way out.
- It would also double the crests from three to six on a card whose entire argument is that it can
  be taken in at a glance.

**The band works because the track is the span-shaped part of the card and the tick row is
point-shaped.** 22px is plenty of width for a band, so the geometry stops being a problem instead of
being worked around — and a band needs no label at all, which is the real win.

## Clarifications

### Session 2026-08-06

- **Q: How should a band whose click-up time the site worked out be told apart from one the author
  measured?**
  **A: Hatch the estimated ones.** Lightness says "transition"; texture says "estimated". A band with
  both ends stated is drawn solid-lighter; a band with either end derived is the same band, hatched.
  One signal per question, and both remain readable at 22px.
  Rejected: *drawing only measured bands*, which would remove the feature from roughly half the site
  with nothing to explain its absence; and *drawing all bands alike*, which would put a worked-out
  duration on screen as a drawn width — the one thing this card has never done.

- **Q: Which age's colour does the band take?**
  **A: The incoming age, lighter.** A pale Castle immediately before solid Castle, so the run-up to
  an age is marked in that age's colour and the reader's eye is carried forward to the crest.
  Noted and accepted: this colours the track with an age the player does not have yet. The counter —
  the outgoing age's colour, on the grounds that during the transition you still have Feudal units
  and Feudal economy — was considered and set aside in favour of reading forward.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See how long an age-up took without hovering (Priority: P1)

A player looks at the timeline and sees, at a glance, that this build's Imperial took a minute and
forty seconds — a band on the track, its width the duration.

**Why this priority**: This is the feature. The duration is already computed and already shown, but
only to a reader who hovers a crest, which means only to a reader who already suspected it was
there.

**Independent Test**: Open a build with age-up sections at ≥ 960 px. Each transition appears as a
band between the age segments, and the widest band is the longest age-up.

**Acceptance Scenarios**:

1. **Given** a build whose age-up sections carry usable times, **When** the card renders, **Then**
   each transition is drawn as a band on the track spanning from its click-up second to its arrival
   second.
2. **Given** two age-ups of different durations, **When** they are drawn, **Then** the longer one is
   visibly wider, in the same proportion as their durations.
3. **Given** any band, **When** it is drawn, **Then** it carries no text of its own.
4. **Given** a band, **When** it is drawn, **Then** it takes the colour of the age it leads **into**,
   set apart from that age's own segment so the two are never read as one.
5. **Given** the track, **When** bands are present, **Then** the age segments still account for every
   remaining second — the bands take their width from the ages either side rather than being added
   to a track that no longer sums to the whole.

---

### User Story 2 - Never show a worked-out width as a measurement (Priority: P1)

A reader can tell, without hovering, whether a band's length is something the author recorded or
something the site worked out.

**Why this priority**: Roughly half the builds on the site are stamped sparsely, so this is the
common case rather than an edge. A drawn width is a claim; the card has never made one it could not
support, and a band is the first thing here whose *size* asserts something.

**Independent Test**: Open a sparsely stamped build. Its bands are hatched. Open a fully stamped one.
Its bands are solid.

**Acceptance Scenarios**:

1. **Given** a transition whose click-up **and** arrival times were both stated by the author,
   **When** its band is drawn, **Then** it is solid.
2. **Given** a transition where either end was derived by the site, **When** its band is drawn,
   **Then** it is hatched, at the same width, lightness and colour as a solid one.
3. **Given** a hatched and a solid band on the same track, **When** both are drawn, **Then** the
   difference between them is legible at the width of a short age-up — this must not be a treatment
   that only reads on wide bands.
4. **Given** any band, **When** the reader hovers the crest it leads to, **Then** the existing
   tooltip continues to name both moments and the duration, with `~` on any derived time.

---

### User Story 3 - Nothing is invented where nothing is known (Priority: P1)

A build that says nothing about when its age-ups started gets no bands, not guessed ones.

**Why this priority**: The whole card rests on never showing the reader more than the build supports.
A band drawn from a click-up moment that does not exist would be pure invention, unlike a derived
time, which is at least an inference from something written.

**Independent Test**: Open a build with no age-up sections. The track renders exactly as it does
today.

**Acceptance Scenarios**:

1. **Given** an age with no age-up section, **When** the track renders, **Then** no band is drawn for
   that transition and the age segments meet directly, as they do today.
2. **Given** an age-up section whose timing could not be resolved at all, **When** the track renders,
   **Then** no band is drawn for it.
3. **Given** a build where some transitions have a click-up moment and others do not, **When** the
   track renders, **Then** bands appear only where there is one, and the track remains continuous.

---

### User Story 4 - The card does not get bigger (Priority: P2)

A reader who never cared about age-up duration sees a card the same size as before.

**Why this priority**: The Timeline card sits above the build order, where permanent height is the
most expensive thing on the page. This feature earns none of that budget — it adds information to a
bar that already exists.

**Independent Test**: Compare the card against `main`. Same height, same layout, same crest
positions.

**Acceptance Scenarios**:

1. **Given** any build, **When** the card renders, **Then** its height is unchanged.
2. **Given** any build, **When** the card renders, **Then** every crest sits exactly where it did
   before, at the arrival second.
3. **Given** a build with no age-ups at all, **When** the card renders, **Then** it is
   indistinguishable from today's.

---

### Edge Cases

- **A band narrower than its own texture.** A very fast age-up on a long scale can be one or two
  pixels wide. It must still be visible as *something*, and must never be so wide that it
  misrepresents a short transition.
- **A click-up that resolves after its own arrival**, from timestamps typed out of order. The band
  is not drawn rather than drawn backwards or at zero width.
- **A click-up that resolves before the previous age's arrival**, overlapping the segment behind it.
  The band cannot eat into an age it does not belong to.
- **Consecutive transitions with no age between them**, from a build that ages up twice in quick
  succession. Two bands must not merge into one unbroken stretch of transition.
- **A transition at the very start of the track**, where the click-up sits at or near zero.
- **A transition running past the end of the scale**, where the build's last age-up never arrives.
- **Every transition derived**, which is the common case on a sparsely stamped build: a track of four
  hatched bands must still read as a timeline rather than as a texture.
- **Theme switching** with bands on screen — the transitional treatment is declared for both themes,
  like the ramp it extends.

## Requirements *(mandatory)*

### Functional Requirements

**Drawing the band (US1)**

- **FR-001**: The track MUST render each age transition as a band spanning from its click-up second
  to its arrival second.
- **FR-002**: A band's width MUST be proportional to its duration on the same scale the rest of the
  track uses, so two bands on one track are directly comparable.
- **FR-003**: A band MUST carry no text.
- **FR-004**: A band MUST be drawn in the colour of the age it leads into, visually set apart from
  that age's own segment so the two cannot be read as one continuous age.
- **FR-005**: The transitional treatment MUST extend the existing four-step ramp rather than
  introducing a second ramp — a reader must not have to learn a new colour scale.
- **FR-006**: The transitional treatment MUST be declared for both themes, as the ramp it extends is.
- **FR-007**: The age segments MUST yield the band's width rather than the track growing to
  accommodate it. The track MUST continue to account for every second exactly once.
- **FR-008**: A band MUST be visible at the narrowest duration a real build produces, and MUST NOT be
  given a minimum width that would make a short transition look longer than it was.

**Provenance (US2)**

- **FR-009**: A band whose click-up and arrival were both stated by the author MUST be drawn solid.
- **FR-010**: A band with either end derived by the site MUST be drawn hatched, and MUST otherwise
  match a solid band exactly in width, colour and lightness — texture is the only difference.
- **FR-011**: The distinction between solid and hatched MUST be legible at the width of a short
  age-up, not only on wide bands.
- **FR-012**: The existing crest tooltip MUST continue to name the click-up moment, the arrival
  moment and the duration, each with `~` where derived.

**Absence (US3)**

- **FR-013**: No band MUST be drawn for an age with no age-up section.
- **FR-014**: No band MUST be drawn where the age-up section's timing could not be resolved.
- **FR-015**: No band MUST be drawn where the click-up second is not strictly before the arrival
  second.
- **FR-016**: A band MUST NOT extend into the age segment preceding it. Where a resolved click-up
  would place it there, no band is drawn.
- **FR-017**: Two adjacent transitions MUST remain visually separable rather than merging into one
  stretch.
- **FR-018**: Where no band is drawn, the track MUST render exactly as it does today.

**Cost (US4)**

- **FR-019**: The card's height MUST be unchanged.
- **FR-020**: Every crest MUST remain at the arrival second, with its label unchanged.

### Non-Functional / Constitution

- **NFR-001** (Principle I): No new dependency and no new derivation. Every value drawn is already
  returned by `getAgeTimings()`; this feature is a change of what is rendered, not of what is known.
- **NFR-002** (Principle III): The band is part of the existing track, styled from the existing ramp.
  No new component, no new colour scale.
- **NFR-003** (Principle II): Teaching the segment model about transitions is a behaviour-preserving
  change before anything is drawn — a build with no age-ups must produce byte-identical segments.
- **NFR-004** (Principle IV): No reads, no writes, no network. Cost impact is nil.
- **NFR-005**: The card stays `aria-hidden` where it already is. The band adds no information that is
  not already spoken by the tooltip and the build order table, so it introduces no new accessible
  content and no focusable element.

### Key Entities

- **Age segment** *(existing)* — a stretch of the track belonging to one age, with a width and a
  position in the ramp. Today the only kind of segment there is.
- **Transition band** *(new)* — a stretch belonging to no age but leading into one: a start second,
  an end second, the age it leads to, and whether either end was derived.
- **Track** — the sequence of the two, in time order, accounting for every second of the scale
  exactly once.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reader can identify a build's longest age-up without hovering anything.
- **SC-002**: A reader can tell a measured band from an estimated one without hovering, at every
  duration a real build produces.
- **SC-003**: Across a sample of ten builds — fully stamped, sparsely stamped, and with missing
  age-up sections — no band is drawn for a transition the build does not describe, and every
  transition it does describe has one.
- **SC-004**: The sum of the drawn widths equals the full track on every build; no second is drawn
  twice and none is dropped.
- **SC-005**: The card's height and crest positions are identical to before the feature, on every
  build.
- **SC-006**: A build with no age-up sections is visually indistinguishable from today's rendering.
- **SC-007**: On a build where every transition is estimated, the track still reads as a timeline —
  four hatched bands do not turn it into a texture.

## Assumptions

- **A-1**: `clickUp` is absent for good reasons and its absence is information, not a gap to fill.
  The card has always preferred showing less to showing something unsupported.
- **A-2**: The duration is worth showing because players compare it. "My Imperial took 1:40" is a
  thing said about builds; the card already computes it and currently hides it behind a hover.
- **A-3**: Hatching carries "estimated" and lightness carries "transition" — one signal per question.
  Combining them into a single treatment would make a fully-stamped short age-up and a derived long
  one hard to tell apart, which is the failure this splits to avoid.
- **A-4**: Colouring the band with the incoming age is accepted as reading *forward* to the crest,
  with the understood cost that the player does not hold that age yet. If the track is ever read as
  a literal answer to "which age am I in at time T", revisit.
- **A-5**: Desktop only. The track renders from `md` up; `AgeChips` below that has no time axis, so
  there is nothing there for a span to be drawn on.
- **A-6**: No test suite exists; verification is manual against the golden path. Builds used must
  include one fully stamped, one sparsely stamped, one with a missing age-up section, and one with no
  age-ups at all.
- **A-7**: The four-step ramp is a deliberate scale whose steps were chosen against each other and
  against both themes. The transitional treatment has to sit inside it — a fifth colour would be a
  new scale wearing the old one's clothes.
