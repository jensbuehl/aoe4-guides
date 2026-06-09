# Implementation Plan: Build Editor Unification & Shared Build Header

**Branch**: `010-build-editor-unification` | **Date**: 2026-06-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/010-build-editor-unification/spec.md`

## Summary

Three build-route views each hand-roll the same hero card (civ-flag background + title + chip row + action cluster) twice over with `hidden-sm-and-down`/`hidden-md-and-up` breakpoint twins, and `BuildNew.vue` + `BuildEdit.vue` duplicate ~44 KB of form logic with no shared code. This feature extracts a shared `BuildHeader.vue`, merges the two editor views into one `BuildEditor.vue` (driven by a `mode` prop), adds a sticky save/publish footer with dirty tracking + deep-clone Discard, live YouTube validation, and a `beforeRouteLeave` guard, then refactors `BuildDetails.vue`'s hero onto the shared component while collapsing its management actions into a single overflow (Edit pencil folds in, standalone button removed). Net result: 6 hand-rolled hero blocks → 1; 2 editor files (~44 KB) → 1; Delete removed from editor overflow (view-route only).

## Technical Context

**Language/Version**: JavaScript (Vue 3.2.45)

**Primary Dependencies**: Vuetify 3.8.0, Vue Router 4.5.0, Vuex 4.0.2, Firebase 10.14.0, Vite 6.2.5, @mdi/font 7.1.96, @vueuse/core 13.0.0

**Storage**: Cloud Firestore — existing schema only; no document, index, or rule changes

**Testing**: Manual golden-path per phase (Constitution Development Workflow — no automated suite)

**Target Platform**: Browser SPA (Netlify free tier), responsive down to 375 px mobile

**Project Type**: Frontend-only Vue 3 SPA — no Firebase Functions, no Cloud Run, no Firestore rule changes

**Performance Goals**: 400 ms YouTube debounce (FR-010); no bundle regression (no new deps)

**Constraints**: No new npm dependencies. No Vuex mutations beyond parity with current views. No `BuildOrderEditor.vue` modifications. All CSS via Vuetify theme tokens (`rgb(var(--v-theme-*))`) — no hard-coded hex.

**Scale/Scope**: 2 new components, 1 updated view, 2 deleted views, 1 router file modified. ~44 KB net deletion.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| **I. Simplicity First** | ✅ PASS | Feature *removes* duplication. No abstractions beyond patterns appearing 3×. No new dependencies. `BuildActionMenu` is optional (extract only if menus prove repetitive). |
| **II. Incremental Quality** | ✅ PASS | Atomic commits per task group; temp routes in T003 keep existing routes live throughout the migration. |
| **III. Consistent UX & Component Reuse** | ✅ PASS | This feature *is* Principle III — extracting a component that appears 6× (3 views × 2 breakpoints) and a page that appears twice into one. |
| **IV. Cost-Conscious Infrastructure** | ✅ PASS | Pure frontend refactor; zero new Firebase usage; no Cloud Run changes. |
| **V. Secure Defaults** | ✅ PASS | `requiresAuth` + ownership guards preserved unchanged. No new routes. `useVerificationGuard` (view route) untouched. No Firestore rule changes needed. |

**Verdict**: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/010-build-editor-unification/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (no new entities — schema confirmation)
├── quickstart.md        # Phase 1 output (implementer onboarding)
├── css-reference.md     # Dropped pre-plan — exact CSS values + theme tokens
├── contracts/
│   ├── BuildHeader-contract.md      # Dropped pre-plan
│   ├── BuildEditor-contract.md      # Dropped pre-plan
│   └── BuildActionMenu-contract.md  # Dropped pre-plan (optional component)
└── tasks.md             # Dropped pre-plan — 37-task implementation breakdown
```

### Source Code

```text
src/
├── components/
│   └── builds/
│       ├── BuildHeader.vue          ← NEW  (shared hero card)
│       └── BuildActionMenu.vue      ← NEW  (optional; extract after both menus exist)
├── views/
│   └── builds/
│       ├── BuildEditor.vue          ← NEW  (replaces BuildNew + BuildEdit)
│       ├── BuildDetails.vue         ← MODIFIED (header → BuildHeader; single overflow)
│       ├── BuildNew.vue             ← DELETED  (after route migration in T024)
│       └── BuildEdit.vue            ← DELETED  (after route migration in T024)
└── router/
    └── index.js                     ← MODIFIED (component binding swap; paths unchanged)
```

**Structure Decision**: Single-project Vue SPA. All new files land in existing `src/components/builds/` and `src/views/builds/` — no new directories required.

## Complexity Tracking

> No violations — section not required.
