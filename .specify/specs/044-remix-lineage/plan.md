# Implementation Plan: Remix Lineage and Credit

**Branch**: `044-remix-lineage` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

## Summary

There are four parts:

1. Link the old copies that were never linked, once.
2. Show each build's remixes on its page.
3. Give the original 50 points per distinct account that remixed it.
4. Hide exact copies from every public list.

All the derived data is computed by the nightly `updateBuildTrend` job, which
already reads every build. It now also pages through the steps, fingerprints
them and works out lineage in memory. The results are stored as fields on the
build and are server-owned. So the build page and the lists pay no extra read,
and no client can forge what decides who is the original.

The order between builds is decided by times the server assigns:

- **`createTime`**, Firestore's own creation time, for the one-time link;
- **`stepsSince`**, when the server first saw a build's current steps, for
  hiding duplicates.

`timeCreated` is not used because the client writes it (research R2).

Hidden copies carry `duplicateOf`. Every build carries that field, `null` when
it is listed, and public queries filter `== null`.

## Technical Context

**Language/Version**: JavaScript, Vue 3 + Vuetify 3 (Vite SPA); Cloud Functions v2 on Node 22 (CommonJS)
**Primary Dependencies**: Firebase JS SDK, firebase-admin, firebase-functions; `node:crypto` (SHA-1)
**Storage**: Firestore `builds` (new fields only: data-model.md); 12 new composite indexes
**Testing**:
- `test:rules` (emulator), new file `lineage.rules.test.mjs`;
- new `check:lineage` (pure functions on fixtures);
- `check:setup` and `check:steps`;
- the ux-gate rig;
- a read-only dry run on production.

**Target Platform**: aoe4guides.com (Netlify), Cloud Functions `us-central1`, Firestore `eur3`
**Project Type**: web app + scheduled functions + one-time Admin script
**Performance Goals**:
- the nightly job stays well inside its 540 s timeout;
- memory is bounded to one 500-build page of steps (about 4 MB at p95).

**Constraints**:
- no extra reads on the build page;
- free-tier writes (the first run writes about 5,430 builds once);
- `scripts/link-remixes.mjs` runs locally only, never on Netlify;
- no build may vanish from the lists because its `duplicateOf` field is
  missing (research R5).

**Scale/Scope**:
- 5,430 builds;
- about 300 links to create;
- about 400 published copies to hide;
- 219 originals that gain a remix list.

## Constitution Check

| Principle | Assessment |
|---|---|
| I. Simplicity First | Pass. No new collection, service or trigger: the existing nightly job and an existing UI line are extended. The one added mechanism, `stepsSince`, is the smallest one that closes a real hijack (research R2). |
| II. Incremental Quality | Pass. The misleading "nothing here needs steps" comment is corrected. Lineage logic is a pure module with fixtures, following the `check:search` precedent. |
| III. Consistent UX | Pass. The remix menu goes in the existing `BuildMetaLines`. The duplicate chip copies the "Unlisted" chip, and the notice is a `v-alert`. |
| IV. Cost-Conscious | Pass. Zero new reads per page view or per night. Reading steps inside the function stays within Google's network. About 5,430 one-time writes, and a few a night after that. 12 indexes add a small storage cost. |
| V. Secure Defaults | Pass, with rules work: five server-owned fields, create allows only `duplicateOf: null`, and cases L1–L9 are tested first against the live rules. The forged-`remixOf` risk is bounded and documented. |

Re-checked after design: no violations, and Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/044-remix-lineage/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md
├── contracts/  firestore-rules.md · lineage-job.md · ui.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
functions/builds/
  lineage.js               NEW   stepRows · fingerprint · derive (pure)
  trend.js                       WEIGHTS += remixes 50; WEIGHTS_VERSION 3; activityTotal reads remixCredit
  updateBuildTrend.js            paged read with steps; lineage writes; skip duplicates in search + comparison
  updateBuildAllTimeScore.js     select remixCredit
  updateHomeSnapshot.js          + where duplicateOf == null (4 queries)
firestore.rules                  serverOwned += 5 fields; create allows duplicateOf null/absent only
firestore.indexes.json           + 12 (duplicateOf × 6 sorts × asc/desc)
tests/rules/lineage.rules.test.mjs  NEW  L1–L9
scripts/
  check-lineage.mjs        NEW   fixtures for lineage.js (wired as npm run check:lineage)
  link-remixes.mjs         NEW   one-time seed + link, dry run by default
  refresh-snapshot.mjs           + where duplicateOf == null
src/
  composables/data/queryParameterBuilder.js  public lists (no userUid) + where duplicateOf == null
  composables/data/buildService.js           addBuild writes duplicateOf: null; NON_EDITABLE_FIELDS += 5
  components/builds/BuildMetaLines.vue       "Remixed N times" menu
  components/builds/BuildListCard.vue        "Duplicate" chip
  views/builds/BuildDetails.vue              canonical → original; author notice
  plugins/mdiIcons.js                        + mdi-source-fork
../aoe4-guides-api/src/controllers/BuildsController.ts   + where duplicateOf == null (separate deploy)
```

**Structure Decision.** The project keeps its existing layout: SPA in `src/`,
scheduled jobs in `functions/builds/`, and one-off Admin scripts in
`scripts/`.

## Phasing (for tasks)

1. **Foundation**:
   - `lineage.js` and `check:lineage`;
   - the rules with L1–L9, written test-first;
   - the indexes;
   - the weight change in `trend.js`.
2. **US1, link old copies**: `link-remixes.mjs` (seed, exact links, review
   list), then the dry run on prod.
3. **US3, credit**: `updateBuildTrend` derives `remixCredit`, and the all-time
   score selects it.
4. **US2, remix list**: `remixes` written by the job; the menu in
   `BuildMetaLines`.
5. **US4, duplicates**:
   - `duplicateOf` written by the job;
   - the filters in the client, the home snapshot, `refresh-snapshot` and the
     API;
   - the canonical tag, the notice and the chip.
6. **Release**, in the order of quickstart §4 (owner-gated).

## Dependencies and risks

- **042's functions deploy (T034) is still owed.** 044's functions deploy
  carries it either way: the rebase covers any version mismatch. Deploying
  042's first keeps its own check (T035) readable.
- **Release order.** Filtering before the seed would empty every list. The
  mitigations are quickstart §4 and the job's safety net that writes `null`.
- **Index merging with `== null`** cannot be shown in the emulator, which is
  why quickstart §3 runs every list shape against dev.
- **A false hide.** Two authors who independently wrote identical builds of at
  least 5 rows: the later one is hidden but still credited and linked through
  its page notice. This is accepted. The author can tell from the notice, and
  any edit to the steps lists the build again.

- **A browser still running the old app** (between the rules and the app
  release) can have a save refused. That happens if the nightly job changes
  one of the new fields after the editor loaded the build, because the old app
  sends the stale value back. It is rare, retrying fixes it, and it ends once
  the release is out.

## Complexity Tracking

None.
