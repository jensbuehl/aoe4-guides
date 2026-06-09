# Implementation Plan: Comment Email Notifications

**Branch**: `011-comment-email-notifications` | **Date**: 2026-06-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.specify/specs/011-comment-email-notifications/spec.md`

## Summary

When a comment is posted on a build order, a Firebase Function triggers and sends notification emails via Resend to the build order owner and all previous commenters, excluding the commenter and anyone who has opted out or is within a 1-hour cooldown. Users can unsubscribe per-build-order via a one-click link in every email — handled by a dedicated callable function that identifies them via a non-guessable token stored in their user document, requiring no login. A new Vue page (`Unsubscribe.vue`) styled after the existing `AccountAction.vue` handles the confirmation UI.

## Technical Context

**Language/Version**: Node.js 20 (Firebase Functions), JavaScript ES2022 (Vue 3 frontend)

**Primary Dependencies**: Firebase Functions v2 (`firebase-functions ^4.3.1`), Firebase Admin SDK (`firebase-admin ^11.8.0`), Resend SDK (new — `resend ^4.0.0`), Vue 3 + Vuetify 3 (frontend)

**Storage**: Cloud Firestore — `users`, `comments`, `builds` collections

**Testing**: Manual golden-path testing per constitution; no automated test suite

**Target Platform**: Firebase Functions (Node 20), Netlify (Vue frontend)

**Performance Goals**: Notification delivery within 60 seconds of comment creation; unsubscribe confirmed within 5 seconds of link click

**Constraints**: Resend free tier — 3,000 emails/month (sufficient at current project scale); Firestore reads per notification capped at O(unique commenters per build); admin SDK used for all server-side Firestore writes (bypasses client-facing security rules)

**Scale/Scope**: ~4k builds, expected comment volume of tens–hundreds per month; notification function executes once per comment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | ✅ Pass | One new trigger function, one callable function, one Vue page. Plain HTML email template — no React Email or extra abstractions. No new Firestore collections. |
| II. Incremental Quality | ✅ Pass | All new code isolated in `functions/notifications/`. No changes to existing function files. |
| III. Consistent UX & Component Reuse | ✅ Pass | `Unsubscribe.vue` reuses the exact layout pattern from `AccountAction.vue` (`v-card flat rounded="lg"`, centred single-column). No custom components. |
| IV. Cost-Conscious Infrastructure | ✅ Pass | Resend free tier: 3,000 emails/month. At current scale (estimate ≤ 500 emails/month), well within free tier. Firestore reads are proportional to commenters per build — acceptable. Justification: no Firebase-native transactional email alternative exists at zero cost. |
| V. Secure Defaults | ✅ Pass | Unsubscribe tokens generated server-side via `crypto.randomBytes(32)`. API key stored as Firebase Secret. Callable function validates token before mutating user document. No token or email exposed in client-readable Firestore paths. |

**Complexity Tracking**: No constitution violations. No new Firestore collections added (token + preferences stored in existing `users` document).

## Project Structure

### Documentation (this feature)

```text
.specify/specs/011-comment-email-notifications/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── processUnsubscribe.md  ← Phase 1 output
└── tasks.md             ← Phase 2 output (created by /speckit-tasks)
```

### Source Code (repository root)

```text
functions/
├── index.js                              ← add 2 new exports
├── notifications/
│   ├── notifyCommenters.js               ← NEW: onDocumentCreated trigger
│   └── processUnsubscribe.js             ← NEW: onCall callable function
└── package.json                          ← add "resend" dependency

src/
├── views/account/
│   └── Unsubscribe.vue                   ← NEW: confirmation page
├── router/index.js                       ← add /account/unsubscribe route
└── composables/data/
    └── notificationService.js            ← NEW: client-side callable helper
```

**Structure Decision**: Single-project layout (existing pattern). New function files follow the established `functions/{domain}/functionName.js` convention. New Vue page follows the established `src/views/account/` convention. No new top-level directories.

## Implementation Phases

### Phase 1 (Core Notifications — P1/P2)

Implement the comment trigger, email sending, and all server-side token/preference logic.

- `functions/notifications/notifyCommenters.js` — Firestore trigger
- `functions/notifications/processUnsubscribe.js` — callable for unsubscribe and re-subscribe
- `functions/package.json` — add Resend dependency
- `functions/index.js` — export new functions
- User document `notificationPreferences` field setup (written by server on first notification)

### Phase 2 (Unsubscribe UI — P2)

Frontend unsubscribe/resubscribe confirmation experience.

- `src/views/account/Unsubscribe.vue`
- `src/router/index.js` — add `/account/unsubscribe` route
- `src/composables/data/notificationService.js` — callable function wrapper
