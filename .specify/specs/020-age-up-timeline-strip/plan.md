# Implementation Plan: Age-Up Timeline Strip — Timings In, Chips Out

**Branch**: `020-age-up-timeline-strip` | **Date**: 2026-08-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.specify/specs/020-age-up-timeline-strip/spec.md`

## Summary

Build list cards show civ, author, season, map and views but not when a build reaches Feudal or Castle — the thing that actually decides whether a build is the one you want. This feature derives age-arrival times from each build's own steps and surfaces them as a right-hand rail on the card and a timeline strip on the details page, while re-zoning the card so the freed space is not immediately refilled with noise.

**Technical approach**: a new `useAgeTimings` composable wraps the existing, unmodified `getTimings()` — walking sections for `type === 'age'` boundaries and honouring its `null`-when-unusable contract. The result is computed on the client save path and stored on the build document as a sortable `ageTimings` map, so the home page lanes (fed from a reduced pre-generated summary with no step data) get the field by whitelist copy rather than by a second implementation in `functions/`. The card prefers the stored field and falls back to deriving from steps, letting one component serve the builds list, the Dashboard lanes and the home lanes.

## Technical Context

**Language/Version**: JavaScript (ES2022), Node 22.x for tooling and functions

**Primary Dependencies**: Vue 3 (Options API + `setup`), Vuetify 3, Vuex, Firebase JS SDK v9 modular, Vite. Firebase Functions v2 (CommonJS) for the scheduled snapshot job. **No new dependencies** — the backfill bundling uses `esbuild`, already present via Vite.

**Storage**: Cloud Firestore. One new field, `builds/{id}.ageTimings`, plus one whitelist entry in the `home/home` snapshot.

**Testing**: No framework (constitution: manual golden-path testing, no formal suite). A throwaway harness covers the derivation's four fixtures; everything else is the manual pass in [quickstart.md](quickstart.md).

**Target Platform**: Modern browsers, desktop and mobile. Vuetify breakpoints xs → xxl.

**Project Type**: Vue 3 SPA + Firebase Functions

**Performance Goals**: Total derivation under 10 ms for a 10-card page on a mid-range phone (NFR-004). In practice most cards read the stored field and derive nothing at all once the backfill has run.

**Constraints**: No new Firestore reads on any browse path. `timingsHelper.js` is read-only reuse. `BuildOrderEditor` / `BuildOrderSectionEditor` / `BuildHeader` are out of scope. Both themes via tokens, no hardcoded colours.

**Scale/Scope**: ~4k builds, ~4M reads/month. Backfill ≈ 8 batches of 500 writes, one time.

## Constitution Check

*GATE: passed before Phase 0; re-checked after Phase 1 — see bottom.*

| Principle | Assessment |
|---|---|
| **I. Simplicity First** | One composable, one new component, one extracted chip component, one document field. No new dependencies. The stored field is denormalisation — logged in Complexity Tracking below with its justification. |
| **II. Incremental Quality** | Net positive: fixes two live defects (the map chip that never renders because it guards on a non-existent `filterConfig.map`; metadata that appears and disappears as the reader re-sorts). Also corrects an error in the inherited design input before it reaches code. |
| **III. Consistent UX & Component Reuse** | Vuetify throughout. The age-chip pattern appears in two places (card xs, timeline xs), so it is extracted up front per this principle (research R11). Age crests render as plain `<img>` at fixed size, matching how the same asset is already rendered in both build-order age plates — `v-img` is the app's convention for large lazy-loaded imagery like the civ flag, not for small fixed icons (research R5). |
| **IV. Cost-Conscious Infrastructure** | **Zero new reads.** Browse paths already ship `steps`; the home snapshot gains a copied field in documents it already fetches. Writes: 3 extra index entries per build save (rare relative to reads) plus a one-off ~4k-write backfill, inside the free tier. |
| **V. Secure Defaults** | Rules reviewed per the principle's schema-change requirement — **no change needed**: the author-write rule has no field whitelist, and the public update rule is restricted to counter fields, so anonymous clients cannot touch `ageTimings`. The backfill is a local developer script with a service account, not a deployed privileged endpoint, so it introduces no new attack surface and does not need the admin-callable pattern. |

**Gate result: PASS.** Two justified deviations logged below.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/020-age-up-timeline-strip/
├── plan.md                       # This file
├── spec.md                       # Clarified spec (5 questions resolved)
├── research.md                   # Phase 0 — 11 decisions
├── data-model.md                 # Phase 1 — the ageTimings field + derived shape
├── contracts/
│   └── age-timings.md            # Phase 1 — module, document, snapshot, component contracts
├── quickstart.md                 # Phase 1 — build order, fixtures, manual pass
├── design-input.md               # Inherited: tokens, mock→Vuetify map, CSS, algorithm
├── design-handoff-README.md      # Inherited: original handoff intent
├── assets/
│   └── Build List Proposal.html  # Inherited: interactive reference mock
├── checklists/requirements.md
└── tasks.md                      # Inherited draft; regenerate with /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── components/builds/
│   ├── BuildListCard.vue         # MODIFY — three zones, age rail, quiet meta, reduced chips
│   ├── AgeTimeline.vue           # NEW — details-page strip, fixed 0–16:00 track
│   └── AgeChips.vue              # NEW — shared xs chip row (card + timeline)
├── components/home/
│   └── BuildLaneTabs.vue         # MODIFY — forward `context`; serves two data shapes
├── composables/builds/
│   ├── useAgeTimings.js          # NEW — the spine
│   └── timingsHelper.js          # UNTOUCHED — read-only reuse (FR-006)
├── composables/data/
│   └── buildService.js           # MODIFY — compute ageTimings in addBuild/updateBuild
└── views/builds/
    ├── Builds.vue                # MODIFY — pass context
    ├── MyBuilds.vue              # MODIFY — pass context
    ├── MyFavorites.vue           # MODIFY — pass context
    ├── Dashboard.vue             # MODIFY — pass civ-locked through BuildLaneTabs
    └── BuildDetails.vue          # MODIFY — mount AgeTimeline

functions/builds/
└── updateHomeSnapshot.js         # MODIFY — one whitelist line, copy only

scripts/
└── backfill-age-timings.mjs      # NEW — one-off, esbuild-bundled, Admin SDK
```

**Structure Decision**: The existing Vue 3 SPA layout is used as-is — components under `src/components/builds/`, derivation logic in `src/composables/builds/`, data access in `src/composables/data/`. This matches Principle III's "business logic belongs in composables or services, not in page templates": the views change only to pass a prop and mount a component. The scheduled function and the one-off script live in their existing homes (`functions/builds/`, `scripts/`), the latter following the `set-admin-claims.js` precedent.

## Key Design Decisions

Full reasoning in [research.md](research.md); the four that shape everything else:

1. **`buildService.addBuild`/`updateBuild` is the write choke point** (R1). All three call sites that write build content — create, edit, publish-draft — already funnel through those two functions, so computing there covers every path with no view changes.
2. **No derivation logic in `functions/`** (R4). The scheduled job copies a field. `functions/` is a separate CommonJS package that cannot import the ES-module composables, so anything else would be a second implementation and a standing drift risk.
3. **The backfill must use the Admin SDK** (R2 → R3). Rules restrict build writes to the author, so no signed-in user can rewrite other people's builds — a client-side backfill is impossible, and widening the rules for a one-time need would be a real regression.
4. **The `derived` flag tests the parsed timestamp, not the raw field** (R9). The inherited design input proposes `!step.time`, which reports an unparseable timestamp as author-stated even though it was interpolated — exactly the misrepresentation the `~` marker exists to prevent.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Denormalising derived data onto the build document (`ageTimings`) | Home lanes read a pre-generated summary that carries no `steps`, so they cannot derive anything client-side. Storing the result is the only way the most-visited surface shows timings without extra reads. | Deriving in the scheduled job needs the logic inside `functions/`, a separate CommonJS package that cannot import the ES-module composables — so it would mean a second copy that can silently disagree with the client's. Having the home lanes simply show nothing was rejected because the home page is the most-visited surface and the omission would be invisible-by-design to users. |
| A bundling step for the one-off backfill script (`esbuild --alias:@=./src`) | `timingsHelper.js` imports through the `@/` alias, which plain Node cannot resolve, and FR-006 forbids editing that file. | Editing `timingsHelper.js` to use relative imports breaks the read-only-reuse constraint that keeps this feature from destabilising Focus mode. Adding `vite-node` would be a new dev dependency for a single command; `esbuild` is already present via Vite. Re-implementing the derivation in the script would create the second copy this whole design avoids. |

## Phase Status

- [x] Phase 0 — research complete, no unresolved unknowns → [research.md](research.md)
- [x] Phase 1 — data model, contracts, quickstart → [data-model.md](data-model.md), [contracts/age-timings.md](contracts/age-timings.md), [quickstart.md](quickstart.md)
- [x] Constitution re-check after Phase 1 — still PASS. Phase 1 added one component beyond the original sketch (`AgeChips.vue`), which *strengthens* Principle III compliance rather than weakening it; nothing in the design introduced a new dependency, a new read, or a rules change.
- [ ] Phase 2 — task breakdown (`/speckit-tasks`). A draft `tasks.md` was inherited from the design handoff and reconciled with the clarified spec; regenerate it rather than working it directly.
