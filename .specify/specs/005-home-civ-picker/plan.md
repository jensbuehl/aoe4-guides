# Implementation Plan: Home Civilization Picker

**Branch**: `005-home-civ-picker` | **Date**: 2026-06-04 | **Spec**: `.specify/specs/005-home-civ-picker/spec.md`

## Summary

Replace the current tall 2-column civ list in `Home.vue` with a new `CivPicker.vue` component that renders a dense flag-tile grid (5/4/3 columns at desktop/≤1080/≤720px). The component owns its own header search, hover/focus name reveal, skeleton loading state, touch-visible names, and NEW badges. All navigation, data sourcing, and other Home.vue regions are untouched — pure presentation swap.

## Technical Context

**Language/Version**: JavaScript (ES2022), Vue 3.4 SFCs

**Primary Dependencies**: Vue 3, Vuetify 3, MDI icons (all already installed)

**Storage**: N/A — presentation only; reads from existing `civDefaultProvider.js` and `recentCivBuilds` from the home snapshot

**Testing**: Manual golden-path per Constitution — no automated test suite

**Target Platform**: Web SPA (desktop + mobile), Netlify-hosted

**Project Type**: Vue 3 frontend, single `src/` project

**Performance Goals**: Native `title` attribute for tile tooltips (avoids 27 Vuetify overlay mounts); CSS grid for columns (simpler than v-row arithmetic)

**Constraints**:
- Vuetify components first (Constitution III); custom scoped CSS only for the hover-reveal overlay, focus ring, and CSS grid
- No new npm dependencies
- No changes to data sourcing, store, or any Home.vue region outside the civ picker block

**Scale/Scope**: 2 files changed/created (`CivPicker.vue` new, `Home.vue` edit); no store, router, or data model changes

## Constitution Check

| Principle | Assessment |
|---|---|
| **I. Simplicity First** | ✅ Single `CivPicker.vue` replaces two duplicated v-row civ blocks. CSS grid is simpler than multi-breakpoint v-col math. Native `title` tooltip costs nothing vs. 27 Vuetify overlay instances. No new dependencies. |
| **II. Incremental Quality** | ✅ Eliminates the duplicated mobile/desktop civ list — a clear code smell — and extracts filter logic into a dedicated component where it belongs. |
| **III. Consistent UX & Component Reuse** | ✅ `v-text-field clearable` for search; `v-card`+`v-img` for tiles; `v-chip` for NEW badge; `v-skeleton-loader` for loading state. Custom scoped CSS only for hover overlay and responsive grid — both inexpressible via Vuetify props alone. |
| **IV. Cost-Conscious Infrastructure** | ✅ No new Firestore reads. Reuses `recentCivBuilds` already fetched by `initData()` in Home.vue. |
| **V. Secure Defaults** | ✅ No auth, no data exposure, no rule changes. Presentation only. |

**Result**: PASS — no violations, Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/005-home-civ-picker/
├── spec.md
├── plan.md              # This file
├── css-reference.md     # Resolved design tokens + copy-pasteable CSS
├── research.md          # Phase 0 decisions
├── data-model.md        # Component prop shapes
├── quickstart.md        # Developer quick reference
├── contracts/
│   └── CivPicker-contract.md
└── tasks.md
```

### Source Code

```text
src/
├── components/
│   └── home/
│       └── CivPicker.vue   # NEW — dense grid, search, hover/focus reveal, skeleton, NEW badge
└── views/
    └── Home.vue            # EDIT — remove civ rows + search field; add <CivPicker>; add snapshotLoaded ref
```

**Structure Decision**: Single-project Vue frontend. No backend, no store, no router changes.

### Key Design Decisions

- **CivPicker is self-contained**: owns `civFilter` ref and `filteredCivs` computed. Home.vue passes `civs`, `recentCivBuilds`, and `loading` as props only — no internal state leaks out.
- **Loading prop drives skeletons**: Home.vue adds a `snapshotLoaded` ref (starts `false`, set `true` after `initData()` resolves). `CivPicker` shows `v-skeleton-loader type="image"` skeleton tiles in the same grid shape when `loading` is `true`.
- **Skeleton count**: 15 tiles (3 rows of 5) — enough to fill visible height before data arrives without over-rendering.
- **CSS grid for columns**: `display: grid; grid-template-columns: repeat(5, 1fr)` in scoped `<style>` with `@media` rules for 4→3 cols. Vuetify's v-col system doesn't cleanly express exact column counts at arbitrary breakpoints without verbose arithmetic.
- **Native `title` tooltip**: applied directly on the tile `<a>`/router-link. `v-tooltip` would mount 27 Vuetify Portal overlay instances; `title` is zero-cost for 27+ tiles.
- **Search filter** (`v-text-field clearable`): filters on `title`, `shortName`, and `tagLine` (case-insensitive). The `clearable` prop provides the accessible clear button automatically.
- **Touch names at ≤720px**: single CSS rule — `.aoe-civtile-hover { opacity: 1; }` inside a `@media (max-width: 720px)` block. Zero JS.
- **Reduced motion**: `transform` and `opacity` transitions wrapped in `@media (prefers-reduced-motion: no-preference)`.
- **Focus ring**: `:focus-visible` outline using `var(--v-theme-primary)` — reveals both the ring AND the name overlay simultaneously for sighted keyboard users.

## Complexity Tracking

> No Constitution violations — section intentionally empty.
