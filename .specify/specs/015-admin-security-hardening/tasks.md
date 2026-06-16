# Tasks: Admin Security Hardening

**Input**: Design documents from `.specify/specs/015-admin-security-hardening/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

**Scope note**: US3 (initializeContributors migration callable) is deferred — it is a correctness improvement, not a security fix. This task list covers US1 and US2 only.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: User story this task belongs to (US1, US2)
- File paths are exact per plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the one-time developer provisioning tool. Must be run before deploying guarded functions or existing admins lose access.

- [x] T001 Create `scripts/set-admin-claims.js` — Node.js script using Firebase Admin SDK that calls `setCustomUserClaims(uid, { admin: true })` for each of the three admin UIDs. Include console output confirming each claim was set. The UIDs are hardcoded constants in this script (not in any client-side file).

---

## Phase 3: User Story 1 — Server rejects unauthorized callers (Priority: P1) 🎯 MVP

**Goal**: Close the open data-leak in `getUsers`. Any caller without the `admin` custom claim gets `permission-denied` before any data is read or returned.

**Independent Test**: Call `getUsers` via the Firebase client SDK or Firebase Emulator without admin credentials — expect a `functions/permission-denied` error and zero data in the response. Call with a valid admin token — expect the full user list.

### Implementation for User Story 1

- [x] T002 [US1] Guard `functions/users/getUsers.js` — add `if (!req.auth || req.auth.token.admin !== true) throw new HttpsError('permission-denied', 'Admin only')` as the very first statement inside `onCall`. Import `HttpsError` from `firebase-functions/v2/https` alongside the existing `onCall` import.

**Checkpoint**: US1 complete — `getUsers` enforces admin-only access server-side. Independently deployable and verifiable without any client changes.

---

## Phase 4: User Story 2 — Admin UI gate via server-verified claim (Priority: P2)

**Goal**: Remove hardcoded UIDs from the client bundle. Admin UI visibility is driven by `store.state.isAdmin`, populated from the Firebase ID token claim on login.

**Independent Test**: Inspect the production JS bundle for the absence of the three hardcoded UID strings. Log in as an admin account → admin panel appears. Log in as non-admin → panel hidden. No UID comparison literals remain in any source file.

### Implementation for User Story 2

- [x] T003 [P] [US2] Add `isAdmin: false` to the `state` object in `src/store/index.js` alongside the existing `user`, `authIsReady`, and other state fields.
- [x] T004 [P] [US2] Add `setIsAdmin(state, payload) { state.isAdmin = payload }` to the `mutations` object in `src/store/index.js`.
- [x] T005 [US2] Update the `onAuthStateChanged` callback in `src/store/index.js` — after the existing `store.commit('setUser', ...)` call, add: if `user` is non-null, await `user.getIdTokenResult()` and commit `setIsAdmin` with `tokenResult.claims.admin === true`; in the sign-out branch, commit `setIsAdmin` with `false`. (Depends on T003, T004)
- [x] T006 [US2] Replace the `v-if` condition in `src/views/Admin.vue` — remove the `authIsReady && user && (user.uid === 'beJM1k8sm8TVm5fHQZfKUniL8Hp1' || ...)` check and replace with `authIsReady && isAdmin`, where `isAdmin` is a computed returning `store.state.isAdmin`. Remove all three hardcoded UID string literals from the file. (Depends on T005)

**Checkpoint**: US2 complete — no UIDs in the bundle; admin panel visibility is claim-driven. Verifiable without US1 being deployed.

---

## Phase N: Polish & Cross-Cutting Concerns

- [x] T007 Fix `abilityHero` reference error in `src/views/Admin.vue` — `abilityHero` is referenced in `updateImageMetaData()` at lines 249–250 but is never imported in this file. Add `import abilityHero from "@/composables/builds/icons/json/abilityHero.json" with { type: "json" }` at the top of `<script>`, matching the existing JSON import pattern.
- [ ] T008 Run `node scripts/set-admin-claims.js` locally (requires `GOOGLE_APPLICATION_CREDENTIALS` or Firebase Admin SDK service account) to provision the `admin: true` claim on the three admin UIDs. Do this before deploying T002 to production.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup — T001)**: No dependencies, start immediately
- **Phase 3 (US1 — T002)**: Independent of all other tasks, can start immediately
- **Phase 4 (US2 — T003–T006)**: Independent of US1, can run in parallel with Phase 3
  - Within US2: T003 and T004 are parallel → T005 depends on both → T006 depends on T005
- **Polish (T007, T008)**: T007 is independent (any time); T008 must run before deploying T002 to production

### User Story Dependencies

- **US1 (P1)**: Independent — no dependency on US2
- **US2 (P2)**: Independent — no dependency on US1

### Parallel Opportunities Within US2

```
# T003 and T004 touch different blocks in the same file — write them together:
T003: Add isAdmin to state object in src/store/index.js
T004: Add setIsAdmin to mutations object in src/store/index.js

# Then sequentially:
T005: Update onAuthStateChanged → T006: Update Admin.vue v-if
```

---

## Implementation Strategy

### MVP (User Story 1 Only — 2 changes)

1. T001 — create provisioning script
2. T008 — run it (provision claims on the 3 UIDs)
3. T002 — add 3-line guard to `getUsers`
4. Deploy updated function
5. **Validate**: call `getUsers` without admin credentials → confirm rejection

This closes the only actual security hole. Everything else is cleanup.

### Full Scope

1. MVP above
2. T003 + T004 (parallel) → T005 → T006 — claim-based UI gate, no UIDs in bundle
3. T007 — fix abilityHero crash in icon sync

---

## Notes

- T002 alone is the security fix. US2 (T003–T006) is a hygiene improvement (no hardcoded UIDs in source).
- T008 (provisioning) must precede T002 in production — otherwise existing admins get locked out.
- US3 (initializeContributors migration callable) is explicitly out of scope for this branch. Track separately if needed.
