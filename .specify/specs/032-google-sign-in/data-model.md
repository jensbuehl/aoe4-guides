# Data Model: Sign in with Google

**Feature**: 032-google-sign-in | **Date**: 2026-08-11

The short version: **nothing is added to Firestore.** No collection, no field, no
index, no rule change, no migration. What changes is who writes an existing field
and what the client derives from data it already holds.

---

## Stored — and unchanged

### `users/{uid}`

| Field | Written by | Change in this feature |
|---|---|---|
| `email` | `createUser` auth trigger (Admin SDK) | none — the trigger is provider-agnostic and fires for Google accounts already |
| `id` | same trigger | none |
| `displayName` | `updateUserDisplayName` callable (Admin SDK) | **a second caller**, the Google path. The field, its writer and its rules are untouched |
| `avatar` | the client, via `updateUserAvatar` | none. It is never populated from a Google `photoURL` — see *Derived, deliberately not stored* below |

The Firestore rules let the owner write this document
([firestore.rules:41-44](../../../firestore.rules)), but `displayName` in practice
arrives only through the callable, and this feature keeps it that way.

### `contributors/{uid}`

| Field | Written by | Change in this feature |
|---|---|---|
| `authorId` | `createContributor` auth trigger | none |
| `displayName` | `updateContributorDisplayName` callable | **a second caller**, as above |
| `icon` | the client, restricted by rule to the `icon` key alone | none |
| `boCount`, `viewCount` | the client, publicly, restricted to those two keys | none |

Worth restating because it constrains the design: the rules deliberately forbid
the client from writing `displayName` here
([firestore.rules:52-56](../../../firestore.rules)). That is why the display-name
step must go through the callable rather than a direct write, and why the name
cannot be saved optimistically before the round trip returns.

### `favorites/{uid}`

| Field | Written by | Change in this feature |
|---|---|---|
| `favorites` | the client (owner only) | the *creation* call becomes safe to repeat. The document's shape does not change |

`createUserFavorites` currently writes `{ favorites: [] }` unconditionally. Once
account setup can run more than once (R-7), that would erase a list on a second
run. It must not overwrite an existing document.

---

## Held by Firebase Auth, read but never written by us

These live on the auth record, arrive on `user.toJSON()`, and are already in
`store.state.user`. The feature reads three of them that nothing read before.

| Field | Meaning here | Newly read by |
|---|---|---|
| `providerData[].providerId` | `"password"`, `"google.com"`, or both. The answer to "how does this person sign in" | the account page (FR-012, FR-013), the completeness test (R-6), the re-auth branch (R-10) |
| `emailVerified` | `true` from the first moment for a Google account, which is the whole point of the feature | already read everywhere; unchanged, and now satisfied by a new population |
| `displayName` | Firebase copies Google's profile name here at account creation, then our callable overwrites it with the name the user chose | **never read.** Not to pre-fill the name field (FR-007d — it is a real name, and this field feeds `build.author`), and not to decide whether the account is finished, which is the trap below. It is written, not consulted |
| `photoURL` | Google's profile picture | **never read.** Listed so the omission is visible rather than accidental |

---

## Derived, not stored

### Account completeness

> **An account is incomplete when it has a `google.com` provider and its
> `users/{uid}` document has no `displayName`.**

This is the single most important sentence in the feature, so its two clauses each
carry their reason:

- **`users/{uid}.displayName` is missing** — because that field is written only by
  our callable, never by a trigger and never by Firebase, so its presence means
  precisely "this person chose a name through our flow". The obvious alternative,
  an empty `auth.currentUser.displayName`, never fires: Firebase populates it from
  the Google profile at creation, so it is full from the first millisecond.
- **and the account has a Google provider** — because password accounts predate
  the `createUser` function and some have no `users/{uid}` document at all
  ([userService.js:10-12](../../../src/composables/data/userService.js)). Without
  this clause, long-standing authors would be ambushed by a name prompt for an
  account they finished years ago.

It costs no read. `onAuthStateChanged` already dispatches `loadUserAvatar`, which
already fetches `users/{uid}` through `getCachedUserProfile`
([store/index.js:376-397](../../../src/store/index.js)); the test reads a second
field off a document already in hand.

### Sign-in methods

Derived from `providerData`, not stored:

| Derived value | Definition | Used for |
|---|---|---|
| `hasPassword` | `providerData.some(p => p.providerId === "password")` | showing or hiding the password card (FR-012) |
| `hasGoogle` | `providerData.some(p => p.providerId === "google.com")` | the completeness clause above; the re-auth branch |
| `signInMethodLabel` | derived from the two | the account page's "you sign in with…" row (FR-013) |

An account can hold both — not because this feature links anything (it explicitly
does not, FR-011a) but because Firebase itself may replace the password provider
on an unverified address, or leave both in place. The derivation handles the pair
without the feature ever creating one.

### Avatar

Unchanged, and stated because a reader will wonder. `useAvatar` resolves from
`users/{uid}.avatar` — `{type, ref}`, one of *initials*, *civ* or *upload*
([useAvatar.js:9-17](../../../src/composables/auth/useAvatar.js)). It has no branch
for a remote profile photo and gains none. A new Google user starts on initials,
exactly like a new password user, and changes it through the existing picker.

---

## Client state (Vuex)

| Path | Change |
|---|---|
| `state.user` | none structurally — it is already `user.toJSON()`, which carries `providerData`. Three of its fields simply get read now |
| `state.ui.authDialog.mode` | gains a fourth value, `"complete-profile"`, beside `login`, `register`, `reset` |
| `state.cache.userProfiles[uid]` | none. The completeness test consumes what is already cached here; it must be read *after* the profile resolves, not racing it |

---

## State transitions

An account's lifecycle, with the new path marked:

```text
                    ┌─────────────────────────────────────────┐
   register ───────▶│  exists, unverified, setup complete     │
   (password)       │  → gated: cannot publish until verified │
                    └──────────────────┬──────────────────────┘
                                       │ clicks the email link
                                       ▼
                    ┌─────────────────────────────────────────┐
                    │  exists, verified, setup complete       │──▶ can publish
                    └─────────────────────────────────────────┘
                                       ▲
                                       │ name chosen → callables succeed
                                       │
   Continue    ┌──────────────────────────────────────────────┐
   with     ──▶│  NEW: exists, verified, setup INCOMPLETE      │
   Google      │  authenticated but nameless in our records    │
               │  → the dialog is open and persistent          │
               └──────────────────┬───────────────────────────┘
                                  │ tab closed / connection lost
                                  ▼
               ┌──────────────────────────────────────────────┐
               │  still incomplete — and detected as such on   │
               │  the NEXT sign-in, from users/{uid} (R-6)     │
               └──────────────────────────────────────────────┘
```

The incomplete state is the only new one, and the loop out of the bottom box is
the reason it is safe to introduce. An account can sit there indefinitely without
ever appearing publicly, because nothing publishes a build for a user who has not
named themselves (FR-007b).

---

## What deliberately has no model

- **A "linked accounts" record.** Linking is out of scope (FR-011a). Firebase's
  own `providerData` is the only place sign-in methods are recorded, and this
  feature adds no shadow copy of it in Firestore.
- **A pending-signup record.** The incomplete state lives entirely in Firebase
  Auth plus the *absence* of a Firestore field. Writing a "signup in progress"
  document would create a second thing that can go stale, and would need its own
  clean-up when it does.
- **Anything about the collision.** Which branch a colliding address took is not
  recorded; the user is told at the moment it happens and the account carries the
  result in `providerData` afterwards.
