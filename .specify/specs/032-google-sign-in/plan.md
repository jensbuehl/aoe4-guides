# Implementation Plan: Sign in with Google

**Branch**: `032-google-sign-in` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.specify/specs/032-google-sign-in/spec.md`

## Summary

Add **Continue with Google** beside the existing email-and-password form, so a
new author can go from stranger to published build in one sitting — no invented
password, and no email round trip, because a Google address arrives already
proven.

The technical approach in one line: **the client already reads everything this
feature needs to know, so the work is reacting correctly rather than fetching
more.** Whether an account is finished is answered by a field on a document the
store already loads on every sign-in (R-6). Whether an address collides is
answered by the error Firebase already throws, not by asking first (R-4). Whether
a user signs in with a password is answered by `providerData`, already on the
user object in the store.

Two things are genuinely new, and all of the feature's risk sits in them:

1. **Account completion becomes a state, not a step.** Today registration runs a
   `.then()` chain that nobody retries. Asking a Google user to choose a display
   name introduces a moment they can walk away from, so "is this account
   finished?" has to be a question the app can ask on any later sign-in and act
   on. That turns the chain into one idempotent, resumable
   `completeAccountSetup()` — which repairs the existing path as a side effect
   (R-7).
2. **The collision with an existing account.** An address that already has a
   password behaves one of two ways depending on whether it was ever verified,
   and one of those two silently removes a live account's password. That is
   verified against the real project **before** the branch is written (R-3), not
   assumed from documentation.

One thing that looks new and is not: nothing about avatars changes. The avatar
system reads `users/{uid}.avatar`, never `photoURL`, so a Google profile picture
is ignored by construction and FR-019 is satisfied by writing no code (R-7 aside,
this is the only requirement met by omission).

## Technical Context

**Language/Version**: JavaScript (ES2022), Vue 3 with `setup()`, Vuex 4

**Primary Dependencies**: `firebase` ^10.14.0 — already present. **No new
dependency**: `GoogleAuthProvider`, `signInWithPopup`, `reauthenticateWithPopup`
and `getAdditionalUserInfo` are exports of the `firebase/auth` module the project
already imports from

**Storage**: Cloud Firestore — **no schema change, no migration, no new
collection**. `users/{uid}.displayName` and `contributors/{uid}.displayName`
already exist and are already written by the two callables; this feature adds a
second caller, not a second field

**Backend**: no new Cloud Function. `updateUserDisplayName`,
`updateContributorDisplayName` and the `createUser`/`createContributor` auth
triggers all fire for a Google account exactly as they do today — the triggers
because they are provider-agnostic, the callables because we call them

**Testing**: manual golden path per [quickstart.md](./quickstart.md);
`npm run check:setup` and `npm run build` as static gates; the `comm` icon check
from `CLAUDE.md`. No `check:steps` — this feature never reads a build

**Target Platform**: Browser — desktop, mobile web, and at least one real in-app
browser (Discord or the Reddit app), which is the only place US4 can be honestly
tested

**Performance Goals**: no additional Firestore read on any path — the
completeness test rides the profile read that already happens on every sign-in
(R-6). One extra HTTP round trip on first-time Google sign-up: the two callables,
which registration already pays today

**Constraints**: `signInWithPopup` must be called synchronously inside the click
handler or the popup is blocked for everyone (R-2). No new colour or component
vocabulary. Email-and-password stays a first-class path (FR-002)

**Scale/Scope**: four source files changed, one composable added, one static asset
added, three Firebase console settings. ~4k existing accounts, a large share of
them on Gmail addresses and therefore candidates for the collision path on day one

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|---|---|
| **I. Simplicity First** | **Pass.** No new dependency — the provider ships inside the `firebase` package already installed. Account linking, the one genuinely complex piece of this territory, is explicitly out of scope (FR-011a) and deferred to a follow-up where the user is already authenticated and it costs a fraction as much. The one new abstraction, `completeAccountSetup()`, is extracted because a second caller appeared, not in anticipation of one (R-7). |
| **II. Incremental Quality** | **Pass, and it pays two debts.** The registration `.then()` chain becomes idempotent and retryable (R-7). The likes-are-never-decremented bug in `deleteAccount` (R-10) was found while planning and is fixed by reordering two statements in a function this feature already has to edit. Both land as their own commits, before the feature is wired up, so the repairs are separable from the addition. |
| **III. Consistent UX & Component Reuse** | **Pass.** The name step is a fourth mode of the existing `AuthDialog`, reusing its scaffolding and its `displayNameRules`, rather than a second dialog (R-5). The Google mark is served from `public/assets/` and drawn with `v-img`, the same way civilisation flags already are (R-8). Errors go through the existing `mapAuthError`; messages go through the existing snackbar. |
| **IV. Cost-Conscious Infrastructure** | **Pass.** Zero additional Firestore reads: the account-completeness test reads a second field off a document `loadUserAvatar` already fetches (R-6). No new Cloud Function, no new query, no new index. On a project already at 2.7× the free read tier, a design that answered the same question with its own read would have been the wrong one. |
| **V. Secure Defaults** | **Pass, with the sensitive part removed rather than solved.** Firebase Auth stays the single source of truth. `displayName` still reaches `users/` and `contributors/` only through the Admin-SDK callables — the Firestore rules keep the client out of both fields ([firestore.rules:52-56](../../../firestore.rules)), so nothing about this feature loosens a rule. Account enumeration is avoided by detecting the collision from the thrown error instead of `fetchSignInMethodsForEmail` (R-4). Linking two sign-in methods — the operation in this area that can join two people's data — is not implemented at all. |

**Gate result: PASS.** No violations, so Complexity Tracking is omitted.

**Re-check after Phase 1 design: PASS.** The design added one composable, one
dialog mode and one static asset; `data-model.md` records no persisted change and
`contracts/` introduces no new interface to Firestore or Functions. Two things are
flagged rather than hidden. First, R-3's unverified-collision branch is behaviour
this project does not control and the plan gates coding on verifying it — a
Principle V matter, because it silently changes how a live account authenticates.
Second, R-10 scopes in a bug fix in a function the feature must touch anyway;
doing the deletion clean-up *properly*, server-side in the `onDelete` trigger,
remains the TODO it already is and is now cross-referenced from the research
rather than left as a bare comment.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/032-google-sign-in/
├── spec.md              # The feature specification
├── plan.md              # This file
├── research.md          # Phase 0 — ten decisions
├── data-model.md        # Phase 1 — what is stored, what is derived, what is not stored
├── quickstart.md        # Phase 1 — console pre-flight, then the golden paths by hand
├── contracts/
│   ├── auth-store-contract.md      # The store actions the UI may call, and what they promise
│   └── auth-dialog-contract.md     # The dialog's four modes and what each may do
├── checklists/
│   └── requirements.md  # Spec quality gate (passed)
└── tasks.md             # Phase 2 output — NOT created by /speckit-plan
```

### Source Code (repository root)

```text
src/
├── firebase/
│   └── index.js                          # + GoogleAuthProvider, signInWithPopup,
│                                         #   reauthenticateWithPopup, getAdditionalUserInfo
├── store/
│   └── index.js                          # + signinWithGoogle, completeProfile actions;
│                                         #   completeness check in onAuthStateChanged;
│                                         #   signup + deleteAccount reworked
├── composables/
│   ├── auth/
│   │   ├── useAccountSetup.js            # NEW — completeAccountSetup(), the idempotent chain
│   │   └── useAuthErrors.js              # + the Google error codes, in player language
│   └── data/
│       └── favoriteService.js            # createUserFavorites made safe to call twice
├── components/
│   └── account/
│       └── AuthDialog.vue                # + Google button; + "complete-profile" mode
└── views/
    └── account/
        └── Account.vue                   # sign-in method shown; password card gated

public/
└── assets/
    └── google-g.svg                      # NEW — the official mark, drawn with v-img

# Unchanged, and worth stating: functions/ gains nothing. The auth onCreate
# triggers and both display-name callables already serve a Google account.
```

**Structure Decision**: no new layer. Auth logic already lives in three places —
`src/firebase/index.js` re-exports the SDK surface, `src/store/index.js` owns the
actions and the auth-state subscription, and `src/composables/auth/` holds the
small helpers — and this feature adds to each of them in the shape they already
have. The one new file, `useAccountSetup.js`, sits beside `useAuthErrors.js` and
`useVerificationGuard.js` because it is the same kind of thing: logic the store
calls that has no business being inline in the store.

## Implementation Sequence

Five phases. The order is chosen so that each one is separately verifiable and
so that the two riskiest unknowns are settled before anything depends on them.

**Phase 0 — Console pre-flight and the R-3 experiment.** Enable the provider,
check the linking setting, add the authorised domains, then sign into two
throwaway accounts (one verified, one not) with Google and *write down what
actually happened*. No code. Everything downstream assumes an answer here.

**Phase 1 — The two repairs, as their own commits.** Extract
`completeAccountSetup()` and point the existing `signup` at it; make
`createUserFavorites` safe to call twice; reorder `deleteAccount` so the
decrements happen while the user still exists. All three are verifiable against
the *current* feature set, with no Google anywhere — which is exactly why they go
first.

**Phase 2 — US1, the happy path.** The asset, the button, the store action, the
`complete-profile` mode, and the completeness check in `onAuthStateChanged`. At
the end of this phase a new Google user can publish, and an abandoned name step
is picked up on the next sign-in.

**Phase 3 — US2, the collision.** Both branches from Phase 0's findings, the new
error codes, and the return-to-log-in behaviour with the address pre-filled.
Separate from Phase 2 because it is where an *existing* user's account is at
stake, and it deserves its own careful pass.

**Phase 4 — US3 and US4, the truthful surfaces.** The account page's sign-in
method row and gated password card, the re-auth branch on delete, and the plain
language for every failure path. Last because none of it blocks a first sign-in,
and all of it is judged by reading rather than by mechanism.

## Risks

| Risk | Where it bites | Mitigation |
|---|---|---|
| The popup is blocked because an `await` slipped in ahead of it | Everywhere, but only in strict browsers — the dev tab hides it | R-2 is a contract in [auth-store-contract.md](./contracts/auth-store-contract.md), not a note; the action takes no async step before the call |
| The unverified-collision branch behaves differently than documented | A live account silently loses its password | Phase 0 settles it empirically before a line is written (R-3) |
| A user abandons the name step and appears nameless in public lists | Top Contributors, author pages, published builds | The completeness check runs on *every* sign-in, not just the first (R-6); FR-007b |
| Deploy previews fail with `auth/unauthorized-domain` | Testing, and it reads like a code bug | Named in R-9; add the preview domain during Phase 0 |
| In-app browsers cannot open the popup at all | Discord and Reddit traffic, which is a lot of this site's | US4 is scoped in, and quickstart requires a real in-app browser rather than a simulated block |
