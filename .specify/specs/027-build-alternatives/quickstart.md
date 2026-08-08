# Quickstart — the manual test script

There is no automated suite (constitution: *"No formal test suite is required, but manual testing of
the golden path MUST be done before merging"*). This is that golden path, gated per phase: **do not
open the next phase's gate until its section passes.**

Run `npm run dev`. Two builds are needed:

- **B-plain** — any existing published build with age-ups and an economy chart. The regression
  witness: it must not change, ever, in any phase.
- **B-alt** — a build you author in Phase 2 containing one alternatives block in Feudal, two paths,
  and at least one common step between the block and the age-up.

A third is worth finding for item 20:

- **B-rewind** — an existing build that describes variations by writing them out one after another,
  and therefore shows **no economy chart** today (research
  [R-3](./research.md#r-3--the-economy-chart-already-refuses-builds-that-contain-alternatives)).

---

## Phase 0 gate — one flattener *(refactor, no behaviour change)*

The whole gate is "nothing moved".

1. **B-plain, build page** — steps table, age timeline, economy chart, villager markers all identical
   to `main`. Compare screenshots, not impressions.
2. **B-plain, focus mode** — plays through start to finish. Auto-advance on, voice-over on, age-up
   cards appear where they did.
3. **B-plain, overlay export** — download and diff the JSON against one taken from `main`. **Byte
   identical.** This is the item most likely to catch a mistake in the refactor.
4. **A legacy build** (no sections — find one via an old author page) — renders, exports, plays.
5. Console clean throughout.

*Gate: items 1–5 pass. Contract G-3 is what they are testing.*

---

## Phase 1 gate — the add menu *(ships alone, touches no data)*

6. Editor, desktop: the bottom-anchored add buttons are gone; the inline insert lines between rows
   open a menu offering Step / Note / Age up / Alternatives.
7. Choosing **Step** from an inline menu inserts at that position — the same row that `+ Step` used to
   insert, in the same place.
8. Inside an age section, **Age up** is offered; entries invalid here are **disabled with the reason
   in a tooltip**, never hidden.
9. Mobile (390px): the `step-insert-xs` dividers open the same menu, tap targets still ≥44px.
10. B-plain is unchanged as a document — open it, save it without editing, diff the stored `steps`.

**Notes (FR-019…FR-021):**

10a. **A section with no note shows no note row** in the editor. This is the row that used to appear
   automatically at the bottom of every section — its absence is the check.
10b. Choose **Note** from an inline menu → a note appears **at that position**, mid-section, with the
   same rich field and icon picker a description has. Save, reload, still there and still in place.
10c. A note with **no time and no resource cells** does not turn autoplay off: open focus mode on that
   build and confirm auto-advance still works (invariant N-3 — the expensive one to find late).
10d. In focus mode the note card shows the **preceding step's** resource dock, not an empty one.
10e. The note is **not** dropped as an empty row: it survives into focus mode and is not filtered.
10f. Overlay export of a build with a note → the note's text is present, not an empty step (FR-021).
10g. **An existing build with a section note** — the note still renders in the reading view, still
   edits in place, and was not moved or migrated (FR-020).

*Gate: items 6–10g. FR-007, FR-019…FR-021.*

---

## Phase 2 gate — authoring and reading *(US1, US2)*

**Authoring:**

11. Insert **Alternatives**: one action produces the opening marker, one path with one empty step, and
    the closing merge marker. There is no "Close" entry anywhere (FR-008).
12. Give path 1 a title and a description with an icon via `::` autocomplete — the same field as a step
    note (FR-010). Add a step. Use **+ Add alternative**, author path 2 the same way.
13. With the caret inside a path, the menu shows **Age up** and **Alternatives** disabled, each with
    its reason (FR-007, A-4).
14. Insert a step **above** the merge line → it joins the active path. **Below** → it is common (FR-006).
15. Save, reload. Block, both paths, titles, descriptions and steps all intact (SC-001).
16. Delete either marker → the bracket goes, **every path's steps remain** in the section (FR-011).
    Undo by reloading without saving.

**Reading (desktop, then mobile at 390px):**

17. No path flagged main → a **pick-one** row at the split, **titles only**, one table row high on
    desktop, nothing hidden behind a disclosure (FR-012). Options are auto-width, not stretched.
18. Choose a path → its steps render in a lane with the secondary rail; the lane ends where the block
    ends; the steps after it show regardless of choice (SC-002).
19. Flag one path `main` → it reads on the main line exactly as a build without alternatives, and the
    other collapses to one slim condition row that expands in place (FR-005). Expansion state survives
    a reload of that build.
20. Mobile: options stacked full-width, ≥44px, description on a second line; the active path's cards
    sit in a rail **continuous** with the pick card's and **nested inside** the gold age rail (FR-013).
21. A path with a very long description does **not** truncate into the pick row — the row shows titles.
22. **B-plain unchanged** on both breakpoints, light and dark (FR-017, SC-005).

*Gate: items 11–22. SC-001, SC-002, SC-005.*

---

## Phase 3 gate — the economy graph *(US3)*

23. B-alt's chart draws **one path at a time** — never both overlaid (FR-014, SC-003).
24. The path selector sits in the legend region as its own control, **not** as a sixth resource entry;
    hovering and clicking the five resource entries still dim and pin as before
    ([R-7](./research.md#r-7--the-economy-legend-already-spends-both-of-its-gestures)).
25. Switch path in the steps table → the chart follows. Switch in the legend → the table follows. Both
    directions (SC-003).
26. The split's time span is shaded and bounded by vertical markers; resource colours and icons are
    unchanged.
27. A block with a `main` path → the chart opens on it; without one → on the first path.
28. **Hover a table row, then switch path** → the highlight clears rather than pointing at a different
    step ([R-6](./research.md#r-6--stepindex-crosses-components-and-is-about-to-become-ambiguous), S-2).
    Then hover again: crosshair and row still agree.
29. **B-rewind, converted** to use a block → it now has an economy chart where it had none (SC-007,
    [R-3](./research.md#r-3--the-economy-chart-already-refuses-builds-that-contain-alternatives)).
30. **B-rewind, unconverted** → still correctly has no chart. The `rewinds()` guard is intact.

*Gate: items 23–30. SC-003, SC-007.*

---

## Phase 4 gate — focus mode *(US4)*

The timer is the thing under test. Watch the clock, not the cards.

31. Run B-alt. At the split the pick appears **in the step-content area only** — header, progress
    bars, resource dock and transport controls do not move a pixel (FR-015, SC-004). Compare against a
    screenshot of the preceding step.
32. **Do nothing.** The countdown runs, falls back to `main` (or first), and auto-advance continues.
    **The clock never stalls** — check total elapsed against a wall clock across the split (SC-004).
33. Pick a path → a thin bar names it and offers an explicit **switch**.
34. **Switch mid-detour** → the queue re-reads from the new path's next step and the elapsed time is
    still right. This is the [R-5](./research.md#r-5--focus-modes-queue-is-a-mount-time-snapshot-and-fr-015-breaks-that-assumption)
    rebuild-and-re-seek; if anything is off by one step, it is here.
35. Switch, then let it run to the rejoin → common steps play once, with their authored times (FR-006).
36. Voice-over on: the pick does not get read as a step, and the path's first step is announced.
37. The pick control is **secondary-coloured, not gold** — it cannot be mistaken for a transport
    button (FR-016).
38. Micro tier (shrink the PiP window): the pick collapses to two short titles side by side; the
    countdown bar stays.
39. **B-plain in focus mode** — unchanged, autoplay still supported, no pick ever appears.

*Gate: items 31–39. SC-004.*

---

## Cross-cutting, run once at the end

40. Every alternatives affordance is **secondary**, never gold; the branch mark is `mdi-call-split`
    and the close `mdi-call-merge`, never a rotated split (FR-016, SC-006).
41. Light and dark themes, both breakpoints, for every new control.
42. Overlay export of B-alt: valid JSON, the **active path flattened** onto the main line, no marker
    row, no empty step (FR-018).
43. Keyboard: the add menu, the pick control and the path tabs are reachable and operable without a
    pointer.
44. No new console warnings anywhere in the run.
