# Data Model: Remix Lineage and Credit (044)

All new fields live on `builds/{id}`. No new collection.

| Field | Type | Written by | Read by |
|---|---|---|---|
| `remixOf` *(existing)* | `{ id, title, author, authorUid }` · `null` · absent | client (remix paths); `link-remixes.mjs` once | credit line; daily job (edges) |
| `duplicateOf` | `null` · `{ id, title, author }` — **present on every build** | daily job; seed; `addBuild` writes `null` | every public list query; BuildDetails (canonical, notice); BuildListCard in My Builds |
| `stepsHash` | string (SHA-1 hex) · `null` when the build has < 5 step rows | daily job; seed | daily job |
| `stepsSince` | Timestamp — when the server first saw the current `stepsHash` | daily job; seed (= `createTime`) | daily job (originality order) |
| `remixCredit` | integer ≥ 0 — distinct other accounts with a build linking here | daily job | `activityTotal` (trend, all-time) |
| `remixes` | `{ count, items: [{ id, title, author }] }` (≤ 10 items) · absent when count 0 | daily job | BuildDetails remix line |
| `trendWeights` *(existing)* | integer, becomes **3** | daily job | daily job (rebase) |

## Derivations (daily job, every build)

**Fingerprint.** Step rows as in research R4; `stepsHash = sha1(rows.join("\n"))`
if `rows.length ≥ 5`, else `null`. If it differs from the stored one,
`stepsSince = now`; on first sight (field absent) `stepsSince = createTime`.

**Duplicate marks** — published builds only (`isDraft === false`), grouped by
`(civ, stepsHash)`, `stepsHash != null`:

1. Order the group by `stepsSince`, then `createTime`, then id.
2. The **original author** is the author of the first build.
3. The **listed build** is that author's build in the group with the highest
   `scoreAllTime` (ties: earliest by the same order).
4. Every other build in the group: `duplicateOf = { id, title, author }` of the
   listed build. The listed build, and every published build in no group of two
   or more: `duplicateOf = null`.

Unlisted builds keep `duplicateOf = null` (they are in no list anyway), so
publishing one is judged at the next run.

**Remix edges** — every build `b` with `remixOf.id = t` where `t` exists and
`b.authorUid != t.authorUid`:

- `remixCredit(t)` = number of distinct `b.authorUid`.
- `remixes(t)` = those `b` with `b.isDraft === false`; `count` = their number,
  `items` = top 10 by `scoreAllTime`.

A remix of a remix credits its direct parent only. A deleted remix or removed
link drops out at the next run (credit withdrawn).

**Activity.** `activityTotal = views + 25·upvotes + 100·likes + 50·remixCredit`;
`WEIGHTS_VERSION = 3`.

## State of `duplicateOf` for one build

```text
null ──(published, same steps as an earlier/more active build)──▶ {id,…}
{id,…} ──(steps edited · original deleted/unlisted · build unlisted)──▶ null or {other id,…}
```

Each transition happens only in the daily job; the author sees the result the
next morning.

## Writes per night

Only changed fields are written, in batches of ≤ 500, as today. A quiet day
changes trends (as now) plus a handful of `stepsHash`/`duplicateOf`/`remixes`.
The first run after release writes every build once (rebase), well inside the
20k free writes a day.
