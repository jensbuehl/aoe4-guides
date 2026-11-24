# Feature Specification: Somewhere to Go From a Build Page

**Feature Branch**: `046-related-builds`

**Created**: 2026-11-24

**Status**: Implemented (1.24.0)

**Input**: User description: "Somewhere to go from a build page (small). Pre-rendered build pages are where search-engine visitors land, and the page ends at Discussion (BuildDetails.vue:291). Adding 'More English builds' and 'More by this author', using the existing BuildListCard, keeps those visitors on the site. Also assess the comments feature: is it used frequently? Seems like a dead feature to me."

## Why

Spec 033 made every public build a page a search engine can index, so a large share of first visits now start on a single build rather than on Home. That page is a dead end. It runs description → timeline → steps → video → Comments, and stops. A visitor who wanted *a* Rus build and landed on one they don't like has no next step except the browser's back button, which takes them back to the search results, not further into the site.

Two follow-ups are obvious from what the visitor already chose: the same civ, and the same author. Both are a single query the app already knows how to make, and both render with the card every list in the app already uses.

## Clarifications

### Session 2026-11-24

- Q: Where do the rails go, given the page ends at Comments? → A: **At the end of the page.** While this spec was being written, the owner decided to retire Comments entirely (spec 047). The data behind that decision is in 047. Once 047's app step ships, the rails close the page (FR-006).
- Q: Stacked rails, or one block with tabs like Home's lanes? → A: **Stacked.** Tabs would hide the author rail behind a click. On a phone they split the width in half, and "More by ‹long name›" cannot fit in half. A stacked header can truncate any name with an ellipsis, so there is nothing to tune. The cost, about 700px of extra page on a phone, falls only on readers who scroll that far (FR-014).

### Layout

```
 Header · Description · Age timeline · Build order · Video
 ──────────────────────────────────────────────────────────
  🏳 MORE ENGLISH BUILDS
 ┌────────┬────────────────────────────────┐
 │▒▒flag▒▒│ Fast Castle into Longbows      │   BuildListCard ×3
 └────────┴────────────────────────────────┘
          View all English builds ›             (full width below md)

  👤 MORE BY BEASTY
 ┌────────┬────────────────────────────────┐
 │▒French▒│ Royal Knight all-in            │   BuildListCard ×3, any civ
 └────────┴────────────────────────────────┘
          View all by Beasty ›
 ────────────────── end of page ───────────
```

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Another build for the same civ (Priority: P1)

A player searches for an English build, lands on one from Google and reads it. It isn't what they wanted. Below the steps they see **More English builds** with a few cards, and open the next one.

**Why this priority**: The visitor's civ is the one thing they certainly chose. This rail is relevant on every build page that has a civ.

**Independent Test**: Open any published build. Below the build order (and video, if any) a rail titled with the build's civ shows up to the configured number of other published builds of that civ. Clicking one opens it.

**Acceptance Scenarios**:

1. **Given** a published English build, **When** the page loads and the reader scrolls toward its end, **Then** a "More English builds" rail lists other published English builds, most popular first, using the same card as every other build list.
2. **Given** the build being read, **When** the rail is shown, **Then** that build is not in it.
3. **Given** a build for "Any civilization", **When** the rail is shown, **Then** it lists other any-civ builds under a title that reads naturally (e.g. "More builds for any civilization"), not "More Any Civilization builds".
4. **Given** the rail, **When** the reader wants more than it shows, **Then** a "View all" link opens that civ's page (`/civ/<slug>`). "Any civilization" has no civ page, so its link opens the dashboard filtered to `ANY`, the same place every other link to that civ goes.
5. **Given** a civ with no other published builds, **When** the page loads, **Then** the rail is not shown at all, rather than shown empty.

---

### User Story 2 - More from the same author (Priority: P2)

A player likes the build they're reading and wants to see what else its author wrote. Below the civ rail they see **More by Beasty** and open another build, of any civ.

**Why this priority**: A good build is evidence the author's other builds are good too, but it matters only when the author wrote more than one. Many authors have a single build.

**Independent Test**: Open a build whose author has other public builds. A rail titled with the author's name lists them. Open a build whose author has none and the rail is absent.

**Acceptance Scenarios**:

1. **Given** an author with other published builds, **When** the page loads, **Then** "More by <author>" lists them, most popular first, across all civs.
2. **Given** an author with no other published builds, **When** the page loads, **Then** the rail is absent.
3. **Given** a build that appears in both rails (same civ and same author), **When** both rails are shown, **Then** it is shown once, in the civ rail, and the author rail fills the space with the next build if there is one.
4. **Given** the author rail, **When** the reader wants all of the author's builds, **Then** a "View all" link opens the builds list filtered to that author.

---

### User Story 3 - The page stays fast and still (Priority: P1)

A reader who opens a build to follow it during a game never scrolls to the bottom. Loading the rails costs them nothing and never moves what they are reading.

**Why this priority**: The build order is the page's purpose. The rails are an extra, and an extra that slows the page or shifts it while someone reads is worse than no rails at all.

**Independent Test**: Open a long build and stay at the top. No rail query runs. Scroll down. Skeleton cards hold the rail's space before the data arrives. When they are replaced, nothing above the rails moves, and a full rail doesn't move at all.

**Acceptance Scenarios**:

1. **Given** a reader who doesn't scroll near the end of the page, **When** they use the page, **Then** neither rail's builds are fetched.
2. **Given** the rails come into view, **When** their data is loading, **Then** each rail shows skeleton cards for its full size, each exactly as tall as a loaded card. A full rail therefore loads without moving anything.
4. **Given** a rail that turns out shorter than its skeleton, or empty, **When** it settles, **Then** only content *below* it moves. Nothing the reader has already scrolled past shifts. Loading starts about a screen early, so this normally happens off-screen. The page can't know a rail's length before the query returns, so this is the honest limit of "no shift".
3. **Given** the data source refuses the read (App Check failed, offline), **When** a rail cannot load, **Then** it disappears quietly. No error is shown and the rest of the page is unaffected.

---

### Edge Cases

- **Unlisted builds** (spec 039): never appear in either rail. The build being read may itself be unlisted. The rails still show, because they list only public builds.
- **Drafts**: never appear.
- **Build with no civ set** (legacy data): civ rail is absent, author rail still applies.
- **Author with no name** (deleted account, spec 034): the author rail is absent, since there is no one to name.
- **Build page reached in-app from a list**: the rails still show. They are useful to any reader, not only those arriving from search.
- **Focus mode, editor, new-build route**: no rails. They belong to the read view only.
- **Clicking a rail card**: opens that build like any list card. The new page starts at the top and its own rails reflect the new build.
- **Back from the opened build**: returns to the previous build, at the position the reader left (the router restores saved positions). The page's "came from a list" check is used only after a delete, and it never lists `/builds/:id` (research R7).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The build read view MUST show a rail of other published builds of the same civ, titled with the civ's display name, when at least one exists.
- **FR-002**: The build read view MUST show a rail of other published builds by the same author, titled with the author's display name, when at least one exists.
- **FR-003**: Each rail MUST show at most a fixed small number of builds (default 3; one constant governs both), ordered by the same popularity score the Popular list uses, and MUST exclude the build being read.
- **FR-004**: A build MUST NOT appear in both rails. Where they overlap, the civ rail keeps it.
- **FR-005**: Each rail MUST use the existing `BuildListCard` and link to builds the same way the existing lists do, so cards look and behave identically everywhere.
- **FR-006**: The rails MUST sit after the build order and video, and close the page. If this ships before spec 047's app step, the rails go above Comments.
- **FR-007**: Each rail MUST offer a "View all" link: the civ page for the civ rail, the author-filtered builds list for the author rail.
- **FR-008**: Rail data MUST NOT be fetched until the rails approach the viewport.
- **FR-009**: While loading, each eligible rail MUST show its header and a full rail of skeleton cards at the card's measured per-breakpoint height. A rail that comes back shorter or empty MAY move only content below it (US3-AS4).
- **FR-010**: A rail that fails to load or comes back empty MUST be removed without an error message and without affecting the rest of the page.
- **FR-011**: The civ rail SHOULD fall back to the public API when Firestore refuses the read, as civ lists already do. The author rail has no such fallback. The `/api` proxy is narrow by design and MUST NOT be widened for this feature.
- **FR-012**: Drafts and unlisted builds MUST never appear in either rail.
- **FR-013**: The rails MUST NOT appear in focus mode, the editor, or the new-build route.
- **FR-014**: The rails MUST be stacked, civ rail first, each under the page's section header (icon plus uppercase caption, as on Description and Video). The cards are not wrapped in a surrounding card. The "View all" exit is the Home lanes' button (`BuildLaneTabs`): text style, `rounded="lg"`, full width below md and natural width from md up. Both MUST be the **same component** the existing pages use, not a copy (constitution III). The header is shared by five files today as pasted markup plus a pasted scoped rule. A sixth paste would render unstyled, because the rule is scoped. So both are extracted first (plan: `SectionHeader`, `ViewAllButton`).
- **FR-015**: A long civ or author name MUST truncate with an ellipsis, on one line, in both the header and the "View all" label. It must never wrap or overflow, at any width down to 360px.

### Key Entities

- **Rail**: a titled, short list of build cards with a "View all" link, derived from one attribute of the build being read (civ or author). Its only state is where it is in loading (not yet near, loading, shown, hidden) and the builds it shows. See data-model.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a build whose civ and author both have other public builds, a reader reaches another build in one click from the end of the steps.
- **SC-002**: A reader who stays at the top of a build page causes no additional database reads compared with today.
- **SC-003**: At 360, 393, 960 and 1280 px widths, light and dark (verified with the ux-gate rig), loading the rails moves nothing above them, and a full rail moves nothing at all.
- **SC-004**: A reader scrolling to the rails costs at most two small queries and 11 document reads on each build page view. The author rail over-fetches to fill its three places after dropping duplicates (research R4). Opening a rail card then costs no read, because the build is already cached.

## Assumptions

- **Branch.** When this spec was written, the shared working tree was on 042 with another session's uncommitted work, so 046 was built in its own worktree (`../aoe4-guides-046`) on `046-related-builds`, off `main` at 1.23.0.
- **"Most popular" means the `score` order** the Popular list and civ pages already use (spec 040). No new ranking is introduced.
- **The author filter already exists** on `/builds`. `?author=` takes the author's **uid** (research R1), so the "View all" link needs no new list.
- **Indexes**: none new. Both rail queries merge existing single-field-plus-score indexes, and they match what civ pages and `/builds?author=` already run (research R2).
- **The rails are client-rendered.** The prerendered page (spec 033) carries head tags, not body content, so the rails don't add crawlable links. Static "related builds" links in the prerendered HTML would help crawling and are a possible follow-up, out of scope here.

## Out of Scope

- Retiring Comments. That is spec 047, which has its own deploy sequence and data deletion. The two can ship in one release.
- Personalised or "similar build" recommendations beyond civ and author.
- Measuring whether search visitors now stay longer. The site collects no analytics that could show it. If the owner wants this outcome measured, a signal has to be chosen first.
- An author profile page.
