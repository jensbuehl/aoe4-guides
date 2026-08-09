# Contract — the alternatives block

The shape written to the build document, and what each surface may assume about it.

---

## Shape

```js
{
  kind: "alternatives",
  paths: [
    { title: "Defend", description: "<html>", main: true, steps: [ /* steps */ ] },
    { title: "Keep booming", description: "<html>", steps: [ /* steps */ ] }
  ]
}
```

Lives in `section.steps`, never as a section (research
[R-10](../research.md#r-10--age-numbering-is-positional-so-the-block-cannot-be-a-section)).

| Field | Type | Required | Notes |
|---|---|---|---|
| `kind` | `"alternatives"` | yes | Sole discriminator. Absent on every existing step — no migration. |
| `paths` | array | yes | ≥2 in normal authoring; 1 degrades to a conditional detour, 0 contributes nothing. |
| `paths[].title` | plain string | yes | One line. What the legend, the focus-mode bar and the desktop pick row show. |
| *(condition)* | — | no | **Not a field.** A path's condition is its first note, i.e. `paths[].steps[0].gameplan` (FR-022). |
| *(main)* | — | — | **Dropped.** The first path is the main line by convention. |
| `paths[].steps` | array | yes | Ordinary steps. Own timings (FR-006). No nesting, no age-up. |

No `id`. Identity is positional, consistent with every other index in this codebase.

---

## Invariants

- **B-1** — `paths[].steps` contain no item with `kind` (FR-004). Enforced by the editor; ignored by
  the flattener if present.
- **B-2** — A block cannot span an age-up. **Structural**: age-ups are section boundaries, blocks live
  inside a section (FR-003).
- **B-3** — Steps following a block in the same section are common to all paths. Positional rejoin, no
  pointer (FR-002).
- **B-4** — Removing the block from a document leaves a valid document; splicing every path's steps
  back into the section leaves a valid document (FR-011).

---

## What each surface may assume

| Surface | May assume | Must not assume |
|---|---|---|
| Flattener | Only the shape above | That `paths` has ≥2 entries, or that any path has steps |
| Reading view | One active path at a time | That a block has a `main` path |
| Economy graph | Its series came from one linear play-through | That the selection is stable across a redraw |
| Focus mode | Every step in its queue has a resolved time | That indices survive a path switch ([R-5](../research.md#r-5--focus-modes-queue-is-a-mount-time-snapshot-and-fr-015-breaks-that-assumption)) |
| Overlay export | The default path when given no selection | That a block can be represented in the overlay format |

---

## Sanitisation

`paths[].description` runs through the existing
[`sanitizeStepDescription`](../../../../src/composables/builds/buildOrderValidator.js#L49) —
`img` and `br` only, a fixed class allowlist. `paths[].title` is **plain text**: markup is stripped on
save, the way `PLAIN_TEXT_STEP_FIELDS` already treats `time` and the resource cells
([`BuildOrderEditor.vue:538`](../../../../src/components/builds/BuildOrderEditor.vue#L538)).

This matters beyond tidiness: the title is rendered in a chart legend and a focus-mode bar, neither of
which renders HTML. Stripping on save keeps that from becoming their problem.

---

## Firestore

No new collection, no new document, no rules change beyond the review Principle V requires of any
schema change. The block is nested inside the existing `build.steps` field of an existing document,
and adds no read and no write to the project's budget. The selection is never persisted server-side.
