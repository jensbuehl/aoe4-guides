# Feature Specification: Unified Authentication Dialog

**Feature Branch**: `001-unified-auth-dialog`

**Created**: 2026-06-02

**Status**: Draft

**Input**: Redesign of the existing login/register experience. Replace the three separate full-page auth routes (`/login`, `/register`, `/resetpassword`) with a single unified, in-context **dialog** that lets a visitor log in, create an account, or request a password-reset link — switching between modes via text links. Email/password only — no new auth providers in this feature. Fix the long-standing UX gaps (validation, error messaging, password visibility, loading state) along the way. *(Setting a new password from the emailed link stays its own route — see Assumptions.)*

> **Design reference**: interactive mock at `Auth Redesign.html` (approved direction = **link** switcher, **plain** voice, **dialog-over-context**). Implementation notes, copy strings, theme tokens and the error map are in `specs/001-unified-auth-dialog/design-notes.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One dialog for login and registration (Priority: P1) 🎯 MVP

A visitor wants to access their account or create one without leaving the page they are on. They open a single auth dialog, see the **Log in** form by default, and can flip to **Create account** through a "Don't have an account? Sign up" link (and back) — all inside the same modal, over the dimmed page behind it. Submitting wires to the existing Firebase auth actions.

**Why this priority**: This is the core value — it removes the navigation/context loss and the duplicated, drifting Login/Register pages. Delivered alone it is already a complete, shippable improvement.

**Independent Test**: From a logged-out state, open the dialog, log in with valid credentials → lands authenticated with the page context preserved. Re-open, switch to register via the link, create an account → verification email sent. No full-page navigation occurs.

**Acceptance Scenarios**:

1. **Given** a logged-out visitor on any page, **When** they trigger the auth entry point, **Then** a modal dialog opens over the current page (scrim behind) showing the Log in form.
2. **Given** the dialog is in Log in mode, **When** the visitor clicks "Sign up", **Then** the same dialog morphs to the Create account form (adds Display name field) without navigating or closing.
3. **Given** valid login credentials, **When** the visitor submits, **Then** they are authenticated, the dialog closes, and a success snackbar shows — without a route change.
4. **Given** valid registration details, **When** the visitor submits, **Then** the account is created, the verification email is sent, and the dialog closes.
5. **Given** the dialog is open, **When** the visitor clicks the close button, presses Esc, or clicks the scrim, **Then** the dialog closes and the underlying page is unchanged.

---

### User Story 2 - Clear validation, errors, and submit feedback (Priority: P2)

A visitor mistypes their email, leaves a field blank, or enters a wrong password. They get immediate, human-readable guidance inline and a friendly summary on failed authentication — never a raw Firebase error code. Passwords can be revealed, and the submit button shows progress and can't be double-fired.

**Why this priority**: The current flow only checks "required" and surfaces raw codes like `auth/wrong-password`. This layer is the "fix" the redesign promised, but the dialog (US1) is usable without it.

**Independent Test**: Submit empty fields → inline messages appear per field. Submit a malformed email → "Enter a valid email address." Submit wrong credentials → friendly banner "Incorrect email or password." Toggle the eye icon → password text shows/hides. During an in-flight request the button shows a spinner and is disabled.

**Acceptance Scenarios**:

1. **Given** an empty required field, **When** the visitor submits, **Then** an inline message identifies the field and the request is not sent.
2. **Given** a malformed email, **When** the visitor submits, **Then** "Enter a valid email address." appears under the email field.
3. **Given** a registration password under 6 characters, **When** the visitor submits, **Then** "Use at least 6 characters." appears under the password field.
4. **Given** a failed sign-in, **When** the backend returns an auth error, **Then** a friendly mapped message is shown in a dialog-level banner (not the raw code).
5. **Given** a password field, **When** the visitor clicks the visibility toggle, **Then** the password value is shown/hidden.
6. **Given** a submitted form, **When** the request is in flight, **Then** the submit button shows a loading state and is disabled until it resolves.

---

### User Story 3 - Consolidated entry points & preserved deep links (Priority: P3)

The header offers a single "Log in / Register" action instead of two separate entries. The existing `/login` and `/register` URLs still work — they open the dialog rather than rendering a standalone page — so external links and the **email-verification action link** (which points at `/login`) keep functioning.

**Why this priority**: Cleans up the header and guarantees no broken links, but the dialog can ship before the entry points are fully consolidated.

**Independent Test**: Click the header auth action → dialog opens. Navigate directly to `/register` → app opens with the dialog in register mode. Follow a `/login` verification link → app opens with the dialog in login mode. "Forgot password?" still reaches the reset flow.

**Acceptance Scenarios**:

1. **Given** the logged-out header, **When** it renders, **Then** a single auth action appears (no separate "REGISTER NOW!" + "Login" pair).
2. **Given** a direct visit to `/register`, **When** the app loads, **Then** the dialog opens in Create account mode.
3. **Given** a direct visit to `/login`, **When** the app loads, **Then** the dialog opens in Log in mode.
4. **Given** the Log in form, **When** the visitor clicks "Forgot password?", **Then** they reach the password reset request (now in-dialog — see User Story 4).

---

### User Story 4 - In-dialog password reset request (Priority: P2)

A visitor who forgot their password clicks "Forgot password?" from the login form. Instead of being thrown to a separate page, the **same dialog** switches to a "Reset password" view: a single email field and a "Send Reset Link" button. After sending, a snackbar confirms and the dialog returns to the Log in view — the visitor never left the modal.

**Why this priority**: `ResetPassword.vue` is a *third* near-identical copy of the auth card. Folding the reset **request** into the dialog removes that duplication and keeps the whole auth surface in one place, in-context. It depends only on the US1 dialog existing.

**Independent Test**: From the login form, click "Forgot password?" → dialog shows the reset view. Enter an email, submit → reset email sent (via existing `sendPasswordResetEmail`), success snackbar, dialog returns to Log in. "Back to log in" link returns without sending.

**Acceptance Scenarios**:

1. **Given** the Log in view, **When** the visitor clicks "Forgot password?", **Then** the dialog switches to the Reset password view (email field only) without navigating.
2. **Given** the Reset password view with a valid email, **When** the visitor submits, **Then** a reset email is sent, a success snackbar shows, and the dialog returns to Log in.
3. **Given** the Reset password view, **When** the visitor clicks "Back to log in", **Then** the dialog returns to the Log in view without sending anything.
4. **Given** a visitor following the password-reset link from their email, **When** the app loads that action URL, **Then** the existing out-of-band reset-completion route handles it (NOT the dialog).

---

### Edge Cases

- **Already authenticated** visitor hits `/login` or `/register` → redirect to home, do not open the dialog.
- **Switching modes mid-typing** → preserve already-entered email/password where it makes sense; clear field-level errors on switch.
- **Slow/over-eager submit** → block duplicate submissions while a request is in flight.
- **Network/Firebase down** → show a generic "Something went wrong. Please try again." rather than a raw exception.
- **Email already in use** on register → friendly "An account with this email already exists." with an affordance to switch to Log in.
- **Reduced motion** → entrance animation respects `prefers-reduced-motion`.
- **Small viewports** → dialog is usable on mobile widths (full-width, scrollable if needed).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST present login and registration in a single modal dialog rendered over the current page, with a scrim, close button, Esc-to-close, and scrim-click-to-close.
- **FR-002**: System MUST let the visitor switch between Log in and Create account within the dialog via a text link, without navigating or closing.
- **FR-003**: Login mode MUST collect E-mail and Password; registration mode MUST additionally collect Display name.
- **FR-004**: System MUST validate inputs inline before submit — required fields, valid email format, and a minimum password length of 6 (registration).
- **FR-005**: System MUST submit using the existing Vuex `signin` and `signup` actions; this feature MUST NOT change auth business logic or Firestore schema.
- **FR-006**: System MUST translate Firebase auth error codes into friendly, human-readable messages shown at dialog level; raw codes MUST NOT be surfaced to users.
- **FR-007**: System MUST provide a password visibility toggle on password fields.
- **FR-008**: System MUST show a loading state on the submit button and disable it (and prevent duplicate submissions) while a request is in flight.
- **FR-009**: On successful login/registration, the dialog MUST close and show the existing success snackbar. If a `redirect` destination was queued in the dialog state (e.g., passed by the route guard when the user was redirected from a protected page), the app MUST navigate to that destination after close; otherwise no route change occurs.
- **FR-010**: The header MUST expose a single auth entry point for logged-out users that opens the dialog.
- **FR-011**: The `/login` and `/register` routes MUST continue to resolve and MUST open the dialog in the corresponding mode (preserving the email-verification action link to `/login`).
- **FR-012**: Authenticated users visiting `/login` or `/register` MUST be redirected away (home) and MUST NOT see the dialog.
- **FR-013**: The "Forgot password?" affordance MUST remain available from the login form and switch the dialog to the in-dialog reset request view (User Story 4).
- **FR-014**: The dialog MUST support both light and dark Vuetify themes using existing theme tokens, and MUST honor `prefers-reduced-motion`.
- **FR-015**: The dialog MUST provide a Reset password mode with a single email field that submits via the existing `sendPasswordResetEmail` flow, shows a success snackbar, and returns to Log in.
- **FR-016**: The Reset password mode MUST offer a "Back to log in" affordance that returns without sending.
- **FR-017**: The `/resetpassword` route MUST continue to resolve and MUST open the dialog in Reset mode (preserving any external links). Setting a new password from the emailed action link MUST remain handled by its existing out-of-band route (`AccountAction.vue`), unchanged.
- **FR-018**: The `openAuthDialog` Vuex action MUST accept an optional `redirect` path. The `/login` route shim MUST forward the `?redirect` query parameter (set by the route guard) into the dialog state. On successful login, the dialog MUST navigate to the redirect path if one is present, then clear it from state.

### Key Entities

- *No new data entities.* Identity continues to be owned by Firebase Auth; the existing user record and `userFavorites` document creation on signup are reused unchanged. No Firestore schema or security-rule changes are introduced by this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A returning visitor can complete login from dialog-open to authenticated in under 15 seconds with no page navigation.
- **SC-002**: A new visitor can switch from login to registration and submit a valid account in a single uninterrupted dialog session (zero route changes).
- **SC-003**: 100% of user-facing auth failures display a mapped friendly message; 0 raw Firebase codes are shown.
- **SC-004**: The Login.vue, Register.vue **and ResetPassword.vue** duplicated card markup is eliminated (three files of near-identical template collapse to one shared dialog).
- **SC-005**: All `/login`, `/register` **and `/resetpassword`** deep links (including verification action links) continue to resolve with no 404s or broken flows.

## Assumptions

- Email/password is the only auth method in scope; social providers (Google/Discord/etc.) are explicitly out of scope and will be a later feature — but the dialog layout should leave room for them.
- The existing `signin`/`signup` Vuex actions and Firebase wiring are correct and reused as-is.
- The password-reset **request** (sending the email) is folded into the dialog as a third mode. **Completing** the reset (setting a new password from the emailed `oobCode` link) stays its existing out-of-band route (`AccountAction.vue`) and is out of scope here — it can't be a dialog because it's entered from the email link.
- Dialog state is managed centrally in Vuex (`ui.authDialog: { visible, mode, redirect }`) so any component, route guard, or route shim can trigger it with an optional post-login redirect destination.
- Existing theme tokens in `src/main.js` / `src/assets/base.css` are the single source of truth for color and type.

## Clarifications

### Session 2026-06-02

- Q: After successful login via the dialog, when the user arrived via a redirect from a protected route, should the app navigate to the original destination? → A: Yes — navigate to the original destination (Option A). The `openAuthDialog` action accepts an optional `redirect` path; the `/login` shim forwards `?redirect` from the query string; on login success the dialog navigates to that path and clears it from state.
