# Component Contract: FilterConfig.vue

**Type**: Vue 3 SFC (shared filter component)
**File**: `src/components/filter/FilterConfig.vue`
**Status**: Modified (was existing; context prop replaces bool props)

---

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `context` | `'default' \| 'civ-locked' \| 'author-locked'` | `'default'` | No | Rendering context: drives field visibility and lock note |
| `civName` | `String` | `null` | No | Civ display name for the lock note. Only used when `context='civ-locked'` |

### Removed Props (breaking change for host pages)

| Old Prop | Replaced By |
|----------|-------------|
| `hideCivs: Boolean` | `context='civ-locked'` |
| `hideOrderBy: Boolean` | `context='civ-locked'` |
| `defaultCivOverride: String` | `civName` prop |

---

## Emits

| Event | Payload | Description |
|-------|---------|-------------|
| `configChanged` | none | Fired after the user presses Apply and the store has been updated |

---

## Context Behaviour Matrix

| Feature | `default` | `civ-locked` | `author-locked` |
|---------|-----------|-------------|-----------------|
| Civilization field | visible | **hidden** | visible |
| Lock note ("Civilization locked to X") | hidden | **shown** | hidden |
| Sort section (FilterSortGroup) | visible | **hidden** | visible |
| Author page header | handled by parent | handled by parent | handled by parent |
| All other filters (creator, maps, strategies, seasons) | visible | visible | visible |

---

## Internal Composition

FilterConfig.vue uses these composables and sub-components internally:

### Composables
- `useDraftFilterConfig()` — draft state, dirtyFields, applyDraft, resetField
- `useDisplay()` (Vuetify) — replaces the mobile/desktop template duplication

### Sub-components rendered inside FilterConfig
- `FilterChips.vue` — chips row at the top of the panel
- `FilterSortGroup.vue` — sort section (rendered with `v-if="context !== 'civ-locked'"`)
- `FilterApplyBar.vue` — sticky footer (always rendered, enabled when isDirty)

### Sub-components rendered by HOST PAGES (not FilterConfig)
- `AuthorPageHeader.vue` — rendered by `Builds.vue` in the results column, NOT inside the filter panel

---

## Migration Guide for Host Pages

### Builds.vue (default + author-locked)
```vue
<!-- Before -->
<FilterConfig @configChanged="initData" />

<!-- After (no prop needed for default context) -->
<FilterConfig @configChanged="initData" />
<!-- context="default" is the default — no change needed for Builds.vue default mode -->
```
Remove: The contributor `v-card` (both mobile/desktop copies). Add: `<AuthorPageHeader>` above the build list when `filterConfig.author` is set.

### Dashboard.vue (civ-locked)
```vue
<!-- Before -->
<FilterConfig hideCivs :defaultCivOverride="civ" hideOrderBy @configChanged="initData" />

<!-- After -->
<FilterConfig context="civ-locked" :civName="civDisplayName" @configChanged="initData" />
```

### MyBuilds.vue / MyFavorites.vue (default)
```vue
<!-- No change needed — context="default" is the default -->
<FilterConfig @configChanged="initData" />
```

---

## Bug Fix: FR-014

`onMounted` currently reads `store.state.filterConfig.creat` (typo). Fixed to `store.state.filterConfig.creator`. This is a one-line fix in `FilterConfig.vue`.

---

## Flat / No-Shadow Constraint

All `v-card` wrappers inside FilterConfig (panel container, chips area, apply bar) MUST use the `flat` prop. No `elevation` attribute. Consistent with project convention (FR-011b).
