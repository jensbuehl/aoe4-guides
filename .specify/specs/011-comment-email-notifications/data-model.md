# Data Model: Comment Email Notifications

**Feature**: 011-comment-email-notifications | **Date**: 2026-06-09

## Changed Documents

### `users/{userId}` — New field: `notificationPreferences`

This is the only schema change. No new collections are created.

```
users/{userId}: {
  uid: string,
  email: string,
  displayName: string,
  avatar: string | null,
  id: string,

  // NEW — optional field, absent until first notification is sent to this user
  notificationPreferences: {
    optedOut: string[],                    // build order IDs the user has unsubscribed from
    lastNotifiedAt: { [buildId]: string }, // ISO 8601 timestamp of last notification per build
    tokens: { [buildId]: string }          // unsubscribe token (hex) per build order
  }
}
```

**Field details**:

| Sub-field | Type | Description |
|-----------|------|-------------|
| `optedOut` | `string[]` | Array of build order document IDs. Absence of an ID means subscribed (default). Added to on unsubscribe; removed on re-subscribe. |
| `lastNotifiedAt` | `{ [buildId: string]: string }` | ISO 8601 timestamp string. Used for 1-hour cooldown check. Written after each successful notification send. |
| `tokens` | `{ [buildId: string]: string }` | 64-char hex string (`crypto.randomBytes(32).toString('hex')`). Generated once per user+build pair on first notification. Never regenerated (non-expiring per spec). Used to verify identity on the unsubscribe/re-subscribe endpoint. |

**Absence semantics**:
- `notificationPreferences` absent on user document → user has no notifications history; subscribed by default for any build they own or comment on.
- `notificationPreferences.optedOut` not containing a buildId → user is subscribed for that build.
- `notificationPreferences.lastNotifiedAt[buildId]` absent → no cooldown active, eligible to receive notification.
- `notificationPreferences.tokens[buildId]` absent → token will be generated on next notification send.

---

## Existing Documents (read-only for this feature)

### `comments/{commentId}` — read by trigger

```
comments/{commentId}: {
  id: string,
  buildId: string,       // ← used to look up build owner and other commenters
  authorId: string,      // ← commenter's uid; excluded from recipient list
  author: string,        // ← commenter's display name; included in email body
  text: string,          // ← truncated to 280 chars for email preview
  timeCreated: Timestamp,
  timeUpdated: Timestamp
}
```

### `builds/{buildId}` — read by trigger

```
builds/{buildId}: {
  id: string,
  authorUid: string,   // ← build order owner; added to recipient list
  title: string,       // ← used in email subject and unsubscribe confirmation page
  ...
}
```

---

## Firestore Security Rules

**No rule changes required.** All notification preference writes go through the `processUnsubscribe` callable function using the admin SDK, which bypasses client-facing rules. The existing `users/{userId}` rule `allow read/write: if request.auth.uid == userId` already allows logged-in users to read their own preferences (for future in-app management).

---

## Indexes

**No new indexes required.** The query `comments where buildId == X` uses the existing `buildId` field. If a composite index on `(buildId, authorId)` is needed (Firestore may auto-prompt), add it to `firestore.indexes.json`.

---

## Unsubscribe URL

```
https://aoe4guides.com/account/unsubscribe?uid={userId}&bid={buildId}&t={token}
```

All three parameters are required. The callable function validates that `users/{userId}.notificationPreferences.tokens[buildId] === token` before mutating the document.
