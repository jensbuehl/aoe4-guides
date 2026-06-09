# Feature Specification: User Profile Cache with Comment Avatars

**Feature Branch**: `012-user-cache-avatars`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "I want to have a local user cache (it is crucial to safe firebase document reads) and I wanna use that cache to be able to show avatar images on comments."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — User Profile Cache Reduces Database Reads (Priority: P1)

Any part of the app that needs user profile data (avatar, display name) by user ID fetches it through a shared in-memory cache. On the first request for a given user, the app fetches from the database and stores the result. Subsequent requests for the same user return instantly from cache without any additional database read.

**Why this priority**: This is the foundational piece — without the cache, every comment in a thread causes a separate database read per user. At 4M reads/month already at 2.7× free tier, this is a direct cost concern. The avatar display (US2) builds on top of this.

**Independent Test**: Open a build order page with 10 comments from 3 distinct authors. Monitor network/database activity — verify that only 3 user profile reads occur regardless of how many comments each author posted. Reload within the same session — verify 0 additional reads occur for already-cached users.

**Acceptance Scenarios**:

1. **Given** a comments section with multiple comments from the same author, **When** the page loads, **Then** the author's profile is fetched exactly once from the database, not once per comment.
2. **Given** a user profile is already in cache, **When** another component requests the same user's profile, **Then** the data is returned immediately from cache without a database read.
3. **Given** a user ID that has no user document, **When** the cache is asked for that profile, **Then** a null/empty result is cached to prevent repeated failed lookups.

---

### User Story 2 — Avatar Images Appear on Comments (Priority: P2)

When viewing comments on a build order, each comment shows the commenter's profile avatar image. If the commenter has not set an avatar, the existing initials placeholder is shown as a fallback. The avatar is resolved through the user cache (US1) so no extra database reads are incurred.

**Why this priority**: Depends on the cache (US1). Provides a meaningful visual improvement to the comments section — users can quickly recognize who they are talking with. Builds on the already-present `v-avatar` with initials that exists in Comment.vue.

**Independent Test**: Post comments as a user with an avatar set and as a user without one. View the build order comments — verify the first user shows their avatar image and the second shows initials. No additional database reads beyond the ones counted in US1's test.

**Acceptance Scenarios**:

1. **Given** a commenter has an avatar set in their profile, **When** their comment is displayed, **Then** their avatar image appears in the comment's avatar slot.
2. **Given** a commenter has no avatar set, **When** their comment is displayed, **Then** the initials of their display name appear in the avatar slot (existing fallback behavior is preserved).
3. **Given** the cache returns a result for the commenter's user ID, **When** the comment renders, **Then** no additional database read is triggered for that user's avatar.

---

### Edge Cases

- What happens when the avatar URL is broken or the image fails to load? → Fall back to initials silently.
- What happens when a user updates their avatar mid-session? → Cached value remains until session ends; stale avatar for the current session is acceptable.
- What happens when comments are posted by deleted accounts (authorId has no user document)? → Cache stores null, comment shows initials using the stored display name from the comment document.
- What happens on a page with 0 comments? → Cache is not queried; no reads occur.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST maintain a shared in-memory user profile cache, keyed by user ID, available to all components within a session.
- **FR-002**: The cache MUST return a stored profile immediately when a user ID has been previously fetched, without triggering a new database read.
- **FR-003**: The cache MUST fetch from the database exactly once per user ID per session on first access (cache miss).
- **FR-004**: The cache MUST store a null/empty sentinel value for user IDs that have no corresponding profile document, to prevent repeated failed lookups.
- **FR-005**: The cache MUST be accessible via a composable or shared service so any component can use it without duplicating fetch logic.
- **FR-006**: Each comment MUST display the commenter's avatar image when one is available in the user profile cache.
- **FR-007**: Each comment MUST fall back to displaying the commenter's initials (existing behavior) when no avatar is available in cache.
- **FR-008**: Avatar resolution in comments MUST use the cache (FR-001 through FR-005) — direct per-comment database reads for avatar data are not permitted.
- **FR-009**: The cache scope is the browser session — it does not need to survive page refreshes.

### Key Entities

- **User Profile Cache Entry**: A cached record keyed by user ID containing avatar URL (nullable) and display name. Represents a snapshot of a user's public profile data as of the first fetch in the current session.
- **Comment**: Existing entity. Has `authorId` (user ID) and `author` (display name string). The display name is already denormalized on the comment document — the cache enriches the avatar field only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A build order page with N comments from M distinct authors triggers exactly M user profile database reads on initial load, regardless of N.
- **SC-002**: A second visit to the same page within the same session triggers 0 additional user profile database reads (all M users already cached).
- **SC-003**: Comments from users with avatars display avatar images within the same render cycle as the comment text — no visible loading flash after the comment appears.
- **SC-004**: The fallback to initials works for 100% of comments where no avatar is available — no broken image states are visible to users.

## Assumptions

- Avatar images are stored as URLs in the `avatar` field of the user document (`users/{uid}.avatar`) — this field already exists based on the current `userService.js`.
- Display names are already denormalized on comment documents (`comment.author`) — the cache only needs to supply the avatar URL, not the name.
- Cache lifetime is the browser session (no persistence to localStorage or IndexedDB required for v1).
- Cache invalidation within a session is out of scope — a stale avatar for the current session is acceptable given the low frequency of avatar changes.
- The cache is used read-only by the comments display; writing to the cache happens only as a side effect of fetches, not via explicit invalidation calls.
- The feature covers the comments section specifically; other locations (e.g., build author line, leaderboards) may benefit from the same cache but are out of scope for this feature.
