# Feature Specification: Community Funding Transparency

**Feature Branch**: `036-community-funding-transparency`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "Community funding transparency and supporter recognition. Make the running costs of the site visible instead of making a generic donation ask, and give supporters manual, visible recognition. (1) Cost transparency line in footer, About and account page, maintained by hand. (2) Supporter badge assigned manually, rendered wherever an author is displayed. (3) Supporters wall on About. (4) Ko-fi ask offering monthly (€2) and annual (€20). (5) A quiet supporter line after a focus-mode session ends. Non-goals: no Stripe, no paid tiers, no feature gating, no automated entitlement layer, no capping of existing free functionality."

## Context

The site runs on roughly €20/month of hosting, domain and cloud costs, paid personally by the
maintainer. It serves thousands of active players and around 4,000 community-written build orders.
The existing ask is a single "Donate" button in the footer and a paragraph on the About page. It has
never covered costs.

At €2/month, covering the running costs requires roughly **thirteen recurring supporters** — a
number reachable through a better ask alone. This feature therefore deliberately does **not**
monetise capability. It replaces an open-ended plea with a finite, believable, nearly-reached goal,
and it gives the people who do contribute something visible in return.

The second problem this addresses is quieter: the maintainer and the build-order authors receive
almost no signal that the work is valued. A visible coverage figure turns invisible usage into
something both can see.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A visitor sees what the site costs and how far the community has got (Priority: P1)

A player lands on a build order page, scrolls to the bottom, and instead of a generic "Donate"
button reads a concrete line: what the site costs to run this month, how much of that the community
has already covered, and by how many people. The gap is small and specific, which makes supporting
feel like finishing something rather than filling a void. Choosing to support presents two clear
options — €2/month or €20/year — with the annual option marked as the better value.

**Why this priority**: This is the entire hypothesis of the feature and it stands alone. Shipped by
itself, with no badge and no wall, it already replaces the failed ask and delivers the appreciation
signal. Everything else is amplification.

**Independent Test**: Visit the site signed out, view the footer, the About page and (signed in) the
account page. Confirm each shows the current month's cost, the covered amount, the supporter count,
and a support action offering monthly and annual options. No other part of the feature is required.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor on any page, **When** they scroll to the footer, **Then** they see
   a single line stating the approximate monthly running cost, the amount covered this month, and
   the number of supporters who covered it.
2. **Given** the funding status shows partial coverage, **When** the visitor reads the line, **Then**
   the remaining gap is expressed as a concrete shortfall, not as an open-ended request.
3. **Given** the funding status shows full coverage, **When** the visitor reads the line, **Then** it
   states that the month is covered and thanks the supporters, and does not present a shortfall.
4. **Given** a visitor decides to support, **When** they activate the support action, **Then** they
   are offered a monthly option and an annual option, with monthly presented first and annual
   marked as the better value.
5. **Given** a signed-in user on their account page, **When** the page loads, **Then** the funding
   status appears exactly once on that page.
6. **Given** the About page, **When** it loads, **Then** the funding status replaces or accompanies
   the existing donation paragraph rather than duplicating the same ask twice.

---

### User Story 2 - The maintainer keeps the supporter list current (Priority: P2)

Once a month the maintainer opens the payment provider, sees who has joined and who has lapsed, and
adds or removes those names from one list — each entry being a name and which arrangement they are
on. That is the entire routine, and it is a transcription job, not a matching job: the names are
copied as the provider shows them, with no need to work out who each person is on the site. The
funding line updates itself, because the covered amount and the supporter count are read from that
list — there is no second number to remember and nothing that can silently go stale. The stated
running cost is a fixed value in the codebase, touched once or twice a year when the actual bill
moves.

**Why this priority**: Nothing in User Story 1 or 3 can display truthful numbers without this, and a
funding line that quietly goes stale is worse than no funding line at all — it converts a
credibility asset into a liability. Deriving coverage from the list is what makes staleness
structurally impossible rather than a discipline problem. Keeping the list free of any site-account
reference is what keeps the monthly routine to minutes.

**Independent Test**: As the maintainer, add a name to the supporter list and confirm the funding
line's covered amount and count rise, and the name appears on the wall. Remove it and confirm both
reverse. Do the whole thing without touching a user account.

**Acceptance Scenarios**:

1. **Given** the maintainer adds a supporter to the list, **When** any visitor views the funding
   status, **Then** the covered amount and supporter count include that person, with no further
   action by the maintainer.
2. **Given** the maintainer adds a supporter to the list, **When** they do so, **Then** they are not
   required to identify or possess a corresponding site account.
3. **Given** the maintainer removes a supporter from the list, **When** the funding status and
   supporters list are viewed again, **Then** neither counts nor names that person.
4. **Given** a supporter on an annual arrangement, **When** they are counted towards coverage,
   **Then** their contribution is reflected at the appropriate monthly rate rather than as a full
   monthly contribution.
5. **Given** only the maintainer holds administrative rights, **When** any non-administrator attempts
   to change the supporter list, **Then** the attempt is refused on the server, not merely hidden in
   the interface.
6. **Given** the actual running cost changes, **When** the maintainer updates the fixed cost value
   and deploys, **Then** every placement reflects the new cost.

---

### User Story 3 - A supporter sees their name on the supporters list (Priority: P2)

Someone who supports the site finds their name on a supporters list on the About page, exactly as
they gave it to the payment provider. Nothing about this requires them to hold a site account, to
be signed in, or to have any conversation with the maintainer — the name comes straight off the
payment dashboard.

**Why this priority**: This is the return offered for €2/month, and it is what makes supporting feel
like joining something rather than paying a bill. It ranks below the funding line because the
funding line converts on its own, but it needs no identity mapping and so carries none of the
maintenance cost that the badge does.

**Independent Test**: Add a name to the supporter list and confirm it appears on the About page and
is counted in the funding status. Remove it and confirm both reverse. No site account is involved at
any point.

**Acceptance Scenarios**:

1. **Given** the About page, **When** any visitor reads it, **Then** the current supporters are
   listed by the name they supported under.
2. **Given** a supporter who has no site account at all, **When** they are added to the list,
   **Then** they appear on the wall and count towards coverage exactly like any other supporter.
3. **Given** a supporter who prefers not to be named publicly, **When** they are recorded as
   anonymous, **Then** their name is not shown while their contribution is still counted in the
   total.
4. **Given** a supporter whose provider name is blank or unusable, **When** the list renders,
   **Then** no blank entry is shown and the count remains correct.

---

### User Story 4 - A supporter who wants a badge gets one (Priority: P3)

A supporter who also writes build orders would like the recognition to show where people actually
see them — next to their name on their builds and comments. Because the payment provider has no way
to know which site account is theirs, they tell the site themselves: they add their username when
supporting, and the maintainer links the two. Anyone who does not volunteer a username simply
appears on the wall like everyone else, and nothing is missing.

**Why this priority**: This is the only part of the feature that requires linking a payment identity
to a site account, and there is no automatic way to do it — provider display names do not
correspond to site usernames and no lookup exists. Making it opt-in and best-effort confines that
cost to the people who actively want it, instead of turning every new supporter into an
administrative errand. It is also the only part that can be dropped entirely without weakening
anything else.

**Independent Test**: Link a supporter to a site account and confirm the marker appears on every
surface naming that user, visible signed out. Confirm a supporter with no linked account is
unaffected and still appears on the wall.

**Acceptance Scenarios**:

1. **Given** a supporter has volunteered their site username when supporting, **When** the
   maintainer links them, **Then** a supporter marker is shown alongside that user's name on build
   order list cards, the build order page, comments and discussions, the author page header, and the
   contributors listing.
2. **Given** any visitor, signed in or not, **When** they view a surface naming a linked supporter,
   **Then** the marker is visible to them.
3. **Given** a visitor who does not know what the marker means, **When** they hover or tap it,
   **Then** they are told it identifies someone helping cover the running costs, with a way to do
   the same.
4. **Given** a supporter who never volunteered a username, **When** any surface names them,
   **Then** no marker is shown, and their presence on the supporters list and in the coverage total
   is unaffected.
5. **Given** a linked supporter, **When** they use any part of the site, **Then** every feature
   behaves identically to how it behaves for a non-supporter.
6. **Given** a linked supporter deletes their account, **When** the deletion completes, **Then** no
   supporter marker survives anywhere.
7. **Given** the badge capability is never built or is later removed, **When** the rest of the
   feature runs, **Then** the funding status and supporters list are unaffected.

---

### User Story 5 - The ask reaches someone at the moment the value landed (Priority: P3)

A player has just run a build order through focus mode — followed it step by step, timers and all,
through a game. As the session ends, a single quiet line acknowledges that and mentions what keeps
the site running. It appears at most rarely, it is dismissible, and it never appears for someone
already supporting or during a session.

**Why this priority**: This is the highest-intent moment on the whole site, and a line here should
outperform the footer substantially. It ranks last because it carries the only real risk in the
feature — intruding on the experience that makes people love the site — and because it is worthless
until the funding line exists to point at.

**Independent Test**: Complete a focus-mode session as a non-supporter and confirm the line appears
once, is dismissible, and does not reappear within the suppression period. Repeat as a supporter and
confirm it never appears.

**Acceptance Scenarios**:

1. **Given** a non-supporting user who has meaningfully progressed through a focus-mode session,
   **When** the session ends, **Then** a single unobtrusive supporter line is shown.
2. **Given** the same user, **When** they end another focus-mode session within the suppression
   period, **Then** the line is not shown again.
3. **Given** a user opens focus mode and closes it almost immediately, **When** the session ends,
   **Then** no line is shown.
4. **Given** a user linked as a supporter, **When** any focus-mode session ends, **Then** the line is
   never shown.
5. **Given** the line is displayed, **When** the user dismisses it, **Then** it closes immediately
   and nothing about the build order or the session is affected.
6. **Given** a focus-mode session running in a detached/floating window, **When** that session ends,
   **Then** the line does not appear in a place the user cannot see or dismiss.

---

### Edge Cases

- **Drifted cost.** The hosting bill moves and the hard-wired cost figure no longer matches it. The
  figure is stated as an approximation, so small drift is tolerable; the plan should note that this
  value needs a look whenever infrastructure changes.
- **Over-coverage.** Supporters exceed the monthly cost. The line must read as celebration and
  surplus, never as a bar stuck at 100% or a number that looks like an error.
- **Zero supporters.** At launch the covered amount is zero. The line must still read as an
  invitation rather than as a failure notice.
- **Prerendered pages.** Build order pages are prerendered for search engines. A funding figure or
  supporter marker baked into prerendered output would freeze at build time; the displayed values
  must be correct for a live visitor regardless of when the page was prerendered.
- **Payment provider blocked.** Ad blockers and corporate networks may block the payment provider's
  domain. The support action must degrade to a plain, working link rather than a dead button.
- **Deleted supporter account.** Covered by account-deletion cleanup: no orphaned link or marker may
  survive. The person's supporter list entry is unaffected — they are still paying, and deleting a
  site account is not a cancellation.
- **Supporter with no usable name.** A supporter who supported anonymously or under a blank name
  must not appear as an empty entry on the wall, and must still be counted.
- **Name collision.** Two supporters share a provider display name. The wall must not silently merge
  them or lose one from the count.
- **A supporter who is also an author but never linked.** They see no badge on their own build
  orders. This is expected and acceptable; the wall still names them, and nothing prompts the
  maintainer to chase them.
- **Currency and locale.** Figures are stated in one currency; visitors in other regions must not be
  shown a converted or misleading amount.
- **Very small screens.** The funding line must not push the footer into overflow on a phone.
- **Lapsed supporter.** Someone stops their recurring contribution. Until the maintainer's next
  monthly pass, they are still listed and counted; the design must tolerate this lag without
  appearing dishonest.

## Requirements *(mandatory)*

### Functional Requirements

**Funding status display**

- **FR-001**: The system MUST display a funding status consisting of the approximate monthly running
  cost, the amount currently covered, and the number of people covering it.
- **FR-001a**: The approximate monthly running cost MUST be a fixed, hand-set value; it is not
  derived from any billing source.
- **FR-001b**: The covered amount and supporter count MUST be derived from the maintained supporter
  list, so that no separate figure requires maintenance.
- **FR-001c**: The derived covered amount MUST reflect what actually arrives after payment fees, and
  MUST account for supporters on an annual arrangement contributing at a different monthly rate than
  those on a monthly one.
- **FR-002**: The funding status MUST be visible to signed-out visitors.
- **FR-003**: The funding status MUST appear in the site footer, on the About page, and exactly once
  on the signed-in account page.
- **FR-004**: The funding status MUST read as a current statement, without claiming precision the
  hand-set cost figure does not have.
- **FR-005**: When coverage is partial, the system MUST express the remaining amount as a concrete
  shortfall.
- **FR-006**: When coverage meets or exceeds the stated cost, the system MUST present a covered/
  thank-you state rather than a shortfall.
- **FR-007**: The funding status MUST NOT be duplicated more than once per page.
- **FR-008**: The funding status MUST remain truthful without any recurring maintenance step of its
  own — editing the supporter list MUST be the only action that changes it.

**The ask**

- **FR-009**: The system MUST offer a support action adjacent to every funding status placement.
- **FR-010**: The support action MUST present a monthly option and an annual option, with the
  monthly option first and the annual option identified as better value.
- **FR-011**: The support action MUST continue to function as an ordinary outbound link if any
  embedded or scripted payment widget fails to load.
- **FR-012**: The system MUST NOT collect, process or store payment details itself.

**Supporter recognition**

- **FR-013**: The system MUST maintain a list of current supporters, each entry carrying the name
  they supported under and which arrangement they are on.
- **FR-013a**: A supporter list entry MUST NOT require a corresponding site account, and MUST NOT
  require the maintainer to determine which site account, if any, belongs to that person.
- **FR-014**: The system MUST display the current supporters on the About page by the name they
  supported under.
- **FR-015**: A supporter MUST be able to be recorded as anonymous, so that their contribution counts
  towards coverage without their name being displayed.
- **FR-016**: A supporter list entry with a missing or unusable name MUST NOT render as a blank
  entry, and MUST still be counted.
- **FR-017**: Removing an entry from the supporter list MUST remove it from the wall and from the
  coverage total.
- **FR-018**: Supporter status MUST NOT alter the behaviour, availability or limits of any feature.

**Supporter badge (optional, opt-in)**

- **FR-019**: The system MUST allow a supporter to be linked, by an administrator, to a site account,
  and MUST treat this link as optional — the supporter list, the funding status and the wall MUST
  all function fully for supporters with no link.
- **FR-019a**: The system MUST NOT require the maintainer to solicit an account identity from any
  supporter; linking MUST only occur where a supporter has volunteered their site username of their
  own accord.
- **FR-020**: A supporter marker MUST be rendered alongside a linked user's name on every surface
  where the site names a user: build order list cards, the build order page, comments and
  discussions, the author page header, and the contributors listing.
- **FR-021**: The supporter marker MUST be visible to all visitors, including signed-out visitors,
  not only to the linked user themselves.
- **FR-021a**: The supporter marker MUST carry an explanation of what it means and a route to
  supporting.
- **FR-021b**: Removing a link MUST remove the marker everywhere, and MUST NOT remove the person
  from the supporter list or the coverage total.
- **FR-021c**: Deleting a user account MUST remove any supporter link and marker for that account,
  and MUST NOT remove that person's supporter list entry or alter the coverage total.
- **FR-021d**: The badge capability MUST be removable in its entirety without affecting the funding
  status, the ask, the supporters wall, or the maintainer's monthly routine.

**Administration**

- **FR-022**: Only an administrator MUST be able to change the supporter list or create and remove
  account links, and this MUST be enforced on the server, not only concealed in the interface.
- **FR-023**: The stated monthly running cost and the per-arrangement contribution rates MUST be
  deploy-time values in the repository, changed only by a code change. They are expected to change
  rarely — at most once or twice a year.
- **FR-024**: The maintainer's recurring routine MUST consist solely of transcribing names and
  arrangements from the payment provider into the supporter list. No separate funding figure may
  require periodic updating, and no identity matching may be required to complete it.

**Contextual ask after focus mode**

- **FR-025**: The system MUST show a single unobtrusive supporter line when a focus-mode session
  ends, provided the user meaningfully progressed through the build order during that session.
- **FR-026**: The line MUST NOT be shown to users linked as supporters. Supporters who never
  volunteered an account cannot be recognised and may see it; the line's tone MUST therefore be
  acceptable to someone who already supports.
- **FR-027**: The line MUST NOT be shown more than once per suppression period per person.
- **FR-028**: The line MUST be dismissible and MUST NOT block or alter the build order, the session
  or any navigation.
- **FR-029**: The line MUST NOT appear inside a detached/floating focus-mode window where the user
  may be unable to see or dismiss it.
- **FR-030**: The system MUST NOT interrupt an in-progress focus-mode session with the ask.

**Non-goals (explicitly out of scope)**

- **FR-031**: The system MUST NOT gate any existing capability behind supporter status — focus mode,
  the age timeline, economy lines, favorites, drafts, import/export and every other current feature
  remain fully available to all users, signed in or not.
- **FR-032**: The system MUST NOT introduce paid tiers, automated entitlement checks, or any
  server-side integration with a payment provider.
- **FR-033**: The system MUST NOT reduce any existing limit or allowance.

### Key Entities

- **Funding Status**: The publicly displayed state of community funding. Its stated monthly running
  cost and its per-arrangement contribution rates are fixed values in the codebase; its covered
  amount and supporter count are derived from the current Supporter Marks. Never derived from a
  payment API, and never separately maintained.
- **Supporter List**: The maintained set of current supporters. Each entry carries the name the
  person supported under, which arrangement they are on (monthly or annual), and whether they wish
  to be named publicly. It holds no reference to a site account. It is the sole source of both the
  coverage total and the supporters wall, and the only thing the maintainer edits month to month.
- **Supporter Link**: An optional association between a supporter list entry and a site account,
  created only when that person has volunteered their username. Readable by anyone rendering that
  user's name; writable only by an administrator. Drives the badge and nothing else. Confers no
  capability, and its absence costs the supporter only the badge.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor shown only the footer can state, within 10 seconds, roughly what
  the site costs to run and whether that cost is currently covered.
- **SC-002**: The site reaches at least 13 recurring supporters — full coverage of stated running
  costs — within 6 months of launch.
- **SC-003**: At least 10 recurring supporters within 3 months of launch.
- **SC-004**: Click-through on the support action is at least 5× the pre-change footer baseline
  within one month.
- **SC-005**: For a linked supporter, the marker is visible to signed-out visitors on 100% of the
  surfaces where the site names a user.
- **SC-005a**: 100% of supporters appear on the wall and in the coverage total without any account
  linking having taken place.
- **SC-006**: The maintainer's monthly routine consists of transcribing names and arrangements only,
  completes in under 5 minutes, and requires contacting no supporter and identifying no account.
- **SC-007**: Zero features available for free before the change require supporter status after it,
  verified by walking the full feature list signed out.
- **SC-008**: Focus-mode session completion rate does not measurably decline after the contextual
  ask is introduced.
- **SC-009**: The contextual ask is seen at most once per suppression period by any individual, and
  never by a supporter.
- **SC-010**: No support request or public complaint attributes a loss of previously free
  functionality to this change.

## Assumptions

- **The number to beat is small.** Full coverage is roughly thirteen supporters at €2/month, after
  payment fees on small recurring charges. The whole design is sized for that, not for scale.
- **Manual administration is sufficient and preferred.** At the expected volume, hand-assignment is
  a few minutes a month and doubles as an opportunity for the maintainer to thank people
  personally. No automation is warranted, and none is specified.
- **Payment happens entirely off-site.** The existing Ko-fi presence handles collection; the site
  links out and never sees a payment. Monthly €2 and annual €20 are the two products, configured on
  the provider's side.
- **Figures are approximate and stated as such.** "About €20/month" is honest and does not require
  the maintainer to reconcile a cloud bill to the cent.
- **Coverage is derived, not maintained.** Because supporter marks must exist anyway to render
  badges, the covered amount and supporter count are read from them. This is what removes the
  recurring figure-update chore and makes a stale funding line structurally impossible rather than a
  matter of remembering.
- **The payment provider cannot supply live state, and this was checked.** Ko-fi offers outgoing
  webhooks on payment events but no queryable API, and its documentation states that a webhook
  cannot report that a membership has *ended*. An automated pipeline would therefore learn every
  join and no departure, producing a supporter count that only ever rises — less truthful than the
  manual list, while appearing more authoritative for being "live". Manual marking is chosen on
  accuracy grounds, not merely for simplicity. A webhook may later be added purely as a
  *notification* that someone joined, which does not feed the funding status and is out of scope
  here.
- **The actual constants are not yet supplied.** The stated monthly running cost and the net
  per-supporter contribution rates for the monthly and annual arrangements are placeholders until
  the maintainer provides real numbers. They are needed before launch, not before planning or
  implementation.
- **Being named on the wall is opt-out; the badge is opt-in.** These differ deliberately. The wall
  uses the name the person already chose at the payment provider, so listing them costs nobody
  anything and being named is the perk. The badge needs a site account nobody can determine on their
  behalf, so it only happens when the supporter volunteers it.
- **There is no automatic mapping from payment identity to site account, and there never will be.**
  Payment display names do not correspond to site usernames, no lookup exists, and the provider
  offers no API to query. Any design that needs this mapping for every supporter converts each new
  supporter into an administrative errand and a conversation the maintainer has to start — which
  scales with precisely the number the feature is trying to grow. The mapping is therefore confined
  to the badge, made optional, and driven by the supporter rather than the maintainer.
- **Supporters are expected to volunteer their username at the point of payment**, via the message
  or note field the payment provider already offers, prompted by the wording on the support page. No
  follow-up contact is assumed, and the feature is designed to be fine when nobody does it.
- **"Meaningful progress" in focus mode** is assumed to be advancing through a non-trivial portion
  of the build order rather than reaching the final step, since most sessions end when the game
  does, not when the build order does. The exact threshold is a tuning decision for the plan.
- **The suppression period for the contextual ask** is assumed to be on the order of a month per
  person, stored locally, so that the ask stays rare without requiring an account.
- **The supporter mark must be publicly readable.** Because the marker must render for signed-out
  visitors on other people's build orders, supporter standing cannot live solely in a private
  account token readable only by its owner — unlike the existing administrator right, which only
  ever needs to be checked for the acting user. The plan must account for this difference.
- **Existing administrator rights are reused** for who may perform the monthly update; no new role
  is introduced.
- **The supporters wall lives on the About page only** for the first release. Placement on the home
  page is deferred until there are enough supporters for the list to look like a community rather
  than an oversight.
- **Account deletion cleanup already exists** and is extended, not rebuilt, to cover the supporter
  mark and wall entry.
