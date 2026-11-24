# Data Model: Vote Integrity (042)

No migration. Two fields are added; one is frozen; nothing is removed.

## `favorites/{uid}` — an account's lists

| Field | Type | Who writes | Change in 042 |
|---|---|---|---|
| `favorites` | string[] (build ids) | owner, bound to `builds/{id}.likes` | no length cap (was 30, app-only) |
| `upvotes` | string[] | owner, bound to `builds/{id}.upvotes` | bound |
| `downvotes` | string[] | nobody (client); account cleanup (Admin) | **frozen** |
| `lastChange` | `{ list: "favorites" \| "upvotes", buildId: string }` | owner | **new** — declares the one id a write adds or removes (research R2) |
| `id`, `timeCreated`, `timeUpdated` | legacy | nobody | unchanged, unread |

**Invariants after 042** (for changes made after deployment):
- A write changes at most one of `favorites`/`upvotes`, by exactly the id in `lastChange.buildId`.
- An addition happens only with `+1` on the matching counter of that build, from a verified account.
- A removal happens with `−1`, or with no step when the build is gone or its count is ≤ 0.
- The document cannot be deleted by a client (deletion is account cleanup's, Admin SDK).

Measured 2026-11-24: 5,099 documents; favourites on 1,708 accounts (median 2, p90 11, max 58; 5 above
30); upvotes on 878 (max 125); downvotes on 97 (max 13).

## `builds/{id}` — counters and scores

| Field | Change in 042 |
|---|---|
| `likes` | ±1 only together with the caller's `favorites` list (R1); never below 0 |
| `upvotes` | ±1 only together with the caller's `upvotes` list; never below 0 |
| `downvotes` | **frozen** for clients; still `0` on create; no longer read by any score |
| `views`, `comments` | unchanged |
| `trendWeights` | **new**, server-owned (number). The weighting version `trend`/`trendBase` were last measured under. Absent = 1 (views 1, upvotes 5, downvotes −10, likes 50); 042 = 2 |
| `trend`, `trendBase`, `trendAt`, `score`, `scoreAllTime` | unchanged meaning; values change with the new weights |

`trendWeights` joins `serverOwned()` in the rules, the create-time "must be absent" list, and
`NON_EDITABLE_FIELDS` in `buildService.js` (the three lists are transcribed copies of each other).

## Activity weighting (`functions/builds/trend.js`)

```
activityTotal = 1·views + 25·upvotes + 100·likes          (version 2)
was             1·views +  5·upvotes +  50·likes − 10·downvotes   (version 1)
```

### `nextTrend` states

| Stored state | Result | Writes |
|---|---|---|
| no finite `trendBase` or no `trendAt` | **seeded**: trend 0, base = total | trend, base, at, weights |
| `trendWeights` ≠ current | **rebased**: trend decayed, no delta added, base = total under new weights | trend, base, at, weights |
| unlisted | **held**: trend 0, base = total | (if changed) |
| trend 0 and delta 0 | **unchanged** | nothing |
| otherwise | **updated**: trend = decayed + delta | trend, base, at |

## Check snapshot (`scripts/.scratch/vote-gaps/<date>.json`, local only)

```json
{
  "takenAt": "2026-11-24T…Z",
  "project": "aoe4-guides",
  "builds": { "<buildId>": { "title": "…", "isDraft": false,
                             "likes": 12, "likesHolders": 9, "upvotes": 3, "upvotesHolders": 3 } },
  "nonFinite": ["<buildId>", …],
  "lengths": { "favorites": { "1-5": 1306, … }, "upvotes": { … } }
}
```

Build ids, titles and counts only — all public. No account ids (FR-003).

## My Favorites in memory

`applyListConfig(builds, config) → builds` — pure; see research R8 for the exact semantics it mirrors.
The page keeps the full loaded array (cached in `store.state.cache.myFavoritesList`), derives
`filtered = applyListConfig(all, filterConfig)`, `count = filtered.length`, and shows
`filtered.slice(page·10, page·10 + 10)`.
