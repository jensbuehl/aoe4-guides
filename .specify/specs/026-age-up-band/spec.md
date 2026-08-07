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
  **A: It should not.** *(Revised 2026-08-07 during implementation — see below.)*

  The original answer was *hatch the estimated ones*: lightness says "transition", texture says
  "estimated", one signal per question. That was implemented and then withdrawn.

  **Every band is drawn the same striped way.** Two reasons, and the second is the one that
  settles it:

  1. **Stripes are what an age-up in progress looks like in the game.** The card borrows a reading
     the player already has rather than teaching a new one, and stripes say "still happening" where
     a flat fill just looks like a paler age. That makes striping the right treatment for *all*
     bands, which leaves nothing for provenance to use.
  2. **The provenance signal is already there, and already visible without hovering.** The crest a
     band leads to prints `~` on its face, and its tooltip names click-up, arrival and duration each
     with `~` plus a footnote saying which kind of estimate it was. A texture on the track would say
     the same thing a second time, in a language the reader would have to be taught, on the one part
     of the card with no room to explain itself.

  **Accepted cost**: a reader comparing two band *widths* is not told which is measured — the `~`
  describes the times, not the width. It sits on the crest immediately beside the band, so the
  answer is one glance away rather than hidden, and that was judged a fair price for one treatment
  instead of two.

  Still rejected: *drawing only measured bands*, which would remove the feature from roughly half
  the site with nothing to explain its absence.

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

### User Story 2 - ~~Never show a worked-out width as a measurement~~ *(WITHDRAWN 2026-08-07)*

**This story was implemented and then removed during implementation.** It required a solid band for
a transition with both ends stated and a hatched one where either end was derived. It is withdrawn
because every band is now striped — see the revised clarification above.

The reasoning is kept rather than deleted, because "tell the estimated ones apart" is the obvious
suggestion and will be made again:

- Striping is the correct treatment for *every* band, since it is how an age-up in progress reads in
  the game. That leaves no spare visual channel for provenance without inventing a second one.
- Provenance is already on screen without hovering: the crest each band leads to prints `~`, and its
  tooltip names both moments and the duration, each with `~`, plus a footnote naming the tier.
- The residual gap — a band's *width* is not marked as derived — is accepted. See the clarification.

What survives from this story is **FR-009** and the tooltip guarantee **FR-012**, both below.

**Independent Test**: Open a sparsely stamped build and a fully stamped one. Their bands are drawn
identically; only the `~` on the crests differs.

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
- **A track of several striped bands** must still read as a timeline rather than as a texture. This
  now applies to every build with age-ups, not only sparsely stamped ones, since all bands are
  striped.
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

**Provenance (US2, withdrawn)**

- **FR-009** *(revised)*: Every band MUST be drawn identically, whether its ends were stated by the
  author or derived by the site. The track MUST NOT carry a provenance signal of its own.
- **FR-010** *(removed)*: ~~A band with either end derived MUST be drawn hatched…~~ Withdrawn with
  US2. All bands are striped.
- **FR-011** *(revised)*: The stripe MUST be legible at the width of a short age-up, not only on
  wide bands — the treatment must not be one that only reads on wide bands.
- **FR-012**: The existing crest tooltip MUST continue to name the click-up moment, the arrival
  moment and the duration, each with `~` where derived. **This is now the only provenance signal for
  a transition**, alongside the `~` on the crest's visible time label, so it is load-bearing rather
  than merely preserved.

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
  an end second, and the age it leads to. Deliberately *not* whether either end was derived — see
  the revised clarification.
- **Track** — the sequence of the two, in time order, accounting for every second of the scale
  exactly once.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reader can identify a build's longest age-up without hovering anything.
- **SC-002** *(revised)*: The stripe reads as a stripe at every duration a real build produces —
  the narrowest band on the site is not one ambiguous diagonal. *(Was: "a reader can tell a measured
  band from an estimated one without hovering", withdrawn with US2.)*
- **SC-003**: Across a sample of ten builds — fully stamped, sparsely stamped, and with missing
  age-up sections — no band is drawn for a transition the build does not describe, and every
  transition it does describe has one.
- **SC-004**: The sum of the drawn widths equals the full track on every build; no second is drawn
  twice and none is dropped.
- **SC-005**: The card's height and crest positions are identical to before the feature, on every
  build.
- **SC-006**: A build with no age-up sections is visually indistinguishable from today's rendering.
- **SC-007**: On a build with age-ups on every age, the track still reads as a timeline — several
  striped bands do not turn it into a texture.

## Assumptions

- **A-1**: `clickUp` is absent for good reasons and its absence is information, not a gap to fill.
  The card has always preferred showing less to showing something unsupported.
- **A-2**: The duration is worth showing because players compare it. "My Imperial took 1:40" is a
  thing said about builds; the card already computes it and currently hides it behind a hover.
- **A-3** *(revised 2026-08-07)*: The stripe carries "transition, in progress" — the reading the
  game already gives it — and nothing else. Provenance is not a question the track answers; the
  crest beside it does, with `~` on its face and in its tooltip. One signal per surface, rather than
  one signal per question.
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
