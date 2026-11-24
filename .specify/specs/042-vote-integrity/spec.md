# Feature Specification: Vote Integrity

**Feature Branch**: `042-vote-integrity`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Likes and votes: block it rather than detect it. The record of who liked
what already exists: favorites/{uid} keeps favorites, upvotes and downvotes lists. The rules can allow
likes +1 only when the same batched write also adds the build to the caller's own list, and −1 only
when it's removed. Then one account counts once. Today Favorite.vue:83-84 sends the count and the list
as two separate writes, so they would become one batch. That also stops the honest drift between the
two. Before changing anything, a one-off read-only check comparing per-user lists against counts would
answer 'has anyone done this already?' Counts from before the Nov 7 rules are already off, so it should
look for where the difference keeps growing, not the difference itself."

## Background

**What spec 040 fixed, and what it left open.** Since 2026-11-07 a client can change a build's likes,
upvotes and downvotes only by exactly one step, and only when signed in. That closed "set the count to
a million". It did not tie the step to anything: the database checks that the number moved by one, not
*who* moved it or *whether they had already*. One signed-in account can therefore like a build, like it
again, and again — one step per write, as fast as a script can send them. Since 040 also made Trending
a recency score in which a like weighs 50 and a vote 5, a few hundred repeated likes in a day now show
directly in the ranking.

**The record that decides it already exists.** Every account has one document holding three lists:
the builds it has favourited (each one is a like), upvoted, and downvoted. Account deletion already
treats these lists as the truth — it gives back exactly one like or vote per entry. What is missing is
the other half: nothing makes the *count* agree with the lists while the account is alive.

**Why both sides must be bound, not just the count.** The account's own document is writable by its
owner without limit. Requiring "+1 only together with adding to the list" is not enough on its own:
an account could like a build (count +1, list gains it), then remove the build from its list *without*
the −1, then like it again. So the two documents are bound to each other in both directions — a list
gains or loses a build only together with the matching step on that build's count, and the count steps
only together with that list change.

**Why the check comes first, and why it looks at growth.** Before 2026-11-07 any visitor could write
any value to these counts, so many builds will already show a count that disagrees with the lists, and
that tells us nothing about now. Honest drift adds to it too: today the count and the list are two
separate writes, and when one fails and the other lands they part ways. What would show abuse since the
040 rules is a gap that *keeps widening* — a count climbing faster than the number of accounts that hold
the build in their list.

**Why the 30-favourite cap goes too.** The cap (commit `f416ff6`, 2024-09-02, "technical limitation
for now") exists because My Favorites loads its builds with one query that filters on the whole list,
and that kind of filter takes at most 30 values. It does not even hold at 30: the database also caps a
query at 30 *combinations* across all such filters multiplied together, so 20 favourites filtered by two
seasons (40) is already refused. Loading the favourited builds by id and filtering, sorting and paging
them in the browser removes both limits without changing how anything is stored — and leaves the
integrity rules with no cap to special-case.

**What this deliberately does not solve.** One account counts once; many accounts still count many
times. Creating accounts has a real cost (and a verified address, where required), so this turns
"unbounded from one account" into "bounded by accounts held". Detecting coordinated accounts is out of
scope.

## Clarifications

### Session 2026-11-24

- Q: Should the database also require a verified email address to like or vote, as the interface
  already does? → A: Yes, to **add** a like or vote. Taking one back stays open to any signed-in
  account, so an unverified account that liked something before this ships is never stuck with it.
- Q: Why is the favourites list capped at 30, and does that still hold? → A: It is a query limit, not
  a product choice (commit `f416ff6`, 2024-09-02, "technical limitation for now"). My Favorites loads
  its builds with one query filtering on the list, and that filter accepts at most 30 values; a 31st
  favourite would make the whole page fail to load, not drop one build.
- Q: Remove the cap or keep it? → A: Remove it, by changing how My Favorites loads (User Story 4).
  Alternatives weighed: chunking the server query (still has to load everything to page across
  chunks), storing likers on each build (builds are public, so it would publish who liked what), one
  document per like (My Favorites would still load builds by id; needs a migration for no gain). The
  current one-document-of-lists model stays; no migration. Confirmed by a read-only measurement of
  production on 2026-11-24 (5,099 list documents): 1,708 accounts hold ≥1 favourite; median 2, p90 11,
  p99 29, max 58. 10 accounts sit at exactly 30 and 20 more at 26–29. **5 accounts already hold more
  than 30** (the cap was only ever enforced in the app), so My Favorites fails to load for them today.
  Upvotes: 878 accounts, max 125. Downvotes: 97 accounts, max 13.
- Q: Keep downvotes? → A: No. Remove the thumbs-down and drop downvotes from every score. In the whole
  history of the site there are 151 downvotes from 97 accounts (vs. 2,568 upvotes and 7,713
  favourites); no page shows a downvote count, not even to the author; yet each one weighs −10 in the
  activity score — as much as ten views — which since the recency score makes a single account's
  downvote an invisible way to hold back a new build. Removing it also removes the rules this spec
  would otherwise need for it (both-lists exclusion, switching as one write). Stored downvote counts and
  lists are left in place, unread; no migration.
- Q: Re-weight views, upvotes and likes here? → A: Yes, in this spec: **views 1, upvotes 25, likes
  100** (was 1 / 5 / 50, downvotes −10 → 0). Measured 2026-11-24 over 4,442 published builds: 4.34 M
  views, 7,440 likes, 2,429 upvotes, 134 downvotes. Views were ~92% of every score, likes ~8%, upvotes
  0.3%; top-20 rankings barely move under any weighting from likes ×10 to ×500 (17–20 of 20 kept), so
  this is about what the score *rests on*, not about reshuffling today's lists. The weights follow two
  established rules and take the lower of the two:
  - *Rarity and intent* (as engagement-ranked feeds weight saves above likes above views): a like
    arrives once per ~580 views, an upvote once per ~1,800, and a like is a save — the strongest
    signal. That is the ceiling.
  - *Trust*: after this spec a like or upvote is one per verified account; a view is one per browser
    per day and anonymous. But an account is not free to make either, and a weight near the rarity
    ceiling would make ten throwaway accounts worth a month of a trending build's views. Capping one
    account's whole contribution to a build at 125 view-equivalents keeps accounts from becoming the
    cheaper lever. That is the floor that binds.
  Resulting share of the score: likes 8% → 14% and upvotes 0.3% → 1.2% across all builds; among builds
  from the last 21 days, likes 15% → 25%, upvotes 1.3% → 5%. Totals keep the existing logarithm, which
  already damps any one burst.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find out whether repeated liking has already happened (Priority: P1)

The site owner runs a read-only check that compares, for every build, its like and upvote counts
with the number of accounts whose lists contain it. The check records what it found. Run again some
days later, it reports the builds whose gap *widened* in between, ranked by how much, so the owner can
tell an attack from old, frozen damage.

**Why this priority**: It must run before any rule or interface change, because the rule change ends
the condition it measures. It also decides whether any repair is needed after the fix — and it is
useful on its own even if nothing else ships.

**Independent Test**: Run it against production twice, some days apart. It changes nothing (no write
of any kind), and its second run lists every build whose count rose more than its list membership did,
or reports that none did.

**Acceptance Scenarios**:

1. **Given** a build with 40 likes and 12 accounts holding it in their favourites, unchanged between
   two runs, **When** the second run compares them, **Then** the build is not reported as growing,
   even though its gap is 28.
2. **Given** a build whose likes rose by 30 between runs while only 2 more accounts added it, **When**
   the second run compares them, **Then** the build is reported with a growth of 28 likes.
3. **Given** the same check for upvotes, **Then** each count is compared against its own list,
   separately.
4. **Given** a build that was deleted between runs, or an account that was deleted between runs,
   **When** the second run compares, **Then** neither is reported as growth (an account deletion gives
   back its likes and removes its list together, so the gap does not move).
5. **Given** any run, **Then** no document in the database is created, changed or deleted.

---

### User Story 2 - One account counts once (Priority: P1)

A signed-in player likes or upvotes a build exactly as today. Behind it, the database now
accepts the count's step only when the same write adds the build to that player's own list, and the
step back only when the same write removes it. Repeating a like, or taking a build out of one's list
without giving the like back, is refused.

**Why this priority**: This is the fix. Without it the recency score can be moved by a single account.

**Independent Test**: With the rules test suite, as a signed-in account: a like together with adding to
one's own list succeeds; a second like on the same build is refused; a bare +1 with no list change is
refused; removing the build from the list without the −1 is refused; a +1 that adds the build to
*someone else's* list is refused.

**Acceptance Scenarios**:

1. **Given** a signed-in player who has not liked a build, **When** they like it, **Then** the count
   rises by one and the build is in their favourites — both, or neither.
2. **Given** a player who has already liked a build, **When** any write tries to raise that build's
   like count again from their account, **Then** it is refused.
3. **Given** a player who has liked a build, **When** they unlike it, **Then** the count falls by one
   and the build leaves their favourites — both, or neither.
4. **Given** a player who has liked a build, **When** a write removes it from their favourites without
   lowering the count, or lowers the count without removing it, **Then** it is refused.
5. **Given** a player who has not liked a build, **When** a write tries to lower its like count,
   **Then** it is refused.
6. **Given** the same pairs for upvotes, **Then** they behave like likes against the upvotes list.
7. **Given** any build page, **Then** there is no thumbs-down, and any client write that changes a
   build's downvotes or an account's downvotes list is refused — both are frozen as they stand.
8. **Given** a visitor who is not signed in, **Then** no like or vote step is accepted (unchanged from
   040).

---

### User Story 3 - The heart and the vote buttons tell the truth (Priority: P2)

A player who taps the heart sees at once that the like is being sent, and the heart fills when it
has been recorded; if it did not go through — offline or refused — the heart stays in its previous
state and they are told, instead of showing a like that was never counted or a count that rose for a
build that never reached their list.

**Why this priority**: Making the two writes one is required by Story 2 anyway; this story is about
what the player sees when that one write fails, which today is nothing.

**Independent Test**: In a browser, like a build while offline or with the write refused: the heart
returns to its prior state with a message, and after reload the build's count and the player's
favourites agree.

**Acceptance Scenarios**:

1. **Given** a like that the database refuses, **When** the refusal arrives, **Then** the heart shows
   its previous state and the player sees a short message.
2. **Given** two quick taps on the heart, **Then** the build ends liked or not liked — never counted
   twice, never counted without being in the list.

---

### User Story 4 - Favourite as many builds as you like (Priority: P2)

A player can favourite any number of builds. My Favorites shows all of them, and every filter, sort,
count and page works as on the other lists — including picking several seasons, maps or strategies at
once, which today can fail with a full list.

**Why this priority**: The cap is a workaround for how one page loads, and it is the only part of the
lists that the integrity rules would otherwise have to special-case. Removing it simplifies the rules
and removes a player-facing limit and a latent failure together.

**Independent Test**: With an account holding more than 30 favourites, open My Favorites: all are
reachable through paging; filter by two seasons and two maps; change the sort; each shows the right
builds and count. Then favourite one more build from its page — it is accepted.

**Acceptance Scenarios**:

1. **Given** a player with 30 favourites, **When** they favourite another build, **Then** it is
   accepted and appears in My Favorites; the "only up to 30 favorites" message no longer exists.
2. **Given** one of the accounts that already hold more than 30 favourites (whose My Favorites fails
   to load today), **When** they open My Favorites, **Then** all their favourites load.
3. **Given** a player with 80 favourites, **When** they open My Favorites, **Then** the count shows the
   number of favourited builds that are listed, and paging reaches every one of them.
4. **Given** any number of favourites, **When** the player filters by several seasons, maps and
   strategies at once, **Then** the list and count show exactly the favourites matching the filter,
   with no error.
5. **Given** a favourite that has since been made unlisted or deleted by its author, **Then** it is
   not shown and not counted, as today.
6. **Given** a player who changes filter or sort after the page has loaded, **Then** the new result
   appears without loading the favourites again.

---

### User Story 5 - A like counts for what it is (Priority: P3)

Trending and All-time rank by a weighted sum of views, upvotes and likes. After this story a like is
worth 100 views and an upvote 25 (was 50 and 5), and downvotes count for nothing. The switch is
invisible apart from the new order: no build jumps because of the change itself.

**Why this priority**: Rankings barely move today, so this is not urgent for list quality. It matters
once Story 2 ships: likes become the most trustworthy signal on the site and should carry more of the
score than the most easily faked one. Delivered last, after the like path is closed.

**Independent Test**: Run the trending job's pure function on a fixture build before and after the
switch: the first run under the new weights adds nothing to its trend; a like after the switch adds
100, an upvote 25, a downvote 0.

**Acceptance Scenarios**:

1. **Given** the first scheduled run after the new weights deploy, **Then** every build's trend is
   carried over unchanged (only decayed as usual), and its baseline is re-taken under the new weights —
   so a build with 80 old likes does not gain 4,000 points of "new activity" overnight.
2. **Given** a build that gains one like after the switch, **Then** its trend rises by 100 at the next
   run; one upvote, by 25; one downvote (impossible from the app, possible only from old data), by 0.
3. **Given** the All-time ranking, **Then** it is recalculated under the new weights straight after
   deployment rather than at its next monthly run, and the home page snapshot is refreshed with it.

---

### Edge Cases

- **A build already in the list before this ships** (the common case): unliking it lowers the count by
  one and removes it, as normal. A build whose count is *lower* than its list membership (honest drift)
  must still be unlikable — the count may not go below zero; see FR-008.
- **A build deleted while still in someone's favourites**: removing that stale entry must stay possible
  without a count step, because there is no build left to step.
- **A list entry whose build exists but whose count is already 0** (legacy drift): removal of the entry
  is allowed and leaves the count at 0.
- **An account with no lists document yet**: the first like creates it, in the same write.
- **Liking one's own build**: allowed today; unchanged.
- **Account deletion**: the existing server cleanup gives back one step per list entry and is not
  subject to these rules; it continues to keep counts and lists in agreement.
- **An older open tab** still running the previous app version sends the two separate writes; both are
  now refused, and the player sees the heart not stick. Acceptable for the short window after deploy.
- **The check meets malformed data** (a count that is not a number — 20 builds once held `upvotes: NaN`):
  it reports such builds separately rather than failing or treating them as zero.

## Requirements *(mandatory)*

### Functional Requirements

**The check (before any change)**

- **FR-001**: A one-off check MUST compare, for every build, each of its like and upvote counts with the number of accounts whose corresponding list contains that build.
- **FR-002**: The check MUST be strictly read-only: it creates, changes and deletes nothing.
- **FR-003**: The check MUST save its per-build results outside the database and outside anything the
  site serves to visitors, so a later run can compare against them. Results identify builds, never
  which account liked or voted for what.
- **FR-004**: A later run MUST report every build whose gap (count minus list holders) grew since the
  saved run, per count, ordered by growth, with the build's title and its current counts; and it MUST
  report builds whose gap shrank or went negative separately, as drift rather than abuse.
- **FR-005**: The check MUST NOT report the size of a gap as a finding in itself.
- **FR-006**: The first run MUST happen before the rule change is deployed, and the second run MUST
  also happen before it, so the comparison covers a period under the current rules.
- **FR-022**: The check MUST also report the distribution of list lengths (favourites and upvotes; the
  frozen downvotes list is not reported) and how many accounts hold exactly 30 favourites — aggregates
  only, no account ids.

**Blocking**

- **FR-007**: The database MUST accept a +1 to a build's likes or upvotes only when the same write adds
  that build to the caller's own favourites or upvotes list respectively, and the build was not in that
  list before.
- **FR-008**: The database MUST accept a −1 only when the same write removes the build from the
  caller's corresponding list, and the build was in it. A count may not fall below zero; where it
  already stands at zero or below (legacy drift), the list entry is removed without a step.
- **FR-009**: The database MUST refuse any change to a caller's lists that adds or removes a build
  without the matching step on that build's count, except removing an entry whose build no longer
  exists (and the zero case in FR-008).
- **FR-010**: Each write MUST change at most one build's counts and the caller's own lists; a write
  that touches another account's lists is refused (as today).
- **FR-011**: The favourites list MUST have no count limit, in the database or the app. (The storage
  limit of one account's document, tens of thousands of entries, is the only bound.)
- **FR-011a**: The database MUST accept a +1 (and the matching list addition) only from an account
  with a verified email address. A −1 (and the matching removal) MUST stay open to any signed-in
  account.
- **FR-012**: Downvoting is removed. The app MUST NOT offer it; the database MUST refuse any client
  change to a build's downvotes and to an account's downvotes list. Existing values stay stored and
  unread. Account deletion continues to give back whatever the list holds (server-side, outside these
  rules).
- **FR-012a**: Downvotes MUST no longer count in any score (Trending or All-time). The next scheduled
  score run after deployment applies this. Measured 2026-11-24: 134 downvotes on published builds
  against 4.3 million views; the All-time top 20 and the top 20 of the last 90 days are unchanged
  without them.
- **FR-013**: Every allowed and refused case above MUST be added to the rules contract and the rules
  test suite first. Each new refusal case MUST fail against the currently deployed rules (which still
  allow the write) before it passes against the new ones — that is what shows it covers the hole.
- **FR-014**: Views and comments counting MUST be unchanged by this feature.

**The app**

- **FR-015**: Liking, unliking, upvoting and taking back an upvote MUST each be sent as a single
  write that changes the count and the list together.
- **FR-016**: When such a write fails or is refused, the button MUST return to its previous state and
  the player MUST see a short message; the screen MUST NOT show a like or vote that was not recorded.
- **FR-017**: A repeated tap while a like or vote is still being sent MUST NOT send a second one.

**My Favorites**

- **FR-018**: My Favorites MUST load the player's favourited builds by id, in whatever number of
  requests the database's per-request limit requires, and MUST NOT ask the database to combine the
  list with any other filter.
- **FR-019**: Filtering (civilisation, seasons, maps, strategies), sorting, the result count and paging
  on My Favorites MUST then happen on the loaded builds, and MUST give the same result the other build
  lists give for the same settings — same order for every sort option, unlisted builds excluded.
- **FR-020**: Favourites whose build no longer exists MUST be skipped silently.
- **FR-021**: Changing a filter, the sort or the page MUST NOT load the favourites again within the
  same visit.

**Weights**

- **FR-023**: Both scores MUST weigh activity as views ×1, upvotes ×25, likes ×100, downvotes ×0, in the
  one shared definition both scheduled jobs already use.
- **FR-024**: The change MUST NOT register as activity. On the first trending run under the new
  weights, each build's trend MUST be carried over (decayed as on any day) and its baseline re-taken
  under the new weights, with nothing added. A build first seen on that run is seeded as usual.
- **FR-025**: The All-time score and the home page snapshot MUST be recalculated right after deployment.
- **FR-026**: FR-012a (downvotes out of every score) and FR-023 MUST deploy together, so the baseline is
  re-taken once, not twice.
### Key Entities

- **Build counts**: likes and upvotes on each build. Public. Feed the Trending and All-time scores.
  (`downvotes` stays stored, frozen and unread.)
- **An account's lists**: one document per account holding the builds it has favourited (= liked) and
  upvoted (and a frozen downvotes list). Readable and writable only by that account. After this feature, the source of
  truth that each count must move with.
- **Check results**: per build and per count, the count, the number of list holders, and the gap, with
  the time of the run. Kept off the site; contains no account identities.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Before deployment, the owner has a list of every build whose like or vote gap grew
  between two runs at least 7 days apart — or a definite "none" — and can name a decision (repair or
  not) for each listed build.
- **SC-002**: After deployment, no single account can raise any build's likes or upvotes by
  more than one in total, however many writes it sends; every attempt beyond the first is refused.
- **SC-003**: For likes and votes cast after deployment, a build's count changes by exactly the number
  of accounts that add or remove it from their lists: a rerun of the check some days after deployment
  shows no build whose gap changed.
- **SC-004**: A player whose like or vote fails sees it not stick within the same interaction, in 100%
  of refused or offline attempts.
- **SC-005**: Liking and voting feel unchanged to players: one tap, immediate feedback, no extra steps.
- **SC-006**: A player with any number of favourites can reach every one of them in My Favorites, under
  any combination of filters, with no error.
- **SC-007**: On the day of the weight switch, no build's trend rises by more than its genuine new
  activity that day; afterwards, likes make up roughly a quarter of the score of builds from the last
  three weeks (from ~15%).

## Assumptions

- The check runs with administrator access from the owner's machine, like the existing maintenance
  scripts, and is not part of any deploy.
- Seven days between the two runs is long enough to see repeated liking at any rate that would matter
  to a recency score with a 7-day half-life. If the database keeps point-in-time copies, a single run
  comparing today with seven days ago is equivalent.
- No count is repaired by this feature. What to do with any build the check reports is decided after
  reading its results; legacy gaps from before 2026-11-07 are left as they are, since their cause can
  no longer be established.
- A visit to My Favorites reads every favourited build once (today: a page of up to 10 plus a count).
  With a median list of 2 and p90 of 11 (measured 2026-11-24), that is fewer reads for most players
  and at most 58 for the longest list.
- The upvotes list keeps no limit, as today.
- Account deletion keeps working as now: it runs with administrator access, outside these rules.
- Liking one's own build remains allowed.

## Dependencies

- Spec 040's rules contract (`.specify/specs/040-fair-trending/contracts/firestore-rules.md`) and its
  rules test suite; several of its allowed cases (a bare ±1 on likes or votes) become refused cases.
- The rules emulator, which needs Java locally.

## Out of Scope / Follow-up

- Detecting or limiting many accounts acting together.
- Repairing legacy counts.
- Server-side view counting (040's named follow-up).
- Quality-by-rate scoring (likes per view with a prior, as review sites rank by a Bayesian average or a
  Wilson bound). A larger change to what Trending means; its own spec if wanted.
- Copies and remixes: linking, remix credit, duplicates — spec 044 (Remix Lineage), which reuses this
  spec's weighting and baseline re-take.
- A "recently liked" sort on My Favorites. The list's order already records it, so it is cheap to add
  later.
