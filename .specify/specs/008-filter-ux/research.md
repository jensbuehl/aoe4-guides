# Research: Filter UX Redesign (008-filter-ux)

## 1. Current FilterConfig.vue Architecture

**Decision**: Enhance the existing `FilterConfig.vue` in-place; do not create a new parallel component.

**Rationale**: The shared component is already used by 4+ host pages. Creating a new component would require updating all callers twice (add new, remove old). The existing Vuetify controls are kept as-is per FR-011.

**Current state found**:
- File: `src/components/filter/FilterConfig.vue`
- Props today: `defaultCivOverride`, `hideCivs`, `hideOrderBy`
- Emits: `"configChanged"`
- No draft/applied split — editing immediately mutates store state
- Massive mobile/desktop duplication (two full template blocks with `hidden-*` Vuetify classes)
- Bug on line 352: reads `store.state.filterConfig.creat` instead of `.creator`

---

## 2. Store FilterConfig Shape

**Found in**: `src/store/index.js` + `src/composables/filter/configDefaultProvider.js`

```javascript
// Applied (store) shape
filterConfig: {
  creator: null,       // video creator ID
  author: null,        // author ID (page-locked via route, not a filter input)
  civs: null,          // civ shortName string
  maps: [],
  strategies: [],
  seasons: [],
  orderBy: "scoreAllTime"
}
```

**Decision**: Draft config uses the same shape as a plain local `ref`. No type changes needed.

**Alternatives considered**:
- New `draftFilterConfig` Vuex module → rejected (violates Simplicity First; draft is transient UI state)
- Pinia store slice → rejected (project uses Vuex 4; introducing Pinia adds a dependency)

---

## 3. getBuildsCount and Count Preview

**Found in**: `src/composables/data/buildService.js`

```javascript
export async function getBuildsCount(filterConfig = getDefaultConfig()) {
  const allBuildsQuery = getQuery(getQueryParametersFromConfig(filterConfig));
  return getSize(allBuildsQuery); // Firestore count aggregation — NOT a document read
}
```

**Current usage**: Called in `initData()` of Builds.vue, MyBuilds.vue, MyFavorites.vue, Dashboard.vue after Apply.

**Decision**: Reuse `getBuildsCount(draftConfig)` debounced 300ms for the count preview in `FilterApplyBar.vue`. The composable `useFilterCountPreview.js` wraps it with a `watch` + debounce.

**Cost**: Firestore count aggregation reads 1 read per 1000 matched index entries. For ~4k builds this is ~4 aggregation reads per preview call — negligible. Per FR-006, there MUST be a disableable setting; when disabled, only the applied count is shown.

**Per-list counts on Dashboard.vue**: Each list already calls `getBuilds(config, 5)`. The per-list count (all matching builds, not just 5) needs `getBuildsCount` for each list's config. `Dashboard.vue` should call `getBuildsCount(configForList)` for each of the 3 lists during `initData()` and store them in local `ref`s (`trendingCount`, `classicsCount`, `newCount`). This is 3 aggregation calls on Apply — acceptable cost.

---

## 4. Responsive Duplication Strategy

**Problem found**: `FilterConfig.vue` currently has two near-identical template sections wrapped in `<div class="hidden-md-and-up">` and `<div class="hidden-sm-and-down">`. ~300 lines of verbatim duplication.

**Decision**: Collapse to a single template using Vuetify's `useDisplay()` composable. Where mobile/desktop differ in component type (e.g., `v-autocomplete` vs `v-select` on mobile), use a computed `component` variable or `:is` binding. For density/size differences, use `:density` and `:variant` props conditionally.

**Pattern**:
```javascript
const { mdAndUp } = useDisplay();
// In template:
// <component :is="mdAndUp ? 'v-autocomplete' : 'v-select'" ...>
```

**Alternatives considered**: Scoped slots, renderless wrapper component → rejected as over-engineering for this scope.

---

## 5. Context Prop Design

**Decision**: Replace `hideCivs: Boolean`, `hideOrderBy: Boolean`, `defaultCivOverride: String` with:
```javascript
props: {
  context: {
    type: String,
    default: 'default',
    validator: v => ['default', 'civ-locked', 'author-locked'].includes(v)
  },
  civName: String  // used with context="civ-locked" for the lock note
}
```

**Context rules**:
| Context | Civ field | Sort section | Lock note | Author header |
|---------|-----------|-------------|-----------|---------------|
| `default` | visible | visible | hidden | hidden |
| `civ-locked` | hidden | hidden | visible | hidden |
| `author-locked` | visible | visible | hidden | shown in parent |

**Why `civName` separate from store**: The civ is set by the route (Dashboard.vue reads `route.query.civ`) and is not a user-editable filter in this context. It's passed as a prop to display in the lock note.

**Migration for Dashboard.vue**:
```diff
- <FilterConfig hideCivs :defaultCivOverride="civ" hideOrderBy ...>
+ <FilterConfig context="civ-locked" :civName="civ" ...>
```

---

## 6. Author Page Header

**Found in**: `Builds.vue` — contributor card is duplicated verbatim twice (once for `hidden-md-and-up`, once for `hidden-sm-and-down`), ~140 lines total.

**Decision**: Extract to `AuthorPageHeader.vue` placed in `src/components/page/`. Host (`Builds.vue`) renders it in the **results column** above the build list, not inside the filter panel.

**Props**: `contributor` (the existing object: `{ displayName, icon, viewCount, boCount }`) + `count` (the applied result count).

**Removal**: Both copies of the contributor `v-card` in `Builds.vue` are deleted. No equivalent appears in `FilterConfig.vue`.

---

## 7. useDraftFilterConfig Composable Design

```javascript
// src/composables/filter/useDraftFilterConfig.js
export function useDraftFilterConfig() {
  const store = useStore();
  const draft = ref({ ...store.state.filterConfig });

  // Sync draft from store when applied config changes externally (e.g., page nav resets)
  watch(() => store.state.filterConfig, (applied) => {
    draft.value = { ...applied };
  }, { deep: true });

  const dirtyFields = computed(() => {
    const a = store.state.filterConfig;
    const d = draft.value;
    return {
      civs:      d.civs !== a.civs,
      creator:   d.creator !== a.creator,
      maps:      !arraysEqual(d.maps, a.maps),
      strategies:!arraysEqual(d.strategies, a.strategies),
      seasons:   !arraysEqual(d.seasons, a.seasons),
      orderBy:   d.orderBy !== a.orderBy,
    };
  });

  const dirtyCount = computed(() => Object.values(dirtyFields.value).filter(Boolean).length);
  const isDirty = computed(() => dirtyCount.value > 0);

  function resetField(field) {
    draft.value[field] = store.state.filterConfig[field];
  }

  function applyDraft(emit) {
    store.commit('setFilterConfig', { ...draft.value });
    emit('configChanged');
  }

  return { draft, dirtyFields, dirtyCount, isDirty, resetField, applyDraft };
}
```

**Note**: `author` field is never edited by the user (it's set by the page, not the filter), so it is excluded from `dirtyFields` computation but copied into the draft on sync.

---

## 8. useFilterCountPreview Composable Design

```javascript
// src/composables/filter/useFilterCountPreview.js
export function useFilterCountPreview(draftConfig, { enabled = ref(true) } = {}) {
  const previewCount = ref(null);
  const previewLoading = ref(false);

  const doFetch = debounce(async (config) => {
    if (!enabled.value) return;
    previewLoading.value = true;
    previewCount.value = await getBuildsCount(config);
    previewLoading.value = false;
  }, 300);

  watch(draftConfig, (cfg) => doFetch({ ...cfg }), { deep: true });

  return { previewCount, previewLoading };
}
```

**Setting for disabling preview**: A local `ref(true)` passed from `FilterApplyBar.vue` or from a user preference. When disabled, `FilterApplyBar.vue` shows "N shown" (the applied count from the store) instead.

---

## 9. No-Shadow / Flat Constraint

All new surfaces (`v-card` for panel wrapper, chips, apply bar, author/civ headers) MUST use `flat` prop or have no explicit `elevation`. The css-reference.md defines a `panel shadow` token but the project's design convention is flat (confirmed by user and prior commits that removed shadow from CivPicker tiles). The `flat` prop on `v-card` is the correct Vuetify mechanism.

---

## Summary: No Remaining Blockers

All NEEDS CLARIFICATION items resolved. Implementation can proceed with:
- No new dependencies
- No Vuex schema changes
- No new backend/infra
- One shared `FilterConfig.vue` component for all contexts
