# Feature Specification: Account Deletion Cleanup

**Feature Branch**: `034-account-deletion-cleanup`

**Created**: 2026-08-13

**Status**: Draft

**Input**: GitHub issue [#100](https://github.com/jensbuehl/aoe4-guides/issues/100), item 1 — "Move userDeleted post-processing from store into cloud function `deleteUser`", re-scoped after a re-review on 2026-08-13.

## Why this exists

When somebody deletes their account, the marks they left on other people's build
orders are supposed to go with them. Today only some of them do, and only when
the deletion happens through the app.

Spec 032 fixed one half of this while doing something else. The delete flow used
to remove the authentication account *first*, after which the departing user was
no longer permitted to touch their own data, and every cleanup write was silently
refused — so likes outlived their owner. That ordering was corrected (032 T010,
research R-10) but never verified (032 T011 is still unchecked), and the other
half was never addressed at all.

What remains is a data-integrity defect with a visible consequence: build orders
are ranked by score, so votes cast by accounts that no longer exist keep steering
what every reader sees on the home page and in every list.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A departing account stops counting (Priority: P1)

Somebody who has favourited, upvoted and downvoted build orders over the years
deletes their account. Every counter their activity contributed to drops by
exactly their contribution, on every build they touched — not just the ones they
favourited.

**Why this priority**: This is the live defect. Upvotes and downvotes are never
decremented, and the record of which builds they applied to is destroyed in the
same operation that should have used it, so the damage is permanent and grows
with every deletion. It also subsumes the verification that 032's like fix
actually works, which has never been run.

**Independent Test**: Create an account, favourite build A, upvote build B,
downvote build C, note all three counters, delete the account, re-read the three
builds. Fully testable on its own and delivers the entire correctness benefit
even if nothing else in this spec ships.

**Acceptance Scenarios**:

1. **Given** an account that has favourited build A, **When** the account is deleted, **Then** build A's like count is exactly one lower than before
2. **Given** an account that has upvoted build B, **When** the account is deleted, **Then** build B's upvote count is exactly one lower than before
3. **Given** an account that has downvoted build C, **When** the account is deleted, **Then** build C's downvote count is exactly one lower than before
4. **Given** an account that both favourited and upvoted the same build, **When** the account is deleted, **Then** both that build's like count and its upvote count drop by one
5. **Given** an account with no recorded favourites or votes, **When** the account is deleted, **Then** the deletion completes normally and no build is modified
6. **Given** an account that voted on a build order which has since been deleted, **When** the account is deleted, **Then** the missing build is skipped and every other build is still adjusted

---

### User Story 2 - Cleanup happens however the account goes (Priority: P2)

An administrator removes an account directly, without the app being involved —
from the Firebase console, or in response to a support request. The same cleanup
runs, with the same result as if the person had pressed the button themselves.

**Why this priority**: Correctness that depends on the user choosing the polite
exit is not correctness. Today an administrative deletion removes the account and
leaves every favourite, like, upvote and downvote in place — the worst outcome of
the three, and the one nobody is watching. It ranks below US1 only because US1
fixes counts for the common path and can ship first.

**Independent Test**: Delete an account from the Firebase console, having first
recorded its favourites and votes, and confirm the same counters move as in US1.

**Acceptance Scenarios**:

1. **Given** an account deleted outside the app, **When** the deletion is processed, **Then** its favourites, upvotes and downvotes are decremented exactly as for an in-app deletion
2. **Given** an account deleted outside the app, **When** the deletion is processed, **Then** its stored profile and its favourites record are both removed
3. **Given** any account deletion, **When** cleanup runs, **Then** it succeeds without relying on the deleted person's own permissions

---

### User Story 3 - The goodbye is not a wait (Priority: P3)

Somebody with hundreds of favourites and votes deletes their account and gets
confirmation immediately, rather than watching a spinner while every affected
build order is updated one at a time.

**Why this priority**: A real but secondary benefit, and it falls out of US2
almost for free — once cleanup is no longer the client's job, the client stops
waiting for it. Worth stating so it is not accidentally designed away.

**Independent Test**: Delete an account holding at least 100 favourites and votes
and measure the time from confirming to seeing the result.

**Acceptance Scenarios**:

1. **Given** an account with at least 100 recorded interactions, **When** the person confirms deletion, **Then** they see confirmation within 3 seconds
2. **Given** a deletion that has been confirmed to the user, **When** the cleanup has not finished yet, **Then** it still completes fully without further involvement from that person

---

### Edge Cases

- **A retried cleanup.** If cleanup runs a second time for the same account — a retry after a partial failure, a duplicate event — no counter may move twice. This is the sharpest risk in the whole feature: a double decrement is worse than the bug being fixed, because it corrupts a build whose owner did nothing wrong.
- **A counter already at zero.** Historic data is not guaranteed consistent. Decrementing must not drive a like, upvote or downvote count below zero.
- **An account with no favourites record at all.** Accounts created before the record existed, and Google accounts abandoned at the display-name prompt, may have none.
- **An account holding hundreds of interactions.** Cleanup must complete rather than exceeding a platform write limit partway through.
- **The same build appearing in two lists.** Favourites, upvotes and downvotes are independent counters; a build in two of them takes two independent adjustments.
- **Builds authored by the departing account.** These stay published, untouched, and keep their author attribution.
- **A deletion attempted from a long-idle session.** The account may be asked to prove its identity again before deletion is permitted; cleanup must not run for a deletion that never happened.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When an account is deleted, every build order it had marked as a favourite MUST have its like count reduced by exactly one.
- **FR-002**: When an account is deleted, every build order it had upvoted MUST have its upvote count reduced by exactly one, and every build order it had downvoted MUST have its downvote count reduced by exactly one.
- **FR-003**: The record of an account's favourites and votes MUST remain readable until every corresponding counter has been adjusted. It MUST NOT be discarded first.
- **FR-004**: Cleanup MUST run for every account deletion, whatever triggered it — the app, an administrator, or a direct console action.
- **FR-005**: Cleanup MUST NOT depend on the deleted person's own access rights, since those cease to exist at the moment of deletion.
- **FR-006**: Cleanup MUST be idempotent. Running it more than once for the same account MUST leave every counter at the same value as running it once.
- **FR-007**: No counter may be reduced below zero.
- **FR-008**: A referenced build order that no longer exists MUST be skipped without aborting the cleanup of the remaining ones.
- **FR-009**: Build orders authored by the deleted account MUST remain published, readable and attributed exactly as before.
- **FR-010**: Both the account's stored profile record and its favourites record MUST be removed once the counter adjustments are complete.
- **FR-011**: The person deleting their account MUST receive confirmation once the account itself is gone, without waiting for the counter adjustments to finish.
- **FR-012**: Cleanup MUST complete for an account holding at least 500 combined favourites, upvotes and downvotes.
- **FR-013**: A cleanup that fails partway MUST leave a record of what failed, sufficient to retry it deliberately.
- **FR-014**: The existing like-decrement repair from spec 032 MUST be verified as part of this work, closing 032 T011.

### Key Entities

- **Account**: the authenticated identity being deleted. Its disappearance is the event everything else keys off.
- **Profile record**: the stored per-account document holding email and chosen display name. Removed on deletion.
- **Favourites record**: one document per account holding three independent lists — favourites, upvotes and downvotes — each naming build orders. It is both the thing to be deleted and the only map of what must be decremented first; that dual role is the origin of the bug.
- **Build order**: carries like, upvote and downvote counts, plus an author. The counts are adjusted; the build itself and its authorship are not.
- **Contributor record**: the public author entry backing author pages and Top Contributors. Survives deletion, because the account's build orders survive and must stay attributed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After deleting a test account that favourited, upvoted and downvoted one build order each, all three counters are exactly one lower and no other build order has changed.
- **SC-002**: 100% of account deletions result in complete cleanup, verified for both an in-app deletion and an administrator deletion.
- **SC-003**: A person deleting an account with at least 100 recorded interactions sees confirmation within 3 seconds.
- **SC-004**: Running cleanup twice for the same account produces counters identical to running it once — verified by comparing counts after a deliberate second run.
- **SC-005**: An account holding at least 500 combined interactions is cleaned completely, with no counter left unadjusted.
- **SC-006**: Zero build orders are lost, unpublished or stripped of authorship by an account deletion.
- **SC-007**: No like, upvote or downvote count anywhere is negative after cleanup.

## Assumptions

- **Build orders outlive their authors.** This is deliberate and pre-existing — the community still uses them, and anything sensitive is removed by hand. Stated as an assumption because a reader could reasonably expect deletion to remove them.
- **The contributor record survives too.** It follows from the above: builds that stay published must stay attributed. Removing it would orphan them on author pages and in Top Contributors.
- **Comments authored by the deleted account are out of scope.** They are not named in the original defect, and they follow the same "authored content stays" logic as build orders. If they should be removed or anonymised, that is a separate feature with its own privacy reasoning.
- **View counts are not adjusted.** A view is not attributable to an account and there is no record to reverse.
- **The existing re-authentication behaviour stays.** A long-idle session is asked to prove identity before deletion; that flow arrived with spec 032 and is not revisited here.
- **032 T011 has never been run**, so the current like-decrement behaviour is unproven. This spec treats it as unverified rather than working.

## Dependencies

- The favourites record is the sole source of truth for what an account voted on. Nothing else in the system records it, which is why FR-003 exists.
- Spec 032's `deleteAccount` ordering fix is the foundation this builds on; if it is wrong, US1 fails regardless of anything added here. FR-014 exists to find that out.

## Out of Scope

- Removing or anonymising comments.
- Any change to how accounts are created or set up (issue #100 item 2, closed as obsolete).
- The build-order format migration (issue #100 item 3, deferred).
- Account recovery or undo after deletion.
- **Repairing historical orphans** — decided 2026-08-13, see below.

## Decision: historical damage is not repaired

Accounts deleted before this feature landed left their marks behind, and in many
cases their favourites records too: the pre-032 ordering bug refused *every*
cleanup write, including the deletion of the record itself. So the evidence is
probably still in the database and a one-off repair would be technically
possible.

It is deliberately not being done. The number of affected accounts is very small,
so the skew in historical counts is negligible against the cost of designing,
dry-running and verifying a corrective pass over the build collection — and a
repair that gets its arithmetic wrong would damage builds that are currently
fine, which is a strictly worse outcome than a slightly inflated count.

This is recorded rather than dropped because the option remains open: if the
orphan count is ever found to be larger than assumed, the records needed to fix
it are still there. Anyone revisiting this should count them first.

Nothing in this spec depends on the decision. It changes no requirement, scenario
or success criterion — it only withholds a task.
