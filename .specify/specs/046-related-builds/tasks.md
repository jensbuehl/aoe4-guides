# Tasks: Somewhere to Go From a Build Page (046)

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/related-builds.md](contracts/related-builds.md), [quickstart.md](quickstart.md)

**Tests**: The spec requests no automated tests. Verification uses the repo's checks and the quickstart, as the constitution allows ("manual testing of the golden path").

**Analysis**: /speckit-analyze ran on 2026-11-24 and found 1 CRITICAL, 1 HIGH, 2 MEDIUM and 5 LOW. All are fixed in the documents. C1 (constitution III, copied header and button) is why Phase 2 exists.

## Phase 1: Setup

- [x] T001 Create branch `046-related-builds` off `main` **only when the shared tree is free** (no other session's uncommitted work in `git status`). Otherwise use a scratch worktree, which needs `.env` and a junctioned `node_modules`. Then point `.specify/feature.json` at `.specify/specs/046-related-builds` and update the plan pointer in `CLAUDE.md` to `.specify/specs/046-related-builds/plan.md`.
  - *Done 2026-11-24*: worktree `../aoe4-guides-046` on branch `046-related-builds` off `origin/main` (1.23.0), upstream unset so nothing can push to `main` by accident. The spec folders 046 and 047 were moved in.

## Phase 2: Foundational — extract shared pieces (refactor commit, no visual change)

- [x] T002 [P] Create `src/components/common/SectionHeader.vue` (contract: Shared components):
  - Props `icon` and `label`.
  - Markup: `<div class="build-card-section-header d-flex align-center px-4 ga-2"><v-icon size="16" color="accent" :icon="icon" /><span class="section-header-label text-caption text-uppercase font-weight-bold text-truncate">{{ label }}</span><slot /></div>`. Use the `:icon` prop form; the existing headers pass the icon as text content, so check the rendered size matches.
  - Scoped style: `.build-card-section-header { letter-spacing: 0.05em; height: 36px; }` and `.section-header-label { min-width: 0; }`.
- [x] T003 [P] Create `src/components/common/ViewAllButton.vue`:
  - Props `to` (String|Object) and `label` (default `"View all"`).
  - Body: `BuildLaneTabs`' wrapper `div.d-flex.justify-center.mt-1` and its `v-btn` verbatim (`variant="text" color="primary" :block="smAndDown" rounded="lg" height="38" append-icon="mdi-chevron-right"`), with the label in `<span class="text-truncate" style="min-width: 0">`.
  - `smAndDown` comes from `useDisplay()`.
- [x] T004 Migrate the headers to `SectionHeader`:
  - `src/components/builds/AgeTimeline.vue`
  - `src/components/builds/BuildOrderEditor.vue`, with its trailing controls (`v-spacer` and buttons) in the slot
  - `src/components/Discussion.vue`
  - `src/views/builds/BuildDetails.vue`: the desktop Description header and the Video header
  - `src/views/builds/BuildEditor.vue`: both headers
  - *Done*: the mobile Description row was migrated too. Its click and class fall through to the root, and the chevron sits in the slot with `ml-auto`. That works because `SectionHeader` sets `display: flex` in its own rule instead of a `d-flex` class, so a caller's `d-none d-md-flex` / `d-md-none` still wins. **One deliberate visual change**: the Timeline icon was `size="small"` (1.25em, 18.75px rendered), while the other six headers were 16px. It is now 16px like the rest.

  Delete each file's now-unused scoped `.build-card-section-header` rule, but keep any other rule in those `<style>` blocks (e.g. AgeTimeline's `.age-details-toggle`). Leave the **mobile Description** row in `BuildDetails` as is unless its click target and chevron survive the slot (plan Design Notes), and note the decision in the commit message.
- [x] T005 Migrate `src/components/home/BuildLaneTabs.vue`'s exit to `<ViewAllButton :to="viewAllRoute(lane.value)" />`. Keep the explanatory comment above it, moved into `ViewAllButton.vue` where the rule now lives.
- [x] T006 Verify the refactor: `npm run build`, `npm run check:setup`, and the ux-gate rig comparing Home's lanes, a build page (Description, Timeline, Build Order, Video, Comments) and the editor against production at 393 and 1280, light and dark. Expect pixel-identical results (quickstart §5, last bullet). Commit it on its own as `refactor:`.
  - *Done*: measured against production at 393/1280, light/dark. Description (both), Build Order, Video and Comments headers, and Home's View all, are identical in height, icon size and offset, label offset, font, letter-spacing, padding and colour. The only difference is the Timeline icon (T004). **Not verified**: the editor's two headers, which need a signed-in session. Committed separately as `refactor(ui)` ahead of the feature.

**Checkpoint**: no visual change, two shared components, and the header rule defined once.

## Phase 3: Foundational — the rails' shell

- [x] T007 Create `src/components/builds/RelatedBuilds.vue` with:
  - prop `build`
  - a root `<div ref="railsEl">`
  - `const RAIL_SIZE = 3`
  - `const near = useElementVisibility(railsEl, { rootMargin: "600px", once: true })` from `@vueuse/core` (research R5)
  - a `watch(near, …)` that calls a single `load()` once

  Nothing is fetched before `near` turns true (FR-008, C1).
- [x] T008 Mount it in `src/views/builds/BuildDetails.vue`: `<RelatedBuilds v-if="build.id && !build.loading" :build="build" class="mt-4" />` directly after the video `v-card` and before the `<div class="mt-4"><Discussion …/></div>` block (FR-006, FR-013). Import and register it.
  - *Changed in implementation*: mounted as `<RelatedBuilds v-if="!loading" :build="build" :build-id="id" />`. `build` starts as `null`, the page's own `loading` flag clears after it is assigned, and a cached build may lack `id`, so the id comes from the route (contract: Props).

## Phase 4: User Story 1 — Another build for the same civ (P1) 🎯 MVP

**Goal**: "More ‹Civ› builds" with up to 3 cards and View all.
**Independent test**: quickstart §3, rows 1, 3 and 4.

- [x] T009 [US1] In `RelatedBuilds.vue`, resolve the civ from `civs` in `@/composables/filter/civDefaultProvider` by `shortName === build.civ`. If none is found, the rail is ineligible (C7). Compute:
  - title: `More ${civ.title} builds`, or `More builds for any civilization` when `civ.slug` is absent (`ANY`) (C9)
  - `viewAllRoute`: `/civ/${civ.slug}`, or `{ path: "/builds", query: { civ: "ANY", orderBy: "score" } }` (C11)
  - *Changed in implementation*: the civ comes from `getCivById`, and View all is `civPageRoute(code)`, the existing helper every civ link uses. For `ANY` that is the dashboard filtered to it, not a hand-built `/builds?civ=ANY`.
- [x] T010 [US1] In `load()`, call `getCivBuilds({ ...getDefaultConfig(), civs: build.civ, orderBy: "score" }, RAIL_SIZE + 1)` (`@/composables/data/buildService`, `@/composables/filter/configDefaultProvider`; research R6). Keep `result.filter(b => b.id !== build.id).slice(0, RAIL_SIZE)` (C3). The slice also trims an API-fallback answer.
- [x] T011 [US1] Render the civ rail:
  - `<SectionHeader icon="mdi-flag-outline" :label="title" />`
  - the cards, as `router-link` → `BuildListCard context="default"`, exactly as in `BuildLaneTabs`
  - `<ViewAllButton :to="viewAllRoute" :label="viewAllLabel" />`, where `viewAllLabel` is `View all ${civ.title} builds`, or `View all` for `ANY`

  (FR-005, FR-007, FR-014, FR-015)

**Checkpoint**: US1 independently testable.

## Phase 5: User Story 3 — The page stays fast and still (P1)

**Goal**: no reads until near, nothing above shifts, silent failure.
**Independent test**: quickstart §2 (first bullet), §4 and §5.

- [x] T012 [US3] Give each rail a `state` of `idle | loading | ready | hidden` (data-model). On `near`, set eligible rails to `loading`, then render the header and `Array(RAIL_SIZE).fill({ loading: true })` through `BuildListCard`, with no `router-link` and no View all (FR-009).
  - *Changed in implementation*: View all is shown **from the first skeleton**. The first ux-gate run measured the civ rail growing 46px when the exit appeared on arrival, which pushed the author rail and Comments down. With it shown while loading: zero shift at 360/393/960/1280 in both themes.
- [x] T013 [US3] Set `hidden` when the result is `undefined` (failed read) or empty after filtering. Show no message. Wrap `load()` in `try/catch` so a throw cannot reach `BuildDetails` (FR-010, C5, C6). A shorter result simply renders fewer cards, which is allowed below the rail (US3-AS4).
- [x] T014 [US3] With App Check blocked in DevTools, the civ rail fills through the public API, and an `ANY` build's civ rail hides (quickstart §4).

  - *Verified on production (1.24.0), 2026-11-24*: with App Check refused (headless Android UA: `permission-denied`) and with `firestore.googleapis.com` blocked outright (`unavailable`), the page and the civ rail both fell back to the public API (`/builds?civ=ENG&orderBy=score`). The civ rail showed 3 cards and the author rail was removed without a message. An `ANY` build's fallback was not exercised (`apiCanServe` refuses `ANY` by design).
## Phase 6: User Story 2 — More from the same author (P2)

**Goal**: "More by ‹author›", deduplicated against the civ rail.
**Independent test**: quickstart §3, rows 1, 2 and 5.

- [x] T015 [US2] Eligibility: `build.authorUid` set and `build.author?.trim()` non-empty (C8). Title `More by ${build.author}`. `viewAllRoute = { path: "/builds", query: { author: build.authorUid, orderBy: "score" } }` (research R1, C12). View all label `View all by ${build.author}`.
- [x] T016 [US2] In `load()`, run `getBuilds({ ...getDefaultConfig(), author: build.authorUid, orderBy: "score" }, 2 * RAIL_SIZE + 1)` **in parallel** with the civ query (`Promise.all`). After both settle, drop `build.id` and every id the civ rail kept (if the civ query failed, only `build.id`), then `slice(0, RAIL_SIZE)` (FR-004, C4, research R4).
- [x] T017 [US2] Render the author rail after the civ rail with `SectionHeader icon="mdi-account-outline"`, cards with `context="author-locked"` (research R8), and `ViewAllButton`. Truncation comes from the shared components (FR-015).

**Checkpoint**: all stories functional.

## Phase 7: Polish & verification

- [x] T018 Run `npm run build` and `npm run check:setup`. Run the icon allowlist `comm` check from `CLAUDE.md`; expect only `mdi-svg` and `mdi-xxx` (quickstart §1).
- [x] T019 Quickstart §2:
  - no list query at the top of a long build
  - no index error at the end
  - the queries return at most 4 and 7 documents (SC-004)
  - no single-document read after clicking a rail card
  - *Verified on production*: at 393×600 no rail renders at the top of a 3,400px build, and both start once scrolled near. No index error. The 4/7 document ceiling is enforced by the two `limit()`s in `load()`; responses were not counted on the wire. **Not measured**: the absence of a single-document read after clicking a rail card. The cache path is the code's, not observed.
- [x] T020 Quickstart §3: the full selection table against production builds.
  - *Verified on production*:
    - English build by a 38-build author: both rails full, no duplicates, current build absent, View all `/civ/english`. The author rail's 3 builds are exactly the author View all list's first 3, in order.
    - `ANY` build: "More builds for any civilization", View all → `/dashboard?civ=ANY`. The author's 23-character name truncates in View all at 360, with no overflow.
    - Single-build author: civ rail only.
    - Skeleton → loaded: identical tops and heights at 393 and 1280.
    - Unlisted builds: not checked separately; excluded by the `isDraft == false` default (research R3).
- [x] T021 `ux-gate` skill at 360/393 (Android UA) and 960/1280, light and dark (SC-003, quickstart §5):
  - a full rail causes zero shift, and nothing above a short rail moves
  - a long author name truncates in the header and in View all
  - View all is full width vs natural width as specified
- [x] T022 After the push, harvest per `CLAUDE.md`. Candidate for that file: "the section header is `SectionHeader`; never paste `.build-card-section-header`, because the rule is scoped and a paste renders unstyled". Then return `.specify/feature.json` and `CLAUDE.md`'s plan pointer to whichever feature is active.

  - *Done*: the worktree memory gained the dev-`.env`, `npx` preview and sibling-worktree-merge notes. No `CLAUDE.md` rule was added: the scoped-header trap is gone with the pasted copies, and `SectionHeader`'s own comment says why it exists. `feature.json` and the plan pointer stay on 046 until the next feature takes them.
## Dependencies

- T001 → Phase 2 (T002 ∥ T003 → T004, T005 → T006) → T007 → T008 → US1 (T009–T011) → US3 (T012–T014) → US2 (T015–T017) → polish (T018–T022).
- The refactor ships in its own commit before any feature code, so a visual regression can be attributed.
- US3 comes before US2 because its states and skeletons are the shell the author rail renders into. US2 depends on US1's result for deduplication.

## Parallel opportunities

- **T002 ∥ T003**: separate new files.
- Within T004, each file's migration is independent. They are listed as one task because they share one verification (T006).
- T018 and the preparation for T020 (finding suitable builds on prod) can run side by side.
- Phases 3–6 all edit `RelatedBuilds.vue`, so they run in order.

## Implementation strategy

- **Refactor first** = Phase 2. It ships alone and changes nothing visible.
- **MVP** = Phases 3–5: civ rail, lazy loading, skeletons, silent failure.
- **Increment** = Phase 6: author rail.
- Spec 047 (retire Comments) follows separately. Its app step deletes `Discussion.vue`, which by then uses `SectionHeader`; no extra work.
