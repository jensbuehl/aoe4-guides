# Quickstart: Build Editor Unification

**Branch**: `010-build-editor-unification`

## Prerequisites

- Node 22+ installed
- Firebase project access (for local emulator or dev Firestore)
- Familiarity with Vue 3 Composition API + Vuetify 3

## Dev setup

```bash
npm install
npm run dev        # Vite dev server at http://localhost:5173
```

The app hot-reloads. No `.env` changes are needed for the UI work — existing Firebase config in `src/firebase/index.js` connects to the dev project.

## Key files to know before starting

| File | Role |
|---|---|
| `src/views/builds/BuildEdit.vue` | Primary source for editor logic (copy composables from here) |
| `src/views/builds/BuildNew.vue` | Source for `addBuild` + contributor flow |
| `src/views/builds/BuildDetails.vue` | Source for view-route hero + overflow to refactor |
| `src/router/index.js` | Route definitions — `BuildNew` (`/builds/new`), `BuildEdit` (`/builds/:id/edit`), `BuildDetails` (`/builds/:id`) |
| `src/composables/builds/youtubeService.js` | `extractVideoId`, `buildEmbedUrl`, `getVideoCreatorId` |
| `src/composables/data/buildService.js` | `addBuild`, `updateBuild`, `getBuild`, `getUserDraftsCount` |
| `.specify/specs/010-build-editor-unification/css-reference.md` | Exact CSS + Vuetify component mapping |
| `BuildEdit Design.html` (project root) | Interactive mock — open in a browser to see the target layout |

## Implementation order

Follow the phases in `tasks.md`:

1. **Phase 1 (Setup)** — scaffold empty SFCs + temp routes; app must still boot.
2. **Phase 2 (BuildHeader)** — build the shared hero in isolation; verify with a sample build before wiring any consumer.
3. **Phase 3 (Editor logic)** — copy all composables + handlers; verify save in both modes via console before adding UI.
4. **Phase 4 (Editor body)** — assemble the form; hit MVP checkpoint.
5. **Phase 5–7** — YouTube preview, sticky footer, editor overflow.
6. **Phase 8** — swap live routes; delete old files.
7. **Phase 9** — refactor `BuildDetails` hero + overflow.

## Useful commands

```bash
# Type-check (no TS, but Vetur/Volar will flag obvious issues in the IDE)
npm run build        # Vite prod build — catches import errors

# Check for unused imports / obvious issues
npm run lint         # if configured (check package.json scripts)
```

## Manual test URLs (local)

| Route | URL | What to check |
|---|---|---|
| Create | `http://localhost:5173/builds/new` | Empty form, no overflow, "New" hero badge |
| Edit | `http://localhost:5173/builds/:id/edit` | Pre-filled form, edit overflow (no Delete), dirty tracking |
| View | `http://localhost:5173/builds/:id` | Single overflow with Edit as first item; no standalone pencil |

## Conventions for this feature

- Vuetify components only — no hand-rolled widgets (see `css-reference.md §6`).
- Theme tokens only — `rgb(var(--v-theme-*))` in every style rule.
- Commit after each task or logical group using Conventional Commits (`feat:`, `refactor:`, `style:`, `chore:`).
- `BuildOrderEditor.vue` MUST NOT be modified.
- `BuildHeader.vue` MUST NOT import `buildService` or any consumer handler — actions come via the `#actions` slot only.
