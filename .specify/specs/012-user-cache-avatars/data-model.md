# Data Model: User Profile Cache with Comment Avatars

## Cache Entry: `state.cache.userProfiles[uid]`

The Vuex store cache is extended with a new `userProfiles` object. Each key is a user UID;
each value is either `null` (sentinel for "fetched but not found") or a profile snapshot.

```
userProfiles: {
  [uid: string]: UserProfileCacheEntry | null
}
```

### `UserProfileCacheEntry`

| Field       | Type                        | Nullable | Description                                      |
|-------------|-----------------------------|----------|--------------------------------------------------|
| `avatar`    | `AvatarConfig \| null`      | Yes      | Avatar config from `users/{uid}.avatar`          |
| `displayName` | `string \| null`          | Yes      | Display name from `users/{uid}.displayName`      |

### `AvatarConfig` (existing shape — unchanged)

| Field  | Type     | Values                      | Description                                      |
|--------|----------|-----------------------------|--------------------------------------------------|
| `type` | `string` | `"civ"`, `"upload"`, `"initials"` | How to render the avatar                   |
| `ref`  | `string \| null` | —                   | Civ shortName or uploaded image URL              |

## State Shape (store addition)

```javascript
// Existing state.cache object — new field only:
cache: {
  // ... existing fields (builds, popularBuildsList, etc.) ...
  userProfiles: {},   // uid → UserProfileCacheEntry | null
}
```

## Store Mutation

**`setUserProfile(state, { uid, profile })`**

Writes a profile entry (or null sentinel) into `state.cache.userProfiles`.

```javascript
setUserProfile(state, { uid, profile }) {
  state.cache.userProfiles[uid] = profile;  // profile is UserProfileCacheEntry | null
}
```

## Store Action

**`getCachedUserProfile({ commit, state }, uid)`**

Returns a Promise resolving to `UserProfileCacheEntry | null`. Checks cache first; fetches
on miss; coalesces concurrent in-flight requests for the same uid.

```
1. If state.cache.userProfiles[uid] !== undefined → return cached value immediately
2. If pendingFetches.has(uid) → return existing Promise (deduplication)
3. Create fetch Promise:
   a. Call getUserProfile(uid) from userService
   b. Commit setUserProfile({ uid, profile: result ?? null })
   c. Delete uid from pendingFetches
   d. Resolve with profile
4. Store Promise in pendingFetches
5. Return Promise
```

## Relationship to Comment Document

The `Comment` document already stores a denormalized `author` (display name string) and
`authorId` (uid). The cache enriches the comment with avatar data at render time — the
comment document itself is not modified.

```
Comment document            User Profile Cache
─────────────────           ─────────────────────────
authorId: "abc123"    →     userProfiles["abc123"]
author: "PlayerOne"         { avatar: { type: "upload", ref: "https://..." },
text: "..."                   displayName: "PlayerOne" }
buildId: "..."
```
