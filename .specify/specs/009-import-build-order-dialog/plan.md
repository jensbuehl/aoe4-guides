# Implementation Plan: Import Build Order — unified dialog (reuses the avatar-picker shell)

**Branch**: `009-import-build-order-dialog` | **Date**: 2026-06-08 | **Spec**: `specs/009-import-build-order-dialog/spec.md`

## Summary

Replace the two Add-Build import entries and the `/import/:paste?` route (`BuildImport.vue`, a blank-page clipboard read) with **one in-place dialog** that merges file + clipboard import, adds a detected-build **preview** and **inline validation**, and a **manual paste fallback**. Build it on a **shared dialog shell reused with `AvatarPicker.vue`** rather than a second bespoke dialog: extract `PickerDialog.vue` (dialog chrome) and `FileDropZone.vue` (drag-drop zone) from `AvatarPicker`, refactor `AvatarPicker` onto them, then build `BuildImportDialog.vue` on the same two components. Reuse the existing import pipeline (`useImportOverlayFormat().convert()` → `setTemplate` → `BuildNew`) unchanged. Open state is Vuex-controlled, mirroring the existing **AuthDialog**. Exact Vuetify mapping + CSS in `css-reference.md`.

## Technical Context

- **Stack**: Vue 3 SFCs, Vuetify 3.8, Vuex 4, Vue Router 4, `@mdi/font`. **No new dependencies.**
- **Reuse target (the crux)**: `src/components/account/AvatarPicker.vue` already holds the canonical chrome (`v-dialog max-width` → `v-card rounded=lg` → title row with `mdi-close` btn → `v-tabs`/`v-window` → `v-card-actions` Cancel/primary) **and** the `.drop-zone` markup + drag handlers. This plan **generalizes** those into shared components — it does not copy them.
- **Primary files**:
  - `src/components/common/PickerDialog.vue` — **NEW** shared dialog shell (slots: `title`, default = body/tabs, `actions`). Owns `v-dialog`/`v-card`/title+close/`v-card-actions`.
  - `src/components/common/FileDropZone.vue` — **NEW** shared drop zone (`accept`, drag state, `@files`); used by avatar Upload tab and import File tab.
  - `src/components/account/AvatarPicker.vue` — **EDIT (refactor)** consume `PickerDialog` + `FileDropZone`; behaviour unchanged.
  - `src/components/builds/BuildImportDialog.vue` — **NEW** the import dialog (tabs, preview, error, import pipeline).
  - `src/components/Header.vue` — **EDIT** replace the two `/import` menu items with one entry that dispatches `openImportDialog`.
  - `src/App.vue` — **EDIT** mount `<BuildImportDialog>` controlled by store (like `<AuthDialog>`).
  - `src/store/index.js` (or the relevant module) — **EDIT** add `importDialog` state + `openImportDialog`/`closeImportDialog` (mirror `openAuthDialog`).
  - `src/router/index.js` — **EDIT** remove the `/import/:paste?` route + `BuildImport` import (optionally add a thin redirect — see Open Question).
  - `src/views/builds/BuildImport.vue` — **DELETE** (logic moves into `BuildImportDialog.vue`).
- **Reused as-is**: `src/composables/converter/useImportOverlayFormat.js` (`convert`), `setTemplate` mutation, `showSnackbar`, `BuildNew` route.
- **Styling**: `css-reference.md` (resolved tokens both themes; Vuetify mapping; the only genuinely-custom CSS = the drop zone, the preview card, the error banner).
- **Testing**: manual golden path (file valid/invalid, clipboard valid/blocked/invalid, both themes) + verify `AvatarPicker` still works post-refactor + a11y (focus trap, Esc, labels).

## Constitution Check

| Principle | Assessment |
|---|---|
| I. Simplicity First | ✅ Net **removal** of a route, a view, and a duplicated dialog pattern; no new deps. Two NEW shared components are justified by ≥2 real consumers (avatar + import). |
| II. Incremental Quality | ✅ Refactor of `AvatarPicker` onto the shared shell is a **separate atomic commit**; deletes `BuildImport.vue` and the dead route. Leaves the codebase with one dialog pattern, not two. |
| III. Consistent UX & Reuse | ✅ **The reuse requirement.** Vuetify-only chrome; the import dialog and avatar picker share one shell + one drop zone. Existing tokens. |
| IV. Cost-Conscious | ✅ No new reads/writes/storage; reuses the existing convert→template→route pipeline. |
| V. Secure Defaults | ✅ Preserves the `requiresAuth`+`requiresVerification` gate (now enforced on the action, not the route); no rules/schema change. |

**Result: PASS.** (Two new files, but they remove duplication across two consumers — Principle III "extract repeated patterns".)

## Reuse architecture (core)

```
            ┌─────────────────────────────┐
            │   PickerDialog.vue (shell)   │   v-dialog + v-card(rounded lg)
            │  slot: title (+ close btn)   │   + title row w/ mdi-close
            │  slot: default (tabs/body)   │   + v-card-actions footer
            │  slot: actions (Cancel/CTA)  │
            └──────────────┬──────────────┘
                           │ consumed by
          ┌────────────────┴─────────────────┐
          │                                   │
 AvatarPicker.vue                    BuildImportDialog.vue
  tabs: Initials/Civ/Upload           tabs: Upload file / From clipboard
  Upload tab → FileDropZone            Upload tab → FileDropZone
                  │                                   │
                  └──────────────┬───────────────────┘
                                 ▼
                       FileDropZone.vue (shared)
                 props: accept, label, hint, dragging UI
                 emits: @files(FileList)   (drag-drop + click-browse)
```

- `PickerDialog` owns: `modelValue` (v-model open), `title`, `max-width`, the close button, scrim/Esc close, and the `v-card-actions` slot. It does **not** own the tabs content — consumers fill the default slot with their own `v-tabs`/`v-window`.
- `FileDropZone` owns: the dashed zone, drag-over state, click-to-browse `<input type=file :accept>`, and `@files`. Avatar passes `accept="image/*"`; import passes `accept=".json,.bo"`.
- `BuildImportDialog` owns: the two tabs, the clipboard read + manual textarea, `parseBuild()` validation, the preview card, the error banner, and the import pipeline call.

## Import flow (reuses existing pipeline)

```
file dropped/browsed ──► FileDropZone @files ──► file.text() ─┐
clipboard button ──► navigator.clipboard.readText() ──────────┤
manual textarea ──► v-model string ───────────────────────────┤
                                                               ▼
                                              parseBuild(text)  (JSON.parse + shape check)
                                          ┌────────────┴────────────┐
                                       invalid                     valid
                                          │                          │
                                    inline error banner       "Build detected" preview
                                    (Import disabled)         (civ flag, title, author, steps)
                                                                     │ Import build
                                                                     ▼
                                  useImportOverlayFormat().convert(obj)
                                  → store.commit("setTemplate", template)
                                  → showSnackbar("Build order imported…","success")
                                  → router.push({ name: "BuildNew" })
                                  → close dialog
```

`parseBuild()` is a thin guard added in the dialog (or a tiny composable `useImportValidation`): `JSON.parse`, then require `name` + `Array.isArray(build_order)`, then summarize for the preview. The heavy lifting (`convert`, note-token conversion) stays in `useImportOverlayFormat`.

## Open state (mirror AuthDialog)

```
// store
state.importDialog = { open: false }
mutations.SET_IMPORT_DIALOG(state, open) { state.importDialog.open = open }
actions.openImportDialog({ commit }) { commit("SET_IMPORT_DIALOG", true) }
actions.closeImportDialog({ commit }) { commit("SET_IMPORT_DIALOG", false) }

// App.vue (next to <AuthDialog>)
<BuildImportDialog v-model="importOpen" />   // two-way to store.state.importDialog.open

// Header.vue Add Build menu — replaces the two /import items
<v-list-item @click="$store.dispatch('openImportDialog')"> … Import Build Order </v-list-item>
```

Verification gate: keep today's behavior — guard the import action (and/or only enable the menu entry) on `user` + `emailVerified`; reuse the existing `showSnackbar("Please verify…")` message if an unverified user reaches it.

## Layout & styling (summary — full in css-reference.md)

- **Dialog**: `v-dialog max-width="540"` → `v-card rounded="lg"`. Title row: `mdi-tray-arrow-down` + "Import Build Order" + `mdi-close` btn (top-right). Matches `AvatarPicker`'s header rhythm.
- **Tabs**: `v-tabs color="primary"` with `v-window` items — *Upload file* / *From clipboard*. (Mock shows a segmented control; Vuetify equivalent is `v-tabs`, mapped in css-reference §Mapping.)
- **Drop zone** (`FileDropZone`): dashed `2px` border `rounded-lg`, `min-height ~178px`, hover/active = primary border + 5–11% primary tint; icon tile + "Drop your build order here or click to browse" + `.json`/`.bo` hint. (This is the one piece lifted ~verbatim from `AvatarPicker`'s `.drop-zone`.)
- **File chip**: `v-card`/list-row with `mdi-file-document-outline`, name + size, removable ✕.
- **Clipboard**: a primary tonal `v-btn` "Paste from clipboard" + `v-textarea` (monospace) for manual paste.
- **Preview card**: tonal success-tinted card — civ flag (`flagSmall`), title, "by {author} · {civ}", and `v-chip` metas (N steps, strategy, season, video).
- **Error banner**: error-tinted row, `mdi-alert-circle-outline` + bold reason + recovery hint.
- **Footer**: `v-card-actions` — `v-btn variant="text"` Cancel + `v-btn color="primary" :disabled="!valid"` "Import build".

## Accessibility plan (must-hold)

- `PickerDialog` traps focus, closes on Esc/scrim, restores focus to the trigger; the close button has an aria-label.
- Tabs are real `v-tabs` (arrow-key navigable); the active tab's window is the labelled panel.
- Drop zone is keyboard-reachable (it's a button) and announces accept types; click-to-browse works without a pointer.
- Error banner is announced (`role="alert"`/polite) so a blocked clipboard or bad file is heard, not just seen.
- Import disabled state is communicated by label + disabled attr, not color only.
- Light + dark contrast per css-reference.md (drop zone border, preview tint, error tint, textarea).

## Project Structure

```text
src/
├── components/
│   ├── common/
│   │   ├── PickerDialog.vue          # NEW — shared dialog shell (v-dialog/v-card/title+close/actions)
│   │   └── FileDropZone.vue          # NEW — shared drag-drop zone (@files; accept)
│   ├── account/AvatarPicker.vue      # EDIT (refactor) — consume PickerDialog + FileDropZone (behaviour unchanged)
│   ├── builds/BuildImportDialog.vue  # NEW — tabs, clipboard+manual, validation, preview, error, import pipeline
│   └── Header.vue                    # EDIT — one "Import Build Order" entry → dispatch openImportDialog
├── App.vue                           # EDIT — mount <BuildImportDialog> (like <AuthDialog>)
├── store/index.js                    # EDIT — importDialog state + open/close actions (mirror openAuthDialog)
├── router/index.js                   # EDIT — remove /import/:paste? route (+ BuildImport import); optional redirect
└── views/builds/BuildImport.vue      # DELETE — logic moves into BuildImportDialog.vue
```

**Structure Decision**: Single Vue frontend. The reuse requirement drives a small `common/` shell (`PickerDialog` + `FileDropZone`) shared by avatar + import; refactor the avatar picker onto it in its own commit so the shared shell is proven by two consumers, not speculative.

## Complexity Tracking
> No violations. Two new components are added but they **remove** a duplicated dialog/drop-zone pattern across two real consumers (Principle III) and the change **net-deletes** a route + a view. The only bespoke CSS (drop zone, preview card, error banner) is enumerated in `css-reference.md`; all chrome is Vuetify.

## Open Questions
- **[RESOLVED] `/import` deep-links**: No external deep-links exist. Delete the `/import` route and `BuildImport.vue` outright (T022–T023); no redirect needed.
