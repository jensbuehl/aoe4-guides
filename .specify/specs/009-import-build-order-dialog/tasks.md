---
description: "Task list for Import Build Order — unified dialog (reuses the avatar-picker shell)"
---

# Tasks: Import Build Order — unified dialog

**Input**: `specs/009-import-build-order-dialog/` (spec.md, plan.md, css-reference.md, contracts/)
**Prerequisites**: plan.md (reuse architecture, import flow, open-state), css-reference.md (Vuetify mapping + CSS), contracts/ (component contracts)
**Tests**: no automated suite — each phase ends with a manual golden path + a regression check that **`AvatarPicker` still works**.

## Format: `[ID] [P?] [Story] Description` — Conventional Commit prefix suggested.
## Chrome stays Vuetify (`v-dialog`/`v-tabs`/`v-window`/`v-card`/`v-textarea`) — do NOT rebuild the mock's hand-rolled dialog/segmented/drop-zone.

## Phase 1: Setup
- [x] T001 Branch `009-import-build-order-dialog` off `main`. (`chore:`)
- [x] T002 Confirm the **AuthDialog** open-state pattern in `store` + `App.vue` (it's the model for the import dialog). Confirm the existing import pipeline: `useImportOverlayFormat().convert()`, `setTemplate`, `showSnackbar`, `BuildNew` route. (`docs:`)
- [x] T003 No external deep-links confirmed — delete the `/import` route outright, no redirect. Decision recorded in plan.md. (`docs:`)

## Phase 2: Shared shell (the reuse — do this FIRST) 🎯
**Goal**: One dialog shell + one drop zone, proven by refactoring the avatar picker onto them.
**Independent test**: After T004–T007, the **avatar picker looks and behaves exactly as before**, now powered by the shared components.

- [x] T004 [P] Create `src/components/common/PickerDialog.vue` — wraps `v-dialog`(`modelValue`, `max-width`) → `v-card rounded="lg"` → title row (`title` prop/slot + `mdi-close` btn) → default slot (tabs/body) → `actions` slot in `v-card-actions`. Emits `update:modelValue`; closes on Esc/scrim/✕. (See `contracts/PickerDialog-contract.md`.) (`feat:`)
- [x] T005 [P] Create `src/components/common/FileDropZone.vue` — dashed drop zone with drag state + click-to-browse hidden `<input type="file" :accept>`; props `accept`, `label`, `hint`, `icon`; emits `@files(FileList)`. Lift the `.drop-zone` CSS from `AvatarPicker` (css-reference §Drop zone). (See `contracts/FileDropZone-contract.md`.) (`feat:`)
- [x] T006 [US1] **Refactor** `AvatarPicker.vue` to consume `PickerDialog` (chrome) + `FileDropZone` (Upload tab). Remove its now-duplicated dialog/drop-zone markup + scoped CSS. **No behaviour change.** (`refactor:`)
- [ ] T007 [US1] Regression-verify the avatar picker: open from profile hero; Initials/Civ/Upload tabs; drag-drop + browse; resize→save; Cancel/Esc/scrim; light + dark. (`docs:`)

**Checkpoint**: Shared shell + drop zone exist and the avatar picker rides on them unchanged.

## Phase 3: User Story 1 — One dialog, opened in place (P1)
**Goal**: A single Add-Build entry opens the import dialog without navigation.
**Independent test**: Click "Import Build Order" → dialog opens over the current page with Upload/Clipboard tabs + Cancel/Import.

- [x] T008 [US1] Add Vuex `importDialog` state + `openImportDialog`/`closeImportDialog` (mirror `openAuthDialog`). (`feat:`)
- [x] T009 [US1] Scaffold `src/components/builds/BuildImportDialog.vue` on `PickerDialog`: title "Import Build Order" (`mdi-tray-arrow-down`), `v-tabs` *Upload file* / *From clipboard* + `v-window`, footer Cancel + disabled "Import build". (`feat:`)
- [x] T010 [US1] Mount `<BuildImportDialog>` in `App.vue` bound to the store (next to `<AuthDialog>`). (`feat:`)
- [x] T011 [US1] `Header.vue`: replace the two `/import` menu items with one `@click="$store.dispatch('openImportDialog')"` "Import Build Order" entry (`mdi-tray-arrow-down`). (`feat:`)

**Checkpoint**: Menu opens the (empty-but-tabbed) dialog in place.

## Phase 4: User Story 2 — File upload + preview (P1)
**Goal**: Drop/browse a file → validated preview → import → editor.
**Independent test**: Drop a valid overlay file → chip + "Build detected" preview → Import build → snackbar + route to `BuildNew`.

- [x] T012 [US2] Add `parseBuild(text)` validation (inline or `useImportValidation` composable): `JSON.parse`, require `name` + `Array.isArray(build_order)`, return `{ ok, build:{title,author,civCode,civFlag,civName,steps,strategy,season,hasVideo} }` or `{ ok:false, reason }`. (`feat:`)
- [x] T013 [US2] Upload tab: `FileDropZone accept=".json,.bo"` → on `@files`, `await file.text()` → `parseBuild`. Show a removable **file chip** (name + `fmtSize`). (`feat:`)
- [x] T014 [US2] **Preview card**: civ flag (`flagSmall` via civ provider), title, "by {author} · {civ}", `v-chip` metas (N steps, strategy, season, video). Enable "Import build" only when valid. (css-reference §Preview.) (`feat:`)
- [x] T015 [US2] Wire **Import**: `useImportOverlayFormat().convert(obj)` → `setTemplate(template)` → `showSnackbar(success)` → `router.push({name:'BuildNew'})` → `closeImportDialog`. (Reuse `BuildImport.vue`'s `newFromTemplate` logic.) (`feat:`)

**Checkpoint**: File path imports end-to-end via the reused pipeline.

## Phase 5: User Story 3 — Clipboard + manual fallback (P1)
**Goal**: One-click clipboard read OR manual paste → same preview/import.
**Independent test**: Paste from clipboard (granted) → textarea + preview; blocked → manual textarea still works.

- [x] T016 [US3] Clipboard tab: primary tonal `v-btn` "Paste from clipboard" → `navigator.clipboard.readText()`; on success fill the textarea + `parseBuild`. (`feat:`)
- [x] T017 [US3] `v-textarea` (monospace) manual paste, live `parseBuild` on input; same preview/import path as US2. (`feat:`)
- [x] T018 [P] [US3] Graceful degradation: clipboard unavailable/denied/empty → keep the textarea usable + a non-blocking hint; never dead-end (no blank page, no hard error). (`feat:`)
- [x] T019 [P] [US3] Preserve staged input across tab switches (file chip / pasted text not lost). (`feat:`)

**Checkpoint**: Both clipboard sub-paths import; blocked API has a fallback.

## Phase 6: User Story 4 — Inline validation & errors (P2)
**Goal**: Specific, persistent, recoverable inline errors.
**Independent test**: Paste `{"loadout":"knights"}` → inline "Missing a build name or step list…"; Import disabled; fix → clears.

- [x] T020 [US4] **Error banner** (`role="alert"`): `mdi-alert-circle-outline` + bold "Couldn't read that as a build order" + `parsed.reason` + recovery hint; shown when `parsed && !parsed.ok`. Import stays disabled. (css-reference §Error.) (`feat:`)
- [x] T021 [US4] Error clears and is replaced by the preview the instant input becomes valid; dialog never closes on error. Cover bad JSON, wrong shape, empty, wrong file type. (`feat:`)

**Checkpoint**: All four sources (file/clipboard×valid/invalid) handled inline.

## Phase 7: Cleanup & cross-cutting
- [x] T022 Remove the `/import/:paste?` route + `BuildImport` import from `router/index.js` (or convert to the redirect per T003). (`refactor:`)
- [x] T023 Delete `src/views/builds/BuildImport.vue` (logic now in `BuildImportDialog.vue`). (`refactor:`)
- [x] T024 [P] Preserve the **auth/verification gate**: import requires signed-in + verified; reuse the existing "Please verify…" snackbar if reached unverified. (`feat:`)
- [ ] T025 [P] Light + dark verify: drop zone border, preview tint, error tint, textarea, tabs — legible in both (css-reference tokens). (`style:`)
- [ ] T026 [P] A11y: focus trap + Esc/scrim restore focus; tabs arrow-nav; drop zone keyboard-reachable; error announced; disabled Import communicated by label. (`style:`)
- [ ] T027 Self-review diff: confined to `common/PickerDialog`, `common/FileDropZone`, `account/AvatarPicker` (refactor), `builds/BuildImportDialog`, `Header`, `App`, `store`, `router`, and the deleted view. Confirm **avatar picker unchanged**, **chrome all Vuetify**, **pipeline reused**, **no blank `/import` page reachable**. Run the full golden path. (`docs:`)

## Dependencies & Order
- Phase 2 (shared shell) is the keystone — do it first so both consumers share one implementation.
- Setup → Shared shell (refactor avatar) → US1 (dialog opens in place) → US2 (file+preview) → US3 (clipboard+manual) → US4 (errors) → Cleanup.
- **MVP = Phase 2 + US1 + US2** (shared dialog opens in place and imports a file with preview). US3 + US4 complete the merge and the "proper handling".

## Suggested commits
```
chore: branch + import-dialog spec                                  (T001–T003)
feat: shared PickerDialog + FileDropZone shell                      (T004–T005)
refactor: AvatarPicker onto shared dialog shell + drop zone         (T006–T007)
feat: Vuex import-dialog state + Header entry + App mount            (T008–T011)
feat: file upload, validation + build-detected preview, import      (T012–T015)
feat: clipboard read + manual paste fallback                        (T016–T019)
feat: inline validation + recoverable error banner                  (T020–T021)
refactor: remove /import route + BuildImport.vue                    (T022–T023)
style: auth gate, light/dark, a11y polish                           (T024–T026)
docs: final import-dialog checklist                                 (T027)
```
