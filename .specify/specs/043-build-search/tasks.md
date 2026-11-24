# Tasks: Build Search

**Input**: Design documents from `.specify/specs/043-build-search/`
**Prerequisites**: plan.md, spec.md (Clarifications 2026-11-24), decision-ux-and-cost.md,
research.md (R1–R9), data-model.md, contracts/search-index-object.md, contracts/search-ui.md,
quickstart.md

**Tests**: The plan asks for one durable check, `npm run check:search` (research R9), which covers
the pure index builder and the pure matcher. The UI is verified with `npm run check:setup`, the
mdi allowlist command in CLAUDE.md and the `ux-gate` skill. The function is verified on the dev
project (quickstart §2).

**Where**: all work happens in the worktree `c:\Users\jensb\code\aoe4-guides-043` (branch
`043-build-search`). Never in the shared tree `c:\Users\jensb\code\aoe4-guides`, which other
sessions use.

**Deploys are outward-facing.** Every task that deploys rules or functions, or pushes to `main`, is
marked **(owner)**. It is run or explicitly approved by the owner, never as a side effect of another
task. Nothing is committed unless asked.

## Phase 1: Setup

- [X] T001 Make the worktree runnable (memory: worktree needs .env). Copy `c:\Users\jensb\code\aoe4-guides\.env` to `c:\Users\jensb\code\aoe4-guides-043\.env`. Create directory junctions for `node_modules` and `functions/node_modules` pointing at the shared tree's copies (`cmd /c mklink /J`). Confirm `npm run build` succeeds in the worktree. Before the worktree is ever removed, unlink the junctions so the removal cannot delete the shared tree's packages.
- [X] T002 Create `scripts/check-search.mjs` as an empty harness. It uses `node:assert/strict`, `node:zlib` and `node:module`'s `createRequire`, plus a tiny `check(name, fn)` runner that prints ✓/✗ and sets `process.exitCode = 1` on failure. Add `"check:search": "node scripts/check-search.mjs"` to `package.json` next to the other `check:*` scripts. Header comment: the script runs locally and in CI only, never on Netlify, so importing from `src/` is allowed. The CLAUDE.md note on Node 22.1 applies only to deploy-time scripts.

---

## Phase 2: Foundational: the nightly index exists and can be loaded

**Why first**: every story searches the index. The index must never contain an unlisted build
(US3, FR-007) from the first version written. Search without the spec 039 guarantee must not ship.

- [X] T003 Create `functions/builds/searchIndex.js` (CommonJS, no imports beyond Node builtins). Export `buildSearchIndex(builds, generatedIso)`. `builds` is an array of `{ id, title, author, authorUid, civ, season, isDraft, score, ageTimings }`. It returns `{ v: 1, generated, authors, builds }` exactly as data-model.md "Output" specifies:
  - skip `isDraft === true`;
  - de-duplicate authors by `authorUid`, falling back to the name when there is no uid;
  - `seasonNumber` is the integer parsed from `"Season N"`, otherwise `0`;
  - `score` is rounded to 2 decimals, or `0` when not finite;
  - `castleSeconds` comes from `ageTimings?.castle?.t` rounded to whole seconds, or `null` when not a finite non-negative number; `castleEstimated` is `1` when `ageTimings.castle.e` is truthy and a time exists, otherwise `0` (data-model positions 6–7);
  - use the fallbacks in the data-model table;
  - sort by `score` descending.

  Also export `shouldPublish(previousCount, newCount)`: `false` when `newCount === 0` or when `previousCount > 0 && newCount < previousCount * 0.5`, otherwise `true`. Comment why: FR-010, a broken run must never replace yesterday's index with an empty one.
- [X] T004 Add builder checks to `scripts/check-search.mjs`, loading `functions/builds/searchIndex.js` through `createRequire`:
  - a fixture with an `isDraft: true` build is absent from the output (FR-007, SC-005: the automated half of the guarantee);
  - two builds by one uid share one author entry;
  - a build with no uid keys its author by name;
  - `"Season 12"` → 12 and `""` → 0;
  - `NaN` score → 0;
  - `ageTimings: { castle: { t: 524.6, e: true } }` → `525, 1`; a missing `ageTimings` → `null, 0`; `{ castle: { t: "x" } }` → `null, 0`;
  - every row has exactly 8 elements;
  - output is sorted by score;
  - `shouldPublish`: (0 → 100) is true, (100 → 0) false, (100 → 49) false, (100 → 50) true.

  Then build an index from `data/seo-snapshot.ndjson` (skip the `_meta` line; author ids are absent there, so use the name; the snapshot has no `ageTimings`, so give every second row a synthetic castle time between 420 and 720 seconds to approximate the real size). Print its row count, raw bytes and gzip bytes, and assert the gzip size × (8,700 / rows) stays under 350 KB (SC-004). Run `npm run check:search`; all must pass.
- [X] T005 Extend `functions/builds/updateBuildTrend.js`:
  - add `"author", "authorUid", "civ", "season", "ageTimings"` to the `.select(…)` call;
  - capture `const indexGenerated = new Date().toISOString()` **before** the `.get()`, so the hide list cannot retire an entry for an unlist that happened between the read and the upload (data-model: the hide-list race);
  - inside the existing loop, collect `{ id, title, author, authorUid, civ, season, isDraft, score, ageTimings }` for **every** build, with `score` taken from the value the job just computed (`scoreFromTrend(result.trend)` under `recency`, otherwise the stored finite score), into a new array;
  - after the batch-commit loop and the comparison log, call a new local `async function publishSearchIndex(rows, indexGenerated)` inside its own `try/catch` that reports `updateBuildTrend: search index failed` with the error through `logger.error`, so Error Reporting raises it, and never rethrows.

  Comment at the call: the index runs after the Trending writes, so a search failure never costs a Trending update, and a Trending failure throws before this line, leaving yesterday's index in place (research R1).
- [X] T006 Implement `publishSearchIndex` in `functions/builds/updateBuildTrend.js`:
  1. `const file = getStorage().bucket().file("search/builds.json")`, with `getStorage` from `firebase-admin/storage`.
  2. Read the previous `metadata.metadata.buildCount` via `file.getMetadata()`, treating a 404 as 0.
  3. Build with `buildSearchIndex(rows, indexGenerated)`. If `!shouldPublish(prev, index.builds.length)`, report `updateBuildTrend: search index withheld` with both counts through `logger.error`, and return.
  4. Otherwise `file.save(JSON.stringify(index), { gzip: true, contentType: "application/json", metadata: { cacheControl: "public, max-age=3600", metadata: { buildCount: String(n), generated: index.generated } } })`.
  5. Log `updateBuildTrend: search index written` with the count, the gzip size (`zlib.gzipSync` length), `withCastle` (rows whose `castleSeconds` is not null) and `castleEstimated` (of those, rows with the flag set). These two figures decide the timing-filter follow-up (spec FR-028). Log a warning when the gzip size exceeds 300 KB (SC-004).
- [X] T007 [P] Add to `storage.rules`, beside `/avatars/{fileName}`: `match /search/{file} { allow read; allow write: if false; }`. Add a comment: the search index must stay readable without App Check. Storage enforcement is UNENFORCED today (checked 2026-11-24), and enforcing it would break search for every client whose attestation fails, the same trap as Firestore (memory: App Check blocks reads).
- [X] T008 **(owner)** First confirm the dev project has a default Storage bucket (`gcloud storage buckets list --project aoe4-guides-dev`); if not, create it in the Firebase console before deploying. Then deploy to dev and force a run, per quickstart §2: `firebase deploy --only functions:updateBuildTrend,storage --project dev`, then `gcloud scheduler jobs run firebase-schedule-updateBuildTrend-us-central1 --project aoe4-guides-dev --location us-central1`. Check the function log for `search index written`.
- [X] T009 Verify the dev object per quickstart §2. `curl -sI` the `alt=media` URL with `Accept-Encoding: gzip` and confirm `content-encoding: gzip`, `cache-control: public, max-age=3600` and `content-type: application/json`. If the encoding or the cache header is missing, **stop**: switch T006 and T010 to the public GCS URL and `file.makePublic()` (research R2), update `contracts/search-index-object.md`, and repeat T008 and T009. Then run the unlisted intersection check from quickstart §2 with a throwaway Admin script in the scratchpad. It must print 0. In the same script, assert the object has exactly the keys `v`, `generated`, `authors` and `builds`, that every build row has exactly 8 elements and every author entry 2. Print the share of rows with a Castle time and the share of those estimated, and record both here.
  *Done 2026-11-24 on dev. Firebase `alt=media` returns `Content-Encoding: gzip` (only when asked for it; served uncompressed otherwise), `Cache-Control: public, max-age=3600`, `application/json` and CORS `*`, so no fallback URL is needed. Dev Firestore: 34 builds, 4 unlisted; index 30 rows; **0 unlisted in the index**. Keys and row shapes match the contract. Castle coverage on dev (1 of 30) is not representative. **Prod**, from read-only count aggregations: 5,426 builds, 4,381 listed, **1,045 with a Castle time (~19%), 259 of them estimated**. Those counts include unlisted builds, since Firestore cannot filter on both without a composite index.* Nothing beyond the contract may be published (FR-014).
- [X] T010 Create `src/composables/search/useSearchIndex.js`:
  - export `loadSearchIndex()`, which fetches `https://firebasestorage.googleapis.com/v0/b/${import.meta.env.VITE_FIREBASE_STORAGE_BUCKET}/o/search%2Fbuilds.json?alt=media` with plain `fetch` (no `firebase/storage` import);
  - reject unless the response is `ok` and `v === 1`, with a `console.warn` for an unknown `v`;
  - keep **one shared in-flight promise** in module scope, so concurrent opens fetch once (the home-snapshot triple-read lesson in the memory notes), and keep the resolved value for the page session;
  - a failed load clears the promise so the next open retries;
  - export a composable `useSearchIndex()` returning `{ index, status, load }`, where `status` is one of `idle`, `loading`, `ready` or `error`.

  Comment: App Check is not involved, and why that must stay true.

**Checkpoint**: the dev bucket holds a correct, gzip, cached index without unlisted builds, and the
app can load it.

---

## Phase 3: User Story 1: find a build by words in its title (P1) 🎯 MVP

**Goal**: typing words from a title shows matching listed builds, best first; selecting one opens it.

**Independent Test**: open search, type a word that appears in the middle of a known listed build's
title, see the build, open it.

- [X] T011 [US1] Create `src/composables/search/searchIndex.js` (pure: no Vue, no `@/` imports), per research R4:
  - `normalise(s)`: NFKD, strip `\p{M}`, lowercase.
  - `isLatinWord(w)`: only `[a-z0-9'’-]`.
  - `prepare(raw, civList)`: returns `{ generatedAt, authors: [{ uid, name, nameN, count }], entries: [{ id, title, titleN, words, authorIdx, civ, season, score, hay }] }`. `hay` holds title, author and civ words for now; US2 extends it.
  - `search(prepared, query, { hiddenIds = new Set(), limit = 20 } = {})`: returns `{ builds: [{ entry, tier, ranges }], total }`.
    - Query words must all match (AND).
    - A Latin word matches a word **prefix** in `hay`.
    - A non-Latin word matches a **substring** of `hay`.
    - Tier: title starts with the query = 0, whole title word = 1, prefix = 2, substring = 3.
    - Sort by tier, then `score` descending.
    - `ranges` holds the matched `[start, end]` spans in the **original** title, for highlighting.
    - Skip hidden ids.
    - Return nothing for a query of one character.
- [X] T012 [US1] Add fuzzy matching to `search` in `src/composables/search/searchIndex.js` (FR-003). Only when the exact pass found fewer than `limit` builds, and only for query words of length ≥ 5, a title word within Damerau–Levenshtein distance 1 counts as a match at tier 4. Exact results stay first. Implement the distance check as an early-exit function on equal or adjacent lengths. Do not compute a full matrix for words whose lengths differ by more than 1.
- [X] T013 [US1] Add matcher checks to `scripts/check-search.mjs`, importing `src/composables/search/searchIndex.js` directly:
  - "fast castle" and "castle fast" both find "Rus 2TC into Fast Castle";
  - "FAST" matches case-insensitively;
  - "éco" finds "Eco boom";
  - "手推车" finds "法国手推车背鹿 - 中文";
  - "cast" (prefix) matches;
  - "astle" does **not** match a Latin word mid-word;
  - "fast catsle" finds via fuzzy only when exact results are under 20;
  - one character returns nothing;
  - tier ordering beats score;
  - `ranges` point at the right characters.

  Also time 1,000 random two-word queries over the snapshot-derived index and print the per-query average.
- [X] T014 [US1] Create `src/components/search/SearchDialog.vue`, implementing only the parts of contracts/search-ui.md listed here:
  - `v-dialog` with `v-model` from a prop/emit pair: `fullscreen` when `useDisplay().smAndDown`, otherwise `max-width="640"` aligned to the top through `content-class` (Vuetify's default positioning centres it and ignores `location`);
  - a `v-text-field` with `autofocus`, `clearable` and placeholder "Search builds, authors, civs" (FR-021), with ✕ in the phone top bar;
  - it calls `useSearchIndex().load()` on open;
  - states: loading skeleton, empty-query hint, results, "No builds found for …" with an All Builds link, and the load-failed message with an All Builds link;
  - the **Builds · N** group: up to 20 `v-list-item`s with `CivFlag`, the title with matched `ranges` wrapped in `<span class="search-hit">` built from string slices (never `v-html`), and author · season (FR-020), followed by the Castle time through the existing `src/components/builds/AgeChips.vue` given `[{ age: 3, seconds: castleSeconds, derived: castleEstimated === 1 }]` when `castleSeconds` is not null, and nothing otherwise (FR-026). Do not write a new time chip: AgeChips already handles the crest, the "~" and the spoken label;
  - the "Showing 20 of N. Add a word or a civ to narrow it." footer;
  - selecting closes the dialog, then `router.push(\`/builds/${id}\`)`;
  - while loading, the typed query is kept and applied when the index arrives (US4 #4).

  `.search-hit` takes `rgb(var(--v-theme-primary))` and weight 700.
- [X] T015 [US1] Wire the trigger in `src/components/Header.vue`:
  *Done, changed after ux-gate measurement and owner decision (2026-11-24). The header had no room below lg: lg+ shows a short "Search /" button; md shows an icon, with "Add Build ▾" as "+ ▾"; phones get a bottom-navigation item; narrow desktop windows get a hamburger-menu item. See FR-017.*
  - from md up, a field-like `v-btn` (magnifier, "Search builds, authors, civs", a `/` hint chip);
  - below md, an icon `v-btn` with `mdi-magnify` and `aria-label="Search builds"`, placed in the header's existing right-hand `flex-shrink-0` span before the nav buttons;
  - both open `SearchDialog`, imported with `defineAsyncComponent(() => import("@/components/search/SearchDialog.vue"))` and rendered with `v-if` only after the first open, so its chunk is not part of the initial load (SC-006);
  - colours from the header's `chrome` object, as the neighbouring buttons use, per the header's comment.
- [X] T016 [US1] Run `npm run check:setup` and the mdi allowlist command from CLAUDE.md in the worktree. It must print only `mdi-svg` and `mdi-xxx`.

**Checkpoint**: on `npm run dev` against dev data, title search works end to end on desktop and phone
widths.

---

## Phase 4: User Story 2: find builds by author or civ (P1)

**Goal**: author names and civ names, codes and nicknames match, and authors and civs appear as their
own results.

**Independent Test**: type a known author's name, then see the author result and their builds. Type
"hre", then see the Holy Roman Empire result first and HRE builds ranked first.

- [X] T017 [P] [US2] Add an optional `aliases: string[]` to civ entries in `src/composables/filter/civDefaultProvider.js` (research R5), lowercase, starting with:

  | Civ | Aliases |
  |---|---|
  | HRE | `["hre"]` |
  | DRA | `["ootd", "dragon"]` |
  | ABB | `["abba"]` |
  | DEL | `["delhi"]` |
  | ZXL | `["zxl", "zhu xi"]` |
  | JDA | `["jd", "jeanne"]` |
  | MAC | `["macedonian"]` |
  | KTE | `["templar", "kt"]` |
  | HOL | `["lancaster"]` |
  | GOH | `["horde"]` |
  | SEN | `["sengoku"]` |
  | TUG | `["tughlaq"]` |
  | OTT | `["otto"]` |

  Extend the file's header comment: aliases are search vocabulary, maintained when a civ is added (the aoe4-civ-release skill). `scripts/refresh-snapshot.mjs` also imports this file but reads only `title`, `shortName`, `slug` and `tagLine`, so an extra field cannot change it. `check:search` (T019) imports the real civ list, so a syntax slip here fails that check.
- [X] T018 [US2] Extend `prepare` and `search` in `src/composables/search/searchIndex.js`:
  - `hay` gains the author name, civ code, civ title and aliases, except for `ANY`, which contributes no civ words (US2 #4);
  - `search` also returns `civs` (≤1: a query word equal to a civ code or alias, or a prefix of length ≥ 3 of the civ title; never `ANY`; with that civ's build count) and `authors` (≤3: authors whose normalised name has a word starting with a query word, sorted by build count, with the count);
  - when a civ matched, builds of that civ rank ahead within each tier (US2 #2);
  - one-character queries still return nothing (no civ code or alias is one character; contract: states).
- [X] T019 [US2] Add checks to `scripts/check-search.mjs`:
  - "hre" returns the HRE civ result and HRE builds first;
  - "rus kestrel fc" returns only builds matching all three words across fields;
  - an author query returns ≤3 authors with counts;
  - two authors with the same display name and different uids appear as two results (spec edge case);
  - an `ANY` build is not returned for "english".
- [X] T020 [US2] Render the **Civilization** (≤1) and **Author** (≤3) groups above **Builds · N** in `src/components/search/SearchDialog.vue`, per contracts/search-ui.md "Result rows":
  *Done. Authors without a uid are not offered, since they have no page to open. Rows are plain markup rather than `v-list-item` (T031 measurement, research R7).*
  - the civ row uses `CivFlag`, the civ title and "Civ page · N builds", and opens `/civ/<slug>`;
  - the author row uses `UserAvatar` with the name and no extra reads (initials fallback), "N builds", and opens `/builds?author=<uid>`. Omit the row's link when the uid is empty.

**Checkpoint**: author and civ queries behave as in US2's acceptance scenarios.

---

## Phase 5: User Story 3: unlisted builds stay out of search (P1)

**Goal**: unlisted and deleted builds never appear for others after the nightly run, and disappear
at once on the author's own device.

**Independent Test**: unlist your own listed build on dev, search its title on the same device, and
find it absent at once, including after a reload. After a forced function run (T008's command), it is
absent on another device too.

- [X] T021 [P] [US3] Create `src/composables/search/hiddenBuilds.js` (pure apart from `localStorage`) per data-model.md "Client: hide list", exporting `addHidden`, `removeHidden` and `hiddenIds`:
  - `addHidden(id)`: replace any entry for the id with `{ id, at: Date.now() }`, cap at 200 and drop the oldest;
  - `hiddenIds(generatedAt)`: prune entries with `at < generatedAt`, then return a `Set` of the remaining ids;
  - key `aoe4guides.search.hidden`;
  - every `localStorage` access in try/catch, returning an empty set on failure.
- [X] T022 [US3] Hook the hide list into `src/composables/data/buildService.js`:
  - in `updateBuild(buildId, build, …)`, after a successful write, call `addHidden(buildId)` when `build.isDraft === true`, and `removeHidden(buildId)` when `build.isDraft === false`. A build unlisted and re-published the same day is listed, and last night's index still holds it (data-model). Add `removeHidden(id)` to `hiddenBuilds.js` (T021);
  - in `deleteBuild(buildId)`, after a successful delete, call `addHidden(buildId)`.

  Comment why it lives here and not in the views: every path that unlists or deletes goes through these two functions, which covers BuildEditor's "save as unlisted" and BuildDetails' delete today, and any future path. Confirm with `grep -rn "isDraft = true\|deleteBuild(" src` that no other path writes `isDraft: true` or deletes a build.
- [X] T023 [US3] Pass `hiddenIds(prepared.generatedAt)` into `search(…, { hiddenIds })` from `src/components/search/SearchDialog.vue`, read on each open, not once per session, so an unlist in the same session counts. Add a `check-search.mjs` case: a hidden id is excluded, and an entry older than `generatedAt` is pruned. Simulate `localStorage` with a `globalThis.localStorage` shim inside the check.
  *Done. The localStorage check lives in `check:search` (hide list section).*
- [ ] T024 [US3] Quickstart §4 on dev: *(Open: needs the signed-in dev account, `ux-test-mobile@example.com`; the logic is covered by `check:search`, the end-to-end path is not.)*
  - unlist a listed build of your own and search for it at once; search again after a reload;
  - delete another build and repeat;
  - deleted build opened from a stale result on a second device: confirm the usual not-found page appears (US3 #4);
  - publish one of your unlisted builds, force a function run (T008's command), and confirm it is now findable on a second device (US3 #5, FR-008);
  - unlist and then re-publish one listed build without a function run in between, and confirm it is still findable on your own device (the `removeHidden` path).

  Record the results in this task.

**Checkpoint**: the spec 039 promise holds on the author's device immediately and everywhere after
the nightly run.

---

## Phase 6: User Story 4: search costs nothing to people who do not use it (P2)

**Goal**: no index bytes and no search code for visitors who never open search; repeat opens are
free.

**Independent Test**: in DevTools Network, home, build and civ pages make no `builds.json` request and
load no SearchDialog chunk. The first open fetches both once. A second open within the hour is served
from cache.

- [X] T025 [US4] Run `npm run build`. Confirm with `grep -l "Try a title, an author or a civ" dist/assets/*.js` that the dialog's empty-state hint sits only in a **separate** chunk, not in `index-*.js`. Do not grep the placeholder "Search builds, authors, civs": the header button carries that label too, so it is in the entry chunk by design. Confirm `grep -c "firebasestorage.googleapis.com/v0/b" dist/assets/index-*.js` finds the URL only in the search chunk. If it is in the entry chunk, move the URL construction into the dialog chunk's import graph.
  *Note 2026-11-24: the empty-state hint line was removed in owner review (it repeated the placeholder). To repeat this check, grep a dialog-only string such as "Search can't load right now".*
- [X] T026 [US4] In a browser against dev:
  *Done 2026-11-24 locally against dev data. No index request before search opens, then exactly one; a second open does not refetch (module cache). First open with a 178 KB real-size index on throttled 4G took 0.86 s. **FR-015 not verified here**: App Check does not run on localhost (no reCAPTCHA request was made), so blocking it tested nothing. The index fetch is a plain `fetch` with no App Check header, which makes it independent by construction, but that is reasoning, not a measurement. Check on the deployed site.*
  - load `/`, a build page and a civ page and confirm no request for `builds.json` and no SearchDialog chunk;
  - open search and confirm one request, `content-encoding: gzip`;
  - close and reopen and confirm no new request;
  - open twice rapidly while the first load is in flight and confirm one request (shared promise, T010).

  Record observed sizes and timings against SC-003 (first open < 1.5 s on a throttled "Fast 4G" profile).

  Then FR-015: in DevTools, block requests to `www.google.com/recaptcha/*` and `www.gstatic.com/recaptcha/*` (App Check's attestation), reload, open search, and confirm results appear even though Firestore reads elsewhere on the page are refused.

**Checkpoint**: SC-006 and FR-011–FR-013 confirmed on a real build.

---

## Phase 7: User Story 5: keyboard, touch and the back button (P2)

**Goal**: shortcut, arrow keys, Enter and Esc on desktop; the system back button closes the sheet on
phones without leaving the page.

**Independent Test**: desktop `/`, then ↓↓, then Enter opens the build. Esc closes. Android back with
the sheet open closes it and stays on the page.

- [X] T027 [US5] Extract the back-closes-overlay logic from `src/components/builds/BuildOrderSectionEditor.vue` (`iconSheetOpen`, around lines 1905–1954) into `src/composables/useOverlayHistory.js`. Constitution III requires it: search is the pattern's second user.
  - `useOverlayHistory(openRef, stateKey)` uses `useRouter()?.options.history`;
  - when `openRef` becomes true, it pushes `(history.location, { [stateKey]: true })` and listens for `popstate`;
  - `popstate` sets `openRef` false without touching history;
  - when `openRef` becomes false by any other means, it calls `history.go(-1, false)` so no entry is left behind;
  - it removes the listener in `onBeforeUnmount`, and tolerates rendering outside a router.

  Move the icon-sheet comment block (why not `closeOnBack`, why `routerHistory.push` rather than `router.push`, the scroll-position note) into the composable, and leave a one-line pointer behind. Switch the icon sheet to it. Its focus-restoring `watch` stays in the editor, minus the `go(-1)` line.
- [X] T028 [US5] Use `useOverlayHistory(dialogOpen, "searchOpen")` in `src/components/search/SearchDialog.vue`. When selecting a result, close first and call `router.push` only after the composable's step back has run (`await nextTick()`), so Back from the build returns to the page without the dialog (contract: Navigation). Do not use Vuetify's `closeOnBack` (memory: back closes overlays).
  *Done in `Header.vue`, not in `SearchDialog.vue`: the header owns the open state because that is where search opens. Added `closeThen(fn)` to the composable, because the history step back is asynchronous and a `router.push` straight after closing would be undone by it.*
- [X] T029 [US5] Add keyboard navigation in `src/components/search/SearchDialog.vue`:
  - an `activeIndex` across the flattened civ, author and build rows;
  - ↓ and ↑ move it and wrap; Enter opens the active row (the first row when none is active); Esc closes;
  - the active row is scrolled into view (`scrollIntoView({ block: "nearest" })`);
  - the field carries `role="combobox"`, `aria-expanded`, `aria-controls` and `aria-activedescendant`, and rows carry `role="option"` with stable ids (contracts/search-ui.md "Keyboard").
- [X] T030 [US5] Add the global shortcut in `src/components/Header.vue`. In `onMounted`, add a `keydown` listener on `window` that opens search on `/` or on `k` with `ctrlKey` or `metaKey`, but returns early when `event.target` is an `input`, a `textarea`, a `select` or `isContentEditable`, or when any modifier other than Ctrl/⌘ is held. Call `preventDefault` only when it acts. Remove the listener in `onBeforeUnmount`. Comment why the contenteditable check matters: the build editor is made of contenteditable step fields, and `/` is a character authors type.
- [X] T031 [US5] Run `npm run check:setup` again, then the `ux-gate` skill at 360 and 393 (Android touch UA) and at 960 and 1280, light and dark:
  *Done 2026-11-24 except where noted. Measured: header never wraps at 320/360/393/960/1279/1280/1920, signed in (stand-in user) or out. Bottom nav 5×72px at 360. Full-screen sheet at 393. Back closes it and stays on the page. `/` and Ctrl+K open it, and `/` in a contenteditable does not. Arrows and Enter open a build, and Back returns without the dialog. Titles share one left edge (author rows were 16px off before). Highlight is slate on ivory in light and gold on slate in dark. **SC-002**: production build, 4× CPU, real-size index: ~50 ms median, ~67 ms p90, 119–139 ms worst. Median met, p90 not; rows were rebuilt as plain markup (from 150 ms median) and the index moved to a shallowRef. **Not verified**: the editor's icon sheet after the `useOverlayHistory` extraction (the editor needs a signed-in dev account); a real phone; iOS Safari; the on-screen keyboard covering results.*
  - the header does not wrap at 360px signed in (FR-017);
  - the full-screen sheet keeps results visible above the on-screen keyboard (US5 #4);
  - Android back closes the sheet and stays on the page;
  - `/` does not open search while typing in the build editor;
  - arrow keys, Enter and Back from the opened build return to the origin page without the dialog;
  - `.search-hit` is legible in both themes;
  - SC-002 on a phone: with 4× CPU throttling and the Android UA at 393, time the per-keystroke result update (`performance.now()` around `search()` plus the next frame) for ten queries against the real index. It must stay under 50 ms;
  - **regression**: the build editor's icon sheet on a phone still closes on Back, still leaves no stray history entry after ✕ or a pick, and the caret still returns after the icon (now through `useOverlayHistory`, T027).

  Fix what it finds, then record what was and was not verified.

**Checkpoint**: all five stories work on dev.

---

## Phase 8: Polish, rollout and harvest

- [X] T032 Run `npm run check:search`, `npm run check:setup`, `npm run check:steps` (as a guard; nothing here reads steps) and `npm run build` in the worktree. All must be green. Run the self-review from the constitution's Development Workflow on the diff, looking for magic numbers: the 20, 3, 200, 0.5 and 300 KB limits should be named constants at the top of their modules.
- [ ] T033 **(owner)** Prod rollout, per quickstart §5:
  1. `firebase deploy --only storage --project prod`;
  2. `firebase deploy --only functions:updateBuildTrend --project prod`;
  3. force one run (quickstart §2 command with `--project aoe4-guides`);
  4. repeat the T009 header and unlisted-intersection checks against prod.
- [ ] T034 **(owner)** Merge `043-build-search` to `main`. Rebase onto `origin/main` first: the Monday snapshot cron commits to `main` (memory: main gains weekly CI commits). Netlify then deploys the UI. Release as a `chore: X.Y.Z` commit if a version bump is wanted.
- [ ] T035 **(owner)** The day after the rollout, confirm the 23:30 UTC run logged `search index written` and the object's `generated` moved. A month later, read SC-008 from Cloud Monitoring (`storage.googleapis.com/api/request_count`, method `ReadObject`, bucket `aoe4-guides.firebasestorage.app`) and record it here. In the same pass, read the month's Storage download volume and the GCP bill against SC-007 (≤ €1/month at 1,000 opens/day; expected €0 inside the 100 GB allowance) and record both.
- [ ] T036 Harvest, per CLAUDE.md's "Harvest after every push":
  - add to `project-appcheck-blocks-reads` memory that Storage is UNENFORCED and the search index depends on it;
  - reconcile spec, plan and contracts with anything T009 or T031 changed (e.g. the public-URL fallback);
  - point `CLAUDE.md`'s SPECKIT block back at whichever plan is current after the merge;
  - unlink the worktree's junctions before `git worktree remove`.
- [ ] T037 [P] Optional news card: if the owner wants it announced, add one line to the single Home news card (memory: one small news card) in the file that renders it under `src/components/home/`, written for players. Ask before doing it.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (T001–T002)** → **Foundational (T003–T010)** → stories.
- T008 (owner deploy) blocks T009. T009 blocks T010's final URL. Until T009 confirms the
  `alt=media` headers, T010 can be written but not considered done.
- **US1 (T011–T016)** needs Foundational.
- **US2 (T017–T020)** needs T011 (`prepare` and `search` exist) and T014 (the dialog exists).
- **US3 (T021–T024)** needs T011 and T014. T021 and T022 can start right after Foundational.
- **US4 (T025–T026)** needs T014 and T015.
- **US5 (T027–T031)** needs T014 and T015.
- **Polish (T032–T037)** after all stories. T033, T034 and T035 are owner-run, in that order.

### User story independence

US1 is the MVP: Foundational plus US1 is a shippable title search. US2, US3, US5 and US4 each add to
the same dialog and module, but none needs another story's work, only the US1 scaffolding. **US3
must ship in the same release as US1.** The index already excludes unlisted builds (Foundational),
but releasing without the author's instant hide list would make "save as unlisted" look broken to
the one person who checks right away.

### Parallel opportunities

- T007 (storage.rules) alongside T003–T006 (function).
- T017 (civ aliases) and T021 (hide list) alongside T011–T013. Different files, no shared state.
- T025 and T026 (US4 checks) alongside T027–T030 once T015 is done.
- `SearchDialog.vue` is touched by T014, T020, T023, T028 and T029, so those run **sequentially**.
- `src/composables/search/searchIndex.js` is touched by T011, T012 and T018, so also sequential.

## Parallel example: after Foundational

```text
Agent session (sequential, per memory "agents one at a time"), but the following files are independent
and can be done in any order within one session:
  T011  src/composables/search/searchIndex.js
  T017  src/composables/filter/civDefaultProvider.js
  T021  src/composables/search/hiddenBuilds.js
```

## Implementation strategy

1. **MVP** = Setup + Foundational + US1 + US3: title search that already keeps 039's promise,
   including on the author's device. Validate on dev, then roll out (T033, T034).
2. **Increment 2** = US2 (authors and civs). It needs no redeploy of the function; client only.
3. **Increment 3** = US5 then US4. Keyboard and back-button polish, then the cost verification on
   the real build.

Every increment after the MVP is a client-only Netlify deploy. The function and the rule ship once,
in the MVP.
