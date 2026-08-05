# Contract: `resolveStepTimes(steps)`

**Module**: `src/composables/builds/timingsHelper.js` | **Status**: new export

The single place in the codebase where a step is assigned a time (FR-002). Every other timing path
reads its output.

---

## Signature

```js
resolveStepTimes(steps) → Array<{ seconds: number|null, provenance: Provenance }>
```

- `steps` — a **flat, ordered** step list. Callers flatten via `flattenSections()` first; this
  function does not know about sections.
- Returns one entry per input step, **index-aligned**, always. Never `null`, never short, never
  throws (FR-012).
- `Provenance` = `"stated" | "interpolated" | "extrapolated" | "unresolved"`.

---

## Resolution order

Per step, first rule that applies wins:

1. **stated** — the step's own `time` parses. Returned unmodified, never smoothed or reordered (A-7).
2. **interpolated** — the step lies between two anchors, or between the implicit `0:00` bound and the
   first anchor.
3. **extrapolated** — the step lies after the last anchor and within the horizon.
4. **unresolved** — everything else: past the horizon, or a build with no anchors at all.

An **anchor** is a step whose own timestamp parses (FR-004). A villager count is *not* required — it
decides only whether the span can be divided proportionally. The implicit `0:00` is a bound, not an
anchor (R-8).

---

## Interpolation

Within a span, distribute the **measured** duration in proportion to running villager deltas.

- Villager counts are **running** — a step stating no cells inherits the last stated count and
  therefore contributes a delta of zero (FR-005, fixes D2).
- The span is **usable** iff `villagerDelta > 0`. Otherwise fall back to **even spacing by step
  position** (FR-007, fixes D1 and D4), still reported as `interpolated` — the endpoints are
  measured; only the interior shape is assumed.
- Results are clamped to `[from.seconds, to.seconds]` and forced non-decreasing.

---

## Extrapolation

After the last anchor, advance by an **observed rate** — `span.duration / span.villagerDelta` of the
build's last usable span (FR-008). Only a build with no usable span falls back to the nominal
constant.

Stops at the horizon: **8 steps**, or **25% of the build's own measured span** (first anchor to last)
floored at **120 s** — whichever binds first (FR-009). Beyond it, `unresolved`.

The duration bound is relative because a step is not a unit of time: Dark Age steps land ~20 s apart,
an Imperial step can be four minutes. **The first step past the last anchor is always placed**
regardless (FR-009a) — it is one step of rate error, and refusing it costs the whole build its
autoplay.

---

## Guarantees

| # | Guarantee |
|---|---|
| G-1 | Output length equals input length, always |
| G-2 | `seconds` is finite or `null` — never `NaN`, never `Infinity` |
| G-3 | `seconds >= 0` when non-null |
| G-4 | Entries with `provenance !== "stated"` are monotonically non-decreasing |
| G-5 | `seconds === null` ⟺ `provenance === "unresolved"` |
| G-6 | A `gameplan` note is always `unresolved`, is never an anchor, and never blocks its neighbours |
| G-7 | Never throws, for any input including `null`, `[]`, and malformed steps |
| G-8 | Reads only each step's `time` and its five resource cells — never civ, landmarks, or techs (FR-012, SC-008) |

G-4 excludes `stated` deliberately: authors type times out of order and A-7 forbids rewriting them.

---

## Worked examples — the four Evidence shapes

Each is a defect reproduced against `main`. "Today" is observed output, not predicted.

### D1 — zero villager delta

```
[0] 10:00  10 vils
[1]   —    10 vils
[2] 11:00  10 vils
```

| | `[1]` |
|---|---|
| today | `NaN`, and the build still reports as **valid** |
| required | `630`, `interpolated` — even spacing, the span being unusable |

### D2 — cell-less step inside a span

```
[0] 2:00  6 vils
[1]  —    7 vils
[2]  —    (no cells — an age-up click)
[3]  —    9 vils
[4] 4:00  10 vils
```

| | `[2]` | `[3]` |
|---|---|---|
| today | `210` | **`480`** — four minutes past the span it lives in |
| required | within `[120, 240]`, non-decreasing | within `[120, 240]`, `>= [2]` |

`[2]` inherits 7 (FR-005) instead of reading 0, so it contributes a zero delta rather than claiming
the full next count.

### D3 — a gameplan note

```
[0] 2:00  6 vils
[1]  —    7 vils
[2] note
[3]  —    9 vils
[4] 4:00  10 vils
```

| | result |
|---|---|
| today | `getTimings()` → **`null`** for the whole build |
| required | `[2]` is `unresolved`; `[0]`,`[1]`,`[3]`,`[4]` all resolve; `getTimings()` returns non-`null` |

### D4 — decreasing villagers

```
[0] 2:00  10 vils
[1]  —     9 vils
[2] 4:00   8 vils
```

| | `[1]` |
|---|---|
| today | `180` from a negative divisor — right by luck, wrong by construction |
| required | `180`, `interpolated` via even spacing (span unusable, `villagerDelta < 0`) |

---

## Non-goals

- No civilization, landmark, or technology input of any kind (SC-008).
- No correction of author-stated times, however implausible (A-7).
- No memoization — callers own that. `useAgeTimings` and `useEcoSeries` are already `computed`.
