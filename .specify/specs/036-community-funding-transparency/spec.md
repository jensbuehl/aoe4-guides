# Feature Specification: Community Funding Transparency

**Feature Branch**: `036-community-funding-transparency`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "Community funding transparency and supporter recognition. Make the running costs of the site visible instead of making a generic donation ask, and give supporters manual, visible recognition. (1) Cost transparency line in footer, About and account page, maintained by hand. (2) Supporter badge assigned manually, rendered wherever an author is displayed. (3) Supporters wall on About. (4) Ko-fi ask offering monthly (€2) and annual (€20). (5) A quiet supporter line after a focus-mode session ends. Non-goals: no Stripe, no paid tiers, no feature gating, no automated entitlement layer, no capping of existing free functionality."

## Context

The site runs on about **€180 a year** of hosting, domain and cloud costs, paid personally by the
maintainer. It serves thousands of active players and around 4,000 community-written build orders.
The existing ask is a "Donate" button in the footer, a second one in the home sidebar's news card,
and a paragraph on the About page — three generic buttons, no number attached to any of them. It has
never covered costs. All three are replaced rather than supplemented: the point is one ask with a
figure on it, not four asks.

Covering a year is a two-figure ask spread over a handful of people — a number reachable through a
better ask alone.

The goal is stated **per calendar year**, not per month, for two reasons. It matches how the money
actually arrives: sporadic one-off tips, not a subscription book, and a €5 coffee genuinely helps
pay the year it was given in, where against a monthly target it would count for nothing. And it
matches how the payment provider already presents goals, so the site and the Ko-fi page tell one
story rather than two.

This feature therefore deliberately does **not**
monetise capability. It replaces an open-ended plea with a finite, believable, nearly-reached goal,
and it gives the people who do contribute something visible in return.

The second problem this addresses is quieter: the maintainer and the build-order authors receive
almost no signal that the work is valued. A visible coverage figure turns invisible usage into
something both can see.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A visitor sees what the site costs and how far the community has got (Priority: P1)

A player lands on a build order page, scrolls to the bottom, and instead of a generic "Donate"
button reads a concrete line: what the site costs to run this year, how much of that the community
has already covered, and by how many people. The gap is small and specific, which makes supporting
feel like finishing something rather than filling a void. The amounts on offer are stated before the
click, and one control leads to the provider's page to choose between them.

**Why this priority**: This is the entire hypothesis of the feature and it stands alone. Shipped by
itself, with no badge and no wall, it already replaces the failed ask and delivers the appreciation
signal. Everything else is amplification.

**Independent Test**: Visit the site signed out, view the home page, the About page, the footer of
any other page, and (signed in) the account page. Confirm each shows the running cost, the covered
amount, the supporter count, and a support action stating the available amounts — and that no page
shows it twice. No other part of the feature is required.

**Acceptance Scenarios**:

1. **Given** a visitor on the home page, **When** the page loads, **Then** the funding status is
   presented in the sidebar, above the fold on desktop and in the mobile card stack on a phone,
   without their having to scroll to the footer.
2. **Given** a signed-out visitor on a page with no funding block of its own, **When** they scroll
   to the footer, **Then** they see a single line naming the year, the approximate running cost for
   it, the amount contributed so far, and the number of people who contributed.
3. **Given** any page that presents its own funding block, **When** it loads, **Then** the footer
   does not also present one, and the page shows the funding status exactly once in total.
4. **Given** the funding status shows partial coverage, **When** the visitor reads the line, **Then**
   the remaining gap is expressed as a concrete shortfall, not as an open-ended request.
5. **Given** the funding status shows full coverage, **When** the visitor reads the line, **Then** it
   states that the year is paid for and thanks the supporters, and does not present a shortfall.
6. **Given** a visitor decides to support, **When** they read the funding status, **Then** the
   available amounts and whether they recur are stated before they click, and a single control
   takes them to the provider's page to choose.
7. **Given** a signed-in user on their account page, **When** the page loads, **Then** the funding
   status appears exactly once on that page.
8. **Given** the About page, **When** it loads, **Then** the funding status replaces the existing
   donation paragraph and its button rather than sitting alongside them.
9. **Given** a page that presents the funding status also carried a generic "Donate" control before
   this change, **When** it loads, **Then** that control is gone and only the funding status remains.

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
4. **Given** any supporter, **When** the site is inspected by any means available to a visitor,
   including reading the application's own bundled code, **Then** no amount attributable to that
   individual can be found.
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
- **Over-coverage.** Contributions exceed the year's cost. The line must read as celebration and
  surplus, never as a bar stuck at 100% or a number that looks like an error.
- **A long thank-you list above a small current total.** This is the actual launch state: seventeen
  people have contributed over the project's life, but the current year's total starts low. The two
  must read coherently side by side — gratitude for everyone, an honest and inviting figure for this
  year — never a page that looks broken or ungrateful.
- **Year rollover.** On 1 January the yearly total would reset to zero. The reset is deliberate and
  manual (FR-013c), the year is always named (FR-004), and the previous year's supporters move to
  the earlier-years list rather than vanishing (FR-013d), so the page never appears to have lost
  something.
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

- **FR-001**: The system MUST display a funding status consisting of the approximate running cost
  **for a calendar year**, the amount contributed towards that year so far, and the number of people
  who contributed it.
- **FR-001a**: The stated yearly running cost and the year it refers to MUST be fixed, hand-set
  values; neither is derived from any billing source.
- **FR-001b**: The supporter count MUST be derived from the maintained supporter list, so that it
  can never disagree with the names shown.
- **FR-001c**: The covered amount MUST be a single hand-set total for the stated year, net of
  payment fees. It MUST be updated in the same edit as the supporter list, never on a separate
  cadence.
- **FR-001e**: While the number of current-year supporters is below a small threshold, the system
  MUST NOT publish the supporter count, and MUST NOT group the supporters list by year. Publishing a
  total, a count and the names together stops the total being an aggregate: with two supporters
  listed, each can subtract their own contribution and know the other's exactly, and with one the
  total *is* that person's donation. It matters most for anyone who contributed privately — they are
  in the total but not on the wall, so the arithmetic would expose what they gave despite their
  having asked not to be named.
- **FR-001f**: The suppression MUST fall on the count rather than on the money. The covered amount
  and the progress it represents are the mechanism this feature exists to provide; the count is
  social proof and is the cheaper thing to lose. The count is also recoverable from the length of
  the published names list, which is why the year grouping has to go with it, while the covered
  total is not recoverable from anything else on the site.
- **FR-001d**: The system MUST NOT hold any individual's contribution amount **anywhere in material
  delivered to the browser**, whether rendered or not. Not displaying a value is not the same as not
  shipping it: configuration bundled with the application is readable by anyone, so a per-person
  amount would be public the moment it was stored, regardless of what the page chooses to draw. The
  per-person record stays at the payment provider, which already holds it.
- **FR-002**: The funding status MUST be visible to signed-out visitors.
- **FR-003**: The funding status MUST appear in the home page sidebar, on the About page, on the
  signed-in account page, and in the site footer.
- **FR-003a**: The home page placement MUST appear for both the desktop sidebar and the mobile
  layout, which are separate render positions rather than one responsive element.
- **FR-003b**: The footer placement is the fallback: it MUST carry the funding status on every page
  that does not present its own, so that no page is left without one.
- **FR-004**: The funding status MUST name the year it refers to, so that a reader can see at a
  glance which period is being counted.
- **FR-005**: When coverage is partial, the system MUST express the remaining amount as a concrete
  shortfall.
- **FR-006**: When coverage meets or exceeds the stated cost, the system MUST present a covered/
  thank-you state rather than a shortfall.
- **FR-007**: A page MUST present the funding status exactly once. A page carrying its own funding
  block MUST suppress the footer's, so that the two never appear together.
- **FR-007a**: A page presenting the funding status MUST NOT also carry a second, generic donation
  ask. Any pre-existing "Donate" control on such a page MUST be removed rather than left alongside
  it — a bare ask next to a specific one makes the specific one read as decoration.
- **FR-008**: The funding status MUST have no maintenance cadence of its own. The covered total and
  the supporter list MUST change together, in one edit, triggered by the same event — so the figure
  can be behind reality but can never be inconsistent with the names beside it.
- **FR-008a**: The stored covered total MUST sit adjacent to the supporter list and carry a note
  stating that the two are updated together, since their consistency is a convention rather than
  something the system can enforce.

**The ask**

- **FR-009**: The system MUST offer a support action adjacent to every funding status placement.
- **FR-010**: The support action MUST be a single control leading to the payment provider's own
  page, and MUST state the available amounts and whether they can be one-off or recurring before
  the click. Ko-fi offers €2, €5 and €10, each as a one-off or monthly, all on one page with no
  deep link into a particular choice — so two or three buttons here would pre-empt a decision the
  destination asks better, and would break the moment the tiers changed again.
- **FR-011**: The support action MUST be an ordinary outbound link, rendered by the site's own
  components in the site's own visual language.
- **FR-011a**: The system MUST NOT embed the payment provider's floating action button, overlay
  widget, or any other third-party script that presents an ask. Such a widget would be a
  context-free donation button persisting on every page — the exact thing this feature removes three
  of — and it cannot opt out of the pages that matter most: it would float over build orders and
  over focus mode, and sit on top of the funding status on the three pages that carry their own. It
  would also fail closed behind an ad blocker, where a plain link does not, and load a third-party
  bundle on every page against the standard already set by the no-cookie, lazily-loaded video embed
  in the home sidebar.
- **FR-012**: The system MUST NOT collect, process or store payment details itself.

**Supporter recognition**

- **FR-013**: The system MUST maintain a list of supporters for the stated year, one entry per
  person, carrying the name they supported under and nothing about what they gave.
- **FR-013a**: A supporter who cannot be named MUST still occupy an entry, so that the supporter
  count stays accurate without revealing who they are.
- **FR-013b**: The system MUST additionally maintain a list of people who contributed in **earlier**
  years, carrying names only. They are thanked but contribute nothing to the current year's total.
- **FR-013c**: Rolling over to a new year MUST be a deliberate act by the maintainer, never an
  automatic consequence of the date changing. A goal that silently empties itself at midnight on 1
  January looks like a defect and erases the visible result of a year's support without anyone
  deciding to.
- **FR-013d**: On rollover, the previous year's supporters MUST move to the earlier-years list
  rather than disappearing, so that the wall only ever grows.
- **FR-013a**: A supporter list entry MUST NOT require a corresponding site account, and MUST NOT
  require the maintainer to determine which site account, if any, belongs to that person.
- **FR-014**: The system MUST display supporters on the About page by the name they supported under,
  in two sections: those who have contributed during the stated year, and those who contributed in
  earlier years.
- **FR-014a**: A name MUST NOT be published unless the contribution it came from was public at the
  payment provider. Anyone who tipped privately MUST be recorded without a name, per FR-015 — they
  gave money, not permission to be listed.
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
- **FR-021c**: Deleting a user account MUST result in that account's supporter link and marker being
  removed by the maintainer's next monthly pass at the latest, and MUST NOT remove that person's
  supporter list entry or alter the coverage total — deleting a site account is not a cancellation,
  and they are still paying. Immediate removal is explicitly not required: the same lag is already
  accepted for lapsed supporters, and requiring it here alone would force either automation that
  cannot write to the repository or a storage choice rejected on cost grounds (see plan research
  R1 and R9).
- **FR-021d**: The badge capability MUST be removable in its entirety without affecting the funding
  status, the ask, the supporters wall, or the maintainer's monthly routine.

**Administration**

- **FR-022**: Only an administrator MUST be able to change the supporter list or create and remove
  account links, and this MUST be enforced on the server, not only concealed in the interface.
- **FR-023**: The stated yearly running cost and the year it refers to MUST be deploy-time values in
  the repository, changed only by a code change. They are expected to change once a year.
- **FR-024**: The maintainer's recurring routine MUST consist solely of transcribing names and
  received amounts from the payment provider into the supporter list, and MUST be occasional —
  triggered by someone contributing, not by a calendar. No separate funding figure may require
  periodic updating, and no identity matching may be required to complete it.

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

- **Funding Status**: The publicly displayed state of community funding for a named calendar year.
  The year, the running cost and the covered total are hand-set values in the codebase; the
  supporter count is derived from the Supporter List. Never derived from a payment API. The covered
  total is the one figure typed by hand, and it is typed in the same edit as the names.
- **Supporter List**: The maintained set of supporters for the stated year, one entry per person and
  nothing recorded about what any of them gave. A name is present only where the contribution was
  public at the provider and the person did not ask to stay unnamed; an unnamed entry still occupies
  a place so the count stays right. It is the source of the supporter count and the current-year
  wall, and it holds no reference to a site account.
- **Earlier Supporters**: Names only, from years before the stated one. Thanked on the wall,
  contributing nothing to the current total. Grows at each rollover and never shrinks.
- **Supporter Link**: An optional association between a supporter list entry and a site account,
  created only when that person has volunteered their username. Readable by anyone rendering that
  user's name; writable only by an administrator. Drives the badge and nothing else. Confers no
  capability, and its absence costs the supporter only the badge.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor landing on the home page can state, within 10 seconds and without
  scrolling to the footer, roughly what the site costs to run and whether that cost is currently
  covered.
- **SC-001a**: No page presents the funding status, or any other donation ask, more than once.
- **SC-002**: The stated year's running costs are fully covered by community contributions within 12
  months of launch.
- **SC-003**: The year's goal is at least half covered within 6 months of launch.
- **SC-004**: Click-through on the support action is at least 5× the pre-change footer baseline
  within one month.
- **SC-005**: For a linked supporter, the marker is visible to signed-out visitors on 100% of the
  surfaces where the site names a user.
- **SC-005a**: 100% of supporters appear on the wall and in the coverage total without any account
  linking having taken place.
- **SC-006**: The maintainer's update consists of transcribing names and received amounts only,
  completes in under 5 minutes, and requires contacting no supporter and identifying no account. It
  is triggered by someone contributing, not by a calendar.
- **SC-007**: Zero features available for free before the change require supporter status after it,
  verified by walking the full feature list signed out.
- **SC-008**: Focus-mode session completion rate does not measurably decline after the contextual
  ask is introduced.
- **SC-009**: The contextual ask is seen at most once per suppression period by any individual, and
  never by a supporter.
- **SC-010**: No support request or public complaint attributes a loss of previously free
  functionality to this change.

## Assumptions

- **The number to beat is small.** A year costs roughly €240, about what thirteen supporters at
  €2/month would give. The whole design is sized for that, not for scale.
- **A yearly goal counts money, not arrangements.** Because the target is a year rather than a
  month, every euro that actually arrived counts the same regardless of how it arrived. This removes
  the need to model plans, apply net rates per arrangement, or decide what a one-off tip is worth
  against a recurring target — questions that only existed because of the monthly framing.
- **Manual administration is sufficient and preferred.** At the expected volume, hand-assignment is
  a few minutes a month and doubles as an opportunity for the maintainer to thank people
  personally. No automation is warranted, and none is specified.
- **Payment happens entirely off-site.** The existing Ko-fi presence handles collection; the site
  links out and never sees a payment. Monthly €2 and annual €20 are the two products, configured on
  the provider's side.
- **Figures are approximate and stated as such.** "About €240 a year" is honest and does not require
  the maintainer to reconcile a cloud bill to the cent.
- **The bundle is the privacy boundary, not the rendered page.** Anything in the configuration is
  public whether or not a template draws it. This is why per-person amounts are not stored at all,
  and why an anonymous supporter has no name recorded rather than a name marked hidden. The rule
  applies to any future field: if it should not be public, it does not go in the bundle.
- **The per-person record lives at the payment provider.** Ko-fi already holds who gave what; the
  repository holds only the total. Keeping the detail in one place avoids both the leak and the
  duplication — when the maintainer needs the breakdown, they open the dashboard.
- **One hand-typed figure is accepted as the cost of that privacy.** The covered total can no longer
  be derived, so it is typed. The risk this reintroduces is bounded by changing it in the same edit
  as the names, rather than on a schedule of its own: the number can lag reality, but it cannot
  contradict the wall next to it, and nothing needs recalculating on a cadence anyone can forget.
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
- **The actual figures are not yet supplied.** The stated yearly running cost (~€240) and the
  covered total are placeholders until the maintainer reads them off the payment provider. Needed
  before launch, not before implementation — two numbers in total, both in one block.
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
