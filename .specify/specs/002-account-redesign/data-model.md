# Data Model: Account Page Redesign & User Avatars

**Feature**: `002-account-redesign` | **Date**: 2026-06-02

---

## 1. Firestore — `users/{uid}` document

**Existing fields** (unchanged):
```js
{
  email: string,   // set on account creation
  id:    string,   // Firebase Auth UID
}
```

**New field added by this feature**:
```js
{
  avatar: {
    type: 'initials' | 'civ' | 'upload',
    ref:  string | null,
    // For type='civ':    ref = civilization shortName (e.g. 'ENG', 'FRE')
    // For type='upload': ref = Firebase Storage download URL
    // For type='initials': ref = null (derived from display name at render time)
  }
}
```

**Constraints**:
- `avatar.type` MUST be one of the three literal strings above.
- `avatar.ref` for `civ` MUST be a valid `shortName` from `civDefaultProvider.js`.
- `avatar.ref` for `upload` MUST be a Firebase Storage download URL under `avatars/{uid}.webp`.
- If the `avatar` field is absent (existing users), treat as `{ type: 'initials', ref: null }`.

**Firestore security rule addition**:
```
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if request.auth.uid == userId
               && request.resource.data.keys().hasOnly(['email', 'id', 'avatar']);
}
```

---

## 2. Firebase Storage — `avatars/{uid}.webp`

**Path**: `avatars/{uid}.webp` — one file per user, overwritten on re-upload.

**Constraints**:
- MUST be `image/webp` or `image/jpeg` (enforced by Storage rule metadata check).
- MUST be ≤ 200 KB (enforced by Storage rule `request.resource.size` check as backstop).
- Client-side enforces 256×256 px resize before upload.

**Storage security rule**:
```
match /avatars/{userId}.webp {
  allow read:  if true;                          // public read (avatar URLs are embedded)
  allow write: if request.auth != null
               && request.auth.uid == userId
               && request.resource.size < 200 * 1024
               && request.resource.contentType.matches('image/.*');
}
```

---

## 3. Vuex — `userAvatar` state slice

```js
// state
userAvatar: { type: null, ref: null },

// mutation
setUserAvatar(state, payload) {
  state.userAvatar = payload ?? { type: null, ref: null };
},

// actions
async loadUserAvatar({ commit }, uid) {
  const profile = await getUserProfile(uid);   // userService.js
  commit('setUserAvatar', profile?.avatar ?? null);
},

async updateAvatar({ commit, state }, { type, ref }) {
  await updateUserAvatar(store.state.user.uid, { type, ref });  // userService.js
  commit('setUserAvatar', { type, ref });
},
```

Loaded in `onAuthStateChanged` alongside `userFavorites`. Cleared (set to `null`) on logout.

---

## 4. `useAvatar(userAvatar, user)` composable

**Input**: reactive `userAvatar` from store + reactive `user` from store.

**Output**:
```js
{
  src:      computed → string | null,   // image URL or null (show initials)
  initials: computed → string,          // 2-char uppercase from display name
}
```

**Resolution logic**:
```js
src = computed(() => {
  if (!userAvatar.value?.type || userAvatar.value.type === 'initials') return null;
  if (userAvatar.value.type === 'civ') {
    const civ = civs.value.find(c => c.shortName === userAvatar.value.ref);
    return civ ? civ.flagSmall : null;  // falls back to initials if civ not found
  }
  if (userAvatar.value.type === 'upload') return userAvatar.value.ref;  // Storage URL
  return null;
});

initials = computed(() => {
  const name = user.value?.displayName ?? '';
  return name.slice(0, 2).toUpperCase() || '?';
});
```

---

## 5. `userService.js` functions

```js
// src/composables/data/userService.js
getUserProfile(uid)          → Promise<{ email, id, avatar? }>
updateUserAvatar(uid, avatar) → Promise<void>   // Firestore updateDoc
```

No new Firestore collection — operates on existing `users` collection.
