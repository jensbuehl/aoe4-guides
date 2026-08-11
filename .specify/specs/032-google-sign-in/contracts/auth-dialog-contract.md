# Contract: AuthDialog

**Feature**: 032-google-sign-in
**Component**: [src/components/account/AuthDialog.vue](../../../../src/components/account/AuthDialog.vue)

The dialog is the app's only auth surface — `/login` and `/register` are
three-line shims that open it and redirect to `/`. It gains one mode and one
button, and one of its existing properties has to stop being uniform.

---

## Modes

| Mode | Shows | Dismissable | Google button |
|---|---|---|---|
| `login` | email, password, forgot-password, submit, "sign up" footer | yes | **yes** |
| `register` | display name, email, password, submit, "log in" footer | yes | **yes** |
| `reset` | email, submit, back-to-login footer | yes | no |
| `complete-profile` **(new)** | display name only (**empty**, never pre-filled), submit | **no** | no |

**`complete-profile` MUST be persistent and MUST hide the close button.** Every
other mode sets `:persistent="false"` and offers an X. This one cannot: behind it
sits an authenticated user whose account has no name, and a stray backdrop click
would strand them. It is the only mode that differs, so the property becomes a
computed rather than a literal.

That is a guard, not a guarantee — a closed tab defeats it. The durable answer is
the completeness check on the next sign-in (R-6), and this mode is only the
polite half of it.

**The field MUST start empty.** It was pre-filled with `auth.currentUser.displayName`
in the first cut, on the reasoning that Google's name is a helpful starting point.
It is not. It is a real name, the field writes straight through to `build.author`
on every build the user publishes, and a value already in the box invites
appending rather than replacing — the first live test produced the display name
`Jens (Google-Test)`, half of it Google's, on an account that then would have
carried it onto published builds. Nothing about this step may put that name in
front of the user as a default.

**`reset` gets no Google button.** "Continue with Google" is not an answer to
"I forgot my password", and offering it there would be the one place the button
means something different from everywhere else.

---

## The Google button

**Placement**: above the form fields, separated by a labelled divider ("or"), in
`login` and `register`. Above rather than below because it is an alternative to
the form and not a footnote to it (FR-001), and identical in both modes because
for Google there is no difference between signing in and signing up — the same
click does both, and presenting two different buttons would imply otherwise.

**Mark**: `/assets/google-g.svg` drawn with `v-img`, the same way civilisation
flags are drawn in [AvatarPicker.vue:42](../../../../src/components/account/AvatarPicker.vue).
Not `mdi-google` — Google's brand terms require the official four-colour "G", and
MDI's glyph is a monochrome approximation. As a side benefit no new `mdi-*` name
enters the codebase, so the `src/plugins/mdiIcons.js` allowlist trap does not
apply here. (R-8)

**Label**: "Continue with Google" in both modes — one string, because the click
does one thing.

**MUST invoke the store action directly from `@click`**, with no awaited work in
between. See the synchronous-popup rule in
[auth-store-contract.md](./auth-store-contract.md).

**MUST show its own loading state** without locking the email form. A person whose
popup is taking too long should be able to give up and type their password
instead.

---

## Behaviour on the collision

When `signinWithGoogle` rejects with `auth/account-exists-with-different-credential`
the dialog MUST:

1. switch to `login` mode,
2. keep the address that collided in the email field,
3. show the explanation in the existing error banner — that this address signs in
   with a password,
4. leave the existing **Forgot password?** control visible and reachable, since
   the person who reached for Google is very often the person who no longer
   remembers the password (US2 §3).

The error banner already carries a contextual action — the "Log in instead" button
that appears for `auth/email-already-in-use`. This reuses that shape rather than
inventing a second one.

---

## Existing behaviour that must not regress

- **Form state is cleared whenever the dialog opens** (the `watch` on `visible`).
  The collision path deliberately writes the email field *after* that clear, so
  ordering matters.
- **Mode changes reset validation and the error banner**, and preserve email and
  password across `login` ↔ `register`. `complete-profile` is entered from a
  different direction — after a successful sign-in — so it must not inherit a
  stale error from whatever mode preceded it.
- **Enter submits** in every mode, including the new one.
- **The redirect stored in `state.ui.authDialog.redirect`** is honoured after a
  Google sign-in exactly as after a password sign-in (FR-003). When a first-time
  user passes through `complete-profile`, the redirect must survive that extra
  step rather than being consumed by the sign-in that preceded it.

---

## Accessibility and copy

- The Google button is a real `v-btn`, reachable and operable from the keyboard.
- The mark is decorative; the button's text carries the meaning.
- Every message a user can see on a failure path is written for a player: no
  `auth/...` codes, no "credential", no "provider" (FR-016). The existing
  `mapAuthError` is where they live, so they stay in one place.
