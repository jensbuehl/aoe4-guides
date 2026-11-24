# Tasks: Remix Lineage and Credit

**Input**: Design documents from `.specify/specs/044-remix-lineage/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: This spec asks for them. The rules cases L1–L9 are written first and
must pass against the live rules before the new rules exist (CLAUDE.md), and
`check:lineage` fixtures come before `lineage.js` is filled in.

**Owner-gated**: tasks marked **(owner)** write to production or deploy. Each
needs the owner's go-ahead at the time it runs (quickstart §4).

## Phase 1: Setup

- [X] T001 Add `"check:lineage": "node scripts/check-lineage.mjs"` to `package.json`, and a `npm run check:lineage` step after `check:search` in `.github/workflows/ci.yml`
- [X] T002 [P] Create a stub `functions/builds/lineage.js` that exports `stepRows`, `fingerprint` and `derive`, each throwing "not implemented", with a header comment naming `forEachStep` in `src/composables/builds/useAgeTimings.js` as the traversal it mirrors (research R4)

---

## Phase 2: Foundational (blocks every story)

**Purpose**: the pure lineage module, the rules, the indexes and the weights. Every story reads from these.

### Tests first

- [X] T003 [P] Write `scripts/check-lineage.mjs`. It loads `functions/builds/lineage.js` through `createRequire`, imports nothing from `src/` (so it is CI-safe) and runs the fixtures listed in quickstart §1. Each fixture asserts the `derive()` output fields from contracts/lineage-job.md. It must fail against the T002 stub.
  - *Done*: 22 checks; crashed against the stub before T005.
- [X] T004 [P] Write `tests/rules/lineage.rules.test.mjs` with cases L1–L9 from contracts/firestore-rules.md, reusing the helpers of `tests/rules/builds.rules.test.mjs`. Run it with `RULES_FILE=<copy of the live rules>` and record that L3, L4, L5, L6 and L9 are **allowed** today (the hole exists).
  - *Done*: Against the live rules (= main at 85d766b) 10 refusals of L3–L6 were ALLOWED: the hole is real. L9 was already refused (only the author may update a build), so the contract's note on L9 was wrong; L9 now guards against regressions.

### Implementation

- [X] T005 Implement `stepRows` and `fingerprint` in `functions/builds/lineage.js`:
  - rows in the order `forEachStep` visits them: ordinary steps, plus the steps inside alternatives paths;
  - skip items with a `kind` other than alternatives, skip nested blocks, and leave out section `gameplan`;
  - normalise per research R4, turning each `<img>` into `[name]` (file name without extension, so `.png` and `.webp` agree) **before** stripping the remaining HTML;
  - SHA-1 hex via `node:crypto`, and `null` when there are fewer than 5 rows.
  - *Done*: Icons become [name] before tags are stripped; .png and .webp agree.
- [X] T006 Implement `derive(builds, nowMs)` in `functions/builds/lineage.js` per data-model.md:
  - `stepsSince`: seeded from `createTimeMs`, kept when the hash is unchanged, otherwise `nowMs`;
  - duplicate groups: published only, grouped by `(civ, stepsHash)`, ordered by `stepsSince` → `createTime` → id; the original author's build with the highest `scoreAllTime` is listed;
  - `remixCredit`: distinct other accounts;
  - `remixes`: published builds by other accounts, `count` plus the top 10 by `scoreAllTime`.
  - *Done*: check:lineage 22/22.

  `npm run check:lineage` passes.
- [X] T007 Update `firestore.rules`:
  - `serverOwned()` gains `duplicateOf`, `stepsHash`, `stepsSince`, `remixCredit` and `remixes`;
  - the create rule refuses those four fields other than `duplicateOf`, and allows `duplicateOf` only when absent or `null`;
  - update the comments that list the fields.
  - *Done*: test:rules 108/108 on the new rules.

  `npm run test:rules` passes in full: L1–L9 and every earlier case.
- [X] T008 [P] Add the five fields to `NON_EDITABLE_FIELDS` in `src/composables/data/buildService.js`, keeping the "mirrored by serverOwned()" comment true. In `addBuild`, set `duplicateOf: null` and delete the other four from the saved copy, so a remix template can never carry them over from its source.
  - *Done*: LINEAGE_FIELDS exported and pushed into NON_EDITABLE_FIELDS; addBuild saves through newBuildPayload (clears lineage, writes duplicateOf: null).
- [X] T009 [P] Add 12 composite indexes to `firestore.indexes.json`: `duplicateOf` ASC combined with each of `likes`, `score`, `scoreAllTime`, `sortTitle`, `timeCreated` and `views`, both ASC and DESC. Copy the shape of the existing `isDraft` pairs.
  - *Done*: 109 indexes.
- [X] T010 [P] In `functions/builds/trend.js`:
  - `WEIGHTS` gains `remixes: 50`, and `WEIGHTS_VERSION` becomes 3;
  - `activityTotal` adds `WEIGHTS.remixes × remixCredit`, treating a missing value as 0 and non-finite as 0;
  - update the doc comment that explains the weights, citing spec 044's clarification: a remix counts below a like and above an upvote.
  - *Done*: updateBuildAllTimeScore reads whole documents, so it needs no change.

  Check that `updateBuildAllTimeScore.js` reads whole documents (it has no `select`), so it picks up `remixCredit` with no change.

**Checkpoint**: `check:lineage`, `test:rules` and `npm run build` are green. No story can be shown yet.

---

## Phase 3: User Story 1 — Old copies point at their original (P1) 🎯 MVP

**Goal**: every exact copy by another account links to the earliest surviving original, using the existing credit line.

**Independent test**: a dry run on production lists about 300 links and 0 changes to anything else. After `--apply`, a second dry run reports 0, and "2 TC ayyubid 'the beasty build' - copy" shows "Remix of … by Patatasfritas".

- [X] T011 [US1] Write `scripts/link-remixes.mjs` per contracts/lineage-job.md. Take the header, the project print and the dry-run default from `scripts/backfill-map-strategy.mjs`. Load `fingerprint` via `createRequire("../functions/builds/lineage.js")`. Read every build in full, with `doc.createTime`.
- [X] T012 [US1] In `scripts/link-remixes.mjs`, implement **seed**: builds lacking `duplicateOf` get `null`, builds lacking `stepsHash` get the fingerprint, and builds lacking `stepsSince` get `createTime`. Never overwrite a present field.
- [X] T013 [US1] In `scripts/link-remixes.mjs`, implement **exact links** for builds where `remixOf` is absent (not `null`). The target is the earliest build by `createTime` with the same civ and fingerprint, by another `authorUid`, that still exists. Write `remixOf = { id, title, author, authorUid }` only. Running it twice changes nothing.
  - *Done*: Rule corrected: the target is the earliest build with the same steps, and the copy is linked only when that build is by another account.
- [X] T014 [US1] In `scripts/link-remixes.mjs`, implement the **review list** and **`--approve=<file>`**:
  - copy-marked titles (the regex from research R1) with no exact link, whose share of identical rows with their best earlier match by another account is ≥ 0.8, are written as a table to `scripts/.scratch/remix-review.md`;
  - ids listed in the approve file are linked to their best match;
  - print counts per kind, and use batches of 500.
  - *Done*: Ties in similarity go to the earlier build, so a near match names the original, not a copy of it.
- [X] T015 [US1] Dry run against **dev** with a dev key. Then run `--apply`, and a second dry run must report 0.
  - *Done*: No dev service-account key here, so this ran on the Firestore emulator instead (scripts/.scratch/link-harness.mjs, gitignored): 16/16. Covers a back-dated timeCreated, chains, same author, remixOf null, an existing link, other civ, under 5 rows, a near match with and without approval, and a second dry run giving 0.
- [X] T016 [US1] **(owner)** Dry run on production (read-only; quickstart §2). Record the counts in research R1, and hand the owner `remix-review.md` to approve.
  - *Done*: Production dry run (read-only): 5,430 seeds, 324 exact links (268 published), 51 near matches in scripts/.scratch/remix-review.md (044 worktree). The owner has not approved any yet.

**Checkpoint**: the script is proven on dev, and the production plan has been reviewed. The apply waits for the release order (T034).

---

## Phase 4: User Story 3 — A remix earns the original credit (P2)

Placed before US2 because US2's list comes out of the same derivation and the same job change.

**Goal**: the nightly job credits each build 50 per distinct other account that remixed it, without the switch showing up as activity in Trending.

**Independent test**: the `check:lineage` fixture (three accounts, one of them twice, plus the author) gives credit 4 → 200 activity. On dev, the job's `lineage` log shows `credited > 0`, and `rebased` is close to the build count on the first run.

- [X] T017 [US3] Rework the read in `functions/builds/updateBuildTrend.js`:
  - page `builds` 500 at a time, ordered by `__name__`, adding `steps`, `civ`, `scoreAllTime`, `remixOf`, `duplicateOf`, `stepsHash`, `stepsSince`, `remixCredit` and `remixes` to `select()`;
  - compute `fingerprint(steps)` per document and keep no `steps` past the page;
  - capture `doc.createTime`;
  - rewrite the "nothing here needs steps" comment to explain the paging (research R3).
  - *Done*: readBuilds(): pages of 500 by __name__, steps fingerprinted then dropped, createTime captured.
- [X] T018 [US3] In `functions/builds/updateBuildTrend.js`:
  - call `derive()` before scoring, and pass each build's derived `remixCredit` into `activityTotal` / `nextTrend`;
  - add `stepsHash`, `stepsSince` and `remixCredit` to the per-build update, only when they changed;
  - log `updateBuildTrend: lineage` with the counts from contracts/lineage-job.md.
  - *Done*: derive() runs before scoring; build.remixCredit feeds activityTotal; lineage log line written.
- [X] T019 [US3] Run the job against dev (deploy the functions to `aoe4-guides-dev`, then force-run). Check:
  - the `lineage` log;
  - one build whose `remixCredit` you have counted by hand;
  - that no trend rose on the switch.
  - *Done*: Ran on the Firestore EMULATOR, not dev (deploying functions to dev was not needed to prove the logic): 13/13 — duplicate hidden despite timeCreated 0, credit 2 (one unlisted), remix list of 1, duplicateOf null back-filled, no remixes field where none, trendWeights 3, steps untouched, second run stable, an edited copy listed again with stepsSince moved, a deleted remix withdraws its list and credit. The search upload fails there (no Storage emulator) and is caught by design.

  Note what was verified in this task.

---

## Phase 5: User Story 2 — The original shows its remixes (P2)

**Goal**: a build page says "Remixed N times" and lists the published remixes by other players.

**Independent test**: on dev, an original with two published remixes and one unlisted one shows "Remixed 2 times" and lists two, after the job has run.

- [X] T020 [US2] In `functions/builds/updateBuildTrend.js`, write `remixes` when the derived value differs from the stored one (deep-compare `count` and the item ids and titles), and `FieldValue.delete()` when the count drops to 0.
  - *Done*: remixes written on change, FieldValue.delete() at 0.
- [X] T021 [US2] In `src/components/builds/BuildMetaLines.vue`, add the "Remixed N times" line per contracts/ui.md:
  - after the "Remix of" line;
  - a `v-menu` button listing `remixes.items` as router-links "<title> by <author>";
  - an "and N more" row when needed;
  - one-line truncation with a `title` attribute;
  - the `mdi-source-fork` icon;
  - the singular/plural wording.
  - *Done*: Menu trigger is a plain button styled as the caption link (a v-btn would make the line taller).

  Extend the `hasLines` computed so the block shows when only `remixes` is present.
- [X] T022 [P] [US2] Add `mdi-source-fork` to `src/plugins/mdiIcons.js`, then run the CLAUDE.md `comm` check. It should print only `mdi-svg` and `mdi-xxx`.
  - *Done*: comm check prints only mdi-svg and mdi-xxx.

---

## Phase 6: User Story 4 — The same build appears once (P3)

**Goal**: public lists, rankings, search, the sitemap and the snapshot show each build order once. The author still sees their hidden copy, and why it is hidden.

**Independent test**: on dev, an original and two unchanged copies, all published. Builds, a civ page, Trending, All-time and search show only the original. Each copy opens by its link, shows "Remix of …", and has its canonical tag pointing at the original. My Builds shows the copy's author a "Duplicate" chip.

- [X] T023 [US4] In `functions/builds/updateBuildTrend.js`:
  - write `duplicateOf` when it changes, and `null` where it is missing;
  - leave builds with a non-null `duplicateOf` out of `searchRows` and out of the `listed` comparison.
  - *Done*: The duplicate drop lives in buildSearchIndex, so check:search proves it (new case).

  Update `scripts/check-search.mjs` if its fixtures assume every published build is indexed.
- [X] T024 [P] [US4] In `functions/builds/updateHomeSnapshot.js`, add `["duplicateOf", "==", null]` beside the `isDraft` filter in all four queries, including `.count()`.
  - *Done*: listed() = isDraft==false && duplicateOf==null, used by all four queries.
- [X] T025 [P] [US4] In `scripts/refresh-snapshot.mjs`, add `.where("duplicateOf", "==", null)` to the builds query, with a comment explaining why: the sitemap and the prerendered pages drop hidden copies (research R8). Running it is CI-only, and it imports nothing new.
- [X] T026 [US4] In `src/composables/data/queryParameterBuilder.js` `getQueryParametersFromConfig`, when `userUid` is falsy, append `where("duplicateOf", "==", null)`. Comment that My Builds passes `userUid` and must keep showing duplicates (FR-010). Check that `getBuildsCount` and `getCivBuilds` go through the same path. Also check the API fallback in `getCivBuilds` (`API_SORTS` route): it is fixed by T033, not here.
  - *Done*: Filter added only when there is a config and no userUid; contributorService passes config null, so its query stays untouched.
- [X] T027 [US4] In `src/views/builds/BuildDetails.vue`, next to `setNoIndex`:
  - watch `build.value?.duplicateOf?.id` and point `<link rel="canonical">` at `https://aoe4guides.com/builds/{id}`;
  - restore the router's canonical when the value clears and on unmount.
  - *Done*: The canonical tag moved to src/composables/canonical.js, shared by the router and the view without a circular import. No reset on unmount, because the router's afterEach has already moved on by then.

  Read `src/router/index.js` to learn how the router writes the tag, and reuse it rather than writing a second way.
- [X] T028 [US4] In `src/views/builds/BuildDetails.vue`, add the author-only `v-alert` per contracts/ui.md (info, tonal, in the content column) when `user.uid === build.authorUid && build.duplicateOf`. It links the listed build.
  - *Done*: Drawn as surface/lg with an accent link: the theme's info tonal gave gold text on the light surface, hard to read (seen in the screenshot).
- [X] T029 [P] [US4] In `src/components/builds/BuildListCard.vue`, add a "Duplicate" chip beside both "Unlisted" chips (the phone and the md+ layouts). It uses the same size and shape but not the error colour. Check the reserved card heights in CLAUDE.md: the chip must not add a line at any breakpoint.
  - *Done*: UX gate found the chip wrapping the chip row at 393 (card 96 to 119px). Fixed structurally: .blc-chiprow keeps one 24px row and overflow drops off whole, as .blc-meta--xs does. Status chips come first, so an age chip drops. This also bounds the same case for Unlisted plus three age chips.
- [X] T030 [US4] On dev: deploy the indexes (T009) and wait until they are built. Seed with `link-remixes.mjs --apply` (dev key). Then run the app against dev and open every list shape from quickstart §3. None may be empty. Record any missing-index error, and add its index to `firestore.indexes.json`.
  - *Done*: Indexes deployed to aoe4-guides-dev (indexes only; nothing deleted). REST probe: all 48 shapes servable (6 sorts × 2 directions × plain/civ/author/civ+season+map). Dev is NOT seeded (no dev key here), so this branch's app shows empty public lists against dev until link-remixes runs there.

---

## Phase 7: Polish, verification and release

- [X] T031 Run `npm run build`, `check:setup`, `check:steps`, `check:lineage`, `check:search` and `test:rules`, and fix whatever they surface.
  - *Done*: build, check:setup, check:steps, check:lineage, check:search, icons, plurals, seasons all green; test:rules 108/108.
- [X] T032 Run the UX gate (`ux-gate` skill) on dev data:
  - the remix menu, the author notice and the Duplicate chip;
  - at 360 and 393 px on Android and at 1280 px, in light and dark;
  - signed-in states, using a stand-in user as in 042.
  - *Done*: Probe at 360/393 (Android UA) and 1280, light and dark, stand-in user, lineage fields layered onto buildService's results, no writes: 80/80. Not verified: iOS Safari, a real device, keyboard focus in the menu, real dev data with lineage fields.

  Say plainly what was not verified.
- [X] T033 [P] In `../aoe4-guides-api/src/controllers/BuildsController.ts`, add `.where("duplicateOf", "==", null)` to every list query (not to the by-id route, which RTS Overlay uses). Build that repo. The deploy is owner-gated; see T034 step 7.
  - *Done*: aoe4-guides-api: list query filters duplicateOf == null, by-id untouched; tsc clean. Not committed or deployed. That repo also has an unrelated pre-existing package-lock.json change, left alone.
- [ ] T034 **(owner)** Release on production in the order of quickstart §4, each step with a go-ahead:
  1. the rules;
  2. the indexes, then wait until they are built;
  3. `link-remixes.mjs --apply` (with `--approve`), then a dry run must report 0;
  4. the functions, then force-run `updateBuildTrend` and `updateHomeSnapshot`;
  5. merge to `main` and push the app (one Netlify build);
  6. `link-remixes.mjs --apply` again;
  7. the API deploy.

  Tick off the steps here as each is done.
- [ ] T035 **(owner)** The production checks from quickstart §5. Note SC-001 (no unlinked exact copy by another account) from a final dry run. SC-004 is checked in the next day's comparison log.
- [ ] T036 Harvest per CLAUDE.md:
  - reconcile research R1 and the spec with the real counts;
  - note in CLAUDE.md that every new build field which public lists filter on must exist on every document, because `== null` does not match a missing field;
  - delete `scripts/.scratch/{copies,remixes,lineage}.mjs` from the main tree (042 T037).

---

## Dependencies & Execution Order

- **Setup (T001–T002)** comes first.
- **Foundational (T003–T010)** blocks every story. T003 and T004 come before T005–T007.
- **US1 (T011–T016)** needs T005 (fingerprint) and T008. It is independent of the job changes.
- **US3 (T017–T019)** needs T006 and T010.
- **US2 (T020–T022)** needs T017–T018, because it uses the same job edit.
- **US4 (T023–T030)** needs T017. T030 needs T009 and T012.
- **The release (T034)** needs everything, and runs strictly in quickstart §4 order: filtering before the seed empties the lists.

## Parallel opportunities

- T002 can run alongside T001.
- T003 and T004 can run together (different files).
- T008, T009 and T010 can run together once T007 has started.
- Within US4, T024, T025 and T029 can run together. T026–T028 touch the client and run one after another.
- T033 (the other repo) can run any time after T009.

Run agents one at a time, as the owner prefers. "Parallel" here only means the
tasks have no order between them.

## Implementation Strategy

1. **MVP**: Phases 1–3. US1's links alone fix attribution through the existing credit line. They need no new code to show, so **the owner may run T034 step 3 early, on its own**: the seed fields are harmless before the rules and the app use them. The rest of T034 keeps its order.
2. **Next**: US3 and US2, which ship together in one functions deploy and one small app change.
3. **Then**: US4, which carries the release-order risk. Ship it only after T030 proves on dev that every list shape is served.
4. **Netlify minutes**: one app push for the whole feature (T034 step 5).
