---
description: "Task list for Account Page Redesign & User Avatars"
---

# Tasks: Account Page Redesign & User Avatars

**Input**: Design documents from `.specify/specs/002-account-redesign/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/AvatarPicker-contract.md, research.md

**Tests**: No automated test suite (Constitution Development Workflow). Each phase ends with manual validation against `quickstart.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: US1–US5 maps to spec user stories
- Conventional Commit prefix noted per task

## Path Conventions

Single-project Vue frontend — all paths under `src/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Wire Firebase Storage, create data service, composable, and store slice that every user story depends on.

- [x] T001 Add Firebase Storage to `src/firebase/index.js`: import `getStorage`, `ref as storageRef`, `uploadBytes`, `getDownloadURL` from `firebase/storage`; initialize `const storage = getStorage(app)`; export `storage`, `storageRef`, `uploadBytes`, `getDownloadURL`. (`chore: wire Firebase Storage SDK`)
- [x] T002 [P] Create `src/composables/data/userService.js` exporting `getUserProfile(uid)` (reads `users/{uid}` Firestore doc) and `updateUserAvatar(uid, avatar)` (writes `{ avatar }` via `updateDoc`). (`feat: add userService for Firestore users collection`)
- [x] T003 [P] Create `src/composables/auth/useAvatar.js` exporting `useAvatar(userAvatar, user)` returning `{ src: computed, initials: computed }` per data-model.md §4 resolution logic (initials → null src; civ → `civs.find(c => c.shortName === ref).flagSmall`; upload → ref URL; broken ref → null). (`feat: add useAvatar composable`)
- [x] T004 [P] Add to `src/store/index.js`: state `userAvatar: null`, mutation `setUserAvatar`, actions `loadUserAvatar(uid)` (calls `getUserProfile`) and `updateAvatar({ type, ref })` (calls `updateUserAvatar` then commits). (`feat: add userAvatar Vuex slice`)

**Checkpoint**: `getUserProfile` returns Firestore user doc; `useAvatar` resolves all three types correctly.

---

## Phase 2: Foundational (Security Rules)

**Purpose**: Security rules must be in place before any writes are tested.

**⚠️ CRITICAL**: Avatar writes to Firestore and Storage will be rejected without these rules.

- [x] T005 Update `firestore.rules`: add write rule for `users/{uid}` allowing `request.auth.uid == userId` per data-model.md §1 schema. (`chore: extend Firestore rules for avatar field`)
- [x] T006 [P] Create or update `storage.rules`: add `avatars/{userId}.webp` write rule — authenticated user matching uid, `request.resource.size < 200 * 1024`, content type matches `image/.*` per data-model.md §2. (`chore: add Storage rules for avatar uploads`)
- [x] T007 Update `src/store/index.js` `onAuthStateChanged` handler: after existing `setUser` + `setAuthIsReady` calls, dispatch `loadUserAvatar(user.uid)` when user is present; dispatch `setUserAvatar(null)` on logout. (`feat: load avatar on auth state change`)

**Checkpoint**: Opening DevTools Network tab after login shows a Firestore read for `users/{uid}`; no permission-denied errors.

---

## Phase 3: User Story 1 — Choose an avatar (Priority: P1) 🎯 MVP

**Goal**: Logged-in users can open a picker, choose initials / civ crest / uploaded image, and see the choice live in the header. All three sources work; choice persists across reloads.

**Independent Test**: quickstart.md Scenarios 1–5.

- [x] T008 [US1] Create `src/components/account/AvatarPicker.vue` shell: `v-dialog` v-modeled on `modelValue` prop (emits `update:modelValue`), `v-card rounded="lg"` with title row + close button, three `v-tabs` (Initials / Civilizations / Upload), Cancel + Save footer buttons; Save dispatches `updateAvatar` then closes. (`feat: scaffold AvatarPicker component`)
- [x] T009 [US1] Add Initials tab content to `AvatarPicker.vue`: shows `v-avatar` preview with computed initials from `store.state.user.displayName`; clicking the tab selects `{ type: 'initials', ref: null }` as pending choice. (`feat: add Initials tab to AvatarPicker`)
- [x] T010 [US1] Add Civilizations tab content to `AvatarPicker.vue`: grid of `v-img` thumbnails using `civDefaultProvider.js` `flagSmall` paths (exclude `ANY`); clicking a crest selects `{ type: 'civ', ref: civ.shortName }` as pending choice; selected item highlighted with a `v-btn icon` overlay or border. (`feat: add Civilizations tab to AvatarPicker`)
- [x] T011 [US1] Add Upload tab content to `AvatarPicker.vue`: hidden `<input type="file" accept="image/*">`; on file pick, use canvas to resize to 256×256 center-crop, export as `image/webp` quality 0.82 (no library — canvas API only); show square preview; store the `Blob` as pending upload. (`feat: add Upload tab with canvas resize to AvatarPicker`)
- [x] T012 [US1] Wire Save button in `AvatarPicker.vue`: if pending type is `initials`/`civ` dispatch `updateAvatar` directly; if `upload`, call `uploadBytes(storageRef(storage, 'avatars/${uid}.webp'), blob)` then `getDownloadURL`, dispatch `updateAvatar({ type: 'upload', ref: url })`; show loading state on Save during in-flight upload; `showSnackbar` on error. (`feat: wire AvatarPicker Save with Storage upload`)
- [x] T013 [US1] Update `src/components/Header.vue`: import `useAvatar`; replace initials-only `v-avatar` with conditional — `<v-img :src="avatarSrc">` when `src` is non-null, initials string when null; bind `avatarSrc` from `useAvatar(userAvatar, user).src`. (`feat: show resolved avatar in Header`)

**Checkpoint**: quickstart.md Scenarios 1–5. Avatar updates in header without reload; persists across reload.

---

## Phase 4: User Story 2 — Clear, modern account layout (Priority: P1)

**Goal**: `Account.vue` fully rewritten: profile hero (avatar + name + verification badge), read-only identity rows (email, UID + copy), responsive two-column layout.

**Independent Test**: quickstart.md Scenarios 1, 6, 10, 11.

- [x] T014 [US2] Rewrite `src/views/account/Account.vue` skeleton: `v-container` with `v-row` responsive grid (`cols="12" md="8" offset-md="2"` or similar centred layout); three `v-card rounded="lg"` zones — Profile Hero, Security, Danger Zone; remove all old read-only-as-editable inputs. (`refactor: rewrite Account.vue skeleton`)
- [x] T015 [US2] Build Profile Hero card in `Account.vue`: centred `v-avatar` (size 96, uses `useAvatar` — `v-img` if src, initials if not) with an overlay `v-btn icon="mdi-camera"` click handler setting `pickerOpen = true`; display name as `v-card-title`; email as `text-medium-emphasis`; `v-chip` badge showing `● Verified` (success) or `● Unverified` (warning) based on `user.emailVerified`. (`feat: build profile hero card in Account.vue`)
- [x] T016 [US2] Add read-only identity section below the hero (or inside the profile card): Email and User ID as labelled static rows using `v-list-item` with `subtitle` (label) and `title` (value); User ID row includes a `v-btn icon="mdi-content-copy"` that writes to clipboard and shows a snackbar confirmation. (`feat: add read-only identity rows with UID copy`)
- [x] T017 [US2] Mount `<AvatarPicker v-model="pickerOpen" />` in `Account.vue`; define `pickerOpen = ref(false)` in setup; wire avatar overlay click to `pickerOpen = true`. (`feat: integrate AvatarPicker into Account.vue`)

**Checkpoint**: quickstart.md Scenarios 1, 6, 10, 11. No editable-looking read-only fields; avatar picker opens from profile hero.

---

## Phase 5: User Story 3 — Change password with confirmation (Priority: P2)

**Goal**: Security card in Account.vue has a two-field password form (new + confirm), mismatch validation, visibility toggles, and uses the existing `changePassword` store action.

**Independent Test**: quickstart.md Scenario 7.

- [x] T018 [US3] Add Security `v-card` to `Account.vue`: `v-card-title` "Security"; `v-form` with two `v-text-field` fields (New password, Confirm new password) each with `mdi-eye-outline` / `mdi-eye-off-outline` visibility toggle; inline rule `v => newPassword === confirmPassword || 'Passwords do not match.'`; submit button `:disabled` while loading; on success dispatch `showSnackbar` "Password changed successfully!". Reuse `changePassword` store action. (`feat: add change-password form with confirmation to Account.vue`)

**Checkpoint**: quickstart.md Scenario 7 passes in full.

---

## Phase 6: User Story 4 — Safe account deletion (Priority: P3)

**Goal**: Danger zone card is visually distinct (error-tonal styling), delete requires explicit dialog confirmation.

**Independent Test**: quickstart.md Scenario 8.

- [x] T019 [US4] Add Danger Zone section to `Account.vue`: `v-card` wrapping a `v-alert type="error" variant="tonal" density="comfortable"` containing the title "Danger zone", description "Permanently delete your account and all your data.", and a `v-btn color="error"` "Delete Account" button; clicking the button opens an inline `v-dialog` with consequence text and explicit Confirm/Cancel actions; Confirm dispatches `deleteAccount` store action then navigates home. (`refactor: add danger zone with confirmation to Account.vue`)

**Checkpoint**: quickstart.md Scenario 8 passes. Danger zone is visually separate from Security card.

---

## Phase 7: User Story 5 — Email verification banner (Priority: P3)

**Goal**: Unverified users see a neutral contextual banner (no false claims) with a working Resend action. Verified users see nothing.

**Independent Test**: quickstart.md Scenario 9.

- [x] T020 [US5] Add verification banner to `Account.vue` profile section: `v-alert v-if="!user.emailVerified" type="warning" variant="tonal"` with copy "Please confirm your email address." and a `v-btn variant="text"` "Resend email" that dispatches `verifyEmail` store action and shows a success snackbar; no mention of notifications or unbuilt features. (`fix: replace verification card with neutral inline banner`)

**Checkpoint**: quickstart.md Scenario 9 passes. Banner absent for verified users; copy is accurate.

---

## Phase 8: Polish & Cross-Cutting

- [x] T021 [P] Verify light + dark themes: toggle theme in header, check all Account.vue sections use Vuetify colour tokens (no hardcoded hex). (quickstart.md Scenario 11)
- [x] T022 [P] Verify mobile layout: 375 px viewport — profile hero centres, sections stack, touch targets ≥44 px. (quickstart.md Scenario 10)
- [x] T023 [P] Verify avatar fallback: set `avatar.ref` to a non-existent civ code in Firestore → reload → initials shown, no broken image. (quickstart.md Scenario 12)
- [x] T024 Self-review diff against `.specify/specs/002-account-redesign/checklists/requirements.md`; run full golden path (quickstart.md Scenarios 1–12) before merge.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — T002, T003, T004 can run in parallel (different files).
- **Foundational (Phase 2)**: Depends on Phase 1 (store slice needed for T007). T005 + T006 can run in parallel.
- **US1 (Phase 3)**: Depends on Phase 2. T008 must be first; T009–T011 can be done in any order (different tabs, same file); T012 depends on T009–T011; T013 is independent (Header.vue only).
- **US2 (Phase 4)**: Depends on US1 (AvatarPicker must exist for T017). T014 first (skeleton); T015–T016 can follow in any order; T017 last.
- **US3 (Phase 5)**: Depends only on US2 skeleton existing (adds to Account.vue). Independent of US1 content.
- **US4 (Phase 6)**: Same — depends on US2 skeleton; independent of US1/US3.
- **US5 (Phase 7)**: Same — depends on US2 skeleton.
- **Polish (Phase 8)**: Depends on all user stories complete. T021–T023 can run in parallel.

### Parallel Opportunities

- T002, T003, T004: all setup, different files
- T005, T006: different rule files
- T009, T010, T011: different tabs in AvatarPicker (same file but non-overlapping sections)
- T013: Header.vue, independent of Account.vue work
- T021, T022, T023: polish verifications

---

## Implementation Strategy

### MVP (US1 + US2 only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational rules + auth load (T005–T007)
3. Complete Phase 3: AvatarPicker + Header (T008–T013)
4. Complete Phase 4: Account.vue rewrite (T014–T017)
5. **STOP and VALIDATE**: quickstart.md Scenarios 1–6, 10–12
6. Ship if satisfied — US1+US2 together deliver the profile redesign + avatar feature

### Incremental Delivery

1. Phases 1–3 → Avatar in header (no Account.vue rewrite yet)
2. Phase 4 → Profile hero + identity layout ✅ MVP
3. Phase 5 → Password confirmation
4. Phase 6 → Danger zone
5. Phase 7 → Verification banner
6. Phase 8 → Polish

---

## Notes

- All UI uses Vuetify components only; no custom UI primitives (Constitution III).
- No new npm dependencies — `canvas` API and Firebase Storage SDK are already available (Constitution I).
- Firebase Storage SDK is in the project's `firebase` package but NOT yet imported in `firebase/index.js` — T001 is blocking.
- `storage.rules` may not exist yet — create it if absent (T006).
- `AccountAction.vue` (emailed reset/verify link handler) is NOT modified — out of scope.
- Commit after each task or logical group; Conventional Commits prefix required.
