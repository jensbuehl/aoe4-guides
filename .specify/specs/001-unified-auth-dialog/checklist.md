# Author Self-Review Checklist: Unified Authentication Dialog

**Purpose**: Pre-merge gate for the unified auth dialog — covers requirement coverage, constitution compliance, and the golden path.
**Created**: 2026-06-02
**Feature**: `specs/001-unified-auth-dialog/spec.md`

## Requirement coverage

- [ ] CHK001 Dialog opens over the current page with a scrim; closes via button, Esc, and scrim click (FR-001)
- [ ] CHK002 Login ⇄ register switch happens via the footer link with no navigation/close (FR-002)
- [ ] CHK003 Register mode shows Display name; login mode does not (FR-003)
- [ ] CHK004 Inline validation fires for required, email format, and password min-6 (FR-004)
- [ ] CHK005 Submit uses existing `signin`/`signup`; no auth logic or schema changed (FR-005)
- [ ] CHK006 No raw Firebase code reaches the UI; all mapped to friendly messages (FR-006)
- [ ] CHK007 Password visibility toggle works on password fields (FR-007)
- [ ] CHK008 Submit shows loading + is disabled; duplicate submits blocked (FR-008)
- [ ] CHK009 Success closes dialog + shows snackbar, no route change (FR-009)
- [ ] CHK010 Header shows a single auth entry point when logged out (FR-010)
- [ ] CHK011 `/login` and `/register` resolve and open the dialog in the right mode (FR-011)
- [ ] CHK012 Authenticated users are redirected off `/login` & `/register`, dialog not shown (FR-012)
- [ ] CHK013 "Forgot password?" switches the dialog to the in-dialog reset request view (FR-013)
- [ ] CHK014 Light + dark themes render correctly across all modes; reduced motion honored (FR-014)
- [ ] CHK014a Reset mode: email-only form sends via `sendPasswordResetEmail`, snackbar shows, dialog returns to login (FR-015, FR-016)
- [ ] CHK014b `/resetpassword` opens the dialog in reset mode; `AccountAction.vue` (emailed-link completion) left untouched (FR-017)

## Edge cases

- [ ] CHK015 Email-already-in-use shows friendly message + "Log in instead" affordance
- [ ] CHK016 Mode switch preserves typed email/password and clears field errors
- [ ] CHK017 Network/Firebase failure shows generic friendly fallback, not an exception
- [ ] CHK018 Mobile width: dialog usable, scrollable if needed, hit targets ≥ 44px

## Constitution compliance

- [ ] CHK019 (I) No new dependencies added to `package.json`
- [ ] CHK020 (II) Login.vue/Register.vue/ResetPassword.vue duplication removed; refactors are atomic commits
- [ ] CHK021 (III) Only Vuetify components used; colors via theme tokens, none hardcoded
- [ ] CHK022 (IV) No new Firestore reads/writes, Functions, or services
- [ ] CHK023 (V) No `firestore.rules` change; `/login` verification action link preserved
- [ ] CHK024 Commits follow Conventional Commits (`feat:`/`refactor:`/`style:`/`chore:`/`docs:`)

## Golden path (manual)

- [ ] CHK025 Logged-out → open dialog → log in with valid creds → authenticated, dialog closed
- [ ] CHK026 Open dialog → switch to register → create account → verification email sent
- [ ] CHK027 Wrong password → friendly banner; correct it → succeeds
- [ ] CHK028 Visit `/register` directly → dialog opens in register mode
- [ ] CHK028a From login, "Forgot password?" → reset view → send → returns to login with snackbar
- [ ] CHK029 Final diff self-review: no dead code, no unused imports, no leftover temp trigger (T010)

## Notes

- Check items off as completed: `[x]`
- Map each FR/edge case back to the spec when in doubt.
- Reference visuals: `Auth Redesign.html`, `assets/login-dark.png`, `assets/register-validation.png`, `assets/reset-password.png`, `assets/login-light.png`.
