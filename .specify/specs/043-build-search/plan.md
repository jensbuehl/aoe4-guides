# Implementation Plan: Build Search

**Branch**: `043-build-search` (worktree `../aoe4-guides-043`) | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.specify/specs/043-build-search/spec.md`; owner decisions in
[decision-ux-and-cost.md](decision-ux-and-cost.md).

## Summary

Players search listed builds by title, author and civ from a header entry on every page (Layout A).
The nightly Trending job, which already reads every build, also writes a compact index of listed
builds to Firebase Storage: ~162 KB gzip today, at zero extra read operations and €0. The client
downloads it only when search opens, caches it for an hour, and answers every keystroke locally
with a small hand-written matcher. Unlisted builds are never written to the index, so they are
gone for everyone by the next nightly run. An on-device hide list removes them at once for the
author who unlisted or deleted them. Each result also shows the build's Castle Age time, stored in
the index now. Filtering by that time is deferred until the nightly log shows how many builds have
one (research R10).

## Technical Context

**Language/Version**: JavaScript (ES2022). Vue 3 SFCs in `src/`; Node 22 CommonJS in `functions/`.

**Primary Dependencies**: Vue 3, Vuetify 3, vue-router, firebase (client), firebase-admin 13 and
firebase-functions 6 (functions). **No new dependencies** (research R4).

**Storage**: Firestore `builds` (read only, existing select extended); Firebase Storage object
`search/builds.json` (new); `localStorage` key `aoe4guides.search.hidden` (new).

**Testing**: new `npm run check:search` (pure matcher and builder against fixtures and the SEO
snapshot); `npm run check:setup`; `ux-gate` skill for the UI; the dev project for the function
(quickstart). No storage-rules emulator test: the rule is a two-line public read with writes denied,
and the existing `test:rules` harness covers Firestore only.

**Target Platform**: browsers (PWA on Android, desktop); Cloud Functions us-central1; Storage
US-EAST1.

**Project Type**: web application (Vite SPA + Firebase Functions), single repository.

**Performance Goals**: results < 50 ms per keystroke on a mid-range phone (measured 0.3 ms per query
on desktop); first open < 1.5 s on 4G.

**Constraints**: zero bytes for visitors who never open search, covering both index and code
(lazy chunk); works where App Check fails; must not put Trending at risk; no Netlify build
minutes.

**Scale/Scope**: 4,348 listed builds and 1,520 authors today; linear growth at ~37 B gzip per build.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design: still passes.*

| Principle | Assessment |
|---|---|
| I. Simplicity First | ✅ No dependency: the matcher is ~150 lines of pure JS (R4). One object, one rule, one extension of an existing job. No version stamp, no extra scheduler (R6). |
| II. Incremental Quality | ✅ The hide-list hook goes in `buildService`, not duplicated in two views. Adds a durable `check:search`. Comments at the two traps: Storage App Check enforcement, and the index isolated from Trending writes. |
| III. Consistent UX & Reuse | ✅ Vuetify `v-dialog`, `v-text-field`, `v-list`; reuses `CivFlag` and `UserAvatar`. The back-closes-overlay pattern now has a second user, so it is **extracted** to `useOverlayHistory` and the icon sheet moves onto it (R7). The analysis initially caught it being copied instead. |
| IV. Cost-Conscious Infrastructure | ✅ €0 at foreseeable volume (decision document §4); 0 extra reads; free-tier Storage; Functions stay short-lived (adds ~1 s to an existing run). |
| V. Secure Defaults | ✅ Index holds only fields already public on listed builds (FR-014). Storage rule is read-only with writes denied. No Firestore rule change. No credentials in `src/`; the bucket name is already a public `VITE_` variable. |

## Project Structure

### Documentation (this feature)

```text
.specify/specs/043-build-search/
├── spec.md
├── decision-ux-and-cost.md   # owner decisions + cost evidence
├── plan.md                   # this file
├── research.md               # R1–R9
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── search-index-object.md
│   └── search-ui.md
├── checklists/requirements.md
└── tasks.md                  # /speckit-tasks — not yet
```

### Source Code (repository root)

```text
functions/builds/
├── searchIndex.js            # NEW pure: buildSearchIndex(builds, generatedIso) → object; shouldPublish(prev, next)
└── updateBuildTrend.js       # select += author, authorUid, civ, season; after writes: build, guard, upload

storage.rules                 # + match /search/{file} { allow read; allow write: if false; }

src/
├── components/
│   ├── Header.vue            # trigger (pill md+, icon <md), "/" and Ctrl+K listener, async dialog
│   └── search/
│       └── SearchDialog.vue  # NEW: dialog/sheet, history entry, keyboard nav, grouped results
├── components/builds/BuildOrderSectionEditor.vue  # icon sheet moves onto useOverlayHistory
├── composables/
│   ├── useOverlayHistory.js  # NEW: extracted back-closes-overlay history entry (icon sheet + search)
│   ├── search/
│   │   ├── searchIndex.js    # NEW pure: normalise, prepare(index, civs), search(prepared, query, hidden)
│   │   ├── useSearchIndex.js # NEW: lazy fetch, shared in-flight promise, module-scope cache
│   │   └── hiddenBuilds.js   # NEW: localStorage hide list (add, list, prune by generatedAt)
│   ├── data/buildService.js  # updateBuild (isDraft true) and deleteBuild → hiddenBuilds.add
│   └── filter/civDefaultProvider.js  # + optional aliases per civ
└── plugins/mdiIcons.js       # unchanged: mdi-magnify, mdi-close already allowed

scripts/check-search.mjs      # NEW, plus "check:search" in package.json
```

**Structure Decision**: Follows the existing layout. Composables under `src/composables/<area>/`,
components under `src/components/<area>/`, functions under `functions/builds/` beside the job they
extend. Pure modules (`searchIndex.js` on both sides) import nothing through `@/` or Vue, so
`check:search` runs them in plain Node.

## Implementation order

1. **Index pipeline** (US3 and FR-016 first, because search without the 039 guarantee must not
   ship): `functions/builds/searchIndex.js`, the `updateBuildTrend` extension, `storage.rules`,
   `check:search` for the builder. Deploy to **dev**, then verify per quickstart §2.
2. **Matcher**: `src/composables/search/searchIndex.js`, civ aliases, `check:search` for matching.
3. **Loader and hide list**: `useSearchIndex.js`, `hiddenBuilds.js`, `buildService` hooks.
4. **UI**: `SearchDialog.vue`, header trigger and shortcuts. Extract `useOverlayHistory` and move
   the icon sheet onto it, with the icon sheet's Back behaviour re-checked on a phone. Run
   `check:setup`, the mdi check, and `ux-gate`.
5. **Prod rollout** per quickstart §5: rules, then function plus a forced run, then UI merge.
6. **Harvest**: the Storage App Check note into the App Check memory; amend the CLAUDE.md
   pointer back to whatever plan is current.

## Risks

| Risk | Mitigation |
|---|---|
| Firebase's `alt=media` endpoint drops `Content-Encoding` or `Cache-Control` | Verified on dev first; fallback is the public GCS URL (R2) |
| Someone enforces App Check on Storage later | Comment at the rule and in `useSearchIndex.js`; noted in the App Check memory |
| Index bug ships an empty or truncated file | `shouldPublish` guard plus custom-metadata `buildCount` (data-model) |
| Header wraps at 360px | Icon-only below md; `ux-gate` at 360 signed in |
| `/` shortcut fires while editing a build | Ignore events from input, textarea and contenteditable targets; tested in `ux-gate` |
| Two release trains (function vs app) | `v` field; reader-compatible for a day before any breaking change |
| Parallel sessions in the shared tree | All 043 work stays in the worktree; the shared tree's branch and `feature.json` untouched |

## Complexity Tracking

No constitution violations. Two spec amendments came out of research and were applied to
`spec.md`:

| Change | Why |
|---|---|
| SC-004: 250 KB → 350 KB gzip at twice today | Build ids are incompressible (~65 of 162 KB). 250 KB is unreachable with ids, and ids are required to link (R3). |
| SC-008: in-site visit share → daily index downloads | The app has no analytics; adding one is a separate privacy decision (R8). |
