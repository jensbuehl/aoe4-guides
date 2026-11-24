# Feature Specification: Remix Lineage and Credit

**Feature Branch**: not yet created. Written on `042-vote-integrity` as its follow-up; create
`044-remix-lineage` when work starts. (`043` was taken the same day by Build Search.)

**Created**: 2026-11-24

**Status**: Draft

**Input**: Follow-up to spec 042. "Include 1–3 in a follow-up spec: (1) one-time backfill linking old
copies to their original, (2) show remixes on the original, (3) hide exact duplicates from lists and
rankings. How about giving remix points also to the original author or author's build?"

## Background

**How copies are made.** A build page has a **Remix** action that opens the editor on a copy of the
build. Until 2026-07-31 it was called *Duplicate*: it appended " - copy" to the title and recorded
nothing about where the build came from. Since then it records `remixOf` (the original's id, title and
author) and the copy shows a credit line linking the original under its title. A remix of your own
build gets no credit line.

**What a read-only measurement of production found (2026-11-24, 4,442 published builds).**

| | Builds | Published |
|---|---|---|
| Remixes carrying `remixOf` (since July) | 83 | 24 — only 1 with steps unchanged |
| Titles marking a copy (" - copy", "(copy)", "副本"), no `remixOf` | 590 | 467 |
| Steps *exactly* equal to an earlier build, no `remixOf` | 507 | 392 with the earlier one also published |

So the copy problem is the old, unlinked duplicates, not remixes. Examples: "2 TC ayyubid 'the beasty
build'" (4,328 views) has a "- copy" (929) and a "- copy - copy" (1,471) by two other players, none
linking the others; one player has published the same build four times. Views, likes and comments for
one build order are split across pages that nothing connects, the lists show the same build several
times, and the original's author is not credited.

**What it is not.** Builds titled "… – Copy for me to understand series" are one author's series of
transcriptions of well-known players' videos, with the video embedded and the player credited. Their
steps overlap 0–14% with any other build: they are original work, and this spec leaves them alone.

**Trending is barely affected** — 5 old copies in the top 50, none high — so this is about lists,
search, credit and search engines, not ranking fairness.

## Clarifications

### Session 2026-11-24

- Q: Should a remix give credit to the original? → A: Yes, to the original **build's** score, as an
  engagement signal like a like — counted server-side, once per remixing account, never passed through
  from the remix's own views. Weight **50**: below a like (100), above an upvote (25). A remix is rarer
  and more effort than a like, but it is not purely an endorsement — many remixes exist to change the
  build, or to study it privately. Source-code hosting draws the same line: a fork is counted, and
  shown, but ranks below a star. Passing a share of the remix's activity to the original (citation- or
  PageRank-style) was rejected: it double-counts, and it rewards making remixes of one's own builds.
- Q: Credit the original's *author* as well? → A: Not in this spec. The contributor leaderboard ranks
  by total views, and the build-level credit above already reaches the author through their build's
  place in Trending and All-time. "Your builds were remixed N times" on the author page is a cheap
  follow-up once remix counts exist.
- Q: Same-author duplicates: which one stays listed? → A: The one with the most all-time activity; the
  others are hidden as duplicates of it. For copies by *other* authors, the earliest is the original,
  whatever their views.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Old copies point at their original (Priority: P1)

A player opens "2 TC ayyubid 'the beasty build' - copy" and sees, under its title, "Remix of 2 TC
ayyubid 'the beasty build' by Patatasfritas", linking the original — exactly as a remix made today
shows it. Nobody had to add a link.

**Why this priority**: It fixes the attribution of ~390 published builds at once, needs no new
interface (the credit line exists), and every other story builds on knowing which build is the
original.

**Independent Test**: Run the one-time link on a copy of production data: every build whose steps
exactly equal an earlier build by another author now carries a link to the earliest such build; no
build by the same author is linked to itself; builds already carrying a link are untouched.

**Acceptance Scenarios**:

1. **Given** a build whose steps exactly equal an earlier build by another author, and which has no
   remix link, **When** the one-time link runs, **Then** it links to the earliest such build.
2. **Given** a build that already has a remix link, **Then** it is left unchanged.
3. **Given** a build that matches an earlier one only partly (a copy that was then edited), **Then** it
   is not linked automatically; it appears in a review list the owner can approve from.
4. **Given** the link runs twice, **Then** the second run changes nothing.
5. **Given** the earliest match has since been deleted, **Then** the next earliest surviving one is
   the original.

---

### User Story 2 - The original shows its remixes (Priority: P2)

On a build's page, a player sees "Remixed 3 times" and can open the list of remixes — the variants
other players built on it. The link now runs both ways.

**Why this priority**: Remixes are where a build gets improved or adapted; today they are invisible
from the build they came from.

**Independent Test**: Open an original with two published remixes and one unlisted one: the page says
"Remixed 2 times" and lists the two published ones; the unlisted one is not shown.

**Acceptance Scenarios**:

1. **Given** a build with published remixes by other players, **Then** its page shows how many and
   links each one.
2. **Given** a build with no remixes, **Then** nothing is shown.
3. **Given** unlisted remixes, or remixes by the build's own author, **Then** they are not listed.
4. **Given** a build whose only "remixes" are exact duplicates (Story 4), **Then** they are listed too —
   they are how readers who land on a copy find their way back.

---

### User Story 3 - A remix earns the original credit (Priority: P2)

When another player remixes a build, the original's Trending and All-time scores rise by the remix
weight, once per remixing account — the same way a like raises them.

**Why this priority**: A remix is a strong sign a build is worth building on, and today it earns the
original nothing while the copy may collect the views.

**Independent Test**: Run the scoring function on a fixture: an original with remixes by three
accounts, two by the same fourth account, and one by its own author scores 4 × 50 from remixes.

**Acceptance Scenarios**:

1. **Given** remixes of a build by N distinct other accounts, published or unlisted, **Then** the build
   is credited N × 50.
2. **Given** several remixes of one build by the same account, **Then** that account counts once.
3. **Given** a remix by the build's own author, **Then** it counts for nothing.
4. **Given** a remix that is deleted, or whose link is removed, **Then** its credit is withdrawn at the
   next scoring run.
5. **Given** the day remix credit is switched on (after Story 1 has linked ~500 old copies), **Then**
   no build's trend jumps: the baseline is re-taken as in spec 042's weight switch. All-time includes
   the credit straight away.

---

### User Story 4 - The same build appears once (Priority: P3)

Browsing lists, Trending, All-time and search shows each build order once. A published build whose
steps exactly equal another published build is shown only as that build; its own page still works,
shows its credit line, still appears in its author's My Builds, and tells search engines which page is
the original.

**Why this priority**: Clutter rather than harm, and it depends on Story 1's links.

**Independent Test**: With an original and two unchanged copies all published, the Builds list, the
civilisation pages, Trending and All-time each show the original only; each copy opens by its link
and shows "Remix of …".

**Acceptance Scenarios**:

1. **Given** a published build whose steps exactly equal an earlier published build by another author,
   **Then** it is left out of every list, ranking and search, and its page names the original as the
   canonical page for search engines.
2. **Given** several published builds with identical steps by the same author, **Then** only the one
   with the most all-time activity is listed.
3. **Given** the author of a hidden copy edits its steps, **Then** at the next daily run it is no longer
   a duplicate and is listed again.
4. **Given** the original is deleted or unlisted, **Then** at the next daily run the next one in line
   becomes the listed build.
5. **Given** the author of a hidden copy, **Then** they can see in My Builds that it is hidden as a
   duplicate of which build, and why.

---

### Edge Cases

- **A build with very few steps** (a stub, a one-line template) matching many others: fewer than five
  steps never counts as a copy, so trivial builds are not linked or hidden.
- **Copies across civilisations**: only builds of the same civilisation can be copies of each other.
- **A remix of a remix**: credit and the "remixed" list go to the direct parent only, as the credit
  line already does.
- **A chain of exact copies** (copy of a copy): all point at the earliest, not at each other.
- **Unlisted builds** neither count as originals for hiding (Story 4) nor appear in remix lists, but an
  unlisted original still receives remix credit and its copies still link to it.
- **A forged link**: a client can write any `remixOf` on its own build. That earns the target at most
  one remix credit per account (Story 3), the same bound as a like, and is not worth more.

## Requirements *(mandatory)*

### Functional Requirements

**Linking (one-time)**

- **FR-001**: A one-time job MUST give every build without a remix link, whose steps exactly equal an
  earlier build's of the same civilisation by another author (≥5 steps), a remix link to the earliest
  such build that still exists.
- **FR-002**: It MUST NOT change any other field, any build that already has a link, or any build
  whose match is by the same author.
- **FR-003**: It MUST run first as a dry run that reports what it would link, and be safe to re-run.
- **FR-004**: Partial matches (copy-marked title and a high share of identical steps, threshold set in
  planning) MUST be produced as a review list only; linking any of them is the owner's decision.

**Remix list**

- **FR-005**: A build page MUST show the number of published remixes by other authors and link each.

**Remix credit**

- **FR-006**: The scheduled scoring MUST credit each build 50 per distinct other account with a build
  (published or unlisted) linking to it, derived server-side from the links; no client writes a remix
  count.
- **FR-007**: Switching remix credit on MUST NOT register as activity in Trending (baseline re-taken,
  as spec 042 FR-024).

**Duplicates**

- **FR-008**: A daily job MUST mark each published build whose steps exactly equal an earlier published
  build (other author) or a more active one (same author) as a duplicate of it, and clear the mark when
  that stops being true.
- **FR-009**: Builds marked as duplicates MUST be left out of every browse list, the civilisation
  pages, Trending, All-time, the home page, search, the sitemap and the snapshot, and their page MUST
  declare the original as canonical.
- **FR-010**: My Builds MUST still show the author's duplicates, labelled with which build they
  duplicate.

### Key Entities

- **Remix link**: on a build, the original it was remixed from (id, title, author). Existing field;
  this spec backfills it and starts reading it server-side.
- **Duplicate mark**: on a build, which listed build it is an exact copy of. Set and cleared only by
  the daily job.
- **Remix credit**: per build, the number of distinct other accounts that remixed it. Written only by
  the scheduled job.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After the link, no published build exactly equals an earlier build by another author
  without crediting it (from 392 today).
- **SC-002**: No browse list or ranking shows two builds with identical steps.
- **SC-003**: Every build that has been remixed by another player says so on its page.
- **SC-004**: On the day remix credit is switched on, no build's trend rises by more than its genuine
  new activity.

## Assumptions

- "Exact copy" means the same steps in the same order — times, villager counts, resources and text —
  ignoring formatting. Measured that way, 507 builds match an earlier one.
- The daily trending job already reads every build, so detecting duplicates there costs no extra reads,
  only the extra size of reading steps.
- Remix credit uses spec 042's weighting and its baseline re-take, so 042 ships first.
- Contributor standings are unchanged by this spec.

## Dependencies

- Spec 042 (weights, baseline re-take on a weight change, the shared activity definition).
- Spec 039 (unlisted builds stay out of lists and search) — duplicates follow the same exclusions.
- Spec 043 (build search) — its index must leave duplicates out.

## Out of Scope / Follow-up

- Crediting the original's author on the contributor leaderboard or author page.
- Asking before publishing an unchanged remix (1 of 24 published remixes today).
- A "based on" field for transcriptions and manual copies made without Remix.
