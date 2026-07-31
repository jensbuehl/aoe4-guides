---
description: "Task list for 019-qr-share-build"
---

# Tasks: Share a Build — QR Handoff and Native Share

**Input**: Design documents from `.specify/specs/019-qr-share-build/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: No automated test tasks. The project has no test suite and the constitution's Development Workflow states none is required but that manual golden-path testing MUST happen before merge. The feature's two headline criteria — a physical camera reading a physical display (SC-002) and a load-time non-regression (SC-006) — are not automatable in any case. Manual verification tasks are therefore first-class here, one per story, drawn from `quickstart.md`.

**Scope note**: the spec's third user story (copy link) was cut before implementation — see Phase 5. Two stories remain.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

## Path Conventions

Vue SPA, single project. Source under `src/` at repository root, per plan.md's Structure Decision.

## ⚠️ A note on parallelism

**This feature has very little genuine parallelism, and the task list does not pretend otherwise.** Almost all work lands in one new file, `src/components/builds/BuildShareDialog.vue`. Two tasks in different files carry `[P]`; the rest are sequential because they edit the same file. Marking them `[P]` would be a lie that produces merge conflicts.

The real concurrency here is *between stories* once Phase 2 is done — US2 is small and independent, and could be done by a second person while US1 is in progress, but they would still be editing the same file.

---

## Phase 1: Setup

**Purpose**: Bring in the one new dependency.

- [X] T001 Add `qrcode` to `dependencies` in `package.json` via `npm install qrcode`, and confirm it is **not** imported anywhere statically (research R1 — it must only ever be reached by dynamic import)

**Checkpoint**: `npm run dev` still starts and the build page is unchanged.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The dialog shell, its entry point, and the URL every story shares. All three user stories need every task in this phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Create `src/components/builds/BuildShareDialog.vue` with the component shell per [contracts/build-share-dialog.md](./contracts/build-share-dialog.md) §2: props `build` (Object, required) and `modelValue` (Boolean, required), emit `update:modelValue`, a Vuetify `v-dialog` with a "Share build" title and a close action. No share logic yet. Match the Options-API-with-`setup()` style of the neighbouring build components.
- [X] T003 Add the `shareUrl` computed to `src/components/builds/BuildShareDialog.vue`: `` `${window.location.origin}/builds/${build.id}` ``. Derive from **`build.id`, not a route param** (research R5.2, FR-007), and return an absolute URL (FR-018).
- [X] T004 Wire the entry point in `src/views/builds/BuildDetails.vue`: add a `Share` `v-list-item` (icon `mdi-share-variant`) to the existing overflow menu above the export/download group, plus a `shareDialog` ref and the `<BuildShareDialog v-model="shareDialog" :build="build" />` mount alongside the existing dialogs. Register the component in the `components` block. The menu already sits inside the `v-if="build"` container, so FR-002 holds without new guarding.

**Checkpoint**: The Share item appears in the ⋮ menu on both layouts, opens an empty dialog, and closes without touching scroll position or browser history (FR-003).

---

## Phase 3: User Story 1 - Move a build from the PC to the phone by scanning (Priority: P1) 🎯 MVP

**Goal**: A scannable QR in the dialog that lands a phone directly in focus mode on the same build.

**Independent Test**: On desktop, open a build's share dialog, scan the QR with a phone camera, and confirm the phone opens that build in focus mode. Delivers the entire PC-to-phone workflow on its own.

- [X] T005 [US1] Add the `focusUrl` computed to `src/components/builds/BuildShareDialog.vue`: `` `${shareUrl}?focus=true` ``. **The `=true` is mandatory** — [BuildDetails.vue:236-238](src/views/builds/BuildDetails.vue#L236-L238) truthiness-tests `route.query.focus` and a bare `?focus` parses to the empty string, which is falsy (research R5.1, FR-006).
- [X] T006 [US1] Add the QR state machine to `src/components/builds/BuildShareDialog.vue` per [data-model.md](./data-model.md): `qrState` (`'pending' | 'ready' | 'failed'`) and `qrDataUrl`. Generate on **first dialog open only** via `await import("qrcode")` then `toDataURL(focusUrl, …)` — never at component mount (FR-020, NFR-001). Wrap in try/catch setting `failed`; no rejection may escape (FR-022).
- [X] T007 [US1] Render the three states in `src/components/builds/BuildShareDialog.vue`: a spinner for `pending` (NFR-002), `<img :src="qrDataUrl">` for `ready`, and a plain "QR code unavailable" line for `failed` — with the dialog's other content still usable in the failed case (FR-010).
- [X] T008 [US1] Style the QR in `src/components/builds/BuildShareDialog.vue` for scannability: pass explicit `color: { dark: '#000000', light: '#FFFFFF' }` and keep `qrcode`'s default `margin: 4` for the quiet zone; wrap in a white, rounded, padded container that stays white **in dark theme too**; set `width` ≈ 200 and `max-width: 100%` so it fits the smallest viewport (FR-008, FR-009, research R3).
- [X] T009 [US1] Add the text layer in `src/components/builds/BuildShareDialog.vue`: an `alt` on the `<img>` naming the build, and the visible caption "Scan to open on your phone" beneath it — the only cue explaining why this QR differs from the link below (NFR-004).
- [ ] T010 [US1] Verify User Story 1 against `quickstart.md` checks **A1–A7**, including a **real cross-device scan in both light and dark theme**. If the phone lands in reading mode rather than focus mode, revisit T005.

**Checkpoint**: MVP complete. The PC-to-phone handoff works end to end and is worth shipping on its own.

---

## Phase 4: User Story 2 - Pass a build to a chat application from the phone (Priority: P2)

**Goal**: Hand the plain build link to the device's own share sheet.

**Independent Test**: On a mobile device over HTTPS, open the share dialog, invoke the device share option, and confirm the correct link reaches a chosen app.

- [X] T011 [US2] Wire `useShare` from `@vueuse/core` into `src/components/builds/BuildShareDialog.vue` (already a project dependency — research R4) and render a "Share…" `v-list-item` **only** when `isSupported` is true (FR-011, FR-012).
- [X] T012 [US2] Implement the share action in `src/components/builds/BuildShareDialog.vue`: call `share({ title: build.title, url: shareUrl })` — the **plain** URL, no `?focus` (FR-017). Catch and **silently discard** the rejection; dismissing the sheet rejects with `AbortError` and must produce no snackbar, no console error, and no state change (FR-013, FR-014).
- [ ] T013 [US2] Verify User Story 2 against `quickstart.md` checks **B1–B5**, paying particular attention to **B4** (cancel the sheet — nothing may surface) and **B3** (the recipient must land in *reading* mode, not focus mode).

**Checkpoint**: Both stories work independently. Feature complete.

---

## Phase 5: Polish & Cross-Cutting Concerns

> **A third user story — "copy link" — was cut before implementation.** The share URL is the build page's own address, so the browser address bar already copies it, and native share sheets offer "Copy" as a target. Its stated purpose (a fallback so the dialog is never empty) was already covered: the QR needs no browser capability, so FR-004 holds without it. See the spec's *Rejected scope* section.

- [ ] T014 [P] Accessibility pass on `src/components/builds/BuildShareDialog.vue`: confirm the dialog and every option are reachable and activatable by keyboard alone, and that the QR's meaning is conveyed in text (`quickstart.md` F1–F3, NFR-004).
- [ ] T015 Verify degradation against `quickstart.md` **D1–D5** — block the `qrcode` chunk in DevTools, confirm the "unavailable" path leaves Share working, and confirm the console is free of unhandled rejections across every scenario including the US2 cancel (FR-010, SC-007).
- [ ] T016 Verify the lazy-load promise against `quickstart.md` **E1–E4**: no `qrcode` request on a build-page load with the dialog unopened, the chunk fetched only on first open, and `npm run build` placing `qrcode` in its **own** chunk rather than merging it into the build-details or vendor chunk (FR-020, NFR-001).
- [X] T017 Pre-merge review against the `quickstart.md` "Before merging" list: no composable extracted for a single consumer, `vite.config.mjs` untouched, no `v-html`, and `BuildDetails.vue` gained only a menu item and a dialog mount with no share logic leaked into the page (Constitution I, III, V).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies.
- **Phase 2 (Foundational)**: needs T001. **Blocks all three stories.**
- **Phase 3–4 (Stories)**: each needs Phase 2 complete. Independent of one another thereafter.
- **Phase 5 (Polish)**: needs whichever stories are being shipped.

### Within Phase 2

T002 → T003 → T004 is strictly sequential: T003 edits the file T002 creates, and T004 mounts the component T002 defines.

### Within each story

- **US1**: T005 → T006 (needs `focusUrl`) → T007 (needs the state machine) → T008/T009 (styling and text on the rendered element) → T010 (verifies the rest).
- **US2**: T011 → T012 → T013.

### Story independence

Both stories are genuinely independent once Phase 2 lands. Each adds one self-contained option to the dialog, and removing either leaves the other working — the QR needs no browser capability at all, so **US1 alone is a complete, shippable feature** and FR-004 holds even where Web Share is absent.

### Parallel opportunities

Honestly assessed, there are two:

- **T014** is marked `[P]` — an accessibility review that can proceed against the finished component while other verification runs.
- **T004** touches `BuildDetails.vue` while every other implementation task touches `BuildShareDialog.vue`, so a second person could take it once T002 defines the component's props and events.

Everything else is sequential same-file work. Attempting to parallelise T005–T012 produces conflicts in one file, not speed.

---

## Implementation Strategy

### MVP (recommended stopping point for a first commit)

1. T001 — dependency
2. T002–T004 — dialog shell and entry point
3. T005–T010 — the QR
4. **STOP and VALIDATE**: run `quickstart.md` A1–A7, including the real phone scan
5. Shippable. This is the half that unlocks feature 018.

### Incremental delivery

Setup + Foundational → **US1 (ship)** → US2 (ship) → Polish. Each story is one small commit that cannot break the previous one.

### Suggested commits

Per the constitution's Conventional Commits requirement, roughly:

- `chore(deps): add qrcode` (T001)
- `feat(builds): add share dialog to build details` (T002–T004)
- `feat(builds): add QR handoff to focus mode` (T005–T009)
- `feat(builds): add native share option` (T011–T012)

Verification tasks (T010, T013, T014–T017) gate their commits rather than producing their own.

---

## Notes

- The single highest-risk detail in this feature is **`?focus=true`** in T005. It passes code review and desktop click-through and only fails when someone actually scans with a phone. T010 is the check that catches it.
- Every `async` path added here needs a `catch`. Three separate requirements (FR-014, FR-022, SC-007) converge on "nothing escapes", and the `AbortError` on share cancel is the one most likely to be missed.
- No Firestore operation, Cloud Function, or third-party request appears anywhere in this list — that is intentional and load-bearing for FR-021 and Constitution IV.
