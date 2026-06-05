# Tasks: Filter UX Redesign (008-filter-ux)

**Input**: Design documents from `.specify/specs/008-filter-ux/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅

**Organization**: Grouped by user story — each phase is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete siblings)
- **[Story]**: Which user story this belongs to

---

## Phase 1: Setup (Quick Wins)

**Purpose**: Standalone fixes with zero risk — ship immediately, no dependencies.

- [x] T001 Fix `creat` typo bug in `src/components/filter/FilterConfig.vue` `onMounted`: change `store.state.filterConfig.creat` → `store.state.filterConfig.creator` (FR-014, ~line 352)
- [x] T002 Update strategy badge in `src/components/home/HeroBuild.vue`: add `color="accent"` to the `v-chip.aoe-badge--strat` and remove the hardcoded `#294790` background + `#fff` color CSS overrides from `.aoe-badge--strat`

**Checkpoint**: Both are one-line changes. Verify: (1) video-creator filter restores after page refresh; (2) strategy badge renders in accent/gold color on the hero card.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core composables and draft state wiring in FilterConfig. MUST complete before any user story phase.

**⚠️ CRITICAL**: All user story phases depend on these.

- [x] T003 [P] Create `src/composables/filter/useDraftFilterConfig.js`: export `useDraftFilterConfig()` with `draft` ref (initialized from `store.state.filterConfig`), `dirtyFields` computed map `{ civs, creator, maps, strategies, seasons, orderBy }` (each true when draft ≠ applied), `dirtyCount` (sum), `isDirty` (boolean), `resetField(field)` (sets `draft.value[field]` back to applied), `applyDraft(emit)` (commits `{ ...draft.value }` via `store.commit('setFilterConfig', ...)` then calls `emit('configChanged')`). Watch `store.state.filterConfig` deeply to re-sync draft when applied config changes externally (route nav). Exclude `author` from dirty tracking. See data-model.md §3.
- [x] T004 [P] Create `src/composables/filter/useFilterCountPreview.js`: export `useFilterCountPreview(draftConfig, { enabled })` that watches `draftConfig` deeply and calls `getBuildsCount({ ...draftConfig.value })` debounced 300ms; exposes `previewCount` (Number|null) and `previewLoading` (Boolean); skips fetch when `enabled.value` is false. Import `getBuildsCount` from `src/composables/data/buildService.js`. See data-model.md §5, research.md §3.
- [x] T005 Wire `useDraftFilterConfig` into `src/components/filter/FilterConfig.vue`: import and call it; replace all `selectedCivs`, `selectedVideoCreator`, `selectedMaps`, `selectedStrategies`, `selectedSeasons`, `selectedOrderBy` local refs with `draft.value.*` bindings (v-model on the existing Vuetify controls); update `handleApply` to call `applyDraft(context.emit)` instead of individual store mutations; update `onMounted` initializer to use `draft.value` from the composable. Keep `configChanged` emit intact — this is a non-breaking internal refactor.

**Checkpoint**: All 4 host pages (Builds, MyBuilds, MyFavorites, Dashboard) still filter correctly after Apply. No visible UI change yet.

---

## Phase 3: User Story 1 — Active Filter Chips (Priority: P1) 🎯 MVP

**Goal**: Chips row above filter fields showing each active filter value; removable chips; pending treatment for staged changes; empty state when no filters active.

**Independent Test**: Apply French + Season 13 → two chips appear; click ✕ on French chip → chip shows pending tint + primary outline (staged removal); with no filters, muted "No filters — showing all builds" line shows instead.

- [x] T006 [P] [US1] Create `src/components/filter/FilterChips.vue`: props `draft` (Object), `dirtyFields` (Object), `applied` (Object); render one `v-chip size="small" closable` per non-null/non-empty value in `draft` (civs, creator, each map/strategy/season entry); apply pending CSS when `dirtyFields[field]` is true (tinted bg `chip-pending` + `inset 0 0 0 1px primary` box-shadow per css-reference.md §4); render muted empty-state line "No filters — showing all builds" when no active values; emit `remove-chip` with `{ field, value }` payload. `v-card flat` wrapper, no box-shadow. See data-model.md §5.
- [x] T007 [US1] Mount `FilterChips` in `src/components/filter/FilterConfig.vue`: import and place at the top of the panel body (above field sections); pass `:draft="draft"` `:dirtyFields="dirtyFields"` `:applied="store.state.filterConfig"`; handle `@remove-chip` by calling `resetField(event.field)`.

**Checkpoint**: Active chips appear; removing a chip stages the change (pending tint visible); empty state shows when no filters.

---

## Phase 4: User Story 2 — Pending Indicators + Sticky Apply Bar + Count Preview (Priority: P1) 🎯 MVP

**Goal**: Pending dot on each changed field, sticky Apply bar always present (no layout shift), "Apply N changes" / "Filters applied" label, count preview debounced.

**Independent Test**: Change two filters → two pending dots appear on field; Apply bar reads "Apply 2 changes"; "≈ N results if applied" updates after 300ms (no doc fetch); press Apply → all indicators clear.

- [x] T008 [P] [US2] Create `src/components/filter/FilterApplyBar.vue`: props `isDirty` (Boolean), `dirtyCount` (Number), `appliedCount` (Number), `previewEnabled` (Boolean, default true), `previewCount` (Number|null), `previewLoading` (Boolean); render always-present sticky footer (`min-height` to prevent layout shift); `v-btn block color="primary" :disabled="!isDirty"` labelled "Apply {{ dirtyCount }} changes" when dirty / "Filters applied" when not; count line below: previewEnabled → "≈ {{ previewCount }} results if applied" (previewLoading → "…"), else → "{{ appliedCount }} shown"; emit `apply` on click. Flat, no box-shadow. See data-model.md §5, css-reference.md §4.
- [x] T009 [US2] Mount `FilterApplyBar` in `src/components/filter/FilterConfig.vue`: import; wire `useFilterCountPreview(draft, { enabled: previewEnabled })` where `previewEnabled = ref(true)`; place `<FilterApplyBar>` at the bottom of the panel body; bind `:isDirty` `:dirtyCount` `:appliedCount="store.state.resultsCount"` `:previewCount` `:previewLoading`; handle `@apply` by calling `applyDraft(context.emit)`.
- [x] T010 [US2] Add pending indicator dots to filter fields in `src/components/filter/FilterConfig.vue`: use the `append-inner` slot on each `v-autocomplete`/`v-select` to conditionally render `<span class="fl-dot" />` when `dirtyFields.civs` / `dirtyFields.creator` / etc. are true. Add to scoped styles: `.fl-dot { width:7px; height:7px; border-radius:50%; background:rgb(var(--v-theme-primary)); }`. See css-reference.md §4.

**Checkpoint**: Pending dots appear on changed fields; Apply bar never shifts layout; count preview updates debounced; Apply clears all indicators.

---

## Phase 5: User Story 4 — Context Variants + Page Headers (Priority: P1) 🎯 MVP

**Goal**: Single FilterConfig handles all three contexts via `context` prop. Author page header replaces duplicated contributor card. Per-list counts on civ page.

**Independent Test**: Dashboard → no civ field, lock note, sort hidden, count above each of 3 lists. Builds with author → AuthorPageHeader above list, no in-panel contributor card, all filters available.

- [x] T011 [US4] Add `context` and `civName` props to `src/components/filter/FilterConfig.vue`: `context: { type: String, default: 'default' }`, `civName: { type: String, default: null }`; wrap Civilization field with `v-if="context !== 'civ-locked'"`; add lock note `<p class="text-caption text-medium-emphasis">Civilization locked to {{ civName }} on this page</p>` shown only when `context === 'civ-locked'`; remove old `hideCivs`, `hideOrderBy`, `defaultCivOverride` props. See contracts/FilterConfig.md.
- [x] T012 [P] [US4] Create `src/components/page/AuthorPageHeader.vue`: props `contributor` (Object: `{ displayName, icon, viewCount, boCount }`) and `count` (Number); render `v-card flat` row with `v-avatar color="accent"` (`:image` when icon exists, else 2-letter initials); eyebrow "Build author" (accent color, 11.5px, 700 weight); display name (22px, 800 weight); `v-chip size="small" variant="tonal"` count badge. Flat, no box-shadow. See data-model.md §5, css-reference.md §6.
- [x] T013 [US4] Update `src/views/builds/Builds.vue`: (a) delete both duplicated contributor `v-card` blocks (`hidden-md-and-up` and `hidden-sm-and-down` copies, ~140 lines total); (b) import `AuthorPageHeader`; (c) add `<AuthorPageHeader v-if="filterConfig.author" :contributor="contributor" :count="store.state.resultsCount" />` above the build list in the results column; (d) no FilterConfig prop changes — `context` defaults to 'default'.
- [x] T014 [P] [US4] Update `src/views/builds/Dashboard.vue`: (a) change FilterConfig usage to `context="civ-locked" :civName="civDisplayName"` (derive from the civ object); (b) add refs `const trendingCount = ref(null)`, `classicsCount`, `newCount`; (c) in `initData()`, call `getBuildsCount(configForList)` alongside each existing `getBuilds(configForList, 5)` call and assign to the count refs; (d) add `<v-chip size="small" variant="tonal">{{ trendingCount }} builds</v-chip>` above each of the 3 list headers.

**Checkpoint**: Dashboard is civ-locked (no civ field, lock note, sort hidden, per-list counts). Builds with author shows AuthorPageHeader, no in-filter contributor card, all filters work.

---

## Phase 6: User Story 3 — Separated Sort + Consistent Count (Priority: P2)

**Goal**: Sort in its own labeled section separated by a dashed divider. Unified tonal count pill above results on all default pages.

**Independent Test**: Sort sits below a dashed "Sort" separator (not mixed with filters); count pill looks identical on Builds, MyBuilds, and MyFavorites.

- [x] T015 [P] [US3] Create `src/components/filter/FilterSortGroup.vue`: props `modelValue` (String — draft.orderBy), `dirty` (Boolean — dirtyFields.orderBy); render dashed `v-divider` + label row (icon + "Sort" text + `.fl-dot` when dirty); `v-select :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"` with existing orderBy options. Emit `update:modelValue`. Flat. See data-model.md §5, css-reference.md §4.
- [x] T016 [US3] Wire `FilterSortGroup` in `src/components/filter/FilterConfig.vue`: import; place after the last filter field and before FilterApplyBar; add `v-if="context !== 'civ-locked'"` guard; bind `:modelValue="draft.orderBy"` `@update:modelValue="draft.orderBy = $event"` `:dirty="dirtyFields.orderBy"`.
- [x] T017 [P] [US3] Add unified count pill above results list in `src/views/builds/Builds.vue`, `src/views/builds/MyBuilds.vue`, `src/views/builds/MyFavorites.vue`: in the results column above the build list (below any page header), add `<v-chip size="small" variant="tonal" class="mb-2">{{ store.state.resultsCount }} builds</v-chip>` in all three files. Use the same component + variant for visual consistency (per css-reference.md §3).

**Checkpoint**: Sort is visually separated; count pill is identical across all default-context pages.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Responsive cleanup, hover treatment, no-shadow audit, and final validation.

- [x] T018 Collapse mobile/desktop verbatim template duplication in `src/components/filter/FilterConfig.vue`: import `useDisplay` from Vuetify; replace the two full template copies (`hidden-md-and-up` / `hidden-sm-and-down` blocks) with a single template; use `const { mdAndUp } = useDisplay()` to conditionally bind `:is` or `:density` where mobile/desktop differ; all sub-components are already responsive. See research.md §4.
- [x] T019 Add field hover treatment to `src/components/filter/FilterConfig.vue` scoped styles: wrap each field in a `<div class="fl-control">`; add `.fl-control:hover { background: rgb(var(--v-theme-surface-variant)); box-shadow: inset 0 0 0 1px rgba(var(--v-border-color), var(--v-border-opacity)); border-radius: 8px; }` using token values from css-reference.md §4. Verify in both light and dark themes. (FR-012)
- [x] T020 [P] Audit flat/no-shadow on all new surfaces: check `FilterChips.vue`, `FilterApplyBar.vue`, `FilterSortGroup.vue`, `AuthorPageHeader.vue`, and the panel `v-card` in `FilterConfig.vue` all have `flat` prop; remove any `box-shadow` from scoped styles. (FR-011b)
- [x] T021 [P] Add explicit `context="default"` to `FilterConfig` usage in `src/views/builds/MyBuilds.vue` and `src/views/builds/MyFavorites.vue` for forward-compatibility clarity (non-breaking — prop defaults to 'default').
- [ ] T022 Manual golden-path test: (a) default context on Builds — chips for active filters, pending dots, Apply "Apply N changes", count preview, Apply clears indicators; (b) civ-locked on Dashboard — no civ field, lock note, sort hidden, count above each of 3 lists; (c) author-locked on Builds with author — AuthorPageHeader above list, no in-panel contributor card, all filters editable; (d) light + dark themes — field hover distinct from surface, count pill legible; (e) mobile — panel above list, apply bar usable.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: No hard dependency on Phase 1 but do in order
- **Phase 3 (US1)**: Requires Phase 2 (T005 — draft state wired)
- **Phase 4 (US2)**: Requires Phase 2 (T003/T004/T005)
- **Phase 5 (US4)**: Requires Phase 2 (T005); independently testable from US1/US2
- **Phase 6 (US3)**: Requires Phase 5 (T011 for `context` prop guard on FilterSortGroup)
- **Phase 7 (Polish)**: After all user story phases complete

### User Story Dependencies

- **US1 (P1 — Chips)**: After Foundational. Independent of US2, US3, US4.
- **US2 (P1 — Apply/Preview)**: After Foundational. Works alongside US1.
- **US4 (P1 — Contexts)**: After Foundational. Independent of US1/US2/US3.
- **US3 (P2 — Sort/Count)**: After US4 (needs `context` prop to guard sort visibility).

### Parallel Opportunities

- T003 + T004 in parallel (new composable files)
- T006 + T008 in parallel (new component files: FilterChips + FilterApplyBar)
- T012 + T014 in parallel (AuthorPageHeader creation + Dashboard.vue update)
- T015 + T017 in parallel (FilterSortGroup creation + count pill on host pages)
- T020 + T021 in parallel (audit + minor host page updates)

---

## Implementation Strategy

### MVP First (all P1 stories — Phases 1–5)

1. Phase 1: Setup (T001, T002) — commit immediately
2. Phase 2: Foundational (T003–T005)
3. Phase 3: US1 Chips (T006–T007)
4. Phase 4: US2 Apply/Preview (T008–T010)
5. Phase 5: US4 Contexts (T011–T014)
6. **STOP AND VALIDATE**: All three contexts, chips, apply, count preview
7. Ship MVP

### Full Delivery (adds US3 + Polish)

8. Phase 6: US3 Sort + Count (T015–T017)
9. Phase 7: Polish (T018–T022)

---

## Notes

- T001 and T002 are tiny standalone fixes — commit each separately
- T005 is the most critical foundational step: a significant internal refactor of FilterConfig.vue; verify all host pages still filter correctly before continuing
- T018 (responsive collapse) is the most complex polish task; safe to defer if MVP is the goal
- The count pill (`v-chip size="small" variant="tonal"`) is intentionally NOT extracted to a dedicated component — it's a one-liner Vuetify primitive; extracting it would violate Principle I (Simplicity)
- T002 (HeroBuild badge) touches feature 007 code — commit it separately with a `style:` prefix commit message
- [P] = different files, safe to dispatch as parallel agents in `/speckit-implement`
