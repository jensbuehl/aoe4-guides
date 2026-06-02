# Quickstart: Manual Validation — Unified Authentication Dialog

**Feature**: `001-unified-auth-dialog` | **Date**: 2026-06-02

Run through these scenarios after implementation to confirm the golden path and key
edge cases work. No automated test suite — manual testing per Constitution §Development Workflow.

## Prerequisites

- `npm run dev` running at `http://localhost:5173`
- One existing test account (email + password you know)
- One fresh email address you haven't registered with

---

## Scenario 1 — Login via header (US1 P1)

1. Open the app logged out.
2. Click the "Log in" button in the header.
3. **Expect**: Dialog opens over current page; "Log in" form visible; URL unchanged.
4. Enter valid credentials → submit.
5. **Expect**: Dialog closes; success snackbar "Logged in successfully!"; page behind unchanged; no full-page navigation.

---

## Scenario 2 — Mode switch login → register (US1 P1)

1. Open dialog (header CTA).
2. Click "Sign up" footer link.
3. **Expect**: Same dialog now shows "Create account" title; Display name field appears; email/password preserved.
4. Click "Already have an account? Log in".
5. **Expect**: Back to Log in form; no navigation; dialog still open.

---

## Scenario 3 — Registration (US1 P1)

1. Open dialog in register mode.
2. Fill Display name, fresh Email, Password (≥ 6 chars) → submit.
3. **Expect**: Dialog closes; snackbar "Verification email sent to {email}."; new account visible in Firebase console.

---

## Scenario 4 — Inline validation (US2 P2)

1. Open dialog, submit with all fields empty.
2. **Expect**: Inline error on each required field; no network request sent.
3. Enter a malformed email (e.g., `foo@`) → submit.
4. **Expect**: "Enter a valid email address." under email field.
5. In register mode, enter a 4-character password → submit.
6. **Expect**: "Use at least 6 characters." under password field.

---

## Scenario 5 — Friendly error on wrong credentials (US2 P2)

1. Open dialog in login mode.
2. Enter valid email + wrong password → submit.
3. **Expect**: Dialog-level banner with "Incorrect email or password. Please try again."; no raw Firebase code.

---

## Scenario 6 — Password visibility toggle (US2 P2)

1. Open dialog, type a password.
2. Click the eye icon.
3. **Expect**: Password text becomes visible.
4. Click again → hidden.

---

## Scenario 7 — Loading state / no double-submit (US2 P2)

1. Open dialog, fill valid credentials.
2. Click submit; immediately try clicking submit again while spinner is showing.
3. **Expect**: Button shows spinner and is disabled; only one network request fires.

---

## Scenario 8 — Deep links preserve mode (US3 P3)

1. Navigate directly to `http://localhost:5173/login`.
2. **Expect**: App loads home page with Log in dialog open.
3. Navigate directly to `http://localhost:5173/register`.
4. **Expect**: App loads home page with Create account dialog open.
5. Navigate directly to `http://localhost:5173/resetpassword`.
6. **Expect**: App loads home page with Reset password dialog open.

---

## Scenario 9 — In-dialog password reset request (US4 P2)

1. Open dialog in login mode.
2. Click "Forgot password?".
3. **Expect**: Dialog switches to Reset password view; no navigation; email field only.
4. Enter email → submit.
5. **Expect**: Snackbar "Reset email sent to {email}."; dialog returns to Log in.
6. Click "← Back to log in" without submitting.
7. **Expect**: Returns to Log in; no email sent.

---

## Scenario 10 — Authenticated user redirect (FR-012)

1. Log in.
2. Navigate to `http://localhost:5173/login`.
3. **Expect**: Redirected to home; dialog does NOT open.
4. Navigate to `http://localhost:5173/register`.
5. **Expect**: Same — redirected to home, no dialog.

---

## Scenario 11 — Protected route redirect preserves destination (FR-018 / Clarification)

1. Log out.
2. Navigate directly to `http://localhost:5173/mybuilds`.
3. **Expect**: Redirected to `/login?redirect=/mybuilds`; dialog opens in Log in mode.
4. Log in with valid credentials.
5. **Expect**: After successful login, app navigates to `/mybuilds` (not home).

---

## Scenario 12 — Header entry point (US3 P3)

1. Log out. Check the header.
2. **Expect**: Single "Log in" button; no separate "REGISTER NOW!" link.
3. Log in. Check the header.
4. **Expect**: Header shows authenticated state (unchanged from current).

---

## Scenario 13 — Existing reset-completion route unchanged

1. Open `http://localhost:5173/account/action` (or follow an emailed reset link).
2. **Expect**: `AccountAction.vue` renders as before; dialog is NOT triggered.

---

## Scenario 14 — Esc / scrim / close button

1. Open dialog.
2. Press Esc → dialog closes.
3. Re-open → click outside (scrim) → closes.
4. Re-open → click ✕ button → closes.
5. **Expect**: Underlying page is unchanged after each close.
