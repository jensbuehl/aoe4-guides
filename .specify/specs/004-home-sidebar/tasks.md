---
description: "Task list for Home Sidebar Rework"
---

# Tasks: Home Sidebar Rework

**Input**: `specs/004-home-sidebar/` (spec.md, plan.md, research.md, data-model.md, contracts/)
**Prerequisites**: plan.md (spacing system, scope boundaries), spec.md (user stories), contracts/TopContributors-contract.md
**Tests**: No automated suite — each phase ends with a manual golden-path checkpoint.

## Format: `[ID] [P?] [Story] Description` — Conventional Commit prefix suggested

- **[P]**: Can be done independently of other in-progress tasks (different files, no unresolved deps)
- **[Story]**: Maps to user story in spec.md (US1/US2/US3)

---

## Phase 1: Setup

**Purpose**: Prepare the new component directory before story work begins.

- [x] T001 Create `src/components/home/` directory by adding a `.gitkeep` or immediately scaffolding `TopContributors.vue` stub (`chore:`)

---

## Phase 2: User Story 1 — Focused Season/News card (P1) 🎯 MVP

**Goal**: Slim `News.vue` to season tag + title + one-line blurb + quiet Donate/Discord/Contribute links; remove the Welcome card from the sidebar entirely.

**Independent Test**: Load Home → sidebar starts directly with the Season card (no Welcome card); Season card shows tag + title + blurb + actions row; store buttons / iframe / beta alert / banner / appeal paragraphs all absent; all three links reach their existing destinations.

- [x] T002 [US1] In `src/views/Home.vue`, remove the entire Welcome card block — the `v-card flat rounded="lg" class="mb-2"` containing "Welcome, Villager! / Welcome, {displayName}!" and the build-count sentence (lines ~587–598). (`refactor:`)
- [x] T003 [P] [US1] In `src/components/notifications/News.vue`, remove: the outer `v-alert` wrapper, the `<v-img>` season banner, the Steam/MS/Xbox `v-btn` cluster, the embedded `<iframe>` YouTube video, the `v-alert` beta warning, and both appeal `<p>` paragraphs. (`refactor:`)
- [x] T004 [US1] In `src/components/notifications/News.vue`, restyle the card to `v-card border rounded="lg" class="mb-4"`; inside add: season status tag (`text-caption font-weight-bold color="accent"` → "Season 13 · Live"), title `v-card-title` ("Yue Fei's Legacy"), one-line blurb `v-card-text text-body-2` ("The new Jin Dynasty civilization is fully supported — start sharing your guides."). (`feat:`)
- [x] T005 [US1] In `src/components/notifications/News.vue`, arrange the existing Donate / Discord / Contribute `v-btn variant="text" size="small"` links as a `d-flex ga-4` row inside the card; confirm Donate keeps `mdi-heart color="red"` and all three links reach existing destinations (Ko-fi, Discord invite, `/github`). (`refactor:`)

**Checkpoint**: News card is calm and on-brand; Welcome card is gone; links verified working. Manual validation per quickstart.md Checkpoint 1.

---

## Phase 3: User Story 2 — Uncapped Top Contributors ranked card (P1)

**Goal**: Replace the scattered per-contributor `v-card` rows in `Home.vue` with a single `TopContributors.vue` ranked card that renders all provided contributors with no UI-side cap.

**Independent Test**: All N contributors from `topContributorsList` render as ranked rows inside one bordered card; clicking a row opens that contributor's builds; zero-state hides the card gracefully.

- [x] T006 [P] [US2] Create `src/components/home/TopContributors.vue` with `contributors` prop (Array), card wrapper `v-card border rounded="lg" class="mb-4"`, and `v-card-title` header containing `mdi-account-star` icon + "Top Contributors" label. Guard entire card with `v-if="contributors && contributors.length"`. (`feat:`)
- [x] T007 [US2] In `TopContributors.vue`, implement ranked rows: `v-for="(contributor, index) in contributors"` — row contains rank numeral (`index + 1`, `text-caption font-weight-bold`, min-width 20px), `v-avatar size="36" color="accent"` (`:image="contributor.icon"` if truthy, else `contributor.displayName.slice(0,2).toUpperCase()` as text), contributor name (`text-body-2 flex-grow-1 text-truncate` + `:style="{ color: $vuetify.theme.current.colors.primary }"`), `v-chip size="x-small" label` with `mdi-eye`/`mdi-hammer` for `viewCount`/`boCount`. Wrap in `v-skeleton-loader` while `contributor.loading`. (`feat:`)
- [x] T008 [US2] In `TopContributors.vue`, make each row navigable: wrap with `<router-link :to="{ name: 'Builds', query: { author: contributor.authorId } }" style="text-decoration:none">` or use `v-card` with `:to` prop; add hover surface tint (`v-hover` or `class="cursor-pointer"`). (`feat:`)
- [x] T009 [US2] In `src/views/Home.vue`, replace the entire inline Top Contributors section — the `v-row` header block and the per-contributor `v-col/v-tooltip/v-card` loop (lines ~602–699) — with `<TopContributors :contributors="topContributorsList" />`; add import and register in `components`. Verify the mobile contributors section (around lines ~258 and ~345) is also replaced or confirmed not to duplicate. (`refactor:`)

**Checkpoint**: Contributors render from data as one ranked card; all rows navigate; 8-row layout intact. Manual validation per quickstart.md Checkpoint 2.

---

## Phase 4: User Story 3 — Video Guides card + conditional prompts (P3)

**Goal**: Match `YoutubeGuides.vue` to the new card visual language; confirm `RegisterAd` and `EmailVerificationAd` still render under existing conditions.

**Independent Test**: Video Guides card has a consistent subtle border; `RegisterAd` shown logged-out; `EmailVerificationAd` shown for unverified users; verified user sees neither.

- [x] T010 [US3] In `src/components/notifications/YoutubeGuides.vue`: change `v-card flat rounded="lg"` to `v-card border rounded="lg"`; move the external `v-row` title (the `mdi-youtube` icon + "Youtube Guides" `text-h6`) inside the card as a `v-card-title`, removing the standalone `v-row` header above the card. (`refactor:`)
- [x] T011 [P] [US3] In `src/views/Home.vue`, confirm `<RegisterAd v-if="!user && authIsReady">` and `<EmailVerificationAd v-if="user && authIsReady && !user.emailVerified">` remain in the desktop sidebar col unchanged. No code change expected — this is a verification task. (`chore:`)

**Checkpoint**: Video Guides card style consistent; auth prompts unaffected. Manual validation per quickstart.md Checkpoints 3 & 4.

---

## Phase 5: Polish & Cross-Cutting

**Purpose**: Uniform spacing, theme correctness, mobile, and final scope guard.

- [x] T012 [P] Apply spacing system from `plan.md` uniformly across all three sidebar cards: `mb-4` inter-card gutter, `pa-4` inner padding, consistent `v-card-title` header format (icon + label, `pb-1`). Touch `src/components/notifications/News.vue`, `src/components/home/TopContributors.vue`, `src/components/notifications/YoutubeGuides.vue`. (`style:`)
- [x] T013 [P] Verify light + dark themes: toggle theme in-app and confirm contributor names use `color.primary` (gold `#e7c05e` dark / navy `#294790` light), Season tag uses `color="accent"`, Donate heart stays `color="red"`, support links are low-emphasis at rest → primary on hover. (`style:`)
- [x] T014 Verify mobile layout: sidebar stacks below main column on xs/sm; all three cards are full-width and legible; 8-row contributors list is not clipped; no `position:sticky` is applied. (`style:`)
- [x] T015 Self-review scope guard: run `git diff --name-only` and confirm diffs are confined to `src/views/Home.vue` (sidebar col), `src/components/notifications/News.vue`, `src/components/notifications/YoutubeGuides.vue`, `src/components/home/TopContributors.vue`. Run full golden-path per `specs/004-home-sidebar/quickstart.md`. (`chore:`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (US1)**: Depends on Phase 1. T002 and T003 can run in parallel (different files/blocks).
- **Phase 3 (US2)**: Independent of Phase 2 — different files (`TopContributors.vue` + Home.vue contributor section). Can start alongside Phase 2.
- **Phase 4 (US3)**: Independent of Phase 2 and 3 — `YoutubeGuides.vue` is a separate file. T011 is a verification only.
- **Phase 5 (Polish)**: Depends on Phases 2–4 complete. T012 and T013 can run in parallel.

### Within User Story 2

T006 (create component) → T007 (implement rows) → T008 (add navigation) → T009 (wire into Home.vue)

### Parallel Opportunities

```
# US1 and US2 can start at the same time (different files):
Task: T003 strip News.vue                   → src/components/notifications/News.vue
Task: T006 create TopContributors.vue       → src/components/home/TopContributors.vue

# US3 fully independent:
Task: T010 update YoutubeGuides.vue         → src/components/notifications/YoutubeGuides.vue
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. T001 Setup
2. T002–T005 Season card + Welcome card removal
3. Validate Checkpoint 1 → independently shippable

### Full Feature (sequential, solo developer)

1. Phase 1: Setup (T001)
2. Phase 2: US1 (T002–T005) — MVP shippable here
3. Phase 3: US2 (T006–T009) — contributors card
4. Phase 4: US3 (T010–T011) — video guides + prompts
5. Phase 5: Polish (T012–T015) — spacing, themes, mobile, scope guard

### Suggested commits

```
refactor: remove Welcome card and strip News.vue dead content     (T002–T003)
feat: redesigned Season card with quiet actions row               (T004–T005)
feat: extract TopContributors ranked card component               (T006–T008)
refactor: wire TopContributors into Home.vue sidebar              (T009)
refactor: unify YoutubeGuides card style                          (T010–T011)
style: apply sidebar spacing system and verify themes             (T012–T015)
```
