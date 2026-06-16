# Research: Admin Security Hardening

**Phase**: 0 — Resolved unknowns before Phase 1 design

---

## Decision 1: How to propagate custom claims to the Vue client

**Decision**: Call `user.getIdTokenResult()` inside the `onAuthStateChanged` callback in `src/store/index.js`. Store the result as `isAdmin: Boolean` in Vuex state.

**Rationale**: `user.toJSON()` (currently used in `onAuthStateChanged`) serializes the Firebase User profile but does NOT include custom claims. Claims are only accessible from the decoded ID token, which `getIdTokenResult()` returns. The Firebase SDK caches the decoded token in memory for the session lifetime, so repeated accesses within the same session cost nothing after the first call. No extra package or service is needed.

**Alternatives considered**:
- Read the claim on-demand inside Admin.vue using a computed that calls `auth.currentUser?.getIdTokenResult()`: Rejected because it requires an async computed or a separate reactive fetch in the component, which is more complex than storing it in Vuex once at login time.
- Store the claim in a Firestore `users` document and read it from there: Rejected because it adds a Firestore read per login and is redundant with the server-authoritative Firebase Auth token.

---

## Decision 2: When do custom claims take effect after being set?

**Decision**: Claims take effect on the next token refresh, which happens automatically every hour. For immediate effect (e.g., after provisioning during development), the developer calls `auth.currentUser.getIdTokenResult(true)` (force refresh) or signs out and back in. No polling or real-time update mechanism is required for this project.

**Rationale**: Admin claim provisioning happens once per admin account. There is no operational scenario where a claim is set and the same browser session needs to pick it up instantly without re-login. The one-time delay is acceptable.

**Alternatives considered**:
- Poll for token refresh via a `setInterval`: Rejected — unnecessary complexity for a one-time provisioning event.
- Use Firestore to signal claim refresh: Rejected — overkill for 3 admin accounts.

---

## Decision 3: Guard level for `updateUserDisplayName` / `updateContributorDisplayName`

**Decision**: Leave these callables at their current `!data.auth` guard (login required) for now. They are called during normal user signup to set the caller's own display name. Adding admin-only guards would break the signup flow.

**Rationale**: These callables accept an arbitrary `uid` parameter and update that uid's display name — a privilege escalation risk (any logged-in user can rename any other user). However, fixing this is a separate concern from admin security hardening. The fix (validating that `data.data.uid === data.auth.uid` for non-admins) should be tracked as a follow-on issue, not bundled here.

**Alternatives considered**:
- Fix the uid-validation bug in this feature cycle: Rejected — out of spec scope, different risk class (user-to-user impersonation vs. unauthenticated data dump).

---

## Decision 4: Migration callable — Admin SDK vs. Firestore rules carve-out

**Decision**: Create a new `initializeContributors` callable (`functions/users/initializeContributors.js`) that uses Admin SDK to write directly to Firestore, bypassing security rules. The Firestore rules for `contributors` get NO new write carve-out for admin users.

**Rationale**: The Admin SDK bypasses all Firestore rules, so the migration can create documents without any `allow create` rule on the collection. This is the correct pattern for privileged background operations. Adding a client-side admin write rule to Firestore would require client-identity-based rules which are harder to audit and can be misconfigured.

**Alternatives considered**:
- Add `allow create if request.auth.token.admin == true` to Firestore rules: Rejected — rules would need to be tested independently; Admin SDK is already available in functions and simpler.

---

## Decision 5: One-time provisioning script placement

**Decision**: Place the provisioning script at `scripts/set-admin-claims.js`. It is a plain Node.js script (not a Cloud Function). It imports Firebase Admin SDK directly with a service account credential and calls `setCustomUserClaims(uid, { admin: true })` for each of the three admin UIDs.

**Rationale**: A standalone script is simpler than a one-off Cloud Function or a UI-driven flow. It runs locally or in a secure terminal session by the developer and is never deployed or bundled. The three UIDs to provision are provided as constants in the script or as CLI arguments — no sensitive data is committed (the script contains UIDs, which are non-secret identifiers, not credentials).

**Alternatives considered**:
- A Firebase Function triggered by a Firestore write: Rejected — more complex, harder to audit, could be triggered accidentally.
- Using the Firebase Console to set claims manually: Rejected — no UI for custom claims in the Console; Admin SDK is the only path.
