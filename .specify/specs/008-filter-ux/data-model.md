# Data Model: Filter UX Redesign (008-filter-ux)

*No new Firestore entities. This document covers the client-side state shapes and component data contracts.*

---

## 1. FilterConfig State Shape (unchanged)

The existing Vuex store shape. No migration needed.

```javascript
// store.state.filterConfig  (APPLIED state — persists in Vuex)
{
  creator:    null | string,    // video creator ID
  author:     null | string,    // author ID (route-set; not a user-editable filter)
  civs:       null | string,    // civ shortName
  maps:       string[],
  strategies: string[],
  seasons:    string[],
  orderBy:    string            // "scoreAllTime" | "score" | "timeCreated"
}
```

---

## 2. Draft State Shape

Identical shape to `filterConfig`. Lives as a local `ref` inside `FilterConfig.vue` via `useDraftFilterConfig`.

```javascript
// draft.value  (UI-local; never committed to Vuex until Apply)
{
  creator:    null | string,
  author:     null | string,   // copied from store but never mutated by user
  civs:       null | string,
  maps:       string[],
  strategies: string[],
  seasons:    string[],
  orderBy:    string
}
```

---

## 3. DirtyFields Map

Computed inside `useDraftFilterConfig`. Tells each field whether it has a staged-but-unapplied change.

```javascript
// dirtyFields  (computed)
{
  civs:       boolean,
  creator:    boolean,
  maps:       boolean,
  strategies: boolean,
  seasons:    boolean,
  orderBy:    boolean
}
// + dirtyCount: number (sum of true values)
// + isDirty: boolean (dirtyCount > 0)
```

---

## 4. Contributor Object (AuthorPageHeader input)

Fetched in `Builds.vue` via `getContributor(authorId)`. No changes to the shape.

```javascript
{
  displayName: string,
  icon:        string | null,   // image URL; null → show initials fallback
  viewCount:   number,
  boCount:     number           // build order count
}
```

---

## 5. Component Interfaces

### FilterConfig.vue (modified)

**Props**:
```javascript
{
  context:   { type: String, default: 'default' },  // 'default' | 'civ-locked' | 'author-locked'
  civName:   { type: String, default: null },        // shown in lock note when context='civ-locked'
}
```
*Removed*: `hideCivs`, `hideOrderBy`, `defaultCivOverride` (replaced by `context` + `civName`)

**Emits**: `'configChanged'` (same as before)

**Internal state via composables**:
- `useDraftFilterConfig()` → `{ draft, dirtyFields, dirtyCount, isDirty, resetField, applyDraft }`
- `useFilterCountPreview(draft, { enabled })` → `{ previewCount, previewLoading }` (inside FilterApplyBar)

---

### FilterChips.vue (new)

**Props**:
```javascript
{
  draft:       Object,   // current draft config (civs, creator, maps[], strategies[], seasons[])
  dirtyFields: Object,   // DirtyFields map — drives pending tint/border
  applied:     Object,   // store.state.filterConfig — for pending comparison
}
```
**Emits**: `'removeChip'` with payload `{ field: string, value: string }` — parent resets that draft field

**Renders**: One `v-chip closable` per active value in `draft`. Pending treatment applied when `dirtyFields[field]` is true. Empty-state line when no active values.

---

### FilterSortGroup.vue (new)

**Props**:
```javascript
{
  modelValue: String,     // draft.orderBy
  dirty:      Boolean,    // dirtyFields.orderBy
}
```
**Emits**: `'update:modelValue'` — v-model compatible

**Renders**: Dashed `v-divider`, "Sort" label + icon, `v-select` for orderBy. Hidden entirely when `context='civ-locked'` (controlled by parent `v-if`).

---

### FilterApplyBar.vue (new)

**Props**:
```javascript
{
  isDirty:        Boolean,        // enable/disable Apply button
  dirtyCount:     Number,         // "Apply N changes" label
  appliedCount:   Number,         // "N shown" (from store.state.resultsCount)
  previewEnabled: { type: Boolean, default: true },
  previewCount:   { type: Number, default: null },   // null = loading
  previewLoading: Boolean,
}
```
**Emits**: `'apply'` — parent calls `applyDraft()` and then `initData()`

**Renders**: Always-present sticky `v-card-actions` footer. Apply `v-btn` (enabled when `isDirty`, labelled "Apply N changes" / disabled "Filters applied"). Count line below: preview mode shows "≈ N results if applied"; non-preview shows "N shown".

---

### AuthorPageHeader.vue (new)

**Props**:
```javascript
{
  contributor: Object,    // { displayName, icon, viewCount, boCount }
  count:       Number,    // applied result count pill
}
```
**Emits**: none

**Renders**: `v-card flat` with avatar (image or initials), "Build author" eyebrow, display name, count tonal `v-chip`. Placed in the results column of `Builds.vue`, not inside the filter panel.

---

## 6. Count Pill Pattern (shared across 3 placements)

No dedicated component — a single `v-chip size="small" variant="tonal"` element used inline in:
1. Results column header in `Builds.vue` / `MyBuilds.vue` / `MyFavorites.vue`
2. `AuthorPageHeader.vue` (next to display name)
3. Above each of the 3 lists in `Dashboard.vue`

Consistent appearance guaranteed by using the same Vuetify component + variant everywhere.

---

## 7. Per-List Count State (Dashboard.vue)

Three new `ref`s added to `Dashboard.vue`:
```javascript
const trendingCount  = ref(null)  // getBuildsCount for score-sorted config
const classicsCount  = ref(null)  // getBuildsCount for scoreAllTime-sorted config
const newCount       = ref(null)  // getBuildsCount for timeCreated-sorted config
```
Populated alongside the existing `getBuilds(configForList, 5)` calls in `initData()`. Each count call reuses the same `configForList` variant. Shown as tonal `v-chip` above each list section header.
