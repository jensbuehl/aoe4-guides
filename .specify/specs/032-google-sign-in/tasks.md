---

description: "Task list for 032-google-sign-in"
---

# Tasks: Sign in with Google

**Input**: Design documents from `.specify/specs/032-google-sign-in/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/auth-store-contract.md](./contracts/auth-store-contract.md), [contracts/auth-dialog-contract.md](./contracts/auth-dialog-contract.md)

**Tests**: No formal test suite — the constitution asks for a manual golden path instead, and
[quickstart.md](./quickstart.md) is that path, gated per phase. Nothing here is worth a
`@vue/reactivity` harness: the logic is thin and the risk lives in the browser and in Firebase's
own behaviour, neither of which a harness reaches.

**Organization**: Grouped by user story so each is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel — **different files**, no dependency on incomplete work
- **[Story]**: US1…US4, mapping to the user stories in spec.md

> **[P] is rare here, and that is not an oversight.** Most of this feature lands in two files —
> `src/store/index.js` and `src/components/account/AuthDialog.vue`. Two tasks that both edit one
> of them are not parallel however unrelated they read, so [P] appears only where the files
> genuinely differ.

## Path Conventions

Vue 3 SPA, single project. Source under `src/`, static assets under `public/assets/`, Cloud
Functions under `functions/` (**untouched by this feature**). No `tests/` directory.

## Status — 2026-08-11

**26 of 35 done.** Every task that is code is written; `check:setup`, `npm run build` and the
icon check all pass. The console is configured — provider enabled with a support email,
authorised domains set. What is left divides into three kinds, none of which is code:

| Left | Which | Why |
|---|---|---|
| The R-3 experiment | T003 | Two throwaway addresses. **Blocks T020** |
| Browser verification | T011, T018, T023, T027, T030, T033 | Needs a browser, and T030 needs a real in-app browser |
| Blocked on a finding | T020 | The unverified-swap message; see the note on that task |
| Last | T035 | Harvest, once the rest has actually run |

Two changes to the plan, both recorded here rather than left to be rediscovered:

- **`getAdditionalUserInfo` was never needed.** It was in T005 because the plan expected
  `isNewUser` to matter; R-6 replaced it with the `users/{uid}.displayName` test, so the export
  was removed again rather than left dangling.
- **Two extra defects surfaced while editing `deleteAccount`** beyond the ordering bug T010
  names. `await favorites.forEach(...)` awaited nothing, so the decrements were fire-and-forget
  even before the rules denied them; that is now `Promise.all`. And the delete-confirmation copy
  claimed builds would be deleted, which is what T034 fixes.

---

## Phase 1: Setup (Console and assets)

**Purpose**: settle the one question the code is written against, and put the asset in place.
T003 is the reason this phase exists — everything in Phase 4 is built against its answer.

- [X] T001 Enable the **Google** provider in the Firebase console under Authentication → Sign-in method, with a support email set (research [R-9](./research.md#r-9--firebase-console-work-and-what-it-gates))
- [X] T002 Confirm **User account linking** is set to "One account per email address", and add `localhost`, `aoe4guides.com` and the Netlify deploy-preview domain to Authorised domains — a preview subdomain missing here fails with `auth/unauthorized-domain`, which reads like a code bug and is not one
- [ ] T003 Run the collision experiment from [quickstart.md](./quickstart.md) §0 — two throwaway password accounts, one verified and one not, each signed into with Google — and **write what actually happened into [research.md](./research.md) under R-3**, including the error code, the resulting `providerData`, and whether the old password still works
- [X] T004 [P] Add the official four-colour Google mark at `public/assets/google-g.svg` — not `mdi-google`, which is a monochrome approximation Google's brand terms do not sanction for sign-in buttons (research [R-8](./research.md#r-8--the-google-mark-is-an-asset-not-an-icon))

**Checkpoint**: the provider is live, the asset exists, and R-3's real behaviour is written down.

---

## Phase 2: Foundational (Blocking prerequisites)

**Purpose**: the SDK surface, the shared error map, and the two repairs. Every user story
depends on this phase, and the repairs are verifiable here **with no Google anywhere** — which
is exactly why they go first.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 [P] Export `GoogleAuthProvider`, `signInWithPopup`, `reauthenticateWithPopup` and `getAdditionalUserInfo` from `src/firebase/index.js`, alongside the auth functions already re-exported there — no new package, these ship inside `firebase` ^10.14.0
- [X] T006 [P] Make `createUserFavorites` in `src/composables/data/favoriteService.js` non-destructive: it currently writes `{ favorites: [] }` unconditionally, which would erase an established list once account setup can run twice (research [R-7](./research.md#r-7--account-setup-becomes-one-resumable-function-called-by-both-paths))
- [X] T007 [P] Add the Google error codes to `src/composables/auth/useAuthErrors.js` in player language — `auth/popup-blocked`, `auth/account-exists-with-different-credential`, `auth/unauthorized-domain`, `auth/operation-not-allowed` — and export a predicate for the collision code, mirroring the existing `isEmailAlreadyInUse`. No message may contain `auth/`, "credential" or "provider" (FR-016)
- [X] T008 Create `src/composables/auth/useAccountSetup.js` exporting `completeAccountSetup({ uid, displayName })` — the two display-name callables plus the favourites document — per [contracts/auth-store-contract.md](./contracts/auth-store-contract.md). It **must be idempotent** and **must reject rather than swallow**, because the completeness check in T014 is what retries it and it can only do that if somebody noticed
- [X] T009 Replace the `.then()` chain in the `signup` action in `src/store/index.js` with a call to `completeAccountSetup`, keeping the verification email exactly as it is — password accounts stay gated on verification (FR-002)
- [X] T010 Reorder the `deleteAccount` action in `src/store/index.js` so the favourites read and the like decrements happen **before** `deleteUser`. Today it deletes the auth user first, after which `request.auth` is null and [firestore.rules:36-38](../../../firestore.rules) denies both — so likes outlive their deleted owner (research [R-10](./research.md#r-10--re-authentication-on-delete-and-a-bug-found-underneath-it))
- [X] T011 Verify the repairs per [quickstart.md](./quickstart.md) §1 — registration still works end to end, a second setup run leaves an existing favourites list intact, and **deleting an account now drops the like counts on the builds it had favourited**, which is also the proof T010's bug was real. Gates: `npm run check:setup`, `npm run build`
  - Closed on 2026-08-13 by spec [034-account-deletion-cleanup](../034-account-deletion-cleanup/quickstart.md) §1, verified on `aoe4-guides-dev`: a throwaway account favourited, upvoted and downvoted one build each; after deletion all three counters dropped by exactly one (`likes` 1→0, `upvotes` 2→1, `downvotes` 1→0). **T010's bug was real** — the like decrement works now. The registration and second-setup-run halves of this task were exercised incidentally by creating that account, not tested deliberately.

**Checkpoint**: the codebase is better than it was, with nothing Google-shaped in it yet.

---

## Phase 3: User Story 1 — Join and publish in one sitting (Priority: P1) 🎯 MVP

**Goal**: a stranger clicks one button, chooses a name, and publishes a build — without leaving
the site or opening an email client.

**Independent Test**: with no session, open the sign-up prompt, choose Continue with Google,
complete the window, name yourself, and publish a build in the same session.

- [X] T012 [US1] Add the `signinWithGoogle` action to `src/store/index.js`. **`signInWithPopup` must be called synchronously** — no `await` of anything may precede it inside the click path, or the browser blocks the popup for every user in every strict browser, and not in your dev tab (research [R-2](./research.md#r-2--signinwithpopup-must-be-triggered-by-the-users-own-click)). Do not call `fetchSignInMethodsForEmail`, ever
- [X] T013 [US1] Add the `completeProfile({ displayName })` action to `src/store/index.js` — runs `completeAccountSetup` for the signed-in user, refreshes `state.user` so the chosen name shows immediately, and **leaves the dialog open on failure**, because an account that is still nameless must keep asking
- [X] T014 [US1] Extend the `onAuthStateChanged` handler in `src/store/index.js`: after the profile read settles, open the dialog in `complete-profile` mode when the account has a `google.com` provider **and** its `users/{uid}` document has no `displayName`. Read completeness from the resolved profile rather than racing it, and add **no Firestore read** — `loadUserAvatar` already fetches that document (research [R-6](./research.md#r-6--is-this-account-finished-is-answered-by-a-read-that-already-happens))
- [X] T015 [US1] Add the Continue with Google button to `src/components/account/AuthDialog.vue` in the `login` and `register` modes — above the fields, behind a labelled "or" divider, the mark drawn with `v-img` from `/assets/google-g.svg` the way civilisation flags are drawn in [AvatarPicker.vue:42](../../../src/components/account/AvatarPicker.vue). One label in both modes, because the click does one thing. Wire `@click` straight to the action with nothing awaited in between
- [X] T016 [US1] Add the `complete-profile` mode to `src/components/account/AuthDialog.vue` — one display-name field, **empty and never pre-filled** (FR-007d; the first cut pre-filled it from Google and a live test produced `Jens (Google-Test)`), reusing the existing `displayNameRules`. This mode alone is **persistent with no close button**, so `:persistent` becomes a computed; behind it sits an authenticated user with no name, and a backdrop click would strand them. It must not inherit a stale error from whatever mode preceded it
- [X] T017 [US1] Make `state.ui.authDialog.redirect` survive the name step in `src/components/account/AuthDialog.vue` — a first-time user passes through an extra state, and the sign-in that preceded it must not consume the redirect (FR-003)
- [ ] T018 [US1] Walk [quickstart.md](./quickstart.md) §2, **including the abandonment case** — close the tab at the name step, sign in again, confirm the step returns and that nothing appeared publicly in between. Gates: `npm run check:setup`, `npm run build`, and the `comm` icon check from `CLAUDE.md` (expected to print only `mdi-svg` and `mdi-xxx` — a surprise means someone reached for `mdi-google`)

**Checkpoint**: US1 is fully functional. A new Google user can publish, and an abandoned name step is picked up on the next sign-in.

---

## Phase 4: User Story 2 — The account I already have is the account I get back (Priority: P1)

**Goal**: an existing author pressing the new button lands in their own account, or is told
exactly how to reach it. Never a second empty account, never a bare error.

**Independent Test**: two runs, one per branch of T003's findings — the unverified account lands
in its own content, the verified one returns to the log-in form with its address filled in — and
no second account exists after either.

**⚠️ Build this against what T003 actually observed, not against what the table in R-3 predicts.**

- [X] T019 [US2] Handle `auth/account-exists-with-different-credential` in `src/components/account/AuthDialog.vue`: switch to `login` mode, write the colliding address into the email field **after** the open-watcher has cleared the form, and show the explanation in the existing error banner — reusing the contextual-action shape the banner already has for `auth/email-already-in-use` rather than inventing a second one
- [~] T020 [US2] **Skipped by decision, 2026-08-11 (owner).** Telling the owner of an unverified account that their password no longer works (FR-010) needs a marker field on `users/{uid}` — T003 confirmed a swapped account and an ordinary returning Google user are otherwise indistinguishable (same uid, one `google.com` provider, Firestore name present in both). Weighed against what it buys: the message fires once, for existing users with an unverified email who choose Google, and a password reset restores access whether or not they were told. Not worth this feature's only schema addition. **FR-010 is therefore unmet and knowingly so** — recorded in spec.md rather than quietly dropped
- [X] T021 [US2] Confirm the existing **Forgot password?** control stays visible and reachable in the collision state in `src/components/account/AuthDialog.vue` — the person who reached for Google is very often the person who no longer remembers the password (US2 §3)
- [X] T022 [US2] Make a Google sign-in attempted while already signed in unambiguous in `src/store/index.js` — no silent swap into a different account (US2 §5)
- [ ] T023 [US2] Walk [quickstart.md](./quickstart.md) §3, both branches, confirming exactly one account exists per address afterwards. Gates: `npm run check:setup`, `npm run build`

**Checkpoint**: existing authors are safe. US1 and US2 both work, independently.

---

## Phase 5: User Story 3 — The account page tells the truth (Priority: P2)

**Goal**: the account page stops offering a password change to people who have no password, and
says how they actually sign in.

**Independent Test**: sign in with Google, open account settings, confirm the page names Google,
offers no password card, and that every control still shown works when pressed.

- [X] T024 [US3] Derive `hasPassword` and `hasGoogle` from `user.providerData` in `src/views/account/Account.vue` and hide the whole Security card when there is no password sign-in (FR-012). `state.user` is already `user.toJSON()`, so `providerData` is in hand — no extra read
- [X] T025 [US3] Add a sign-in method row to the identity list in `src/views/account/Account.vue`, beside Email and User ID (FR-013). Prefer an icon **already in** `src/plugins/mdiIcons.js`; anything new must be added there or it renders as nothing — green build, no error, only a dev-console warning
- [X] T026 [US3] Add the re-auth branch to `deleteAccount` in `src/store/index.js`: on `auth/requires-recent-login`, re-prove with `reauthenticateWithPopup` for a Google account and retry once; for a password account show a plain message asking them to sign out and back in. The popup is subject to the same synchronous-call rule as T012, so it must be reachable from a user gesture. A full in-place password re-auth dialog is out of scope and stays a named follow-up
- [ ] T027 [US3] Walk [quickstart.md](./quickstart.md) §4, including a password account, which must be **exactly as it was before this feature**. Gates: `npm run check:setup`, `npm run build`, `comm` icon check

**Checkpoint**: the account page is truthful for both kinds of account.

---

## Phase 6: User Story 4 — When the Google window cannot open (Priority: P2)

**Goal**: nobody is stranded. The form is still there and the failure is explained.

**Independent Test**: force the window to fail or dismiss it, and confirm the person is left
signed out with a plain explanation and a working form.

- [X] T028 [US4] Handle the popup outcomes in `src/components/account/AuthDialog.vue`: `auth/popup-closed-by-user` and `auth/cancelled-popup-request` are the user changing their mind and produce **no error at all** (FR-017); `auth/popup-blocked` explains and points at the email form. Give the button its own loading state that does **not** lock the form — someone whose popup is hanging should be able to give up and type their password
- [X] T029 [US4] Confirm no failure path leaves a partial account, a nameless contributor entry or an orphaned favourites record (FR-018) — this should fall out of the sequencing in T012, since nothing is written until the popup resolves, but verify it rather than assume it
- [ ] T030 [US4] Walk [quickstart.md](./quickstart.md) §5 **on a real in-app browser** — Discord or the Reddit app. A desktop popup blocker is not a substitute; in-app browsers fail differently and that difference is the whole story

**Checkpoint**: every failure path ends somewhere a player can act.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T031 Read every user-visible string this feature added. If any contains `auth/`, "credential" or "provider", it is not finished (FR-016)
- [X] T032 Run the full gate set: `npm run check:setup`, `npm run build`, and the `comm` icon check from `CLAUDE.md`. `check:steps` is not relevant — this feature never reads a build
- [ ] T033 Walk [quickstart.md](./quickstart.md) end to end on the deployed preview, then confirm the authorised-domain behaviour again on `aoe4guides.com` — passing on a preview is not the same as passing on production (research [R-9](./research.md#r-9--firebase-console-work-and-what-it-gates))
- [X] T034 Correct the delete-confirmation copy in `src/views/account/Account.vue`, which today promises "Permanently delete your account and all your build orders" while nothing deletes the builds. **Builds are kept on purpose** — the community still uses them, and anything sensitive is removed by hand. The copy must say so: the account goes, the builds stay published. Two places, the alert body and the dialog text
- [ ] T035 Harvest per `CLAUDE.md`: fold T003's actual finding into R-3 if it differs from the prediction, reconcile [data-model.md](./data-model.md) if T020 needed the marker field, and record the two things this feature taught that outlive it — the popup's synchronous-gesture rule, and the fact that account completeness had to be a resumable state rather than a step in a chain

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup)**: no dependencies. T003 blocks Phase 4 specifically, and is the reason Phase 1 is not skippable
- **Phase 2 (Foundational)**: needs T005 from Phase 1's siblings only; blocks **all** user stories
- **Phase 3 (US1)**: needs Phase 2 complete
- **Phase 4 (US2)**: needs Phase 3 (it handles the failure mode of the same action) **and** T003
- **Phase 5 (US3)**: needs Phase 2; independent of US1 in principle, but pointless to verify before a Google account exists to look at
- **Phase 6 (US4)**: needs Phase 3 — it is the failure surface of the button US1 adds
- **Phase 7**: needs everything you intend to ship

### Story dependencies

- **US1 (P1)** — the MVP. Depends on nothing but the foundation
- **US2 (P1)** — depends on US1's action existing, since it handles that action's rejection. Ship both together: US1 alone puts existing authors' work behind a confusing error
- **US3 (P2)** — could be done any time after Phase 2. Ordered here because it is judged by reading, not by mechanism
- **US4 (P2)** — depends on US1. Its verification needs a physical device, so it is worth starting to arrange during Phase 3

### Parallel opportunities

Genuinely parallel, because the files differ:

```text
Phase 1:  T004 (public/assets/google-g.svg) alongside T001–T003 (console work)
Phase 2:  T005 (src/firebase/index.js)
          T006 (src/composables/data/favoriteService.js)
          T007 (src/composables/auth/useAuthErrors.js)
```

After that, almost nothing. T008 is a new file but T009–T014, T020, T022 and T026 all edit
`src/store/index.js`, and T015–T017, T019, T021 and T028 all edit `AuthDialog.vue`. Marking
those [P] would be a lie that costs a merge conflict.

---

## Implementation Strategy

### MVP

Phase 1 → Phase 2 → Phase 3 → **stop and validate**. At that point a stranger can join and
publish in one sitting, which is the whole argument for the feature.

**Do not deploy the MVP alone.** US2 is P1 for a reason: a large share of existing accounts sit
on Gmail addresses, and every one of them is a day-one candidate for pressing that button.
Shipping US1 without US2 turns a trust feature into a trust problem. MVP means "validate here",
not "release here".

### Incremental delivery

1. Phases 1–2 → the codebase is better, nothing user-facing has changed
2. Phase 3 → validate the MVP internally
3. Phase 4 → **now it can ship**
4. Phases 5–6 → the surfaces that make it honest
5. Phase 7 → gates, production check, harvest

### Notes

- Commit after each task or logical group; Conventional Commits, per the constitution
- Phase 2's three repairs each deserve their own commit — they are separable from the feature and should stay that way in the history
- Stop at any checkpoint to validate the story independently
- Say plainly what has *not* been verified: `check:setup` catches a `ReferenceError` in `setup()`, `build` catches a template that will not compile, and neither sees a popup that never opens
