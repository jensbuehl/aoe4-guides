# Data Model: Build Search (043)

No Firestore schema changes. The feature reads fields that builds already carry and writes one
Storage object.

## Source: `builds/{id}` (Firestore, read by `updateBuildTrend`)

Fields read. The first group is already in the job's `select()`; the second is added by this
feature:

| Field | Type | Use |
|---|---|---|
| `title` | string | matched; displayed |
| `isDraft` | boolean | `true` = unlisted, **never written to the index** (FR-007) |
| `score` | number | rank among equal matches (FR-004). Taken from the score the job just computed, not the stored one |
| `author` | string | display name: matched and displayed. *New in select.* |
| `authorUid` | string | author link `/builds?author=<uid>`. *New in select.* |
| `civ` | string | civ code (`RUS`, `ANY`, …): matched through the civ list. *New in select.* |
| `season` | string | `"Season 12"`, displayed as a chip. *New in select.* |
| `ageTimings` | map | `{ castle: { t: seconds, e: estimated } , … }` as written by `toStoredAgeTimings` (`src/composables/builds/useAgeTimings.js`); only `castle` is used. *New in select.* Absent on builds that were never stamped or have no times. |

Non-finite or missing values are normalised. Each fallback below has a reason taken from
`updateBuildTrend`'s own `NaN` comment:

| Field | Fallback |
|---|---|
| `title` | `""` |
| `author` | `""` |
| `authorUid` | `""` (no author link rendered) |
| `civ` | `"ANY"` |
| `season` | `""`, stored as `0` (see below) |
| `score` | `0` when not finite |
| `ageTimings.castle.t` | `null` when absent or not a finite non-negative number; rounded to whole seconds |
| `ageTimings.castle.e` | `0` when absent; `1` when truthy |

## Output: `search/builds.json` (Firebase Storage)

One JSON object. Gzip-encoded at rest (`Content-Encoding: gzip`), with
`Cache-Control: public, max-age=3600`.

```jsonc
{
  "v": 1,                                   // format version; the reader rejects unknown majors
  "generated": "2026-11-24T23:30:02.000Z",  // ISO time the job STARTED READING (see below)
  "authors": [                              // de-duplicated; index = position
    ["3fK9…uid", "Kestrel"],                // [authorUid, displayName]
    ["", "SomeName"]                        // no uid: keyed by name, no author link
  ],
  "builds": [                               // listed builds only, sorted by score desc
    ["00I7J47dv26cPbKmXYkO", "Rus 2TC into Fast Castle", 0, "RUS", 12, 41.2, 525, 0],
    ["0A1b…", "Fishing boom", 1, "ENG", 11, 3.1, null, 0]
    // [id, title, authorIndex, civCode, seasonNumber, score,
    //  feudalSeconds, feudalEstimated, castleSeconds, castleEstimated]
  ]
}
```

| Position | Field | Rules |
|---|---|---|
| 0 | `id` | Firestore document id |
| 1 | `title` | as stored, not normalised (display needs the original) |
| 2 | `authorIndex` | index into `authors`. Authors are keyed by `authorUid`, falling back to the name when there is no uid |
| 3 | `civCode` | as stored |
| 4 | `seasonNumber` | integer parsed from `"Season N"`; `0` when absent or unparseable |
| 5 | `score` | rounded to 2 decimals |
| 6 | `feudalSeconds` | integer seconds, or `null` when the build has no Feudal time |
| 7 | `feudalEstimated` | `1` when worked out rather than stated by the author, else `0` (always `0` when 6 is `null`) |
| 8 | `castleSeconds` | integer seconds, or `null` when the build has no Castle time |
| 9 | `castleEstimated` | as 7, for the Castle time |

**Invariants**, enforced by the builder and asserted by `check:search`:
- No row whose source has `isDraft === true`.
- Every build row has exactly 10 elements.
- `authors[authorIndex]` exists for every row.
- `builds` sorted by `score` descending, so equal-tier matches already come out in Trending order
  and the reader's sort is stable on top of it.
- **`generated` is taken before the Firestore read, not at upload.** The hide list retires an entry
  once `generated` is later than the entry's `at`. If `generated` were the upload time, an author
  who unlists *between* the job's read and its write would have the entry retired while the index
  still contains the build, and it would reappear on their device for a day.

**Publish guard (FR-010)**: the job reads the previous object's custom metadata `buildCount` and
**does not overwrite** when the new count is `0` or below 50% of the previous one. It reports
`updateBuildTrend: search index withheld` with both counts through `logger.error`, so Error Reporting
raises it rather than leaving it in a log nobody reads. It writes `buildCount` and
`generated` as custom metadata on each upload. The `written` log line also carries
`withFeudal`, `feudalEstimated`, `withCastle` and `castleEstimated`, for FR-028. It logs a warning when the gzipped size passes
300 KB (SC-004).

**Versioning**: `v` changes only on a breaking change of positions. Because the file and the app
release separately (decision document §4), a format change must be read-compatible for at least
one day. Either the reader accepts `v` and `v+1`, or the job writes a new object name for the new
version.

## Client: loaded index (memory only)

Derived once per page session after fetch, inside `useSearchIndex`:

| Field | Derivation |
|---|---|
| `entries[i].hay` | normalised `title + author name + civ code + civ title + civ aliases` |
| `entries[i].words` | normalised title words, for prefix and fuzzy matching |
| `authors[j].count` | number of builds per author, for the author result and duplicate names (spec edge case) |
| `generatedAt` | `Date` from `generated` |

The in-flight fetch promise is shared, so opening search twice while loading downloads once (the
lesson from the home snapshot's triple read). The parsed index is kept in module scope for the page
session. Across sessions the HTTP cache serves it.

## Client: hide list (`localStorage`)

Key `aoe4guides.search.hidden`, value `[{ "id": string, "at": number /* ms epoch */ }]`.

| Event | Effect |
|---|---|
| `updateBuild(id, build)` saves `build.isDraft === true` | push `{id, at: now}` (replace an existing entry for that id) |
| `updateBuild(id, build)` saves `build.isDraft === false` | remove any entry for `id` (unlisted and re-published the same day: it is listed, and last night's index still has it) |
| `deleteBuild(id)` succeeds | push `{id, at: now}` |
| An index loads with `generatedAt > entry.at` | drop entry (the index has caught up) |
| Size > 200 | drop oldest |

Search excludes every id on the list. All access goes through try/catch. When storage is
unavailable the list is empty, and search still works with up to 24 h of staleness for the author
too.

**State transitions of a build as search sees it**:

```
listed ──unlist / delete──▶ hidden on author's device ──next 23:30 UTC run──▶ absent everywhere
unlisted ──publish──▶ (not in index) ──next 23:30 UTC run──▶ findable everywhere
```
