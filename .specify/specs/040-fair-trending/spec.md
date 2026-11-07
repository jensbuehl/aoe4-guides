# Feature Specification: Fair Trending

**Feature Branch**: `040-fair-trending` (named explicitly so it matches the spec folder; the branch
script alone would have produced 039)

**Created**: 2026-11-07

**Status**: Draft

**Input**: User description: "Honest view counting plus a recency-based trending score, fixed together.
(A) Counter integrity: any client can set a build's views, likes, upvotes, downvotes and comments to any
value, votes need no login, and a view is counted on every page load — reloads, in-app back and forth,
the author's own visits. (B) Trending ranks all-time totals, recalculated weekly, with no decay for six
weeks; a new build scores zero until the next weekly run. Replace it with a daily, decayed measure of
recent activity (half-life 7 days). All-time ranking unchanged. Integrity must ship before or with the
new score, because a recency score removes the damping that currently blunts inflation. Server-side
view counting is a follow-up, not part of this."

## Background

**Why it is hard to get into Trending today.** The Trending list ranks a build by everything it has
ever collected (views, votes, likes), recalculated once a week, and applies no age penalty until a
build is six weeks old. Three things follow:

1. A newly published build has a trending score of zero until the next weekly run — up to seven days,
   which is exactly the window in which it gets most of its attention.
2. A newcomer has to catch up with weeks of accumulated totals while the builds already on the home
   page keep collecting more, partly *because* they are on the home page.
3. A build can hold a top place for roughly nine weeks on the strength of its first few.

So "Trending" currently means "biggest recent build", not "what people are looking at now".

**Why the counters cannot be trusted today.** Three separate holes, in rising order of severity:

1. **Every page load is a view.** Reloading, navigating away and back inside the app, and an author
   opening their own build all count. A reload loop inflates a build at whatever rate the browser
   allows.
2. **Anyone can set a counter to any value.** The database accepts a write to a build's counters from
   any visitor and checks only *which* fields changed, never *by how much*. A single write typed into
   the browser console on a build page can set `views` to a million. App Check does not prevent this:
   the console runs inside a real, attested page. Likes, upvotes and downvotes are open the same way,
   with no sign-in required, although the site only offers voting to signed-in users.
3. **An author can write anything to their own build — counters and scores included.** The rule that
   lets authors edit their build places no limit on the counter or score fields. Separately, saving
   from the editor writes back the counter values that were loaded when editing began, so views and
   likes gained while the editor was open are silently lost on save.

**Why these two problems ship together.** The current score takes a logarithm of all-time totals,
which happens to blunt inflation: ten times the views adds a fixed, small amount. A score based on
recent activity has no such damping — a few hundred fake views in a day would show directly. Fixing
the ranking without fixing the counting would make Trending *easier* to game, not harder.

**What this deliberately does not solve.** With the counting fixed as specified here, a determined
person can still add one view per build per day per browser profile (clearing storage, a private
window, another device). That is a real cost and a bounded rate, not a guarantee. The guarantee needs
views counted on the server, deduplicated per visitor, and is the named follow-up below.

## Clarifications

### Session 2026-11-07

- Q: Should the trending window be shortened, or the method replaced? → A: Replaced. Shortening the
  six-week grace period would still leave the zero-score week and the cumulative-totals advantage.
- Q: Half-life of the recency score? → A: 7 days. Build orders stay useful longer than news; going
  much below 4 days would make the list jumpy for a site of this size.
- Q: How often is Trending recalculated? → A: Daily (was weekly). The all-time ranking stays monthly.
- Q: Is server-side view counting part of this? → A: No. It is the follow-up; this feature makes the
  client path honest within what a client path can be.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Counters cannot be set, only stepped (Priority: P1)

A visitor opens the browser console on a build page and tries to write `views: 1000000` to the build,
or to give it 500 likes in one write, or to upvote without signing in. Every one of those writes is
refused. An author editing their own build cannot change its counters or its scores either, and saving
from the editor no longer overwrites counters with stale values.

**Why this priority**: This is the hole that makes every other measure pointless — any ranking built
on a counter anyone can set is decided by whoever sets it. It is also the precondition for User Story 3.

**Independent Test**: Against the database rules (emulator or rules test), attempt each refused write
listed below as an anonymous visitor, a signed-in visitor and the build's author, and confirm the
ordinary operations — a view, a like and unlike, an upvote and its removal, a comment added and deleted,
an author's edit — still succeed.

**Acceptance Scenarios**:

1. **Given** any visitor, signed in or not, **When** they change a build's view count by anything other
   than +1 in a single write, **Then** the write is refused.
2. **Given** a signed-out visitor, **When** they change a build's likes, upvotes or downvotes, **Then**
   the write is refused.
3. **Given** a signed-in visitor, **When** they change likes, upvotes, downvotes or comments by anything
   other than +1 or −1 in a single write, **Then** the write is refused.
4. **Given** a build's author, **When** they save the build from the editor, **Then** its counters are
   left exactly as they are in the database at that moment — including views gained while the editor
   was open — and the save succeeds.
5. **Given** a build's author, **When** they attempt to change their build's counters, its trending
   score, its all-time score, or the trending bookkeeping by any route, **Then** the write is refused
   (except for the same ±1 steps any signed-in visitor may make).
6. **Given** any client, **When** it writes a contributor's total view count or build count, **Then**
   only a +1 or −1 step is accepted — except that removing a deleted build's views from its author's
   total remains possible (see FR-008).

---

### User Story 2 - A view is a person looking, not a page load (Priority: P1)

A player opens a build, reloads it ten times, goes back to the list and opens it again. The build's
view count, and its author's total, rise by one. The next day the same player opens it again and it
counts once more. The author opening their own build never adds to its count.

**Why this priority**: Reload-spam is the inflation the owner suspects is happening now, and it becomes
more effective under the new trending score. It also reduces database writes.

**Independent Test**: In a browser, open a build and reload it repeatedly; observe exactly one view
added. Navigate away and back within the app; still one. Sign in as the author and open the build; no
view added. With storage blocked or in a private window, the page still works.

**Acceptance Scenarios**:

1. **Given** a visitor who has not opened build X in the last 24 hours on this browser, **When** they
   open it, **Then** one view is added to X and one to its author's total.
2. **Given** a visitor who opened build X less than 24 hours ago on this browser, **When** they open
   it again by reload, in-app navigation or a new tab, **Then** no view is added.
3. **Given** the signed-in author of build X, **When** they open X, **Then** no view is added to X or
   to their own total.
4. **Given** a browser where site storage is unavailable, **When** a visitor opens a build, **Then**
   the page renders normally and at most one view is added per page load (never more than today).

---

### User Story 3 - Trending shows what people are using now (Priority: P2)

An author publishes a good build on a Saturday. By Sunday it can appear in Trending if it is drawing
more attention than the builds there, instead of waiting until Friday. A build that topped the list a
month ago and is no longer being opened drifts down within a couple of weeks. A build that becomes
popular again after a patch can climb back without needing to be republished.

**Why this priority**: This is the outcome the owner asked for. It depends on Stories 1 and 2 being in
place first; shipped alone it would make Trending easier to game.

**Independent Test**: Run the recalculation against a copy of production data on two consecutive days
and compare the resulting top lists with today's. Verify with constructed data that a build with
steady recent activity outranks one with larger but older totals, and that a build with no new
activity loses half its trending weight every 7 days.

**Acceptance Scenarios**:

1. **Given** a build published at any time, **When** the next daily recalculation runs, **Then** the
   build has a trending score reflecting its activity since publication.
2. **Given** two builds, A with 10,000 all-time views but none in the last month and B with 600 new
   views this week, **When** Trending is recalculated, **Then** B ranks above A.
3. **Given** a build whose activity stops, **When** 7 days pass, **Then** its trending score has
   halved; after 14 days, quartered.
4. **Given** an old build that suddenly gains activity, **When** Trending is recalculated, **Then** it
   rises by the same rule as a new build would — age itself is not penalised.
5. **Given** the "Trending" ordering on the home page, the build list's sort option and the public API,
   **When** the new score is live, **Then** all of them order by it, with no change for their users
   other than the order.
6. **Given** the "All-time" ordering, **When** the new score is live, **Then** it is unchanged.

---

### Edge Cases

- **The first run must not reward a build's whole history.** When the new score is introduced, the
  recorded "last seen total" for every build is set to its current total, so the first difference is
  zero and only activity from that point counts. Otherwise the first run would just reproduce all-time
  totals.
- **The list is empty or arbitrary while the new score warms up.** Immediately after the first run
  every build scores zero. The new score is therefore computed alongside the old one for at least 7
  days before Trending switches to it, which also gives the owner a week to compare the two lists.
- **Unlisted builds accumulate views** through shared links (coaching use). Publishing such a build
  must not award all of that at once as "new activity": while a build is unlisted its last-seen total
  keeps pace with its total and its trending score stays zero, so it starts from zero on publication.
- **Publishing an unlisted build resets its creation date** today, which under the old age penalty
  let an author unlist and republish a build to make it young again. The new score does not use age,
  so this stops mattering; it is noted so nobody reintroduces an age term without remembering it.
- **Totals can go down.** An unlike or a withdrawn upvote lowers the activity total, and a new downvote
  lowers it by 10 (comments are not part of it). A negative difference lowers the score; the score
  never goes below zero.
- **Inactive builds** (most of the ~4,200) must not be rewritten every day. A build whose total has not
  changed and whose score has decayed to a negligible value is set to zero once and then left alone.
- **A remix or an imported build** starts with zero counters and is treated as a new build.
- **A build deleted between runs** simply disappears; nothing is carried over.
- **An admin deleting someone else's build** must still remove that build's views from its author's
  total, which today is done by the deleting browser and would be refused by the new rules unless
  handled.
- **Storage blocked, private windows, cleared site data**: view deduplication degrades to "one view per
  page load" (today's behaviour), never to an error or a blank page.

## Requirements *(mandatory)*

### Functional Requirements

**Counter integrity**

- **FR-001**: The database MUST refuse any client write that changes a build's view count by anything
  other than +1.
- **FR-002**: The database MUST refuse any client write to a build's likes, upvotes or downvotes from a
  visitor who is not signed in, and any such write by a signed-in visitor that changes the value by
  anything other than +1 or −1.
- **FR-003**: The database MUST refuse any client write that changes a build's comment count by
  anything other than +1 or −1, and any such write from a visitor who is not signed in (commenting
  already requires signing in).
- **FR-004**: Trending score, all-time score and the trending bookkeeping fields MUST NOT be writable by
  any client, the build's author included. Only the scheduled recalculation writes them.
- **FR-005**: An author's edit, publish or unlist of their own build MUST NOT change its counters, and
  MUST NOT overwrite them with the values that were loaded when editing began.
- **FR-006**: Creating a build MUST still be able to start every counter and score at zero, and only at
  zero.
- **FR-007**: The database MUST refuse any client write that changes a contributor's total view count
  or build count by anything other than +1 or −1, except as FR-008 allows.
- **FR-008**: Deleting a build MUST continue to remove its views from its author's total view count,
  whoever deletes it. No client may *raise* a contributor's view count by more than 1 in a write.

**View counting**

- **FR-009**: A view MUST be counted at most once per build per browser in any 24-hour period,
  regardless of reloads, in-app navigation or additional tabs.
- **FR-010**: A view by the build's signed-in author MUST NOT be counted, on the build or on the
  author's total.
- **FR-011**: The author's total view count MUST be raised exactly when, and only when, the build's
  view count is.
- **FR-012**: Where the browser cannot remember past views, the build page MUST still render normally;
  counting MAY fall back to one view per page load.

**Trending**

- **FR-013**: A build's activity total MUST be computed as views + 5 × upvotes − 10 × downvotes + 50 ×
  likes (today's weighting, unchanged).
- **FR-014**: Each recalculation MUST compute, per build, the change in activity total since the
  previous recalculation, and update the trending score as: previous score decayed by the elapsed time
  at a half-life of 7 days, plus that change, floored at zero.
- **FR-015**: Trending MUST be recalculated daily.
- **FR-016**: The trending score MUST NOT depend on a build's age.
- **FR-017**: The first recalculation MUST record every build's current activity total as its starting
  point without awarding it as activity (see Edge Cases).
- **FR-018**: The new score MUST be computed alongside the existing one for at least 7 days before the
  Trending ordering switches to it; the switch MUST be possible without a site release and reversible
  the same way. [Assumption: "without a site release" means a server-side change, as the current
  scheduled jobs are.]
- **FR-019**: While a build is unlisted, its trending score MUST stay at zero and its recorded starting
  point MUST keep pace with its activity total.
- **FR-020**: The recalculation MUST NOT rewrite a build whose stored values would not change; a score
  that has decayed below a negligible threshold MUST be set to zero once.
- **FR-021**: Every place that offers "Trending" today — the home page lane and hero, the build list's
  "Trending" sort, the public API's trending sort — MUST order by the new score once switched, with no
  change to how they are requested.
- **FR-022**: The all-time ordering and its monthly recalculation MUST remain unchanged.

**Order of delivery**

- **FR-023**: Counter integrity (FR-001 – FR-008) and view counting (FR-009 – FR-012) MUST be live in
  production before Trending switches to the new score (FR-018).

### Key Entities

- **Build counters**: views, likes, upvotes, downvotes, comments — public numbers on each build. After
  this feature they can only be stepped by one, never set.
- **Activity total**: the weighted sum in FR-013. Not stored as such; derived at each recalculation.
- **Trending bookkeeping (per build)**: the activity total seen at the last recalculation and the
  current recency score. Written only by the recalculation.
- **Trending score**: what every "Trending" ordering sorts by. Today the six-week-grace logarithm;
  after the switch, the recency score.
- **Contributor totals**: a contributor's total views and build count, shown on profiles and used to
  rank contributors. Same stepping rule as build counters.
- **View memory (per browser)**: which builds this browser has counted a view for, and when. Lives only
  on the visitor's device; never sent anywhere.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every write in the refused lists of User Story 1, attempted as an anonymous visitor, a
  signed-in visitor and an author, is refused — 100%, verified by an automated rules test that can be
  rerun before every rules deploy.
- **SC-002**: Reloading a build page 20 times in one browser adds exactly 1 view.
- **SC-003**: A build published on any day of the week has a non-zero trending score within 24 hours
  if it received any views, votes or likes (today: up to 7 days).
- **SC-004**: A build with no new activity loses half its trending weight every 7 days (today: no loss
  at all for 6 weeks).
- **SC-005**: In the comparison week (FR-018), the owner can see the old and new top-8 Trending lists
  side by side before deciding to switch.
- **SC-006**: Database writes from view counting fall, not rise — measured against the week before
  release.
- **SC-007**: The daily recalculation stays within the existing free tier for writes on a typical day,
  and costs under €0.50 per month in reads.
- **SC-008**: No change in behaviour for anyone using the site normally: viewing, liking, voting,
  commenting, editing, publishing, unlisting, remixing and deleting all work as before.

## Assumptions

- **Weights unchanged.** The activity weighting (1 / 5 / −10 / 50) is kept as is; this feature changes
  *when* activity counts, not *how much* each kind is worth.
- **The threshold for "negligible"** in FR-020 is a planning detail; any value well below a single
  view's worth is acceptable.
- **Existing inflated totals are left alone.** The migration (FR-017) means past inflation does not
  carry into the new Trending; it still sits in all-time totals and the all-time list. A one-off audit
  of suspicious totals is possible separately and is not part of this.
- **24 hours** is the dedup window; it matches "one person, one view per day", the common convention.
- **Scale**: ~4,200 builds (verified for the SEO snapshot, Aug 2026). The cost criterion assumes that
  order of magnitude.
- **The public API** keeps its existing sort name for Trending; it reads the trending score field and
  needs no change if that field carries the new score after the switch. If the plan stores the new
  score elsewhere, the API must follow (it lives in the separate `aoe4-guides-api` repository).

## Out of Scope / Follow-up

- **Server-side view counting.** Views recorded by a server endpoint that checks App Check and
  deduplicates per visitor (signed-in id, or a salted, daily-rotated hash of address and user agent —
  never a stored raw address), with `views` removed from client-writable fields entirely. This is what
  turns "one view per day per browser profile" into "one per person". Natural next feature.
- **Anomaly flagging.** Highlighting builds whose daily gain or views-to-likes ratio is out of line, for
  manual review.
- **Per-viewer caps on trending contribution**, which require server-side counting first.
- **Changing the all-time list**, its weighting or its cadence.
