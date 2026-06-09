# Quickstart: Comment Email Notifications

**Feature**: 011-comment-email-notifications | **Date**: 2026-06-09

## Prerequisites

- Firebase CLI installed and authenticated
- Node 20 installed
- Resend account with API key (already configured per spec)

## 1. Install Resend SDK in Functions

```bash
cd functions
npm install resend
```

## 2. Set Resend API Key as Firebase Secret

```bash
firebase functions:secrets:set RESEND_API_KEY
# paste your Resend API key when prompted
```

Verify it's set:
```bash
firebase functions:secrets:access RESEND_API_KEY
```

## 3. Local Emulator Setup

The Firebase Emulator supports Firestore triggers and callable functions.

```bash
# From project root
firebase emulators:start --only functions,firestore
```

To test the notification trigger locally, create a comment document in the Firestore emulator UI at `http://localhost:4000` in the `comments` collection. The trigger should fire and attempt to send via Resend (real API call — use a test API key for local development).

## 4. Test the Unsubscribe Flow

After deploying (or in emulator), you can manually test:

```bash
# Call processUnsubscribe callable via curl (local emulator)
curl -X POST http://localhost:5001/{project-id}/us-central1/processUnsubscribe \
  -H "Content-Type: application/json" \
  -d '{"data": {"userId": "...", "buildId": "...", "token": "...", "action": "unsubscribe"}}'
```

## 5. Deploy

```bash
# Deploy only the new notification functions
firebase deploy --only functions:notifyCommenters,functions:processUnsubscribe
```

## 6. Environment Variables

| Variable | Where Set | Purpose |
|----------|-----------|---------|
| `RESEND_API_KEY` | Firebase Secret | Authenticates Resend email sends |

No frontend environment variables are required — the callable function endpoint is resolved automatically by the Firebase JS SDK.

## 7. Verify End-to-End

1. Log in as User A, post a comment on any build order.
2. Log in as User B (different email), post a comment on the same build order.
3. User A should receive a notification email within 60 seconds.
4. Click the unsubscribe link in the email.
5. Confirm the `/account/unsubscribe` page loads, shows success, and offers re-subscribe.
6. Verify User A's Firestore `users/{uid}.notificationPreferences.optedOut` contains the build order ID.
7. User B posts another comment — User A should NOT receive a notification.
