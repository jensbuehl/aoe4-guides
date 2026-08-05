# Phase 1 — Data Model: Step Time Resolution

**Feature**: `022-step-time-resolution` | **Spec**: [spec.md](spec.md) | **Research**: [research.md](research.md)

Everything here is **derived at read time** except one persisted field, which keeps its current shape
(R-3). No Firestore schema changes, no new indexes, no new collections.

---

## 1. `ResolvedTime` — new, the feature's centre

One per input step, index-aligned with the flattened step list.

| Field | Type | Meaning |
|---|---|---|
| `seconds` | `number \| null` | Position on the build's clock. `null` iff `provenance === "unresolved"`. |
| `provenance` | `"stated" \| "interpolated" \| "extrapolated" \| "unresolved"` | How the value was arrived at. |

**Invariants** (each maps to an acceptance scenario):

| # | Invariant | Source |
|---|---|---|
| I-1 | `seconds` is finite — never `NaN`, never `Infinity` | US1.1, D1 |
| I-2 | `seconds >= 0` | US1.6, FR-010 |
| I-3 | Across entries whose `provenance !== "stated"`, `seconds` is monotonically non-decreasing | US1.3 |
| I-4 | An `interpolated` value lies within `[left anchor, right anchor]` inclusive | US1.3 |
| I-5 | `provenance === "stated"` ⟺ the step's own timestamp parsed, and `seconds` equals it exactly | FR-003, US3.2 |
| I-6 | `seconds === null` ⟺ `provenance === "unresolved"` | FR-001 |
| I-7 | A `gameplan` note is always `unresolved` and is never an anchor | FR-011, US1.5 |

I-3 deliberately excludes `stated` entries: authors type times out of order, and A-7 forbids
rewriting them. The guarantee is that derived values never make an out-of-order build worse.

---

## 2. `Anchor` — internal, never leaves the resolver

A step **whose own timestamp parses**. The only measured points in a build.

| Field | Type | Meaning |
|---|---|---|
| `index` | `number` | Position in the flattened list |
| `seconds` | `number` | The stated time |
| `villagers` | `number \| null` | The **running** count in force (FR-005), or null if none stated yet |

A villager count is **not** required (FR-004, plan correction 4). It only decides whether the span
this anchor opens can be divided proportionally. Requiring it denied every time to builds stamped
only at their age-ups.

The first step of a build is forced to `0:00` and becomes a real anchor (FR-010) — the one moment
that needs no measuring. A build whose *only* anchor is that forced one is not extrapolated
(FR-010a): it has measured nothing.

---

## 3. `AnchorSpan` — internal, the load-bearing concept

The stretch between two consecutive anchors. Its duration is *measured*, which is why interpolation
inside it needs no villager production rate and therefore absorbs civ, town-centre count and idle
time without modelling any of them (A-1).

| Field | Type | Meaning |
|---|---|---|
| `from`, `to` | `Anchor` | Endpoints |
| `duration` | `number` | `to.seconds - from.seconds` |
| `villagerDelta` | `number` | `to.villagers - from.villagers` |
| `usable` | `boolean` | `villagerDelta > 0` — false triggers even spacing (FR-007) |

`usable === false` covers all three degenerate cases at once: zero delta (D1), negative delta (D4),
and no stated counts.

---

## 4. `ObservedRate` — internal, the reason no civ table is needed

| Field | Type | Meaning |
|---|---|---|
| `perVillager` | `number` | `span.duration / span.villagerDelta` of the **last usable span** |
| `perStep` | `number` | `span.duration / span.stepCount` — the build's own cadence |
| `measured` | `boolean` | `false` when the nominal fallback was used |
| `villagerClockReliable` | `boolean` | `perVillager <= 30` — whether villagers can tell the time here |

Derived from the build's own last usable span. When no usable span exists, falls back to the single
permitted constant (~20 s/villager, A-3) with `measured: false`.

**Choosing the advance** (FR-008a) is by *signal*, not preference:

| The step… | Advance by |
|---|---|
| adds villagers, `villagerClockReliable` | `gained × perVillager` |
| adds villagers, **not** reliable | `gained × 20 s` nominal |
| adds **nobody** | `perStep` |

A step that adds villagers took as long as those villagers took to make, so charging it a
multi-minute step cadence is the same implausibility the reliability check exists to reject. Only a
step adding nobody has no villager signal at all. The same 30 s threshold governs interpolation
(FR-007a), where an implausible span places its interior at the nominal rate from the left anchor
rather than smearing villagers across a gap the author simply skipped.

---

## 5. `Horizon` — internal, now load-bearing twice

| Field | Type | Meaning |
|---|---|---|
| `steps` | `number` | 8, counted from the last anchor |
| `seconds` | `number` | `max(120, 0.25 × (lastAnchor − firstAnchor))` — **relative to the build's own measured span** |

Whichever binds first (FR-009), **except that the first step past the last anchor is always placed**
(FR-009a). Past the horizon, entries are `unresolved` — which under FR-014 also means the build loses
autoplay, so this governs both how far a line is drawn and whether a build is playable (A-11).

The duration bound is a share rather than a constant because **a step is not a unit of time**. Dark
Age steps land ~20 s apart; a single Imperial step can be four minutes. A flat cap sized for the
opening refuses late-game builds on their *first* projected step — which is what a real build did,
and how this was found.

---

## 6. `AgeTiming` — modified, additively

Returned by `getAgeTimings()`. **`derived` is retained** so the five existing consumers need no change
(R-2).

| Field | Type | Status | Meaning |
|---|---|---|---|
| `age` | `number` | unchanged | 2, 3, 4 |
| `seconds` | `number` | unchanged | When the age was reached |
| `derived` | `boolean` | **retained** | `provenance !== "stated"`. Drives `~` everywhere today. |
| `provenance` | `string` | **new** | The finer tier, read only by the detail-page footnote |
| `villagers` | `number \| null` | unchanged | Pop on arrival |
| `clickUpVillagers` | `number \| null` | unchanged | Pop when aging up began |
| `clickUp` | `object \| null` | unchanged | Also gains `provenance` beside its own `derived` |

**Consumers and what they read** — the table R-2 was written from:

| File | Reads | Changes? |
|---|---|---|
| `AgeChips.vue` | `derived` | No |
| `BuildListCard.vue` | `derived` | No |
| `AgeTimeline.vue` | `derived`, **`provenance`** | Footnote copy only (FR-020) |

---

## 7. `StoredAgeTimings` — persisted, unchanged shape

`build.ageTimings` on the build document, copied hourly into the home snapshot.

```
{ feudal?: { t: number, e: boolean }, castle?: …, imperial?: … }
```

`t` seconds, `e` estimated. **Not widened to a tri-state** (R-3): one bit on 4k documents, plus a
second copy in the home snapshot, to distinguish two tiers that render identically on every surface
except one footnote.

| Direction | Mapping |
|---|---|
| write | `e = timing.derived` — both derived tiers collapse to `true` |
| read | `provenance = e ? "interpolated" : "stated"` |

**Consequence accepted**: a build read from the stored field reports an extrapolated age as
`interpolated`, so its footnote errs toward the humbler claim. Bounded — an age boundary is a step
authors nearly always stamp, so an *extrapolated age* is rare (R-3).

**Staleness affects one surface.** Every stored value was computed by the defective resolver, and the
memoized `useAgeTimings()` prefers stored over derived — but its only consumer is `BuildListCard`.
`AgeTimeline` and `FocusMode` call `getAgeTimings()` / `getTimings()` directly and derive fresh, so
the detail view and Focus mode are correct as soon as the code ships. The backfill fixes **list-card
and home-lane chips**, and is a SHOULD rather than a release gate (R-1 correction, NFR-002a).

---

## 8. `EcoSeries` — modified, additively

| Field | Type | Status | Meaning |
|---|---|---|---|
| `points` | `Array` | **modified** | `{ seconds, stated, builders, food, wood, gold, stone }` |
| `coverage` | `number` | unchanged | Stated steps ÷ flattened steps |
| `lastStatedSeconds` | `number \| null` | unchanged | Drives the existing tail note |

`stated` is **per point**, not a single split position. An earlier design carried one
`lastAnchorSeconds` scalar and dashed everything past it — cheaper, and wrong for this corpus: with
roughly half of builds stamped sparsely, it drew long derived stretches as confident solid line. A
segment is now solid only when both its ends were measured (FR-022), which needs every point's
provenance, not just the last one's.

The coverage gate (`≥50%` of steps, `≥4` plotted points) is **unchanged in both halves** (FR-017) —
but note it now admits more points, because extrapolation places steps that previously resolved to
nothing. More builds clear the floor. That is intended, and it is what SC-003's provenance
distribution measures.

---

## Flow

```
build.steps
  └─ flattenSections()                    unchanged, shared by both charts
       └─ resolveStepTimes()              NEW — the only place a step gets a time (FR-002)
            ├─ getTimings()               strict wrapper → [{ startTime }] | null   (FocusMode gate)
            ├─ useAgeTimings()            → AgeTiming[]  (+provenance, keeps derived)
            │    └─ toStoredAgeTimings()  → StoredAgeTimings  → Firestore → home snapshot
            └─ useEcoSeries()             → EcoSeries   (+per-point `stated`)
```

`FocusMode` is the one consumer that calls **two** of these: `getTimings()` for the binary gate and
`resolveStepTimes()` for the per-step provenance it needs to place the `~` (R-5).
