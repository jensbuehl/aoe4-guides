# Data Model: Admin Security Hardening

No new Firestore collections or schema changes. All authorization state lives in the Firebase Auth token (JWT custom claims), not in Firestore documents.

---

## Admin Custom Claim (Firebase Auth token)

**Location**: Firebase Auth ID token (JWT payload), not Firestore

| Field  | Type    | Value  | Notes |
|--------|---------|--------|-------|
| admin  | boolean | `true` | Absent (or `undefined`) on non-admin accounts. Set once via `setCustomUserClaims`. |

**Lifecycle**:
- Set by: `scripts/set-admin-claims.js` (one-time, developer-run)
- Read by: `user.getIdTokenResult()` in `src/store/index.js` → stored as `store.state.isAdmin`
- Read by: `req.auth.token.admin` in every privileged Firebase callable
- Revoked by: calling `setCustomUserClaims(uid, {})` to clear the claim

---

## Contributor Document (existing, no schema change)

**Collection**: `contributors/{userId}`

| Field       | Type   | Notes |
|-------------|--------|-------|
| authorId    | string | Firebase Auth UID |
| displayName | string | Synced from Auth user |
| boCount     | number | Build order count |
| viewCount   | number | Total views across builds |
| icon        | string | Avatar URL (optional) |

**Migration note**: The `initializeContributors` callable creates these documents for users who pre-date the `createContributor` onCreate trigger. It uses Admin SDK writes and is idempotent (uses `set` with `merge: true`).

---

## Vuex State Addition

**File**: `src/store/index.js`

| State key | Type    | Default | Source |
|-----------|---------|---------|--------|
| isAdmin   | boolean | `false` | Set in `onAuthStateChanged` via `user.getIdTokenResult().claims.admin` |
