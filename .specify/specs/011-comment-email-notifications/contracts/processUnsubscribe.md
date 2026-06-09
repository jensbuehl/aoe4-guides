# Contract: processUnsubscribe (Callable Firebase Function)

**Feature**: 011-comment-email-notifications | **Date**: 2026-06-09

## Overview

A Firebase callable function (`onCall`) that handles both unsubscribe and re-subscribe actions for build order comment notifications. Callers are identified via a non-guessable token — no Firebase Auth session required.

**Function name**: `processUnsubscribe`
**Type**: `onCall` (firebase-functions/v2/https)
**Auth required**: No — token-based identity validation

---

## Request

```json
{
  "userId":  "string — Firebase Auth UID of the user",
  "buildId": "string — Firestore document ID of the build order",
  "token":   "string — 64-char hex unsubscribe token from email URL",
  "action":  "string — 'unsubscribe' | 'resubscribe'"
}
```

**Validation rules**:
- All four fields are required; missing fields return `INVALID_ARGUMENT`.
- `action` must be exactly `'unsubscribe'` or `'resubscribe'`; any other value returns `INVALID_ARGUMENT`.
- `userId` must correspond to an existing user document; not found returns `NOT_FOUND`.
- `token` must match `users/{userId}.notificationPreferences.tokens[buildId]`; mismatch returns `INVALID_ARGUMENT` (same error as missing, to avoid enumeration).

---

## Response

**Success** (HTTP 200):

```json
{
  "success": true,
  "action": "unsubscribe" | "resubscribe",
  "buildId": "string"
}
```

**Error** (Firebase Functions error codes):

| Code | Meaning |
|------|---------|
| `INVALID_ARGUMENT` | Missing/invalid fields, or token mismatch |
| `NOT_FOUND` | `userId` does not match any user document |
| `INTERNAL` | Unexpected server error (logged server-side) |

---

## Side Effects

**On `action: 'unsubscribe'`**:
- Adds `buildId` to `users/{userId}.notificationPreferences.optedOut` (if not already present — idempotent).

**On `action: 'resubscribe'`**:
- Removes `buildId` from `users/{userId}.notificationPreferences.optedOut` (if present — idempotent).
- Does **not** reset `lastNotifiedAt[buildId]` or regenerate the token.

**In both cases**: The token itself is not rotated. No email is sent as a result of this call.

---

## Client Usage

```javascript
// src/composables/data/notificationService.js
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const processUnsubscribe = httpsCallable(functions, 'processUnsubscribe');

// Unsubscribe
await processUnsubscribe({ userId, buildId, token, action: 'unsubscribe' });

// Re-subscribe
await processUnsubscribe({ userId, buildId, token, action: 'resubscribe' });
```

---

## URL Parameters (consumed by frontend before calling)

The unsubscribe URL format from notification emails:

```
/account/unsubscribe?uid={userId}&bid={buildId}&t={token}
```

`Unsubscribe.vue` reads `uid`, `bid`, `t` from `route.query` and calls `processUnsubscribe` on mount with `action: 'unsubscribe'`. The re-subscribe button calls again with `action: 'resubscribe'`.
