# Feature Specification: Contributor Spotlight

**Feature Branch**: `037-contributor-spotlight`

**Created**: 2026-08-21

**Status**: Draft

**Input**: User description: "Highlight particular contributors (e.g. Valdemar, or the top 3) on the home page, similar to the event card or as a new hero card. In the same pass, dress up the header on the author-filtered builds view. Possibly add a backlink to a YouTube channel where the contributor is also a creator, and allow profile metadata — a small self-maintained bio shown on the author page and/or the hero."

## Context

The site is written by its community: roughly 4,000 build orders, none of them by the maintainer.
The people who write them currently receive almost no signal that the work is read. The only
recognition that exists today is a ranked list of eight names in the home sidebar and a one-line
header on the author-filtered builds view — a name, an avatar and two numbers.

This feature turns that thin recognition into something a contributor would want to link to. It has
three parts: a **prominent, curated spotlight** on the home page, an **author page header worth
landing on**, and **self-maintained public profile fields** — an introduction and up to three
outbound links — that give both surfaces something personal to show.

### Why the spotlight is curated, not ranked

The obvious design is "show the top 3". It was rejected, and the reason belongs in the spec because
it will otherwise be re-proposed:

- The ranking metric — a contributor's accumulated view count — is incrementable by **any
  unauthenticated client**, by deliberate design (the same permissive pattern that lets build view
  counts increment without a login). While it drives a small sidebar list, that is harmless. The
  moment it decides who occupies the most prominent card on the site, the metric becomes a target.
- The ranking metrics are **cumulative since the site began**. They do not decay. A ranked spotlight
  therefore permanently seats the same handful of early contributors and can never surface someone
  who started this month — the exact opposite of the motivational effect intended.
- Curation doubles as **content moderation**. A self-written bio that reaches the home page is
  user-generated content on the site's most visible surface, and there is no moderation workflow.
  Because a human chooses who appears there, the bio is read before it is published. This is why the
  feature needs no approval flag, no admin queue and no reporting flow.

The existing ranked sidebar list is **not** replaced. It keeps doing what it does well — a live,
automatic leaderboard — and is deliberately left untouched, including staying free of bios.

### Why "one at a time" and "changed by hand" are acceptable

Changing who is in the spotlight is a deliberate act by the maintainer that takes effect on the next
scheduled refresh of the home page data (currently every six hours) and requires a backend deploy,
which is a manual step in this project. For a spotlight expected to rotate roughly monthly, that
latency is irrelevant and the manual step is the same effort as the existing monthly funding update.
It is recorded here so nobody later mistakes the delay for a bug.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A visitor meets a contributor on the home page (Priority: P1)

A player opens the home page. Where a tournament banner sits during an event, they instead find a
card introducing one member of the community by name and face: who they are in their own words, how
many build orders they have written, how often those have been read, and a way to see all of them.
If that person also publishes videos, the card links out to their channel.

**Why this priority**: This is the feature's entire hypothesis — that naming a person on the most
visible surface of the site is a meaningful thank-you and visible proof that contributions are
noticed. It stands alone: shipped with nothing else, it already delivers the recognition, using only
data the site already holds.

**Independent Test**: Nominate a contributor, wait for the home page data to refresh, load the home
page signed out at both phone and desktop width, and confirm the card appears with that person's
name, avatar and statistics, and that following it reaches their build orders. No profile editing
and no author-page work is required.

**Acceptance Scenarios**:

1. **Given** a contributor has been nominated and no event is being announced, **When** a visitor
   loads the home page, **Then** the spotlight card is presented at the top of the main column,
   above the build lists, on both phone and desktop.
2. **Given** an event is currently being announced, **When** a visitor loads the home page, **Then**
   the event announcement is presented and the spotlight card is not — the two never appear
   together.
3. **Given** the event announcement has passed its end date and removes itself, **When** a visitor
   loads the home page, **Then** the spotlight card occupies the freed position without any further
   change being made.
4. **Given** the spotlight card is shown, **When** the visitor activates it, **Then** they arrive at
   the build orders written by that contributor.
5. **Given** the spotlighted contributor has published videos and has said so on their profile,
   **When** the card is shown, **Then** it offers a clearly-labelled link out to their channel that
   opens in a new tab.
6. **Given** nobody has been nominated, or the nominated person no longer exists, **When** a visitor
   loads the home page, **Then** no spotlight card and no empty placeholder is shown, and the page
   below it is unaffected.
7. **Given** a visitor loads the home page, **When** the spotlight card is shown, **Then** the page
   has made no more requests for data than it did before this feature existed.

---

### User Story 2 - The author page reads like a profile (Priority: P2)

A visitor follows a contributor's name from a build order, from the sidebar leaderboard or from the
spotlight card, and lands on that person's build orders. Instead of a bare name over a list, they
find a header that introduces the author: face, name, their own description of themselves, what they
have written, how widely it has been read, their standing among contributors, and a link to their
channel if they have one.

**Why this priority**: This is the page every recognition path already leads to, and today it is the
weakest link — a visitor arrives interested in a person and is shown a filter result. It is the
natural landing page for a contributor to share. It is second only because it reaches fewer people
than the home page.

**Independent Test**: Open the author-filtered builds view for any contributor and confirm the
header presents their identity and statistics in the site's established card style. Requires no home
page change.

**Acceptance Scenarios**:

1. **Given** a visitor opens the build orders filtered to one author, **When** the page loads,
   **Then** a header presents that author's avatar, name, number of build orders and total reads.
2. **Given** that author has written a description of themselves, **When** the header is shown,
   **Then** the description is presented as part of the header.
3. **Given** that author is among the site's most-read contributors, **When** the header is shown,
   **Then** their standing is shown as a rank marker, without the page requesting any additional
   data to determine it.
4. **Given** that author is not among the most-read contributors, **When** the header is shown,
   **Then** no rank marker is shown and no placeholder or "unranked" text appears in its place.
5. **Given** that author has stated a video channel, **When** the header is shown, **Then** it links
   out to that channel in a new tab.
6. **Given** the visitor removes the author filter, **When** the results reload, **Then** the header
   disappears and the ordinary filtered list is shown.

---

### User Story 3 - A contributor writes their own introduction (Priority: P3)

A signed-in contributor opens their account page and finds a section describing what other people
see about them. They write a short introduction — a couple of sentences at most — and, if they
publish videos, state their channel. They save, and the text appears on their author page.

**Why this priority**: It is what makes the first two surfaces personal rather than statistical, but
both work without it, and it is the only part of the feature that accepts input from the public. It
ships last so that the display surfaces are proven before user-supplied text reaches them.

**Independent Test**: Sign in, edit the introduction and channel, save, reload the author page and
confirm the values are shown. Confirm that a signed-in user cannot alter anybody else's.

**Acceptance Scenarios**:

1. **Given** a signed-in contributor on their account page, **When** they open the public profile
   section, **Then** they see their current introduction and channel, and are told where these
   appear.
2. **Given** a contributor is writing an introduction, **When** they exceed the permitted length,
   **Then** they are prevented from saving and the remaining allowance is visible as they type.
3. **Given** a contributor saves an introduction, **When** they visit their own author page,
   **Then** the new text is shown there.
4. **Given** a contributor clears their introduction, **When** they save, **Then** neither the
   author page nor the spotlight card shows an empty area where it was.
5. **Given** a contributor states a video channel, **When** they save, **Then** only a channel
   identifier is accepted — an arbitrary web address is rejected with an explanation.
6. **Given** any client attempts to write an over-length introduction directly, bypassing the form,
   **When** the write is attempted, **Then** it is refused by the server.
7. **Given** a signed-in user, **When** they attempt to change another contributor's introduction or
   channel, **Then** the change is refused.
8. **Given** a contributor whose stated channel matches a channel already known to the site as a
   recognised creator, **When** their profile is shown, **Then** it is marked as a recognised
   channel.

---

### Edge Cases

- **The nomination points at nobody.** The value is empty, or names an account that does not exist —
  most likely a mistyped identifier. The home page must show no card and no gap, and the data
  refresh must not fail.
- **A contributor deletes their account.** Their contributor record deliberately survives, so that
  the build orders they wrote keep their attribution. Their *introduction* must not survive with it:
  once the account is gone they can never edit or withdraw it, and it could still be published on
  the home page. Deletion must therefore clear the introduction and the channel while leaving name,
  avatar and counts intact.
- **No introduction written.** The spotlight card and the author header must compose without it —
  not render an empty line or a collapsed block.
- **No avatar chosen.** The existing initials fallback must be used; the card must not show a broken
  image or an empty circle.
- **Introduction is whitespace only.** Treated as absent everywhere, not as a blank line.
- **Introduction is exactly at, and one character over, the limit.** The first saves; the second is
  refused both by the form and by the server.
- **Introduction contains emoji.** The counter and the server must agree on how much of the
  allowance an emoji consumes. A contributor must never see a valid-looking length that the server
  then refuses.
- **The contributor has no public record yet** — an account whose setup never completed. Saving a
  profile must create the record rather than failing with an error the contributor cannot act on.
- **A contributor has a record but no display name.** Neither the spotlight nor the author header
  may render them: a card with a face and no name is broken.
- **Introduction contains line breaks or markup.** It is presented as plain text; no markup is
  interpreted, and it must not break the card layout.
- **A very long display name at phone width.** The card must not overflow horizontally.
- **The channel identifier is malformed** — a bare word, a full video address, a link to another
  site. Rejected on entry.
- **The spotlighted contributor is also in the sidebar leaderboard.** Both appear; they are
  different statements and neither suppresses the other.
- **The home page data cannot be read at all** — for example where the client cannot pass the site's
  bot protection. The spotlight is absent along with the rest of the home page content; this feature
  introduces no new failure mode and no new fallback path.
- **An event announcement is added back** after the spotlight has been running. The spotlight must
  yield without any change being made to it.

## Requirements *(mandatory)*

### Functional Requirements

#### Spotlight selection

- **FR-001**: The site MUST present at most one spotlighted contributor at a time.
- **FR-002**: The spotlighted contributor MUST be chosen by an explicit act of the maintainer,
  recorded in version control, and MUST NOT be derived from any ranking, count or score.
- **FR-003**: The nomination MUST be recorded in a single location, and changing it MUST NOT require
  editing more than that one location.
- **FR-004**: The system MUST tolerate an empty or invalid nomination by presenting no spotlight,
  without error and without a placeholder.
- **FR-005**: The spotlight MUST be able to feature any contributor, including one who does not
  appear in the site's most-read leaderboard.

#### Spotlight presentation

- **FR-006**: The spotlight MUST occupy the same position as the event announcement at the top of
  the home page's main column, and MUST be presented only when no event announcement is being shown.
- **FR-007**: The spotlight MUST present the contributor's avatar, display name, number of build
  orders and total reads.
- **FR-008**: The spotlight MUST present the contributor's self-written introduction when one
  exists, and MUST compose correctly when one does not.
- **FR-009**: The spotlight MUST offer a route to that contributor's build orders.
- **FR-010**: The spotlight MUST offer an outbound link for each profile link the contributor has
  stated, opening in a new tab, and MUST omit any link that is not stated. A contributor with none
  MUST produce no empty link row.
- **FR-011**: The spotlight MUST adopt the visual language already used by the event announcement —
  the same tinted background treatment, the same heading and body text styling, and the same compact
  labels for its statistics — rather than introducing a new one.
- **FR-012**: The spotlight MUST render legibly in both light and dark themes and MUST NOT overflow
  horizontally at phone width.

#### Cost

- **FR-013**: Presenting the spotlight MUST NOT increase the number of data requests made by the
  home page. The spotlighted contributor's details MUST arrive within the home page's existing
  pre-generated data.
- **FR-014**: Determining a contributor's rank on the author page MUST NOT cause an additional data
  request.

#### Author page header

- **FR-015**: The author-filtered builds view MUST present a header introducing the author, shown
  only while a single author is being filtered for.
- **FR-016**: The header MUST present avatar, display name, build order count and total reads, and
  MUST additionally present the introduction and channel link when those exist.
- **FR-017**: The header MUST present the author's rank when they are among the site's most-read
  contributors, and MUST present nothing in its place when they are not.
- **FR-018**: The header MUST adopt the same visual language as the spotlight, so that a visitor
  moving between the two sees one design rather than two.

#### Public profile fields

- **FR-019**: A signed-in contributor MUST be able to write, change and clear a short public
  introduction of themselves from their account page.
- **FR-020**: The introduction MUST be limited to 180 characters, and that limit MUST be enforced by
  the server, not only by the form. The form MUST show the remaining allowance while typing.
- **FR-021**: The introduction MUST be stored and presented as plain text; no markup or embedded
  link may be interpreted or made clickable.
- **FR-022**: A signed-in contributor MUST be able to state up to three profile links — a video
  channel, a streaming channel and a player profile — each by its identifier only. A free-form web
  address MUST be rejected for every one of them. Each link is independently optional.
- **FR-023**: Every outbound profile address MUST be constructed by the site at presentation time
  from the stored identifier, so that no visitor-facing link destination is under the profile
  owner's direct control. A stored value that does not satisfy its identifier pattern MUST produce
  no link at all, rather than a link to an unintended destination.
- **FR-024**: A contributor MUST be able to change only their own profile fields. The restriction
  MUST be enforced by the server.
- **FR-025**: The profile editing section MUST state plainly where the values appear, so that a
  contributor knows the introduction is public before writing it.
- **FR-026**: Where a stated video channel matches one the site already recognises as a featured
  creator channel, the profile MUST be marked as a recognised channel. This applies to the video
  channel only; the site holds no comparable list for the other destinations.
- **FR-029**: When an account is deleted, the introduction and every profile link MUST be removed,
  while the display name, avatar and contribution counts MUST survive so that published build
  orders keep their attribution.
- **FR-030**: The remaining allowance shown while typing MUST agree with the limit the server
  enforces, for every input including emoji. A contributor MUST NOT be able to reach an apparently
  valid length that is then refused.
- **FR-031**: A contributor whose public record does not yet exist MUST still be able to save a
  profile; the act of saving MUST bring the record into existence rather than failing.
- **FR-032**: No surface MAY present a contributor who has no display name.

#### Deliberate non-changes

- **FR-027**: The existing most-read contributors list MUST remain unchanged in content and
  behaviour, and MUST NOT present introductions.
- **FR-028**: The feature MUST NOT introduce an approval, reporting or moderation workflow. Control
  over what reaches the home page is exercised through the choice of who is spotlighted.

### Key Entities

- **Contributor**: an account that has published at least one build order. Already carries a display
  name, an avatar, a build order count and a total read count. This feature adds two optional,
  publicly readable, owner-writable fields: a short **introduction** and a **video channel
  identifier**. Both must live where they are publicly readable — the site's private per-user record
  is readable only by its owner and therefore cannot hold anything meant to be shown to visitors.
- **Spotlight nomination**: the identity of the single contributor currently being featured. Held
  alongside the routine that pre-generates the home page's data, so that the featured person's
  details can be gathered at generation time rather than at page load.
- **Home page snapshot**: the existing pre-generated document that supplies the home page in one
  read. Gains one additional section holding the spotlighted contributor's details, gathered at
  generation time whether or not that person appears in the leaderboard section.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The home page makes exactly the same number of data requests after this feature as
  before it — one — regardless of who is spotlighted or whether they are among the most-read
  contributors.
- **SC-002**: The author page makes no data request that it did not make before, including for the
  rank marker.
- **SC-003**: A visitor arriving on the home page can identify the spotlighted contributor by name
  and reach their build orders without scrolling, at both phone and desktop width.
- **SC-004**: Changing who is spotlighted requires editing exactly one value in one file.
- **SC-005**: A contributor can write and publish their introduction in under two minutes from
  opening their account page, without leaving it.
- **SC-006**: No page ever presents both an event announcement and a spotlight card.
- **SC-007**: An over-length introduction cannot be stored by any client, including one that does
  not use the site's form.
- **SC-008**: A visitor-facing outbound profile link can never point anywhere other than the site it
  names, for any value a contributor is able to save — including a value that reached storage by
  some route other than the form.
- **SC-009**: Every surface introduced by this feature composes correctly for a contributor with no
  introduction, no links and no avatar — no empty blocks, no broken images, no placeholder text.
  A contributor with no display name is not presented at all.
- **SC-010**: The spotlight and the author page header are visually recognisable as the same design,
  and as belonging to the same family as the existing event announcement.

## Assumptions

- **Backend routine deployment is manual.** Scheduled backend work is deployed by hand; only the
  frontend deploys automatically on push. Changing the spotlight therefore involves a commit and a
  manual deploy.
- **The spotlight refreshes on the existing six-hourly cadence.** A newly nominated contributor
  appears at the next scheduled regeneration, not immediately. This is acceptable for a rotation
  measured in weeks and is not treated as a defect.
- **Rotation is at the maintainer's discretion.** There is no schedule, no nomination process and no
  queue. "Contributor of the month" is a habit, not a mechanism.
- **The spotlighted person is not notified by the site.** Telling them is a courtesy performed
  outside the product. Nothing shown about them is private: the introduction is written by them for
  publication, and the statistics are already public.
- **Being spotlighted does not remove someone from the leaderboard.** A contributor may legitimately
  appear in both places at once.
- **Both a channel handle and a channel identifier are accepted**, since contributors will know
  their channel by one or the other, and both can be turned into an address by the site.
- **The visual treatment is the tinted-wash card, not a full-bleed image.** A full-bleed treatment
  would need a representative image per contributor, which would mean a further profile field. That
  field is explicitly not being added.
- **English only**, matching the rest of the site.
- **The existing avatar mechanism is reused unchanged.** This feature adds no new image upload,
  cropping or hosting.

## Out of Scope

- Automatically selecting the spotlight from any ranking or score.
- Any moderation, approval, flagging or reporting workflow for profile text.
- Featuring more than one contributor at a time, in a carousel or otherwise.
- Social links beyond the three named in FR-022 — no Discord, no X, no personal site.
- A "favourite civilisation" or any other new profile field.
- Time-windowed or decaying contributor rankings, and any change to how the existing leaderboard is
  computed.
- Inferring a contributor's channel from the videos attached to their build orders. A probable match
  is not good enough when the result is presenting someone else's channel as a person's own.
- Notifying, emailing or badging the spotlighted contributor inside the product.
