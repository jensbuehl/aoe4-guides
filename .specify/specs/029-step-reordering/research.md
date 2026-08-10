# Research: Reorder Steps and Notes

**Feature**: 029-step-reordering | **Date**: 2026-08-10 | **Phase**: 0

Nine questions stood between the spec and a plan. Each was settled against the code rather
than against a preference; where the code said something surprising it is recorded, because
that is the part that will be rediscovered otherwise.

---

## R-1 — Pointer events, not HTML5 drag-and-drop, and no library

**Decision**: Hand-rolled drag on pointer events — `pointerdown` on a handle,
`setPointerCapture`, `pointermove`, `pointerup` — with `Escape` cancelling.

**Rationale**: three things rule out the alternatives.

- The rows contain `contenteditable` cells, which the browser already treats as natively
  draggable. An HTML5 `draggable` row competes with the text-drag the author expects inside
  a description, and the two cannot be told apart once a drag has started. FR-004 already
  requires the row body to keep ordinary selection behaviour; pointer events give that for
  free because nothing is a drag until the handle says so.
- The drag surface is a `<table>`. HTML5 DnD's drag image for a `<tr>` is browser-dependent
  and frequently renders as a single collapsed cell. Pointer events let the lift be an
  ordinary CSS transform on the row.
- One code path covers mouse, pen and touch. The mobile surface does not need it (that is
  Story 2's buttons), but the tablet width shares the desktop table.

**Alternatives considered**:

- **SortableJS / vuedraggable** (~40 kB): rejected on Constitution I. It wants to own a
  homogeneous list; ours interleaves marker rows that are not sortable items and insert rows
  that are not items at all. Configuring `filter`, `draggable` and `handle` to exclude both,
  then reconciling its DOM reordering against a Vue-rendered list that also carries a
  parallel copy (R-5), is more work than the hit-test in R-2 — and it adds a dependency to
  a project whose first principle asks what a native primitive cannot do.
- **HTML5 DnD**: above.
- **`@vueuse/core`'s `useDraggable`**: already a dependency, but it positions a single
  element freely; it is not list reordering. Not applicable.

---

## R-2 — The drop target already exists, and it already draws the line

**Decision**: Drop positions **are** the insert rows the editor already renders. Hit-test
them by bounding box during the drag; the nearest one is the drop position.

**Rationale**: the editor renders an `.ins-row` before every entry, plus a trailing one, each
already meaning "insert after index N" and each already drawing a line with a `+ Add`
affordance. They are the drop targets, positioned and styled, and reusing them means the
drop indicator introduces no second kind of line meaning almost-the-same-thing (SC-008).

**The part worth knowing**: this resolves US3 §3 by construction. Because an insert row is
rendered before *every* entry including the markers, there is already one between the last
step of a path and the merge marker (inside the bracket) and another between the merge
marker and the entry after it (outside). Two adjacent, visually distinct positions, separated
by the merge line, already meaning exactly what the spec needs them to mean. Nothing has to
be invented to make "inside" and "outside" distinguishable — the editor has been drawing that
distinction since 027.

**Note for the mobile surface**: the insert affordance after a closing marker is deliberately
suppressed there (`v-if="!isBlockEnd(item)"`) and rendered outside the block wrapper instead,
so the rail stops where the block does. Story 2 moves by drop position (R-7), not by rendered
insert control, so this does not cost the phone a position.

---

## R-3 — Cross-section moves need a coordinator, because sections do not share state

**Decision**: A `useStepReorder()` factory, provided by `BuildOrderEditor` and injected by
every `BuildOrderSectionEditor`, modelled directly on `useStepHighlight`.

**Rationale**: this is the finding that shapes the whole plan. Each section editor builds its
working list **once**, in `setup()`, from `props.section.steps`:

```js
const steps = reactive(expandBlocks(JSON.parse(JSON.stringify(props.section.steps))));
```

and nothing re-synchronises it afterwards — the only watchers in the component are on
`props.focus` and `props.civ`. So the parent cannot move a row between two mounted sections
by mutating its own `sections` array: the children would keep rendering the lists they built
at mount.

**Alternatives considered**:

- **Make section state prop-driven with a watcher**: rejected. The working list is not a copy
  of the prop — it is the prop expanded into flat form, carrying `_id`s, an active-path
  choice per block and a parallel edit copy (R-5). Re-deriving it whenever the prop changes
  means rebuilding the list under the author's cursor on *every keystroke*, because the
  parent is emitted to on every change. That trades a contained problem for an editor that
  loses focus and selection while typing.
- **Thread callbacks down as props**: the two components between the coordinator and the rows
  have no interest in the traffic, and it needs a matching chain of emits back — which is the
  precise reasoning `useStepHighlight` records for choosing provide/inject over props.

**Carried over verbatim from `useStepHighlight`**: a **factory, not module-level state**.
Preview cards and focus mode can put a second build on screen, and module-level refs would
give both builds one drag session. Called once per editor page, that cannot happen. The
injection key is a `Symbol` for the same reason it is there.

**Consistency**: `scrollToStep` already establishes that the parent calls methods on section
editors through `sectionEditorRefs`. The coordinator is the same relationship, named.

---

## R-4 — Two emits per cross-section move are fine, and here is the condition on that

**Decision**: The source section and the target section each mutate and each emit
`stepsChanged` normally. No batching, no intermediate-state suppression.

**Rationale**: the parent writes each section's steps into its own slot
(`sections.value[index].steps = steps`) and re-emits upward. Two sections changing means two
independent writes to two different slots — neither clobbers the other, and the order does
not matter. There is no autosave in the editor: `BuildEditor` tracks `isDirty` and guards
navigation, and saving is an explicit action. So no intermediate state is ever persisted, and
marking dirty twice is idempotent.

**The condition, recorded because it will not be obvious later**: this holds *because* saving
is manual. If autosave is ever introduced, a cross-section move becomes a real ordering
problem — a save landing between the two emits would persist a build with the step duplicated
or missing. Should that day come, the fix is to have the coordinator mutate both sections and
trigger a single parent emit, not to reorder the two.

---

## R-5 — Every mutation touches two lists, and a move touches four

**Decision**: A move calls `syncEditedFields()` on **every** section it touches, then performs
paired splices on both `steps` and `stepsCopy` in each.

**Rationale**: each section holds two parallel reactive lists kept aligned by position —
`steps` and `stepsCopy` — and every existing mutation splices both (`addStep`, `addNote`,
`removeStep` all do). `stepsCopy` is what the mobile surface reads typed descriptions from;
on desktop `syncEditedFields()` instead reads the DOM by `data-edit-field` / `data-edit-index`.
Either way both are **index-addressed**, which is why FR-015 exists: reorder the rows before
committing what was typed and the text lands on whichever entry inherits the index.

**The cross-section consequence**: a move between sections must sync **both** sections before
either splices, because the author may have been typing in either one. A one-sided sync is
the same bug with a longer fuse.

---

## R-6 — `_id` collides across sections, today, by construction

**Decision**: Promote the id counter from per-component to module scope before any entry can
cross a section boundary.

**Rationale**: this is a live latent bug, not a hypothetical. Each section editor holds its
own counter:

```js
let _nextStepId = Date.now();
```

Two sections mounting within the same millisecond — which is the normal case, they mount
together — both start from the same value and both hand out `+1, +2, +3…`. Their `_id`s are
therefore *identical sets*, not merely overlapping.

Today that is harmless: `_id` is only a `v-for` key, and keys need to be unique within one
list. The moment an entry moves between sections it stops being harmless — the arriving entry
can carry an `_id` the target section already has, and Vue is handed two rows with one key.
The symptom would be a row that renders stale content or refuses to update, which is exactly
the kind of bug that gets blamed on the drag.

**Alternatives considered**: minting a fresh id on arrival. It works, but it fixes one path
through the code and leaves the collision itself in place for the next feature to find. A
module-level counter is a smaller change and removes the class.

---

## R-7 — The unit of movement is the drop position, not the neighbour

**Decision**: One press of **move up** / **move down** moves the entry to the adjacent **drop
position**, not past the adjacent entry.

**Rationale**: this is the formulation that makes every boundary case fall out correctly
instead of needing its own rule. Drop positions include "inside the bracket, just above the
merge line" and "outside it, just below" — adjacent positions separated by a marker, not by
an entry (R-2). Defining a move as "swap with the neighbouring entry" cannot express the
difference between them; defining it as "go to the next drop position" expresses it exactly.

What this buys:

- Crossing into an alternative takes **its own press**, with no entry changing places. The
  author sees the step step sideways into the lane, which is the visible confirmation that a
  silent membership change would otherwise lack.
- Crossing a section boundary is likewise one press, landing at the first drop position of
  the next section (US4 §1–2).
- Markers are passed *through*, never swapped *with*, so FR-003 holds without a check.

FR-007's wording — "one position in document order" — is this, and the plan should read
"position" as "drop position" wherever it appears.

---

## R-8 — Reuse the scroller that is already there

**Decision**: Discrete moves (Stories 2 and 5) call the existing `scroll-into-view-if-needed`
helper the way `scrollToStep` already does; the drag adds a simple edge-proximity scroll.

**Rationale**: `scrollToStep` already imports the dependency, already passes
`scrollMode: "if-needed"` so a visible row is not yanked, and already resolves `behavior`
against `prefers-reduced-motion`. US2 §5 and the reduced-motion edge case are both satisfied
by calling what exists rather than by writing a second scroller with its own opinion.

---

## R-9 — The handle is the keyboard control

**Decision**: One focusable drag handle per row on desktop, living in the existing
`.step-actions` cell, which responds to `ArrowUp` / `ArrowDown` when focused.

**Rationale**: FR-009 needs a keyboard path and FR-004 needs a handle. Making them separate
controls means four buttons in a 90px cell that currently holds two — it does not fit, and
SC-008 forbids growing the row. One control satisfies both: it is focusable, it carries an
accessible name, arrow keys move the entry one drop position (R-7), and focus stays with it
so repeated presses repeat the move.

**Why not a leading grip column**: the table's insert rows span the full width with
`colspan="9"`. Adding a column means changing that number in six places and re-checking every
header alignment, to gain a convention. The actions cell already reveals its delete control
on row hover (`.row-x`, `opacity: 0` → `1`); the handle joins that pattern and costs nothing
structurally.

**This resolves** the second open item in the spec's quality checklist: the keyboard actions
are not the mobile controls surfaced at all widths — they are the handle's arrow keys.

---

---

## R-10 — The alternatives phase needed no code *(recorded during implementation)*

**Outcome**: [R-2](#r-2--the-drop-target-already-exists-and-it-already-draws-the-line) and
[R-7](#r-7--the-unit-of-movement-is-the-drop-position-not-the-neighbour) predicted that moving
a step into or out of a path would need no special case. It needed none.

Phase 5 was written as a verification phase on that prediction, with T025 standing ready to
record whatever exception turned up. There is nothing to record: the two tasks in it were a
grep confirming markers carry no grip, and a browser check that the two lines either side of a
merge marker read as different targets. No branch anywhere in `useStepReorder.js` mentions a
path, a marker or a block — the only place `gapInsideBlock` is consulted is the one deliberate
*restraint* in `allowed()`, which exists for a UX reason and not a correctness one.

Two things made that true, and both were decisions rather than luck:

- **027 stored membership as position.** Had a path's steps carried a `pathId`, every move
  would have needed to add, clear or rewrite it, and every one of those is a case to get
  wrong.
- **Gaps, not neighbours.** Swapping with a neighbour cannot express the difference between
  the gap above a merge marker and the gap below it — they have the same neighbours. Moving
  between gaps expresses it exactly, and markers become things a move passes through rather
  than things it has to reason about.

The cost that did appear was somewhere else entirely: sections not sharing state
([R-3](#r-3--cross-section-moves-need-a-coordinator-because-sections-do-not-share-state)) and
the id collision ([R-6](#r-6--_id-collides-across-sections-today-by-construction)). Both are
about *age sections*, which nobody flagged as risky, while alternatives — which everybody
did — cost nothing.

---

## Summary of decisions

| # | Question | Decision |
|---|---|---|
| R-1 | Drag mechanism | Pointer events, hand-rolled, no library |
| R-2 | Drop targets | The existing insert rows; "inside/outside" already distinguished |
| R-3 | Cross-section state | `useStepReorder()` factory via provide/inject, per `useStepHighlight` |
| R-4 | Emit ordering | Two independent emits; safe only while saving is manual |
| R-5 | Edit safety | Sync **every** touched section before splicing; splice both lists |
| R-6 | Row identity | Module-level id counter — per-component counters collide by construction |
| R-7 | Move unit | The adjacent **drop position**, not the adjacent entry |
| R-8 | Scrolling | Reuse the existing `scroll-into-view-if-needed` call |
| R-9 | Keyboard | The drag handle is the keyboard control; arrow keys move |
| R-10 | Did alternatives need special-casing? | No. Confirmed in implementation, not assumed |

No `NEEDS CLARIFICATION` items remain.
