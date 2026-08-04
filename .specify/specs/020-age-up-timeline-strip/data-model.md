# Phase 1 Data Model — `020-age-up-timeline-strip`

Only one persisted structure is added. Everything else in this feature is derived at render time.

---

## Persisted: `builds/{buildId}.ageTimings`

A map keyed by age name. **Only ages the build actually reaches appear.**

```jsonc
{
  "ageTimings": {
    "feudal":   { "t": 220, "e": false },
    "castle":   { "t": 535, "e": true  },
    "imperial": { "t": 850, "e": true  }
  }
}
```

| Field | Type | Meaning |
|---|---|---|
| `t` | number | Arrival time in **seconds** from game start, rounded to the nearest second |
| `e` | boolean | `true` when the time was interpolated rather than stated by the author |

### Validation rules

- **Keys**: only `feudal`, `castle`, `imperial`. Derived from the section `age` value (`2`, `3`, `4` respectively).
- **Omission over sentinels**: an age the build never reaches MUST have **no key**. Writing `0`, `null` or `{t: null}` is forbidden — a missing nested path is what excludes the build from a future `orderBy('ageTimings.castle.t')`, whereas `0` would sort it to the front of "fastest Castle".
- **Whole-field replacement**: every save rewrites the entire `ageTimings` map, so ages removed by an edit disappear. Never patch individual keys with dot notation.
- **No timings derivable**: write `{}` (see research R10). Applies to legacy flat builds, builds with no age-ups, and builds where `getTimings()` returns `null`.
- **Monotonicity is not enforced on write.** The stored value mirrors whatever the derivation produced; display-side rules decide what to show.

### Lifecycle

| Event | Effect |
|---|---|
| Build created (`addBuild`) | Computed and written |
| Build edited (`updateBuild`) | Recomputed and fully replaced |
| Draft published (`updateBuild` via `BuildDetails`) | Recomputed and fully replaced |
| Views / likes / comments incremented | Untouched — those paths write only their own counter |
| Backfill script | Written once for every existing build |

### Access control

No rules change. The authenticated-author rule in `firestore.rules` has no field whitelist, so authors may write it; the public update rule is restricted to `['views','likes','upvotes','downvotes','comments']`, so anonymous clients cannot. See research R2.

### Indexing

Firestore automatically single-field indexes nested map leaves, so `orderBy('ageTimings.feudal.t')` works with no configuration. That costs a small number of extra index entries per build write; builds are written rarely relative to reads, so the cost is negligible. Combining an age-time sort with existing filters (`isDraft`, civ, seasons, maps) will need **composite** indexes — out of scope here, but this shape is what makes it possible without a second migration.

---

## Propagated: `home/home` lane entries

`functions/builds/updateHomeSnapshot.js#pickBuildFields` gains one line:

```js
ageTimings: data.ageTimings ?? null,
```

The field is **copied, never computed** — no derivation logic enters `functions/`. Entries written before this feature carry `null` and render as cards with no timings (FR-034).

---

## Derived at runtime: age timings result

Produced by `getAgeTimings(steps)` and consumed by the card, the chips and the timeline. Never persisted in this shape.

```js
[
  { age: 2, seconds: 220, derived: false },   // age 2 = Feudal
  { age: 3, seconds: 535, derived: true  },   // age 3 = Castle
  { age: 4, seconds: 850, derived: true  }    // age 4 = Imperial
]
```

| Field | Type | Notes |
|---|---|---|
| `age` | 2 \| 3 \| 4 | The **section's own** numbering: 1 = Dark, 2 = Feudal, 3 = Castle, 4 = Imperial |
| `seconds` | number | `Math.round(timings[boundaryIndex].startTime)` |
| `derived` | boolean | `toDateFromString(step.time) === null` — the parsed result, not the raw field (research R9) |

Returns `[]` — never `null`, never partial — for legacy flat builds, builds without age-ups, and when `getTimings()` returns `null`.

### Boundary rule

For age *n*, the boundary is the **first step of the first section with `type === 'age'` and `age === n`**. An `ageUp` section is never a boundary; it holds the steps performed *while* aging up.

Note the two section types number ages differently: an `ageUp` section's `age` field is the count of ages already completed (so `age: 1` on an `ageUp` means "aging up to Feudal"), whereas an `age` section's `age` is the absolute age (`2` = Feudal). Only `age` sections are read, so only the absolute numbering matters here.

### Flattening contract

Sections are flattened exactly as `FocusMode.vue` does: concatenate each `section.steps` in order, and **never** push `section.gameplan` as its own entry. Any deviation shifts the indices out of alignment with the array `getTimings()` returns, which would silently report wrong times rather than fail.

---

## Source-of-truth chain

```
build.steps  ──getAgeTimings()──>  [{age, seconds, derived}]
                                          │
                        ┌─────────────────┴──────────────────┐
                        │                                    │
              stored on save as                    rendered directly
              ageTimings map                       (rail · chips · timeline)
                        │
              copied into home summary
                        │
              read back by the card (preferred over deriving)
```

One derivation implementation, three consumers, no second copy anywhere (FR-030).
