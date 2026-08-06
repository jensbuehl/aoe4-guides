# Phase 0 Research: Crosshair Readout & Step ↔ Timeline Linking

**Feature**: `025-eco-crosshair-step-link` | **Date**: 2026-08-06

Every unknown in the plan's Technical Context is resolved below. Three findings changed the design
and are carried up into [plan.md](./plan.md): **R-3** (the mapping already exists twice), **R-4**
(the scroll dependency is already installed), and **R-6** (a timeout is the wrong way to detect
scrolling).

---

## R-1: Can a Vuetify tooltip be anchored to a moving point?

**Decision**: Yes — `v-tooltip` with `:target="[x, y]"`. Verified against the installed version.

**Rationale**: `vuetify@^3.8.0` types `target` as
`Element | "cursor" | "parent" | string | ComponentPublicInstance | [x: number, y: number]`
(`node_modules/vuetify/lib/components/VTooltip/VTooltip.d.ts:177`). A client-coordinate pair is a
first-class target, so the readout needs no custom positioning code and NFR-002 (Vuetify before
custom) is satisfied without strain.

Note that `"cursor"` is also supported and is **not** what this feature wants: the readout must
follow the *snapped moment*, not the pointer. Using `"cursor"` would reintroduce exactly the
continuous-position illusion the snapping exists to prevent.

**Alternatives considered**:

- *A bespoke absolutely-positioned div.* Rejected — Principle III, and it would re-implement
  flipping, z-index and theming that the overlay already has.
- *A charting/tooltip library.* Rejected outright — Principle I. One tooltip does not justify a
  dependency.

---

## R-2: Which side does the readout sit on?

**Decision**: Compute the side explicitly from the rule's position relative to the plot's horizontal
midpoint — readout to the right while the rule is in the left half, to the left once it crosses.
Anchor at the rule's x and the plot's vertical centre.

**Rationale**: FR-011 says the readout must not cover the dots it describes. The plot is 140 px
tall, so anything anchored above or below the point lands on the lines. Putting the readout on the
*opposite side of the rule* is the only placement that structurally cannot cover the rule or its
five dots, at any moment in any build.

Vuetify's connected location strategy does flip on overflow by itself, but it flips against the
**viewport**, not against the rule — so it would happily leave the readout sitting on top of the
dots in the middle of a wide plot. Deciding the side ourselves is both more predictable and a
smaller rule to hold in one's head when reading the code.

**Alternatives considered**:

- *Above the plot (`location="top"`).* Never covers a line, but lands on the age track above —
  trading occlusion of one chart for occlusion of another.
- *Let Vuetify flip.* Rejected as above: right answer to the wrong question.

---

## R-3: How does a section-local row index become a flat step index?

**Decision**: Extract the existing per-section offset walk into a shared helper and call it from all
three places. This is a **separate, behaviour-neutral commit** ahead of the feature work (NFR-003).

**Rationale**: This was expected to be new work. It is not — the mapping already exists, written
out twice:

- `BuildOrderEditor.vue:218-235` (`resolvedTimes`) walks the sections with a cursor, slicing the
  flattened resolver output back into per-section arrays.
- `useEcoSeries.js` consumes `flattenSections` output directly and indexes into it.

The comment already sitting at `BuildOrderEditor.vue:213-216` says the quiet part out loud:

> "The resolver works on the flattened list while sections render in slices, so each section needs
> its offset. This is the second caller to want that mapping — the economy plot was the first —
> which is what makes it worth having rather than speculative."

This feature is the third caller. Principle I permits an abstraction once duplication has appeared
at least twice; it has appeared twice already, so the helper is now overdue rather than speculative.

**Alternatives considered**:

- *Pass the offset down as a prop to each section.* Works, but leaves the duplicated walk in place
  and adds a prop that exists only to serve a sibling component.
- *Key the shared state on time instead of index, avoiding the mapping entirely.* Tempting, and it
  is what FR-020 does for the step → chart direction. But chart → step must land on **one specific
  row**, and two steps can share a second (spec Edge Cases), so time alone cannot identify a row.

---

## R-4: How is the row scrolled into view?

**Decision**: `scroll-into-view-if-needed` with `scrollMode: "if-needed"`, `block: "center"`, and
`behavior` chosen from `prefers-reduced-motion`.

**Rationale**: The package is **already a dependency** (`scroll-into-view-if-needed@^3.1.0`) and
already used for exactly this shape of problem in `IconAutoCompleteMenu.vue:73-90`. Reusing it costs
nothing and matches an established pattern (Principle III).

`block: "center"` also disposes of FR-018's sticky-chrome clause without any measurement: a row
placed at the vertical centre of the viewport is nowhere near a sticky header, whatever its height.
Computing header offsets would be more code and more fragile.

`scrollMode: "if-needed"` means a row already comfortably in view does not move — which matters,
because the reader clicked on the chart and did not ask for the page to jump.

**Alternatives considered**:

- *Native `Element.scrollIntoView`.* Available, but `block: "center"` behaves inconsistently across
  browsers with nested scroll containers, and the project already chose this package once.
- *Computing the sticky offset and using `block: "start"`.* More precise, more code, more to break
  when the header changes.

---

## R-5: How is the timeline card's visibility detected?

**Decision**: `useElementVisibility` from `@vueuse/core` (already a dependency at `^13.0.0`).

**Rationale**: A thin, disposable wrapper over `IntersectionObserver` that handles observer
lifecycle and teardown. VueUse is already used across the codebase (`useEventListener`,
`useWakeLock`). No new dependency; no hand-written observer to leak.

The gate is deliberately coarse — *any* part of the card visible counts. A reader with the card
half on screen still benefits, and a partial-visibility threshold would be a knob nobody can tune
by feel.

**Alternatives considered**:

- *A hand-rolled `IntersectionObserver`.* Rejected — Principle I favours the primitive already in
  the project over another bespoke lifecycle to get right.
- *No gate; always track.* Rejected by FR-022. The card sits above a long build order, so most row
  hovers would drive a highlight nobody can see.

---

## R-6: How is hovering distinguished from scrolling under a stationary pointer?

**Decision**: Latch on `scroll`, release on a **pointer move that actually changed coordinates**.
Row hovers are ignored while latched.

**Rationale**: Browsers fire `mouseover`/`mouseenter` when the element under a stationary cursor
changes because the page scrolled. That is FR-024's whole problem: rows light up in sequence as the
reader scrolls past, which reads as the table twitching.

The obvious fix — latch on scroll, release after an idle timeout — guesses at a duration. Too short
and rows still flicker; too long and a deliberate hover right after scrolling is swallowed. There is
no good value, only a least-bad one.

Releasing on real pointer movement uses the actual signal instead of a proxy for it. The one trap is
that some browsers synthesise a `mousemove` after a scroll, which would release the latch
immediately; comparing `clientX`/`clientY` against the last known position and requiring a genuine
change closes that. The pointer has to *move* to mean anything, which is also what a reader
understands "hover" to mean.

**Alternatives considered**:

- *Scroll latch with a ~150 ms idle timeout.* Simpler, but guesses. Kept in reserve if the
  coordinate comparison proves unreliable in a browser.
- *`pointer-events: none` on the table during scroll.* Blunt — it would also swallow clicks.

---

## R-7: SVG or positioned HTML for the rule and dots?

**Decision**: Positioned HTML, matching the gridlines, age guides and end caps already in the card.

**Rationale**: `EcoLines.vue` draws its SVG with `viewBox="0 0 1000 100"` and
`preserveAspectRatio="none"`, so user space is stretched hard in x and squashed in y. Everything
non-linear in that space needs `vector-effect="non-scaling-stroke"` to survive — which is why the
existing lines carry it. A rule and five dots drawn in SVG would need the same treatment, and the
dots would come out as ellipses without it.

The component already solved this once, and the file says so at the top: gridlines, guides and end
caps are HTML *precisely* so the SVG holds only the polylines and can stretch to any width without
distorting anything. The crosshair joins them.

**Alternatives considered**:

- *SVG `<line>` and `<circle>` with `vector-effect`.* Possible, but `vector-effect` does not apply
  to a circle's geometry — only its stroke. The dots would still need `rx`/`ry` compensation
  computed from the current aspect ratio.

---

## R-8: How is the nearest point found?

**Decision**: Linear scan over `series.points`, comparing time distance.

**Rationale**: The series is gated to a minimum of 4 points and in practice runs to a few dozen; the
coverage gate in `useEcoSeries.js` rejects anything sparser. A scan is a handful of comparisons per
pointer move, well inside a frame. The array is sorted by time, so a binary search is available if
it ever matters — YAGNI says not today (Principle I).

The plot's geometry is read from a single `getBoundingClientRect` cached per resize rather than per
pointer move, per NFR-005 — the scan is not the cost worth worrying about, layout reads are.

---

## R-9: Where does the shared state live, and how is it shaped?

**Decision**: A factory composable, `useStepHighlight()`, instantiated **once** in
`BuildDetails.vue` and passed to both halves through `provide`/`inject` under an exported `Symbol`.

**Rationale**: `AgeTimeline` and `BuildOrderEditor` are siblings (`BuildDetails.vue:239-243`).
Prop-drilling would thread a prop through `BuildOrderEditor` → `BuildOrderSectionEditor` → row that
neither component has any reason to know about, and would need a matching chain of emits back.

Module-level state inside the composable would be simpler still and is **wrong**: `BuildPreviewCard`
and Focus mode can put a second build on screen, and both would share one highlight (FR-028). A
factory called per page cannot make that mistake.

The `Symbol` key is exported from the composable rather than being a bare string, so an injection
cannot silently collide with anything else the app provides.

**Alternatives considered**:

- *Pinia or a global store.* Rejected — Principle I. This is view state with a lifetime of one page
  view, not application state.
- *Reuse Focus mode's `currentStepIndex`.* Rejected by spec A-7. That is a *playback position*; this
  is a *hover*. Merging them would make hovering a row move the player.

---

## R-10: Does the existing resource pin move into the shared state?

**Decision**: No. `hovered` and `pinned` stay local to `EcoLines.vue`.

**Rationale**: Nothing outside the plot reads which resource is emphasised — the build order table
has no per-resource highlight to mirror. Lifting it would widen the shared contract for no consumer,
against Principle I. FR-012 only requires that the crosshair and the emphasis *coexist*, which they
do without sharing a home.
