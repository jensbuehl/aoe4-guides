# Handoff: Import Build Order — unified dialog (`009-import-build-order-dialog`)

Spec-Kit handoff to replace the two **Add Build → Import** entries (and the blank-page `/import/:paste?` route) with **one dialog** that merges file + clipboard import, adds a confirmable **preview** and **inline errors**, and a **manual paste fallback** — built by **reusing the avatar-image picker's dialog shell, not duplicating it**.

## The ask (verbatim intent)
- File import (drop zone + `/import` route) and clipboard import (`/import/true`, a UI-less blind read) → **merge into one dialog**.
- Style it like the **"Edit avatar image" dialog** (`AvatarPicker.vue`), **including the drop zone**.
- **Re-use the existing dialog container instead of duplicating it** (avatar image edit vs. import build order).

## How the reuse is done (the important part)
Rather than copy the avatar dialog, the plan **extracts** its chrome into shared components and points both consumers at them:

```
PickerDialog.vue  (v-dialog + v-card + title/close + v-card-actions)  ← shared shell
FileDropZone.vue  (dashed drag-drop + click-to-browse, @files)        ← shared drop zone
        ▲                         ▲
AvatarPicker.vue          BuildImportDialog.vue      ← both consume the same two
(refactored onto them)    (new, built on them)
```
Refactoring `AvatarPicker` onto the shared shell is **in scope** and is its own atomic commit — it proves the shell with two real consumers (Constitution Principle III: *extract repeated patterns*). Net result: **one** dialog pattern, and the change **deletes** a route + a view.

## What the dialog does (proper handling)
- **Two tabs**: *Upload file* (drag-drop + browse, `.json`/`.bo`) and *From clipboard* (one-click `readText()` **plus** a manual textarea).
- **Validation → preview**: input is parsed and, when valid, shows a **"Build detected"** card (civ crest, title, author, step count) to confirm **before** a draft is created.
- **Inline errors**: invalid input shows a persistent, specific error in the dialog (not a transient snackbar on a blank page); Import stays disabled; fixing the input clears it.
- **No dead-ends**: a blocked Clipboard API (Safari/Firefox/non-HTTPS) falls back to the textarea.
- Reuses the existing pipeline unchanged: `useImportOverlayFormat().convert()` → `setTemplate` → success snackbar → route to `BuildNew`.
- Opened via a Vuex action (`openImportDialog`) and mounted in `App.vue`, **mirroring the existing AuthDialog**.

## Fidelity
**High-fidelity.** Colors, spacing, type, and interactions are final and grounded in the real Vuetify theme tokens. Recreate it with **Vuetify components** (it is **not** code to paste) — `css-reference.md` §6 maps every mock element to its Vuetify component, so the mock's hand-rolled dialog/segmented/drop-zone are **not** reproduced literally.

## Files in this package
| File | What |
|---|---|
| `spec.md` | Clarifications + 4 user stories + FRs + success criteria (incl. the reuse constraint FR-002 and the `/import` deep-link [NEEDS CLARIFICATION]) |
| `plan.md` | Constitution check (PASS), the **reuse architecture** diagram, import flow, AuthDialog-style open state, file map |
| `tasks.md` | 27 tasks; **Phase 2 (shared shell + AvatarPicker refactor) first**, then dialog/file/clipboard/errors/cleanup; Conventional Commits |
| `css-reference.md` | ⭐ Resolved tokens (both themes) + the **mock→Vuetify mapping** + the only 3 custom CSS blocks (drop zone, preview, error) |
| `contracts/PickerDialog-contract.md` | Shared dialog shell — props/slots/structure |
| `contracts/FileDropZone-contract.md` | Shared drop zone — props/emits/CSS (lifted from AvatarPicker) |
| `contracts/BuildImportDialog-contract.md` | The import dialog — Vuex/composables, `parseBuild`, import flow, states |
| `assets/file-preview.png` | Upload tab: valid file → chip + "Build detected" + enabled Import |
| `assets/file-empty.png` | Upload tab: empty drop zone |
| `assets/clipboard-preview.png` | Clipboard tab: paste → preview (one-click + manual textarea) |
| `assets/error.png` | Inline error (unrecognized input; Import disabled) |
| `assets/add-build-menu.png` | Single "Import Build Order" entry replacing the two old ones |
| `assets/light-theme.png` | Light theme |

> The MDI (`mdi-*`) icons render live but don't rasterize in the static PNG captures — exact icon names are in `css-reference.md`. **Interactive reference:** `Import UX.html` at the project root (Tweaks → tabbed/unified layout, confirm-preview on/off, single/split menu, valid/unrecognized demo data, dark/light).

## Grounded in real source (`jensbuehl/aoe4-guides@main`)
- `src/components/account/AvatarPicker.vue` — the dialog + `.drop-zone` this feature generalizes (the reuse target).
- `src/views/builds/BuildImport.vue` — today's route view (file drop zone + blind clipboard read on mount) — **deleted**, logic moves into the dialog.
- `src/components/Header.vue` — the Add Build menu with the two `/import` items — **replaced** with one entry.
- `src/router/index.js` — the `/import/:paste?` route — **removed** (or redirect, pending the deep-link question).
- `src/composables/converter/useImportOverlayFormat.js` — `convert()` + note-token handling — **reused as-is**.
- The **AuthDialog** open-state pattern (`openAuthDialog`, mounted in `App.vue`) — the model for `openImportDialog`.

## Use
1. Copy to `specs/009-import-build-order-dialog/` (renumber if needed); branch `009-import-build-order-dialog`.
2. Answer the **[NEEDS CLARIFICATION]** in `spec.md`/`plan.md`: does anything external deep-link `/import`? (keep a redirect vs. delete the route).
3. Implement from `tasks.md` — **Phase 2 first** (shared shell + refactor AvatarPicker), then the dialog. Pull exact styling + the Vuetify mapping from `css-reference.md`; component shapes from `contracts/`.
4. Regression-check the avatar picker after the refactor (it must look/behave unchanged).
