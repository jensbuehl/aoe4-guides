# Data Model — `021-economy-lines`

**Phase 1 output.** Everything here is **derived at render time**. Nothing is stored, fetched,
written, or indexed — there is no schema change and no migration.

## Source (existing, unchanged)

`build.steps` — either the sections array or, for builds saved before sections existed, a flat step
array. The fields this feature reads from a step:

| Field | Type | Notes |
|---|---|---|
| `time` | `string` | `m:ss`, frequently absent or malformed (`"<br>"`, `"~4:20"`). Parsed only via `toDateFromString` |
| `food` / `wood` / `gold` / `stone` | `string` | Villager counts, often `"4+1"`. Parsed only via `parseVillagerCountString` |
| `builders` | `string` | Drawn as a fifth line. Villagers pulled off gathering are part of the distribution, and its dips read as them returning to resources |
| `type` / `age` | `string` / `number` | Section-level; used by the existing age derivation, not here |

## `EcoPoint` — one plotted moment

| Field | Type | Rule |
|---|---|---|
| `seconds` | `number` | The step's x on the timeline. Resolved stated-first, interpolated-second (see below) |
| `builders` | `number` | Villagers on construction **at this step**, read from its own cell |
| `food` | `number` | as above |
| `wood` | `number` | as above |
| `gold` | `number` | as above |
| `stone` | `number` | as above |

**Invariants**

- **A point is one step's own reading, not a running state.** A step that assigns anybody states its
  whole distribution; its blank cells are zero, not "unchanged" (FR-003). Nothing carries forward.
- **The five counts sum to that step's `N vils` figure**, because both read the cells the same way.
  This is the invariant that keeps the plot and the markers honest, and it is what carry-forward
  broke: on a step showing only `wood 7`, the marker says 7 while a carried plot claimed 13.
- A step that assigns **nobody at all** — age-up, comment, bare timestamp — contributes **no point**
  (FR-004). Drawing it would drop every line to zero for a step that made no claim about anything.
- A blank cell and a typed `"0"` are identical, which is also how the build order table renders them
  (both `–`) and how `aggregateVillagers` counts them.
- Points are sorted ascending by `seconds`. Duplicate or backwards timestamps are tolerated: sorting
  is by the resolved time, and x is clamped to the track.
- A step that states cells but cannot be placed on the time axis contributes no point, yet still
  counts toward coverage — the author filled it in; they just gave it no time to hang it on.

### Time resolution (per step, in order)

1. **Stated** — `toDateFromString(step.time)` parses → use it. Authoritative; this is the same rule
   the age crests use, which is what keeps the two charts aligned.
2. **Interpolated** — otherwise, `getTimings(flat)[i].startTime`, if that call returned a value.
3. **Unplottable** — otherwise, no point.

`getTimings` is called once per derivation, inside `try`/`catch`, and its `null` return is **not**
fatal (R-1). Under the spec as originally written it was, which would have hidden the feature on
every build whose trailing steps are unstamped.

The helper itself is unchanged. Focus mode reads the same call strictly — a `null` there means
autoplay is unavailable, which is the right answer, since a build either plays through or it does
not. Only this chart reads it leniently (A-9, SC-007).

## `EcoSeries` — the composable's return value

| Field | Type | Rule |
|---|---|---|
| `points` | `EcoPoint[]` | Ascending by `seconds`. Length ≥ 4 whenever the series is non-`null` |
| `coverage` | `number` | `statedSteps / flatSteps`, in `[0, 1]`. The share of the build its author filled in |
| `lastStatedSeconds` | `number \| null` | Time of the last point — the last moment the build says anything about its economy. The lines end here; if the build's ages continue past it, the legend says so |

**The whole return is `null`** — meaning no Economy row at all, never an empty or degraded chart —
when any of:

- `steps` is empty, or is a legacy flat build (`steps[0].type` undefined) — R-7;
- `coverage < 0.5` — the ratio half of the gate, measuring whether the author filled the build in;
- fewer than **4 plotted points** state a resource cell — the floor half, measuring whether the
  chart has a shape. Counted over plotted points rather than stated steps, because after R-1 those
  are no longer the same number (R-2). A build with no plottable points at all fails here;
- anything throws. The composable never propagates an exception into render (FR-007).

**Memoization**: a `computed` over the `steps` prop, mirroring how `ages` is derived in
`AgeTimeline.vue` today. Derivation runs when the card renders; the SVG mounts only on expand.

## `EcoOpen` — the reader's disclosure preference

| Aspect | Decision |
|---|---|
| Scope | Per reader, **not** per build. Opening on build A means build B opens expanded |
| Storage | One `localStorage` key, device-local, mirroring the theme preference |
| Default | Collapsed, for a reader with no stored value (FR-015) |
| Signed-in vs out | Identical. Never read from or written to the account |
| Failure | Storage unavailable (disabled, quota, private mode) degrades to "collapsed, does not persist" — reads and writes are wrapped, never thrown during render |

## Derived geometry (not persisted, listed so both charts agree)

| Value | Rule | Owner |
|---|---|---|
| `scaleSeconds` | `max(960, ceil(longestAge / 240) * 240)` | **`AgeTimeline.vue`** — passed to `EcoLines` as a prop, never recomputed (FR-009) |
| `ages` | `getAgeTimings(steps)` | **`AgeTimeline.vue`** — passed down; guides are drawn from it, so guide x ≡ crest x (R-3) |
| y-axis max | `max(16, ceil(maxValue / 4) * 4)` | `EcoLines.vue`. Floor of 16 so two builds in two tabs stay comparable, sized to what one resource reaches rather than to the dropped total line |
