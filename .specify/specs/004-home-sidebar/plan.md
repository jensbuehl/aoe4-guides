# Implementation Plan: Home Sidebar Rework

**Branch**: `004-home-sidebar` | **Date**: 2026-06-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-home-sidebar/spec.md`

## Summary

Rework the Home page right-hand sidebar to reduce visual noise: slim `News.vue` into a focused Season card (tag + title + blurb + quiet support links), convert the scattered per-contributor cards into one cohesive ranked `TopContributors.vue` card, and standardise all sidebar cards to `v-card border rounded="lg"`. Pure presentation change — no data, schema, or Firebase changes.

## Technical Context

**Language/Version**: JavaScript (ES2022), Vue 3 (Composition API)

**Primary Dependencies**: Vuetify 3 — `v-card`, `v-btn variant="text"`, `v-avatar`, `v-chip`, `v-row`/`v-col`; MDI icons (already installed). No new dependencies.

**Storage**: N/A — presentation only. Contributor data flows from Vuex store (`store.state.cache.topContributorsList`), populated once per session from the hourly Firestore home snapshot.

**Testing**: Manual golden-path — no automated test suite. Three checkpoints defined in `tasks.md` (US1, US2, US3).

**Target Platform**: Web (Chrome/Firefox/Safari), Netlify free tier, Vue 3 / Vuetify 3 CSR app.

**Project Type**: Web application — scoped frontend feature.

**Performance Goals**: No new targets. Snapshot already loaded on mount; this feature adds zero additional reads.

**Constraints**: No new dependencies; no data model changes; diffs confined to the sidebar region of `Home.vue`, `News.vue`, `YoutubeGuides.vue`, and the optional new `TopContributors.vue`.

**Scale/Scope**: ~4 k build orders, ~4 M Firestore reads/month. Home snapshot currently provides 8 contributors.

## Constitution Check

| Principle | Gate | Status |
|---|---|---|
| I. Simplicity First | No new abstractions unless duplication ≥ 2×; new dependencies require justification. | **PASS** — `TopContributors.vue` extraction removes the duplicated xs/sm/md breakpoint blocks in `Home.vue`. Zero new dependencies. |
| II. Incremental Quality | Every commit leaves code cleaner. | **PASS** — removes dead code (Season 11 banner, beta alert, store-button cluster, stale inline iframe in `News.vue`); collapses multi-breakpoint contributor duplication. |
| III. Consistent UX & Component Reuse | Vuetify primitives first; patterns appearing >1× extracted; spacing/colour consistent. | **PASS** — all three sidebar cards standardised to `v-card border rounded="lg"`; contributor rows reuse existing `v-avatar`/`v-chip`; link row reuses existing `v-btn variant="text"`. |
| IV. Cost-Conscious Infrastructure | No paid Firebase features; reads/writes minimised. | **PASS** — presentation only; zero additional Firestore reads or writes. |
| V. Secure Defaults | Auth state unchanged; no new routes or data exposure. | **PASS** — no auth, routing, or data changes. |

No violations. No Complexity Tracking entry required.

## Project Structure

### Documentation (this feature)

```
specs/004-home-sidebar/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions & rationale
├── data-model.md        # Phase 1 — contributor data shape
├── quickstart.md        # Phase 1 — dev/test guide
├── contracts/
│   └── TopContributors-contract.md   # Phase 1 — component interface
└── tasks.md             # Pre-existing; updated post-clarification
```

### Source Code (repository root)

```
src/
├── components/
│   ├── notifications/
│   │   ├── News.vue              MODIFY — strip to Season card; remove v-alert wrapper
│   │   └── YoutubeGuides.vue     MODIFY — add border prop for card-style consistency
│   └── home/                     NEW dir
│       └── TopContributors.vue   NEW — extracted ranked card
└── views/
    └── Home.vue                  MODIFY — sidebar col only: swap per-contributor cards
                                           for <TopContributors>, update spacing
```

**Structure Decision**: Single-project Vue SPA. Three existing files modified; one new component.

## Spacing System

Derived from design screenshots (`assets/sidebar-dark.png`, `assets/sidebar-light.png`) and
applied uniformly across all three sidebar cards.

| Element | Vuetify / CSS | Notes |
|---|---|---|
| Card wrapper | `v-card border rounded="lg" class="mb-4"` | Season, Top Contributors, Video Guides |
| Card inner padding | `class="pa-4"` on `v-card-text` | All card interiors |
| Card section header | `v-card-title class="pb-1"` with icon + label | Inside card for Contributors & Video Guides |
| Season tag | `text-caption font-weight-bold` + `color="accent"` | "Season 13 · Live" |
| Season title | `text-h6 font-weight-bold` | "Yue Fei's Legacy" |
| Season blurb | `text-body-2` muted `text-medium-emphasis` | One-liner |
| Actions row | `d-flex ga-4 mt-3` | Donate / Discord / Contribute |
| Contributor row | `v-row no-gutters align="center" class="py-2"` | Divider between rows optional |
| Contributor rank | `text-caption font-weight-bold` `min-width:20px text-right` | 1–N numeral |
| Contributor avatar | `v-avatar size="36" color="accent" class="mx-3"` | Image or 2-letter initials |
| Contributor name | `text-body-2 flex-grow-1` + `color: primary` + `text-truncate` | In a flex col |
| Contributor counts | `v-chip size="x-small" label class="mr-1"` | `mdi-eye` and `mdi-hammer` |

**Theme tokens** (source: `src/main.js`):
- Dark primary / accent: `#e7c05e` (gold)
- Light primary: `#294790` (navy)
- Light accent: `#CCAA55`
- Dark surface: `#324156` | Dark background: `#1D2432`
- Light surface: `#FAFAFA` | Light background: `#D8DCE0`

## Scope Boundary Notes

- **Welcome card** (`Welcome, Villager! / Welcome, {displayName}!`) appears above `<News>` in the
  current sidebar and **MUST be removed**. The new design starts directly with the Season card.
  Remove the entire `v-card flat` block (lines ~587–598 of `Home.vue`) as part of this feature.
- **Mobile sidebar** (`hidden-md-and-up` col, `Home.vue` lines ~578–583) also contains a
  `<YoutubeGuides>` instance. This feature does not explicitly touch mobile layout; however,
  extracting `TopContributors.vue` will naturally clean up the mobile contributor section too
  if it is imported there.
- **Cloud Function cap**: The home snapshot currently returns exactly 4 contributors (cap in the
  Cloud Function, not in UI code — confirmed: no `.slice()` in `Home.vue` or computed). This
  feature makes the UI ready for any count; increasing the snapshot to 8+ is a separate Cloud
  Function change, tracked as `[P]` optional in `tasks.md`.
