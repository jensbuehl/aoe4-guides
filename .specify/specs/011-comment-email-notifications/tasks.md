# Tasks: Comment Email Notifications

**Input**: Design documents from `.specify/specs/011-comment-email-notifications/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/processUnsubscribe.md ✅, quickstart.md ✅

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to
- No test suite — manual golden-path testing per constitution

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install Resend and configure the API key secret. Blocks all notification work.

- [x] T001 Add `"resend": "^4.0.0"` to `functions/package.json` dependencies and run `npm install` in `functions/`
- [ ] T002 Store Resend API key as Firebase Secret: `firebase functions:secrets:set RESEND_API_KEY` — verify with `firebase functions:secrets:access RESEND_API_KEY` ⚠️ MANUAL STEP — run this in your terminal before deploying

**Checkpoint**: Resend SDK installed and API key accessible to Firebase Functions runtime.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement the `processUnsubscribe` callable function — required by the email links in US1/US2 and the frontend in US3.

**⚠️ CRITICAL**: US3 cannot be completed until this phase is done. US1/US2 email links reference this function's endpoint.

- [x] T003 Implement `processUnsubscribe` callable in `functions/notifications/processUnsubscribe.js` — use `onCall` from `firebase-functions/v2/https`; validate all four required params (`userId`, `buildId`, `token`, `action`); read `users/{userId}` via admin SDK; verify `notificationPreferences.tokens[buildId] === token`; on `'unsubscribe'`: add `buildId` to `optedOut` array (idempotent); on `'resubscribe'`: remove `buildId` from `optedOut` array (idempotent); return `{ success: true, action, buildId }` on success; throw `INVALID_ARGUMENT` on bad token or params, `NOT_FOUND` if user missing
- [x] T004 Export `processUnsubscribe` from `functions/index.js`

**Checkpoint**: `processUnsubscribe` callable is deployed and responds correctly to valid and invalid requests.

---

## Phase 3: User Story 1 — Build Order Owner Receives Comment Notification (Priority: P1) 🎯 MVP

**Goal**: When any user posts a comment on a build order, the owner receives an email with the commenter's name, a 280-char comment preview, a deep link to the build order, and a working unsubscribe link.

**Independent Test**: Log in as User A (owner of a build order). Log in as User B in another session and post a comment. Verify User A receives a notification email within 60 seconds. Verify email contains commenter name, comment preview, `https://aoe4guides.com/builds/{buildId}` deep link, and an unsubscribe URL in the format `/account/unsubscribe?uid=...&bid=...&t=...`.

- [x] T005 [US1] Scaffold `functions/notifications/notifyCommenters.js` — declare `onDocumentCreated` trigger on `comments/{commentId}` (from `firebase-functions/v2/firestore`); import `defineSecret` from `firebase-functions/params`; declare `const resendApiKey = defineSecret('RESEND_API_KEY')`; add secret to function options; import `firebase-admin`
- [x] T006 [US1] Add owner recipient logic to `notifyCommenters.js` — read `builds/{comment.buildId}` via admin SDK to get `authorUid`; skip entirely if `authorUid === comment.authorId` (self-comment); initialise empty `Set<string> recipients`; add `authorUid` to recipients
- [x] T007 [US1] Add per-recipient eligibility check to `notifyCommenters.js` — for each recipient uid: read `users/{uid}` via admin SDK to get `email` and `notificationPreferences`; skip if `notificationPreferences.optedOut` includes `comment.buildId`; skip if `notificationPreferences.lastNotifiedAt[buildId]` is within 3600 seconds of now
- [x] T008 [US1] Add token generation and email send to `notifyCommenters.js` — for each eligible recipient: generate token with `require('crypto').randomBytes(32).toString('hex')` if `notificationPreferences.tokens[buildId]` is absent; build unsubscribe URL `/account/unsubscribe?uid={uid}&bid={buildId}&t={token}`; build plain HTML email (subject: `New comment on {build.title}`, body: commenter display name + comment text truncated at 280 chars with `…` if longer + "View discussion" link to `https://aoe4guides.com/builds/{buildId}` + footer with site name and unsubscribe link); call `new Resend(resendApiKey.value()).emails.send({...})`; collect pending Firestore writes
- [x] T009 [US1] Add batch Firestore write to `notifyCommenters.js` — after all sends, use `admin.firestore().batch()` to write `notificationPreferences.tokens[buildId]` and `notificationPreferences.lastNotifiedAt[buildId]` (ISO timestamp) for each notified recipient in one batch commit using `merge: true`
- [x] T010 [US1] Export `notifyCommenters` from `functions/index.js` and deploy both new functions: `firebase deploy --only functions:notifyCommenters,functions:processUnsubscribe`

**Checkpoint**: Post a comment as a non-owner → owner receives email within 60 seconds. Self-comment → no email. Check Firestore `users/{ownerUid}.notificationPreferences` contains token and lastNotifiedAt for the build.

---

## Phase 4: User Story 2 — Discussion Participants Receive Reply Notifications (Priority: P2)

**Goal**: All previous commenters on a build order receive notifications when new comments are posted, with dedup ensuring no recipient gets more than one email per event even if they are both owner and participant.

**Independent Test**: User A comments on a build order. User B (owner) comments. Verify User A receives an email (participant notification). Verify User B does NOT receive a self-notification. Then User C comments — verify User A and User B each receive exactly one email (not two), confirming dedup.

- [x] T011 [P] [US2] Extend recipient determination in `notifyCommenters.js` — query `comments` collection where `buildId == comment.buildId` via admin SDK; extract unique `authorId` values; merge into the `recipients` Set alongside `authorUid`; remove `comment.authorId` (the new commenter) from the Set to prevent self-notifications; the Set dedup handles owner-who-is-also-participant automatically
- [x] T012 [US2] Verify eligibility loop in `notifyCommenters.js` already processes all recipients uniformly (added in T007) — confirm comments query result is within acceptable Firestore read budget for expected build sizes; no code change expected if T007 used a loop over the Set

**Checkpoint**: Three-user scenario: post comment as C, verify A (owner) and B (previous commenter) each receive exactly one email; C receives nothing.

---

## Phase 5: User Story 3 — One-Click Unsubscribe Without Login (Priority: P2)

**Goal**: Clicking the unsubscribe link from any notification email opens a confirmation page (no login) showing "You've been unsubscribed from [Build Order Title]" with a re-subscribe button. Invalid tokens show "This unsubscribe link is invalid or has already been used."

**Independent Test**: Click the unsubscribe link from a received notification email. Verify the `/account/unsubscribe` page loads without login, shows the build order name, and confirms unsubscription. Click re-subscribe — verify the success state changes. Post another comment — verify no notification arrives for the unsubscribed user. Click the unsubscribe link again (already unsubscribed) — verify idempotent success (not an error). Use a tampered token URL — verify error message appears.

- [x] T013 [P] [US3] Create `src/composables/data/notificationService.js` — import `getFunctions` and `httpsCallable` from `firebase/functions`; export `async function processUnsubscribeNotification({ userId, buildId, token, action })` that calls the `processUnsubscribe` callable and returns the result
- [x] T014 [US3] Create `src/views/account/Unsubscribe.vue` — use identical layout to `AccountAction.vue` (`v-container` → centred `v-col cols="12" sm="6" lg="4"` → `v-card flat rounded="lg"`); implement four display states via refs: (1) **loading** — `v-card-text` with loading message; (2) **unsubscribed** — `v-card-title` "Unsubscribed", `v-card-text` with build order name, `v-btn color="primary" variant="text"` "Re-subscribe" button; (3) **resubscribed** — `v-card-title` "Re-subscribed", `v-card-text` confirmation; (4) **error** — `v-card-title` "Invalid Link", `v-card-text` "This unsubscribe link is invalid or has already been used."
- [x] T015 [US3] Add `/account/unsubscribe` route to `src/router/index.js` — import `Unsubscribe` component; add route `{ path: '/account/unsubscribe', name: 'Unsubscribe', component: Unsubscribe, meta: { title: 'Unsubscribe' } }` (no `requiresAuth`); place before the catch-all route
- [x] T016 [US3] Wire `Unsubscribe.vue` logic — in `setup()`: read `uid`, `bid`, `t` from `route.query`; on `onMounted`: if any param missing, set error state; else call `processUnsubscribeNotification({ userId: uid, buildId: bid, token: t, action: 'unsubscribe' })`; on success set unsubscribed state (store `buildId` for display); on error set error state; re-subscribe button calls `processUnsubscribeNotification({ ..., action: 'resubscribe' })` and sets resubscribed state

**Checkpoint**: Full unsubscribe flow from email link → confirmation page → re-subscribe button all work without login. Subsequent comment → unsubscribed user receives no email.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T017 [P] Review `firestore.rules` — no changes needed; admin SDK bypasses rules; existing user write rule covers notificationPreferences field — confirm existing `allow write: if request.auth.uid == userId` on `users/{userId}` covers the new `notificationPreferences` field (expected: no rule change needed as admin SDK bypasses rules and client writes remain auth-gated)
- [x] T018 [P] Verify email template in `notifyCommenters.js` satisfies FR-015 — footer includes "AoE4 Guides" sender name, FROM_EMAIL address, and labelled "Unsubscribe" link — confirm footer includes valid sender name/address and a clearly labelled "Unsubscribe" link (CAN-SPAM minimum)
- [ ] T019 Run full end-to-end test per `quickstart.md` steps 1–7 and verify all six success criteria (SC-001 through SC-006) are observable

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (Resend installed) — blocks US3; US1/US2 can begin in parallel with Phase 2 since processUnsubscribe is only called from the frontend
- **US1 (Phase 3)**: Depends on Phase 1 (Resend SDK). Phase 2 can be concurrent.
- **US2 (Phase 4)**: Depends on Phase 3 (extends notifyCommenters.js)
- **US3 (Phase 5)**: Depends on Phase 2 (processUnsubscribe callable) and Phase 3 (emails contain the unsubscribe URL to test against)
- **Polish (Phase 6)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 1 setup — start after T001/T002
- **US2 (P2)**: Depends on US1 (extends the same function)
- **US3 (P2)**: Depends on Phase 2 (callable) and Phase 3 (emails to test the link)

### Within Each Phase

- T005 → T006 → T007 → T008 → T009 → T010 (sequential, all in same file)
- T011 and T012 are small extensions to the same file (sequential)
- T013, T014, T015, T016 — T013 can run in parallel with T014/T015; T016 depends on T013+T014+T015

---

## Parallel Opportunities

```
Phase 1 (T001 + T002): run together — different operations
Phase 2 (T003 + T004): T003 then T004 (T004 depends on T003)

After Phase 1 complete:
  Stream A: T003 → T004 (Phase 2, processUnsubscribe callable)
  Stream B: T005 → T006 → T007 → T008 → T009 → T010 (Phase 3, notifyCommenters)
  Stream A and B are independent and can run in parallel

After Phase 3 complete:
  T011 → T012 (Phase 4, extend notifyCommenters)
  T013 + [T014 → T015 → T016] (Phase 5, frontend — T013 parallel with T014)
  T014, T015 can run in parallel (different files)
```

---

## Implementation Strategy

### MVP (US1 Only — Phases 1–3)

1. Phase 1: Install Resend + configure secret (T001–T002)
2. Phase 3: Implement owner notification trigger (T005–T010)
3. **VALIDATE**: Post a comment → owner receives email with preview, deep link, unsubscribe URL
4. Phase 2 can be deferred until US3 is needed

### Incremental Delivery

1. Phases 1 + 3 → Owner notifications working (MVP)
2. Phase 4 → Participant notifications + dedup working
3. Phase 2 + Phase 5 → Full unsubscribe/re-subscribe flow from email link
4. Phase 6 → Polish and end-to-end verification

---

## Notes

- [P] = different files, no dependency on incomplete tasks in same phase
- Constitution: Simplicity First — plain HTML email, no extra abstraction layer, all notification logic in one function file
- `notificationPreferences` field is optional on user doc — absent means subscribed (no migration needed)
- Resend free tier limit: 3,000 emails/month — monitor via Resend dashboard after launch
- All server-side Firestore writes use admin SDK (bypasses security rules); no rule changes required
