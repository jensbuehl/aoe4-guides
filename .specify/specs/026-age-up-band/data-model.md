# Phase 1 Data Model: Age-Up Band

**Feature**: `026-age-up-band` | **Date**: 2026-08-07

Nothing is persisted and nothing new is derived. These are the client-side shapes that exist for
the duration of one render. Every value below is already returned by `getAgeTimings()` today.

---

## 1. Age Timing *(existing — unchanged)*

Returned by `getAgeTimings(steps)`, one per age the build reaches.

| Field | Type | Notes |
|---|---|---|
| `age` | `2 \| 3 \| 4` | Feudal, Castle, Imperial |
| `seconds` | `number` | Arrival — when the age was reached |
| `derived` | `boolean` | Arrival was not stated by the author |
| `provenance` | `"stated" \| "interpolated" \| "extrapolated"` | Read only by the tooltip footnote |
| `villagers` | `number \| null` | Count at arrival |
| `clickUpVillagers` | `number \| null` | Count at click-up |
| `clickUp` | `object \| null` | The transition — see below |

### `clickUp` *(existing — unchanged)*

| Field | Type | Notes |
|---|---|---|
| `seconds` | `number` | When the player clicked up |
| `derived` | `boolean` | Click-up was not stated by the author |
| `provenance` | as above | |
| `villagers` | `number \| null` | |
| `duration` | `number` | `arrival − clickUp`. **May be `0`** — see research R-5 |

**This feature adds no field to either shape.** `getAgeTimings()` is not modified.

---

## 2. Track Run *(the one new shape)*

`getAgeSegments(ages, scaleSeconds)` currently returns one kind of thing. It now returns two, in
time order, cut from `[0, scaleSeconds]`.

### 2a. Age run — *byte-identical to today's segment*

| Field | Type | Value |
|---|---|---|
| `key` | `string` | `age-seg-${n}`, `n` = 1…`ages.length + 1` |
| `width` | `number` | Percent of the track |

`n` is **positional, not the age number**: run `n` is the *n*th age of this build's life. Run 1 is
Dark up to the first arrival; run `ages.length + 1` runs from the last arrival to the end of the
track (research R-4).

### 2b. Transition band — *new*

| Field | Type | Value |
|---|---|---|
| `key` | `string` | `age-band-${n}`, where `n` is the index of the age run it **leads into** |
| `width` | `number` | Percent of the track |

A band leading into `ages[i]` has `n = i + 2`, so it shares its index with the age run that follows
it and therefore its ramp colour (FR-004, research R-4).

**No provenance field** *(revised 2026-08-07)*. An earlier draft carried
`estimated: age.derived || age.clickUp.derived` so the band could be hatched when either end was
derived. US2 was withdrawn and every band is now striped, so the field went with it: a run is
exactly `{ key, width }` and nothing about certainty reaches the track. The `~` on the crest and in
its tooltip is the whole of it (FR-009, FR-012).

---

## 3. Invariants

These are the properties the implementation must hold, and what each one is protecting.

| # | Invariant | Protects |
|---|---|---|
| **I-1** | The runs' widths sum to 100% of the track | FR-007, SC-004 |
| **I-2** | Runs are emitted in ascending time order with no gaps and no overlaps | FR-007 |
| **I-3** | A build with no drawable band produces the **exact** array it produces today | NFR-003, FR-018, SC-006 |
| **I-4** | Every band's `key` index matches the age run immediately after it | FR-004 |
| **I-5** | `getAgeTimings()` output is unchanged | FR-012, FR-020 |
| **I-6** | Every run has exactly the fields `key` and `width` — no provenance reaches the track | FR-009 |

---

## 4. Band admission rules

A band is emitted for `ages[i]` **only if all four hold**. `previous` is the running cursor — the
previous age's arrival, or `0` for the first age.

| Rule | Condition | Requirement | Failing case |
|---|---|---|---|
| **A-1** | `age.clickUp` is non-null | FR-013, FR-014 | No `ageUp` section, or its timing did not resolve |
| **A-2** | `age.clickUp.seconds < age.seconds` — **strictly** | FR-015 | `duration === 0`; timestamps typed out of order |
| **A-3** | `age.clickUp.seconds >= previous` | FR-016 | Click-up resolves before the previous age arrived |
| **A-4** | `scaleSeconds > 0` | — | Guard already present |

Where any rule fails, the age run is emitted whole — from `previous` to `age.seconds` — exactly as
today. **No band is ever clamped, shortened or shifted to make it fit**: it is drawn as authored or
not at all (spec A-1, FR-016).

`A-2` is strict on purpose. Zero-duration click-ups exist in the data because
[useAgeTimings.js:270](../../../src/composables/builds/useAgeTimings.js#L270) admits `<=`; drawing
one produces a zero-width flex child rather than a visible defect (research R-5).

---

## 5. Worked example

Build with Feudal 2:30 (clicked 2:00, both stated), Castle 6:10 (clicked 5:20, arrival derived),
Imperial never reached. `scaleSeconds = 480`… extended to `720` by a step at 11:20.

| Order | Run | Span | Width | Notes |
|---|---|---|---|---|
| 1 | `age-seg-1` | 0:00 → 2:00 | 16.7% | Dark |
| 2 | `age-band-2` | 2:00 → 2:30 | 4.2% | Striped, Feudal hue |
| 3 | `age-seg-2` | 2:30 → 5:20 | 23.6% | Feudal |
| 4 | `age-band-3` | 5:20 → 6:10 | 6.9% | Striped, Castle hue — identical treatment despite the derived arrival |
| 5 | `age-seg-3` | 6:10 → 12:00 | 48.6% | Castle, to the end of the track |

Sum = 100.0% (I-1). Five runs where today there would be three. Both crests stay at 2:30 and 6:10,
untouched (FR-020).

---

## 6. What this model deliberately does not have

- **No band entity outside the run list.** The band exists only as a run; there is no parallel
  "transitions" array for something else to read and drift from.
- **No `kind` discriminator.** The `key` prefix carries it, and the template needs no branch —
  see the contract.
- **No age→colour map.** Index carries colour (R-4). A map is the thing that would let a band and
  its segment disagree.
- **No minimum width.** FR-008 forbids one: a floor would make a short transition look longer than
  it was, which is the single claim this card must never make.
