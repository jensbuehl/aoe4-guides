# Contract — `useEcoSeries.js`

**File**: `src/composables/builds/useEcoSeries.js` (new)

The single source of truth for what the economy plot draws. Pure derivation — no store, no fetch, no
DOM, no Vuetify.

## Exports

```js
/**
 * @param {Array} steps - A build's steps: sections array, or a legacy flat array.
 * @return {{points: EcoPoint[], coverage: number, lastStatedSeconds: number|null}|null}
 *   null whenever there is no chart worth drawing. Never throws.
 */
export function getEcoSeries(steps)

/**
 * @param {Object|Ref} build - The build, or a ref to it.
 * @return {ComputedRef<EcoSeries|null>} Memoized per build.
 */
export function useEcoSeries(build)
```

Shapes are defined in [data-model.md](../data-model.md).

## Algorithm

```text
getEcoSeries(steps):
  0. guard: steps is a non-empty array, and steps[0].type is set (sections build).
            Otherwise → null.                                          [R-7]

  1. flat = flattenSections(steps)        // SHARED helper from useAgeTimings.js
     if (!flat.length) return null

  2. timings = null
     try { timings = getTimings(flat) } catch { timings = null }
     // null is NORMAL, not fatal — it means "no interpolation available"   [R-1]

  3. points = []; statedSteps = 0

     for (i, step) of flat:
       // Each step is read on its own — nothing carries over from the last one
       values = { builders: 0, food: 0, wood: 0, gold: 0, stone: 0 }
       stated = false
       for key of ['builders', 'food', 'wood', 'gold', 'stone']:
         raw = step[key]
         if (raw != null && String(raw).trim() !== ''):
           values[key] = parseVillagerCountString(String(raw))
           stated = true

       if (!stated) continue      // says nothing about villagers; not a moment
       statedSteps++

       seconds = resolveSeconds(step, timings, i)
       if (seconds == null) continue      // filled in, but nowhere to place it

       points.push({ seconds, ...values })

  4. coverage = statedSteps / flat.length
     if (coverage < 0.5) return null                        // ratio half
     if (points.length < 4) return null                     // floor half   [R-2]

  5. points.sort((a, b) => a.seconds - b.seconds)
     return {
       points,
       coverage,
       lastStatedSeconds: points[points.length - 1].seconds,
     }

resolveSeconds(step, timings, i):
  stated = toDateFromString(step?.time)
  if (stated) return stated.getMinutes() * 60 + stated.getSeconds()   // authoritative
  const t = timings?.[i]?.startTime
  return t == null ? null : t
```

The whole body sits inside one `try`/`catch` that logs and returns `null`, matching
`getAgeTimings`'s existing failure posture.

## Guarantees

| # | Guarantee | Spec |
|---|---|---|
| C-1 | Never throws, for any step shape — `null` steps, `steps: []`, a section with `steps: []`, `time: "<br>"`, non-string cells | FR-007 |
| C-2 | Returns `null` rather than a degraded series. There is no "sparse chart" state | FR-006a, US3 |
| C-2b | A build-wide `getTimings` failure does **not** suppress the series — each step's time is resolved on its own | FR-006 |
| C-3 | Each point is one step's own reading. Blank cells are `0`; nothing carries forward | FR-003 |
| C-4 | A step that states nothing contributes no point, but still counts against coverage | FR-004 |
| C-5 | Uses `parseVillagerCountString`, unmodified, so the plot and the `N vils` markers can never contradict each other — including where both are wrong | FR-005, A-1 |
| C-5a | **Every point's five counts sum to that step's `N vils` figure.** The invariant that carry-forward broke; worth asserting mechanically | SC-001a |
| C-6 | Uses `flattenSections` from `useAgeTimings.js`, so step indices align with the age boundaries drawn on the same card | FR-002 |
| C-7 | `builders` is one of the five columns, read exactly like the others | FR-008 |
| C-8 | Derivation < 5 ms for a 30-step build | NFR-004 |

## Deliberate non-uses

| Not used | Why |
|---|---|
| `hasResourceValue()` | Only because the raw non-empty test is clearer inline. It would now give the *same* answer for every cell that matters — a blank and a `"0"` mean the same thing here, exactly as the build order table renders them (A-10). |
| `aggregateVillagers()` | Returns one total; this feature needs the five columns separately. The total is already on every age marker and is deliberately not re-drawn as a line (FR-008) — but C-5a requires the columns to add up to it. |
| A `getTimings` null gate | Would hide the feature on every build whose trailing steps are unstamped — the very shape the faded tail was designed for. [R-1] |

## What this composable must NOT do to `timingsHelper.js`

`getTimings` is consumed **strictly** by Focus mode —
`autoplaySupported = getTimings(steps) ? true : false` — and autoplay is binary: a build either has
a time for every step and plays through, or it cannot be played automatically. Its all-or-nothing
return is the correct answer to that question.

This composable reads the same call **leniently**, because a chart can honestly draw the part that
is known. The asymmetry is the design. `timingsHelper.js` stays byte-identical to `main`
(SC-007, A-9); every bit of leniency lives here.

## Verification (throwaway harness, not a committed suite)

Node harness over copies of the composable and its two helpers, asserting:

1. all-stamped build → a point per stated step, blank cells reading `0` rather than carrying;
2. **every point's five counts sum to that step's `N vils` total** (C-5a);
3. all-blank step mid-build → skipped, not drawn as a drop to zero;
4. builders drawn as a column, and a blank builders cell reading `0`;
5. build with unstamped trailing steps → still a series (this is the R-1 regression);
6. build with no timestamps at all → `null`;
7. explicit `"0"` and a blank producing identical output (A-10);
8. 6-step build with 3 stated cells → `null` via the floor even though the ratio passes;
9. prose-heavy build, 20 steps with 4 stated → `null` via the ratio;
10. legacy flat build → `null`;
11. malformed shapes (`null`, `[]`, `[{}]`, `{steps: null}`, `time: "<br>"`, numeric and object
    cells) → `null`, no throw;
12. backwards timestamps sorting ascending, with `lastStatedSeconds` the latest time not the last
    typed.
