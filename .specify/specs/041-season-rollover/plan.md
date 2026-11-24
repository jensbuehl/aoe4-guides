# Implementation Plan: Season Rollover

**Branch**: `041-season-rollover` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.specify/specs/041-season-rollover/spec.md`

**Due**: in production before 2026-12-01. Fallback in [quickstart.md](quickstart.md).

## Summary

The season list stops being something to keep up by hand and becomes something the site works out for
itself. `seasonDefaultProvider.js` keeps its hand-written entries (Seasons 1–14) and adds a pure
`buildSeasons(now)`. It continues the list on the quarterly schedule from the newest entry, resolves every
season's end date, and hides any season that has not started. A new `currentSeason()` replaces
`seasons.value[0]` at the two places that choose a default. A CI check walks every day to 2030 so that a
later hand edit cannot quietly open a gap.

There are no data changes, and the 75 builds keep their labels (spec, Decision).

## Technical Context

**Language/Version**: JavaScript ES modules in `src/` (Vue 3 `setup()`). The new check script runs on
Node 22 in CI.

**Primary Dependencies**: Vue 3 (`ref`), Vuetify 3. No new dependency.

**Storage**: none. Builds keep `season` as a title string, which Firestore filters with `in`.

**Testing**: new `npm run check:seasons`, added to CI (research R9); `npm run check:setup`; `npm run build`;
browser checks with a faked clock (quickstart §3).

**Target Platform**: the web SPA on Netlify. Nothing runs on the deploy path.

**Project Type**: web application (frontend only for this feature).

**Performance Goals**: building the list is O(number of seasons), about 15 entries, once per page load.
That is negligible.

**Constraints**: no Firestore reads, writes or network requests (SC-006). `check-seasons.mjs` imports from
`src/`, so under CLAUDE.md's Netlify Node 22.1.0 rule it must stay out of the Netlify build command and
run only in CI. Hard deadline 2026-12-01.

**Scale/Scope**: one provider file, two one-line call sites, one new script, one CI step, and one
CLAUDE.md sentence.

## Constitution Check

| Principle | Assessment |
|---|---|
| I. Simplicity First | ✅ One file holds all of the logic. Hand-written entries keep their shape. Precedence comes from list order, not merge logic (R2). The list is rebuilt per load with no timer (R8). No new dependency. |
| II. Incremental Quality | ✅ Removes Season 14's redundant `endDate`, the dead `Since …` branch and the now-internal `seasonEndDate` (R3, R4). Replaces the hour-off `+ 86400000` with calendar arithmetic (R6). |
| III. Consistent UX | ✅ No new UI. Calculated seasons go through the existing `SeasonListItem` and `SeasonToolTip`. |
| IV. Cost-Conscious | ✅ Zero reads or writes. Calculated entirely on the client. |
| V. Secure Defaults | ✅ No rules or schema change. Nothing private enters `src/`. |

**Gate**: pass.

*Re-check after design*: still a pass. The one addition is a CI check script, justified in R9 by the
`check:plurals` precedent and by a failure mode that is otherwise silent and date-triggered.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/041-season-rollover/
├── spec.md               # incl. the relabelling decision; FR-007 amended during planning (R3)
├── plan.md               # this file
├── research.md           # R1–R10
├── data-model.md         # hand-written entry vs. built season; invariants
├── quickstart.md         # checks, faked-clock browser test, deadline fallback
├── contracts/
│   └── season-provider.md
├── checklists/
│   └── requirements.md
└── tasks.md              # /speckit-tasks
```

### Source Code (repository root)

```text
src/composables/filter/seasonDefaultProvider.js   # buildSeasons, currentSeason; Season 14 endDate removed;
                                                  # seasonEndDate removed; Since-branch removed; header comment rewritten
src/views/builds/BuildEditor.vue                  # :473 → currentSeason().title
src/composables/converter/useImportOverlayFormat.js  # :22 → currentSeason().title
scripts/check-seasons.mjs                         # new — day-by-day invariants + pinned cases (R9)
package.json                                      # "check:seasons" script
.github/workflows/ci.yml                          # run check:seasons before build
CLAUDE.md                                         # add check-seasons.mjs to the CI-only / Netlify-exempt scripts
```

**Structure Decision**: Everything stays in the existing season provider, which every season consumer
already imports. No new module under `src/`.

## Implementation order

1. Provider: `buildSeasons`, `currentSeason`, resolved `endDate`, visibility filter, calendar arithmetic.
   Rewrite the header comment so it says what an `endDate` now means and that seasons after the newest entry
   are calculated.
2. `check-seasons.mjs`, the npm script and the CI step. Run it, then break the list on purpose to see it fail
   (quickstart §1).
3. The two call sites. Then `check:setup` and `build`.
4. Browser checks: today's date, then the faked dates (quickstart §2–3).
5. CLAUDE.md: one clause added to the Netlify rule's exemption list.

Steps 1–3 are the whole user-facing change, and they are small enough for one commit. Only the owner
commits (memory: no auto-commit).

## Complexity Tracking

No violations.
