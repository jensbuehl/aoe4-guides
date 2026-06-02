# Data Model: Unified Authentication Dialog

**Feature**: `001-unified-auth-dialog` | **Date**: 2026-06-02

No new Firestore entities or schema changes. This document captures the two
in-memory structures introduced by this feature.

---

## 1. Vuex UI State — `store.state.ui.authDialog`

Added to the existing flat Vuex state under a new `ui` namespace.

```js
// Type definition
{
  visible:  boolean,          // controls v-dialog v-model
  mode:     'login'           // which form the dialog shows
          | 'register'
          | 'reset',
  redirect: string | null,    // route path to navigate to after successful login
                              // null = stay on current page (close only)
}
```

**Initial value**:
```js
ui: { authDialog: { visible: false, mode: 'login', redirect: null } }
```

**Constraints**:
- `mode` MUST be one of the three literal strings above; defaults to `'login'`.
- `redirect` is cleared (set to `null`) by `closeAuthDialog()` on every close,
  including user-initiated closes (Esc, scrim, close button) — prevents stale
  redirects if the user dismisses without authenticating.
- `redirect` is only acted upon after *successful* login (not registration or reset).

**Mutations / Actions** (see design-notes.md §5 for full code):

| Name | Signature | Effect |
|---|---|---|
| `setAuthDialog` | `(state, payload)` | Shallow-merges payload into `ui.authDialog` |
| `openAuthDialog` | `({ commit }, { mode?, redirect? })` | Sets `visible: true`, mode, redirect |
| `closeAuthDialog` | `({ commit })` | Sets `visible: false, redirect: null` |

---

## 2. AuthDialog Local Form State

Internal to `AuthDialog.vue` — never persisted or shared.

| Field | Type | Modes present | Notes |
|---|---|---|---|
| `email` | `string` | all | Preserved across mode switches |
| `password` | `string` | login, register | Preserved across login↔register switch; cleared on → reset |
| `displayName` | `string` | register only | Cleared when leaving register mode |
| `showPassword` | `boolean` | login, register | Toggle for password visibility |
| `loading` | `boolean` | all | True while async auth request in flight |
| `authError` | `string \| null` | all | Friendly mapped error string; cleared on mode switch |

**Validation rules** (defined in component, sourced from design-notes.md §3):

| Rule set | Applied to | Condition |
|---|---|---|
| `emailRules` | email field | all modes |
| `passwordLoginRules` | password field | login mode |
| `passwordRegisterRules` | password field | register mode (min 6 chars) |
| `displayNameRules` | displayName field | register mode (min 3 chars, trimmed) |

---

## 3. Existing Entities (unchanged)

| Entity | Owner | Change |
|---|---|---|
| Firebase Auth user | Firebase Auth | None — `signin`/`signup` actions reused as-is |
| Firestore `users/{uid}` | Vuex `createUser` cloud function | None |
| Firestore `favorites/{uid}` | `createUserFavorites` on signup | None |
