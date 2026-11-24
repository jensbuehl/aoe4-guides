# Research: Build Search (043)

All decisions below were taken or measured on 2026-11-24. The owner-level choices (Layout A, daily
rebuild, Firebase Storage) and their cost evidence are in `decision-ux-and-cost.md`. This file covers
the technical choices underneath them.

## R1 · Where the index is produced: inside `updateBuildTrend`

**Generation time**: `generated` is stamped *before* the Firestore read, not at upload (data-model:
the hide-list race).

**Decision**: Extend the nightly `updateBuildTrend` job (23:30 UTC). Add `author`, `authorUid`,
`civ` and `season` to its existing `select()`, and write the index after the score writes, from
the `listed` array the job already builds.

**Rationale**: The job already reads every build and already separates listed builds
(`build.isDraft !== true`), so the index costs no extra read operations (FR-016). Writing after the
score batches means the index carries the scores Trending will show the next day. Four short fields
on ~4,350 builds add well under 1 MB of function transfer.

**Isolation**: Index generation runs in its own `try/catch` *after* the Trending writes and reports
`updateBuildTrend: search index failed` through `logger.error`, so Error Reporting surfaces it. A search failure must never cost a Trending update, and
a Trending failure throws before the index is written, so the old index stays. Both outcomes keep
FR-010.

**Alternatives considered**:
- *Separate scheduled function with the same narrow read*: +~130k reads/month (€0.07). It is
  cleaner on single responsibility but duplicates the listed/unlisted split. It stays the fallback
  if the Trending job ever moves off a full read.
- *Firestore trigger per build write*: fires on every view and like increment. Rejected.

## R2 · Where it is served: one gzip JSON object in Firebase Storage

**Decision**: `gs://aoe4-guides.firebasestorage.app/search/builds.json`, uploaded by the Admin SDK
with `gzip: true` (sets `Content-Encoding: gzip`), `contentType: application/json` and
`cacheControl: public, max-age=3600`. The client reads it with a plain `fetch()` from the Firebase
Storage REST URL:

```
https://firebasestorage.googleapis.com/v0/b/<VITE_FIREBASE_STORAGE_BUCKET>/o/search%2Fbuilds.json?alt=media
```

A Storage rule `match /search/{file} { allow read; }` makes it readable without a token.

**Rationale**:
- The bucket is in US-EAST1 and inside Firebase Storage's no-cost allowance (100 GB/month
  downloads). That covers about 21,000 opens a day.
- App Check is **unenforced** on Storage (checked through the App Check API), so clients where
  attestation fails still load search (FR-015), with no /api fallback.
- CORS on the bucket already allows `GET` from `*`.
- A plain `fetch` avoids loading `firebase/storage` code into the search chunk and avoids the
  extra metadata round trip that `getDownloadURL()` costs.
- An hour of `max-age` makes repeat opens free (FR-012). After that the browser revalidates by
  ETag, which costs one operation and no body. No separate version stamp is needed (see R6).

**To verify on the dev project before prod** (quickstart §2): that the `alt=media` response carries
`Content-Encoding: gzip` and our `Cache-Control`. If Firebase's endpoint strips either, fall back
to the public GCS URL (`storage.googleapis.com/<bucket>/search/builds.json`) with the object made
public by `file.makePublic()`. The bucket has `uniform_bucket_level_access: false`, so per-object
ACLs work.

**Alternatives considered**: Netlify static file with a daily deploy, which consumes the shared
build-minute pool that blocks builds at its limit (decision document §4). A Firestore document,
which costs ~370 KB of billed egress per open and is App Check-enforced.

## R3 · Index format: compact arrays with an author table

**Decision**: Positional arrays, with authors de-duplicated into a table (see data-model.md).
Measured on the 9 Nov snapshot with 28-character author ids: **376 KB raw, 162 KB gzip**. The
same data as one object per build is 762 KB raw and 171 KB gzip.

**Rationale**: Gzip hides most of the difference on the wire, but not in parse time or memory on a
phone, and not for any client that receives it uncompressed. The author table also gives
"author" results (FR-005), with a build count, for free. 1,520 distinct authors.

**Growth**: the size is linear in builds, ~37 bytes gzip per build. Most of it is incompressible:
the 20-character random document ids alone are ~65 KB of the 162 KB. At twice today (~8,700
builds) that is **~325 KB gzip** (~345 KB once the Castle time is added, R10), so the original SC-004 target of 250 KB could not be met by any
format that keeps the ids, and the ids are needed to link a build. **SC-004 is amended** to
350 KB at twice today, which still downloads in well under SC-003's 1.5 s on 4G. The job logs a
warning when the gzipped index passes 300 KB.

## R4 · Matching: hand-written, no dependency

**Decision**: A pure module `src/composables/search/searchIndex.js`:
1. **Normalise**: NFKD, strip combining marks, lowercase. Applied to the index once at load and to
   the query per keystroke.
2. **Haystack per build**: title words + author name + civ code + civ title + civ aliases.
3. **Query**: split on whitespace. Each word must match the haystack (AND, any order; FR-002).
   - Latin words match as **word prefixes** ("cast" matches "castle").
   - Words containing non-Latin script (CJK, Cyrillic, Thai…) match as **substrings**, because
     CJK titles have no word boundaries (snapshot sample: "法国手推车背鹿 - 中文").
4. **Fuzzy** (FR-003): only when fewer than 20 exact results, and only for query words of five
   or more characters. Matches title words within Damerau–Levenshtein distance 1.
5. **Rank** (FR-004): tier by best match type (title starts with query > whole word > prefix >
   substring > fuzzy), then by `score` descending.

**Performance**: a naive substring pass over 4,348 normalised strings took **0.3 ms/query**
(desktop, 50 queries in 14.6 ms) and normalising the whole index took 4.3 ms. Even at 10× slower on
a mid-range phone it is far inside SC-002's 50 ms. No debounce is needed for computing; the
render is the cost (R7).

**Alternatives considered**: MiniSearch (~7 KB gz) or Fuse.js (~9 KB gz). Both work, but their
default semantics (BM25 OR-matching, or a single fuzzy score) need configuring towards exactly
the AND/prefix behaviour above. The constitution (I) asks for a dependency only when a native
solution cannot do the job, and this one is about 150 lines.

## R5 · Civ names and aliases

**Decision**: Add an optional `aliases: string[]` to entries in
`src/composables/filter/civDefaultProvider.js` (e.g. HRE: `["hre"]`, Order of the Dragon:
`["ootd", "dragon"]`, Abbasid: `["abba"]`, Zhu Xi's Legacy: `["zxl", "zhu xi"]`, Jeanne d'Arc:
`["jd", "jeanne"]`). The client maps the index's civ code to title + shortName + aliases. The
function stores only the code, so the civ list stays in one place (the functions are CommonJS and
cannot import `src/`).

`ANY` is never offered as a civ result and is excluded from civ-word matching (spec US2 #4).

**Note**: `refresh-snapshot.mjs` imports `civs` from that file. Adding a field is harmless there.

## R6 · Freshness and the author's own hide list

**Decision**: `src/composables/search/hiddenBuilds.js` keeps a `localStorage` list
`aoe4guides.search.hidden = [{ id, at }]`. `buildService.updateBuild` adds an entry when it saves
`isDraft === true`, and `deleteBuild` adds one on success. Search filters these ids out. An entry is
pruned once the loaded index's `generated` is later than its `at`, because by then the index itself
no longer contains the build. Hard cap of 200 entries, oldest dropped.

**Rationale**: This puts the hook in the service rather than in the two views (BuildEditor's "save
as unlisted", BuildDetails' delete), so any future path that unlists or deletes is covered.
`localStorage` access is wrapped in try/catch (private mode).

**Why no version stamp in the home snapshot**: HTTP caching (R2) already gives "download once per
hour, then revalidate for free". A stamp would add a field to a document every visitor reads, and
the memory notes record that the home snapshot's rewrite cadence is an egress cost. Not worth it.

## R7 · UI: Vuetify dialog, lazy chunk, own history entry

**Decision**:
- **Superseded by measurement (see FR-017 and contracts/search-ui.md "Entry points")**: the header
  has no room below lg for this. Phones get a bottom-navigation item, md an icon (with "Add Build" as
  "+"), lg+ a short "Search /" button. The header owns the open state and `useOverlayHistory`, because
  the header is where search opens; `closeThen()` navigates only after the history step back, which
  is asynchronous.
- *Original plan*: `Header.vue` gets the trigger: a field-like `v-btn` reading "Search builds, authors, civs" with a
  `/` hint from md up, and an icon-only `v-btn` (`mdi-magnify`, already in `mdiIcons.js`) below
  md. Both render in the header's dark theme, as the rest of the header does.
- `src/components/search/SearchDialog.vue`, loaded with `defineAsyncComponent` only on first open.
  The header bundle grows by the trigger only (SC-006 extends to code, not just data).
- `v-dialog`, `fullscreen` when `useDisplay().smAndDown`, otherwise `max-width="640"` aligned to
  the top through `content-class`. Vuetify's default positioning centres it and ignores
  `location`. Field `v-text-field` with `autofocus`; results in a `v-list` with
  subheaders ("Civilization", "Author", "Builds · N"). Flags via the existing `CivFlag.vue`.
- **Back closes it**: the icon sheet in `BuildOrderSectionEditor.vue` already solves this. It pushes
  an entry for the same location through `useRouter().options.history`, closes on `popstate`, and
  on ✕ steps back with `history.go(-1, false)`. Not Vuetify's `closeOnBack`, which loses to route
  guards (memory: back-button overlays). Search is the **second** user of that pattern, so
  constitution III requires extracting it rather than copying it. A new composable
  `src/composables/useOverlayHistory.js` takes the `open` ref and owns the push, the listener, the
  step back on close and the unmount cleanup. The icon sheet keeps its own focus restore in its
  `watch`, which stays outside the composable, and switches to it in the same change.
- **Shortcut**: a `keydown` listener in `Header.vue` for `/` and Ctrl/⌘+K, ignored when the target
  is an input, textarea or contenteditable. The build editor is full of contenteditable fields.
- **Keyboard list navigation**: arrow keys move an `activeIndex`, Enter opens it, Esc closes.
  `aria-activedescendant` on the field so screen readers follow.
- **Rendering cost, measured 2026-11-24** with a 4,379-build index and 4× CPU throttling: matching
  is 5–22 ms per query in the browser; `prepare()` costs a one-time 124 ms on first open. Rows built as
  `v-list-item` made a keystroke cost 150 ms median (290 ms worst) in dev; plain rows styled with
  Vuetify's type classes and theme tokens halved that. On a production build: **~50 ms median, ~67 ms
  p90, 119–139 ms worst**, of which ~17 ms is the measurement's own two-frame floor. The page behind
  the dialog makes no difference. The loaded index is held in a `shallowRef`, so its 4,000+ rows are
  never reactive proxies. SC-002's median is met under emulation; the p90 is not, and no real phone
  has been measured. Next lever if needed: fewer rows per render (e.g. 12).
- **Original note**: results capped at 20 builds, 3 authors and 1 civ (FR-006), so per-keystroke
  render stays small. Typing is not debounced.

**Alternatives considered**: `v-autocomplete` in the header. It cannot group mixed result types
cleanly and is cramped at 360px. `v-menu` dropdown: no full-screen phone variant, and no history
entry.

## R8 · Measuring use (SC-008)

**Finding**: `src/` has no analytics (no gtag, Firebase Analytics or `logEvent`), so "share of
in-site build visits arriving from search" cannot be measured without adding a tracker. That needs
its own privacy decision and is out of scope.

**Decision**: Measure **index downloads per day** from Cloud Monitoring
(`storage.googleapis.com/api/request_count` filtered to the bucket and `ReadObject`). That is a
lower bound on opens, since cached opens are invisible. **Action**: reword SC-008 accordingly.

## R9 · Verification approach

- **`npm run check:search`** (new, `scripts/check-search.mjs`) runs fixture queries against the
  pure matcher and the function's pure index builder: CJK substring, accents, AND across fields,
  `ANY` exclusion, fuzzy only when sparse, a hidden id filtered, and no `isDraft: true` row ever in
  the output. The matcher must import nothing through `@/` so that plain Node can run it. This
  script runs locally and in CI, never on Netlify, so its `src/` import is safe (CLAUDE.md, Node
  22.1 note).
- `npm run check:setup` after the `.vue` changes. Run `ux-gate` at 360/393 (Android UA) and
  960/1280 in both themes, covering the header at 360px, the full-screen sheet with the keyboard up,
  and back closing the sheet.
- Run the `mdi-*` allowlist check from CLAUDE.md (`mdi-magnify` and `mdi-close` are present
  already).
- Function: deploy to the dev project, force-run the scheduler job, then `curl -sI` the object and
  confirm the headers and that no unlisted id appears (quickstart).

## R10 · Castle Age time in the index (added 2026-11-24)

**Decision**: Carry each listed build's Castle Age time and its estimated flag in the index (data-model
positions 6 and 7), show it on each build result through the existing `AgeChips` component, and
**do not** filter or sort by it in this feature (spec FR-026 – FR-028).

**Rationale**:
- Builds already store it: `ageTimings.castle = { t, e }`, written on save by `buildService` and
  backfilled by `scripts/backfill-age-timings.mjs`. Adding `ageTimings` to the job's `select()`
  costs no read operations.
- Adding it before the first release avoids a format version bump later, which would need the reader
  to accept two versions for a day because the job and the app ship separately (R2, data-model).
- Showing it answers "fast castle French" usefully today. The player sees 8:45 against ~9:30 on each
  result without opening any build.

**Why not a range slider now**: builds without times would silently disappear from a timing
filter, including builds titled "French Fast Castle" that the text query finds. Coverage of
`ageTimings` among listed builds, and the share that is estimated, are unknown, so the rebuild logs
both (FR-028). **Measured 2026-11-24 on prod** (read-only count aggregations): 1,045 of 5,426 builds (~19%) have a Castle time, 259 of them estimated. A timing filter today would hide roughly four builds in five. A two-handle slider is also a poor fit for a full-screen phone sheet with the
keyboard up. If coverage is good, a follow-up spec would add preset chips ("Castle < 8:00 · < 9:00
· < 10:00") that state how many untimed builds they hide, alongside layout C's full results page.

**Size**: ~2–2.5 bytes gzip per build (nulls and small integers compress well): ~172 KB today and
~345 KB at twice today, inside the amended SC-004 of 350 KB but close to it. The job's 300 KB
warning gives notice well before the limit.

**Alternatives considered**: Feudal and Imperial times as well. Rejected for now: each adds the same
again to the index, and "fast castle" is the timing question players ask. Feudal can follow with the
filter spec if it is wanted.

**Amended 2026-11-24 (owner): Feudal as well.** A Castle-only index left half the timed builds blank
in search, while their cards show a Feudal time. Prod counts: Feudal 2,672, Castle 1,045, Imperial 85
of 5,426. Measured cost of Feudal: +24 KB gzip today (154 → 178 KB with realistic shares), ~351 KB
at twice today, so SC-004 is raised to 400 KB, still ~0.4 s on 4G. Imperial stays out: 2% of builds.
Rows now carry 10 positions (data-model.md); the format version stays 1, since no index has
reached prod.
