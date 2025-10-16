# Copilot Instructions for aoe4-guides

This document guides AI coding agents to be productive in the `aoe4-guides` codebase. It covers architecture, workflows, conventions, and integration points specific to this project.

## Big Picture Architecture
- **Frontend:** Vue.js SPA in `src/` using Vuetify for UI, Vuex for state, and Vue Router for navigation.
- **Backend:** Firebase Cloud Functions in `functions/` for server-side logic, Firestore for data storage, and Firebase Auth for authentication.
- **Assets:** Game-related images/icons in `public/assets/` and `src/assets/`.
- **Purpose:** Centralized build order sharing and management for Age of Empires IV, with features for creating, browsing, favoriting, and commenting on build orders.

## Developer Workflows
- **Node Version:** Use `nvm use` to select the correct Node version.
- **Install Dependencies:** `npm install` in the root and in `functions/` for backend dependencies.
- **Dev Server:** Run `npm run dev` for hot-reload development.
- **Production Build:** Run `npm run build` to compile frontend assets.
- **Firebase Functions:** Deploy/update with Firebase CLI (`firebase deploy --only functions`).

## Project-Specific Conventions
- **Vue Components:** Organized by feature in `src/components/` (e.g., `builds/`, `filter/`, `notifications/`).
- **Composables:** Shared logic in `src/composables/` (e.g., `useTimeSince.js`, `useVuetify.js`).
- **Cloud Functions:** Grouped by domain in `functions/builds/`, `functions/users/`, `functions/youtube/`.
- **Visual Assets:** Only use `/public/pictures/*.webp` for game images; other assets are MIT-licensed.
- **Routing:** All navigation handled via Vue Router (`src/router/index.js`).
- **State Management:** Use Vuex store (`src/store/index.js`) for app-wide state.

## Integration Points & External Dependencies
- **Firebase:** AppCheck, Auth, Firestore, and Functions are core. See `src/firebase/index.js` for setup.
- **Vite:** Used for frontend build tooling (`vite.config.mjs`).
- **Vuetify:** UI framework, see `src/composables/useVuetify.js` for setup.
- **Icons/Images:** Reference images from `public/assets/` or `src/assets/` for UI illustration.

## Examples & Patterns
- **Build Order CRUD:** Frontend logic in `src/components/builds/`, backend logic in `functions/builds/`.
- **User Management:** Frontend in `src/views/account/`, backend in `functions/users/`.
- **Commenting:** See `src/components/Comment.vue` and related backend functions.
- **Favorites:** Managed via Vuex and Firestore, see `src/components/Favorite.vue`.

## Additional Notes
- **License:** All code is MIT except `/public/pictures/*.webp`.
- **Game Content:** Follows Microsoft's Game Content Usage Rules.

---

If any section is unclear or missing, please provide feedback to improve these instructions.