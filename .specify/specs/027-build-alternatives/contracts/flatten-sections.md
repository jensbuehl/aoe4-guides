# Contract — `flattenSections(sections, selection?)`

`src/composables/builds/useAgeTimings.js`

The single seam where a branching document becomes a linear one. Everything downstream of this
function is, and stays, branch-unaware (research [R-1](../research.md#r-1--the-flat-step-list-is-the-apps-shared-coordinate-system)).

---

## Signature

```js
flattenSections(sections, selection?) → Step[]
sectionOffsets(sections, selection?) → number[]
```

`selection` is optional. Omitted, both functions behave as if every block were set to its default
path (`main`, else first). **Today's single-argument calls therefore remain correct**, which is what
lets the refactor land before the feature.

---

## Guarantees

| # | Guarantee |
|---|---|
| **G-1** | The return value contains **only ordinary steps**. No item carrying `kind` ever appears in it. |
| **G-2** | Step objects are returned **by reference**, unwrapped and unmodified — as today. Callers that mutate (focus mode stamps `step.time`) keep working. |
| **G-3** | For sections containing no block, output is **identical to the current implementation** for every `selection`, including `undefined`. |
| **G-4** | Total and deterministic: never throws, never returns `null`. Malformed input yields fewer steps, never an error. |
| **G-5** | Output order is document order, with each block replaced in place by its active path's steps. |
| **G-5a** | A **note** (a step carrying `gameplan`) is an ordinary step and passes through untouched, in place — it is not a `kind`, so G-1 is unaffected (data-model §2b). |
| **G-6** | `sectionOffsets(s, sel)[i] + local === flat index`, for the same `sel` passed to both. |
| **G-7** | Called with the same arguments twice, returns equal output. No memoisation, no hidden state. |

**G-3 is the regression guard for FR-017** and is directly testable: run both implementations over
every build shape in the fixtures and diff.

---

## Active-path resolution

In order:

1. `selection[blockId]`, if it indexes an existing path;
2. the path with `main: true` (first, if several — admission A-3);
3. `paths[0]`.

A block with no valid path at all (empty `paths`) contributes **no steps** and no error.

---

## Non-goals

Stated as refusals, in the house style — the function reports structure and nothing else:

- **Does not re-time.** No step's `time` is read, written or inferred. Each path owns its timings and
  the common steps after a block keep the times their author wrote (FR-006).
- **Does not validate.** A nested block is skipped, not reported. Validation belongs to the editor,
  where a human can be told why (FR-007's disabled entries with reasons).
- **Does not repair.** Nothing is clamped, defaulted into the document, or written back.
- **Does not decide what a block means.** No "cost of the detour", no comparison, no merge.
- **Does not know about selection storage.** It receives a resolved object; who persists it and where
  is the caller's business (data-model §3).

---

## Callers

| Caller | Passes selection | Notes |
|---|---|---|
| `useEcoSeries.getEcoSeries` | yes | Shares the reading view's selection (FR-014) |
| `AgeTimeline.vue` | yes | Same page, same selection |
| `BuildOrderEditor.vue` | yes | Editor previews the path being edited |
| `FocusMode.vue` | yes | Own session selection; rebuilds the queue on switch ([R-5](../research.md#r-5--focus-modes-queue-is-a-mount-time-snapshot-and-fr-015-breaks-that-assumption)) |
| `useExportOverlayFormat` | yes | The active path, flattened (FR-018) |

The last two do **not** call it today and must be routed through it first — that is implementation
Phase 0 ([R-2](../research.md#r-2--there-are-four-flatteners-not-one)).
