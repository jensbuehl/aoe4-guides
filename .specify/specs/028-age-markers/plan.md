# Implementation Plan: Age Markers

**Branch**: `028-age-markers` | **Date**: 2026-08-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.specify/specs/028-age-markers/spec.md`

## Summary

Stop drawing the two age markers alike. The advance becomes a plain row inside the step table, the
arrival becomes the only boxed element in the list and finally carries its time, and a single rail
runs down the transition's rows — gold, or the alternatives colour where a block is open inside it.

The research changed the shape of the work. Three things that read as new in the spec are already
built:

- **The transition already has a container.** An `ageUp` section *is* the bracket — banner, steps,
  arrival plate, in that order. Nothing new computes where a transition starts or ends.
- **The rail technique is shipped.** `027`'s alternatives rail is a per-row pseudo-element with a
  deliberate 2px overhang that exists precisely to kill seams. That is FR-018's mechanism, in
  production, tuned.
- **`age-lane-md` is already applied to every row that needs the gold rail — and has no CSS at all.**
  The hook was placed and never painted.

So the feature is: one new row, one new prop, one stylesheet block, one `role="group"`. The expensive
part is not the code, it is the light theme, which nothing in this repo can verify.

## Technical Context

**Language/Version**: JavaScript (ES2022), Vue 3 Options API with `setup()`

**Primary Dependencies**: Vue 3, Vuetify 3 (`v-table`, `v-card`, `v-icon`, `v-btn`), `@mdi/font`.
No new dependency.

**Storage**: None. The build document is unchanged — no field, no item kind, no migration, and no
Firestore read or write is added.

**Testing**: `npm run check:setup`, `npm run check:steps`, `npm run build`, then manual verification
in a browser in both themes. There is no automated test suite (constitution, Development Workflow).

**Target Platform**: Desktop web (`hidden-xs` half of the build list). Mobile explicitly excluded.

**Project Type**: Single-page frontend.

**Performance Goals**: No regression. The rail adds no measurement, no observer and no layout pass —
it is a static pseudo-element in the table's existing margin (SC-009).

**Constraints**: Zero column shift at any desktop width (SC-002); zero step-index drift (SC-010);
mobile byte-identical (SC-008); no new colours or assets (FR-024).

**Scale/Scope**: Two files. One component's desktop template and stylesheet, plus one prop passed
from its parent.

## Constitution Check

*GATE: passed before Phase 0, re-checked after Phase 1 — see the bottom of this section.*

| Principle | Assessment |
|---|---|
| **I · Simplicity First** | Passes, and the research improved it. No new composable, no new component, no abstraction. The rail reuses a shipped technique rather than introducing a second one; the arrival time is an index lookup on a value the parent already holds. YAGNI applied to the context stack: depth is capped at two by construction, so no general stack is built. |
| **II · Incremental Quality** | Passes. Net deletion in the template (a banner block goes, a row arrives). Two pre-existing traps are recorded rather than silently worked around: `isBareAgeUp`'s deliberate behaviour, and the note-only-section bug — the latter flagged, scoped out, not chased. The dead `age-lane-md` class stops being dead. |
| **III · Consistent UX & Component Reuse** | Passes, and drives three decisions. The advance row copies the merge row's structure; the rail copies `.alt-inside`'s; the arrival time copies `resolvedTime()`'s `~` convention. Where the mock disagrees with the real components — the 8px rail radius, the time in the advance's column — the real components win. |
| **IV · Cost-Conscious Infrastructure** | Not engaged. No backend, no query, no function, no read. |
| **V · Secure Defaults** | Not engaged. No auth, no rules, no user data, no new input path. `aria-label` is built from an internal age-name map, not from author content. |

**Violations requiring justification**: none. Complexity Tracking is therefore omitted.

**Post-Phase-1 re-check**: unchanged. The design added one prop, one class and one ARIA attribute;
nothing in it moved the feature toward a new abstraction, a new dependency or a new cost.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/028-age-markers/
├── README.md              # orientation
├── spec.md                # the specification, clarified
├── design-input.md        # decisions and rejected variants
├── design-handoff/        # the design as delivered (HTML canvases, tokens, assets)
├── plan.md                # this file
├── research.md            # Phase 0 — twelve findings against shipped code
├── data-model.md          # Phase 1 — render model (no stored data changes)
├── contracts/
│   └── render-contract.md # Phase 1 — what the rendered list guarantees
├── quickstart.md          # Phase 1 — where the work is, and how to verify it
└── checklists/
    └── requirements.md    # spec quality gate
```

### Source code

```text
src/
├── components/builds/
│   ├── BuildOrderSectionEditor.vue   # ~all of the work; desktop half only (from :528)
│   └── BuildOrderEditor.vue          # one new prop passed down
└── composables/builds/
    └── useAgeTimings.js              # read-only: formatAgeTime, and the offsets convention
```

**Structure Decision**: No new files. The feature is a change to the desktop rendering of one
component, and the constitution's "Vuetify before custom, extract only after duplication appears
twice" argues against splitting a row type out into a component that would have exactly one caller.

## Phase 2 approach — the order to build in

The design's suggested order survives contact with the code, with one correction: step 2 is far
smaller than expected and step 3 is mostly precedence.

**1 · The two markers (US1).** Advance banner → table row; arrival bar gains its time. Ships alone
and fixes four of the six observations. Touches: the desktop marker markup, the table's `v-if`, one
prop in the parent, `.age-marker-md` deleted, `.age-plate-md` extended.

**1b · Notes never get lost (FR-031).** The same guard, corrected: the table renders when it has any
row to draw, not when the step count is non-zero. A note is shown when it has content and hidden when
it is empty, and nothing else decides it. Ships with step 1 because it is the same line of code, and
it fixes a defect that predates this feature.

**2 · The gold rail (US2).** Write `.age-lane-md`'s rules. The class is already on every row that
needs it. Includes the empty-transition case, which needs no code — no rows, no rail.

**3 · Precedence and seams (US3).** Gate the gold rules on `:not(.alt-inside):not(.alt-row)`, for
both the rail and the row fade. Verify the gold → alternatives → gold run in a browser. The editor
rule that stops a block crossing a boundary (FR-020) already exists via the section constraint —
this step tests it rather than implements it.

**4 · The group (FR-029).** `role="group"` + `aria-label` on the `ageUp` card.

**5 · Light theme (FR-025).** Its own step, browser-only, and the one most likely to need tuning.
Muted gold on a near-white surface at the alphas the blue rail uses is the specific risk.

## Risks and what they cost

| Risk | Handling |
|---|---|
| **Light theme washes out.** Gold `#CCAA55` on `#FAFAFA` at 0.12 alpha may be invisible, or the fade may read as a block. | Its own task, browser-verified. Adjusting the alpha for the gold rail only is acceptable; introducing a new colour is not. |
| **The advance row changes step indices.** Would break the crosshair, the timeline highlight and focus mode at once. | The row takes no `data-step-index` (FR-027). SC-010 is the check: indices identical before and after. |
| **The table's `v-if` guards two unrelated things.** It decides whether the advance row has somewhere to live *and* whether a section note renders. | Replace the step count with "does this table have any row to draw". Applies to all section types — narrowing it to `ageUp` would leave the same note dying in an `age` section. Comment the guard, or it gets "simplified" back. |
| **A future stylesheet reorder flips the rail's precedence.** | Stated with `:not()` at the point of enforcement rather than relying on source order (research R4). |
| **"Fixing" `isBareAgeUp`.** An empty age-up deliberately shows only the plate to a reader. | Recorded in research R8 and in `quickstart.md` as a trap, not a defect. |

## What this plan does not decide

- Whether the mobile list is ever unified toward the single-rail rule. Out of scope, and the spec
  says which direction to unify *if* it happens.
- A collapsed/summary rendering of the markers. Recorded as an open item on the spec.
- Unifying the two kinds of note. The legacy section note and `027`'s placeable note items stay as
  they are; only the section note's *visibility* is corrected. Merging them is a data change, and
  this feature has none.

  **Decided follow-up (2026-08-10): convert on read in the editor, persist on save.** Its own
  feature, not part of 028. Not a backport — when an author opens and saves a build,
  convert `section.gameplan` into a note item appended to `section.steps` (where the section note
  already renders) and clear the field in the same operation. Missing that clear is the one bug that
  shows the note twice. Precedent sits in the same function: `initializeSections()`
  ([BuildOrderEditor.vue:560](../../../src/components/builds/BuildOrderEditor.vue#L560)) already
  migrates the pre-sections format on load and persists it only on save. `027`'s invariants N-1…N-3
  already cover note items in focus mode, the economy pass and time resolution, so nothing downstream
  needs teaching.

  **Convert on read, in the editor only.** Doing it at load rather than at save means the note is a
  positional item for the whole editing session — draggable the moment drag-and-drop lands, with no
  intermediate save. The gate is `!readonly`, and it is not optional:

  - **Focus mode reads section notes itself and folds them into the preceding step**
    ([FocusMode.vue:521](../../../src/components/builds/FocusMode.vue#L521)), never going through
    `BuildOrderEditor`. That folding carries real history — the empty-note guard, the separator that
    only appears between two things (unconditional, it sliced a 400px card in half), and the
    `steps[-1]` crash for a note before any step. Converting on read globally would flip that
    behaviour for every build at once and orphan the reasoning at that code.
  - Gated on `!readonly`, every reader path — list, focus mode, economy pass, overlay export — keeps
    seeing the stored shape until the author saves.

  **The visible consequence of a save**, to be stated rather than discovered: once converted, the note
  is a real item, so focus mode stops folding it into the previous step and shows it as its own card.
  That is the intended end state, but it changes on first save and belongs in that feature's spec.

  Two things it does **not** buy, recorded so the case is not overstated later:

  - **It does not retire the section-note renderer.** Migration only fires on builds an author edits
    again; most of ~4k never will. Readers must still render section notes, so FR-031's fix is needed
    regardless and is not a stopgap for this.
  - **It is not a cleanup win.** The justification is author-facing: a converted note becomes
    positional and can be moved, instead of being pinned to the foot of its section.

  **The alternative that does finish: a one-off backfill.** `scripts/backfill-age-timings.mjs` is the
  pattern — Admin SDK (rules restrict build writes to each build's author, so no client can do it),
  dry run by default with `--apply` opt-in, target project printed first because `.firebaserc`
  aliases mean nothing to the Admin SDK, batches within the ≤500 write limit. A sweep is the only
  route that ever makes the section-note renderer deletable.

  **Sequencing**: FR-031 ships with 028 regardless → convert-on-read-in-the-editor as its own feature
  → a backfill only if retiring the second note kind actually becomes the goal. Doing the backfill
  first buys least: the renderer still has to work for anything the sweep missed.

  Kept out of 028 deliberately: this feature performs zero writes, and a path that rewrites author
  documents does not belong in a rendering commit (Constitution II — atomic commits).
