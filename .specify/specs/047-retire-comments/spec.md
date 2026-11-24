# Feature Specification: Retire Comments

**Feature Branch**: `047-retire-comments`

**Created**: 2026-11-24

**Status**: Step 1 live (1.28.0). Step 2 on `main`, deploys with 042 (on or after 2026-12-01). Step 3 gated on step 2 and the owner.

**Input**: Owner, 2026-11-24: "retire as you proposed (including deleting of the comments)."

## Decision

Comments are removed from the site and the stored comments are deleted, along with everything that exists only to serve them: the comment count on build cards, the reply-notification emails, the unsubscribe page and the rules that let clients write comments. Spec 046's related-build rails then close the build page.

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
- An email pipeline (Resend, a secret, a triggered function) and an unsubscribe flow (a callable function and a page).
- A counter branch in the rules, with tests.
- No moderation: the rules let only a comment's own writer delete it. Neither the build's author nor an admin can remove abuse from the app.

## Clarifications

### Session 2026-11-24

- Q: Keep the existing comments readable (freeze) instead of deleting them? → A: **Delete.** The owner chose deletion explicitly. Freezing would keep all the read code and still cost a read per build view.
- Q: When does the data go, after the app release or after the rules? → A: **After the rules** (step 3 follows step 2). Until the rules refuse comment writes, an old cached copy of the app (an installed PWA, a tab left open) can still post one, and deleting earlier would need a second pass. The comments are invisible from the app release on, so waiting costs nothing a reader can see.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The build page no longer offers comments (Priority: P1)

A reader opens any build. The page ends with the related-build rails (spec 046). There is no Comments card, no "Register now!" invitation and no comment box, and loading the page reads no comments.

**Why this priority**: This is what every visitor sees, and it removes the per-view read.

**Independent Test**: Open a build that has comments on production. No comment is shown and no request queries the `comments` collection.

**Acceptance Scenarios**:

1. **Given** any build, **When** its page loads, **Then** no Comments section is rendered and no query on `comments` is made.
2. **Given** a build list (Home, civ page, builds list, My Builds, Favorites), **When** cards render, **Then** no comment count is shown on any card or meta line.
3. **Given** the About page, **When** it lists what the site offers, **Then** it no longer mentions leaving comments.

---

### User Story 2 - No one can add comments, and no emails go out (Priority: P1)

After the backend step, no client can create, read or delete a comment, and no comment-notification email is ever sent again.

**Why this priority**: Without it, an old cached client can still write comments that nobody sees, and the function would still email about them.

**Independent Test**: The rules test suite refuses comment create, read and delete for every caller, and refuses `comments` counter steps. The deployed function list has neither `notifyCommenters` nor `processUnsubscribe`.

**Acceptance Scenarios**:

1. **Given** the deployed rules, **When** any client (signed in or not) creates, reads or deletes a document in `comments`, **Then** it is refused.
2. **Given** the deployed rules, **When** any client steps a build's `comments` counter, **Then** it is refused. No client may set it either (it stays in the counters list).
3. **Given** the deployed functions, **When** a comment document is created by any means, **Then** no email is sent, because the trigger no longer exists.
4. **Given** a link from an old notification email to `/account/unsubscribe`, **When** it is opened, **Then** the site's not-found handling applies. No error, and nothing is written.

---

### User Story 3 - The stored comments are gone (Priority: P2)

After the data step, production holds no comment documents, no `comments` counters on builds and no notification preferences on users.

**Why this priority**: It completes the retirement the owner asked for. Until then the data is invisible but present.

**Independent Test**: A read-only count after the step reports 0 comment documents, 0 builds with a `comments` field and 0 users with `notificationPreferences`.

**Acceptance Scenarios**:

1. **Given** the data script in dry-run mode, **When** it runs against production, **Then** it prints the counts it would delete and writes nothing.
2. **Given** the owner's explicit go-ahead, **When** the script runs for real, **Then** it deletes every `comments/*` document, removes `comments` from every build that has it and removes `notificationPreferences` from every user that has it, in batches, and prints what it did.
3. **Given** the script runs a second time, **When** there is nothing left, **Then** it reports zeros and writes nothing (idempotent).

---

### Edge Cases

- **Old cached app clients** (PWA, open tabs) still render Comments until they update. Before step 2 their writes still succeed; after it they fail. The old UI may show an error on posting, which is acceptable for a retired feature.
- **Builds created between steps 1 and 3** carry no `comments` field, because the seeds are removed in step 1. The rules accept an absent field (`startsAtZero`).
- **The public API** returns `comments` while the field exists. It is optional in its model (`comments?: number`), so its absence after step 3 is compatible. RTS Overlay does not read it.
- **The Resend API key secret** stays in Secret Manager after the function is deleted. Removing it is the owner's choice in the console, because a secret's deletion is not something a deploy does.
- **The home snapshot** keeps a `comments` value per build until `updateHomeSnapshot` next runs with the new code. The app no longer renders it, so nothing shows.

## Requirements *(mandatory)*

### Functional Requirements

**Step 1: app**

- **FR-001**: The build page MUST NOT render a Comments section or query the `comments` collection.
- **FR-002**: No build card or meta line MUST show a comment count.
- **FR-003**: The `Discussion` and `Comment` components, the comment service, the comment counter helpers (`incrementComments`, `decrementComments`), the `Unsubscribe` route and view, and the notification service MUST be removed from `src/`.
- **FR-004**: New and imported builds MUST NOT be seeded with `comments: 0`. `"comments"` stays in `NON_EDITABLE_FIELDS` while the rules list it as a counter, so the editor never sends a stale copy.
- **FR-005**: The About page MUST NOT mention comments.
- **FR-006**: Icons that only comments used MUST be removed from `src/plugins/mdiIcons.js`, and no icon still in use may be removed.

**Step 2: backend (after 042's rules and functions deploy)**

- **FR-007**: The rules MUST refuse every read and write on `comments/{id}` for every client.
- **FR-008**: The rules MUST refuse `comments` counter steps on builds. `comments` stays in `counters()`, so no client may set it.
- **FR-009**: Each refused case MUST have a rules test that fails against the deployed rules before it passes against the new ones (CLAUDE.md).
- **FR-010**: The functions `notifyCommenters` and `processUnsubscribe` MUST be removed, and `resend` removed from `functions/package.json` since nothing else uses it.
- **FR-011**: `updateHomeSnapshot` MUST stop copying `comments` into the snapshot.

**Step 3: data (after step 2, with the owner's explicit go-ahead)**

- **FR-012**: A script MUST delete all `comments/*` documents, remove the `comments` field from every build that has one and remove `notificationPreferences` from every user that has one.
- **FR-013**: The script MUST default to a dry run that writes nothing and prints counts. It writes only with an explicit flag, prints the project id first, and is idempotent.
- **FR-014**: The script MUST NOT live in `src/`, and MUST NOT run on deploy.

### Key Entities

- **comments/{id}**: `{ buildId, authorId, author, text, timeCreated }`. Deleted in step 3.
- **builds/{id}.comments**: a counter. Removed in step 3, and never written by any client after step 2.
- **users/{uid}.notificationPreferences**: `{ optedOut: [buildId], lastNotifiedAt: {buildId: iso} }`. Removed in step 3.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After step 1, a build page view makes one fewer Firestore query than before (none on `comments`).
- **SC-002**: After step 1, `grep -ri comment` over the built `dist/assets/*.js` finds no comment UI strings ("Write a comment", "Post Comment", "Delete Comment").
- **SC-003**: After step 2, `npm run test:rules` passes, with each new refusing case shown failing against the deployed rules first.
- **SC-004**: After step 3, a read-only count reports 0 / 0 / 0 (comment documents, builds with `comments`, users with `notificationPreferences`).

## Assumptions

- 042's pending deploys (rules after its check run 2 on or after 2026-12-01, then functions) carry step 2 with them. Step 2's code is on `main` by then, so those deploys ship it. The 042 deploy note is updated to say so.
- The admin key the owner provided may be used for the dry run. The real run needs a fresh go-ahead (memory: prod admin key).
- The public API repo needs no change (optional field). Its doc comment can be updated whenever that repo is next touched.

## Out of Scope

- Replacing comments with another feedback channel (Discord link, reactions).
- Deleting the Resend secret or the Resend account.
