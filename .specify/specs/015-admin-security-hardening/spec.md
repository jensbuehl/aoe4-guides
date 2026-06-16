# Feature Specification: Admin Security Hardening

**Feature Branch**: `015-admin-security-hardening`

**Created**: 2026-06-16

**Status**: Draft

**Input**: User description: "Admin security: replace client-side UID gate with server-side custom-claims authorization; fix unguarded getUsers callable; move privileged writes into Admin SDK callables."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unauthorized caller is rejected by server (Priority: P1)

An anonymous user or a logged-in non-admin directly invokes a privileged server function. The server rejects the call with a permission-denied error before any data is returned or written.

**Why this priority**: This is the core security hole. Currently any caller — authenticated or not — can enumerate users via `getUsers`. Fixing this eliminates the data leak and protects all admin operations at the server boundary, not the UI boundary.

**Independent Test**: Can be tested by calling the `getUsers` (or any privileged callable) directly via Firebase client SDK or curl without admin credentials. No data should be returned.

**Acceptance Scenarios**:

1. **Given** a user who is not logged in, **When** they invoke the `getUsers` callable, **Then** the server returns a `permission-denied` error and no user data is disclosed.
2. **Given** a logged-in user without admin privileges, **When** they invoke any admin callable, **Then** the server returns `permission-denied` and no data is disclosed.
3. **Given** a logged-in user with admin privileges, **When** they invoke the `getUsers` callable, **Then** the server returns the full user list successfully.

---

### User Story 2 - Admin UI is gated by server-verified claim, not hardcoded UIDs (Priority: P2)

An admin logs in and the admin UI becomes visible based on their verified identity from the server, not from a hardcoded UID list in the shipped JavaScript bundle.

**Why this priority**: The hardcoded UIDs are a maintenance smell and a security-through-obscurity design. Any dev who reads the bundle can see the admin UIDs. Using server-verified claims removes the list from client code entirely.

**Independent Test**: Can be tested by inspecting the shipped JS bundle for absence of hardcoded UID strings, and by verifying the admin panel appears only for claim-holding users regardless of UID.

**Acceptance Scenarios**:

1. **Given** the shipped JavaScript bundle, **When** inspected, **Then** no hardcoded Firebase UIDs appear in any source file.
2. **Given** a user with an `admin` custom claim on their account, **When** they log in and navigate to the admin section, **Then** the admin UI is visible and functional.
3. **Given** a user without the `admin` claim, **When** they log in, **Then** the admin UI is not shown regardless of their UID.
4. **Given** the admin claim is revoked from a user, **When** that user refreshes their session (re-authenticates or token refresh), **Then** they lose access to the admin UI.

---

### User Story 3 - Admin migrations execute with correct DB permissions (Priority: P3)

An admin triggers a data migration (e.g., initializing contributor records). The migration completes fully, including creating new records where none previously existed, without being silently blocked by Firestore security rules.

**Why this priority**: The current migration silently fails on `addContributor` for new records because there is no `allow create` rule for the `contributors` collection. Moving migration writes into a privileged server callable (which uses Admin SDK and bypasses rules) fixes this.

**Independent Test**: Can be tested by running a migration against an empty `contributors` collection and verifying new documents are created for each user.

**Acceptance Scenarios**:

1. **Given** a `contributors` collection that is empty, **When** an admin triggers the Initialize Contributors migration, **Then** a contributor document is created for every user in the system.
2. **Given** the migration callable runs, **When** it completes, **Then** the function returns a success count equal to the number of users processed.
3. **Given** the migration is triggered by a non-admin, **When** the callable is invoked, **Then** it is rejected with `permission-denied` before any writes occur.

---

### Edge Cases

- What happens when an admin's custom claim token has not yet refreshed after claim assignment? (Claim takes effect on next token refresh, not immediately — the UI should handle this gracefully.)
- What happens if the `getUsers` callable is called with a valid admin token but Firestore returns an error? (The callable should propagate the error, not swallow it.)
- What if a migration is triggered twice? (Idempotency: re-running should update existing docs, not fail or duplicate.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All privileged server functions MUST verify the caller holds a valid admin custom claim before executing any read or write operations.
- **FR-002**: The `getUsers` server function MUST reject unauthenticated callers with `permission-denied`.
- **FR-003**: The `getUsers` server function MUST reject authenticated callers who lack the `admin` custom claim with `permission-denied`.
- **FR-004**: The admin UI visibility MUST be determined by reading a server-verified claim from the user's identity token, not by comparing against a hardcoded list of UIDs.
- **FR-005**: No Firebase UID values of admin accounts MUST appear as hardcoded literals in any client-side source file.
- **FR-006**: A one-time provisioning mechanism MUST exist to grant the `admin` custom claim to designated user accounts by UID, executable by a developer outside of the application UI.
- **FR-007**: All data migrations that create or overwrite Firestore documents MUST execute via a privileged server callable using Admin SDK credentials, bypassing client-enforced Firestore rules.
- **FR-008**: The Initialize Contributors migration MUST successfully create new contributor documents when none previously exist for a given user.
- **FR-009**: The Firestore security rules for the `contributors` collection MUST NOT require a special client-side write carve-out for admin migrations; all privileged writes are server-side.

### Key Entities

- **Admin Custom Claim**: A boolean flag (`admin: true`) attached to a Firebase Auth user's token. Set server-side by a developer using the Admin SDK. Read client-side from the decoded ID token. Not stored in Firestore.
- **Privileged Callable**: A Firebase Cloud Function that checks `req.auth.token.admin === true` before executing any logic. Returns `HttpsError('permission-denied')` otherwise.
- **Contributor Document**: A Firestore document under `contributors/{userId}` tracking build count and view count per user. Currently created only via migration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero user records are returned when `getUsers` is called by an unauthenticated or non-admin authenticated caller — verified by direct function invocation test.
- **SC-002**: The compiled and deployed JavaScript bundle contains no hardcoded Firebase UID strings for any admin accounts.
- **SC-003**: An admin can complete the Initialize Contributors migration against a previously empty `contributors` collection with 100% of user records successfully created (0 silent failures).
- **SC-004**: Admin UI visibility is correctly toggled within one session (login/logout cycle) when admin claim is present or absent — no false positives or false negatives.
- **SC-005**: Time for a developer to provision admin access for a new admin account is under 5 minutes using the provided one-time script.

## Assumptions

- The three existing admin UIDs are known and will be provisioned with the `admin` claim via the one-time script before the new auth checks go live; there is no grace period where the old UID-comparison approach runs in parallel.
- Firebase token refresh occurs on re-login or explicit token force-refresh; the app does not need to auto-detect claim changes mid-session.
- The `getUsers` callable is the only existing callable that currently lacks an auth guard; other callables either already check auth or are not privileged.
- Migration callables are invoked exclusively from the Admin UI, which is already gated — the server-side guard is a defense-in-depth measure, not the only access control.
- Email addresses of users remain out of scope for `getUsers` responses (already redacted in the current implementation).
- The existing Firestore rules for collections other than `contributors` do not need migration-related changes in this spec.
