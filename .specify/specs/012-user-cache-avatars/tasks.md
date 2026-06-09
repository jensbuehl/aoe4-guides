# Tasks: User Profile Cache with Comment Avatars

**Input**: Design documents from `.specify/specs/012-user-cache-avatars/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Organization**: Tasks grouped by user story. No test suite — manual golden-path per constitution.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to
- No new dependencies or project structure needed — all tasks are targeted edits to existing files

---

## Phase 1: Setup

No setup required — no new dependencies, no new files, no project structure changes.
All work is contained in two existing files: `src/store/index.js` and `src/components/Comment.vue`.

---

## Phase 2: User Story 1 — User Profile Cache (Priority: P1) 🎯 MVP

**Goal**: Extend the Vuex store with a `userProfiles` cache that returns a stored profile
immediately on repeat lookups, and fetches + caches from Firestore exactly once per uid per session.
Concurrent in-flight requests for the same uid are coalesced via a module-level `pendingFetches` Map.

**Independent Test**: Open a build order page with multiple comments from 2–3 distinct authors.
Monitor Firestore requests — exactly M reads should occur for M distinct author uids, regardless
of how many comments each author posted. Check `state.cache.userProfiles` in Vue DevTools — should
contain one entry per distinct uid with a profile object or `null`.

- [x] T001 [US1] Add `userProfiles: {}` to the `cache` object in `state` in `src/store/index.js` (alongside the existing `builds`, `popularBuildsList`, etc. entries)
- [x] T002 [US1] Add `setUserProfile(state, { uid, profile })` mutation to `src/store/index.js` — writes `state.cache.userProfiles[uid] = profile` where profile is `UserProfileCacheEntry | null`
- [x] T003 [US1] Add module-level `const pendingFetches = new Map()` above the `createStore` call in `src/store/index.js`, then add `getCachedUserProfile` action: check `state.cache.userProfiles[uid] !== undefined` → return immediately; check `pendingFetches.has(uid)` → return existing Promise; otherwise create a Promise that calls `getUserProfile(uid)` from `@/composables/data/userService`, commits `setUserProfile({ uid, profile: result ?? null })`, deletes `uid` from `pendingFetches`, and resolves with the profile — store it in `pendingFetches` before returning

**Checkpoint**: Dispatch `store.dispatch('getCachedUserProfile', uid)` from browser console twice with the same uid — first call triggers a Firestore read, second returns instantly. `state.cache.userProfiles` in Vue DevTools shows the entry.

---

## Phase 3: User Story 2 — Avatar Images on Comments (Priority: P2)

**Goal**: Each comment displays the commenter's actual avatar image (using the `useAvatar` composable
and the cache from US1) with initials as the fallback when no avatar is set.

**Independent Test**: View a build order with comments from a user who has an avatar set and one who
doesn't. First user shows their avatar image; second shows initials. No additional Firestore reads
beyond the M reads from US1.

- [x] T004 [US2] In `src/components/Comment.vue` setup function: import `useAvatar` from `@/composables/auth/useAvatar`; add `const cachedProfile = ref(null)`; on component mount (`onMounted`), dispatch `getCachedUserProfile(authorId)` via `store.dispatch` and assign the result to `cachedProfile.value`; create `const authorAvatar = computed(() => cachedProfile.value?.avatar ?? null)` and `const authorUser = computed(() => ({ displayName: props.comment.author }))`; call `const { src: avatarSrc, initials: avatarInitials } = useAvatar(authorAvatar, authorUser)`; return `avatarSrc` and `avatarInitials`
- [x] T005 [US2] Update the `v-avatar` in `src/components/Comment.vue` template — replace `{{ author.slice(0, 2).toUpperCase() }}` with: `<v-img v-if="avatarSrc" :src="avatarSrc" cover />` as child when src is available, and `<span v-else>{{ avatarInitials }}</span>` as fallback; keep `color="accent"` on the `v-avatar` so the background colour shows for initials

**Checkpoint**: Comments page shows avatar images for users who have them, initials for those who don't. No broken image states visible.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [ ] T006 Run full manual test per `quickstart.md` ⚠️ MANUAL STEP steps 1–6 and verify all four success criteria (SC-001 through SC-004) pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Nothing to do — start Phase 2 immediately
- **US1 (Phase 2)**: No external dependencies — start immediately. T001 → T002 → T003 (sequential, same file)
- **US2 (Phase 3)**: Depends on US1 complete (needs `getCachedUserProfile` action). T004 → T005 (sequential, same file)
- **Polish (Phase 4)**: Depends on US1 + US2 complete

### Within Each Phase

- T001 → T002 → T003: sequential (all `src/store/index.js`)
- T004 → T005: sequential (both `src/components/Comment.vue`)
- T003 and T004 cannot run in parallel (T004 depends on `getCachedUserProfile` action from T003)

### Parallel Opportunities

None within phases (all tasks are sequential within the same file). US1 and US2 are serial by
dependency. The feature is intentionally small — 5 tasks across 2 files.

---

## Implementation Strategy

### MVP (US1 — Cache Only)

1. T001 → T002 → T003: store cache with dedup
2. **VALIDATE**: Confirm M reads for M distinct authors via DevTools
3. US1 delivers the cost-saving benefit even without the visual avatar display

### Full Feature

1. Complete US1 (T001–T003) → cache working
2. Complete US2 (T004–T005) → avatars visible
3. T006: run quickstart validation

---

## Notes

- No new dependencies — `useAvatar` composable already exists and handles all avatar types
- `pendingFetches` lives at module scope (not in Vuex state) — it is transient infrastructure,
  not application state, so it should not be reactive or mutated via Vuex
- The `useAvatar` composable expects `avatar` as a computed ref and `user` as an object with
  `.displayName` — match this signature exactly in T004
- `comment.author` (the denormalized display name) is used for initials so comments still
  display correctly even when the user document is missing (null cache entry)
