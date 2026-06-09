# Feature Specification: Comment Email Notifications

**Feature Branch**: `011-comment-email-notifications`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "I have setup resend and want to add email notifications for comments, inform the build order owner and also the participants in the discussion, include an easy unsubscribe without login, add a new property to the user document to store the unsubscribe info. Include preview in the email and a deep link to the build order."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build Order Owner Receives Comment Notification (Priority: P1)

When someone posts a comment on a build order, the owner of that build order receives an email notification. The email contains a preview of the comment, the commenter's name, and a direct link to the build order so the owner can jump straight to the discussion.

**Why this priority**: The build order owner has the highest stake in new comments — they need to know someone engaged with their content. This is the most fundamental notification scenario.

**Independent Test**: Can be fully tested by posting a comment on a build order and verifying the owner receives a well-formed notification email with the correct content and a working deep link.

**Acceptance Scenarios**:

1. **Given** a user owns a build order and is subscribed to notifications, **When** another user posts a comment on that build order, **Then** the owner receives an email within a reasonable time containing the commenter's name, a preview of the comment text, and a clickable link directly to the build order's comment section.
2. **Given** a build order owner has unsubscribed from notifications for that build order, **When** a new comment is posted, **Then** no notification email is sent to the owner.
3. **Given** the commenter is the same person as the build order owner, **When** they post a comment on their own build order, **Then** no self-notification email is sent.

---

### User Story 2 - Discussion Participants Receive Reply Notifications (Priority: P2)

Users who have previously commented on a build order (discussion participants) receive email notifications when new comments are posted, keeping the conversation alive and surfacing replies.

**Why this priority**: Participants in a discussion expect to be notified of new replies — this is essential for driving engagement and ensuring conversations feel responsive.

**Independent Test**: Can be fully tested by having User A comment on a build order, then User B comment on the same build order, and verifying User A receives a notification email with the comment preview and deep link.

**Acceptance Scenarios**:

1. **Given** User A has previously commented on a build order, **When** User B posts a new comment on the same build order, **Then** User A receives an email notification with a preview of User B's comment and a deep link to the build order.
2. **Given** User A is both a participant and the build order owner, **When** a new comment is posted, **Then** User A receives only one email (not two).
3. **Given** a participant has unsubscribed from notifications for that build order, **When** a new comment is posted, **Then** they do not receive a notification.

---

### User Story 3 - One-Click Unsubscribe Without Login (Priority: P2)

A user can unsubscribe from comment notifications for a specific build order directly from the email, without needing to log in to the application. The unsubscribe action is immediate and requires no additional confirmation steps.

**Why this priority**: Frictionless unsubscribe is both a legal requirement (CAN-SPAM, GDPR) and critical for user trust. Requiring login would make unsubscribe so difficult that users would mark emails as spam instead.

**Independent Test**: Can be fully tested by clicking the unsubscribe link in a notification email and verifying no further notifications are sent for that build order, without ever logging in.

**Acceptance Scenarios**:

1. **Given** a user receives a comment notification email, **When** they click the unsubscribe link in the email, **Then** they are taken to a simple confirmation page (no login required, styled consistently with the existing email verification page) that confirms they have been unsubscribed and offers a one-click re-subscribe button to undo the action.
2. **Given** a user has unsubscribed from a build order's notifications, **When** they later log in and navigate to that build order, **Then** the application reflects their unsubscribed status.
3. **Given** a user unsubscribes without being logged in, **When** the unsubscribe link is used a second time, **Then** the system handles it gracefully (idempotent — no error, no duplicate action).
4. **Given** a user lands on the unsubscribe confirmation page without being logged in, **When** they click the re-subscribe button, **Then** they are re-subscribed immediately using the token for identity — no login is required.

---

### User Story 4 - User Manages Notification Preferences (Priority: P3 — Deferred, out of scope for v1)

In-app subscription management via account settings is not included in v1. The user profile page does not yet support this. Re-subscribing after an email unsubscribe is only possible via the re-subscribe button on the unsubscribe confirmation page.

---

### Edge Cases

- What happens when a user's email address is not on file or is unverified — no notification is sent, the event is silently dropped.
- What happens when an unsubscribe token is invalid or unrecognised — the system shows a simple error page with the message "This unsubscribe link is invalid or has already been used." No account settings link is shown (in-app subscription management is not yet available).
- What happens if the email delivery service is temporarily unavailable — the notification attempt is logged; no retry storm; best-effort delivery.
- What happens when a comment is deleted after the notification is sent — the deep link still points to the build order; no special handling needed.
- How does the system handle a user who comments on dozens of build orders — each build order has an independent subscription, unsubscribing from one does not affect others.
- What happens if multiple comments are posted in rapid succession — the system applies a per-recipient, per-build-order cooldown of 1 hour; only the first triggering comment in the window sends a notification, subsequent comments within that window are skipped for that recipient.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically subscribe a user to comment notifications for a build order when they create it (as owner) or post their first comment on it (as participant) — no explicit opt-in required.
- **FR-002**: System MUST send a comment notification email to the build order owner when a new comment is posted on their build order.
- **FR-003**: System MUST send a comment notification email to all previous commenters (discussion participants) on a build order when a new comment is posted.
- **FR-004**: System MUST NOT send a notification to the user who posted the comment (no self-notifications).
- **FR-005**: System MUST NOT send duplicate notifications when a user is both the build order owner and a discussion participant.
- **FR-006**: Each notification email MUST include a preview of the comment text (up to 280 characters, truncated with ellipsis if longer).
- **FR-007**: Each notification email MUST include a direct deep link to the build order's comment section.
- **FR-008**: Each notification email MUST include a one-click unsubscribe link specific to the build order that triggered the notification.
- **FR-009**: Clicking the unsubscribe link MUST unsubscribe the user from that build order's notifications without requiring them to log in.
- **FR-010**: The unsubscribe action MUST be idempotent — clicking it multiple times has the same effect as clicking it once.
- **FR-011**: The system MUST store notification subscription preferences in the user document, with per-build-order unsubscribe granularity.
- **FR-012**: *(Deferred — out of scope for v1)* In-app subscription management via account settings is not implemented in this version; unsubscribe is only available via the email link.
- **FR-013**: Re-subscribing to a previously unsubscribed build order MUST resume notifications for future comments.
- **FR-014**: System MUST enforce a 1-hour cooldown per recipient per build order — if a notification was already sent within the past hour, subsequent comments on the same build order do not trigger additional emails for that recipient until the cooldown expires.
- **FR-015**: Every notification email MUST include valid sender information in the footer and a clearly labelled unsubscribe link to meet standard best-effort email compliance (CAN-SPAM minimum).
- **FR-016**: The unsubscribe confirmation page MUST display a success message naming the build order, require no login, and offer a one-click re-subscribe button to reverse the action. Re-subscribing from this page MUST also work without login — the unsubscribe token is sufficient to identify the user for both actions. The page visual style MUST be consistent with the existing email verification page.
- **FR-017**: When an unsubscribe link contains an invalid or unrecognised token, the system MUST display a simple error page with the message "This unsubscribe link is invalid or has already been used." — no account settings link or further navigation is required.

### Key Entities

- **User Notification Preferences**: A field on the user document containing two sub-structures: (1) a set of opted-out build order IDs representing active opt-outs, and (2) a map of build order ID → last-notified timestamp used to enforce the 1-hour cooldown. Absence from the opted-out set means the user is subscribed.
- **Comment Notification Event**: Represents a triggered notification for a single comment posted — includes comment author, build order reference, comment preview, and list of recipients.
- **Unsubscribe Token**: A unique, non-guessable token embedded in notification emails that identifies the user and build order for passwordless unsubscribe. Tokens do not expire and remain valid for the lifetime of the user account.
- **Build Order**: The content entity being commented on — identified by a stable ID used for deep linking and subscription tracking.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Notification emails are delivered within 60 seconds of a comment being posted under normal conditions.
- **SC-002**: 100% of unsubscribe link clicks result in immediate notification suppression for the specified build order — measurable by verifying no subsequent emails are sent after an unsubscribe event.
- **SC-003**: Unsubscribe flow completes in under 5 seconds (from click to confirmed suppression) without requiring login.
- **SC-004**: Zero duplicate notification emails are sent to any single recipient for a single comment event.
- **SC-005**: Email open rate of at least 25% within 48 hours, indicating the content (preview + deep link) is compelling enough to engage recipients.
- **SC-006**: Fewer than 1% of notification emails result in spam complaints (measured via email delivery provider dashboard).

## Assumptions

- Users already have email addresses stored in their accounts from the existing authentication system; no new email collection is required.
- The Resend email delivery service is already configured and operational in the project — this feature adds templates and triggers, not service setup.
- Subscription is automatic: a user is subscribed to notifications for a build order the moment they create it (ownership) or post their first comment on it. No explicit opt-in is required; users must actively opt out via the unsubscribe link.
- Build orders have stable, persistent URLs that can serve as deep links — the URL format is already established in the application.
- The user document schema supports adding a new field for notification preferences without a migration that requires downtime.
- Comment preview truncation at 280 characters is a reasonable balance between context and email size.
- In-app notification settings (User Story 4) are out of scope for v1 — the user profile page does not yet support subscription management. Unsubscribe is only possible via the email link.
- Digest/batching emails are out of scope — notifications use a per-hour cooldown (one email per recipient per build order per hour) rather than batching multiple comments into a single summary email.
- Unsubscribe is per-build-order only in v1; a global "unsubscribe from all" is not offered in notification emails (users can manage all subscriptions from account settings).
- Bot/spam protection on commenting is out of scope — the existing login requirement combined with the 1-hour notification cooldown limits abuse sufficiently; if bot accounts become a problem, protection at sign-up is the preferred mitigation point.

## Clarifications

### Session 2026-06-09

- Q: If multiple comments arrive in a short window, should recipients receive one email per comment or should delivery be throttled? → A: Cooldown — max 1 email per recipient per build order per hour; subsequent comments in the window are skipped.
- Q: Should unsubscribe tokens expire? → A: Never expire — token is valid for the lifetime of the user account.
- Q: When does a user first become subscribed to notifications for a build order? → A: Auto-subscribe — owner on build order creation, participants on first comment; no opt-in required.
- Q: What level of email compliance is required for v1? → A: Standard best-effort — unsubscribe link in every email plus valid sender info in footer.
- Q: Should unsubscribe support per-build-order only, or also a global "unsubscribe from all" option? → A: Per-build-order only for v1; global management available via account settings.
- Q: What should the unsubscribe confirmation page provide beyond a success message? → A: Success message + one-click re-subscribe button; simple style consistent with the existing email verification page.
- Q: What should happen when an unsubscribe token is invalid? → A: Show error page with message "This unsubscribe link is invalid or has already been used." — no account settings link (in-app subscription management not yet available).
- Q: What does the user document's notification preferences field store? → A: Set of opted-out build order IDs + map of build order ID → last-notified timestamp for cooldown; absence from opted-out set = subscribed.
- Q: Does the re-subscribe button on the confirmation page work without login? → A: Yes — the unsubscribe token is sufficient identity for both unsubscribe and re-subscribe; no login required for either action.
