# Tasks: Home Build Lane Tabs

**Input**: Design documents from `.specify/specs/006-home-build-tabs/`

**Prerequisites**: plan.md âœ… spec.md âœ… research.md âœ… data-model.md âœ… contracts/ âœ… quickstart.md âœ…

**Tests**: Not requested â€” manual golden-path per Constitution.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no merge conflicts)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the component stub and add the import to Home.vue before any story work.

- [x] T001 Create `src/components/home/BuildLaneTabs.vue` as an empty SFC stub (`<template>`, `<script>`, `<style scoped>` blocks â€” no content)
- [x] T002 [P] In `src/views/Home.vue` script: import `BuildLaneTabs` from `"@/components/home/BuildLaneTabs.vue"` and add it to the `components` object

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Remove the three stacked build sections from Home.vue and replace with `<BuildLaneTabs>`. All user stories depend on this rewire.

**âš ï¸ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 In `src/views/Home.vue` template: remove all three stacked build sections (the `<!-- popular builds -->`, `<!-- all time classics -->`, and `<!-- recent builds -->` v-row blocks including their header rows with icons/tooltips/chevrons and their list rows); replace with `<BuildLaneTabs :popular-builds="popularBuildsList" :all-time-classics="allTimeClassicsList" :recent-builds="recentBuildsList" />`
- [x] T004 In `src/components/home/BuildLaneTabs.vue` script: define props â€” `popularBuilds: Array (required)`, `allTimeClassics: Array (required)`, `recentBuilds: Array (required)` â€” and add placeholder template `<div>BuildLaneTabs</div>` so the app compiles

**Checkpoint**: App compiles, Home loads, placeholder text visible where stacked build sections were.

---

## Phase 3: User Story 1 â€” Tabbed Section (Priority: P1) ðŸŽ¯ MVP

**Goal**: Three lanes as a tab bar, one list visible at a time, Trending active by default; lists swap in place on tab click.

**Independent Test**: Home renders Trending/All-Time Classics/New tab bar; Trending list is visible on load (skeleton cards while snapshot loads); clicking another tab swaps the list without URL change or new network request.

- [x] T005 [US1] In `src/components/home/BuildLaneTabs.vue` script: import `ref` and `computed` from `"vue"`; import `BuildListCard` from `"@/components/builds/BuildListCard.vue"` and register in components; define `const lanes = [{ value: 'trending', label: 'Trending', icon: 'mdi-trending-up', orderBy: 'score' }, { value: 'classics', label: 'All-Time Classics', icon: 'mdi-star', orderBy: 'scoreAllTime' }, { value: 'new', label: 'New', icon: 'mdi-clock-edit-outline', orderBy: 'timeCreated' }]`; define `const activeTab = ref('trending')`; return `{ lanes, activeTab }`
- [x] T006 [US1] In `src/components/home/BuildLaneTabs.vue` template: replace placeholder with `<v-tabs v-model="activeTab" color="primary" class="flex-grow-1">` containing `<v-tab v-for="lane in lanes" :key="lane.value" :value="lane.value">{{ lane.label }}</v-tab>`; close `</v-tabs>`
- [x] T007 [US1] In `src/components/home/BuildLaneTabs.vue` template: add `<v-window v-model="activeTab">` with three `<v-window-item>` elements â€” value `'trending'` iterates `popularBuilds`, `'classics'` iterates `allTimeClassics`, `'new'` iterates `recentBuilds`; inside each use `<router-link v-for="item in [list]" :key="item.id ?? item.loading" style="text-decoration:none" :to="item.loading ? { name: 'Home' } : { name: 'BuildDetails', params: { id: item.id } }"><BuildListCard :build="item" /></router-link>`

**Checkpoint**: Tab bar renders; Trending list shows skeleton cards on load, real cards after snapshot; clicking tabs swaps lists in place; URL stays unchanged.

---

## Phase 4: User Story 2 â€” Contextual View All (Priority: P1)

**Goal**: A View all button in the tab row navigates to the Builds list pre-sorted for the active lane.

**Independent Test**: With each tab active, View all navigates to `{ name: 'Builds', query: { orderBy: 'score' | 'scoreAllTime' | 'timeCreated' } }` respectively; button is visually distinct from tabs.

- [x] T008 [US2] In `src/components/home/BuildLaneTabs.vue` script: add `const viewAllRoute = computed(() => ({ name: 'Builds', query: { orderBy: lanes.find(l => l.value === activeTab.value)?.orderBy } }))`; add it to the return object
- [x] T009 [US2] In `src/components/home/BuildLaneTabs.vue` template: wrap the `v-tabs` in `<div class="d-flex align-center mb-2">`; add `<v-btn variant="text" color="primary" size="small" :to="viewAllRoute" class="ml-2 flex-shrink-0">View all <v-icon end size="small">mdi-chevron-right</v-icon></v-btn>` after `</v-tabs>`; close the wrapper `</div>`

**Checkpoint**: View all button appears right-aligned in the tab row; routes correctly for each active lane; visually distinct from the in-place tabs.

---

## Phase 5: User Story 3 â€” Keyboard & Assistive Tech (Priority: P2)

**Goal**: Arrow-key navigation between tabs, correct ARIA semantics via Vuetify, `prefers-reduced-motion` disables panel transition.

**Independent Test**: Keyboard focus on tab bar â†’ arrow keys move focus and switch visible list; focus ring visible; `v-tabs`/`v-window` emit correct tablist/tab/tabpanel ARIA; DevTools forced `prefers-reduced-motion: reduce` â†’ no slide animation on tab switch.

- [x] T010 [US3] In `src/components/home/BuildLaneTabs.vue` script: add `const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches`; return it
- [x] T011 [US3] In `src/components/home/BuildLaneTabs.vue` template: add `:transition="reducedMotion ? false : undefined"` and `:reverse-transition="reducedMotion ? false : undefined"` to the `v-window` element (Vuetify's `v-tabs` and `v-window` sharing the same `v-model` already wires all `aria-controls`/`aria-labelledby`/`aria-selected` automatically)

**Checkpoint**: Arrow keys navigate tabs; focus ring visible; no slide transition when `prefers-reduced-motion: reduce` is active in DevTools.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Empty state, self-review, golden-path sign-off.

- [x] T012 In `src/components/home/BuildLaneTabs.vue` template: add empty-state inside each `v-window-item` â€” `<v-alert v-if="list.length === 0" type="info" color="primary" border="start" elevation="0" icon="mdi-information">No build orders available yet.</v-alert>` before the router-link loop (where `list` is the prop array for that lane)
- [x] T013 Self-review diff in `src/components/home/BuildLaneTabs.vue` and `src/views/Home.vue`: no unused imports; `BuildListCard` is unchanged; `BuildLaneTabs` reads only from props (no direct store access); all three `orderBy` values (`score`, `scoreAllTime`, `timeCreated`) match the spec; no store or router changes
- [x] T014 Run all 10 items in the golden-path checklist from `.specify/specs/006-home-build-tabs/quickstart.md` in both light and dark themes; fix any failures before marking complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 â€” Setup**: No dependencies; T001 and T002 are parallel
- **Phase 2 â€” Foundational**: Depends on Phase 1; T003 depends on T001+T002; T004 depends on T003; BLOCKS all user stories
- **Phase 3 â€” US1**: Depends on Phase 2; T005 â†’ T006 â†’ T007; T005 is a prerequisite for T006 and T007
- **Phase 4 â€” US2**: Depends on Phase 3 (View all sits in the same tab row); T008 â†’ T009
- **Phase 5 â€” US3**: Depends on Phase 3 (v-window must exist); T010 â†’ T011
- **Phase 6 â€” Polish**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: No dependency on US2 or US3 â€” independently shippable after Phase 2
- **US2 (P1)**: Depends on US1 (View all sits in the tab row); independent of US3
- **US3 (P2)**: Depends on US1 (v-window must exist to add transition props); independent of US2

### Parallel Opportunities

```
Phase 1:  T001 â•‘ T002  (different files â€” CivPicker stub + Home.vue import)
```

---

## Implementation Strategy

### MVP First (US1 + US2 â€” shippable tabbed section with View all)

1. Phase 1: Setup (T001, T002)
2. Phase 2: Foundational (T003, T004)
3. Phase 3: US1 â€” tabbed lists (T005â€“T007)
4. Phase 4: US2 â€” View all (T008, T009)
5. **STOP & VALIDATE**: Tab bar renders, lists swap, View all routes correctly â€” ship if ready
6. Phase 5: US3 â€” a11y polish (T010, T011)
7. Phase 6: Empty state + review (T012â€“T014)

### Incremental Delivery

1. Phase 1 + 2 â†’ compiles cleanly, placeholder visible
2. Phase 3 (US1) â†’ tabbed MVP âœ…
3. Phase 4 (US2) â†’ View all âœ…
4. Phase 5 (US3) â†’ full a11y âœ…
5. Phase 6 â†’ empty state + sign-off âœ…

---

## Notes

- No automated tests â€” manual golden-path only (per Constitution)
- `v-tabs` + `v-window` sharing `v-model="activeTab"` is the entire tab wiring â€” Vuetify handles all ARIA automatically
- `BuildListCard` MUST NOT be modified (FR-003, SC-006)
- `router-link` wrapper for build items matches the existing Home.vue pattern exactly
- Commit after each phase checkpoint

