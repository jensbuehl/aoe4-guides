# Implementation Plan: Home Build Lane Tabs

**Branch**: `006-home-build-tabs` | **Date**: 2026-06-04 | **Spec**: `.specify/specs/006-home-build-tabs/spec.md`

## Summary

Replace the three stacked build lists in `Home.vue` (Trending, All-Time Classics, New) with a new `BuildLaneTabs.vue` component using Vuetify `v-tabs` + `v-window`. One lane is visible at a time; Trending is the default and resets on every visit. A per-lane "View all" button links to the existing Builds route with the correct `orderBy`. All a11y (tablist/tab/tabpanel, arrow keys, focus ring, reduced motion) is handled by Vuetify's tab primitives. `BuildListCard` and data sourcing are untouched.

## Technical Context

**Language/Version**: JavaScript (ES2022), Vue 3.4 SFCs

**Primary Dependencies**: Vue 3, Vuetify 3 (`v-tabs`, `v-window`, `v-tab`, `v-window-item`), Vue Router (all already installed)

**Storage**: N/A — reads three existing Vuex store slices (`popularBuildsList`, `allTimeClassicsList`, `recentBuildsList`); no new reads or writes

**Testing**: Manual golden-path per Constitution — no automated test suite

**Target Platform**: Web SPA (desktop + mobile), Netlify-hosted

**Performance Goals**: No new data fetches; tab switch is pure reactive state change (ref assignment)

**Constraints**:
- `BuildListCard` MUST NOT be modified (FR-003, SC-006)
- No new npm dependencies
- No changes outside the build-lane section of `Home.vue` plus the new component
- Active tab resets to `'trending'` on every visit — simple `ref`, no persistence
- Fully self-contained; no forward-compat hook for feature 007

**Scale/Scope**: 2 files changed/created (`BuildLaneTabs.vue` new, `Home.vue` edit); no store, router, or data model changes

## Constitution Check

| Principle | Assessment |
|---|---|
| **I. Simplicity First** | ✅ `v-tabs` + `v-window` is Vuetify's built-in tab pattern — zero custom tab logic. A single `ref('trending')` replaces three separate section blocks. No new dependencies. |
| **II. Incremental Quality** | ✅ Removes ~80 lines of duplicated header/list markup from Home.vue and consolidates into one component. |
| **III. Consistent UX & Component Reuse** | ✅ Vuetify `v-tabs`/`v-window` for the tab shell; `BuildListCard` reused unchanged; `v-btn variant="text"` for View all — all existing patterns. |
| **IV. Cost-Conscious Infrastructure** | ✅ No new Firestore reads. All three lane lists already loaded by the home snapshot. |
| **V. Secure Defaults** | ✅ No auth, no data exposure changes. Presentation only. |

**Result**: PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/006-home-build-tabs/
├── spec.md
├── plan.md              # This file
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── BuildLaneTabs-contract.md
└── tasks.md
```

### Source Code

```text
src/
├── components/
│   └── home/
│       └── BuildLaneTabs.vue   # NEW — v-tabs + v-window, View all, empty state
└── views/
    └── Home.vue                # EDIT — remove three stacked sections; add <BuildLaneTabs>
```

**Structure Decision**: Single-project Vue frontend. No backend, store, or router changes.

### Key Design Decisions

- **`v-tabs` + `v-window`**: Vuetify provides all tab a11y out of the box (`tablist`/`tab`/`tabpanel` roles, `aria-selected`, roving arrow-key focus, visible primary-color underline indicator). Zero custom ARIA needed.
- **Active tab as `ref('trending')`**: `v-model` shared between `v-tabs` and `v-window`. Resets to `'trending'` on every component mount — no sessionStorage, no URL.
- **Lane config array**: A static `lanes` constant `[{ value, label, icon, orderBy }]` drives both tab rendering and panel selection — avoids three near-identical blocks.
- **View all position**: A `d-flex align-center` row wraps `v-tabs` (flex: 1) + `v-btn variant="text" :to="viewAllRoute"` (right edge). `viewAllRoute` is a `computed` that maps the active tab value to its `orderBy` query param.
- **Reduced motion**: `v-window` `transition` and `reverse-transition` props set to `false` when `prefers-reduced-motion: reduce` is active (detected via Vue's `useDisplay` composable or a CSS media query class on the wrapper).
- **Props from Home.vue**: `BuildLaneTabs` accepts `popularBuilds`, `allTimeClassics`, `recentBuilds` as Array props — keeps the component decoupled from Vuex and easier to test.
- **Empty state**: When the active lane's list has no real items (length 0 after filtering out loading sentinels), show `v-alert type="info"`. Loading skeletons (`{ loading: true }`) pass through to `BuildListCard` which renders them as skeleton cards.

## Complexity Tracking

> No Constitution violations — section intentionally empty.
