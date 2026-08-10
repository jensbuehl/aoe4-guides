# Data Model: Reorder Steps and Notes

**Feature**: 029-step-reordering | **Date**: 2026-08-10 | **Phase**: 1

## The stored format does not change

Nothing here is persisted. FR-018 is the whole of the storage story: a build that nobody
reorders is byte-identical to what it is today, no field is added to any step, note, path or
section, no migration runs, and Firestore rules are unaffected because no shape reaching them
is new (Constitution V — a review, not a change).

What follows is therefore an **in-memory** model: the transient state a move needs while it
is happening, and the addresses it moves between.

---

## Entities

### DropPosition

A place an entry can land. **Not a thing that exists in the document** — it is the gap
between two entries, and it is the only address this feature needs.

| Field | Type | Meaning |
|---|---|---|
| `sectionIndex` | number | Which section owns the gap |
| `draftIndex` | number | Position in that section's flat working list; the entry lands *at* this index |

**Derivation**: one position before every entry in a section's working list, plus one after
the last. Marker entries are included in that count, which is what makes the two positions
around a merge line distinct addresses (research [R-2](./research.md#r-2--the-drop-target-already-exists-and-it-already-draws-the-line)).

**Validity rules** (FR-003, FR-014):

- A position is valid for a move if it is not the position the entry currently occupies
  (FR-017 — a no-op move emits nothing).
- Every position is otherwise valid. There is deliberately **no** rule forbidding a position
  inside a bracket or across a section: those are the feature.
- An entry never lands *on* a marker, only in a gap, so a marker pair can never be split
  by an arriving entry and FR-003 needs no check.

**Ordering**: positions are totally ordered across the whole build — section by section, and
within a section by `draftIndex`. "The adjacent position" (research [R-7](./research.md#r-7--the-unit-of-movement-is-the-drop-position-not-the-neighbour))
means the next or previous entry in that total order, which is what makes one press cross one
boundary.

---

### MovableEntry

An ordinary step or a note. Unchanged by this feature except that it now has somewhere to go.

| Field | Type | Note |
|---|---|---|
| *(all existing step fields)* | — | Carried **verbatim** across a move (FR-012) |
| `_id` | number | Client-only render key, never persisted |

**Membership is not a field.** Whether the entry belongs to an alternative path is decided
entirely by where it sits relative to the markers, which is 027's model and the reason this
feature needs no format change (FR-010).

**What a move must not touch**: `time`, `villagers`, `builders`, `food`, `wood`, `gold`,
`stone`, `description`, `gameplan`. A move relocates; it never rewrites (FR-012, SC-006).

**`_id` uniqueness becomes load-bearing here.** Today it need only be unique within one
section's list; once an entry crosses a boundary it must be unique across the build. The
counter that mints it is currently per-component and collides across sections by construction
— see research [R-6](./research.md#r-6--_id-collides-across-sections-today-by-construction). Fixing that is a
prerequisite of User Story 4, not a cleanup.

---

### Non-movable entries

Named because the model is defined as much by what has no address as by what does.

| Kind | Why it cannot move |
|---|---|
| `altStart` / `altEnd` markers | Structure. The bracket moves whole or not at all, and this feature's answer is "not at all" (FR-003). Passed *through* by a move, never swapped with. |
| Age-up advances | A section, not an entry. Its steps move; it does not. |

---

### ReorderSession

Transient state for one drag, held by the coordinator. Exists only between `pointerdown` on a
handle and `pointerup` or `Escape`. Never persisted, never emitted.

| Field | Type | Meaning |
|---|---|---|
| `origin` | DropPosition | Where the entry started, so a no-op drop can be detected (FR-017) |
| `sectionIndex` | number | Which section owns the dragged entry |
| `draftIndex` | number | The dragged entry's live position |
| `target` | DropPosition \| null | The position currently under the pointer; `null` means no valid drop |

**Lifecycle**:

```
idle ──pointerdown on handle──▶ dragging ──pointerup on valid target──▶ committing ──▶ idle
                                    │
                                    ├──pointerup with target = null──▶ idle   (no change)
                                    └──Escape─────────────────────────▶ idle   (no change)
```

`committing` is not a resting state — it is the move applying. Both exits from `dragging`
that are not a valid drop leave the build untouched and unmarked (FR-006).

**One session at a time, per build.** The coordinator is a factory rather than module state
precisely so that two builds on screen — a preview card, focus mode — get two sessions
(research [R-3](./research.md#r-3--cross-section-moves-need-a-coordinator-because-sections-do-not-share-state)).

---

### Move

The operation itself. Not an entity that persists; recorded here because its ordering is a
correctness property rather than an implementation detail.

**Inputs**: one MovableEntry, one origin DropPosition, one destination DropPosition.

**Required order** (research [R-5](./research.md#r-5--every-mutation-touches-two-lists-and-a-move-touches-four)):

1. `syncEditedFields()` on **every** section the move touches — source and destination, even
   when they are the same. The author may have been typing in either (FR-015).
2. Splice the entry out of the source section's `steps` **and** `stepsCopy`, at the same index.
3. Splice it into the destination's `steps` **and** `stepsCopy`, at the same index.
4. Each touched section emits `stepsChanged` with its own collapsed list.

Steps 2 and 3 are one operation within a section and two across sections. The two emits in
the cross-section case are independent and unordered — safe because saving is manual
(research [R-4](./research.md#r-4--two-emits-per-cross-section-move-are-fine-and-here-is-the-condition-on-that)).

**Invariants after any move**:

- Every marker pair is still a pair, still in order, still within one section (FR-014).
- Total entry count across the build is unchanged — nothing is created or destroyed.
- The moved entry's content is identical, field for field (FR-012).
- A section emptied by the move still exists, with its ordinary empty state (FR-020).
- A path emptied by the move still exists, and the block still saves (FR-011, 027 precedent).

---

## What reads this, and what must stay correct

Nothing new reads it — that is the point. But everything that reads a build **by position**
now has positions that change, and FR-016 requires each to keep addressing the right entry:

| Reader | Why it is at risk |
|---|---|
| Resolved times / economy series | Indexed off the flattened build; a section's slice is bounded by `sectionOffsets` |
| Timeline highlight link | Maps a flat index to a section and a row |
| `documentIndex()` | Converts a draft position to a document one by counting non-markers |
| Per-row refs (`timestampRefs`, `noteRefs`, `stoneInputRefs`) | Registered **by index**, so they are stale until re-render |

The last one already has a precedent: `addStep` waits two `nextTick`s before focusing a
newly inserted row's timestamp. A move needs the same wait before restoring focus to the
entry it moved (FR-009 — focus stays with the entry).

**Every one of these must be reached through `flattenSections` / `sectionOffsets` /
`forEachStep`.** `npm run check:steps` enforces it, and it exists because seven walks that
treated a block as a step shipped before it did.
