# Quickstart: Manual Validation — Account Page Redesign & User Avatars

**Feature**: `002-account-redesign` | **Date**: 2026-06-02

Run through these scenarios after implementation. No automated test suite — manual testing
per Constitution Development Workflow.

## Prerequisites

- `npm run dev` running at `http://localhost:5173`
- Two test accounts: one **verified**, one **unverified**
- Firebase Storage bucket configured (check `.env.local` for `VITE_FIREBASE_STORAGE_BUCKET`)

---

## Scenario 1 — Default initials avatar (US1 + US2)

1. Log in. Navigate to `/account`.
2. **Expect**: Profile hero shows initials avatar (first 2 chars of display name, uppercase), name, email, and verification badge.
3. Reload the page.
4. **Expect**: Same state — initials persist across reloads.

---

## Scenario 2 — Choose a civilization crest (US1)

1. On the account page, click the avatar.
2. **Expect**: Avatar picker opens with three tabs: Initials / Civilizations / Upload.
3. Click "Civilizations". Select a civ crest (e.g. English).
4. Click Save.
5. **Expect**: Dialog closes; profile hero now shows the chosen crest; header avatar updates to the same crest without a page reload.
6. Reload the page.
7. **Expect**: Crest persists — stored choice survives reload.

---

## Scenario 3 — Upload a custom image (US1)

1. Click the avatar → picker → Upload tab.
2. Pick any image file (photo, large PNG, etc.).
3. **Expect**: A square preview appears showing the cropped/resized image.
4. Click Save.
5. **Expect**: Upload progress shown on button; on success dialog closes; header and profile show the uploaded image.
6. Reload.
7. **Expect**: Uploaded avatar persists.

---

## Scenario 4 — Return to initials (US1)

1. With a crest or upload active, click the avatar → picker → Initials tab.
2. Click Save.
3. **Expect**: Avatar reverts to initials in profile and header.

---

## Scenario 5 — Cancel picker without saving (US1)

1. Click the avatar. Select a different crest. Press Esc (or click outside dialog).
2. **Expect**: Avatar unchanged — cancel does not persist.

---

## Scenario 6 — Read-only identity layout (US2)

1. On the account page, check the Account Info section.
2. **Expect**: Email and User ID are displayed as static rows (not editable inputs). Display name is shown read-only.
3. Click the copy icon on User ID.
4. **Expect**: UID copied to clipboard; brief confirmation shown.

---

## Scenario 7 — Password change with confirmation (US3)

1. In the Security section, enter a new password and a **non-matching** confirmation.
2. **Expect**: Submit is blocked; mismatch message visible.
3. Enter matching passwords → submit.
4. **Expect**: Password changed; success snackbar.

---

## Scenario 8 — Danger zone — delete account confirmation (US4)

1. Scroll to the Danger zone card.
2. **Expect**: Card has visually distinct error/danger styling; not the same as the security card.
3. Click Delete Account.
4. **Expect**: Confirmation dialog appears explaining consequences.
5. Click Cancel → **Expect**: Dialog closes, account intact.
6. *(Do not confirm deletion in testing unless using a throwaway account.)*

---

## Scenario 9 — Unverified user banner (US5)

1. Log in with an unverified account.
2. Navigate to `/account`.
3. **Expect**: An inline banner prompts email verification with neutral copy (no mention of "notifications"). Resend button is visible.
4. Click Resend.
5. **Expect**: Confirmation snackbar; no crash.
6. Log in with a verified account → navigate to `/account`.
7. **Expect**: No verification banner.

---

## Scenario 10 — Mobile layout

1. Open browser devtools, set viewport to 375 px wide.
2. Navigate to `/account`.
3. **Expect**: All sections stack in a single column; avatar is centered; all buttons have ≥44 px touch targets.

---

## Scenario 11 — Light / dark theme

1. Toggle theme in the header.
2. **Expect**: Account page renders correctly in both themes; no hardcoded colours visible.

---

## Scenario 12 — Avatar fallback

1. In Firebase Console, open `users/{uid}` and set `avatar.ref` to a non-existent civ code (e.g. `"XXX"`).
2. Reload the app.
3. **Expect**: Avatar falls back to initials — no broken image icon.
