# Research: User Profile Cache with Comment Avatars

## Decision 1: Cache Location — Vuex store vs. composable-local Map

**Decision**: Extend `state.cache` in the existing Vuex store with a `userProfiles` object.

**Rationale**: The store already has an established `state.cache` pattern for builds and contributor
lists. A store-level cache survives component unmounts/remounts (e.g., navigating away from a build
page and returning), whereas a composable-local `Map` would be garbage-collected when the last
component using it unmounts. The store also makes the cache inspectable in Vue DevTools.

**Alternatives considered**:
- Module-level `Map` in `userService.js`: survives the session but is invisible to DevTools and
  bypasses Vuex's mutation tracking. Rejected for debuggability.
- Composable-local `ref({})` inside a new `useUserCache` composable shared via `provide/inject`:
  Would require changes to every parent component that hosts comments. Rejected for added complexity.

---

## Decision 2: Null Sentinel for Missing Profiles

**Decision**: Store `null` in `cache.userProfiles[uid]` when `getUserProfile` returns no document.

**Rationale**: A missing key in the cache map means "not yet fetched". Storing `null` means "fetched
and confirmed absent". Without this, every render of a comment from a deleted account re-triggers a
Firestore read. The null sentinel satisfies FR-004 and ensures deleted accounts don't create read
storms.

**Alternatives considered**:
- A separate `Set<string> fetchedUids`: Requires checking two data structures. Rejected for
  added complexity.

---

## Decision 3: In-Flight Request Deduplication

**Decision**: Track in-flight fetches via a module-level `pendingFetches` Map (`uid → Promise`)
inside the store action. Any concurrent call for the same uid awaits the same Promise.

**Rationale**: Without deduplication, a comment list with 10 comments from the same author would
fire 10 concurrent Firestore reads before any of them writes to the cache (Vuex mutations are
synchronous but the fetch is async). A `pendingFetches` Map coalesces these into one network round
trip. The Map lives at module scope (not in Vuex state) because it is transient infrastructure,
not application state.

**Alternatives considered**:
- Setting a sentinel value like `"pending"` in the Vuex cache before the fetch: Could work but
  complicates consuming code (must handle three states: undefined, "pending", profile). Rejected.

---

## Decision 4: Avatar Rendering in Comment.vue — Reuse `useAvatar`

**Decision**: Call `useAvatar(avatar, { displayName: author })` inside `Comment.vue` setup,
where `avatar` is a computed ref to the cached profile's `avatar` field.

**Rationale**: `useAvatar` already handles all three avatar types (`civ`, `upload`, `initials`/null)
and returns `{ src, initials }`. This is exactly the pattern `Header.vue` uses. Reusing it
satisfies Constitution Principle III (component reuse) and means any future avatar type additions
automatically work in comments too.

**Alternatives considered**:
- Inline the URL resolution logic in Comment.vue: Would duplicate logic already in `useAvatar`.
  Rejected.

---

## Decision 5: Action Return Value

**Decision**: The `getCachedUserProfile(uid)` action returns the profile object (or `null`) directly,
in addition to committing it to the store.

**Rationale**: Comment.vue needs the profile to drive a local reactive ref. Returning the value
avoids an extra `store.state.cache.userProfiles[uid]` lookup after the dispatch. Both the store
and the component end up with the same reference.

---

## Decision 6: No Cache Expiry

**Decision**: Cache entries live for the browser session with no TTL.

**Rationale**: Avatars change infrequently (user-initiated). A stale avatar for the current
session is explicitly listed as acceptable in the spec assumptions. Adding a TTL would require
storing a timestamp per entry and checking it on every access — complexity not justified by the
use case. The cache is effectively cleared on page refresh anyway.
