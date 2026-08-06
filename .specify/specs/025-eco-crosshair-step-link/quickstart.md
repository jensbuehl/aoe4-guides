# Quickstart: Crosshair Readout & Step ↔ Timeline Linking

**Feature**: `025-eco-crosshair-step-link` | **Date**: 2026-08-06

## Run it

```bash
npm install       # only if node_modules is stale — no new dependency in this feature
npm run dev
```

Open any build detail page at **≥ 960 px** and expand **Economy**. Below `md` the card falls back to
`AgeChips` and none of this feature exists (spec A-6).

## Builds to test against

There is no automated suite (constitution: manual golden-path verification). The behaviour changes
by build shape, so verification needs four kinds. Pick real ones from the site and note their IDs in
the PR:

| # | Shape | What it exercises |
|---|---|---|
| **B1** | Densely stamped, one section | The happy path. Points close together; snapping should feel continuous but never land between moments |
| **B2** | Sparsely stamped (mostly dashed lines) | Long gaps between points — the clearest demonstration that the rule jumps rather than slides |
| **B3** | **Multi-section** (several age-ups) | FR-029. The wrong index space shows up here and nowhere else |
| **B4** | No chartable economy (`getEcoSeries` returns `null`) | FR-026 — step → chart must still work against the age track alone |

B3 is the one that catches the expensive bug. A single-section build cannot distinguish a flat index
from a section-local one, so **every index-related check must be done on B3**.

## Verification script

Ordered by the phases in [plan.md](./plan.md); each block is checkable as soon as its phase lands.

### Phase 1 — snapped crosshair (SC-001, SC-002, SC-003)

1. **B1** — sweep the pointer slowly across the plot. A rule, five dots and a readout appear. The
   rule **jumps** between moments; it never comes to rest between two of them.
2. **B2** — pick any position midway between two distant points. Read the counts, then find that
   moment in the table below. Every number matches a row **verbatim**. Nothing is averaged.
3. **B2** — hover a moment whose time the site derived. The readout's time carries `~`. Hover one
   the author stated: no `~`.
4. **B1** — move the pointer past the last drawn point. The crosshair **disappears** rather than
   sticking to the final moment.
5. Move the pointer out of the plot entirely. Rule, dots and readout all go together.
6. Sweep from the left edge to the right edge and watch the readout: it sits to the **right** of the
   rule in the left half and flips to the **left** past the midpoint. It never covers the dots.
7. Pin a resource from the legend, then use the crosshair. Both are visible at once — the other four
   lines stay dimmed and the readout's row for the pinned resource is emphasised.
8. Hover a line while the crosshair is active. The line emphasis still works.

### Phase 2 — chart → step (SC-004)

9. **B3** — hover a moment. The highlighted row is in the **correct section**. Check one in the
   first section and one in the last; an off-by-a-section error is only visible in the later ones.
10. **B3** — click inside the plot. The page scrolls that row into view, centred, clear of any
    sticky chrome. The row stays marked long enough to find.
11. Click a line directly. The row is navigated to; **no resource is pinned or unpinned** (FR-016).
12. Scroll so the target row is already comfortably visible, then click. The page does **not** jump.
13. Enable OS "reduce motion" and repeat (10). The page jumps instead of animating.

### Phase 3 — step → chart (SC-005, SC-007, SC-008)

14. **B1** — with the card visible, hover a row that assigns villagers. The rule appears at that
    step's moment on both the age track and the plot.
15. **B1** — hover a row that assigns **nobody** (a comment, an age-up). The rule still appears on
    the age track. No dots, no counts.
16. **B4** — hover rows. The rule appears on the age track. Nothing errors on the absent plot.
17. Collapse **Economy**, then hover rows. The plot **must not** expand itself. The age track still
    shows the rule.
18. Scroll the page until the Timeline card is fully off-screen. Hover rows: nothing highlights.
19. **Put the pointer over a row and scroll with the wheel without moving the mouse.** Rows must not
    light up in sequence as they pass under the pointer. This is the one most likely to regress.
20. Move the pointer deliberately across several rows in one sweep. Only the row you settle on
    lights up — not each one in passing.
21. Hover a row whose time cannot be resolved. Nothing happens; nothing errors.

### Regression — costs nothing unused (SC-006)

22. Load a build and read it without hovering anything. Compare against `main`: identical card
    height, layout and resting appearance.
23. Open a page rendering more than one build (home lanes, preview cards). Highlights must not be
    shared between them (FR-028).

## Where things live

```text
src/
├── components/builds/
│   ├── EcoLines.vue                # rule, dots, readout, plot pointer tracking
│   ├── AgeTimeline.vue             # renders the rule on the age track too
│   ├── BuildOrderEditor.vue        # section offsets, scroll handler
│   └── BuildOrderSectionEditor.vue # row hover out, row highlight in
├── composables/builds/
│   ├── useStepHighlight.js         # NEW — the shared channel
│   ├── useEcoSeries.js             # + stepIndex on each point
│   └── useAgeTimings.js            # + shared section-offset helper
└── views/builds/
    └── BuildDetails.vue            # creates and provides the highlight
```

## Gotchas found in Phase 0

- **`points[i].stepIndex !== i`.** Points are sorted by time *after* indices are attached, so a
  build with out-of-order timestamps has non-monotonic indices. Never use array position as a step
  index.
- **`resolvedTimes` returns `[]` when `readonly` is false.** Harmless here — the Timeline card is
  view-route only — but do not reach for it from the editor and expect data.
- **Some browsers synthesise a `mousemove` after a scroll.** The scroll latch must compare
  coordinates and require a genuine change, or item 19 above will regress (research R-6).
