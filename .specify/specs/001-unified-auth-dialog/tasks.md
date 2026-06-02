---
description: "Task list for Unified Authentication Dialog"
---

# Tasks: Unified Authentication Dialog

**Input**: Design documents from `specs/001-unified-auth-dialog/`

**Prerequisites**: plan.md, spec.md, design-notes.md, data-model.md, contracts/AuthDialog-contract.md

**Tests**: No automated test suite (Constitution Development Workflow). Each phase ends with a manual golden-path validation against `quickstart.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 / US2 / US3 / US4
- Conventional Commit prefix suggested per task

## Path Conventions

Single-project Vue frontend — all paths under `src/`.

---

## Phase 1: Setup

**Purpose**: Folder structure and shared infrastructure — no logic yet.

- [x] T001 Create folder `src/components/account/` (for `AuthDialog.vue`)
- [x] T002 [P] Create folder `src/composables/auth/` (for `useAuthErrors.js`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Vuex dialog state + error map that every user story depends on.

**⚠️ CRITICAL**: No user-story work begins until this phase is complete.

- [x] T003 Add `ui: { authDialog: { visible: false, mode: 'login', redirect: null } }` to state in `src/store/index.js`; add `setAuthDialog` mutation and `openAuthDialog({ mode, redirect }) / closeAuthDialog()` actions per data-model.md §1 and design-notes §5. (`feat: add authDialog Vuex UI slice`)
- [x] T004 [P] Create `src/composables/auth/useAuthErrors.js` exporting `mapAuthError(errOrCode)` with the full code→message map from design-notes §4. (`feat: add auth error mapping composable`)

**Checkpoint**: `store.dispatch('openAuthDialog', { mode: 'login' })` sets state; `mapAuthError('auth/wrong-password')` returns the friendly string.

---

## Phase 3: User Story 1 — One dialog for login and registration (Priority: P1) 🎯 MVP

**Goal**: Single in-context modal that logs in or registers, switching via footer link, wired to existing `signin`/`signup`. No validation polish yet — that's US2.

**Independent Test**: quickstart.md Scenarios 1–2, 5 (partially), 14.

- [x] T005 [US1] Create `src/components/account/AuthDialog.vue` shell: `v-dialog` v-modeled to `store.state.ui.authDialog.visible` (max-width 430, not persistent), `v-card rounded="lg"` wrapping a close button (`mdi-close`, top-right), title `v-card-title`, and subtitle `v-card-subtitle` — all driven by `ui.authDialog.mode`; plain-voice copy from design-notes §2. (`feat: scaffold AuthDialog shell`)
- [x] T006 [US1] Build the `v-form` inside the dialog card with conditional fields: Display name (`v-text-field`, `mdi-account-outline`, register only), E-mail (`v-text-field type="email"`, `mdi-email-outline`, all modes), Password (`v-text-field`, `mdi-lock-outline`, login + register only); submit `v-btn block color="primary"`. (`feat: add dialog form fields`)
- [x] T007 [US1] Implement `switchMode(newMode)` in `AuthDialog.vue`: updates `ui.authDialog.mode` (or local mirror), clears `authError`, resets validation, preserves `email` and `password` values across mode switches per data-model.md §2. (`feat: implement mode switching`)
- [x] T008 [US1] Wire submit to dispatch existing `signin({ email, password })` or `signup({ email, password, displayName })` based on mode; on success dispatch `closeAuthDialog()` and `showSnackbar`; if `ui.authDialog.redirect` is set after login, call `router.push(redirect)` then clear it (FR-018); handle errors by setting `authError` via `mapAuthError()`. (`feat: wire auth actions and redirect`)
- [x] T009 [US1] Mount `<AuthDialog />` once in `src/App.vue` adjacent to the existing `<Snackbar />`. (`feat: mount AuthDialog globally in App.vue`)
- [x] T010 [US1] Add a temporary "Open dialog" trigger to dispatch `openAuthDialog({ mode: 'login' })` from `src/components/Header.vue` for manual testing (replaced by final header CTA in US3). (`chore: temp dialog trigger for manual testing`)

**Checkpoint**: quickstart.md Scenarios 1, 2, 3, 14. Dialog opens over context, both modes submit successfully, closes on success / Esc / scrim / close button. No route change on success.

---

## Phase 4: User Story 2 — Validation, errors & submit feedback (Priority: P2)

**Goal**: Inline field validation, friendly mapped errors, password visibility toggle, loading/disabled submit.

**Independent Test**: quickstart.md Scenarios 4, 5, 6, 7.

- [x] T011 [US2] Add field validation rules from design-notes §3 to `AuthDialog.vue`: bind `emailRules`, `passwordLoginRules`/`passwordRegisterRules`, `displayNameRules` to the relevant `v-text-field :rules`; gate submit on `this.$refs.form.validate()` (or `form.value.validate()`). (`feat: add inline form validation`)
- [x] T012 [P] [US2] Add password visibility toggle to the password `v-text-field` in `AuthDialog.vue`: append-inner `mdi-eye-outline` / `mdi-eye-off-outline` icon toggles `showPassword`; bind `:type="showPassword ? 'text' : 'password'"`. (`feat: add password visibility toggle`)
- [x] T013 [US2] Add dialog-level error banner (`v-alert type="error" variant="tonal" density="comfortable"`) below subtitle in `AuthDialog.vue`, shown only when `authError` is non-null; clear `authError` on every mode switch and at the start of each submit. (`feat: add auth error banner`)
- [x] T014 [US2] Add submit loading state: bind `:loading="loading"` and `:disabled="loading"` to the submit button; set `loading = true` before the async dispatch, clear in `finally`. (`feat: add submit loading and disable state`)
- [x] T015 [P] [US2] For `auth/email-already-in-use` errors, render a "Log in instead" `v-btn variant="text"` inline with the error banner that calls `switchMode('login')`. (`feat: add log-in-instead affordance for duplicate email`)
- [ ] T016 [P] [US2] *(Optional quality refactor)* Update `signin` and `signup` actions in `src/store/index.js` to re-throw the original Firebase `error` object (not a string) so `mapAuthError` can match `.code` directly — separate atomic commit, low-risk. (`refactor: surface raw Firebase error code from store actions`)

**Checkpoint**: quickstart.md Scenarios 4, 5, 6, 7 all pass. No raw Firebase codes visible.

---

## Phase 5: User Story 4 — In-dialog password reset request (Priority: P2)

**Goal**: Fold the reset-email request into the dialog as a third mode; retire `ResetPassword.vue` card.

**Independent Test**: quickstart.md Scenarios 9, 8 (resetpassword deep link).

- [x] T017 [US4] Add `resetPassword` Vuex action to `src/store/index.js` wrapping `sendPasswordResetEmail(auth, email, actionCodeSettings)` per design-notes §5. (`feat: add resetPassword Vuex action`)
- [x] T018 [US4] Add `reset` mode to `AuthDialog.vue`: title "Reset password", subtitle from §2, email field only (no password/displayName), "Send Reset Link" submit button, "← Back to log in" footer link calls `switchMode('login')`; on success dispatch `showSnackbar` then `switchMode('login')`; hide error banner in reset mode (reset errors shown via snackbar). (`feat: add reset password mode to AuthDialog`)
- [x] T019 [US4] Wire the login-mode "Forgot password?" link (below the password field) to call `switchMode('reset')` instead of navigating; confirm no route change occurs. (`feat: wire forgot-password link to reset mode`)

**Checkpoint**: quickstart.md Scenarios 9 pass in full. `ResetPassword.vue` card markup is no longer rendered via its own page.

---

## Phase 6: User Story 3 — Consolidated entry points & preserved deep links (Priority: P3)

**Goal**: Single header CTA; `/login`, `/register`, `/resetpassword` open dialog in correct mode; authenticated users redirected; post-login redirect from protected routes works end-to-end.

**Independent Test**: quickstart.md Scenarios 8, 10, 11, 12, 13.

- [x] T020 [US3] Replace the logged-out header auth pair ("REGISTER NOW!" + "Login") with a single `v-btn` dispatching `openAuthDialog({ mode: 'login' })` in `src/components/Header.vue`; keep the authenticated-state header unchanged (design-notes §6). (`refactor: consolidate header auth entry point`)
- [x] T021 [US3] Convert `src/views/account/Login.vue` to a shim: empty template, `setup()` reads `route.query.redirect`, dispatches `openAuthDialog({ mode: 'login', redirect })`, calls `router.replace('/')`. (`refactor: convert Login.vue to dialog shim`)
- [x] T022 [P] [US3] Convert `src/views/account/Register.vue` to a shim: same pattern as T021, dispatches `openAuthDialog({ mode: 'register' })` (no redirect needed for register). (`refactor: convert Register.vue to dialog shim`)
- [x] T023 [P] [US3] Convert `src/views/account/ResetPassword.vue` to a shim: dispatches `openAuthDialog({ mode: 'reset' })`, calls `router.replace('/')`. (`refactor: convert ResetPassword.vue to dialog shim`)
- [x] T024 [US3] Update `src/router/index.js`: verify `guestOnly: true` is on `/login` and `/register` (already added in prior session — confirm and keep); confirm `/resetpassword` has no `requiresAuth` guard; remove the temporary trigger added in T010. (`chore: audit router guards for auth routes`)
- [ ] T025 [US3] End-to-end validation of FR-018: navigate to `/mybuilds` while logged out → redirected to `/login?redirect=/mybuilds` → log in → confirm app navigates to `/mybuilds` post-login (quickstart.md Scenario 11). (`chore: validate protected-route redirect flow`)

**Checkpoint**: quickstart.md Scenarios 8, 10, 11, 12, 13 pass. Three old auth view bodies are shims. Header shows one entry point. Verification action link to `/login` works.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T026 [P] Verify light + dark themes render correctly across all three modes (colors via Vuetify theme tokens — no hardcoded hex). (quickstart.md: visual check)
- [ ] T027 [P] Verify mobile breakpoint: dialog usable at 375 px width, full-width, scrollable if content overflows, hit targets ≥ 44 px.
- [ ] T028 [P] Confirm `prefers-reduced-motion`: enable in OS/browser, open dialog — no custom looping animation.
- [ ] T029 Delete dead template markup and unused imports from `Login.vue`, `Register.vue`, `ResetPassword.vue` (shims keep only the `setup()` logic); confirm `AccountAction.vue` is untouched.
- [ ] T030 Self-review diff against `specs/001-unified-auth-dialog/checklist.md`; run full golden path (quickstart.md Scenarios 1–14) one final time before merge.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1. Blocks all user stories.
- **US1 (Phase 3)**: Depends on Phase 2. This is the MVP — can be merged alone.
- **US2 (Phase 4)**: Depends on US1 dialog existing. Touches `AuthDialog.vue` internals only.
- **US4 (Phase 5)**: Depends on US1. Touches `AuthDialog.vue` + store. Can run in parallel with US2 (different concerns).
- **US3 (Phase 6)**: Depends on US1 + US4 (reset mode must exist before converting `ResetPassword.vue` shim). Header + router changes.
- **Polish (Phase 7)**: Depends on all stories complete.

### Parallel Opportunities

- T001, T002 (setup): parallel.
- T003, T004 (foundational): parallel (different files).
- T012, T015, T016 within US2: parallel.
- T022, T023 within US3: parallel.
- T026, T027, T028 in polish: parallel.

### Within Each Story

- Scaffold shell → form fields → logic → wiring → mount/integrate.
- Each story is independently completable and manually testable.

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — CRITICAL
3. Complete Phase 3: US1 — dialog + login + register + close
4. **STOP and VALIDATE**: quickstart.md Scenarios 1, 2, 3, 14
5. Merge or demo if satisfied

### Incremental Delivery

1. Setup + Foundational → core state ready
2. US1 → working dialog, MVP ✅
3. US2 → validation polish
4. US4 → reset mode added
5. US3 → entry points consolidated, deep links preserved
6. Polish → theme/mobile/motion checks, dead code removed

---

## Notes

- All UI uses Vuetify components only; no custom UI primitives (Constitution III).
- Zero new dependencies (Constitution I).
- No Firestore schema or `firestore.rules` changes — no security review trigger (Constitution V).
- `AccountAction.vue` is explicitly out of scope and MUST NOT be modified.
- Commit after each task or logical group; Conventional Commits prefix required.
- `guestOnly` guard on `/login` and `/register` was added in a prior session — T024 confirms it, not re-implements it.
