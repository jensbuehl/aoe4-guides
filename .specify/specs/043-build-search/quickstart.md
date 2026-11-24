# Quickstart: Build Search (043)

Work happens in the worktree `../aoe4-guides-043` (branch `043-build-search`). It needs the
gitignored `.env` copied in and `node_modules` junctioned before it will render (memory: worktree
needs .env).

## 1. Pure logic, no browser

```sh
npm run check:search
```

Runs `scripts/check-search.mjs`. It asserts:
- the builder never emits an `isDraft: true` build;
- author de-duplication and indexes;
- season parsing;
- `score` normalisation (`NaN` becomes `0`);
- the matcher: AND across title, author and civ; accents; CJK substring; prefix; `ANY`
  exclusion; fuzzy only when there are fewer than 20 hits; hide-list filtering.

It also builds an index from `data/seo-snapshot.ndjson` and prints raw and gzip size (SC-004:
< 350 KB at twice the count).

## 2. Function on the dev project first

```sh
cd functions
firebase deploy --only functions:updateBuildTrend,storage --project dev
# force a run (Git Bash: set CLOUDSDK_PYTHON first, see memory: project scale and costs)
gcloud scheduler jobs run firebase-schedule-updateBuildTrend-us-central1 \
  --project aoe4-guides-dev --location us-central1
```

Then check the object:

```sh
B=<dev bucket>
curl -sI -H 'Accept-Encoding: gzip' \
  "https://firebasestorage.googleapis.com/v0/b/$B/o/search%2Fbuilds.json?alt=media" \
  | grep -iE 'content-encoding|cache-control|content-type|etag'
```

Also read the `search index written` log line: `withCastle` and `castleEstimated` are the coverage
figures that decide the timing-filter follow-up (spec FR-028).

Expect `content-encoding: gzip`, `cache-control: public, max-age=3600`, and
`content-type: application/json`. If the encoding or the cache header is missing, switch to the
public GCS URL (research R2) before going further.

Unlisted check, so nothing unlisted is in the file (SC-005):

```sh
curl -s --compressed "<url>" | node -e '
  const i = JSON.parse(require("fs").readFileSync(0, "utf8"));
  console.log(i.v, i.generated, i.builds.length, "builds", i.authors.length, "authors")'
```

Compare the ids against `isDraft == true` ids from the dev Firestore (Admin script in the scratchpad,
never committed). The intersection must be empty.

Guard check: the publish guard is the pure `shouldPublish(previousCount, newCount)` in
`functions/builds/searchIndex.js`, covered by `check:search` (0 → withhold; < 50% → withhold;
first run with no previous object → publish). Nothing to stage against a live bucket.

## 3. UI

```sh
npm run dev
npm run check:setup
# mdi allowlist check from CLAUDE.md — must print only mdi-svg and mdi-xxx
```

Then use the `ux-gate` skill at 360 and 393 with an Android UA, and at 960 and 1280, in light and
dark:
- the header at 360px, signed in, does not wrap;
- the sheet opens full-screen with the keyboard up, and results stay visible above it;
- system **back** closes the sheet and stays on the page;
- `/` and Ctrl+K open it on desktop, but not while typing in the build editor;
- arrow keys and Enter open a build, and Back from the build returns to the page without the dialog;
- in the Network tab, no `builds.json` request before search is opened (SC-006), and one on
  first open;
- a second open within the hour is served from disk cache.

## 4. Hide list

Signed in on dev: open your own listed build, choose "save as unlisted" in the editor, then search
its title at once. It must be absent. Reload the page and search again; it must still be absent.
Delete another of your builds and do the same.

## 5. Prod rollout

1. `firebase deploy --only storage --project prod` (the rule first, so the URL works when the file
   lands).
2. `firebase deploy --only functions:updateBuildTrend --project prod`, then force one run as in §2,
   and check headers and the unlisted intersection against prod.
3. Merge the UI to `main`. Netlify deploys it.
4. A day later, confirm the 23:30 UTC run logged `done` and the object's `generated` moved.
5. After a month, read SC-008 from Cloud Monitoring
   (`storage.googleapis.com/api/request_count`, method `ReadObject`, this bucket).
