# Implementation Plan: Unified Authentication Dialog

**Branch**: `001-unified-auth-dialog` | **Date**: 2026-06-02 | **Spec**: `specs/001-unified-auth-dialog/spec.md`

**Input**: Feature specification from `specs/001-unified-auth-dialog/spec.md`

## Summary

Replace the three standalone auth pages (`views/account/Login.vue`, `Register.vue`, `ResetPassword.vue`) with one shared, in-context modal — `AuthDialog.vue` — that toggles between Log in, Create account, and Reset password via text links. Dialog visibility/mode is held in Vuex UI state so the header and the `/login` / `/register` / `/resetpassword` route guards can open it. The dialog reuses the existing `signin` / `signup` / `sendPasswordResetEmail` flows unchanged and adds the missing UX layer: inline validation, friendly error mapping, password visibility, and submit loading state. Completing a reset from the emailed link stays its existing out-of-band route (`AccountAction.vue`). No backend, schema, or security-rule changes.

## Technical Context

**Language/Version**: JavaScript (ES2022), Vue 3.2 SFCs (Options/Composition mix as in repo)

**Primary Dependencies**: Vue 3, Vuetify 3.8 (`v-dialog`, `v-card`, `v-form`, `v-text-field`, `v-btn`), Vuex 4, Firebase Auth 10 (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `sendPasswordResetEmail`), Vue Router 4, `@mdi/font`

**Storage**: Firebase Auth (identity) + Firestore (`userFavorites` created on signup) — reused, unchanged

**Testing**: No automated suite in repo; manual golden-path testing per Constitution Development Workflow

**Target Platform**: Web (desktop + mobile breakpoints), Netlify-hosted SPA

**Project Type**: Web frontend (single `src/` Vue app)

**Performance Goals**: Dialog open/switch is instant (client-only state); no added bundle deps

**Constraints**: Vuetify components only (no custom UI primitives); honor light/dark themes and `prefers-reduced-motion`; preserve `/login` deep link used by verification emails and the `/resetpassword` reset-request link; do not touch the emailed-link reset-completion route (`AccountAction.vue`)

**Scale/Scope**: 1 new component (3 modes), 1 small Vuex UI module, 1 composable (error map + open helper), edits to `Header.vue`, `App.vue`, router, and removal/retirement of three view files (`Login.vue`, `Register.vue`, `ResetPassword.vue`). ~7–9 files.

## Constitution Check

*GATE: must pass before and after design.*

| Principle | Assessment |
|---|---|
| **I. Simplicity First** | ✅ Zero new dependencies. Reuses `signin`/`signup`. One component + a tiny store module + one composable. The error map is a plain object, not an abstraction layer. |
| **II. Incremental Quality** | ✅ Net deletion: two near-duplicate card templates collapse into one. Each step is an atomic Conventional Commit (`feat:`, `refactor:`). No broken windows. |
| **III. Consistent UX & Component Reuse** | ✅ Built entirely from Vuetify components; styling pulls existing theme tokens. The repeated auth-card pattern is extracted into a single shared component, exactly as the principle requires. |
| **IV. Cost-Conscious Infrastructure** | ✅ Frontend-only. No new Firestore reads/writes, no Functions, no Cloud Run. |
| **V. Secure Defaults** | ✅ Firebase Auth remains source of truth. No schema or `firestore.rules` changes (no review trigger). `/login` verification action link preserved. Authenticated users redirected off auth routes. |

**Result**: PASS — no violations, Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-unified-auth-dialog/
├── spec.md            # Feature spec
├── plan.md            # This file
├── tasks.md           # Task breakdown (by user story)
├── checklist.md       # Author self-review checklist
└── design-notes.md    # Mock → code bridge: copy, tokens, component API, error map
```

### Source Code (repository root)

```text
src/
├── App.vue                                  # mount <AuthDialog/> once (next to Snackbar)
├── main.js                                  # theme tokens (reference only, unchanged)
├── components/
│   └── account/
│       └── AuthDialog.vue                   # NEW — unified login/register modal
├── composables/
│   └── auth/
│       └── useAuthErrors.js                 # NEW — Firebase code → friendly message map
├── store/
│   └── index.js                             # ADD ui.authDialog state + open/close actions
├── components/
│   └── Header.vue                           # EDIT — single auth CTA → openAuthDialog('login')
├── router/
│   └── index.js                             # EDIT — /login,/register open dialog + auth redirect
└── views/account/
    ├── Login.vue                            # RETIRE — replaced by dialog (or thin redirect shim)
    ├── Register.vue                         # RETIRE — replaced by dialog
    ├── ResetPassword.vue                    # RETIRE — reset *request* folded into dialog (shim/redirect)
    └── AccountAction.vue                    # UNCHANGED — handles emailed reset/verify oobCode (stays a route)
```

**Structure Decision**: Single-project Vue frontend (Option 2 "frontend" only — there is no backend in this repo beyond Firebase Functions, which this feature does not touch). New UI lives under `src/components/account/`; cross-cutting auth-dialog state lives in the existing Vuex store as a small `ui` slice, mirroring the existing `showBottomNavigation` / `snackbar` patterns. The dialog is mounted once globally in `App.vue`, the same way the existing `Snackbar` is, so it is reachable from anywhere. The dialog owns three modes — login / register / reset — collapsing all three duplicated auth cards; the emailed-link reset-completion (`AccountAction.vue`) is intentionally left as a route since it is entered out-of-band.

### Key design decisions (from approved mock)

- **Switcher**: *link* variant — no tabs/segmented control. Title + form + a single footer link ("Don't have an account? Sign up" ⇄ "Already have an account? Log in"; "Back to log in" in reset mode).
- **Voice**: *plain* — "Log in" / "Create account" / "Reset password"; no "Villager" theming in copy.
- **Presentation**: dialog over a scrim (Vuetify `v-dialog`), not a route page — context is never lost.
- Exact copy strings, theme-token mapping, the component prop/event contract, and the full error-code map are specified in `design-notes.md` so implementation is mechanical.

## Complexity Tracking

> No Constitution violations — section intentionally empty.
