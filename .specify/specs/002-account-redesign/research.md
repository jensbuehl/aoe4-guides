# Research: Account Page Redesign & User Avatars

**Feature**: `002-account-redesign` | **Date**: 2026-06-02

No `NEEDS CLARIFICATION` items in Technical Context. All decisions were resolved in spec
clarification. This document records architectural choices and alternatives considered.

---

## Decision 1 — Avatar data location: Firestore `users/{uid}` vs Firebase Auth `photoURL`

**Decision**: Firestore `users/{uid}` document, new field `avatar: { type, ref }`.

**Rationale**: Firebase Auth's `updateProfile({ photoURL })` only accepts a URL string —
it cannot store the `{ type: 'civ', ref: 'ENG' }` structure needed for civ crests. Using
Firestore keeps the full type/ref structure, allows future fields (e.g. `updatedAt`), and
is consistent with how `users/{uid}` already stores email and id.

**Alternatives considered**:
- Auth `photoURL`: Can't store structured data; also requires `reload()` after update for
  Vuex state to see the change — fragile.
- Separate `avatars/{uid}` Firestore collection: unnecessary overhead for a single field.

---

## Decision 2 — Civ crest delivery: bundled assets vs Storage URLs

**Decision**: Serve civ crests from bundled `assets/flags/{code}-small.webp` files — same
images used by build order cards, filter UI, and header. No new Storage reads.

**Rationale**: All civ flag images already ship in the Vite bundle. Serving them from
Storage would add a read (and egress cost) per avatar render. The bundle already includes
these images; using them is free and instant.

**Alternatives considered**:
- Store crest URLs in Storage: unnecessary — the images are already bundled.
- Separate `/public/avatars/civs/` folder: duplication of already-bundled assets.

---

## Decision 3 — Vuex integration: new `userAvatar` slice vs extending `user` object

**Decision**: New `userAvatar: { type: null, ref: null }` slice in Vuex state, loaded
alongside `userFavorites` in the `onAuthStateChanged` handler.

**Rationale**: The `user` state is a direct Firebase Auth User object — adding custom
fields to it would break the identity contract and make future Auth migrations harder.
A parallel `userAvatar` slice mirrors the existing pattern (`snackbar`, `ui.authDialog`)
and is cleared cleanly on logout.

**Alternatives considered**:
- Extend `user` object: pollutes the Firebase Auth User shape.
- Load avatar only on Account page mount: causes a flash on first load and requires
  fetching on every page visit to the header.

---

## Decision 4 — Upload resize: client-side canvas vs Cloud Function

**Decision**: Client-side `canvas` API, resize to 256×256 JPEG crop-center, `image/webp`
quality 0.82. Upload to Firebase Storage at `avatars/{uid}.webp`.

**Rationale**: Browser `canvas` is native — no library, no dependency (Constitution I).
Resizing before upload minimises bytes transferred and stored (typically 10–30 KB for a
face photo at 256×256 WebP). A Cloud Function post-process would add latency and cost.
The Storage security rule enforces a 200 KB max as a server-side backstop for clients
that bypass the client-side resize.

**Alternatives considered**:
- `browser-image-compression` library: adds a dependency; canvas is sufficient.
- Firebase Extension (Resize Images): adds cost and operational complexity.
- Cloud Function trigger: adds write-amplification and latency.

---

## Decision 5 — Account page layout: full rewrite vs incremental patch

**Decision**: Full rewrite of `Account.vue` using three Vuetify card zones (profile hero,
security, danger zone) in a `v-row` / `v-col` responsive grid.

**Rationale**: The existing page has structural issues that can't be fixed incrementally:
read-only text fields styled as editable inputs, identical visual weight across all four
cards, and no avatar slot. A clean rewrite produces less total code than patching.
Constitution II (Incremental Quality) is served by the net reduction in misleading UI.

**Alternatives considered**:
- Patch in-place: would leave the structural `v-text-field` anti-pattern; harder to
  review than a clear before/after.
