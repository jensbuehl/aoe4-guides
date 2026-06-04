---
description: "Task list for Home Featured Hero Build"
---

# Tasks: Home Featured "Hero" Build

**Input**: `specs/007-home-hero/` (spec.md, plan.md, research.md, data-model.md, contracts/, css-reference.md)
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅
**Tests**: No automated suite (constitution). Each phase ends with manual golden-path (both themes).
**Note**: Feature 006 (tabs) is already landed — `BuildLaneTabs.vue` exists on `main`. Hero goes inside that component.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no inter-dependencies)
- **[Story]**: User story ([US1], [US2], [US3]) — required on all story-phase tasks

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: CSS variables and snapshot function change — both safe to commit independently before any UI work.

**⚠️ CRITICAL**: Complete both before starting hero component work.

- [x] T001 [P] Add `--hero-fade`, `--hero-title`, `--hero-text`, `--hero-meta`, `--hero-shadow`, `--accent`, `--shadow` CSS vars to `.v-theme--customDarkTheme` and `.v-theme--customLightTheme` blocks in `src/assets/base.css` — exact values from `css-reference.md` §1
- [x] T002 [P] Change `description: data.description ?? null` to `description: data.description ? data.description.slice(0, 300) : null` in `pickBuildFields` in `functions/builds/updateHomeSnapshot.js`

**Checkpoint**: CSS vars available in both themes. Snapshot function trims description to 300 chars. No UI change yet.

---

## Phase 2: User Story 1 — Theme-Aware Fade Hero (Priority: P1) 🎯 MVP

**Goal**: A self-contained `HeroBuild.vue` that, given props, renders the full hero with the exact diagonal fade in both themes.

**Independent Test**: Dark mode → near-black fade + white title + gold eyebrow; light mode → near-white fade + navy title; scrim gradient matches `css-reference.md` §3 exactly; title ≥4.5:1 contrast both themes; 2-line description clamped; description slot hidden when empty; loading prop shows skeleton at hero dimensions.

- [x] T003 [US1] Create `src/components/home/HeroBuild.vue` with props interface (`build` Object|null, `flagUrl` String|null, `civName` String|null, `eyebrow` String, `icon` String, `loading` Boolean default false); add loading branch that renders `<v-skeleton-loader type="image" height="230" width="100%" />` when `loading` is true
- [x] T004 [US1] Add hero template markup to `src/components/home/HeroBuild.vue`: `<v-card class="aoe-featured">` shell → `<v-img cover :src="flagUrl" alt="" aria-hidden="true">` (full-bleed) → `<span class="aoe-featured-scrim">` → `<div class="aoe-featured-content">` with: eyebrow `<span>` (`<v-icon size="small">` + text), `<h2 class="aoe-featured-title">{{ build.title }}</h2>`, `<p class="aoe-featured-opening" v-if="build.description">`, meta `<div>` with `<v-chip size="small">` strategy badge + `<span>` for author/timeCreated/views; add `v-if="build.strategy"` guard on strategy chip
- [x] T005 [US1] Wrap the entire card in `<router-link :to="{ name: 'BuildDetails', params: { id: build.id } }" style="text-decoration:none">` in `src/components/home/HeroBuild.vue`; the `v-card` itself must NOT also have `:to` (avoid double navigation)
- [x] T006 [US1] Add all scoped CSS to `src/components/home/HeroBuild.vue` — copy verbatim from `css-reference.md` §3: `.aoe-featured` shell, `.aoe-featured-bg` (absolute fill, object-fit cover), `.aoe-featured-scrim` (the `linear-gradient(105deg, rgba(var(--hero-fade),.96) 30%, rgba(var(--hero-fade),.58) 62%, rgba(var(--hero-fade),.14) 100%)` — do not approximate), content / eyebrow / title / opening / row / meta / badge rules, `:focus-visible` ring (`outline: 3px solid var(--accent); outline-offset: 3px`), responsive (`@media (max-width: 720px) { .aoe-featured-title { font-size: 22px; } }`)

**Checkpoint**: `HeroBuild.vue` renders correctly in both themes with hardcoded props. Gradient is visually identical to `Home Redesign.html`. Description clamps. Skeleton shows when `loading=true`.

---

## Phase 3: User Story 2 — Hero Swaps Per Lane (Priority: P1)

**Goal**: `BuildLaneTabs.vue` renders `HeroBuild` above the tab strip, showing the active lane's #1 build; the hero swaps instantly on tab change; hero build is excluded from the list below; empty lane hides the hero.

**Independent Test**: On Home, switch Trending / All-Time Classics / New — hero updates build and eyebrow (`#1 Trending · <Civ>` / `#1 All-Time Classic · <Civ>` / `Latest Build · <Civ>`) per lane. Hero build is not the first item in the list. Empty lane: hero hidden. Initial load: skeleton at hero dimensions.

- [x] T007 [US2] Import `civs` from `"@/composables/filter/civDefaultProvider"` and `HeroBuild` from `"@/components/home/HeroBuild.vue"` in `src/components/home/BuildLaneTabs.vue`; add `HeroBuild` to the `components` option
- [x] T008 [US2] Add hero computed properties to `setup()` in `src/components/home/BuildLaneTabs.vue` and return them: `heroBuild` (first item of active lane array, derived from `laneList(activeTab.value)[0]` before dedupe), `heroCiv` (`civs.value.find(c => c.shortName === heroBuild.value?.civ) ?? null`), `heroEyebrow` (built from lane map `{ trending: "#1 Trending", classics: "#1 All-Time Classic", new: "Latest Build" }` + `· civName` if present), `heroIcon` (per lane: `trending→"mdi-trending-up"`, `classics→"mdi-star"`, `new→"mdi-clock-edit-outline"`), `isLoading` (`heroBuild.value?.loading === true`)
- [x] T009 [US2] Modify `laneList` function in `src/components/home/BuildLaneTabs.vue` to de-duplicate: when the raw lane array's first item is a real (non-loading) build, filter it out by id — `const hero = items[0]; return hero && !hero.loading ? items.filter(b => b.id !== hero.id) : items`; note: `heroBuild` computed (T008) must read from the raw props array before this filter
- [x] T010 [US2] Add `<HeroBuild>` at the top of the root `<div class="build-lane-tabs">` in `src/components/home/BuildLaneTabs.vue` (before `<v-tabs>`), with `v-if="isLoading || heroBuild"`, `:build="isLoading ? null : heroBuild"`, `:flag-url="heroCiv?.flagLarge ?? null"`, `:civ-name="heroCiv?.title ?? null"`, `:eyebrow="heroEyebrow"`, `:icon="heroIcon"`, `:loading="isLoading"`, `class="mb-4"`

**Checkpoint**: Switching tabs on Home swaps the hero, eyebrow, and icon. Hero build absent from lane list below. Loading skeleton on fresh page load. Empty lane hides the hero.

---

## Phase 4: User Story 3 — Accessible Link with Real Fields (Priority: P2)

**Goal**: Verify the hero is one keyboard-operable navigation target, announced correctly by assistive tech, and the meta row contains only real data fields.

**Independent Test**: Keyboard tab to hero → visible gold focus ring. Press Enter → navigates to BuildDetails. Screen reader announces `<h2>` title; flag is not announced. Meta row contains only strategy/author/timeCreated/views — no difficulty, no rating.

- [x] T011 [P] [US3] Audit `src/components/home/HeroBuild.vue` template: confirm `v-img` has `alt=""` and `aria-hidden="true"`; confirm title is `<h2>` (not a div/span); confirm router-link wraps the full card and `:focus-visible` outline rule is in scoped CSS with `var(--accent)`
- [x] T012 [P] [US3] Audit meta row in `src/components/home/HeroBuild.vue`: confirm only `build.strategy`, `build.author`, `build.timeCreated`, `build.views` are rendered; confirm no `difficulty`, `rating`, or invented field is present; confirm strategy `v-chip` has `v-if="build.strategy"` guard

**Checkpoint**: US3 acceptance scenarios pass — keyboard operable, ARIA correct, meta row has only real fields.

---

## Phase 5: Polish & Cross-Cutting

**Purpose**: Responsive, reduced-motion, and final self-review across all user stories.

- [x] T013 [P] Verify responsive CSS in `src/components/home/HeroBuild.vue`: `@media (max-width: 720px)` rule sets `.aoe-featured-title` to `font-size: 22px`; test on a narrow viewport that the hero is full-width and legible
- [x] T014 Self-review: confirm diff is confined to `src/assets/base.css`, `src/components/home/HeroBuild.vue`, `src/components/home/BuildLaneTabs.vue`, and `functions/builds/updateHomeSnapshot.js`; confirm `BuildListCard.vue` and `Home.vue` are untouched; confirm scrim gradient and `--hero-*` vars are verbatim; run full golden-path manual test per plan.md checklist (both themes, all 3 lanes, edge cases)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: Start immediately. T001 and T002 can run in parallel (different files).
- **US1 (Phase 2)**: Requires T001 (CSS vars). T003 → T004 → T005 → T006 sequential (same file).
- **US2 (Phase 3)**: Requires T003–T006 (HeroBuild.vue must exist). T007 → T008 → T009 → T010 sequential; note T008 must be before T009 (dedupe depends on understanding heroBuild raw source).
- **US3 (Phase 4)**: Requires T003–T006. T011 and T012 can run in parallel (reviewing same file, different sections).
- **Polish (Phase 5)**: Requires all prior phases complete.

### User Story Dependencies

- **US1 (P1)**: After Phase 1 — no US dependencies
- **US2 (P1)**: After US1 — needs HeroBuild.vue
- **US3 (P2)**: After US1 — can overlap with US2 (reviews HeroBuild.vue independently)

---

## Parallel Opportunities

```
# Phase 1 — run together (different files):
T001  Add --hero-* CSS vars to src/assets/base.css
T002  Add description.slice(0,300) to functions/builds/updateHomeSnapshot.js

# Phase 4 — run together (different sections of HeroBuild.vue):
T011  Audit ARIA attributes + focus ring
T012  Audit meta row fields + strategy guard
```

---

## Suggested Commits

```
feat: add --hero-* theme vars to base.css                (T001)
fix: trim description to 300 chars in home snapshot       (T002)
feat: add HeroBuild component with theme-aware scrim      (T003-T006)
feat: wire HeroBuild into BuildLaneTabs with lane swap    (T007-T010)
feat: verify hero a11y and real-field meta row            (T011-T012)
style: responsive + polish; self-review diff              (T013-T014)
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1 (T001, T002)
2. Complete Phase 2 (T003–T006) — `HeroBuild.vue` done
3. Complete Phase 3 (T007–T010) — `BuildLaneTabs.vue` wired
4. **STOP and VALIDATE**: switch tabs, check hero, check dedupe, check loading → ship

### Full Delivery

5. Complete Phase 4 (T011–T012) — accessibility audit
6. Complete Phase 5 (T013–T014) — responsive + final review → merge

---

## Notes

- No new npm dependencies
- `Home.vue` and `BuildListCard.vue` are **not modified**
- CSS vars (T001) are inert until `HeroBuild.vue` is rendered — safe to commit early
- Cloud function change (T002) is a one-liner and can be deployed any time; snapshot refreshes hourly
- All verbatim CSS is in `css-reference.md` §3 — copy exactly; gradient stops must not be approximated
- `heroBuild` in T008 must read from the raw lane prop array (before the T009 dedupe filter); compute it directly from props, not from the modified `laneList()`
