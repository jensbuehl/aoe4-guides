---

description: "Task list for 033 — Prerendered SEO Head Tags for Build Pages"
---

# Tasks: Prerendered SEO Head Tags for Build Pages

**Input**: Design documents from `.specify/specs/033-prerender-build-seo/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: No test tasks. The constitution requires manual verification of the golden path rather than a
formal suite, so verification tasks appear inline where a claim needs checking.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete work)
- **[Story]**: Which user story the task serves
- **[!]**: Manual / owner-only — needs a deploy, a secret, or a judgement call

---

## Two honest notes before starting

**US1 and US2 are one artifact.** The spec separates "a shared link says what it is" from "a search
result names the build", and they are separately *valuable*, but they are not separately *shippable* —
once a file is emitted with `og:title`, adding `<title>` is one more line in the same string. They share
Phase 6 rather than pretending to be independent increments.

**There are two real shipping points, not one.** Phase 3 (the converter) stands alone: it fixes a live
defect in focus-mode speech whether or not anything else lands. Phase 6 is where the SEO feature itself
becomes real. Everything between them is plumbing that neither user sees.

---

## Phase 1: Setup & the blocking probe

**Purpose**: Answer the one question the whole design rests on, before building anything on top of it.

**⚠️ T002 is a hard gate.** If the probe fails, FR-001 and FR-024 need re-specifying and most of this
plan changes. Do not start Phase 2 speculatively while waiting for it — Phase 2 is cheap to do later and
expensive to redo.

- [X] T001 Write a probe page at `public/builds/__prerender-probe.html` containing a distinctive `<title>` and nothing else of consequence
- [X] T002 [!] Deploy the probe and check all four URLs in the R2 table of [research.md](./research.md): `/builds/__prerender-probe` serves the probe's title, and `/builds`, `/builds/new` and an existing `/builds/<real-id>` all still serve the SPA shell
- [X] T003 Record the outcome in the R2 section of [research.md](./research.md), replacing "UNVERIFIED" with what was observed — including whether introducing a `builds/` directory disturbed the `/builds` route
- [X] T004 Delete `public/builds/__prerender-probe.html` and the now-empty `public/builds/` directory
- [X] T005 [P] Add `firebase-admin` to `devDependencies` in `package.json` and run `npm install`; confirm it does not appear in any `dist/assets/*.js` after a build — verified: `firebase-admin@^13.6.0` installed, `grep` over `dist/assets/*.js` finds no trace of it

**Checkpoint**: **the serving model is proven.** R2 passed on the PR #131 deploy preview — extensionless resolution works and a `builds/` directory does not shadow the `/builds` route. No fallback needed, `_redirects` unchanged, FR-001 and FR-024 stand as specified.

---

## Phase 2: Foundational — make the module chain importable from Node

**Purpose**: `scripts/*.mjs` runs in plain Node, which does not resolve Vite's `@/` alias. Both the
converter and the snapshot script import from `src/`, so this blocks all of them.

Mechanical and behaviour-preserving: Vite resolves relative imports identically. Per R5 the chain is
bounded at 19 specifiers across 5 files; `villagerAggregator.js` and `icons/civs.js` are already leaves.

- [X] T006 [P] Convert the `@/` import in `src/composables/builds/icons/general.js` to a relative path
- [X] T007 [P] Convert the `@/` import in `src/composables/builds/icons/resources.js` to a relative path
- [X] T008 [P] Convert the `@/` import in `src/composables/builds/timingsHelper.js` to a relative path
- [X] T009 [P] Convert the 2 `@/` imports in `src/composables/builds/useAgeTimings.js` to relative paths
- [X] T010 Convert the 14 `@/` imports in `src/composables/builds/icons/iconService.js` to relative paths, keeping the `with { type: "json" }` attributes intact
- [X] T011 Verify the chain: `npm run build` passes, `npm run check:setup` passes, and `node -e "import('./src/composables/builds/icons/iconService.js')"` resolves with no loader flags

**Checkpoint**: `src/` icon and traversal modules import cleanly from plain Node.

---

## Phase 3: US4 — The steps read as English (Priority: P1)

**Goal**: Icons become the words a player would use. A build order is written in icons, so this is what
any non-JavaScript reader actually receives.

**Independent test**: Run the converter over real published builds and read the output as prose — each
step is a sentence a player would recognise, with no markup, no `undefined`, no doubled spacing, and
correct plurals on counted units.

**Ships alone**: yes. Fixes the live `undefined` defect in focus-mode speech regardless of the rest.

### Fix the lookup

- [X] T012 [US4] Replace the rebuild-and-scan in `getIconFromImgPath` in `src/composables/builds/icons/iconService.js` with a Map built once from `imgSrc`, memoised across calls (FR-013f — measured at 0.021 ms/lookup, ≈8 s across a full site)
- [X] T013 [US4] Change `getIconFromImgPath` in `src/composables/builds/icons/iconService.js` to return `null` on a miss instead of returning its own input string, which is what makes `.title` read `undefined` (FR-013a). Update the other caller, `src/composables/converter/useImportOverlayFormat.js:181`, to handle `null` — **there were three callers, not two.** `BuildOrderSectionEditor.vue:1483` feeds the result straight to `IconToolTip`, which reads `.description` off it unguarded, so `null` would throw at render where the old path-string return silently yielded `undefined`. It now skips showing the tooltip when nothing resolves, and its own hardcoded `aoe4guides.com` strip was removed as redundant with T014
- [X] T014 [US4] Make path normalisation origin-independent in `src/composables/builds/icons/iconService.js` — strip any scheme+host rather than the two hardcoded ones (FR-013g)

### The shared converter

- [X] T015 [US4] Create `src/composables/builds/icons/iconText.js` exporting a description-to-text converter: resolve `<img>` to names, drop unresolved images while counting them, convert `<br />`, normalise whitespace so no doubled or leading spaces remain (FR-013, FR-013a, FR-013b)
- [X] T016 [US4] Create `src/composables/builds/icons/plurals.js` holding irregular plurals only — invariants (*Barracks*, *Streltsy*, *Runestones*, *Wynguard Footmen*) and head-noun compounds (*Nest of Bees*). Include a header comment stating why this lives outside the icon JSON: that JSON carries `syncSkip` and is regenerated upstream, so a field added there is at risk of being discarded (FR-013d)
- [X] T017 [US4] Implement pluralisation in `src/composables/builds/icons/iconText.js`: apply only when a count immediately precedes the icon (`/(\d+)\s*x?\s*$/` on the preceding text) **and** the icon is countable (`type` is `unit` or `building` **and** `class` is not `landmark`). Rules in order — `-man`→`-men`, consonant+`y`→`-ies`, sibilant→`-es`, else `+s` — with `plurals.js` consulted first (FR-013c, FR-013d)
- [X] T018 [US4] Repoint `src/composables/builds/textToSpeechHelper.js` at `iconText.js`, deleting its private `convertImagesToText`/`convertImageToText`/`convertLineBreaks`/`convertSpecialCharacters`. Keep the speech-only additions (`getText`'s villager announcements, the `!` pause markers) on the speech side — they must not reach page text (FR-013, US4 §11)

### Guard it

- [X] T019 [P] [US4] Create `scripts/check-plurals.mjs` exiting 1 with a printed list when any key in `plurals.js` matches no icon title, modelled on `scripts/check-icons.mjs` (FR-013e)
- [X] T020 [P] [US4] Add `"check:plurals": "node scripts/check-plurals.mjs"` to `package.json` scripts
- [X] T021 [P] [US4] Add `npm run check:plurals` to `.github/workflows/ci.yml` beside `check:icons`

### Verify

- [X] T022 [US4] Run the converter over a sample of at least 50 real published builds and **read the output** — zero `undefined`, zero raw `<img`/`src=`, zero doubled spaces, plurals correct on counted units and absent on resources and landmarks (SC-009a). Use a temporary in-repo harness per CLAUDE.md and delete it afterwards — **done over 229 real published builds / 2,710 steps** (10 per civ × 23 civs through the public API, deduped). All structural checks pass; unresolved icons 15 across 7 distinct srcs, all genuinely missing from the vocabulary. Three defects the task list did not anticipate were found *by reading the output* and fixed — see the Phase 3 findings below
- [X] T023 [US4] [!] Listen to focus mode read a build aloud, including one step containing an icon outside the vocabulary — it must skip the icon silently rather than saying "undefined" — confirmed by the owner
- [X] T024 [US4] Confirm `npm run check:icons`, `npm run check:steps`, `npm run check:plurals` and `npm run check:setup` all pass

### Phase 3 findings — three defects found by reading the output, not by a check

Recorded here because each was invisible to every assertion in T022 and only showed up in the prose.

**1. `.png` is the load-bearing one, and it is what Phase 4 would have tripped over.** Icons moved to
WebP; stored builds were never backfilled, so pre-switch documents still carry `.png` paths. The first
harness run over raw API data lost **4,894 icons across 473 srcs** — every icon in every older build,
silently dropped. The views do not see this because `FocusMode.vue` and `BuildOrderEditor.vue` call
`convertStepImagePaths` on their *own copy* before rendering. `refresh-snapshot.mjs` reads Firestore
directly and has no such copy, so it would have written a snapshot with the icons missing and nothing
would have reported it. `iconText.js` therefore applies `withWebpPaths` itself — that module's own
header already says the rewrite is a read concern that must run everywhere a build is rendered, and the
converter is a read path. **Phase 4 must not re-add it**; it is idempotent, but the ownership matters.
After the fix: 15 unresolved across 7 srcs.

**2. `&gt;` was never handled, only `>`.** The editor encodes on save, so the encoded spelling is the
common one — a line the author began `> Take 5 vils` reached speech as `&gt; Take 5 vils`. Both
spellings are now decoded, and a `>` that *starts* a line is dropped as the bullet marker it is rather
than becoming "on" ("on At this point you are wide open" was the actual output).

**3. A line break is not a full stop.** `<br />` → `". "` unconditionally meant text already ending in
a full stop, followed by a blank line, produced `"click up... NOW:"` — one authored sentence end, three
delivered. Lines are now converted separately and joined with a stop only where the previous line does
not already carry one. Collapsing runs of dots afterwards was rejected: it cannot tell this apart from
an ellipsis the author actually wrote.

**Measured, replacing the estimate in T012**: indexed lookup is 0.00006 ms against the old 0.021 ms —
400,000 lookups in 26 ms where the scan would have taken 8.4 s.

**Checkpoint**: shippable on its own. Focus mode is measurably better and nothing else has changed.

---

## Phase 4: Foundational II — the snapshot pipeline

**Purpose**: Produce the committed build data that every later phase reads. Depends on Phase 3, because
step text is converted at refresh time, not at generation time.

**⚠️ This is the only code that touches Firestore.** Nothing in Phases 5–7 may import `firebase-admin`.

- [X] T025 Create `scripts/refresh-snapshot.mjs` per [contracts/snapshot-refresh.md](./contracts/snapshot-refresh.md): read `builds` where `isDraft == false` via `firebase-admin`, convert steps with `iconText.js`, traverse with `forEachStep` from `src/composables/builds/useAgeTimings.js` (**not** `flattenSections` — R8, FR-012), emit NDJSON sorted by `id` with a leading `_meta` line carrying `project` and `generated`
- [X] T026 Add a header comment to `scripts/refresh-snapshot.mjs` explaining that the one-object-per-line sorted format is load-bearing: reformatting or pretty-printing it turns every monthly refresh into a whole-file diff and accumulates ~48 MB of history a year (FR-027)
- [X] T027 Make `scripts/refresh-snapshot.mjs` exit **1** on failure — the opposite policy to the generator, because a refresh that quietly does nothing leaves pages generating from stale data indefinitely (FR-028). Write to a temp file and rename, so an interrupted run cannot leave a truncated snapshot to be committed
- [X] T028 Support `--limit=N` and `--out=path` in `scripts/refresh-snapshot.mjs` so it can be exercised without a full-collection read
- [ ] T029 [!] Create a read-scoped service account for the **`aoe4-guides`** project (prod — *not* `aoe4-guides-dev`, which is what the local `.env` points at) and store it as the `FIREBASE_SERVICE_ACCOUNT` GitHub Secret. It must not be added to Netlify and must never be committed (FR-029)
- [X] T030 Create `.github/workflows/refresh-seo-snapshot.yml` per the contract: monthly cron plus `workflow_dispatch`, `permissions: contents: write`, run the script, commit `data/seo-snapshot.ndjson` **only when it changed**, message `chore(seo): refresh build snapshot`
- [X] T031 [!] Confirm GitHub actually notifies the owner on scheduled-workflow failure (R12 item 3). FR-028 rests on this — confirm it, do not assume it. If notifications are off, turn them on or add an explicit failure step — confirmed by the owner: Actions email notifications are on, restricted to failed runs. The address the mail reaches is `jensbuehl`, which GitHub attributes commit 611abf6 (the workflow's `cron:`) to, and for `schedule` events that attribution is what selects the recipient
- [X] T032 [!] Trigger the workflow by hand via `workflow_dispatch` to produce the first `data/seo-snapshot.ndjson`, then check the committed diff: `_meta.project` reads `aoe4-guides`, the build count is plausible, and spot-checked step text is readable prose — **done, and all three checks passed**: `_meta.project` = `aoe4-guides`, 4,202 builds / 50,951 steps / 5.25 MB read in 3.9s, step text reads as prose. Took three runs: the first committed nothing (a `git diff` on an untracked file reports no change), the second was rejected by `main`'s signed-commit rule, the third landed. The snapshot was then reverted for reasons unrelated to the refresh — see R2c

### Phase 4 findings

**Section notes would have been lost from 39% of builds.** `forEachStep` iterates `section.steps`, and
the pre-migration section note lives in `section.gameplan`, which it never visits. Measured over 230
real published builds: 168 sections across 90 builds (39%) still store it there, because the migration
only runs when an author next saves. The contract said "traverse with forEachStep" and did not consider
this; following it literally would have shipped a snapshot missing section-level guidance from two
builds in five. Included, and the contract reconciled.

**Snapshot size revised: 1,243 bytes/build → ~4.7 MB at 4,000**, against R11's ~1,042 / ~4.0 MB. That
measurement predates both section notes and the legacy `.png` fix, each of which adds text. Immaterial
to the design — the format exists to make an *unchanged* build produce no diff, not to be small.

**The refresh cannot be run without a credential, so its Firestore half is unverified.** Everything
above it was checked offline against 230 real builds by importing the record builder directly: format
invariants hold (no embedded newlines, sorted by id, one stable key order, every line re-parses), and
failure paths exit 1 with a legible message and no stack trace.

**Checkpoint**: real build data is in the repo, and refreshing it costs one button press.

---

## Phase 5: US3 — The generator can never break a deploy, a build or CI (Priority: P1)

**Goal**: The safe path exists before there is anything that could run unsafely.

**Independent test**: `npm run build` with no `NETLIFY` variable produces unchanged Vite output, logs a
skip, exits 0, and creates no `dist/builds/`. CI stays green.

**Built before the emission logic on purpose** — a generator that can fail a deploy is worse than no
generator, so the guard rails go up first and are verified while there is nothing behind them.

- [X] T033 [US3] Create `scripts/prerender.mjs` implementing only the decision order in [contracts/prerender-cli.md](./contracts/prerender-cli.md): skip unless `NETLIFY` or `--force`; skip when `data/seo-snapshot.ndjson` is missing or unreadable; skip **loudly** when `dist/index.html` is missing or its shape is unrecognised; exit **0** in every case including failure (FR-018, FR-019, FR-020)
- [X] T034 [US3] Parse `--force`, `--limit=N` and `--dry-run` in `scripts/prerender.mjs` (FR-022)
- [X] T035 [US3] Implement the log contract in `scripts/prerender.mjs` — one summary line or block on every run, reporting the snapshot's `project` and age so a wrong database or a refresh that has stopped running is visible in the deploy log (FR-023, FR-028)
- [X] T036 [US3] Add `"postbuild": "node scripts/prerender.mjs"` and `"prerender": "node scripts/prerender.mjs --force"` to `package.json`, with no shell syntax — the same script runs on Windows locally and Linux on Netlify
- [X] T037 [US3] Verify locally: `npm run build` skips in well under a second, output is byte-identical to before, exit code is 0, and no `dist/builds/` appears (SC-005)
- [X] T038 [US3] Verify in CI: push and confirm `.github/workflows/ci.yml` stays green with no credential configured (SC-006)

### Phase 5 verification

Every branch of the decision order exercised, all exiting **0**, with `dist/` byte-identical
(sha256 over the whole tree) before and after all of them:

| Condition | Logged |
|---|---|
| no `NETLIFY`, no `--force` | `skipped — not a Netlify build (pass --force to run anyway)` |
| `NETLIFY` set, no snapshot | `skipped — data/seo-snapshot.ndjson not found` |
| `--force`, no snapshot | same |
| snapshot present | `snapshot aoe4-guides @ 2026-08-01 (11 days old) · 4012 builds` |
| snapshot from the dev project | summary **plus** a `WARNING` naming the wrong project |
| snapshot 223 days old | summary **plus** a `WARNING` that the refresh has probably stopped |
| unreadable `_meta` line | `skipped — … has no readable _meta line` |
| `dist/index.html` missing `</head>` | `NOT GENERATING —` (loud, stderr) |
| `dist/index.html` missing the hashed module script | `NOT GENERATING —` (loud, stderr) |
| unknown flag | warned, run continues |

The skip costs **91 ms** and creates no `dist/builds/`. `npm run build` and `npm run prerender` both
verified through the wired npm scripts, not just by calling node directly.

**Checkpoint**: the generator exists, runs nowhere by accident, and cannot fail anything.

---

## Phase 6: US1 + US2 — A shared link and a search result name the build (Priority: P1) 🎯 MVP

**Goal**: Every public build page returns its own title, description, canonical, social tags and step
data when fetched without JavaScript.

**Independent test**: `curl` 20 build URLs — each returns a distinct `<title>` and `<meta name=
"description">`; paste one into Discord and see that build's title on the card.

- [X] T039 [US1] Read `dist/index.html` as the template in `scripts/prerender.mjs` and assert its shape — a `</head>` to inject before, and at least one hashed `<script type="module" src="/assets/…">`. Never the repo-root `index.html`, which points at `/src/main.js` and does not exist in production. Emit nothing and log loudly if the assertion fails
- [X] T040 [US1] Strip the shell's page-level tags from the template copy in `scripts/prerender.mjs` — `<title>`, `meta[name=description]`, `og:type`, `og:url`, `og:title`, `og:description`, `twitter:url`, `twitter:title`, `twitter:description` — keeping `og:site_name`, the image tags, `twitter:card` and `twitter:domain` (see [contracts/generated-page.md](./contracts/generated-page.md))
- [X] T041 [P] [US1] Implement field derivation in `scripts/prerender.mjs`: title with a civ-based fallback when blank, description stripped of markup, whitespace-collapsed and truncated on a word boundary with a composed fallback when blank (FR-008, FR-009)
- [X] T042 [P] [US1] Implement HTML-attribute escaping in `scripts/prerender.mjs` so a title containing `"`, `<`, `>` or emoji cannot break out of a meta attribute (FR-011)
- [X] T043 [US2] Produce the canonical URL in `scripts/prerender.mjs` using the **same rule** as `setCanonical` in `src/router/index.js:64` — no trailing slash, no query string — so the prerendered tag and the one the router writes can never disagree (FR-007)
- [X] T044 [US1] Assemble and inject the head block in `scripts/prerender.mjs` per [contracts/generated-page.md](./contracts/generated-page.md), with `og:type` set to `article`. Leave `#app` empty — nothing is added to the body (FR-003, FR-006)
- [X] T045 [US4] Emit the `HowTo` structured data block in `scripts/prerender.mjs` from the snapshot's already-converted `steps`, omitting `step` entirely when a build has none, and escaping with `JSON.stringify` plus `<` → `&lt;` so a title containing `</script>` cannot terminate the block (FR-010, FR-011)
- [X] T046 [US1] Validate each build id against a safe-filename pattern in `scripts/prerender.mjs` before using it as a path; skip and count anything that fails. The generator must not be able to write outside its output directory whatever an id contains
- [X] T047 [US1] Write pages into a temporary directory and rename into place as the final step in `scripts/prerender.mjs`, clearing the output directory first so a standalone `npm run prerender` is idempotent without relying on Vite having emptied `dist/` (FR-004, FR-021)
- [X] T048 [US1] Exercise with `npm run prerender -- --limit=20` and read the emitted HTML: distinct titles, correct canonicals, parseable structured data, hashed module script present
- [X] T049 [US1] Verify escaping against a build whose title contains `"`, `<`, `</script>` and emoji — markup stays well-formed and the structured data still parses
- [X] T050 [US1] [!] Deploy, then `curl` 20 build URLs and confirm each returns its own `<title>` and `og:title` where all previously returned the site default (SC-001) — **done against production**: 20 randomly-sampled mixed-case ids, 0 failures, 20 distinct titles, 0 still showing the shell default, every canonical matching the router's rule and every page carrying its `ld+json` block
- [ ] T051 [US1] [!] Paste a build URL into Discord, Slack and a Twitter/X card validator — all three show that build's title and summary (SC-002)
- [ ] T052 [US2] [!] Load a prerendered page in a browser, let the app boot, and confirm the canonical tag is byte-identical before and after (SC-004, FR-007), and that the page looks and behaves exactly as it did before this feature

### Phase 6 verification

Generated against a snapshot built from 230 real published builds through the actual record builder,
plus three planted records: one hostile, one with every field blank, and two unsafe ids with one
unparseable line. **232 pages written, 3 skipped (2 unsafe id, 1 unparseable).** Every page checked
programmatically:

- exactly one `<title>`, `description`, `canonical`, `og:title`, `og:url`, `og:type` — no shell
  duplicates surviving, and **0 pages** still carrying the shell's default title
- `og:site_name`, `og:image`, `twitter:card` all retained; `og:type` is `article`, never `website`
- canonical byte-equal to the router's own rule for all 232
- structured data parses on all 232, `@type` is `HowTo`, step positions sequential, `step` absent
  rather than `[]` where a build has none
- the hashed module script and an empty `<div id="app"></div>` present on all 232
- idempotent: two runs byte-identical. A stale page planted in the output directory is removed.
  `--dry-run` leaves the output untouched; `--limit=20` emits 20

231 distinct titles across 232 pages — the one repeat is two different builds whose authors gave them
the same name, which SC-001 permits: it asks that each page carry *its own* title, and their canonicals
and `og:url`s differ.

### Three defects found here

**1. `$&` in a title would have spliced the page into itself.** The head block was interpolated into a
`String.replace` *replacement string*, where `$&` and `$1` are substitution patterns. A build titled
`50$&100` would have injected the matched text into its own markup. Now a replacer function, which has
no such expansion — and the same change fixed the injected block's indentation.

**2. The JSON-LD escape in the contract was wrong.** It specified `<` → `&lt;`. A
`<script type="application/ld+json">` block is parsed as JSON, not HTML, so entities are never decoded
and `&lt;` would corrupt any title containing `<`. Implemented as `<`, JSON's own escape, which
parses back to `<` while leaving nothing for the HTML parser to read as `</script>`. Contract corrected.

**3. The shell's canonical comment ships false.** It reads "No `<link rel="canonical">` here on
purpose", and generated pages carry exactly that tag three lines below it. Stripped from the generated
copy; the reasoning stays in the shell where it is still true.

**Checkpoint**: the feature is real. Shared links and search results name the build.

---

## Phase 7: US5 — Every public build is discoverable (Priority: P2)

**Goal**: The sitemap lists every public build instead of five static routes.

**Independent test**: fetch the sitemap after a deploy — it validates, and its URL count equals the
public build count plus the static routes.

**Deliberately after Phase 6**: a sitemap shipped before per-page titles would invite crawlers to index
4,000 identical pages.

- [X] T053 [US5] Generate `dist/sitemap.xml` in `scripts/prerender.mjs` covering every emitted build page plus the static routes currently in `public/sitemap.xml`, with `lastmod` from the snapshot's `created` (FR-015)
- [X] T054 [US5] Carry the namespace warning from `public/sitemap.xml` into the generator's output or its source comment — the URI is `http://` and is compared literally; "fixing" it to `https://` puts the document in an unknown namespace and search engines reject it
- [X] T055 [US5] Guard the URL count in `scripts/prerender.mjs`: single file below 45,000, split with an index above it rather than silently truncating (FR-017)
- [X] T056 [US5] Confirm a skipped run leaves `public/sitemap.xml`'s 5-URL copy in `dist/` untouched — this must fall out of the design rather than need handling (FR-016)
- [X] T057 [US5] Validate the emitted sitemap against the sitemap schema and cross-check that no URL in it is disallowed by `public/robots.txt` (FR-017, SC-003)

### Phase 7 verification

Generated over 230 real builds: **235 URLs, 1 file** (5 static + 230 builds). Sixteen checks pass —
XML declaration, the literal `http://` namespace (and explicitly *not* `https://`), every `<url>` has a
`<loc>`, no duplicates, all absolute on the right origin, no unescaped metacharacters, no stray trailing
slashes, every `<lastmod>` a real W3C date and none in the future, balanced tags, closes `</urlset>`.

**Cross-checks that matter more than the schema**: no URL is disallowed by `public/robots.txt` (9 rules
read from the file, not restated), and every build URL in the sitemap has a generated page behind it.
The robots filter is enforced by the generator, not just asserted here, so a future robots.txt edit
cannot silently produce a sitemap that contradicts it.

**The split path was actually exercised**, not just written: with the guard temporarily lowered to 100,
235 URLs produced three chunk files plus a `sitemapindex`, totalling 235 URLs. Guard restored to 45,000.
This branch is unreachable at ~4,000 builds, which is exactly why it needed running once.

**T056 fell out of the design as intended** — a skipped run never reaches the sitemap writer, so Vite's
copy of the 5-URL static file survives untouched, comment and all. No code implements that.

The static routes are **read** from `public/sitemap.xml` rather than restated, so it stays the one place
they are declared and their hand-set `<priority>` values carry through.

**Checkpoint**: ~4,000 URLs submitted instead of 5.

---

## ✅ RESOLVED — R2c, fixed and live

The feature reached production on 2026-08-12 and was reverted the same hour. Netlify **canonicalises
request paths to lowercase and 301s to them**, and Firestore build ids are case-sensitive mixed case, so
every generated page redirected to a URL under which the app cannot find its build. Head tags correct,
page empty. Full finding, evidence and the fix to try: [research.md R2c](./research.md).

Reverted by removing `data/seo-snapshot.ndjson` from `main` — the generator's own skip path, so no code
changed and the site was back in 45 seconds.

**Fixed in PR #132** with `netlify.toml` → `[build.processing.html] pretty_urls = false`, verified on the
preview before merging and confirmed on production: a mixed-case id returns **200 with no `Location`
header**, and extensionless resolution still works — so FR-001 stands and no fallback was needed.

- [X] T064 Add `netlify.toml` with `[build.processing.html] pretty_urls = false`, push to a branch, and check on the **preview** that `curl -sI /builds/<a mixed-case id>` returns 200 with no redirect — while `/builds`, `/builds/new` and an unprerendered build still behave. **Never straight to production**
- [X] T065 ~~If pretty-URL canonicalisation cannot be disabled without losing extensionless resolution, re-specify FR-001 per R2's original fallback~~ — **not needed.** The two turned out to be separable: with `pretty_urls = false` a mixed-case id returns 200 directly and extensionless resolution still works, so FR-001 stands as written
- [X] T066 Once fixed, re-run the refresh workflow to re-commit the snapshot, then redo T050–T052 against production
- [X] T067 **Indexing was blocked by something older than this feature** — App Check refuses Googlebot's Firestore read, so every page rendered "Build Order Not Found" and Google reported soft 404 on all 4,202. Diagnosed from Search Console's own console output and fixed in PR #133 (API fallback in `getBuild`). Full finding: [research.md R2d](./research.md). The lesson is the same shape as R2c: I verified against the artefact we produce, not against the system that consumes it — a single Search Console inspection of an *existing* build page, before any code, would have found it
- [ ] T068 [!] Re-test the same URL in Search Console now that #133 is live: expect "URL is available to Google" instead of Soft 404, then request indexing

---

## Phase 8: Polish & cross-cutting

- [X] T058 [P] Update `public/sitemap.xml`'s comment — "Individual build order pages are not listed yet" is no longer true, and the file is now a fallback for a skipped run rather than the live sitemap
- [X] T059 [P] Update the comment block in `index.html` explaining why there is no canonical tag, to note that build pages now receive one per file at build time
- [ ] T060 [!] Measure the first full deploy's duration and file count against a pre-feature deploy, and record it in [research.md](./research.md) R12 item 4. No prediction was offered; this is the measurement. The owner has said upload time is not a concern, so this is a data point, not a gate
- [X] T061 Implement FR-030 in `src/router/index.js` — skip the `afterEach` title reset when a prerendered title is already present — **or delete the requirement**. It is cosmetic, the end state is already correct, and search engines read the end state. Decide; do not let it linger
- [X] T062 Added the trap Phase 7 turned up, which cost a failed deploy: **a `scripts/*.mjs` importing from `src/` runs locally and in CI and dies on Netlify**, because Netlify pins Node 22.1.0 and module-syntax detection landed in 22.7.0. Recorded with its conditions (which scripts are exempt, and why), the reproduction (`node --no-experimental-detect-module`), and the second lesson underneath it — a `try/catch` around `main()` cannot make a script deploy-safe, because a static import throws before the handler exists
- [ ] T063 [!] After ~90 days, compare search-console impressions and indexed-page count for build pages against the pre-deploy baseline (SC-010). Directional only — indexing latency is outside the project's control

---

## Dependencies

```
Phase 1 (probe) ──────────── GATE: everything below assumes T002 passed
      │
      ▼
Phase 2 (Node-importable @/ → relative)
      │
      ▼
Phase 3 (US4 converter) ──── SHIPPABLE ALONE: fixes focus-mode "undefined"
      │
      ▼
Phase 4 (snapshot + workflow) ── needs Phase 3: steps are converted at refresh
      │
      ▼
Phase 5 (US3 gating) ─────── needs Phase 4: skip condition is "snapshot missing"
      │
      ▼
Phase 6 (US1+US2 head) ───── 🎯 MVP: the feature becomes real
      │
      ▼
Phase 7 (US5 sitemap) ────── after Phase 6, never before
      │
      ▼
Phase 8 (polish)
```

**Story dependencies**: US4 → (US1, US2, US5), because the snapshot cannot be produced without the
converter. US3 → (US1, US2, US5), because the generator's safe path is built before its output. US1 and
US2 are one artifact. US5 requires US1/US2.

This chain is more linear than a task list usually wants. That is a property of the feature, not a
failure of decomposition: there is one script, one data file, and one output format, and each depends on
the last. Splitting further would be fiction.

## Parallel opportunities

| Phase | Parallel tasks | Note |
|---|---|---|
| 1 | T005 alongside T001–T004 | Dependency work is independent of the probe |
| 2 | T006, T007, T008, T009 | Four separate files; T010 is the big one and is best done alone |
| 3 | T019, T020, T021 | Check script, npm script, CI wiring — three files |
| 6 | T041, T042 | Field derivation and escaping are separable concerns |
| 8 | T058, T059 | Two unrelated comment updates |

Everything else is sequential because it edits `scripts/prerender.mjs`.

## Implementation strategy

**Stop after Phase 3 if you want a quick win.** The converter fixes a live defect in focus-mode speech
and touches nothing else. It is a complete, valuable, low-risk change on its own.

**Phase 6 is the MVP** for the feature as specified — but note it depends on Phases 1–5, so "MVP" here
means roughly 80% of the work. That is unavoidable: emitting a correct page requires data (Phase 4),
guard rails (Phase 5) and a proven serving model (Phase 1). There is no smaller slice that produces a
working prerendered page.

**Phase 7 is genuinely optional** and can trail by weeks without cost.

## Task summary

| Phase | Story | Tasks | Count |
|---|---|---|---|
| 1 — Setup & probe | — | T001–T005 | 5 |
| 2 — Node-importable chain | — | T006–T011 | 6 |
| 3 — Converter | US4 (P1) | T012–T024 | 13 |
| 4 — Snapshot pipeline | — | T025–T032 | 8 |
| 5 — Gating | US3 (P1) | T033–T038 | 6 |
| 6 — Head block | US1+US2 (P1) | T039–T052 | 14 |
| 7 — Sitemap | US5 (P2) | T053–T057 | 5 |
| 8 — Polish | — | T058–T063 | 6 |

**Total: 63 tasks.** 11 are manual/owner-only `[!]` — a deploy, a secret, a listen, a look at a card
preview. 14 are parallelisable.
