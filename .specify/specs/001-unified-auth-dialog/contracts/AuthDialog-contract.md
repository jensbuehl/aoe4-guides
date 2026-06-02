# Component Contract: AuthDialog.vue

**Path**: `src/components/account/AuthDialog.vue`
**Feature**: `001-unified-auth-dialog`

This is a globally-mounted modal with no props and no emits — it is driven entirely
through Vuex. Any component or router code interacts with it via the store actions below.

---

## Vuex Interface (public contract)

### Reads from store

| Path | Type | Description |
|---|---|---|
| `store.state.ui.authDialog.visible` | `boolean` | Bound to `v-dialog` `v-model` |
| `store.state.ui.authDialog.mode` | `'login'\|'register'\|'reset'` | Controls which form is rendered |
| `store.state.ui.authDialog.redirect` | `string\|null` | Post-login navigation target |
| `store.state.user` | `object\|null` | Used to guard against opening when already authenticated |

### Dispatches to store

| Action | Payload | When |
|---|---|---|
| `closeAuthDialog` | — | Close button, Esc, scrim click, successful auth |
| `signin` | `{ email, password }` | Login form submit |
| `signup` | `{ email, password, displayName }` | Register form submit |
| `resetPassword` | `{ email }` | Reset form submit |
| `showSnackbar` | `{ text, type }` | After successful auth or reset |

---

## How to open the dialog (caller contract)

```js
// Open in login mode (default)
store.dispatch('openAuthDialog')

// Open in register mode
store.dispatch('openAuthDialog', { mode: 'register' })

// Open in login mode with post-login redirect
store.dispatch('openAuthDialog', { mode: 'login', redirect: '/mybuilds' })

// Open in reset mode
store.dispatch('openAuthDialog', { mode: 'reset' })
```

---

## Route shim contract

Each retired view file becomes a shim with this pattern:

```js
// e.g. Login.vue shim
setup() {
  const store = useStore()
  const route = useRoute()
  const router = useRouter()
  const redirect = route.query.redirect || null
  store.dispatch('openAuthDialog', { mode: 'login', redirect })
  router.replace('/')
}
```

The shim renders no template markup (empty `<template></template>`).

---

## Mounting contract

`AuthDialog.vue` is mounted **once** in `App.vue`, adjacent to the existing `Snackbar`:

```html
<!-- App.vue -->
<Header />
<RouterView />
<Footer />
<Snackbar />
<AuthDialog />   <!-- globally mounted; visibility controlled by Vuex -->
```

---

## Behavior contract

| Trigger | Expected behavior |
|---|---|
| `openAuthDialog({ mode: 'login' })` | Dialog opens showing Log in form |
| `openAuthDialog({ mode: 'register' })` | Dialog opens showing Create account form |
| `openAuthDialog({ mode: 'reset' })` | Dialog opens showing Reset password form |
| Click scrim / press Esc / click ✕ | Dialog closes; redirect cleared; form state preserved in memory until unmount |
| Switch mode via footer link | Form morphs; `authError` cleared; `email`+`password` preserved |
| Successful login (no redirect) | Dialog closes; success snackbar shows; no route change |
| Successful login (with redirect) | Dialog closes; success snackbar shows; `router.push(redirect)` |
| Successful register | Dialog closes; "Verification email sent" snackbar; no route change |
| Successful reset request | Snackbar shows; dialog returns to login mode |
| Auth error | `authError` set to friendly mapped string; displayed in dialog-level banner |
| `auth/email-already-in-use` | Banner shows + "Log in instead" text button → `switchMode('login')` |
