# Implementation Plan: Map Types and Strategy Guidance

**Branch**: none yet (spec 045; see spec Assumptions) | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.specify/specs/045-map-types-strategy-guidance/spec.md`

## Summary

**Map** becomes a required choice of Land / Water / Hybrid. Everything else, empty included, is
cleaned to Land. Cards show it only when it isn't Land.

**Strategy** stays optional, and each of the six options gains a one-line explanation, shown in both
the editor and the filter.

**Cleanup the hard way**: one normaliser per field, living with the option lists, is applied
- on every save,
- on import,
- and by a one-off cleanup script.

Typed-in strategies are mapped only when they name exactly one option and removed otherwise. Firestore
rules then refuse any author write outside the lists. No new fields, no index changes.

**Filter integrity**: the filter refuses to apply a selection above Firestore's 30-combination limit (FR-017), a pre-existing gap fixed here per Constitution II.

## Technical Context

**Language/Version**: JavaScript (ES modules), Vue 3 SFCs; Node 22 for scripts

**Primary Dependencies**: Vue 3, Vuetify 3, Vuex, Firebase JS SDK; `firebase-admin` for the cleanup;
`@firebase/rules-unit-testing` for rules tests

**Storage**: Cloud Firestore `builds`: values of two existing fields constrained; `firestore.rules`

**Testing**: throwaway Node harness for the normalisers; `npm run test:rules` (emulator, Java); cleanup
dry run; `ux-gate` browser rig; `check:setup`, `check:steps`

**Target Platform**: Web SPA on Netlify

**Project Type**: Web application (Vite SPA plus Firestore rules plus Admin scripts)

**Performance Goals**: none new. Same queries, same indexes.

**Constraints**:
- rules can't import, so the lists are transcribed;
- release order is app → cleanup → rules (R8);
- one Netlify build.

**Scale/Scope**: about 4.35k builds, of which 4,244 published change map (every one but Water/Hybrid, since "Land" is not stored today) and 206 change strategy (snapshot, 9 Nov), plus drafts;
about 10 files touched

## Constitution Check

| Principle | Assessment |
|---|---|
| I. Simplicity First | ✅ Removes a misleading filter state and junk data. Normalisers live in the existing provider modules. No dependencies, no new fields. |
| II. Incremental Quality | ✅ Closes the import hole that let typed-in values in. Fixes the unguarded 30-combination filter limit found during this cycle (FR-017, research R10), as Constitution II requires. |
| III. Consistent UX & Reuse | ✅ One option source feeds the editor and the filter (Vuetify `item-props` subtitle). |
| IV. Cost-Conscious | ✅ The cleanup writes 4,244 published docs plus drafts once (the dry run gives the draft count), well within the 20k free daily writes. No functions, no indexes. One Netlify build. |
| V. Secure Defaults | ✅ This is a schema constraint, so the rules change, with test-first cases F1–F14 that must fail against the deployed rules first. The value check is kept out of the counter branch. |

**Gate**: Pass, pre- and post-design. No Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/045-map-types-strategy-guidance/
├── spec.md
├── plan.md
├── research.md            # R0 (why no Castle filter) … R9
├── data-model.md
├── quickstart.md
├── contracts/
│   └── firestore-rules.md # F1–F14
└── checklists/requirements.md
```

### Source Code (repository root)

```text
src/composables/filter/mapDefaultProvider.js       # Land/Water/Hybrid, DEFAULT_MAP, normaliseMap
src/composables/filter/strategyDefaultProvider.js  # subtitles, STRATEGY_TITLES, normaliseStrategy
src/composables/data/buildService.js               # withFacets() on add/update
src/composables/converter/useImportOverlayFormat.js
src/components/builds/BuildImportDialog.vue        # normalise on import
src/views/builds/BuildEditor.vue                   # map required + default Land; subtitles
src/components/filter/FilterConfig.vue             # subtitles; phone-sheet explanations; Apply guard
src/components/filter/FilterApplyBar.vue           # blockedReason: disabled button + reason line
src/composables/data/queryParameterBuilder.js      # disjunctionCount()
src/components/builds/BuildListCard.vue            # map shown only when not Land
src/components/builds/BuildMetaLines.vue           # same
firestore.rules                                    # allowedFacets() on author create/update
tests/rules/facets.rules.test.mjs                  # NEW: F1–F14
scripts/backfill-map-strategy.mjs                  # NEW: one-off cleanup
.specify/specs/020-age-up-timeline-strip/spec.md   # note the FR-022 amendment
```

**Structure Decision**: The existing single-SPA layout. Nothing in `functions/`.

## Release order

1. Merge and deploy the app.
2. Cleanup: dry run on dev, then on prod. The owner reviews the removal list, then `--apply`, then a
   second dry run must report 0 changes.
3. `npm run test:rules` passes → `firebase deploy --only firestore:rules`, a few days after step 1.

## Risks

- **Parallel sessions on `firestore.rules`** (042 vote integrity). The rules change is small and
  isolated in one function plus two `&&` clauses. Rebase onto whatever 042 has merged before step 3.
- **Stale tabs** after step 3 can't save with Open or Closed. This is mitigated by the delay; the
  failure surfaces as the existing save error.

## Complexity Tracking

None.
