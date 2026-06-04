# Tasks: Home Civilization Picker

**Input**: Design documents from `.specify/specs/005-home-civ-picker/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: Not requested — manual golden-path per Constitution.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no merge conflicts)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the new component file and add the loading-state ref to Home.vue before any story work begins.

- [x] T001 Create `src/components/home/CivPicker.vue` as an empty SFC stub (`<template>`, `<script>`, `<style scoped>` blocks — no content yet)
- [x] T002 [P] In `src/views/Home.vue` setup(): add `const snapshotLoaded = ref(false)`, set `snapshotLoaded.value = true` at the end of `initData()`, add `snapshotLoaded` to the return object

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Rewire `Home.vue` to use `CivPicker` and define the component's prop contract. All user stories depend on this.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 In `src/views/Home.vue`: remove the standalone search `v-text-field` (~lines 35–48), remove both civ `v-row` blocks (the `hidden-sm-and-up` and `hidden-xs` rows, ~lines 50–231); add `<CivPicker :civs="civs" :recent-civ-builds="recentCivBuilds" :loading="!snapshotLoaded" />` in their place; import and register `CivPicker`; remove `civFilter` and `filteredCivs` from setup() return
- [x] T004 In `src/components/home/CivPicker.vue`: define props — `civs: Array (required)`, `recentCivBuilds: Array (required)`, `loading: Boolean (required)` — add minimal template `<div>CivPicker placeholder</div>` so the app compiles

**Checkpoint**: App compiles, Home loads, placeholder text visible where the grid will appear.

---

## Phase 3: User Story 1 — Dense Civilization Grid (Priority: P1) 🎯 MVP

**Goal**: All civs rendered as a responsive 5/4/3-column flag-tile grid; clicking a tile navigates to that civ's builds.

**Independent Test**: Load Home → all civs show as flag tiles in a CSS grid (5 cols desktop, 4 at ≤1080px, 3 at ≤720px); tiles uniform 16:10; clicking any tile routes to `Dashboard?civ=<shortName>`; skeleton tiles show while snapshot loads.

- [x] T005 [US1] In `src/components/home/CivPicker.vue` scoped style: add `.civ-grid` (`display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px`) and responsive rules (`@media (max-width: 1080px)` → 4 cols, `@media (max-width: 720px)` → 3 cols); add `.civ-tile` (`aspect-ratio: 16/10; border-radius: 12px; overflow: hidden; position: relative; display: block`)
- [x] T006 [P] [US1] In `src/components/home/CivPicker.vue` template: add skeleton branch — `<div v-if="loading" class="civ-grid">` containing 15 `<v-skeleton-loader type="image" class="civ-tile" />` tiles; replace placeholder div
- [x] T007 [US1] In `src/components/home/CivPicker.vue` template: add live-grid branch — `<div v-else class="civ-grid">` with `<v-card tag="router-link" class="civ-tile" v-for="civ in filteredCivs" :key="civ.shortName" :to="{ name: 'Dashboard', query: { civ: civ.shortName } }" flat>` containing `<v-img :src="civ.flagLarge" :lazy-src="civ.flagSmall" cover :aspect-ratio="1.6" :alt="civ.title" class="fill-height" />`; add `const filteredCivs = computed(() => civs)` as a placeholder (search wired in Phase 5)

**Checkpoint**: Dense flag-tile grid renders; clicking a tile navigates correctly; skeleton grid shows before snapshot loads.

---

## Phase 4: User Story 2 — Name Reveal + Accessibility (Priority: P1)

**Goal**: Civ name hidden by default, revealed on hover and `:focus-visible`; accessible to assistive tech always; touch users at ≤720px see names without hovering.

**Independent Test**: Hover a tile → name fades in over legibility gradient + tooltip appears; Tab to tile → focus ring visible AND name revealed; ≤720px → names always visible; `aria-label` on every tile matches civ name.

- [x] T008 [US2] In `src/components/home/CivPicker.vue` template: add `title="civ.title"` and `aria-label="civ.title"` on each tile `v-card`; add `<span class="civ-tile__overlay"><span class="civ-tile__name">{{ civ.title }}</span></span>` as last child inside the tile (after `v-img`)
- [x] T009 [US2] In `src/components/home/CivPicker.vue` scoped style: add `.civ-tile__overlay` (`position: absolute; inset: 0; display: flex; align-items: flex-end; padding: 8px 10px; opacity: 0; transition: opacity .15s; background: linear-gradient(to top, rgba(var(--v-theme-background), .92) 5%, rgba(var(--v-theme-background), .25) 55%, transparent 80%)`); add `.civ-tile__name` (`color: rgb(var(--v-theme-primary)); font-weight: 700; font-size: 12.5px; line-height: 1.2`); add reveal rules `.civ-tile:hover .civ-tile__overlay, .civ-tile:focus-visible .civ-tile__overlay { opacity: 1 }`
- [x] T010 [P] [US2] In `src/components/home/CivPicker.vue` scoped style: add focus ring — `.civ-tile:focus-visible { outline: 3px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }`; add touch always-on names — `@media (max-width: 720px) { .civ-tile__overlay { opacity: 1; } }`
- [x] T011 [P] [US2] In `src/components/home/CivPicker.vue` scoped style: move hover lift inside reduced-motion guard — `@media (prefers-reduced-motion: no-preference) { .civ-tile:hover { transform: translateY(-3px); } .civ-tile__overlay { transition: opacity .15s; } }`; add resting `box-shadow: 0 8px 28px rgba(0,0,0,.35)` on `.civ-tile`

**Checkpoint**: Hover reveals name with gradient; keyboard focus ring visible and name shown; ≤720px names always on; no motion under `prefers-reduced-motion`.

---

## Phase 5: User Story 3 — Search, NEW Badge & Empty State (Priority: P2)

**Goal**: Header search filters the grid live by civ name or tagline; empty state on no match; recent-build civs display a NEW badge.

**Independent Test**: Type "fr" → French (and any tagline match) shown, others hidden; clear → all civs return; nonsense query → empty state; civ with a build within 2 days shows NEW chip.

- [x] T012 [US3] In `src/components/home/CivPicker.vue` script: add `import useTimeSince from "@/composables/useTimeSince"`; add `const { isNew } = useTimeSince()`; add `const civFilter = ref("")`; replace the placeholder `filteredCivs` computed with one that filters `props.civs` on `title`, `shortName`, and `tagLine` (all `.toLowerCase().includes(civFilter.value.toLowerCase())`) when `civFilter.value` is non-empty, else returns all civs
- [x] T013 [US3] In `src/components/home/CivPicker.vue` template: add header row above `.civ-grid` — `<div class="civ-picker-head">` containing `<span class="civ-picker-title"><v-icon size="small" class="mr-2">mdi-flag-variant</v-icon>Choose your civilization</span>` and `<v-text-field v-model="civFilter" label="Search civilizations" prepend-inner-icon="mdi-magnify" clearable variant="outlined" rounded="pill" density="compact" hide-details class="civ-search" />`; add `.civ-picker-head` (`display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap; margin-bottom: 16px`) and `.civ-search` (`max-width: 320px; flex: 1`) scoped styles
- [x] T014 [US3] In `src/components/home/CivPicker.vue` template: add empty-state branch between header and grid — `<v-alert v-if="!loading && filteredCivs.length === 0" type="info" color="primary" border="start" elevation="0" icon="mdi-information">No civilizations match "{{ civFilter }}".</v-alert>`
- [x] T015 [P] [US3] In `src/components/home/CivPicker.vue` template: add NEW badge inside each live tile after the overlay span — `<v-chip v-if="isNew(recentCivBuilds.find(r => r.civ === civ.shortName)?.timeCreated.toDate())" size="x-small" color="accent" class="civ-tile__new"><v-icon start size="x-small">mdi-alert-decagram</v-icon>NEW</v-chip>`; add `.civ-tile__new` scoped style (`position: absolute; top: 7px; right: 7px`)

**Checkpoint**: Search filters live; empty state shows on no match; clear restores all; NEW badge appears on civs with recent builds.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Constitution II review and golden-path sign-off.

- [x] T016 Self-review diff in `src/components/home/CivPicker.vue` and `src/views/Home.vue` — verify: no unused imports, no duplicated markup, no magic hex colours (all via theme tokens), no leftover `civFilter`/`filteredCivs` in `Home.vue`
- [ ] T017 Run all 9 items in the golden-path checklist from `.specify/specs/005-home-civ-picker/quickstart.md` in both light and dark themes; fix any failures before marking complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: No dependencies; T001 and T002 are parallel
- **Phase 2 — Foundational**: Depends on Phase 1; T003 depends on T001; T004 depends on T003; BLOCKS all user stories
- **Phase 3 — US1**: Depends on Phase 2; T005 → T006/T007 (T006 and T007 parallel after T005)
- **Phase 4 — US2**: Depends on Phase 3 (overlay sits inside tiles); T008 → T009; T010 and T011 parallel after T009
- **Phase 5 — US3**: Depends on Phase 3 (badge and filter on tile grid); T012 → T013, T014, T015 (T015 parallel after T012)
- **Phase 6 — Polish**: Depends on all chosen user stories complete

### User Story Dependencies

- **US1 (P1)**: No dependency on US2 or US3 — independently shippable after Phase 2
- **US2 (P1)**: Depends on US1 tiles existing; independent of US3
- **US3 (P2)**: Depends on US1 tiles existing (badge + filter drive tile rendering); independent of US2

### Parallel Opportunities

```
Phase 1:  T001 ║ T002  (different files)
Phase 3:  T006 ║ T007  (after T005 — different template branches)
Phase 4:  T010 ║ T011  (after T009 — both scoped-style only)
Phase 5:  T015     (after T012 — badge is independent of search field and empty state)
```

---

## Implementation Strategy

### MVP First (US1 only — shippable dense grid)

1. Phase 1: Setup (T001, T002)
2. Phase 2: Foundational (T003, T004)
3. Phase 3: US1 (T005, T006, T007)
4. **STOP & VALIDATE**: dense grid renders, tiles navigate, skeleton shows — ship if acceptable
5. Continue to US2 and US3 in subsequent commits

### Incremental Delivery

1. Phase 1 + 2 → compiles cleanly, placeholder visible
2. Phase 3 → MVP dense grid ✅
3. Phase 4 → hover/focus reveal + a11y ✅
4. Phase 5 → search, NEW badges, empty state ✅
5. Phase 6 → polish and sign-off ✅

---

## Notes

- No automated tests — manual only (per Constitution)
- All theme colours via `rgb(var(--v-theme-X))` — never hardcode hex
- `v-text-field clearable` provides accessible clear button automatically — do not add custom one
- Native `title` attribute on tiles (not `v-tooltip`) — see research.md decision #2
- Commit after each phase checkpoint
