# Feature Specification: Build Search

**Feature Branch**: `043-build-search` (worktree `../aoe4-guides-043`)

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Search by title, author and civ (medium). Firestore can't do full-text
search, but a compact index costs nothing to run: about 500 KB raw for all published builds, loaded
only when someone opens search. One constraint: spec 039 promises unlisted builds stay out of search.
The weekly snapshot alone would break that for up to a week, so the index needs a daily scheduled
rebuild or a live check on results."

**Companion**: `decision-ux-and-cost.md` sets out the UX alternatives and the cost of each way to keep
the index fresh.

## Background

**There is no way to find a build by name today.** The site lists builds by civ, season, strategy,
map and sort order, and an author's builds can be reached from their name. All of those are *browse*
paths: a player who remembers "that Beasty fast-castle build" or "Rus 2TC" has to know the civ, open
the list, and scroll. With about 4,350 listed builds, scrolling stopped working a while ago.

**Why the database cannot answer it.** The build database matches whole field values and prefixes; it
cannot find a word in the middle of a title, ignore case, or forgive a typo. Every alternative that
queries it per keystroke either cannot answer the question or reads thousands of whole builds.

**A small index answers it on the device.** Title, author, civ, season and a ranking value for every
listed build come to about 376 KB uncompressed and ~162 KB gzipped (measured 2026-11-24 against the
9 Nov snapshot: 4,348 builds, author ids included). That is small enough to download once when someone opens search, and
then every keystroke is answered locally, instantly, at no further cost.

**The constraint that sets the cadence.** Spec 039 (FR-010) tells authors an unlisted build "is not
shown in lists or search". The existing build snapshot is refreshed weekly, so an index derived from
it alone would keep a just-unlisted build searchable for up to seven days, and would not find a
just-published one for as long. The index therefore has to be rebuilt at least daily, or results have
to be checked live before they are shown. The companion document compares the two; this spec states
the outcome either must achieve.

## Clarifications

### Session 2026-11-24

- Q: How fast must a change of listing state reach search? → A: **Within 24 hours for everyone, immediately on the author's own device.** The index is rebuilt daily (decision document §3, D1); a live check per result is not needed.
- Q: Where is the index served from? → A: **A file in Firebase Storage**, written by the daily rebuild (decision document §4: free within the bucket's allowance, no Netlify build minutes, readable where App Check fails).
- Q: Where does search live in the interface? → A: **Layout A**: a search entry in the header on
  every page, opening an overlay (desktop) or a full-screen sheet (phone) with civ, author and build
  results. A search field on All Builds (B) and a "See all results" link into it (C) are not part of
  this feature; C remains a possible follow-up.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find a build by words in its title (Priority: P1)

A player remembers part of a build's name — "fast castle", "2TC", "tower rush" — and types it. Matching
builds appear as they type, best first, and one tap opens the build.

**Why this priority**: This is the feature. Everything else narrows or extends it.

**Independent Test**: Open search, type a word that appears mid-title in a known listed build, and
confirm that build is among the results and opens on selection.

**Acceptance Scenarios**:

1. **Given** search is open, **When** the player types "fast castle", **Then** listed builds whose
   title contains both words (in any order, any case) are shown, ranked so that the build most
   players would want comes first.
2. **Given** a title containing accents or non-Latin script (e.g. Chinese, Cyrillic), **When** the
   player types part of it, **Then** the build is found.
3. **Given** a query with a small typo ("fast catsle"), **When** no exact match exists, **Then** close
   matches are still offered.
4. **Given** a query that matches nothing, **When** results would be empty, **Then** the player sees
   a plain "no builds found" message with a way to browse all builds instead.
5. **Given** results are shown, **When** the player selects one, **Then** that build's page opens.
6. **Given** "french fast castle" is searched, **When** results appear, **Then** each build that has a
   Castle Age time shows it (estimated ones with "~"), so the player can compare them without
   opening any; builds without a time are still listed.

---

### User Story 2 - Find builds by author or civ (Priority: P1)

A player types an author's name ("Beasty") or a civ ("Rus", "HRE", "Abbasid") — alone or together with
title words ("rus beasty fc").

**Why this priority**: Authors and civs are how players talk about builds; a search that knows only
titles misses the commonest queries.

**Independent Test**: Type a known author's name and confirm their listed builds appear and their
author page is offered; type a civ's short or full name and confirm that civ's builds appear.

**Acceptance Scenarios**:

1. **Given** the query matches an author's name, **When** results appear, **Then** that author is
   offered as a result of its own, which opens their builds, alongside their matching builds.
2. **Given** the query is a civ's name, abbreviation or common nickname, **When** results appear,
   **Then** builds of that civ rank first, and the civ itself is offered as a result that opens its
   civ page.
3. **Given** a query mixing civ, author and title words, **When** results appear, **Then** only
   builds matching every word (in any of the three fields) are shown.
4. **Given** a build for "Any Civilization", **When** a civ is searched, **Then** it is not shown as
   that civ's build.

---

### User Story 3 - Unlisted builds stay out of search (Priority: P1)

An author unlists a build, or saves one as unlisted from the start. Searching for it finds nothing.

**Why this priority**: Spec 039 has already promised it to authors in the app's own words. Shipping
search that breaks the promise is worse than shipping no search.

**Independent Test**: Unlist a listed build; search its exact title on the author's device at once and
on another device after the next nightly rebuild (at most 24 hours); confirm it is absent in both.
Publish an unlisted build and confirm it becomes findable after the same rebuild.

**Acceptance Scenarios**:

1. **Given** a build that has never been listed, **When** anyone searches its title, **Then** it is
   never shown.
2. **Given** a listed build that is unlisted, **When** its author searches for it on the same device,
   **Then** it is not shown, immediately.
3. **Given** the same build, **When** anyone else searches for it, **Then** it is no longer shown at the latest 24 hours after the change
   (the next nightly rebuild).
4. **Given** a build that is deleted, **When** anyone searches for it after the next nightly rebuild, **Then** it is
   not shown; and **if** it is selected before then, the player lands on the usual "build not found"
   page, not an error.
5. **Given** a newly published build, **When** the next nightly rebuild has run (at most 24 hours), **Then** it can
   be found.

---

### User Story 4 - Search costs nothing to people who do not use it (Priority: P2)

A player who never opens search downloads nothing extra and the site loads exactly as fast as today.

**Why this priority**: Most visits go straight to a build or a civ. The index is useful only to the
fraction who search, and must not tax the rest.

**Independent Test**: Load the home page, a build page and a civ page with search unopened, and
confirm no index is requested; open search and confirm it is fetched once.

**Acceptance Scenarios**:

1. **Given** a visit that never opens search, **When** the page has loaded, **Then** no part of the
   index has been downloaded.
2. **Given** search is opened, **When** the index arrives, **Then** typing is answered from the device
   without further requests.
3. **Given** a player who opens search again the same day on the same device, **When** the index has
   not changed, **Then** it is not downloaded again.
4. **Given** the index is still downloading, **When** the player is already typing, **Then** a loading
   state is shown and the query is answered as soon as the index arrives, without retyping.

---

### User Story 5 - Search works with keyboard, touch and the back button (Priority: P2)

Search is reachable from every page, usable without a mouse on desktop, and behaves like the rest of
the app on a phone.

**Why this priority**: The site is used heavily on phones beside the game, and from the keyboard on a
second monitor; a search that only works with one of them would feel broken to the other.

**Independent Test**: On desktop, open search with "/" (or Ctrl+K), pick a result with the arrow keys
and Enter, and close with Escape. On an Android phone, open search, then press the system back button,
and confirm search closes without leaving the page.

**Acceptance Scenarios**:

1. **Given** any page on desktop, **When** the player presses the search shortcut (outside a text
   field), **Then** search opens with the cursor in the field.
2. **Given** results, **When** the player uses arrow keys and Enter, **Then** the highlighted result
   opens.
3. **Given** search is open on a phone, **When** the system back button is pressed, **Then** search
   closes and the underlying page stays (same as other overlays in the app).
4. **Given** a phone, **When** search opens, **Then** the field is focused and the keyboard appears,
   and results are not hidden behind it.

---

### Edge Cases

- **Index fails to load** (offline, blocked request): search says it cannot load right now and offers
  All Builds; the rest of the page is unaffected.
- **Index is older than expected** (scheduled rebuild failed): search still works from the last good
  index; the failure is reported as an error to the operator (error reporting, not a log line nobody
  reads), never shown to players. A stale index MUST NOT be replaced by an empty one.
- **Very short queries** (one character): no results until two characters. (No civ code or alias
  is a single character, so none is lost.)
- **Duplicate author names**: two contributors with the same display name appear as two author
  results, distinguished by build count.
- **Renamed author**: the index carries the name as of its last rebuild; a renamed author is found
  under the new name after the next nightly rebuild.
- **Clients where request attestation fails** (spec 039 / App Check notes): search must not depend on
  an attested database read to work at all.
- **Growth**: at twice today's builds the index must still meet the size target (SC-004).

## Requirements *(mandatory)*

### Functional Requirements

**Matching**

- **FR-001**: Search MUST match query words against build title, author name and civ (full name,
  abbreviation and the nicknames players commonly use), case-insensitively and ignoring accents.
- **FR-002**: Every query word MUST match at least one of those fields for a build to be shown
  (AND across words); word order MUST NOT matter.
- **FR-003**: Search MUST tolerate a single-character typo in words of five or more characters when
  exact matches are fewer than the visible result count.
- **FR-004**: Results MUST be ranked by match quality first (title starts with the query, whole title word, word prefix, substring, typo-tolerant),
  then by the build's current popularity score, so that among equal matches the build Trending would
  rank higher comes first.
- **FR-005**: Matching authors and civs MUST be offered as results of their own, opening the author's
  builds and the civ page respectively.
- **FR-006**: Search MUST show at most a bounded number of build results at once (default 20) and
  state how many builds match in total; when there are more, it MUST suggest adding a word or a civ
  to narrow the query. A full results page is out of scope (see FR-025).

**Listing state (spec 039)**

- **FR-007**: The index MUST contain listed builds only. Unlisted builds MUST never be written to it.
- **FR-008**: A change of listing state (listed → unlisted, deleted, unlisted → listed) MUST reach
  search for everyone within 24 hours.
- **FR-009**: On the device of the author who unlisted or deleted a build, that build MUST be hidden
  from search immediately.
- **FR-010**: If the index cannot be refreshed, search MUST keep serving the last good index; the
  rebuild MUST never publish an index that is empty or has fewer than half the builds of the previous
  one; such a run MUST be reported as an error.

**Delivery and cost**

- **FR-011**: The index MUST be downloaded only when a player opens search, never as part of loading
  any page.
- **FR-012**: A device MUST NOT download the index again while its copy is current. A cache
  revalidation that transfers no body (HTTP 304) is not a download.
- **FR-013**: Once downloaded, typing MUST NOT cause any further network request.
- **FR-014**: The index MUST NOT contain anything not already public on a listed build's page: no
  descriptions, steps, account identifiers beyond what author links already expose, or unlisted data.
- **FR-015**: Search MUST work for clients whose request attestation fails.
- **FR-016**: Producing the index MUST NOT add a recurring full read of all builds beyond those the
  system already performs.

**Interface**

- **FR-017**: Search MUST be reachable from every page at every width, and no entry may make the
  header wrap. Measured 2026-11-24 (decided with the owner): a labelled field-like button from lg up;
  a magnifier icon in the header at md, where "Add Build" becomes a "+" icon menu to make room when
  signed in; below md, a "Search" item in the phone bottom navigation, or in the menu on narrow
  desktop windows, because at 360px the header leaves ~18px beside the wordmark. It opens as an
  overlay on desktop and a full-screen sheet on phones.
- **FR-018**: The advertised shortcut is Ctrl+K (⌘K on a Mac), because K is the same key on every
  keyboard layout; "/" also opens search but is not advertised, since on a German layout it is
  Shift+7 (owner review 2026-11-24). Search MUST support a keyboard shortcut, arrow-key navigation, Enter to open and Escape
  to close on desktop.
- **FR-019**: On phones, the system back button MUST close search without leaving the page.
- **FR-020**: Each build result MUST show the civ flag, title, author and season, so two similarly
  named builds can be told apart without opening them.
- **FR-026**: Each build result MUST show the build's Feudal and Castle Age times where it has them
  (owner decision 2026-11-24: on prod 49% of builds have a Feudal time, 19% a Castle time, 2% an
  Imperial one, so Castle alone left half the timed builds blank), each marked
  as estimated the same way the rest of the app marks a worked-out time ("~"), and show nothing
  when it has none. A result without a time is never hidden or ranked lower for lacking one.
- **FR-021**: The search field MUST explain what can be searched (e.g. "Search builds, authors, civs").
- **FR-029**: Before anything is typed, search MUST show the top Trending builds (8), taken from the
  index, so a first open shows builds rather than an empty panel. No extra read.
- **FR-030**: No other field on a page may also be labelled "Search" for a narrower scope. The Home
  civ picker's field filters only its tiles, so it reads "Filter" with a filter icon (owner review
  2026-11-24: two "Search" fields a glance apart invited build queries into the civ filter).

**Non-goals**

- **FR-022**: Searching inside a build's steps or description is out of scope.
- **FR-023**: Search MUST NOT use a paid third-party search service.
- **FR-024**: Search engines' indexing of build pages (spec 033/039) is unchanged by this feature.
- **FR-025**: A search field on the All Builds page, or a full results page combining text search
  with the existing filters, is out of scope (decision document, layouts B and C).
- **FR-027**: Filtering or sorting results by age-up time (e.g. a "Castle before 9:00" control) is out
  of scope for this feature. The index carries Feudal and Castle times so a follow-up can add it without
  changing the index format; whether it does depends on how many listed builds have a time
  (logged by the nightly rebuild, FR-028).
- **FR-028**: Each rebuild MUST record how many listed builds have a Feudal and a Castle time and how many of
  those are estimated, so the follow-up in FR-027 can be decided on real coverage.

### Key Entities

- **Search index**: one compact record per listed build — id, title, author name, author id (for the
  author link), civ, season, popularity score, and Feudal and Castle Age times with whether each is
  estimated —
  plus a generation time. Rebuilt on a schedule; never contains unlisted builds.
- **Index generation time**: when the index was built; lets a device retire its own hide-list entries
  once the index no longer contains those builds.
- **Local hide list**: build ids the current author has unlisted or deleted on this device since the
  index was generated; applied over the index until a newer index arrives.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can find a known build from two words of its title in under 10 seconds from
  any page, on phone and desktop.
- **SC-002**: After the index has arrived, results update within 50 ms of a keystroke on a mid-range
  Android phone.
- **SC-003**: The first open of search shows results within 1.5 s on a typical 4G connection.
- **SC-004**: The compressed index stays under 400 KB at twice today's number of listed builds (it is ~177 KB today with Feudal and Castle times; the build ids alone are incompressible, research R3 and R10).
- **SC-005**: Zero unlisted builds appear in the index: guaranteed by the rebuild never writing an
  unlisted build (an automated check), and confirmed by a spot check at each rollout; a
  just-unlisted build is gone for other players within 24 hours and on the author's
  device immediately.
- **SC-006**: Visits that never open search download zero extra bytes.
- **SC-007**: The feature adds no more than €1 per month to the hosting bill at 1,000 search opens a
  day (see decision document §4 for the model).
- **SC-008**: Within a month of launch, the index is downloaded on average at least 100 times a day
  (a lower bound on searches, since repeat opens are served from the browser cache). The site has no
  analytics, so this is measured from the storage request count (research R8).

## Assumptions

- "(medium)" in the input is the effort estimate, not a priority.
- About 4,350 listed builds today, growing by a few hundred a season; the index format must hold
  ~10,000 without changing approach.
- The nightly scheduled job that already reads every build for Trending (spec 040) can also produce
  the index, which is what makes FR-016 achievable; if it cannot, a separate daily job with the same
  narrow read is the fallback.
- Author names in the index are display names as already shown on build cards; the author link uses
  the same identifier the existing "builds by author" link uses.
- Civ nicknames start with the set players already use in titles (e.g. HRE, OOTD, Abba, Delhi, Zhu
  Xi) and are maintained alongside the civ list.
- Search-open volume is unknown; costs are modelled per 1,000 opens a day and should be checked a month
  after launch.
- SC-008 is a usage signal, not a gate; adding analytics to measure search-to-visit conversion is out of scope.
