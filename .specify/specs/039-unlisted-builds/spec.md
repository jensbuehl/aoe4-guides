# Feature Specification: Unlisted Builds, Earned by Sharing

**Feature Branch**: `038-unlisted-builds` (the branch script counts branches, not spec folders; the
spec folder is 039 because `038-mobile-ux` already holds 038)

**Created**: 2026-11-04

**Status**: Draft

**Input**: User description: "Earned draft capacity and rename 'draft' to 'unlisted'. Today a signed-in
user can hold at most 10 drafts. The cap exists to discourage private-only use: sharing builds with the
community is the primary use case. The allowance is earned by publishing — 10 + one per two published
builds, capped at 50 — so prolific public authors get room while private-only users stay at 10. Drafts
are not private: anyone with the link can read one; they are only excluded from listings. Rename the
user-facing concept from 'draft' to 'unlisted' so users are not misled. No data migration. Out of
scope: paid tiers, per-user exceptions, server-side enforcement, making drafts actually private."

## Background

**Why there is a cap at all.** Sharing build orders with the community is what the site is for. The
cap on unpublished builds exists so the site does not turn into free private storage: a few unfinished
builds are a workspace, a large private collection is a different product. The cap is a nudge, not a
safeguard: it costs the site next to nothing for a build to stay unpublished.

**Why a flat 10 is the wrong shape.** The site's largest contributor coaches players and writes a
specific build for each client, sending them the link. Ten unpublished builds is not enough for that,
and the flat cap treats the site's most generous author exactly like someone who has never published
anything. The cap was meant to stop people who only take, and it is limiting the person who gives the
most. Tying the allowance to publishing keeps the nudge where it belongs and makes the same rule
reward sharing.

**Why "draft" is the wrong word.** An unpublished build is not private. Anyone with its link can open
it, through the site and through the public API's by-id route (which RTS Overlay uses); it is only
left out of lists, search, the home page, the sitemap and the SEO snapshot. That is what "unlisted"
means on every platform users know, and it is exactly why it works for coaching. "Draft" promises
something the site does not do: an author who saves a "draft" can reasonably believe nobody else can
see it.

**Two different "drafts" exist in the app, and only one is renamed.** The editor also keeps *unsaved
changes* on the device and offers them back ("Unsaved changes from …", Restore / Discard). That is a
local recovery feature, not a build state, and none of this spec applies to it.

## Clarifications

### Session 2026-11-04

- Q: Should turning a published build back into an unlisted one count against the allowance? → A: Yes. It is checked like creating a new unlisted build and refused at the allowance with the same message.
- Q: Should keeping unlisted builds out of search engines ship with this feature? → A: Yes, as User Story 3 (P3, delivered last). The stale pre-rendered page after unlisting a published build is accepted until the weekly snapshot refresh.
- Q: Which colour should the "Unlisted" badge use? → A: Keep red (`error`), as today; only label and icon change.
- Q: Should the allowance be visible before an author hits it? → A: No. It is shown only at the limit, in the refusal message; a counter is a possible follow-up.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prolific authors earn room for unlisted builds (Priority: P1)

An author who has published many builds saves another build without listing it, for a coaching client.
They already have more than 10 unlisted builds. Because they have published plenty, the save succeeds.

**Why this priority**: This is the request that started the feature and the core rule change. On its
own it fixes the problem for the person affected, even if nothing is renamed.

**Independent Test**: With an account that has 30 published builds (allowance 25) and 12 unlisted
builds, save a new build as unlisted: it succeeds. With an account that has 0 published builds and 10
unlisted builds, the same action is refused.

**Acceptance Scenarios**:

1. **Given** an author with 0 published builds and 9 unlisted builds, **When** they save a new build
   as unlisted, **Then** it is saved (allowance 10).
2. **Given** an author with 0 published builds and 10 unlisted builds, **When** they save a new build
   as unlisted, **Then** the save is refused and the message explains that publishing builds unlocks
   more room.
3. **Given** an author with 30 published builds and 24 unlisted builds, **When** they save a new build
   as unlisted, **Then** it is saved (allowance 10 + 15 = 25).
4. **Given** an author with 31 published builds, **Then** their allowance is 25 (half of 31 rounds
   down to 15).
5. **Given** an author with 200 published builds and 50 unlisted builds, **When** they save a new
   build as unlisted, **Then** the save is refused and the message says they have reached the maximum,
   without suggesting that publishing more would help.

---

### User Story 2 - The word tells the truth: "Unlisted" instead of "Draft" (Priority: P2)

Everywhere the app shows an unpublished build's state or offers to create one, it calls it
**unlisted**, and where an author chooses that state, the app says plainly that anyone with the link
can open it.

**Why this priority**: It stops misleading authors who believe their unpublished builds are private.
It is independent of the allowance rule and can ship on its own.

**Independent Test**: Walk through creating, viewing, listing and publishing an unpublished build and
confirm the word "draft" no longer appears for that state, and that the save option says the build
stays reachable by link.

**Acceptance Scenarios**:

1. **Given** the build editor's menu, **When** an author opens it, **Then** the option reads "Save as
   unlisted" (or equivalent) and its explanation says the build is not shown in lists or search, but
   anyone with the link can open it.
2. **Given** an unpublished build, **When** it is shown on its own page or as a card in My Builds,
   **Then** its state marker reads "Unlisted", and the marker does not suggest the build is private or
   unfinished.
3. **Given** an unlisted build's page, **When** the author opens the menu, **Then** the publish
   option's explanation refers to the build as unlisted (e.g. "List this build so other players can
   find it"), and publishing confirms with a message that does not say "draft".
4. **Given** the editor's offer to restore unsaved changes, **Then** it is unchanged: that feature is
   not the build state and keeps its own wording.

---

### User Story 3 - Unlisted builds stay out of search engines (Priority: P3)

A coaching client posts the link to their personal build in a public forum. Search engines that follow
the link do not add the build to their results.

**Why this priority**: "Unlisted" sets the expectation that a build is not discoverable. Today the
site keeps unpublished builds out of its own lists and sitemap, but their pages do not ask search
engines to stay away, so one public link is enough to get one indexed.

**Independent Test**: Open an unlisted build's page and confirm it tells crawlers not to index it; open
a published build's page and confirm it does not.

**Acceptance Scenarios**:

1. **Given** an unlisted build, **When** its page is loaded, **Then** it asks search engines not to
   index it.
2. **Given** a published build, **When** its page is loaded, **Then** it is indexable exactly as today.
3. **Given** an unlisted build that is then published, **When** its page is loaded again, **Then** it
   is indexable.

---

### Edge Cases

- **Allowance shrinks below the current count.** An author with 20 unlisted builds deletes or
  unpublishes published builds until the allowance drops to 15. Existing unlisted builds are kept and
  stay editable; only creating *additional* unlisted builds is refused until the count is back below
  the allowance.
- **Turning a published build back into an unlisted one.** Today the editor's "save as draft" on an
  already published build unpublishes it without any check. Because this both adds an unlisted build
  and removes a published one, it is subject to the same allowance check as creating a new unlisted
  build (computed before the change). Re-saving a build that is *already* unlisted is never limited.
- **Publishing frees room twice.** Publishing an unlisted build lowers the unlisted count by one and
  raises the published count by one; the message shown at the limit may say so, but no special
  handling is needed.
- **Count unavailable.** If the published count cannot be determined (offline, read refused), the
  allowance falls back to the base of 10, so the check never blocks more than it does today.
- **Imported builds.** Builds created by import are published, as today, and count toward the
  allowance like any other published build.
- **Exactly at the cap.** The allowance never exceeds 50 regardless of how many builds are published.

## Requirements *(mandatory)*

### Functional Requirements

**Allowance**

- **FR-001**: The number of unlisted builds a signed-in author may hold MUST be
  `10 + floor(published builds ÷ 2)`, never more than 50.
- **FR-002**: "Published builds" MUST mean the author's own builds that are publicly listed, counted
  regardless of any filter the author currently has applied in My Builds.
- **FR-003**: The allowance MUST be checked whenever a save would add an unlisted build: creating a
  new build as unlisted, and turning a published build into an unlisted one. Both are refused at the
  allowance with the same message. Without the second, the rule could be bypassed by publishing a
  build and then unlisting it. Saving changes to a build that is already unlisted MUST NOT be checked.
- **FR-004**: Existing unlisted builds above an author's current allowance MUST remain intact and
  editable. No unlisted build is ever deleted, hidden or published automatically.
- **FR-005**: When a save is refused below the cap, the message MUST state the author's current
  allowance and that publishing builds unlocks more (one extra slot per two published builds, up to 50).
- **FR-006**: When a save is refused at the cap, the message MUST state that 50 is the maximum and
  suggest publishing or deleting unlisted builds, without implying that publishing more raises it.
- **FR-007**: If the published count cannot be determined, the allowance MUST fall back to 10.
- **FR-008**: The same rule MUST apply to every author; there are no per-person exceptions.

**Naming**

- **FR-009**: Every user-facing reference to the unpublished-build state MUST use "unlisted" instead
  of "draft": the state marker on build pages and build cards, the editor's save option and its
  explanation, the publish option's explanation, the publish confirmation and the limit messages.
- **FR-010**: Where an author chooses to save a build as unlisted, the app MUST say that the build is
  not shown in lists or search but can be opened by anyone with its link.
- **FR-011**: The unlisted state marker MUST NOT use imagery that suggests privacy (e.g. a lock or a
  crossed-out eye) or work in progress (e.g. a pencil).
- **FR-012**: The editor's recovery of unsaved changes MUST keep its current behaviour and wording.
- **FR-013**: Stored build data MUST NOT change: existing unpublished builds become "unlisted" by
  name only, with no migration, and every other client reading builds (the public API, RTS Overlay,
  the SEO snapshot, the home snapshot) continues to work unchanged.

**Search engines**

- **FR-014**: An unlisted build's page MUST ask search engines not to index it; a published build's
  page MUST remain indexable.

**Non-goals (explicitly out of scope)**

- **FR-015**: The system MUST NOT introduce paid tiers or supporter-based allowances; spec 036's
  FR-031–FR-033 stand.
- **FR-016**: The system MUST NOT make unlisted builds private or restrict who can read them by link.
- **FR-017**: The allowance is a nudge enforced in the app, not a security boundary; server-side
  enforcement is out of scope.

### Key Entities

- **Build**: a build order owned by an author. Has a state of either *published* (listed, searchable,
  indexable) or *unlisted* (reachable by link only). The state is stored exactly as today.
- **Unlisted allowance**: derived per author, never stored: 10, plus one per two published builds,
  capped at 50.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An author with at least 80 published builds can hold 50 unlisted builds; an author with
  none can hold 10, unchanged from today.
- **SC-002**: The coaching contributor who raised the request can save new client builds without
  asking for an exception.
- **SC-003**: The word "draft" appears nowhere in the app's user-facing text for the unpublished-build
  state; the only remaining uses refer to unsaved local changes.
- **SC-004**: Saving a build as unlisted takes no longer from the author's point of view than saving a
  draft does today (one check, no extra step or confirmation).
- **SC-005**: An unlisted build's page is reported as non-indexable by a standard SEO inspection tool,
  and a published build's page as indexable.
- **SC-006**: No existing build changes state, disappears or loses content as a result of the change.

## Assumptions

- **The allowance numbers are fixed by the owner**: base 10, one extra per two published builds, cap
  50. They are a starting point and can be tuned in one place later.
- **The allowance is only shown at the limit** (confirmed in clarification). A permanent "7 of 25"
  indicator in My Builds is a possible follow-up, not part of this feature.
- **Existing authors are not notified individually** that their drafts were always reachable by
  link. The rename and the explanation on the save option are the notice.
- **Chip colour (red) and placement stay as they are**; only the label and icon change (confirmed in
  clarification).
- **Search-engine exclusion is best effort.** It covers crawlers that honour the standard signal; it
  does not and cannot stop anyone who has the link from reading or sharing the build. A build that was
  published and is then unlisted may stay indexable for crawlers that don't render the page, until
  the next weekly snapshot refresh replaces its pre-rendered copy.
- **The public API's by-id route keeps returning unlisted builds.** That is what makes them shareable
  with tools like RTS Overlay, and it matches the meaning of "unlisted".
