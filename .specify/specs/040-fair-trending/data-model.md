# Data Model: Fair Trending

## `builds/{id}` — changed fields

| Field | Type | Written by | Change |
|---|---|---|---|
| `views` | number | any client, **+1 only** | was: any value |
| `likes`, `upvotes`, `downvotes` | number | signed-in client, **±1 only** | was: any value, no sign-in |
| `comments` | number | signed-in client, **±1 only** | was: any value, no sign-in |
| `score` | number | scheduled job only | was: also writable by the author. Meaning changes at the switch (below) |
| `scoreAllTime` | number | scheduled job only | was: also writable by the author. Meaning unchanged |
| `trend` | number ≥ 0 | scheduled job only | **new**: decayed recent activity, in activity units |
| `trendBase` | number | scheduled job only | **new**: activity total at the last recalculation |
| `trendAt` | timestamp | scheduled job only | **new**: when `trend`/`trendBase` were last written |
| `authorUid` | string | creating author | now **immutable** after create (was: replaceable — R2) |

Every other field keeps today's rules: the author may change it, nobody else may.

On **create**, `views`, `likes`, `upvotes`, `downvotes`, `comments`, `score` and `scoreAllTime` must be
absent or 0, and `trend`, `trendBase`, `trendAt` must be absent. All three creating paths already
comply (`BuildEditor.vue:475-481`, remix at `BuildDetails.vue:750-754`, `useImportOverlayFormat.js:25-31`).

### Derived: activity total

`total = views + 5·upvotes − 10·downvotes + 50·likes`, missing fields as 0. Not stored; recomputed each
run. Same weighting as the current `calculateScore` (FR-013).

### `score` across the switch

| Phase | `score` holds | written |
|---|---|---|
| Today and the shadow week (`TRENDING_SOURCE = "legacy"`) | `ln(max(total,1))` × age penalty after week 6 | weekly, Fri 00:00 UTC |
| After the switch (`"recency"`) | `ln(1 + trend)` | daily, 23:30 UTC |

### Trend lifecycle per build

```
           first run sees no trendBase
 (absent) ───────────────────────────────► seeded: trend 0, trendBase = total
                                                │
              isDraft == true at a run          │ isDraft == false at a run
        ┌─────────────── held ◄─────────────────┤
        │  trend 0, trendBase = total           ▼
        └──── published ──────────────► live: trend = max(0, trend·½^(days/7) + Δtotal)
                                                │          (< 0.1 → 0)
                                                ▼
                                   deleted → document gone, nothing carried over
```

"Held" is what keeps an unlisted build's shared-link views from landing as one burst on the day it is
published (FR-019).

## `contributors/{uid}` — changed rules, no new fields

| Field | Who | Allowed change |
|---|---|---|
| `viewCount` | anyone | +1 |
| `viewCount` | the contributor themselves | any decrease (build deletion) |
| `boCount` | the contributor themselves | ±1 |

Was: anyone could set either to any value.

## Browser storage — `localStorage["aoe4guides.viewed"]`

`{ [buildId: string]: lastCountedMs: number }`. Entries older than 24 h are removed on every write.
Never leaves the device. Absent, unreadable or throwing storage → a module-level `Map` stands in for
the current page load.
