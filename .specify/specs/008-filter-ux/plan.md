# Implementation Plan: Filter UX Redesign

**Branch**: `008-filter-ux` | **Date**: 2026-06-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.specify/specs/008-filter-ux/spec.md`

## Summary

Redesign the shared `FilterConfig.vue` filter experience across all filtered pages. Adds active-filter chips, pending-change indicators, a sticky Apply bar with live count preview, and a separated Sort group — while strictly preserving the apply-on-demand model (zero document fetches until Apply). One enhanced `FilterConfig.vue` handles all three rendering contexts (default / civ-locked / author-locked) via a `context` prop. Replaces the duplicated in-column contributor strip in `Builds.vue` with `AuthorPageHeader.vue`. Adds per-list count pills above each civ list in `Dashboard.vue`. Fixes the `creat` → `creator` typo bug on mount.

## Technical Context

**Language/Version**: JavaScript / Vue 3 (Composition API)

**Primary Dependencies**: Vue 3, Vuetify 3, Vuex 4, Firebase SDK (Firestore)

**Storage**: Cloud Firestore — count aggregation only via existing `getBuildsCount()` / `getSize()`. No new reads model.

**Testing**: Manual (per constitution) — golden paths: default, civ-locked, author-locked contexts; light and dark themes; pending indicators; Apply lifecycle; count preview on/off.

**Target Platform**: Web SPA on Netlify; Chrome/Firefox/Safari, responsive (xs–xl breakpoints)

**Project Type**: Frontend SPA (Vue 3 + Vuetify 3)

**Performance Goals**: Zero Firestore document fetches while staging changes; count preview debounced 300ms (aggregation only, no docs).

**Constraints**: No new dependencies. All controls remain existing Vuetify primitives (`v-autocomplete`, `v-select`). Flat/no-shadow on all new surfaces. Apply-on-demand preserved (FR-001). `BuildListCard.vue` untouched (FR-013).

**Scale/Scope**: 4 filtered pages + civ page + author mode; ~4k builds; ~4M Firestore reads/month (aggregation calls are cheap — ~1 read per 1000 index entries).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

### I. Simplicity First ✅
Draft state lives as local `ref` objects inside `FilterConfig.vue` — no new Vuex slice needed. The `context` prop cleanly replaces the existing `hideCivs`/`hideOrderBy`/`defaultCivOverride` props. Sub-components (chips, apply bar, sort group) are extracted from the existing duplicated code — net line-count reduction, not growth. No new dependencies.

### II. Incremental Quality ✅
- Bug fix (`creat` → `creator`, FR-014) delivered in the first commit.
- The existing mobile/desktop verbatim duplication inside `FilterConfig.vue` is collapsed via Vuetify's `useDisplay()` composable — a measurable quality improvement.

### III. Consistent UX & Component Reuse ✅ *(primary constitution gate)*
> "Any UI pattern that appears more than once MUST be extracted into a shared component."

- The contributor strip is currently copy-pasted in `Builds.vue` for mobile and desktop — becomes `AuthorPageHeader.vue`.
- The count pill appears in 3 contexts (results header, author hero, civ list header) — extracted as a single `v-chip size="small" variant="tonal"` pattern documented in `data-model.md`.
- `FilterConfig.vue` remains **ONE** shared component across all 4+ host pages; context variance via `context` prop.
- User constraint: *"make sure to re-use one filter component instead of duplicating code."*

### IV. Cost-Conscious Infrastructure ✅
Count preview calls `getBuildsCount()` which uses Firestore `getSize()` — an aggregation query, not a document read. 300ms debounce prevents bursts. No new Cloud Functions, no schema changes, no new collections.

### V. Secure Defaults ✅
No auth changes. `filterConfig` is UI state, not PII. No new routes or server-side endpoints.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/008-filter-ux/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── contracts/
│   └── FilterConfig.md  ← Phase 1 output
└── tasks.md             ← Phase 2 output (speckit-tasks — not created here)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── filter/
│   │   ├── FilterConfig.vue         ← MODIFIED: context prop, draft state, all three contexts
│   │   │                               collapses the mobile/desktop verbatim duplication
│   │   ├── FilterChips.vue          ← NEW: chips row (applied/draft chips, pending tint, empty state)
│   │   ├── FilterSortGroup.vue      ← NEW: dashed-divider Sort section (hidden in civ context)
│   │   └── FilterApplyBar.vue       ← NEW: sticky footer (Apply btn, change label, count preview)
│   └── page/
│       └── AuthorPageHeader.vue     ← NEW: replaces the duplicated contributor card in Builds.vue
├── composables/
│   └── filter/
│       ├── useDraftFilterConfig.js  ← NEW: draft state, dirty-field map, per-section reset, applyDraft
│       └── useFilterCountPreview.js ← NEW: debounced getBuildsCount(draft), disableable
└── views/
    └── builds/
        ├── Builds.vue               ← MODIFIED: remove contributor card (both copies); use AuthorPageHeader
        ├── Dashboard.vue            ← MODIFIED: context="civ-locked"; count pill above each list
        ├── MyBuilds.vue             ← MODIFIED (minor): context="default" prop
        └── MyFavorites.vue          ← MODIFIED (minor): context="default" prop
```

**Structure Decision**: Single-project frontend SPA. New filter sub-components go in `src/components/filter/`. Page-identity headers go in `src/components/page/`. New composables extend the existing `src/composables/filter/` directory.

## Complexity Tracking

*No violations — no new dependencies, no new Vuex slices, no new infrastructure.*

---

## Phase 0: Research

See [research.md](research.md) for all decisions and findings.

All NEEDS CLARIFICATION items are resolved. No blockers to Phase 1.

---

## Phase 1: Design & Contracts

See [data-model.md](data-model.md) for state shapes and component interfaces.
See [contracts/FilterConfig.md](contracts/FilterConfig.md) for the updated component API.

### Key Design Decisions

#### 1. Draft State — Local, Not in Vuex

Draft config is a local `ref` inside `FilterConfig.vue` (via `useDraftFilterConfig`), initialized from the store on mount. The Vuex store holds only the **applied** config. On Apply, the draft is committed to the store via the existing `setFilterConfig` mutation.

**Why not Vuex**: The draft is transient UI state with no need to persist across navigation or share with other components. Adding it to the store would violate Principle I (Simplicity).

#### 2. Context Prop Replaces Multiple Bool Props

`FilterConfig.vue` accepts a `context` prop (`'default' | 'civ-locked' | 'author-locked'`) that replaces the current `hideCivs: Boolean`, `hideOrderBy: Boolean`, and `defaultCivOverride: String` props. Context drives:
- Civ field visibility (`civ-locked` → hidden + lock note)
- Sort section visibility (`civ-locked` → hidden)
- Whether a `civName` prop is shown in the lock note

Migration: `Dashboard.vue` changes `hideCivs="true" hideOrderBy="true" :defaultCivOverride="civ"` → `context="civ-locked" :civName="civ"`.

#### 3. One FilterConfig Component for All Contexts

The three contexts render inside the **same** `FilterConfig.vue` with `v-if`/`v-show` guards on context-specific sections. No per-page filter variants. No duplication.

#### 4. Responsive Duplication Collapsed

The current mobile/desktop duplication (two full copies of the template wrapped in `<div class="hidden-*">`) is replaced by a single template using Vuetify's `useDisplay()` composable and responsive `:component` or `:density` bindings where needed. The core fields, chips, apply bar, and sort group appear once in the template.

#### 5. AuthorPageHeader in the Results Column

`AuthorPageHeader.vue` is placed **above the build list** in `Builds.vue`, inside the results column — not inside the filter panel. The existing in-column contributor `v-card` (duplicated for mobile/desktop) is removed. The new header receives `contributor` and `count` props from `Builds.vue`.

#### 6. Per-List Counts on Civ Page

Each of the three sorted lists in `Dashboard.vue` gets a `CivListCountHeader`-style row: the section title + a tonal count pill (number of results in that list). The count is the length of the list array (already fetched). No additional aggregation calls needed.

Wait — actually, per FR-008 the count pill is a consistent treatment. Looking at Dashboard.vue: each list fetches `getBuilds(config, 5)` (5 items), but the total count per list type is the count for all builds matching that config+orderBy (not just the first 5). Dashboard.vue calls `getBuildsCount(filterConfig.value)` once for the overall count. Per-list counts need `getBuildsCount` for each list's config variant (score, scoreAllTime, timeCreated). This should be called alongside the `getBuilds` calls and cached per filterConfig — see research.md for details.

#### 7. No Global Reset Button

Per spec clarification (Session 2026-06-05): staged changes are discarded per-section via the section's **X** control (resets that section's draft field back to the applied value), or by removing chips individually. `FilterApplyBar.vue` has **no** global reset.
