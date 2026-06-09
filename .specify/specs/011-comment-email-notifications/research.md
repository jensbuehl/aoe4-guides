# Research: Comment Email Notifications

**Feature**: 011-comment-email-notifications | **Date**: 2026-06-09

## Decision 1: Firestore Trigger Pattern

**Decision**: Use `onDocumentCreated('comments/{commentId}', handler)` from `firebase-functions/v2/firestore`.

**Rationale**: The project already uses Firebase Functions v2 (`onSchedule` from v2). The v2 `onDocumentCreated` is the idiomatic trigger for new document creation and fires exactly once per new comment document. V1 `onCreate` is deprecated in favour of v2.

**Alternatives considered**:
- V1 `functions.firestore.document('comments/{id}').onCreate()` — deprecated, inconsistent with existing v2 usage.
- Cloud Tasks / Pub/Sub — unnecessary complexity for a simple fan-out to a small recipient list.

**Import**: `const { onDocumentCreated } = require('firebase-functions/v2/firestore');`

---

## Decision 2: Email Sending — Resend SDK

**Decision**: Add `resend ^4.0.0` to `functions/package.json`. Use `new Resend(apiKey).emails.send({...})` with a plain HTML string template.

**Rationale**: Resend is already configured per spec. Plain HTML template is the simplest approach — no additional build step, no JSX, no extra dependency (React Email). The email content is straightforward (comment preview + link + footer). Free tier covers ≥ 3,000 emails/month.

**API key storage**: Firebase Secret via `defineSecret('RESEND_API_KEY')` from `firebase-functions/params`. Accessible inside the function as `resendApiKey.value()`. Set via: `firebase functions:secrets:set RESEND_API_KEY`.

**Alternatives considered**:
- React Email + Resend — more polished templates but adds React dependency to functions, overkill for a simple notification.
- Firebase Extensions (Trigger Email) — uses SendGrid/Mailgun, not Resend; would bypass existing Resend setup.
- Nodemailer — requires separate SMTP credentials, more complex than Resend SDK.

---

## Decision 3: Unsubscribe Token Storage

**Decision**: Store per-build-order token in the user document at `notificationPreferences.tokens[buildId]`. Token generated with `crypto.randomBytes(32).toString('hex')` on first notification send for that user+build pair.

**Unsubscribe URL format**: `/account/unsubscribe?uid={userId}&bid={buildId}&t={token}`

**Verification**: Callable function reads user document via admin SDK, checks `notificationPreferences.tokens[buildId] === token`.

**Rationale**: No extra Firestore collection needed (constitution: Simplicity First). One admin SDK read verifies identity. Including `uid` and `bid` in the URL avoids a collection scan. User IDs are already semi-public (visible in build order author references).

**Alternatives considered**:
- Separate `notificationTokens/{token}` collection — cleaner URLs but adds a collection and extra reads/writes; rejected per Simplicity First.
- JWT tokens — adds `jsonwebtoken` dependency; random hex is simpler and equally secure given server-side storage.
- Short-lived tokens — rejected per clarification Q2; tokens never expire (unsubscribe is low-risk and links live in email archives).

---

## Decision 4: Notification Recipient Logic

**Decision**: In the trigger function:
1. Read the new comment's `buildId` and `authorId`.
2. Read the build document to get `authorUid` (owner).
3. Query `comments` where `buildId == commentBuildId` to collect all unique `authorId` values (participants).
4. Build recipient set: `(owner + participants) - commenter`. Deduplicate.
5. For each recipient, read their `users/{uid}` document to get email + notificationPreferences.
6. Skip if: opted out (`optedOut` array contains `buildId`) OR cooldown active (`lastNotifiedAt[buildId]` is within 1 hour).
7. Generate token if not yet set for this user+build. Send email. Update `lastNotifiedAt[buildId]`.

**Firestore reads per notification**: 1 (build) + 1 (comments query) + N (one per unique recipient). For typical small discussions (2–5 recipients), this is 3–7 reads per comment — well within Firestore free tier.

**Batching writes**: After sending emails, batch-update all recipient `lastNotifiedAt` fields and new tokens in a single `writeBatch` to minimise write operations.

**Alternatives considered**:
- Denormalising participant list onto the build document — adds write complexity on every comment; rejected per Simplicity First.
- Querying per recipient's subscription status — same approach, just named differently.

---

## Decision 5: Callable Function for Unsubscribe/Re-subscribe

**Decision**: Single callable function `processUnsubscribe` with an `action` parameter (`'unsubscribe'` | `'resubscribe'`). Uses `onCall` from `firebase-functions/v2/https`. Does **not** require Firebase Auth context — validates via token instead (supports unauthenticated callers for email-link flow).

**Rationale**: One function handles both directions. Token validation substitutes for auth. `onCall` handles CORS and JSON serialisation automatically.

**Alternatives considered**:
- Separate `unsubscribe` and `resubscribe` functions — more files, identical validation logic duplicated; rejected.
- Plain HTTP function — `onCall` is simpler (auto CORS, structured error handling).
- Client-side Firestore write — Firestore rules require `request.auth.uid == userId`; unauthenticated callers can't write; requires admin SDK path.

---

## Decision 6: Frontend Unsubscribe Page

**Decision**: New route `/account/unsubscribe` → new component `src/views/account/Unsubscribe.vue`. Does **not** extend `AccountAction.vue` — adds a new mode would complicate existing auth action handling. Layout pattern is identical (centred `v-card flat rounded="lg"` single column).

**States**:
1. **Loading** — calling `processUnsubscribe`, spinner shown
2. **Unsubscribed** — success message + build order name + re-subscribe button
3. **Re-subscribed** — confirmation + dismiss
4. **Error** — "This unsubscribe link is invalid or has already been used."

**Rationale**: New dedicated component is simpler than extending `AccountAction.vue` with new mode logic. Consistent with the established pattern of dedicated account action pages.
