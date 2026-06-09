# Research: Build Editor Unification & Shared Build Header

**Feature**: `010-build-editor-unification` | **Date**: 2026-06-08

No external research required — all unknowns are resolved by the existing codebase and established Vue/Vuetify patterns. This document records the decisions made and confirms no NEEDS CLARIFICATION items remain.

---

## Decision 1: Dirty-state snapshot mechanism for Discard

**Decision**: `JSON.parse(JSON.stringify(build))` deep clone captured in `originalBuild` ref on `onMounted` and refreshed after each successful save.

**Rationale**: The build object is fully JSON-serialisable (Firestore document, no Date objects beyond Firestore Timestamps which are serialised as plain objects in the Vuex cache). No re-fetch round-trip, no extra Vuex mutations. Matches Constitution I (simplest viable).

**Alternatives considered**: Re-fetch from Firestore (network round-trip, unnecessary), Vuex snapshot mutation (adds store complexity for a component-local concern).

---

## Decision 2: Delete in editor overflow

**Decision**: Delete is **not present** in the editor overflow. The editor overflow contains only Duplicate, Copy to overlay tool (clipboard-gated), and Download. Delete remains on the view route only.

**Rationale**: The authoritative cascade delete (decrement contributor views, delete build document) lives in `BuildDetails.handleDelete`. Duplicating it in the editor would violate Constitution III (two competing delete implementations). Removing it from the editor is the simplest and safest choice.

**Alternatives considered**: Scaffold only (dialog shell, no wiring — deferred confusion), route-to-view (navigation side-effect on delete click — unexpected UX), full re-implementation (duplication, Constitution III violation).

---

## Decision 3: Route retirement strategy for BuildNew/BuildEdit

**Decision**: Delete `BuildNew.vue` and `BuildEdit.vue`. Update the existing `/builds/new` (`BuildNew`) and `/builds/:id/edit` (`BuildEdit`) router entries to point `component:` at `BuildEditor`. Route **paths and names stay identical** — no redirects, no shim files.

**Rationale**: Named routes (`BuildNew`, `BuildEdit`) are referenced throughout the codebase (e.g. `BuildDetails` Edit button, duplicate flow). Keeping the same route names means zero callsite changes. The only edit is the `component:` binding in `router/index.js`.

**Alternatives considered**: Redirect shims (extra files, maintenance burden), path rename (breaks all `router.push({ name: 'BuildNew' })` callsites).

---

## Decision 4: `beforeRouteLeave` guard

**Decision**: Implement `onBeforeRouteLeave` in `BuildEditor.vue`. When `isDirty`, prompt `window.confirm("You have unsaved changes — leave anyway?")`. Cancel keeps the user on the editor; confirm lets navigation proceed.

**Rationale**: The form is complex and long (BuildOrderEditor can have many steps). Accidental data loss is a real risk. `onBeforeRouteLeave` is a standard Vue Router 4 composable; the `window.confirm` approach avoids adding a dialog component just for this guard. Constitution I: simplest viable.

**Alternatives considered**: Custom confirmation dialog (additional state + template for a one-liner need), no guard (silent data loss).

---

## Decision 5: Loading and error states in edit mode

**Decision**: Show a skeleton/spinner in place of the form while the build is loading. If `getBuild` returns null/throws (not found) or the ownership check fails, call `router.replace({ name: 'NotFound' })` (or equivalent `/404` route in `router/index.js`).

**Rationale**: Consistent with how other resource-not-found cases are handled (`BuildNotFound.vue` / `NotFound.vue` already exist). The `v-skeleton-loader` Vuetify component makes a one-line loading state.

**Alternatives considered**: Inline error card (keeps user on a broken editor URL, no recovery path), no loading state (flash of empty/broken form).

---

## Confirmed: No new dependencies

All required functionality is covered by:
- Vue 3 Composition API (`ref`, `watch`, `computed`, `onMounted`, `onBeforeRouteLeave`)
- Vuetify 3 (`v-skeleton-loader`, `v-menu`, `v-list`, `v-card`, `v-btn`, `v-chip`, `v-img`, `v-dialog`)
- Existing composables (`civDefaultProvider`, `useTimeSince`, `buildService`, `youtubeService`, etc.)

No new npm packages are required.
