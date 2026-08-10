# Contract: `useStepReorder()`

**File**: `src/composables/builds/useStepReorder.js` *(new)*
**Feature**: `029-step-reordering`

The one channel that lets an entry cross a section boundary. It is a **factory**: calling it
creates an independent reorder session. It must never hold module-level state — preview cards
and focus mode can put a second build on screen, and module state would give both builds one
drag (research [R-3](../research.md#r-3--cross-section-moves-need-a-coordinator-because-sections-do-not-share-state)).

It holds **no policy**. Hit-testing, the lift animation, scroll-on-edge and the disabled state
of a move button all live in the components that own those events. This is a registry and a
session, nothing more — the same division `useStepHighlight` draws.

---

## Provide / inject

```js
export const STEP_REORDER = Symbol("stepReorder");
```

`BuildOrderEditor.vue` calls the factory once and provides the result. Every
`BuildOrderSectionEditor` injects it and registers itself.

**Consumers MUST tolerate an absent injection.** The section editor is also rendered read-only,
where no reordering exists and nothing provides the coordinator. Injecting with a `null` default
and no-op'ing is what keeps this feature out of the reading view (FR-019).

```js
const reorder = inject(STEP_REORDER, null);
```

---

## Returned shape

```js
{
  // ---- registration ----
  registerSection,   // (sectionIndex: number, handlers: SectionHandlers) => void
  unregisterSection, // (sectionIndex: number) => void

  // ---- session (drag) ----
  session,           // ComputedRef<ReorderSession | null>
  begin,             // (sectionIndex: number, draftIndex: number) => void
  setTarget,         // (target: DropPosition | null) => void
  commit,            // () => void
  cancel,            // () => void

  // ---- discrete moves (buttons, arrow keys) ----
  moveBy,            // (sectionIndex, draftIndex, delta: -1 | 1) => Promise<DropPosition | null>
  canMove,           // (sectionIndex, draftIndex, delta: -1 | 1) => boolean
}
```

`moveBy` and `commit` are **async**: both restore focus to the moved entry, which cannot happen
until the row has re-rendered and re-registered its ref. Callers that only want the move need
not await.

### `SectionHandlers`

What a section promises the coordinator it can do. Registered at mount, removed at unmount.

```js
{
  entryCount,      // () => number          — entries in the working list, markers included
  entryAt,         // (draftIndex) => object|null   — the entry, or null if it is a marker
  gapInsideBlock,  // (gapIndex) => boolean — is this gap between two alternatives markers?
  detach,          // (draftIndex) => object        — remove and return the entry, no emit
  attach,          // (gapIndex, entry) => void     — insert the entry, no emit
  syncEdits,       // () => void            — commit contenteditable text into the model
  emit,            // () => void            — emit stepsChanged for this section
  focusEntry,      // (gapIndex) => void    — put focus back on the moved entry's handle
}
```

**`entryCount`, not a position count** *(revised during implementation)*. The coordinator has
to count gaps **after** the moving entry is removed, and only it knows which section that entry
left. A section reporting its own position count would be reporting a number that is wrong for
exactly one section during exactly the operation that matters.

**`gapInsideBlock` was added during implementation.** The one rule in `allowed()` — a step may
not cross a section boundary and join a path in the same move — needs to know whether a gap
falls between two markers, and only the section owning the list can answer that. It is the
section's `isInsideBlock` on the flat working list, asked about a gap rather than an entry.

**`detach` and `attach` deliberately do not emit.** The coordinator emits, once per touched
section, after both halves of the move have applied. A section that emitted from inside
`detach` would publish a build with the entry missing.

**Both must splice `steps` *and* `stepsCopy`** at the same index. This is not optional and it
is not visible from outside — see research [R-5](../research.md#r-5--every-mutation-touches-two-lists-and-a-move-touches-four).

---

## Behaviour

### `begin(sectionIndex, draftIndex)`

Opens a session. Calls `syncEdits()` on the originating section **first**, so text typed into
the row being dragged is committed before anything moves (FR-015).

Refuses silently — no session opens — when the entry at `draftIndex` is a marker
(`entryAt` returns `null`). Markers are not draggable (FR-003).

### `setTarget(target | null)`

Records the position under the pointer. `null` means no valid drop, which is what makes a
release outside the list a cancel rather than a move (FR-006).

### `commit()`

Applies the move, in this order (data model, *Move*):

1. `syncEdits()` on the destination section — the source was synced at `begin`. Skipped when
   they are the same section, which was already synced.
2. `detach(draftIndex)` from the source.
3. `attach(adjustedIndex, entry)` on the destination.
4. `emit()` on each touched section — once each, both after step 3.
5. `focusEntry()` on the destination, after two `nextTick`s.

Does nothing at all — no splice, no emit, no dirty mark — when the target equals the origin
(FR-017), or when there is no target.

**Index adjustment**: within one section, a downward move's destination index shifts by one
once the entry is removed. The coordinator owns this correction; sections receive an index
that is already correct for the list as it stands when `attach` is called.

### `cancel()`

Discards the session. Nothing has been mutated at this point, so there is nothing to undo.
Called on `Escape` and on release with no target.

### `moveBy(sectionIndex, draftIndex, delta)`

One press of move-up / move-down, and the arrow keys on the drag handle. Resolves the adjacent
**drop position** in the build-wide ordering — not the adjacent entry — so a single press
crosses exactly one boundary, whether that boundary is a merge line or a section
(research [R-7](../research.md#r-7--the-unit-of-movement-is-the-drop-position-not-the-neighbour)).

Runs the same sequence as `commit()` without a session. Returns the position landed in, or
`null` when the move was not possible.

### `canMove(sectionIndex, draftIndex, delta)`

Whether that press would do anything. Drives the disabled state of the mobile buttons
(FR-008 — disabled, not hidden). False only at the two ends of the whole build.

---

## Ordering across sections

`registerSection` is keyed by `sectionIndex`, and the coordinator resolves the build-wide
position ordering by walking sections in index order. Sections register at mount in render
order, but the coordinator must not depend on registration order — an age-up added mid-session
re-renders the list, and index order is the only ordering that stays true.

---

## What this does not do

- **No undo stack.** The reverse move is the undo (spec Assumptions). Nothing is recorded.
- **No multi-entry moves.** One entry per session, one per press.
- **No path-to-path moves.** Moving between two paths of one block is two moves with a tab
  switch between them; the coordinator has no concept of a path at all — membership is
  position, and that is the whole reason this contract is this small.
- **No validation of build semantics.** It does not check times, does not warn about order,
  does not renumber. A move relocates (FR-012).
