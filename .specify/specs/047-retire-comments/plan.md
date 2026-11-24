# Implementation Plan: Retire Comments

**Branch**: `047-retire-comments` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

## Summary

Remove comments in three gated steps. The code for steps 1 and 2 lands on `main` together. Step 1 ships with the next app deploy. Step 2 ships with 042's pending rules and functions deploys, so the two never go out of order. Step 3 is a script under `scripts/`, run by hand after step 2: dry run first, then the owner's go-ahead.

## Technical Context

**Language/Version**: Vue 3 + Vuetify 3 (app); Node 22 CommonJS (functions); Firestore rules v2; Node ESM script with `firebase-admin` (data step)

**Storage**: Firestore `comments`, `builds.comments`, `users.notificationPreferences`

**Testing**: `npm run build`, `check:setup`, the icon allowlist check, `grep` on `dist/`, `npm run test:rules` (emulator, Java 21 portable JRE per memory), and a dry run of the data script

**Constraints**:
- No rules or functions deploy before 042's (memory: 042 deploys still owed).
- `scripts/retire-comments.mjs` never runs on Netlify, so it may import `firebase-admin`. It is not wired into any npm lifecycle script.

## Constitution Check

| Principle | Assessment |
|---|---|
| I. Simplicity | ✅ Pure removal. The data script is one file with one flag. |
| II. Incremental Quality | ✅ Removes 2 components, 2 services, 1 view, 2 functions and 1 dependency. Comments in surviving code that mention comments are updated, not left stale. |
| III. Consistent UX | ✅ No new UI. The build page ends with 046's rails. |
| IV. Cost-Conscious | ✅ One fewer read per build view, two fewer functions. |
| V. Secure Defaults | ✅ The rules close a write path and get tests that fail against the deployed rules first. The script uses the owner-given key, set on a single command only. |

## Decisions

- **D1, rules**: a deny-all match for `comments/{comment}` with a comment explaining why, rather than deleting the block. Default-deny gives the same result, but an explicit block tells the next reader that the collection was retired deliberately and must not be "fixed" by adding a rule back.
- **D2, counter**: drop `(changed().hasOnly(['comments']) && stepped('comments', true))` from the counter branch. Keep `'comments'` in `counters()`, so a create must still start it at zero (or omit it) and no update may touch it.
- **D3, tests**: in `tests/rules/builds.rules.test.mjs`, the two `assertSucceeds` on `comments: increment(±1)` become `assertFails`. Add a `comments.rules.test.mjs` for create, read and delete as owner, other user and anonymous. Both are run against a copy of the deployed rules first (`RULES_FILE`), to show they catch the hole.
- **D4, script**: `scripts/retire-comments.mjs`, modelled on `check-vote-gaps.mjs`'s admin setup.
  - It prints the project id.
  - It counts with `select()` queries.
  - Without `--write` it stops there.
  - It finds the fields to clear with `where(field, "!=", null)`, which matches exactly the documents where the field exists (any type, maps included), and reads them with `select()` so no build or user body is downloaded.
  - With `--write` it deletes in `BulkWriter` batches: the comment documents, then `FieldValue.delete()` on `builds.comments` and `users.notificationPreferences`.
- **D5, ordering note**: 042's tasks T019 (rules) and T034 (functions) gain a line saying they now also ship 047 step 2, and that the functions deploy will ask to delete `notifyCommenters` and `processUnsubscribe` (answer yes, or pass `--force`).

## Project Structure

```text
src/components/Discussion.vue, Comment.vue          DELETE
src/composables/data/commentService.js              DELETE
src/composables/data/notificationService.js         DELETE
src/views/account/Unsubscribe.vue                   DELETE
src/router/index.js                                 − Unsubscribe route, import, NON_CANONICAL entry
src/views/builds/BuildDetails.vue                   − Discussion; − comments: 0 seed
src/views/builds/BuildEditor.vue                    − comments: 0 seeds
src/composables/converter/useImportOverlayFormat.js − comments: 0 seed
src/composables/data/buildService.js                − increment/decrementComments
src/components/builds/BuildListCard.vue, BuildMetaLines.vue   − comment count
src/views/About.vue                                 − "leave comments"
src/plugins/mdiIcons.js                             − icons used only by comments
firestore.rules                                     comments deny-all; − counter step
tests/rules/builds.rules.test.mjs                   comment steps → assertFails
tests/rules/comments.rules.test.mjs                 NEW
functions/index.js, notifications/*                 − two functions
functions/package.json                              − resend
functions/builds/updateHomeSnapshot.js              − comments
scripts/retire-comments.mjs                         NEW (manual, dry run by default)
.specify/specs/040-…/contracts/firestore-rules.md   note: comments step retired by 047
.specify/specs/042-…/tasks.md                       T019/T034 carry 047 step 2
```
