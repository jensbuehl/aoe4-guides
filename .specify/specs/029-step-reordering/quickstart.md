# Quickstart — the manual test script

There is no automated suite (constitution: *"No formal test suite is required, but manual testing
of the golden path MUST be done before merging"*). This is that golden path, gated per phase:
**do not open the next phase's gate until its section passes.**

> **Verified so far** (2026-08-10, by hand, on the shipped 1.17.0):
>
> - **Item 7 / 17 — typed text travels with its own row.** The one failure that
>   would corrupt content rather than look wrong, and the reason FR-015 exists.
>   Confirmed on a real move. The harness could never reach it: it stubs
>   `syncEdits` out, so the DOM read on desktop and the `stepsCopy` read on
>   mobile were asserted only from reading the code.
> - **Cross-section moves** (US4). The coordinator drives both ends correctly in
>   the real editor, which is what the whole `useStepReorder` construction exists
>   for and the part that carried all the risk.
> - **Into and out of an alternative** (US3), both directions. The positional
>   model held in practice, as [R-10](./research.md#r-10--the-alternatives-phase-needed-no-code-recorded-during-implementation)
>   predicted from the code.
> - **Item 25 — the path nobody was editing keeps every step**, across a sequence
>   of moves. The only case in this feature where damage would have been
>   invisible at the moment it happened: a block holds one path inline and parks
>   the rest on the marker, so every move rewrites both and you can only see one.
>   It needed a tab switch to confirm, and it holds.
> - The **layout** items, incidentally, by the round of fixes that followed the
>   release — the desktop actions cell, the mobile control sizes, the tooltips,
>   the list's two end gaps and the age rail.
>
> **Left open**, both cosmetic and neither able to lose an author's work: the
> **reduced-motion** pass and the **light-theme** pass.
>
> **Item 45 (overlay export) is settled, and the answer has a wrinkle** — checked
> by running the exporter directly rather than by eye:
>
> - Nothing in the exporter's dependency closure — `useExportOverlayFormat`,
>   `villagerAggregator`, `useAgeTimings`, `stepVisibility` — was touched by 029
>   or by anything else since the pre-feature `main`. For an unchanged document
>   the output is byte-identical **by construction**, not by sampling.
> - A build containing an alternatives block exports cleanly: flattened to the
>   first path, with the path's condition note carried as a step.
> - **But a build re-saved since the section-note migration exports differently,
>   and better.** A note held on `section.gameplan` was silently dropped by the
>   exporter; the same note, migrated into `section.steps`, exports as a step
>   carrying its text — which is 027 FR-021 finally being true for section notes.
>   So "byte-identical" holds for a build nobody has re-opened, and a re-saved
>   build legitimately gains a step. Worth knowing before diffing an export and
>   reading the extra entry as a regression.

Run `npm run dev`. Three builds are needed:

- **B-plain** — any existing published build with age-ups and an economy chart. The regression
  witness: it must not change, ever, in any phase.
- **B-alt** — a build with one alternatives block in Feudal, two paths with different step
  counts, and at least one common step between the block and the age-up.
- **B-long** — a build long enough that its last section is off screen when the first is in view.
  Only needed at Phase 4.

Before starting, note two things about the tooling, because both fail silently:

- `npm run build` compiles templates and **cannot** catch a `ReferenceError` in `setup()`. Run
  `npm run check:setup` after touching any `.vue` file.
- `npm run check:steps` must pass after touching anything that reads a build. It exists because
  seven walks that read an alternatives block as a step shipped before it did.

Neither script sees rendering, layout or interaction. Those are this document's job.

---

## Phase 0 gate — identity fix *(no behaviour change)*

Prerequisite for everything after Phase 2. The whole gate is "nothing moved".

1. **B-plain and B-alt, editor** — every row renders, every description is the right one, typing
   in a cell updates that cell and no other. This is the `_id` change
   (research [R-6](./research.md#r-6--_id-collides-across-sections-today-by-construction)) and its
   failure mode is a row showing another row's content.
2. **B-alt** — switch path tabs back and forth five times. Steps do not duplicate or vanish.
3. `npm run check:setup` and `npm run check:steps` both pass.

---

## Phase 1 gate — desktop drag within one section *(US1)*

4. **B-plain** — point at a step row. A handle appears in the actions cell. The row does not
   grow and no column shifts.
5. Drag a step from position 5 to position 2. It lands where the line was marked, with its
   time, villagers, every resource and its description **unchanged**.
6. Select text inside a description by dragging across it. The row does **not** start moving.
   This is the whole reason for the handle (FR-004).
7. Type into a description, then — without clicking away — drag that same row two positions.
   The typed text arrives with the row it was typed into (FR-015). *If this fails, the sync in
   `begin()` is missing or running after the splice.*
8. Start a drag and press `Escape`. Nothing moves. The unsaved-changes indicator does **not**
   appear.
9. Start a drag and release over the page header. Nothing moves, no dirty mark.
10. Drag a row and drop it exactly where it started. **No dirty mark** (FR-017).
11. Drag a **note**. It behaves exactly as a step does (FR-002).
12. Save, reload. The order persisted.

---

## Phase 2 gate — mobile move controls *(US2)*

At 390px, in the device toolbar.

13. Every step card and note card shows up and down controls, always visible, in the action row
    the card already had. The card does not get taller.
14. Press **move up** on the third card. It swaps with the second, and the card **stays on
    screen** (FR/US2 §5).
15. Press **move down** once. It returns exactly where it was. The reverse press is the undo.
16. The very first entry of the build has **move up** disabled — greyed, present, not missing.
    Same for **move down** on the very last (FR-008). Card widths are identical either way.
17. Type into a card's description, then press a move control without dismissing focus. The
    text travels with its card.
18. Save, reload. The order persisted.

---

## Phase 3 gate — into and out of an alternative *(US3)*

All on **B-alt**. This is the gate that earns the feature.

19. Move the common step directly below the merge line **up** one press. It joins the path
    currently shown and is drawn inside that path's lane.
20. Move it **down** one press. It leaves the lane and is common again.
21. Repeat 19, then switch to the **other** path's tab. The step is **not** there — it belongs
    to the path it was put in, and switching tabs shows a different path rather than carrying
    steps between them (US3 §7).
22. Switch back. The step is still there, in the lane.
23. On desktop, drag a step slowly across the merge line. The position **above** the line and
    the position **below** it are visibly different drop targets (US3 §3). If they read as one
    line, the drop indicator is being drawn on the wrong element.
24. Move a path's **last** step out. The path is left empty, the block still renders, and the
    build **saves and reloads intact** (US3 §5).
25. Confirm the *other* path still holds every step it had, at every point in 19–24 (US3 §4).
26. Try to drag the block's own marker rows. There is no handle on them (FR-003).
27. Save, reload. Everything above survived the round trip.

---

## Phase 4 gate — across sections *(US4)*

28. **B-plain** — move the last step of Dark Age **down** one press. It becomes the first entry
    of the next section.
29. Move it back **up** one press. It returns to Dark Age, last position.
30. Its stated time is **unchanged** by both moves, even though it sat under a different age
    in between (US4 §4, SC-006). Nothing was re-estimated.
31. Move a step into an **age-up** section, and back out.
32. Empty a section entirely by moving its only step away. The section still exists, showing
    its empty state and its insert line. It is **not** removed (FR-020).
33. **B-long** — start a drag in the first section and move toward the bottom of the window.
    The list scrolls and the last section becomes reachable without releasing.
34. **B-alt** — move a step from another section down to the position just below a merge line,
    then one more press to enter the path. Entering took its **own** press; the step never
    crossed a section boundary and joined a path in one move (FR-014).
35. After every cross-section move: no duplicated row, no row left behind, no stale row in
    either section (US4 §6).
36. Save, reload. The step is under the age it was left in.

---

## Phase 5 gate — keyboard *(US5)*

37. With the mouse untouched, `Tab` to a step's drag handle. It takes focus visibly and
    announces what it will move.
38. `ArrowDown`. The step moves one position. **Focus is still on that step's handle**, so a
    second `ArrowDown` moves it again (US5 §2).
39. Arrow a step across a section boundary and into an alternative path, one press each.
40. On mobile at 390px, `Tab` reaches both move controls and both operate.

### Shortcuts *(FR-021 … FR-023)*

Run these with the caret **inside a description**, not on the grip — working while
typing is the whole point of them.

40a. `Alt` + `↑` and `Alt` + `↓` move the row. The caret stays in the text.
40b. **Hold** `Alt` + `↓`. The row walks down several positions rather than moving once.
40c. `Alt` + `Enter` adds a step below; **hold** it and exactly one step is added, not forty.
40d. `Alt` + `N` adds a note below. **On macOS especially** — Option+N is a dead key there,
     so confirm a note appears and **no `˜` is typed into the description**.
40e. `Alt` + `Backspace` opens the remove confirmation. `Alt` + `Delete` does the same.
40f. On a **note** row, `Alt` + `Enter` adds a step. (It did nothing before this feature —
     notes could be deleted by keyboard but not followed.)
40g. With the grip focused, a **bare** `↑` moves the row and `Alt` + `↑` moves it exactly
     once — not twice. *(If it moves two positions, the grip's `.exact` modifier is gone and
     both handlers are firing.)*
40h. Hover the grip: the tooltip names the shortcut. Start a drag: the tooltip does **not**
     appear and hang under the cursor for the whole gesture.
40i. Hover the ✕: the tooltip names `Alt + Backspace`.
40j. Open any insert line's menu: **Step** shows `Alt ↵` and **Note** shows `Alt N`,
     right-aligned and muted. **Alternatives** and **Advance** show no hint at all.

---

## Regression gate — nothing else moved

Run every item against **B-plain** and **B-alt**, comparing against `main`.

41. **Reading view** — no handles, no move controls, nothing new anywhere. A reader sees the
    build exactly as before (FR-019).
42. **Economy chart** — renders, and after a reorder its points follow the new order with the
    same values.
43. **Age timeline** — hovering a row still highlights its moment; clicking the chart still
    scrolls to the right row. This is the index-derived reading most likely to break (FR-016).
44. **Focus mode** — plays start to finish, including through B-alt's block.
45. **Overlay export** — download and diff against one taken from `main` for a build nobody
    reordered. **Byte-identical** (FR-018).
46. **Reduced motion** — enable it at the OS level. The lift and the scroll are instant, not
    animated.
47. A build that nobody reorders is unchanged in storage. No migration ran (SC-007).

---

## Testing the logic without a browser

The move arithmetic — position ordering, the index adjustment on a downward move, marker
pass-through — is worth driving directly rather than by hand at 390px.

Logic in a `.vue` file can be tested without one: import `@vue/reactivity` and drive the real
refs and computeds. The harness must sit **inside the project** — Node resolves packages from
the importing file, so one written to a scratchpad cannot find `@vue/reactivity`. Write it to
the repo root, run it, delete it. Anything importing `@/…` needs the alias loader documented
in `CLAUDE.md`.

`useStepReorder()` is a plain composable, so it needs neither: import it, register two fake
sections whose handlers splice plain arrays, and assert the ordering across a boundary.
