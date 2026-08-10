# Render model — 028 Age Markers

**No stored data changes.** Nothing is added to a build document, nothing is migrated, and no
Firestore read or write is added. Everything below is derived at render time from state the component
already holds.

## What a build already carries

| Concept | Where it lives today | Used by this feature |
|---|---|---|
| `section.type === "ageUp"` | the build document | Marks a transition. Its rows *are* the rail's run. |
| `section.age` | the build document | Names the target age and picks the age asset. |
| `section.steps` | the build document | The rows inside the transition. May contain an alternatives block. |
| `resolvedTimes[sectionIndex]` | `BuildOrderEditor.flatTimes` slice | Step times. Reading view only. |
| `offsets[sectionIndex]` | `sectionOffsets(sections, selection)` | Where a section starts in the flat document. |
| `insideBlock(index)` | `027` | Whether a row belongs to an alternatives path. |
| `isBlockStart` / `isBlockEnd` | `027` | The block's own two marker rows. |

## Row kinds in the desktop list

Every row is one of these. The list is closed — anything not on it is a bug.

| Row kind | Shape | On the column grid? | Boxed? | Step index? |
|---|---|---|---|---|
| Step row | 9 cells | yes | no | yes |
| Note row | icon + wide cell | no (spans 7) | no | yes |
| **Advance row** *(new)* | icon + wide cell + actions | no (spans 7) | **no** | **no** |
| Alternatives start (path tabs) | icon + tabs | no | no | no |
| Alternatives merge | icon + empty wide cell | no | no | no |
| Insert row (editor) | zero-height | n/a | no | no |
| **Boundary bar** | outside the table | n/a | **yes — the only one** | no |

**The invariant behind the feature**: exactly one row kind is boxed. If a second acquires a box, the
signal is gone (FR-005).

### Two kinds of note

The note row above is a **note item** — an entry in `section.steps` where `item.gameplan` is set. It
is a step of a different kind: it has a position and an index.

`section.gameplan` is a different thing entirely — a **section-level field**, from before notes could
be placed. It has no position and no index, and it renders as one row at the foot of the section.

They are not unified by this feature. What is unified is the rule governing both:

```
visible(note) = hasVisibleContent(note)
```

Nothing else. Not the section's step count, not its type, not the mode (FR-031). `hasVisibleContent`
already exists because an emptied note leaves `"<br>"` behind, which is truthy.

## The rail context of a row

A pure function of what the row already knows. There is no state to store and nothing to keep in
sync.

```
context(row) =
    alternative   if row is inside an alternatives block   (alt-row / alt-inside)
    gold          if row is in an ageUp section            (age-lane-md)
    none          otherwise
```

Evaluated top-down: the first match wins, which *is* "innermost wins" (FR-015). The two conditions
are already computed and already expressed as classes; the feature adds the third line of that table
and the precedence between the first two.

**Depth is capped at two by construction** (FR-013 + `027`'s section rule): an alternatives block
lives inside one section, and an age-up cannot open inside a path. A third context is unreachable, so
the function needs no general stack.

### Run boundaries

A *run* is a maximal sequence of adjacent rows with the same context. Runs are not stored; they are
implied by the per-row context and drawn by per-row segments that overhang their neighbours (see
`research.md` R2). The only per-run state is which row is first and which is last, and only for
trimming the overhang — which `027` already expresses as `alt-row--start` / `alt-row--end`.

For a gold run: the first row is the advance row, and the last is the row before the boundary bar.

### Empty transition

`steps.length === 0` → no railed rows exist → no rail, no gutter (FR-012), with no special case
needed. The reading view additionally drops the advance row itself (`isBareAgeUp`); the editor keeps
it. See `research.md` R8.

## The arrival time

```
arrival(sectionIndex) = flatTimes[ offsets[sectionIndex + 1] ]
```

The resolved time at the start of the next section — the same index `getAgeTimings` resolves as an
age's arrival. Rendered as `formatAgeTime(seconds)`, prefixed `~` unless `provenance === "stated"`,
and omitted entirely when absent (which is always, in the editor).

Passed as a prop rather than recomputed per section: the parent already holds `flatTimes` and
`offsets`.

## What must not change

- **Step indices.** `data-step-index` values, `flattenSections`, `sectionOffsets` and every consumer
  of them (age timeline highlight, economy crosshair, focus mode) see the same document before and
  after (FR-028, SC-010). The advance row takes no index — it is a marker, not a step (FR-027).
- **The document.** No new item kind, no new field, no sanitiser or validator change. `forEachStep`
  visits the same things.
- **Mobile.** Every `*-xs` class and its markup is untouched (FR-022).
