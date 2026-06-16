# Implementation Plan: Admin Security Hardening

**Branch**: `015-admin-security-hardening` | **Date**: 2026-06-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/015-admin-security-hardening/spec.md`

## Summary

Replace the client-side UID gate in Admin.vue with server-verified Firebase custom claims. Guard the unprotected `getUsers` callable server-side. Move the `initializeContributors` migration write-path into a privileged Cloud Function callable using Admin SDK so it bypasses Firestore rules safely. Provide a one-time developer script to provision the `admin: true` claim on the three existing admin accounts.

## Technical Context

**Language/Version**: JavaScript (Node.js 18 for Functions; ES2022 for frontend)

**Primary Dependencies**: firebase-functions/v2/https (onCall), firebase-admin/auth (getAuth, setCustomUserClaims, getIdTokenResult), Vuex 4, Vue 3

**Storage**: Cloud Firestore — `users`, `contributors` collections

**Testing**: Manual golden-path testing per constitution (no formal test suite). Verified by: (a) calling `getUsers` without admin credentials and confirming rejection; (b) logging in as admin and confirming Admin.vue appears without any hardcoded UID check.

**Target Platform**: Firebase Functions (Node.js runtime) + Firebase Hosting (SPA)

**Project Type**: Web application (SPA + serverless backend)

**Performance Goals**: No new latency requirements. The single `getIdTokenResult()` call on login is cached by the Firebase SDK and adds negligible overhead (~0ms on subsequent calls within the same session).

**Constraints**: Token refresh latency — after setting a custom claim, it takes effect on the next token refresh (up to 1 hour) or on a forced refresh. Admin access grants are not expected to be immediate in this project.

**Scale/Scope**: 3 admin accounts, ~4k builds, ~4M reads/month. No change to read volume from this feature.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | ✅ PASS | Custom claims are the native Firebase pattern for role authorization. No new package or service. |
| II. Incremental Quality | ✅ PASS | Fixes an active security hole. The `abilityHero` reference bug in Admin.vue is fixed in the same pass. |
| III. Consistent UX & Component Reuse | ✅ PASS | UI gate becomes a single Vuex computed (`isAdmin`). No new UI components. |
| IV. Cost-Conscious Infrastructure | ✅ PASS | `getIdTokenResult()` is a local JWT decode (no network call after first fetch). Admin SDK claim writes are one-time provisioning. |
| V. Secure Defaults | ✅ PASS | This feature is the direct implementation of Principle V: server-side auth validation on every privileged callable. |

**Constitution Check Result**: All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/015-admin-security-hardening/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code (files changed or created)

```text
scripts/
└── set-admin-claims.js          ← NEW: one-time developer provisioning script

functions/
├── index.js                     ← MODIFIED: export new initializeContributors
└── users/
    ├── getUsers.js              ← MODIFIED: add admin claim guard
    └── initializeContributors.js ← NEW: migration callable via Admin SDK

src/
├── store/
│   └── index.js                 ← MODIFIED: add isAdmin state + getIdTokenResult on auth change
└── views/
    └── Admin.vue                ← MODIFIED: replace UID gate with isAdmin; fix abilityHero bug; call initializeContributors instead of direct Firestore writes
```

**Structure Decision**: Single-project layout. All changes are contained within the existing `functions/` (server) and `src/` (client) trees. One new `scripts/` file for the one-time provisioning tool (not deployed, not bundled).
