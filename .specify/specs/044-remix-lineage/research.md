# Research: Remix Lineage and Credit (044)

All figures are read-only measurements of production taken on 2026-11-24 with
`scripts/.scratch/lineage.mjs` in the main working tree (gitignored). It was
run with the owner's key, which they allowed for read-only scripts.

## R1. What production holds today

| Fact | Value |
|---|---|
| Builds / published (`isDraft === false`) | 5,430 / 4,383 |
| `authorUid` present | 5,430 (all). `creatorId` only 2,533: it names the *player* a build is credited to, not the account |
| `remixOf` | 83 with an id, 362 `null` (remixed from one's own build), 4,985 absent |
| `remixOf` shape | `{ id, title, author, authorUid }` |
| `remixOf` pointing at a deleted build | 1 |
| Step JSON | 36.1 MB in total; median 6.0 KB, p95 13.9 KB, max 41 KB per build |

**With the spec's exact definition** — same civilisation, at least 5 step rows,
an *earlier* build by *another account*:

| | Builds |
|---|---|
| Exact groups with more than one build | 335 |
| Would be **linked** (no `remixOf` today) | **329** (271 published); 4 of them point at an unlisted original |
| Already linked to such a build | 16 |
| Match only builds by the same account (never linked) | 276 |
| Originals that receive at least one link | 219 (at most 10 links to one build) |
| Published builds that would be **hidden** | about **398**: 270 copies by another account, 128 extra copies by the same account |

Remix credit as it stands today, before any linking: 73 builds would be
credited, the most by 3 distinct accounts.

**The real figures, from `link-remixes.mjs` (dry run on production, 2026-11-24, T016):** **324 exact links (268 published)** and **51 near matches** for review. The fingerprint now keeps icons, the link skips `remixOf: null`, and a copy is linked only when the earliest build with its steps is someone else's. That last rule was caught by the emulator proof: an author's own later copy had been linked to another player's copy of that author's build.

**The spec's figures are wider than this.** "About 390 published" and "392"
counted exact matches across civilisations and authors. Both are now
reconciled in spec.md to 271 and 329.

**Partial matches.** These are builds with a copy-marked title (" - copy",
"(copy)", "副本") and no exact earlier match by another account. Each was
compared with its closest earlier build by another account, as the share of
identical step rows:

| Best share | Builds (published) |
|---|---|
| ≥ 0.9 | 24 (18) |
| 0.8–0.9 | 27 (21) |
| 0.7–0.8 | 15 (13) |
| 0.5–0.7 | 35 (24) |
| < 0.5 | 204 (145) |

## R2. Which time decides "earliest"? (security)

**Decision.** Two different times are used:

- **The one-time link** orders builds by the document's **`createTime`**, the
  metadata Firestore assigns when a document is created.
- **The daily duplicate check** orders by **`stepsSince`**: when the server
  first saw a build's current steps. A new field written only by the daily job,
  and seeded from `createTime` on the first run.

Ties are broken by `createTime`, then by id.

**Why not `timeCreated`?** It is written by the client: no rule checks it
against `request.time`. On top of that, **publishing an unlisted build resets
it to now** (`updateBuild(…, updateCreatedTimestamp = true)`) so that the build
shows up under Most recent. If "earliest" used it, two things would follow:

1. A forger could give a copy an old `timeCreated` and get the real original
   hidden as a "duplicate" of their own build.
2. An honest author who unlisted their original and later published it again
   would lose the original's place to its own copies.

**Why not `createTime` alone for the daily check?** That opens another attack.
An account holding an *old* build could edit its steps to match someone's newer
popular build. The old document's `createTime` would then make it the
"original", and the real author's build would be hidden. `stepsSince` resets
whenever a build's steps change, so a build only counts as earlier for the
content it has *held* the longest. Neither time can be set by a client:
`stepsSince` is server-owned (R7).

**Alternatives considered**

- Enforce `timeCreated == request.time` in the rules. Rejected: the reset on
  publish is a feature, and that still leaves the attack by editing steps.
- Compute the hash on the client when the build is saved, as `ageTimings` is.
  Rejected: any value a client sends can be forged (see the CLAUDE.md note on
  rules), and a forged hash is exactly the attack above.

## R3. Hashing steps without breaking the daily job

**Decision.** `updateBuildTrend` reads builds in **pages of 500**, with `steps`
added to its `select()`. While it holds each page, it computes each build's
step **fingerprint**: a SHA-1 of the normalised step rows. It then drops
`steps` and keeps only the small fields it needs for the run.

**Rationale**

- Read ops are unchanged: the job already reads every build once a night.
- The traffic stays inside Google Cloud: the function reads Firestore
  server-side, which does not bill as internet egress
  (project-scale-and-costs).
- Paging caps memory at one page of steps, about 4 MB at the p95 size.

The existing comment ("`steps` is ~7.9 of a build's ~8.5 KB and nothing here
needs it") was about memory, and paging answers it. The comment is updated so
it does not mislead.

**Alternatives considered**

- Rehash only builds whose `timeUpdated` changed. Rejected: `timeUpdated` is
  set by the client, so a forger could back-date it to keep a stale
  fingerprint.
- A Firestore trigger on every write. Rejected: every view is a write, so the
  function would run tens of thousands of times a week.

## R4. What counts as "the same steps"

**Decision.** One step row per step, visited in order the way `forEachStep`
does (`src/composables/builds/useAgeTimings.js`):

- ordinary steps, plus the steps inside each alternatives path;
- notes left out, nested blocks skipped;
- a section's `gameplan` left out.

A row is `time | villagers | builders | food | wood | gold | stone |
description`. **Icons are kept:** each `<img>` first becomes `[name]`, its file
name without the extension, so `.png` and `.webp` paths agree (old builds still
store `.png`, see `legacyImagePaths.js`). Two builds that differ only in an icon
are different builds. The planning measurement stripped icons, so R1 slightly
over-counts; the dry run (T016) gives the real figure. After that, each value
has the remaining HTML stripped, `&nbsp;` turned into a space,
whitespace collapsed, and is lower-cased. Empty rows are dropped. A build
qualifies when it has **at least 5 rows**. The fingerprint is a SHA-1 of the
rows joined with newlines, grouped together with `civ`.

**Rationale.** This is the CLAUDE.md rule: anything that reads a build must
reach the paths nobody chose as well. The measurement script iterated
`section.steps` directly and missed the steps inside alternatives, so the
implementation must not copy it.

`functions/` is CommonJS and cannot import from `src/`. So the traversal is
written out again in `functions/builds/lineage.js`, with a comment naming
`forEachStep` as the rule it mirrors. `scripts/check-lineage.mjs` proves the
two agree on a fixture that contains notes and alternatives. That follows the
`check:search` precedent.

## R5. Hiding duplicates from lists

**Decision.** A new field **`duplicateOf`** is stored on **every** build. It is
`null` when the build is listed, and `{ id, title, author }` when it is hidden.

Every *public* list query adds `where("duplicateOf", "==", null)`:

- the client's `getQueryParametersFromConfig`, when no `userUid` is passed;
- `updateHomeSnapshot`'s four queries;
- `refresh-snapshot.mjs`, so the sitemap and prerendered pages drop duplicates;
- the list queries in the `aoe4-guides-api` repo.

The search index and the Trending comparison skip duplicates in memory.

**Two Firestore facts constrain this:**

1. **`== null` matches only documents where the field exists and is null.** A
   build without the field would vanish from every list. So the field is
   backfilled on all builds, written as `null` by `addBuild` on create, and
   filled in by the daily job wherever it is missing (a safety net for cached
   old clients).
2. **Indexes.** Lists combine one equality filter per field and are served by
   merging two-field indexes (see the API's comment). The new filter needs its
   own pairs: `duplicateOf` combined with each of `likes`, `score`,
   `scoreAllTime`, `sortTitle`, `timeCreated` and `views`, ascending and
   descending, which is **12 indexes**.

   The emulator does not enforce indexes. So every list shape is first run
   against **dev**, with the indexes deployed there (quickstart §3).

**My Builds** passes `userUid`, so it skips the filter and keeps showing an
author's duplicates (FR-010). **The author page** (`config.author`, no
`userUid`) is a public list, so it hides them. My Favorites loads by id and is
not filtered: a player who favourited a copy still sees it.

**Alternatives considered**

- Reuse `isDraft`. Rejected: that is the author's own choice, it drives the
  editor and My Builds, and the daily job would overwrite it.
- Filter in the browser after the query. Rejected: it breaks page sizes and
  counts.
- A `listed: true` flag. That has the same backfill problem as `duplicateOf`,
  but carries no information about which build is the original.

## R6. Remix credit, and the remix list on the original

**Decision.** In one pass over every build, the daily job derives for each
build:

- **`remixCredit`**: the number of distinct `authorUid`s, other than the
  build's own author, among builds (published or unlisted) whose `remixOf.id`
  is this build. It is what scoring reads.
- **`remixes`**: `{ count, items }`. Only *published* builds by *other*
  accounts are counted. Hidden duplicates are included, as Story 2's scenario 4
  requires. `items` holds at most **10** entries of `{ id, title, author }`,
  sorted by `scoreAllTime`, highest first. The page shows `count` and lists
  `items`.

Storing the remix list on the original costs **no read** on the build page.
Querying `remixOf.id == X` on every page view would cost at least one read
each time, even when nothing comes back. Spec 047 removed comments for exactly
that reason. The list lags by up to a day.

**Weights.** `WEIGHTS = { views: 1, upvotes: 25, likes: 100, remixes: 50 }` and
`WEIGHTS_VERSION = 3`. `activityTotal` adds `50 × remixCredit`. Builds still on
version 2, or on version 1, which is still the live state until 042's T034,
get the existing "rebased" step (decay only, base re-taken), so the change
never counts as activity (FR-007). All-time reads the same `activityTotal`, so
the credit counts there at once.

**Order within the job.** Credit has to be known before scoring, so the run
makes two passes:

1. Page through every build and collect the small fields, the fingerprints and
   the remix edges.
2. Derive the credit, the remix lists and the duplicate marks. Then compute the
   trends and write only what changed.

## R7. Rules

**Decision.** `duplicateOf`, `stepsHash`, `stepsSince`, `remixCredit` and
`remixes` join `serverOwned()` and `NON_EDITABLE_FIELDS`.

On **create**, `duplicateOf` may be absent or `null`, and nothing else. The
other four fields are refused on create.

`remixOf` stays writable by the author. A forged link earns its target at most
one credit per account (spec, edge cases). That is the same bound as a like.

## R8. Canonical URL of a hidden copy

**Decision.**

- **On the page:** `BuildDetails` points `<link rel="canonical">` at
  `/builds/{duplicateOf.id}` once the build has loaded, the same way it already
  sets `noindex` on an unlisted build.
- **Prerendering:** the snapshot leaves duplicates out, so no prerendered HTML
  and no sitemap entry exist for them. Crawlers that run JavaScript see the
  canonical tag; those that do not see neither the page nor a wrong claim.

## R9. The one-time link

**Decision.** `scripts/link-remixes.mjs`, using the Admin SDK and shaped like
`backfill-map-strategy.mjs`. It is a dry run by default; `--apply` writes. It
imports the fingerprint from `functions/builds/lineage.js` through
`createRequire`. That is safe here: it runs locally, never on Netlify (see the
CLAUDE.md note on Node 22.1.0).

- **Exact matches:** a build with no `remixOf` gets `remixOf = { id, title,
  author, authorUid }` of the earliest (`createTime`) build that still exists,
  by another account, with the same civilisation and fingerprint. It writes
  `remixOf` only. Running it again changes nothing.
- **Partial matches:** builds with a copy-marked title whose share of identical
  rows with an earlier build by another account is **≥ 0.8**. The script writes
  them to a review file (`scripts/.scratch/remix-review.md`) and links none of
  them. That was 51 builds at measurement. **The owner approves** by listing
  ids in `--approve=<file>`, and each is then linked to its best match.

  0.8 is where the distribution thins out: below it, the closest match is
  usually a common opening rather than the source.

The same script also seeds `duplicateOf: null`, `stepsHash` and `stepsSince`
on every build (R5). It runs once, before the app release that filters lists
(quickstart §2).

## R10. Release order

The order matters because one wrong step empties every list:

1. **Rules** (R7). Creating a build with `duplicateOf: null` must be allowed
   before any client sends it.
2. **Indexes** (R5). They have to finish building.
3. **Seeding plus the link script** (R9), with `--apply`.
4. **Functions** (the daily job, `updateHomeSnapshot`). This also carries
   042's still-pending weights. The first run rebases trends.
5. **The app release** that filters lists, writes `duplicateOf: null` on
   create, and shows the remix line and the duplicate notice.
6. **The seed again** (idempotent), for builds that old cached clients created
   between steps 3 and 5.
7. **The `aoe4-guides-api` deploy** with its filter. Until then its lists still
   show duplicates, which does no harm.
