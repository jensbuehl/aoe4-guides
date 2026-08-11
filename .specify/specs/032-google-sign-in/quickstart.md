# Quickstart: Sign in with Google

**Feature**: 032-google-sign-in | **Branch**: `032-google-sign-in`

There is no test suite. This is the walk that stands in for one. §0 is not
optional and not a formality — it settles a question the code is written against.

---

## §0 — Console pre-flight, and the experiment (do this first, no code)

**Settings** (Firebase console → Authentication):

- [ ] Sign-in method → **Google** enabled, support email set.
- [ ] Settings → User account linking → confirm **"One account per email
      address"** (the default). Note what you find.
- [ ] Settings → Authorised domains → contains `localhost`, `aoe4guides.com`,
      and the Netlify deploy-preview domain if previews will be used for testing.
      A preview subdomain that is missing here fails with
      `auth/unauthorized-domain`, which reads like a code bug and is not one.

**The experiment.** Two throwaway accounts on addresses you control, both
registered through the *existing* email-and-password form:

| | Account A | Account B |
|---|---|---|
| Registered with password | yes | yes |
| Verification link clicked | **no** | **yes** |

Sign into each with Google, from a scratch branch or the console's own tooling,
and record for both:

- [ ] Did sign-in succeed, or throw? Which error code?
- [ ] Afterwards, what does the account's `providerData` contain?
- [ ] Does the original password still work?

**Write the answers into `research.md` under R-3 before writing code.** The
expected shape is: A succeeds and loses its password provider, B throws
`auth/account-exists-with-different-credential`. If reality differs, the plan
follows reality — Phase 3 is built against what you saw here.

---

## §1 — Phase 1 repairs, verified without Google

These change existing behaviour, so they are checked against the feature set as it
stands today.

- [ ] Register a new account with email and password. It still works: verification
      mail arrives, display name appears on the account page, and a favourites
      document exists.
- [ ] Register, then deliberately make the display-name callable fail (offline for
      a moment). The failure is now visible rather than swallowed.
- [ ] Take an account with favourites, run account setup a second time by hand, and
      confirm **the favourites list is still there**. This is the idempotence that
      R-7 requires and the one way the extraction could destroy data.
- [ ] Favourite two builds on a throwaway account, note both builds' like counts,
      delete the account, and confirm **both counts went down**. Before this
      change they do not (R-10) — so this checkbox is also the proof the bug was
      real.

Gates: `npm run check:setup`, `npm run build`.

---

## §2 — US1, the happy path

- [ ] Signed out, open the auth dialog. **Continue with Google** appears in both
      the log-in and create-account states, above the fields, with the four-colour
      mark.
- [ ] Click it. The popup opens **on the first click**, with no prior interaction.
      If it does not, an `await` has crept in ahead of it (R-2).
- [ ] Complete Google with an address that has never used the site. The name step
      appears, pre-filled with the Google name, editable.
- [ ] Try to dismiss the name step: backdrop click, Escape, and look for a close
      button. **None of the three may close it.**
- [ ] Choose a different name and submit. The dialog closes, and the name you
      chose — not Google's — shows on the account page.
- [ ] Publish a build immediately. No verification prompt, no banner, no snackbar
      asking you to confirm anything.
- [ ] Open the account page. The chip reads **Verified**.
- [ ] Check the build's author name, the author page, and Top Contributors — all
      show the chosen name.
- [ ] Sign out, sign back in with Google. **No name step this time.**
- [ ] Confirm no verification email was ever sent to that address.

**The abandonment case**, which is the one worth doing carefully:

- [ ] With a second fresh Google address, complete the popup and then **close the
      tab** at the name step.
- [ ] Reopen the site and sign in with Google again. The name step comes back.
- [ ] Before naming yourself, confirm you appear nowhere public — no author entry,
      no contributor listing.
- [ ] Name yourself, and confirm everything appears normally afterwards.

**Redirect preservation:**

- [ ] From a page that requires sign-in, get sent to the dialog, sign in with
      Google as a **first-time** user, pass through the name step, and confirm you
      land on the page you originally wanted — the extra step must not eat the
      redirect.

Gates: `npm run check:setup`, `npm run build`, and the icon check from
`CLAUDE.md` (expected to print only `mdi-svg` and `mdi-xxx`; R-8 predicts no
change, so a surprise here means someone reached for `mdi-google`).

---

## §3 — US2, the collision

Run both branches against what §0 actually found.

**Unverified existing account (A):**

- [ ] Sign in with Google on A's address. You land in **A's account** — its builds
      and favourites are there.
- [ ] A message states plainly that this address now signs in with Google and the
      old password no longer works.
- [ ] Confirm the old password is in fact refused.
- [ ] Confirm there is exactly **one** account for that address.

**Verified existing account (B):**

- [ ] Sign in with Google on B's address. You are returned to the log-in form.
- [ ] B's address is **already in the email field**.
- [ ] The message says this address signs in with a password. No error code
      appears anywhere in it.
- [ ] **Forgot password?** is visible and works.
- [ ] Sign in with B's password. Builds and favourites are intact.
- [ ] Confirm no second account was created for that address.

**Already signed in:**

- [ ] While signed in as one user, trigger a Google sign-in as another. Whatever
      happens, it is not silent — you are not simply swapped without being told.

---

## §4 — US3, the account page

- [ ] Signed in with Google: the page states you sign in with Google, and there is
      **no password card**.
- [ ] Signed in with a password: the page is exactly as it was before this feature.
      Password card present and working.
- [ ] Google account, delete it: deletion completes, and the likes it had given are
      withdrawn from those builds.
- [ ] Google account with a stale session, delete it: you are asked to prove who
      you are again, in a way that matches Google, with an explanation — never a
      raw `auth/requires-recent-login`.
- [ ] Password account with a stale session, delete it: you get a plain message
      telling you to sign out and back in. Not a code.

---

## §5 — US4, the failure paths

The first one needs a real device. A desktop popup blocker is not a substitute —
in-app browsers fail differently and that difference is the point.

- [ ] Open the site **inside the Discord or Reddit app's browser**. Try Continue
      with Google. Whatever happens, you get a plain explanation and a working
      email form — never a button that appears to do nothing.
- [ ] Desktop with popups blocked: same outcome, and the form keeps whatever you
      had typed.
- [ ] Open the popup and close it yourself. **No error appears.** No red banner, no
      snackbar. You can try again.
- [ ] Start a Google sign-in and kill the network mid-flow. You stay signed out
      with an explanation, and no half-made account exists afterwards.
- [ ] Read every message this section produced. If any contains `auth/`, the word
      "credential", or the word "provider", it is not finished (FR-016).

---

## What this walk cannot tell you

Say so plainly when reporting, rather than implying it was covered:

- **Nothing here is automated.** `check:setup` catches a `ReferenceError` in
  `setup()`; `build` catches a template that will not compile. Neither sees
  layout, interaction, or a popup that never opens.
- **The in-app browser result is one device's answer.** Discord on Android and
  Reddit on iOS are different browsers with different popup policies; one pass
  is evidence, not coverage.
- **The collision branches were exercised on throwaway accounts**, not on a real
  account with years of builds behind it. The behaviour should be identical — the
  code cannot tell them apart — but the stakes of being wrong are not.
- **Deploy-preview domains** behave differently from production for
  `auth/unauthorized-domain`. Passing on a preview is not the same as passing on
  `aoe4guides.com`.
