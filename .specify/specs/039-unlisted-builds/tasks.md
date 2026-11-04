# Tasks: Unlisted Builds, Earned by Sharing

**Input**: Design documents from `.specify/specs/039-unlisted-builds/`
**Prerequisites**: plan.md, spec.md (with Clarifications 2026-11-04), research.md, data-model.md,
contracts/unlisted-allowance.md, contracts/ui-copy.md, quickstart.md

**Tests**: no suite (constitution). Verification is the Node harness for the pure rule
(quickstart §1), the static checks (§2) and the manual/browser steps (§3–5).

**Naming rule for every task**: user-facing text says "unlisted"; code identifiers keep `draft`
(`isDraft`, `handleDraft`, `getUserDrafts*`). The editor's unsaved-changes recovery
(`useEditorDraft`, "Unsaved changes from …") is not touched (research R6).

## Phase 1: Setup

None. No dependency, config or schema change.

## Phase 2: Foundational

None. Each story touches its own files, apart from `BuildEditor.vue` (US1 + US2) and `BuildDetails.vue`
(US2 + US3), which are edited in sequence.

---

## Phase 3: User Story 1 - Prolific authors earn room for unlisted builds (P1) 🎯 MVP

**Goal**: The allowance is `min(50, 10 + ⌊published ÷ 2⌋)`. It's checked on every save that adds an
unlisted build (new, and published → unlisted) and never on re-saving an unlisted build.

**Independent Test**: quickstart §1 harness prints `ok`; quickstart §3 steps 1–3 against
`aoe4-guides-dev`.

- [X] T001 [P] [US1] Create `src/composables/builds/unlistedAllowance.js` per contracts/unlisted-allowance.md: no imports; export `UNLISTED_BASE = 10`, `UNLISTED_PER_PUBLISHED = 2`, `UNLISTED_CAP = 50`; `unlistedAllowance(publishedCount)` returns `Math.min(CAP, BASE + Math.floor(n / PER))`, where a non-number, non-finite or negative input counts as 0 (strings included); `unlistedLimitMessage(allowance)` returns the two texts from contracts/ui-copy.md (cap text when `allowance >= UNLISTED_CAP`), built from the constants and never from literals. Header comment: why the rule exists (sharing is the primary use; the cap is a nudge, not a safeguard) and that "draft" in code = "unlisted" for users.
- [X] T002 [US1] Verify T001 with the quickstart §1 harness, written to the scratchpad and run with `node`; it must print `ok`. Do not add it to the repo.
- [X] T003 [US1] Rewrite `handleDraft` in `src/views/builds/BuildEditor.vue` (≈ line 769) per the call-site contract: `needsCheck = props.mode === "new" || originalBuild.value?.isDraft === false`; when needed, `Promise.all([getUserDraftsCount(uid), getUserBuildsCount(uid)])`, `allowance = unlistedAllowance(published)`, refuse with `showSnackbar({ text: unlistedLimitMessage(allowance), type: "error" })` when `typeof unlisted === "number" && unlisted >= allowance`. Import `getUserBuildsCount` alongside `getUserDraftsCount` (≈ line 305) and the two functions from `@/composables/builds/unlistedAllowance`. Delete `const maxDrafts = 10` and the old message. Comment at the guard: why the edit path is checked now (publish-then-unlist bypass, clarification Q1), and that a failed count never blocks (FR-007).

**Checkpoint**: US1 can ship alone. The old "draft" wording is still visible, but the rule is the new one.

---

## Phase 4: User Story 2 - "Unlisted" instead of "Draft" (P2)

**Goal**: Every user-facing reference to the state says "Unlisted", and choosing it says the link
still works.

**Independent Test**: quickstart §2 grep finds no user-facing "draft" for the state; §5 ux-gate on the
badges.

- [X] T004 [US2] In `src/views/builds/BuildEditor.vue` (≈ lines 35–43): menu item label "Save as draft" → "Save as unlisted"; tooltip → "Save without listing it. It won't show up in lists or search, but anyone with the link can open it." (contracts/ui-copy.md). Leave the "Unsaved changes" restore card unchanged.
- [X] T005 [US2] In `src/views/builds/BuildDetails.vue`: Publish tooltip (≈ line 94) → "List this build so other players can find it"; `handlePublish` snackbar (≈ line 780) → "Build published! Other players can find it now."
- [X] T006 [P] [US2] In `src/components/builds/BuildHeader.vue`, both badges (≈ lines 38 and 97): icon `mdi-pencil-circle` → `mdi-link-variant`, label "Draft" → "Unlisted". Keep `color="error"`, size, classes (clarification Q3).
- [X] T007 [P] [US2] In `src/components/builds/BuildListCard.vue`, both badges (≈ lines 79 and 160): the same change as T006.
- [X] T008 [P] [US2] In `src/plugins/mdiIcons.js`: add `mdi-link-variant` (import `mdiLinkVariant` from `@mdi/js`, following the file's existing pattern and order); remove `mdi-pencil-circle` only once `grep -rn "mdi-pencil-circle" src` finds no use outside the allowlist.
- [X] T009 [US2] Run the icon `comm` check from `CLAUDE.md`; it must print only `mdi-svg` and `mdi-xxx`. Then run the quickstart §2 "draft" grep and confirm the only hits are code identifiers or the unsaved-changes recovery.

**Checkpoint**: US1 + US2 together are the full user-visible change.

---

## Phase 5: User Story 3 - Unlisted builds stay out of search engines (P3)

**Goal**: An unlisted build's page carries `<meta name="robots" content="noindex">`; published pages
don't, including right after Publish without a reload.

**Independent Test**: quickstart §4 steps 1–3.

- [X] T010 [US3] In `src/views/builds/BuildDetails.vue` `setup()`: add a `watch(() => build.value?.isDraft, (unlisted) => …, { immediate: true })` that creates `meta[name=robots]` with `content="noindex"` in `document.head` when `unlisted === true` and removes it otherwise. Add `onUnmounted` removal, importing `onUnmounted` if it isn't already imported. Write it inline, mirroring `setCanonical` in `src/router/index.js`. Comment: why it's reactive (Publish uses `router.replace` to the same route, so the component is reused and `onMounted` doesn't run again), why it's removed on unmount (`document.head` is shared by every page), and the known limitation of the stale pre-rendered page (research R4).

---

## Phase 6: Polish & cross-cutting

- [X] T011 `npm run build` (if it exits with code 139, rerun; see `project-local-build-segfaults` memory) and `npm run check:setup`. Report both outcomes plainly.
- [X] T012 State plainly what is **not** verified without a browser and the dev project: quickstart §3 (allowance against real counts), §4 (robots meta in the DOM), §5 (ux-gate badge rendering at 360/393/960, light and dark).
- [X] T013 Reconcile documents: tick finished tasks here, and check that spec/plan/research still describe the code as built.

---

## Dependencies & execution order

- **US1**: T001 → T002, T001 → T003.
- **US2**: T004 follows T003 (same file, `BuildEditor.vue`). T005 is independent of US1. T006, T007 and T008 are parallel. T009 comes after T006–T008.
- **US3**: T010 follows T005 (same file, `BuildDetails.vue`).
- **Polish**: after everything.

### Parallel opportunities

```text
T001 (new module)  ‖  T006 BuildHeader  ‖  T007 BuildListCard  ‖  T008 mdiIcons
```

## Implementation strategy

MVP is US1 (T001–T003), which on its own answers the contributor's request. US2 and US3 are small
enough to ship in the same push. Per the owner's standing rule, nothing is committed or pushed
without being asked.
