# Contract: Auth store surface

**Feature**: 032-google-sign-in

What the UI may call, what each call promises, and — for two of them — what the
implementation is forbidden from doing. The prohibitions are here rather than in a
code comment because both are invisible when violated: one fails only in strict
browsers, the other only for users who already have an account.

---

## `completeAccountSetup({ uid, displayName })` — new, `composables/auth/useAccountSetup.js`

Not a store action; a plain async function the store calls. The three-step chain
that turns an authenticated identity into a usable account.

| | |
|---|---|
| **Does** | calls `updateUserDisplayName` and `updateContributorDisplayName`, then ensures a `favorites/{uid}` document exists |
| **Returns** | resolves when all three have landed; rejects if the display-name callables fail |
| **Callers** | the password `signup` action, and the Google `completeProfile` action |

**MUST be idempotent.** Calling it twice on the same account leaves the same
result as calling it once. Concretely: `createUserFavorites` must not overwrite an
existing favourites list — a second run on an established account would erase it.
Both callables already `set(..., { merge: true })` and need no change.

**MUST reject rather than swallow.** The current chain lets a failed callable
disappear into a `.catch` that logs; the caller then believes setup succeeded. The
new function propagates, because R-6's completeness test is what retries it and it
can only do that if somebody noticed.

**MUST NOT be given a name the caller has not validated.** Validation stays with
the form (the existing `displayNameRules`), so this function trusts its argument.

---

## `signinWithGoogle()` — new store action

| | |
|---|---|
| **Does** | opens the Google sign-in popup and resolves the resulting session |
| **Resolves** | when the user is signed in. Account *completion* is not its job — `onAuthStateChanged` picks that up (see below) |
| **Rejects** | with a mapped, player-readable message for every failure path |

**MUST call `signInWithPopup` synchronously.** No `await` of anything — no App
Check token, no Firestore read, no other action — may precede the call within the
click handler. The browser only permits a popup while the user's gesture is still
being handled; an await ends the gesture and the popup is blocked. This fails for
*every* user, in *every* strict browser, and does not reproduce in a permissive
dev tab, which is what makes it worth a contract line. (R-2)

**MUST NOT call `fetchSignInMethodsForEmail`, before or after.** It is an account
enumeration oracle, Firebase is closing it down, and using it before the popup
would violate the rule above. Collisions are detected from the thrown error. (R-4)

**MUST distinguish cancellation from failure.** `auth/popup-closed-by-user` and
`auth/cancelled-popup-request` are the user changing their mind and MUST NOT
surface as errors (FR-017). Everything else gets a message.

**MUST leave nothing behind on failure.** No partial account, no orphaned
favourites record, no half-set display name (FR-018). This falls out of the
sequencing — nothing is written until the popup has resolved — but it is the
requirement being satisfied, so it is stated.

### Error codes this action must handle

| Code | Meaning | Behaviour |
|---|---|---|
| `auth/popup-closed-by-user` | the user closed the window | silent; dialog stays as it was |
| `auth/cancelled-popup-request` | a second popup superseded the first | silent |
| `auth/popup-blocked` | the browser refused to open it | explain, point at the email form (US4 §1) |
| `auth/account-exists-with-different-credential` | the address has a confirmed password | hand off to the collision path (FR-011) |
| `auth/network-request-failed` | connection lost mid-flow | existing message; user stays signed out |
| `auth/unauthorized-domain` | this origin is not authorised in the console | generic message to the user; this one is a deployment fault, not a user fault (R-9) |
| `auth/operation-not-allowed` | the provider is not enabled | generic message; also a deployment fault |

---

## `completeProfile({ displayName })` — new store action

| | |
|---|---|
| **Does** | runs `completeAccountSetup` for the signed-in user, then refreshes `state.user` so the chosen name is visible immediately |
| **Preconditions** | a user is signed in; the name has passed the form's rules |
| **Rejects** | leaving the dialog open and the account still incomplete — which is correct, because the next sign-in will ask again |

**MUST NOT close the dialog on failure.** An account that is still nameless must
keep asking.

---

## `signup({ email, password, displayName })` — existing, reworked

Behaviour unchanged from the user's side. Internally the `.then()` chain is
replaced by a call to `completeAccountSetup`, so the two paths cannot drift.

**MUST keep sending the verification email.** Password accounts are still gated on
verification; this feature loosens nothing for them (FR-002, and the spec's
assumption on confirmation).

---

## `deleteAccount()` — existing, reworked

| | |
|---|---|
| **Does** | withdraws the user's likes, removes their favourites document, then deletes the auth user |
| **New** | on `auth/requires-recent-login`, re-proves identity and retries once |

**MUST perform the Firestore clean-up before deleting the auth user.** Today it
deletes first, after which `request.auth` is null and the rules deny both the
favourites read and every like decrement — so likes outlive their deleted owner.
Reordering is the whole fix. (R-10)

**MUST branch the re-auth on provider.** Google accounts re-prove with a popup —
subject to the same synchronous-call rule as above, so it must be reachable from a
user gesture. Password accounts get a plain message asking them to sign out and
back in; an in-place password re-auth dialog is out of scope and named as a
follow-up.

---

## `onAuthStateChanged` handler — existing, extended

Runs on every page load and every sign-in. It already sets the user, reads the
admin claim, and dispatches `loadUserAvatar`.

**Adds one thing**: after the profile resolves, if the account is incomplete —
has a `google.com` provider **and** no `users/{uid}.displayName` — open the auth
dialog in `complete-profile` mode.

**MUST read completeness from the resolved profile, not race it.** The check
belongs after `loadUserAvatar`'s read settles; firing it against an unresolved
cache would prompt users who are perfectly complete.

**MUST NOT cost a read.** The profile fetch already happens here. The test reads a
second field off that same document. On a project at 2.7× the free read tier, a
per-sign-in read added for this would be the wrong trade. (R-6, Principle IV)

**MUST NOT fire for password-only accounts.** The provider clause is what protects
the pre-`createUser` accounts that have no `users/{uid}` document at all.
