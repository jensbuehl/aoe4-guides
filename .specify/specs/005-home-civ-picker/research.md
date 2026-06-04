# Research: Home Civilization Picker

**Date**: 2026-06-04 | **Feature**: 005-home-civ-picker

## Decision Log

### 1. Grid layout: CSS grid vs. Vuetify v-row/v-col

**Decision**: CSS grid wrapper (`display: grid; grid-template-columns: repeat(N, 1fr)`)

**Rationale**: The spec requires exact column counts (5/4/3) at specific pixel breakpoints. Expressing this with Vuetify's 12-column grid requires non-obvious arithmetic (e.g., `cols="2"` only gives 6 columns, not 5). CSS grid is 3 lines. Vuetify's `v-row`/`v-col` adds DOM nodes and class noise for no benefit here.

**Alternatives considered**: `v-row` + `v-col :cols="..." :sm="..." :md="..."` — rejected; awkward for non-divisor column counts and adds unnecessary wrapper divs.

---

### 2. Tooltip: native `title` vs. `v-tooltip`

**Decision**: Native `title` attribute on each tile

**Rationale**: There are 27 civilization tiles. `v-tooltip` mounts a Vuetify Portal overlay per instance — 27 overlay instances attached to the DOM for a hover-only affordance. Native `title` is rendered by the browser with zero JS overhead and satisfies FR-003 (tooltip on hover). For a static list this is the right tool.

**Alternatives considered**: `v-tooltip` — rejected on performance grounds. `v-tooltip` with `activator="parent"` still mounts per-tile.

---

### 3. Search field: `v-text-field clearable` vs. custom input

**Decision**: Vuetify `v-text-field` with `clearable`, `prepend-inner-icon`, `variant="outlined"`, `rounded`

**Rationale**: Constitution III requires Vuetify before custom. `v-text-field clearable` provides the accessible clear button (with `aria-label="Clear"`) automatically, handles keyboard interactions, and integrates with the theme. The custom pill style from `css-reference.md` can be achieved with `rounded="pill"` + `variant="outlined"`.

**Alternatives considered**: Custom `<input type="search">` as shown in `css-reference.md` reference markup — rejected; Vuetify is already the project's component library and the custom input would duplicate its behaviour.

---

### 4. Skeleton loading state

**Decision**: `v-skeleton-loader type="image"` tiles in the same CSS grid, 15 tiles (3 rows × 5 cols), gated by a `loading` prop from Home.vue

**Rationale**: The rest of Home already uses skeleton sentinels (`Array(5).fill({ loading: true })`) for build lists. Using the same pattern keeps the loading UX consistent. 15 tiles fills approximately the visible desktop height of the grid before data arrives.

Home.vue needs a `snapshotLoaded` ref (false → true after `initData()` resolves) to drive this prop — a trivial one-liner addition.

**Alternatives considered**: Spinner in picker header — rejected; inconsistent with the rest of Home's skeleton pattern. Nothing/invisible — rejected; causes layout shift.

---

### 5. Touch name visibility at ≤720px

**Decision**: CSS-only: `.aoe-civtile-hover { opacity: 1; }` inside `@media (max-width: 720px)`

**Rationale**: No JavaScript needed. Overrides the default `opacity: 0` for the name overlay at small breakpoints. The gradient background is already always rendered (it's just invisible), so this one rule both reveals the name and shows the legibility gradient. Zero runtime cost.

**Alternatives considered**: JS `isMobile` detection — rejected; unnecessary complexity. Tap-to-reveal — rejected by user in clarification (Option A selected).

---

### 6. Component extraction scope

**Decision**: Extract to `src/components/home/CivPicker.vue`; Home.vue removes the two civ v-row blocks and the standalone search field

**Rationale**: The current Home.vue contains two nearly-identical civ blocks (one for `hidden-sm-and-up`, one for `hidden-xs`) plus a separate search field. Extracting these into one CivPicker removes ~180 lines from Home.vue, eliminates duplication, and co-locates the filter logic with the display logic.

**Alternatives considered**: Inline rewrite within Home.vue — rejected; the civ block is already large enough to be its own component, and extraction is required by Constitution III (UI patterns appearing more than once must be extracted).
