# Tasks: Retire Comments (047)

**Input**: [spec.md](spec.md), [plan.md](plan.md)

## Phase 1: Setup

- [x] T001 Worktree `../aoe4-guides-047` on `047-retire-comments` off `origin/main` (1.26.0), upstream unset, `.env` copied, `node_modules` junctioned.

## Phase 2: User Story 1 — the build page no longer offers comments (P1, ships with the app)

- [x] T002 [US1] Remove `<Discussion>` and its import and registration from `src/views/builds/BuildDetails.vue`, and the `comments: 0` seed there. Update 046's mount comment if it mentions Comments.
- [x] T003 [P] [US1] Delete `src/components/Discussion.vue`, `src/components/Comment.vue`, `src/composables/data/commentService.js`.
- [x] T004 [P] [US1] Remove `incrementComments`/`decrementComments` from `src/composables/data/buildService.js`. Keep `"comments"` in `NON_EDITABLE_FIELDS`, with its comment saying why.
- [x] T005 [P] [US1] Remove the comment count from `src/components/builds/BuildListCard.vue` and `src/components/builds/BuildMetaLines.vue` (template and the `comments > 0` condition at l.117).
- [x] T006 [P] [US1] Remove the `comments: 0` seeds from `src/views/builds/BuildEditor.vue` (×2) and `src/composables/converter/useImportOverlayFormat.js`.
- [x] T007 [P] [US1] Delete `src/views/account/Unsubscribe.vue` and `src/composables/data/notificationService.js`. Remove the route, its lazy import and its `NON_CANONICAL_ROUTES` entry from `src/router/index.js`.
- [x] T008 [P] [US1] About text in `src/views/About.vue` (l.369): drop "and leave comments for the author".
- [x] T009 [US1] Remove icons from `src/plugins/mdiIcons.js` that nothing uses any more (check `mdi-comment-outline`, `mdi-message-outline`, `mdi-send`), then run the `comm` allowlist check.
  - *Done*: `mdi-comment-outline`, `mdi-message-outline` and `mdi-send` were used only by comments, and all three are removed. The allowlist check prints only `mdi-svg mdi-xxx`.
- [x] T010 [US1] `npm run build`, `check:setup`, `check:steps`. `grep` on `dist/assets/*.js` for "Write a comment", "Post Comment", "Delete Comment" and "processUnsubscribe" finds nothing (SC-002).
  - *Done*: build, `check:setup` and `check:steps` are green, and `dist/assets/*.js` holds none of the strings.

## Phase 3: User Story 2 — no one can add comments, no emails (P1, ships with 042's deploys)

- [x] T011 [US2] Tests first:
  - `tests/rules/comments.rules.test.mjs`: create, read and delete refused for owner, other user and anonymous.
  - `tests/rules/builds.rules.test.mjs` l.213–214: `assertSucceeds` → `assertFails`.
  - *Done*: against the current rules (identical to production for comments and the A4 step), exactly the four new cases fail (K1–K3, A4) and the other 44 pass.

  Run them against a copy of the **deployed** rules (`RULES_FILE`) and confirm they fail there.
- [x] T012 [US2] `firestore.rules`: a deny-all `comments/{comment}` block with a comment (plan D1), and drop the comments step from the counter branch (D2). Update the `counters()` comment. `npm run test:rules` passes.
  - *Done*: `npm run test:rules` 75/75 (portable Temurin 21 JRE).
- [x] T013 [P] [US2] `functions/index.js`: remove both exports. Delete `functions/notifications/` and `resend` from `functions/package.json` and its lock (`npm uninstall resend` in `functions/`). Remove `comments` from `functions/builds/updateHomeSnapshot.js`. Check `node -e "require('./functions/index.js')"` loads, now that `resend` is gone.
  - *Done*: `index.js` loads with 12 exports, neither removed function among them. `resend` is out of `package.json` and the lock (removals only).
- [x] T014 [P] [US2] Reconcile: spec 040's rules contract (A4 row, comments line) marks the comments step as retired by 047. 042's `tasks.md` is **not** edited here: another session holds uncommitted changes to it in the shared tree. The note that 042's T019 (rules) and T034 (functions) now also ship 047 step 2, and that the functions deploy asks to delete `notifyCommenters` and `processUnsubscribe`, lives in memory `project-042-pending-deploys` (T019 below).

## Phase 4: User Story 3 — the stored comments are gone (P2, manual, after step 2)

- [x] T015 [US3] Write `scripts/retire-comments.mjs` (plan D4): prints the project, counts, dry run by default, `--write` to delete with BulkWriter, idempotent.
- [x] T016 [US3] Dry run against production with the owner's key (read-only), and report the counts.
  - *Done 2026-11-24*: project `aoe4-guides`: **353** comment documents, **5,287** builds with a `comments` counter (nearly every build was seeded with `comments: 0`, not only the 228 with comments) and **17** users with `notificationPreferences`. No function triggers on build or user writes, and sitemap dates come from `created`, so the 5,287 updates change nothing else.
- [ ] T017 [US3] **Gated**: after step 2 is deployed and the owner gives an explicit go-ahead, run with `--write`, then run again to show 0/0/0 (SC-004).

## Phase 5: Release & harvest

- [ ] T018 Merge to `main` and release (app step), with owner approval.
- [ ] T019 Update memory `project-042-pending-deploys`: the rules and functions deploys now also ship 047 step 2, and step 3 follows them.

## Dependencies

T002–T010 → T018 (app ships). T011 → T012. T012, T013 and T014 are on `main` with T018, but deploy only with 042. T015–T016 can happen any time. T017 waits for the 042 deploys and the owner.
