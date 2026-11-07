# Contract: the Trending order

Who reads `score`, and what each of them is promised.

| Reader | Where | Promise |
|---|---|---|
| Home "Trending" lane and hero | `updateHomeSnapshot.js:165` → `home/home.popularBuilds` | top 10 by `score` desc, refreshed every 6 h |
| Build list sort "Trending" | `FilterConfig.vue:447`, default config `configDefaultProvider.js:21` | live Firestore `orderBy("score", "desc")` |
| Civ dashboard trending lane | `Dashboard.vue:206` | same |
| Public API `GET /builds?orderBy=score` | `aoe4-guides-api` `BuildOrderByField` | same field, same direction |

**What changes for them**: the order, once `TRENDING_SOURCE` is `"recency"`. Nothing else — same field
name, same direction, same indexes, a number in the same range (0 to roughly 10).

**What is not promised, before or after**: the number's meaning. `score` is an ordering key. The API's
model describes it as "the current dynamic score assigned by the platform", which stays true; the
README needs no change. If the description is ever made more specific, it should say "higher means more
recent activity", never a formula.

**`scoreAllTime`** is unchanged in meaning, cadence and writer.

**Extra fields in API responses.** The API returns build documents as stored (`doc.data()` in
`BuildsController.ts`), so from the first `updateBuildTrend` run its JSON also carries `trend`,
`trendBase` and `trendAt` (the last as a timestamp object, the same shape `timeCreated` already has).
They're not in the API's model and nothing promises them. They're already public through Firestore,
so this exposes nothing new. If the API ever starts projecting fields, they should be left out.
