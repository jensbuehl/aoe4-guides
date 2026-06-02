# Research: Unified Authentication Dialog

**Feature**: `001-unified-auth-dialog` | **Date**: 2026-06-02

No `NEEDS CLARIFICATION` items existed in the Technical Context — the spec, design notes,
and approved mock together fully resolved all decisions before planning began. This document
records those decisions with rationale for traceability.

---

## Decision 1 — Single globally-mounted dialog vs. per-page instances

**Decision**: One `AuthDialog.vue` instance, mounted in `App.vue` next to `<Snackbar>`, controlled
entirely through Vuex UI state (`ui.authDialog.visible`, `.mode`, `.redirect`).

**Rationale**: Mirrors the existing `snackbar` pattern already in `store/index.js`. Any component
— header, route shim, protected-route guard — can dispatch `openAuthDialog()` without needing
a prop chain. A single instance means one DOM node, no duplication of Firebase listeners, and
correct focus-trap lifecycle from Vuetify's `v-dialog`.

**Alternatives considered**:
- Teleport-to-body per trigger site: more flexible but duplicates dialog state and creates race
  conditions when two callers mount simultaneously.
- Vue 3 `provide/inject` for dialog control: cleaner coupling than Vuex but harder to trigger
  from the router (which has no component context).

---

## Decision 2 — Three modes in one component vs. three separate dialogs

**Decision**: One `AuthDialog.vue` with an internal `mode` prop (`login | register | reset`).
Forms share the email field; password and display-name fields are shown/hidden with `v-if`.

**Rationale**: The three forms differ by only 1–2 fields and share the same layout, copy voice,
theme, error banner, and submit pattern. A single component with `v-if` branches is the simplest
possible implementation (Constitution P.I). It also makes `switchMode()` a local state flip
with no navigation, which is the approved UX direction.

**Alternatives considered**:
- Named `<slot>` or dynamic component: adds abstraction without benefit since the three forms
  are never rendered independently.
- Separate dialogs: would recreate the three-duplicate-card problem the feature is solving.

---

## Decision 3 — Vuex store for dialog state vs. local component state / composable

**Decision**: Vuex `ui.authDialog` slice (mirrors existing `snackbar` and `showBottomNavigation`
patterns). State shape: `{ visible: boolean, mode: 'login'|'register'|'reset', redirect: string|null }`.

**Rationale**: The dialog must be openable from the header (a sibling of the dialog), from route
shims (the router has no component context), and from a future "Log in to do X" inline prompt.
Vuex is already the project's state bus; adding a small slice is idiomatic and costs nothing
(Constitution P.IV). Local state would require prop-drilling or an event bus workaround.

**Alternatives considered**:
- `mitt` event bus: lighter but adds a dependency (P.I violation — Vuex already present).
- Vue 3 `reactive` singleton outside Vuex: no DevTools integration, harder to test.

---

## Decision 4 — Route shims for `/login`, `/register`, `/resetpassword`

**Decision**: Existing route components (`Login.vue`, `Register.vue`, `ResetPassword.vue`) are
converted to thin shims. Each `setup()` dispatches `openAuthDialog(mode, redirect)` and calls
`router.replace('/')`. The `guestOnly` router guard (already on `/login` and `/register`)
handles redirect-away for authenticated users; the shim handles unauthenticated visitors.

**Rationale**: Keeps the route files in place (no broken verification email links), retires all
template markup, and preserves the `/login?redirect=/mybuilds` flow from the route guard by
reading `route.query.redirect` before replacing history.

**Alternatives considered**:
- `beforeEnter` navigation guard on the route: cleaner but does not have access to the Vuex
  store without importing it directly — component shim is marginally simpler in this Vue 3 + Vuex 4 setup.
- Redirect all three routes to `/` via `redirect:` in the router config: loses the
  `?redirect` query parameter and the mode-specific dialog open.

---

## Decision 5 — Error mapping composable (`useAuthErrors.js`)

**Decision**: Plain exported function `mapAuthError(errOrCode)` in
`src/composables/auth/useAuthErrors.js`. Matches on substring of the error message or code.
Returns a friendly string; falls back to "Something went wrong. Please try again."

**Rationale**: Not a Vue composable (no reactive state), but lives in `composables/auth/` for
discoverability alongside future auth helpers. Using `includes()` substring match means it works
whether the store wraps the error in a string (`"Could not signin: auth/wrong-password"`) or
throws the raw Firebase error object — making it resilient to the existing store style without
requiring a store refactor (per design notes §4 optional cleanup note).

**Alternatives considered**:
- Inline `switch` in the component: couples error logic to the view; can't be shared.
- Pinia action-level error mapping: requires Pinia migration (out of scope).
