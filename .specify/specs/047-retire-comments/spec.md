# Feature Specification: Retire Comments

**Feature Branch**: none yet

**Created**: 2026-11-24

**Status**: Stub. The decision is made, and the spec is to be written **after 046 ships**. This file reserves the number and keeps what was found.

**Input**: Owner, 2026-11-24: "retire as you proposed (including deleting of the comments)."

## Decision

Comments are removed from the site, and the stored comments are deleted. Spec 046's related-build rails then close the build page.

## Why (production, read-only, 2026-11-24)

| | |
|---|---|
| Accounts | 5,342 in total. 2,431 active in the last 12 months, 1,568 of them new |
| Comments ever written | 353, since April 2023, on 228 of 5,426 builds (4%) |
| Last 12 months | 55 comments from 40 people (1.6% of active accounts). 32 of them were not the build's author |
| Ratio | about one comment per 12,000 counted build views |
| Top two commenters | 128 comments together (an admin with 87, another account with 41). Neither posted in the last 12 months |

Cost of keeping it:
- At least one Firestore read on every build page view, and on 96% of builds it returns nothing.
- An email pipeline (Resend) and an unsubscribe flow.
- A counter branch in the rules.
- No moderation: the rules let only a comment's own writer delete it.

## Sequence (each step has its own gate)

1. **App release.** Nothing else has to deploy first: the live rules accept a new build with no `comments` field (`startsAtZero`).
2. **Backend, only after 042's rules and functions deploy** (gated on 042 run 2, on or after 2026-12-01). `main`'s `firestore.rules` is already ahead of production, so deploying rules earlier would ship 042's rules out of order.
   - Rules: deny everything on `comments/{id}`, and drop the `comments` step from the counter branch. Keep `comments` in `counters()` so no client can ever write it.
   - Functions: delete `notifyCommenters` and `processUnsubscribe`. Removing `resend` from `functions/package.json` is allowed only if nothing else uses it.
3. **Data, after step 1 is live.** Dry run with counts first, then the owner's explicit go-ahead.
   - Delete every `comments/*` document.
   - `FieldValue.delete()` the `comments` field on builds.
   - Delete `notificationPreferences` (`optedOut`, `lastNotifiedAt`) on `users/*`.

## Touchpoints found

- **App:**
  - `src/components/Discussion.vue`, `src/components/Comment.vue`, `src/composables/data/commentService.js`
  - `<Discussion>` in `BuildDetails.vue`
  - `incrementComments` and `decrementComments` in `buildService.js`. Keep `"comments"` in `NON_EDITABLE_FIELDS` while the rules list it.
  - The comment count in `BuildListCard.vue` (~l.184) and `BuildMetaLines.vue` (l.56–58, l.117)
  - `comments: 0` seeds in `BuildDetails.vue` (l.764), `BuildEditor.vue` (l.480, l.911) and `useImportOverlayFormat.js` (l.30)
  - The `Unsubscribe` route and view, plus `notificationService`
  - The About text (l.369, "leave comments for the author")
  - Icons `mdi-comment-outline`, `mdi-message-outline` and `mdi-send` in `src/plugins/mdiIcons.js`, if nothing else uses them
- **Functions:** `functions/index.js` (exports), `functions/notifications/`, and `comments` in `updateHomeSnapshot.js` (l.49).
- **Rules tests:** `tests/rules/builds.rules.test.mjs` (l.179, l.213–214 assert today's comment steps). Add a refusing case first, and confirm it fails against the deployed rules.
- **Public API** (`aoe4-guides-api`): `comments?: number` is optional in `models/build.ts`, so removing the field from data is compatible. Update the doc comment and `swagger.json` description, and keep RTS Overlay in mind.
- **Past emails** link to `/account/unsubscribe`. Once the route is gone they land on the catch-all, which is acceptable because no further emails are sent.
