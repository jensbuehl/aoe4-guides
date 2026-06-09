---
description: "Task list for Build Editor Unification & Shared Build Header"
---

# Tasks: Build Editor Unification & Shared Build Header

**Input**: Design documents from `specs/010-build-editor-unification/`

**Prerequisites**: `spec.md`, `plan.md`, `css-reference.md`, `contracts/`, `BuildEdit Design.html` (mock)

**Tests**: No automated suite (Constitution Development Workflow). Manual golden-path checkpoints after each phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no incomplete dependency)
- **[Story]**: US1–US5 maps to user stories in spec.md
- Conventional Commit prefix suggested per task

## Path Conventions

Single-project Vue SPA — all paths under `src/`.

---

## Phase 1: Setup

**Purpose**: Scaffold the new files and a safe parallel route so existing routes stay live throughout the migration.

- [x] T001 Create `src/components/builds/BuildHeader.vue` as an empty SFC shell (`<template>/<script setup>/<style scoped>`). (`chore: scaffold BuildHeader.vue`)
- [x] T002 [P] Create `src/views/builds/BuildEditor.vue` as an empty SFC shell. (`chore: scaffold BuildEditor.vue`)
- [x] T003 [P] In `src/router/index.js` add temporary `BuildEditorNew` (`/_editor/new`) and `BuildEditorEdit` (`/_editor/edit/:id`) routes pointing at `BuildEditor.vue`, leaving the existing `BuildNew` / `BuildEdit` entries active for now. (`chore: add temp BuildEditor routes for parallel testing`)

**Checkpoint**: `npm run dev` boots; all existing routes respond; no console errors.

---

## Phase 2: Foundational — Shared BuildHeader (Blocking)

**Purpose**: Build the one hero component that all three consumers depend on. Nothing in US1–US5 can be wired until this phase is visually verified in isolation.

**⚠️ CRITICAL**: No consumer wiring until BuildHeader is proven in isolation.

- [x] T004 [US1] Build `BuildHeader.vue` template per `contracts/BuildHeader-contract.md`: `v-card flat rounded="lg"`, one responsive `v-row no-gutters` (NO `hidden-sm-and-down`/`hidden-md-and-up` twins). Flag column: `v-img cover` with `flagLarge`/`flagSmall` from `civDefaultProvider` + `:gradient` fade; `any-large.webp`/`any-small.webp` fallback. Title: `v-card-title`. Chip group (`v-chip size="small" label v-if`): Draft, NEW, civ, season, strategy, map, author, views, comments, upvotes, dates — one chip per field, conditional on value. (`feat: BuildHeader hero template`)
- [x] T005 [US1] Add `build` (Object, required) and `readonly` (Boolean, default `false`) props; `linkChips` prop (default `=readonly`). Expose `#actions` slot pinned top-right (`v-col cols="auto"` in the row). Import `getCivById`/`civs` from `civDefaultProvider` and `timeSince`/`isNew` from `useTimeSince`. All chips and flag derive reactively from `build`. (`feat: BuildHeader props, slot, composables`)
- [x] T006 [P] [US1] Add scoped styles for the flag column (`min-height: 132px`) using theme tokens only (no hex). Verify gradient reads on `surface` in light + dark mode. See `css-reference.md §3`. (`style: BuildHeader theming`)

**Checkpoint**: Mount `BuildHeader` on the temp `_new` route with a hard-coded sample build → hero renders responsively in both themes; slot content appears top-right; no `hidden-*` markup; resizing shows no duplicated blocks.

---

## Phase 3: US1 + US4 — Editor Logic & Form Body (Priority: P1) 🎯 MVP

**Goal**: A single `BuildEditor.vue` that handles both create and edit mode end-to-end, with the two-card metadata layout and `BuildOrderEditor` wired up.

**Independent Test**: Open `/builds/_new` → empty form, "New" hero badge, no overflow. Open `/builds/_edit/:id` → fields pre-filled, loading skeleton shown then replaced, dirty tracking active. Save in create calls `addBuild`; save in edit calls `updateBuild`.

- [x] T007 [US1] Copy all `<script>` imports from `BuildEdit.vue` into `BuildEditor.vue`; add `addBuild`, `getUserDraftsCount`, `getContributor`, `addContributor`, `incrementBuilds` from `BuildNew.vue`; add `sanitize-html`. (`chore: consolidate imports into BuildEditor`)
- [x] T008 [US1] Declare `mode` (`'new'|'edit'`) and `id` props. Declare all refs/computed: `build`, `originalBuild`, `isLoaded`, `isDirty`, `error`, `user`, `civs`, `seasons`, `maps`, `strategies`, `clipboardIsSupported`, `ytState` (`'empty'|'valid'|'invalid'`), `ytVideoId`. (`feat: BuildEditor state declarations`)
- [x] T009 [US1] Implement `onMounted`: in edit mode show a `v-skeleton-loader` until the build resolves (check `store.state.cache.builds[id]` first, else `getBuild(id)`); if the result is null or the ownership check fails call `router.replace({ name: 'NotFound' })`; in create mode use `store.state.template` (then clear it) or the default empty build object from `BuildNew.vue`. After both branches snapshot `originalBuild = JSON.parse(JSON.stringify(build))` and set `isLoaded = true`. (`feat: BuildEditor mode-aware onMounted with skeleton + 404 guard`)
- [x] T010 [US1] Add `onBeforeRouteLeave` guard: when `isDirty` prompt `window.confirm('You have unsaved changes — leave anyway?')`; returning `false` cancels navigation, `true` allows it. (`feat: BuildEditor dirty-leave guard`)
- [x] T011 [US1] Implement unified `handleSave`: create path → `validateBuild` + `sanitizeSteps` + creator lookup + `addBuild` + contributor add/increment + snackbar + `setBuild`/`setAllBuildsList(null)`/`setMyBuildsList(null)`/`setMyFavoritesList(null)` + `router.push({ name: 'BuildDetails', params: { id } })`; edit path → same validate/sanitize/creator + `updateBuild` + same cache resets + snackbar + nav. On success `isDirty = false` and refresh `originalBuild` snapshot. (`feat: unified handleSave`)
- [x] T012 [US1] Implement `handleDraft`: create path — `getUserDraftsCount` max-10 guard → `isDraft = true` → call `handleSave`; edit path — `isDraft = true` → call `handleSave`. Port `sanitizeSteps` and `handleStepsChanged` verbatim from `BuildEdit.vue`. (`feat: handleDraft + step handlers`)
- [x] T013 [US1] Port `handleDuplicate`, `handleCopyOverlayFormat`, `handleDownloadOverlayFormat` verbatim from `BuildEdit.vue` (edit mode only). (`feat: edit-mode action handlers`)
- [x] T014 [US1] Add `<BuildHeader :build="build">` at the top of the `BuildEditor` template; in create mode leave `#actions` empty; in edit mode wire the overflow (Phase 6). Since `BuildHeader` derives everything from `build`, live hero updates come for free as fields change. Guard the whole form with `v-if="isLoaded"` and add a `v-skeleton-loader` for the loading state. (`feat: mount BuildHeader in editor`)
- [x] T015 [US4] Build the **"Build details"** card: `v-card flat rounded="lg" class="mt-4"` with Title (`v-text-field v-model="build.title"`), Description (`v-textarea auto-grow rows="1" v-model="build.description"`), Video (`v-text-field v-model="build.video" @input="handleVideoInput"`). Same `prepend-icon` and label props as today. (`feat: Build Details card`)
- [x] T016 [US4] Build the **"Classification"** card: `v-card flat rounded="lg" class="mt-4"` with `v-row` of four `v-col cols="12" sm="6" md="3"` selects — Civilization, Season, Map, Strategy — same `v-model`, `:items`, `item-title`, `item-value`, `prepend-icon` as in `BuildEdit.vue`. (`feat: Classification 4-col card`)
- [x] T017 [P] [US4] Place `<BuildOrderEditor :steps="build.steps" :civ="build.civ" @stepsChanged="handleStepsChanged">` below the cards, guarded by `v-if="build"`. (`feat: wire BuildOrderEditor in editor`)

**Checkpoint**: Both `/builds/_new` and `/builds/_edit/:id` render with skeleton → form; fields pre-fill in edit; hero title + civ chip update live as you type; `BuildOrderEditor` works; saving calls correct service.

---

## Phase 4: US2 — Sticky Footer (Priority: P1)

**Goal**: A persistent footer that keeps save reachable without scrolling and shows unsaved state.

**Independent Test**: Scroll a long build → footer stays visible. Edit any field → "Unsaved changes" appears. Discard → form reverts to last-loaded state, indicator hides. "Save as draft" → `isDraft = true` + save. "Publish build" → `isDraft = false` + save.

- [x] T018 [US2] Add `watch(build, () => { if (isLoaded.value) isDirty.value = true }, { deep: true })`. Implement `handleDiscard`: restore all fields from `originalBuild` snapshot via `Object.assign(build, JSON.parse(JSON.stringify(originalBuild)))` and set `isDirty = false`. (`feat: dirty tracking + handleDiscard`)
- [x] T019 [US2] Build the sticky footer template: `<div class="build-editor-footer">` → `<div class="build-editor-footer-inner">` containing: "Unsaved changes" span (`v-show="isDirty"`, `class="build-editor-status"`), Discard `v-btn variant="text"` → `handleDiscard`, Save as draft `v-btn variant="outlined" color="accent"` → `handleDraft`, Publish build `v-btn color="accent"` → `handleSave`. (`feat: sticky footer template`)
- [x] T020 [US2] Add scoped CSS per `css-reference.md §4`: `.build-editor-footer` (fixed, theme `surface` bg, top border, z-index 6), `.build-editor-footer-inner` (max-width 1280px, flex, right-aligned), `.build-editor-status` (error color, margin-right auto). Add `padding-bottom: 76px` to the root `v-container`. (`style: sticky footer CSS`)

**Checkpoint**: Footer visible at all scroll positions; buttons align with the page cards on wide screens; "Unsaved changes" toggles; Discard reverts correctly.

---

## Phase 5: US5 — Live YouTube Preview (Priority: P2)

**Goal**: Inline feedback within 400 ms of typing in the Video field.

**Independent Test**: Paste a valid YouTube URL → thumbnail card + "Valid YouTube link" badge within 400 ms. Paste a Twitch URL → error card. Clear → both hide. Existing embed rewrite + creator lookup still run.

- [x] T021 [US5] Update `handleVideoInput` to use a 400 ms debounce: if empty → `ytState = 'empty'`; after delay `extractVideoId(value)` — if id found → `ytVideoId = id`, `ytState = 'valid'`, run existing embed rewrite + `getVideoCreatorId`/`getVideoMetaData` creator lookup; else → `ytState = 'invalid'`. (`feat: debounced YouTube validation state`)
- [x] T022 [US5] Add preview/error cards below the Video field per `css-reference.md §5`: valid → `.yt-preview` div with `v-img` (`https://img.youtube.com/vi/${ytVideoId}/mqdefault.jpg`, `@error` hides img) + "Valid YouTube link" `v-chip color="success"`; invalid → `.yt-error` div (`role="alert"`) + "Invalid URL" `v-chip color="error"` + muted hint text. Both guarded with `v-if`. (`feat: YouTube preview + error cards`)

**Checkpoint**: All three `ytState` values render correctly; thumbnail loads for a real YouTube id; `onerror` fallback keeps layout intact.

---

## Phase 6: US3 — Editor Overflow Menu (Priority: P2)

**Goal**: A single `mdi-dots-vertical` overflow in the editor's `#actions` slot, present only in edit mode.

**Independent Test**: Create mode → no overflow button visible. Edit mode → overflow with exactly three items: Duplicate, Copy to overlay tool (hidden when clipboard API unsupported), Download. No Delete item.

- [x] T023 [US3] In `BuildEditor.vue` `#actions` slot, add `v-menu` (`v-if="mode === 'edit'"`) with `v-btn icon="mdi-dots-vertical" variant="text" color="accent"` activator and three `v-list-item`s: Duplicate (→ `handleDuplicate`), Copy to overlay tool (`v-if="clipboardIsSupported"` → `handleCopyOverlayFormat`), Download (→ `handleDownloadOverlayFormat`). No Delete — delete is view-route only. (`feat: editor overflow menu`)

**Checkpoint**: Create mode — no overflow. Edit mode — three-item overflow; Duplicate/Copy/Download behave identically to `BuildEdit.vue`.

---

## Phase 7: Route Migration & Retirement

**Purpose**: Switch the live routes to `BuildEditor` and remove the retired files.

- [x] T024 [US1] In `src/router/index.js`, repoint the live `BuildNew` route (`/builds/new`) → `BuildEditor` with `props: { mode: 'new' }` and `BuildEdit` route (`/builds/:id/edit`) → `BuildEditor` with `props: route => ({ mode: 'edit', id: route.params.id })`; remove the temp `_new`/`_edit` entries added in T003; preserve all `meta` flags (`requiresAuth`, email verification, ownership) unchanged. (`feat: switch live routes to BuildEditor`)
- [x] T025 [P] [US1] Delete `src/views/builds/BuildNew.vue`. (`chore: delete BuildNew.vue`)
- [x] T026 [P] [US1] Delete `src/views/builds/BuildEdit.vue`. (`chore: delete BuildEdit.vue`)

**Checkpoint**: `/builds/new` and `/builds/:id/edit` load `BuildEditor` with correct mode; no 404s; auth guards still redirect unauthenticated users; existing `router.push({ name: 'BuildNew' })` and `{ name: 'BuildEdit', params: { id } }` calls still resolve.

---

## Phase 8: US3 — View Route Consistency (Priority: P2)

**Goal**: Replace `BuildDetails.vue`'s twin hero blocks with `BuildHeader` and collapse all management actions into a single overflow (Edit pencil folds in).

**Independent Test**: View route hero visually matches editor hero. Single `mdi-dots-vertical` overflow contains Edit (first) + all existing management actions. No standalone Edit pencil button anywhere. Vote + Favorite remain beside the overflow. All non-header behaviour (discussion, video iframe, FocusMode, swipe, deleteDialog) unchanged.

- [x] T027 [US3] In `src/views/builds/BuildDetails.vue`, delete **both** `hidden-sm-and-down` / `hidden-md-and-up` hero blocks. Replace with one `<BuildHeader :build="build" readonly>`. Import `BuildHeader`. Civ/author chip links preserved via `linkChips` prop (defaults to `true` when `readonly`). (`refactor: BuildDetails hero → BuildHeader`)
- [x] T028 [US3] Inside the `#actions` slot: keep `<Vote>` and `<Favorite>` as-is. Add one `v-menu` with `mdi-dots-vertical` activator containing: Edit (`v-list-item :to="{ name: 'BuildEdit', params: { id } }"`, `v-show="user?.uid === build.authorUid"`), Publish (`v-show="user && build.isDraft"` → `handlePublish`), Duplicate (`v-show="user"` → `handleDuplicate`), Copy to overlay tool (`v-show="clipboardIsSupported"` → `handleCopyOverlayFormat`), Download (→ `handleDownloadOverlayFormat`), Open in RTS Overlay (→ `handleOpenInOverlayTool`), `v-divider`, Delete (`v-show="user?.uid === build.authorUid"`, danger → `deleteDialog = true`). **Delete the standalone `v-btn icon="mdi-pencil"`.** (`refactor: single overflow on view route; fold Edit in`)
- [x] T029 [US3] Smoke-test that all `BuildDetails` non-header behaviour is untouched: Vote counter increments, Favorite toggles, Description card renders, `BuildOrderEditor` in readonly/FocusMode, video iframe, Discussion section, swipe gesture, `deleteDialog`/`handleDelete` flow. (`chore: verify BuildDetails parity`)

**Checkpoint**: View route hero matches editor hero. One overflow holds Edit + all management actions. No standalone pencil. Vote/Favorite beside the menu. Everything below the header unchanged.

---

## Phase 9: Optional — Extract BuildActionMenu (Constitution III gate)

> **Extract only if** the inline `v-list` blocks in editor + view prove repetitive in practice. Do NOT extract pre-emptively (Constitution I).

- [ ] T030 [P] Create `src/components/builds/BuildActionMenu.vue` per `contracts/BuildActionMenu-contract.md`: accepts `items: [{ title, icon, onClick?, to?, show?, danger?, dividerBefore? }]`; renders one `v-menu` + `v-list`, filtering by `show !== false`, inserting `v-divider` where flagged, applying `color="error"` for `danger` items. (`feat: extract BuildActionMenu`)
- [ ] T031 Replace the inline menus in `BuildEditor.vue` (`#actions`) and `BuildDetails.vue` (`#actions`) with `<BuildActionMenu :items="…">`. (`refactor: consume BuildActionMenu in both views`)

---

## Phase 10: Polish & Cross-Cutting

- [ ] T032 [P] Light + dark theme pass across editor (both modes) and view route: hero gradient fades to `surface`, sticky footer bg, cards, chips (accent/error), overflow list items — verify all use `rgb(var(--v-theme-*))` with no hard-coded hex. (`style: full theme pass`)
- [ ] T033 [P] Mobile pass at 375 px: footer buttons ≥ 44 px tap target; 4-col Classification collapses to 2-col; chip row wraps cleanly; overflow menu doesn't clip off-screen; hero responsive with no duplicated markup. (`style: mobile pass`)
- [ ] T034 [P] **Create golden path**: logged-in user → `/builds/new` → fill fields + valid YouTube URL → thumbnail + badge appear → Publish → success snackbar + navigate to detail page → hero + fields match input. (`chore: create golden path`)
- [ ] T035 [P] **Edit golden path**: load existing build → change title → "Unsaved changes" appears → click overflow Duplicate → template staged + navigate to create → reload the same build → Discard → title reverts. Try navigating away while dirty → confirm dialog shown, cancel keeps page. (`chore: edit golden path`)
- [ ] T036 [P] **View golden path**: open a build you own → single overflow has Edit as first item + all actions → click Edit navigates to editor; Vote + Favorite work; Delete opens dialog + deletes. Open a build you don't own → Edit/Publish/Delete hidden in overflow; Duplicate/Copy/Download/Open still present. (`chore: view golden path`)
- [ ] T037 Self-review diff before merge: unused imports, hardcoded hex, missing `v-if="build"` guards, leftover `hidden-*` twins, `showDeleteConfirm` ref (must not exist in BuildEditor), duplicate `v-list-item` blocks eligible for BuildActionMenu. Run all three golden paths one final time. (`chore: pre-merge self-review`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)**: none — start immediately.
- **BuildHeader (2)**: depends on Phase 1. **Blocks all consumers.**
- **Editor logic + form (3)**: depends on Phase 1; parallel with Phase 2.
- **Sticky footer (4)**: depends on Phase 3 (`handleSave`/`handleDraft` must exist); parallel with Phases 5–6.
- **YouTube preview (5)**: depends on Phase 3 (Video field exists).
- **Editor overflow (6)**: depends on Phase 2 (slot) + Phase 3 (handlers).
- **Route migration (7)**: depends on Phases 3–6 all validated.
- **View refactor (8)**: depends on Phase 2 only — independent of the editor; can start once BuildHeader is proven.
- **BuildActionMenu (9)**: optional; depends on Phases 6 + 8 (both inline menus exist).
- **Polish (10)**: depends on Phases 7 + 8.

### User Story Dependencies

- **US1 (P1)**: Phases 1–3 + 7 — core; all other stories depend on or run alongside it.
- **US2 (P1)**: Phase 4 — depends on US1 editor logic (needs `handleSave`/`handleDraft`).
- **US3 (P2)**: Phases 6 + 8 — editor side (Phase 6) can start after Phase 2; view side (Phase 8) independent of US1.
- **US4 (P2)**: Embedded in Phase 3 (inseparable from the editor form body).
- **US5 (P2)**: Phase 5 — depends on the Video field being in place (T015).

### Parallel Opportunities

- T002/T003 parallel with T001 (different files).
- T004/T006 parallel with T007–T013 (BuildHeader vs editor script — different files).
- T015/T016/T017 parallel with each other (different template sections).
- T025/T026 parallel (delete different files).
- **Phase 8 (view refactor) can run in parallel with Phases 4–7** once Phase 2 is verified.
- T032–T036 all parallel (different golden paths + theme passes).

---

## Implementation Strategy

### MVP First

1. Phase 1 Setup → Phase 2 BuildHeader → Phase 3 Editor logic + form.
2. **STOP & VALIDATE**: create + edit golden paths end-to-end on temp routes.
3. Phase 7 route migration → delete old files → **MVP shipped**.

### Incremental Delivery

1. BuildHeader proven in isolation (Phase 2).
2. Editor form + logic (US1 + US4) → working create/edit ✅ **MVP**.
3. Sticky footer (US2).
4. YouTube preview (US5).
5. Editor overflow (US3 — editor side).
6. Route migration → old files deleted.
7. View refactor (US3 — view side) → hero + single overflow on all routes.
8. (Optional) BuildActionMenu extraction.
9. Polish.

---

## Notes

- Vuetify components only; theme tokens only (`rgb(var(--v-theme-*))`) — Constitution III.
- Zero new npm dependencies — Constitution I.
- No Firestore schema / security-rule changes — Constitution V.
- `BuildOrderEditor.vue` MUST NOT be modified.
- `BuildHeader.vue` MUST NOT import `buildService` or any consumer handler — all actions come via the `#actions` slot (Constitution I).
- Delete is **not** in the editor overflow — it is view-route only. `showDeleteConfirm` ref and its dialog are NOT needed in `BuildEditor`. (Spec clarification Q1.)
- The `originalBuild` snapshot (deep clone via `JSON.parse(JSON.stringify(build))`) is refreshed after every successful save, not only on mount. (Spec clarification Q2.)
- Route paths `/builds/new` and `/builds/:id/edit` are unchanged; only the `component:` binding in the router changes. `BuildNew.vue` and `BuildEdit.vue` are deleted — no redirect shims. (Spec clarification Q3.)
- Edit-mode 404/forbidden → `router.replace({ name: 'NotFound' })`. (Spec clarification Q4.)
- `onBeforeRouteLeave` dirty guard uses `window.confirm` — no extra dialog component needed. (Spec clarification Q5.)
- YouTube thumbnail `<img>` (`img.youtube.com`) may be blocked in sandboxed dev — test on Netlify preview or a normal tab.
- Commit after each task/logical group; Conventional Commits required. Keep Phase 8 (BuildDetails) as commits separate from the editor merge.
