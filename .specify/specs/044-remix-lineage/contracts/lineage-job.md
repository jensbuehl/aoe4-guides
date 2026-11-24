# Contract: the lineage pass in the daily job, and the one-time script (044)

## `functions/builds/lineage.js` (CommonJS, pure)

```js
stepRows(steps)          // -> string[]   normalised rows (research R4), forEachStep order
fingerprint(steps)       // -> string|null  sha1 hex of rows, null if < 5 rows
derive(builds, nowMs)    // -> Map<id, { stepsHash, stepsSince, duplicateOf, remixCredit, remixes }>
```

`derive` takes one entry per build, with these fields:

`{ id, civ, authorUid, author, title, isDraft, scoreAllTime, createTimeMs, stepsHash, storedHash, storedSinceMs, remixOf }`

Here `stepsHash` is tonight's fingerprint, and `storedHash` and `storedSinceMs`
are the values the build had before the run. `derive` returns the values each
build *should* hold. Comparing them with the stored values, and writing, is
`updateBuildTrend`'s job.

Rules, all from data-model.md:

- **`stepsSince`**: if `storedHash` is absent, it is `createTimeMs`. If
  `storedHash` equals `stepsHash`, it is `storedSinceMs`. Otherwise it is
  `nowMs`.
- **Duplicate groups**: published builds only, grouped by `(civ, stepsHash)`,
  skipping any build whose hash is null. The original author is the author of
  the earliest build by `stepsSince`, then `createTime`, then id. The listed
  build is that author's build with the highest `scoreAllTime`. Every other
  build in the group gets a `duplicateOf` naming the listed build.
- **Remix edges**: the target exists and has a different `authorUid`. The
  credit counts distinct accounts. `remixes` counts published builds, holds at
  most 10 items, and is ordered by `scoreAllTime`, highest first.

## `updateBuildTrend` (changed)

1. Page through `builds`, 500 at a time (ordered by `__name__`), with
   `select(...current fields, "steps", "civ", "authorUid", "author",
   "scoreAllTime", "remixOf", "duplicateOf", "stepsHash", "stepsSince",
   "remixCredit", "remixes")`. Compute `fingerprint(steps)` per build and keep
   no `steps` past the page. `createTime` comes from `doc.createTime`.
2. Call `derive(...)`.
3. Compute each build's trend, with `remixCredit` taken from step 2.
4. Write only the fields that changed. Field missing or `null` → write `null`
   (the safety net from research R5). Write `remixes` only when it changes. A
   count of 0 deletes the field (`FieldValue.delete()`).
5. The search index and the Trending comparison skip builds whose new
   `duplicateOf` is non-null.
6. Log `updateBuildTrend: lineage` with `{ hashed, changedHash, duplicates,
   unhidden, credited, remixListed }`.

## `updateHomeSnapshot` (changed)

Its four queries add `.where("duplicateOf", "==", null)`.

## `scripts/link-remixes.mjs` (one-time, Admin SDK)

```text
node scripts/link-remixes.mjs                    # dry run: prints the project, then the plan
node scripts/link-remixes.mjs --apply            # seeds + exact links
node scripts/link-remixes.mjs --apply --approve=ids.txt   # also links the approved partial matches
```

- **Seed** builds that lack the fields: `duplicateOf: null`,
  `stepsHash: fingerprint(steps)`, `stepsSince: createTime`. Fields already
  present are left alone.
- **Exact link** (research R9): writes `remixOf` only, and only where the
  field is **absent**. `null` means "remixed from one's own build", a choice
  the remix path recorded, and is left alone. (The R1 count of 329 also
  included builds holding `null`, so the dry run gives the real figure.)
- **Review list**: written to `scripts/.scratch/remix-review.md`, listing the
  copy, its best match, the share of identical rows and both authors.
- Prints counts per kind. A second dry run after `--apply` must report 0
  changes.
- Batches of 500, as in `backfill-map-strategy.mjs`.
