# Quickstart: Remix Lineage and Credit (044)

## 1. Local checks

```sh
npm run build && npm run check:setup && npm run check:steps
npm run check:lineage     # new: fingerprint and derive() on fixtures
npm run test:rules        # needs Java; L1–L9 plus everything before
```

The `check:lineage` fixtures must cover:

- notes and alternatives paths (a step inside a path changes the fingerprint;
  a note does not);
- formatting only (HTML, case, whitespace), which must not change the
  fingerprint;
- an icon swapped in one step, which **must** change it;
- the same icon stored as `.png` and as `.webp`, which must not change it;
- builds under 5 rows;
- civilisations kept apart;
- a copy by another author (hidden, and linked to the original);
- three copies by one author (the most active is listed);
- an attacker's old build edited to match a newer build (the attacker's build
  is the duplicate, because `stepsSince` is now);
- the original unlisted (the next build in line is listed);
- remix credit counting distinct accounts, excluding the author's own remixes
  and remixes of a deleted build, with a 10-item cap and the "count" figure.

## 2. Dry run on production (read-only, owner's key)

```sh
GOOGLE_APPLICATION_CREDENTIALS="<prod key>" node scripts/link-remixes.mjs
```

Expect, as measured on 2026-11-24 (research R1):

- seeding about 5,430 builds;
- about 300 exact links, somewhat fewer than 329 because builds whose
  `remixOf` is `null` are skipped;
- about 51 rows in `scripts/.scratch/remix-review.md`.

The owner reviews that file and writes the ids they approve into a file.

## 3. Indexes on dev, then prod

Deploy `firestore.indexes.json` to `aoe4-guides-dev` and wait until the
indexes are built. Then, on dev with the new app, open every list shape below
and check that each returns builds rather than an empty list:

- Builds, under each of the six sorts;
- a civ page;
- civ, season and map combined;
- an author page;
- Home (`updateHomeSnapshot` force-run on dev).

An empty list is the symptom of a missing index, because the list read
swallows the error. After that, deploy to prod.

## 4. Release order on production (research R10)

Each production write needs the owner's go-ahead.

1. `firebase deploy --only firestore:rules --project aoe4-guides`, run
   `test:rules` first.
2. `firebase deploy --only firestore:indexes --project aoe4-guides`, and wait
   until every index is built.
3. `link-remixes.mjs --apply` (add `--approve=…` for the approved partial
   matches). Then a dry run must report 0.
4. `cd functions && npm run deploy`. Force-run `updateBuildTrend`, then
   `updateHomeSnapshot`, from Cloud Scheduler. Check the `lineage` log line:
   about 400 duplicates, and `rebased` close to the build count.
5. Push the app release (Netlify).
6. `link-remixes.mjs --apply` again: it seeds any build that an old client
   created in between, and should report 0 or a handful.
7. `aoe4-guides-api`: add the filter, then deploy.

## 5. Checks on production after release

- Open "2 TC ayyubid 'the beasty build' - copy". It shows "Remix of … by
  Patatasfritas", and its canonical tag points at the original.
- The original's page shows "Remixed N times", and the menu lists the copies.
- Builds, sorted by Most views: neither copy appears. Search finds the
  original only.
- Sign in as the author of a hidden copy (or check with the Admin SDK): My
  Builds shows the "Duplicate" chip, and the page shows the notice.
- The day after: in the `updateBuildTrend: comparison` log, no build's trend
  rose by more than its genuine activity (SC-004).
- UX gate: the remix menu and the notice at 360 and 393 px on Android and at
  1280 px, in both themes.
