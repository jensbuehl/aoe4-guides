# Feature Specification: Season Rollover

**Feature Branch**: `041-season-rollover` (named explicitly so it matches the spec folder)

**Created**: 2026-11-24

**Status**: Draft

**Due**: before 2026-12-01, when Season 15 starts

**Input**: User description: "Roll seasons over automatically (small, due before Dec 1). The editor takes
seasons[0] as the default (BuildEditor.vue:473). Pick the season whose dates include today instead. Since
seasons now run on a fixed quarterly schedule, the next entry can be generated rather than added by hand.
Whether to relabel those 75 builds is your call, since it means changing authors' data."

## Background

**What goes wrong today.** A new build is labelled with whichever season is newest in the site's
hand-kept season list. It does not matter whether that season is actually running. So the label is only
right while someone remembers to add each new season on the day it starts. Season 14 began on
1 September 2026 but was added on 25 October. For those eight weeks every new build was labelled
Season 13 by default.

**How many builds it affected.** These figures come from the published-build snapshot of 9 November 2026,
which has 4,348 builds:

| Builds created since 1 Sep 2026 | Count |
|---|---|
| Labelled Season 14 | 26 |
| Labelled Season 13 | **75** |
| — of which created before Season 14 existed in the editor (by 25 Oct) | 64, from 51 authors, no author more than 4 |
| — of which created after Season 14 became the default | 11 |
| Other / no season | 9 |
| **Total** | 110 |

So 68% of the builds created in Season 14 carry the previous season's label. In Seasons 12 and 13, when
the list was up to date, 6–9% of new builds carried an older label. That rate is the background level of
authors picking an older season on purpose, or remixing an older build.

**What changed in the game.** Since Update 16.1.9737, ranked seasons are no longer tied to game updates.
There are four three-month seasons a year, each starting on the 1st of March, June, September and
December. Season 14 (Fall 2026) was the first to run on that schedule. A season list that can be worked
out from the calendar no longer needs anyone to remember to update it.

## Decision: existing labels stay as authors saved them

The 75 builds are **not relabelled**. This feature changes which label a build *starts* with, never a label
that has already been saved. The reasons:

1. **A stale default and a deliberate choice look the same in the data.** From 1 September to 25 October,
   "Season 13" was what the editor suggested. An author who accepted the default and one who picked
   Season 13 on purpose saved the same value, and nothing stored tells them apart. A bulk rewrite would
   overwrite the deliberate picks along with the accidental ones. On the evidence of earlier seasons, about
   one build in ten carries an older season on purpose.
2. **The other 11 were chosen.** Season 14 was already the default when they were made, so their label came
   from the author, from a remix (which keeps the original build's season), or from a draft or an open app
   started before the change. Seven of them came in the first week after the change, which fits the last
   two. None of the 11 could be relabelled on the grounds that the default was wrong.
3. **Authors already manage this label themselves.** Most of the builds labelled Season 13 but created
   before it started are older builds whose authors moved them forward to the new season. That shows the
   label works as the author's statement of which season the build is for. It is not a timestamp the site
   owns.
4. **Relabelling would gain almost nothing.** Season 14 ends on 30 November. After that, Season 13 and
   Season 14 are both past seasons. Relabelling would only move these builds from one past-season filter to
   another. Lists show every season unless a visitor picks one, so none of these builds is hidden today.
5. **The fix is to stop it happening again.** A wrong label costs a build its place in its own season's
   filter, and the author can correct it in the editor at any time. What this feature has to guarantee is
   that no later season starts with the same problem.

If relabelling is ever wanted, it should be something authors confirm for their own builds. The site
should not change their builds for them. That is out of scope here.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A new build starts in the season that is running today (Priority: P1)

An author starts a new build. The Season field already shows the season that is running today. It does not
show the newest season someone happened to add to the list, and it does not show a season that has not
started yet. The author can still change it, exactly as now.

**Why this priority**: This is the label that went wrong for eight weeks. Every other part of the feature
exists so that this default is right on every day of the year.

**Independent Test**: Set the date to a day inside any season and open a new build. The Season field shows
the season whose dates include that day. Repeat on the first and last day of a season. Repeat with a season
in the list that has not started yet: it must not be the default.

**Acceptance Scenarios**:

1. **Given** today is 24 November 2026 (inside Season 14), **When** an author opens a new build, **Then**
   the Season field shows Season 14.
2. **Given** today is 1 December 2026, **When** an author opens a new build, **Then** the Season field
   shows Season 15.
3. **Given** a season has been entered by hand ahead of its start date, **When** an author opens a new build
   before that date, **Then** the default is still the season running today.
4. **Given** an author imports a build from a file that names no season, **When** the import opens in the
   editor, **Then** it gets the season running today, the same as a new build.
5. **Given** an author edits an existing build, remixes a build, or restores a saved draft, **When** the
   editor opens, **Then** the season already stored in it is kept unchanged.

---

### User Story 2 - Each new season appears on its start day without anyone touching the site (Priority: P1)

On 1 December, 1 March, 1 June and 1 September, the new season appears everywhere seasons are shown: the
editor's season picker, the season filter on build lists, and the date tooltip on a build's season chip.
It has its number, its name (for example "Winter 2026"), its dates, and it is marked as the current season.
Nobody needs to change the code, publish an update or edit any data for this to happen.

**Why this priority**: Without this, User Story 1 can only choose from the seasons someone remembered to
add. On 1 December there would be no season that includes the date. Both stories are needed for
1 December, and this one is what removes the manual step for good.

**Independent Test**: Set the date to 1 December 2026, then to 1 March 2027, 1 June 2027 and a few later
season starts. On each date, open the editor and the build list filter. The new season is listed with
the right number, name and dates. No later season is listed. The previous season shows its final end date.

**Acceptance Scenarios**:

1. **Given** today is 1 December 2026, **When** a visitor opens the season filter, **Then** "Season 15" is
   listed, described as Winter 2026, running 1 December 2026 to 28 February 2027, and marked current.
2. **Given** today is 30 November 2026, **When** a visitor opens the season filter, **Then** Season 15 is not
   listed and Season 14 is marked current.
3. **Given** today is 1 March 2027, **When** a visitor opens the season filter, **Then** Seasons 15 and 16
   are both listed, Season 16 (Spring 2027) is marked current, and Season 15 shows the end date
   28 February 2027.
4. **Given** builds have been saved with the label "Season 15", **When** a visitor filters the build list by
   Season 15, **Then** those builds are shown, the same as for any season entered by hand.

---

### User Story 3 - The owner can still describe a season by hand (Priority: P3)

The site owner can still write an entry for a season by hand. This is for adding the expansion that
launched during it, renaming it, or recording dates when the game breaks its own schedule. The hand-written
entry replaces the calculated one for that season. Seasons after it continue to be calculated from where it
ends.

**Why this priority**: The schedule will usually hold, so this is rarely needed. But without it, one delayed
season would make every season after it wrong, with no way to correct them. It also means Season 15 can
still be added the old way if this feature misses its deadline.

**Independent Test**: Add a hand-written Season 15 that names an expansion. Check that it appears with that
expansion and no second Season 15 appears. Then give it an end date that is off the schedule. Check that
Season 16 starts the day after that end and finishes on the day before the next scheduled start, and that
no day belongs to two seasons or to none.

**Acceptance Scenarios**:

1. **Given** Season 15 is written by hand with an expansion name, **When** it is shown, **Then** it appears
   once, with that expansion, and its dates follow the schedule unless the entry sets its own.
2. **Given** a hand-written Season 15 ends on 9 March 2027 instead of 28 February, **When** the following
   seasons are calculated, **Then** Season 16 runs from 10 March to 31 May 2027, Season 17 starts on
   1 June 2027, and every day belongs to exactly one season.
3. **Given** Season 15 is written by hand before 1 December, **When** a visitor opens the site before
   1 December, **Then** Season 15 is not shown and is not the default.

---

### Edge Cases

- **The first and last day of a season.** A season includes both its start day and its end day. Seasons
  change at the start of the visitor's own calendar day. The game's actual start time, 10:00 Pacific time,
  is not modelled. This matches the date labels the site already shows ("Sep 1 – Nov 30, 2026").
- **Winter spans two years.** Winter starts on 1 December and ends on the last day of February, including
  29 February in a leap year (Winter 2027 ends 29 February 2028).
- **The app stays open past midnight on a season's first day.** A new build opened before midnight keeps
  the default it was opened with. The season list catches up the next time the site is loaded. The author
  can see the Season field and change it.
- **A draft started in the old season and published in the new one** keeps the season it was drafted with.
  A draft restores what the author had on screen, and this feature does not rewrite saved choices.
- **The device clock is wrong.** The season shown is worked out from the visitor's own clock. A clock set
  ahead could label a build with a season that has not started yet. The label is still a real season title
  and becomes correct on its own once that season starts. A clock set before Season 1 leaves no season
  started, so the list is empty and the default falls back to Season 1. The editor must still open.
- **The game breaks the schedule** (delays, shortens or skips a season). The owner writes that season by
  hand with its real dates (User Story 3). Calculated seasons until then may be wrong, and the hand-written
  entry corrects them.
- **Season 13 is off the schedule** (it started on 7 May and ran until Season 14). Every season up to and
  including Season 14 stays hand-written exactly as now, and only seasons after the last hand-written one
  are calculated.
- **A build carries a season the list does not know.** Two builds in the snapshot do: "Raiders of the North
  DLC" and "Season 9 (2026)", both from imported files. They keep showing their label as now, with no dates.
  Nothing in this feature adds or removes such labels.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A new build MUST start with the season whose dates include today's date, as the visitor's
  device sees it. It MUST NOT start with the newest season in the list just because it is newest.
- **FR-002**: Every place where the site chooses a season for the author MUST use the same rule. Today
  those places are starting a new build and importing a build file that names no season.
- **FR-003**: If no season includes today, the default MUST be the newest season that has already started.
  If none has started, the default MUST be Season 1. There is always a default.
- **FR-004**: Seasons MUST follow the quarterly schedule from Season 14 onward. Season 14 is the last one
  written by hand, and Season 15 is the first one calculated. Each season starts on 1 March
  (Spring), 1 June (Summer), 1 September (Fall) or 1 December (Winter), and ends on the day before the next
  one starts.
- **FR-005**: Each scheduled season after the last hand-written one MUST appear on its own once its start
  day arrives. It is numbered one higher than the season before it, named after the time of year and the
  year it starts in ("Winter 2026", "Spring 2027"), and has start and end dates.
- **FR-006**: No season, hand-written or calculated, may be offered in the editor, listed in a filter, or
  chosen as a default before its start day.
- **FR-007**: A hand-written season MUST replace the calculated one with the same number. It may add an
  expansion name, change the name, or set its own start and end dates. The season after it MUST start the
  day after it ends and run until the next scheduled start date. From then on the schedule resumes, so a
  break shortens or lengthens one season and never leaves a gap or an overlap.
- **FR-008**: Calculated seasons MUST work the same as hand-written ones everywhere seasons appear: the
  editor picker, the build-list season filter and its chips, the season chip on a build, its date tooltip
  and "current" marker, and filtering builds by season.
- **FR-009**: Every listed season MUST show its end date, including the season running now. Once the
  schedule is known, the open-ended "Since …" label is no longer used for any season on it.
- **FR-010**: A new season MUST appear without any change to the code, any new release of the site, or any
  change to stored data.
- **FR-011**: Season labels already saved on builds MUST NOT be changed by this feature. This covers the
  75 builds described above. Editing a build, remixing a build and restoring a draft MUST keep the season
  already in it.
- **FR-012**: Every season up to and including Season 14 MUST keep its current number, name, expansion
  and dates.

### Key Entities

- **Season**: a named ranked-season window. It has a number-based title ("Season 15"), a name or time of
  year ("Winter 2026"), an optional expansion released during it, a start day and an end day. It is either
  hand-written by the owner or calculated from the schedule. Seasons do not overlap and leave no gaps.
- **Season schedule**: the rule seasons follow since Season 14. There are four seasons a year starting on
  the 1st of March, June, September and December, named Spring, Summer, Fall and Winter.
- **A build's season label**: the season title an author saved on a build. It belongs to the author. The
  site suggests it when a build is first made and never changes it afterwards.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On 1 December 2026, and on every later season start, a build created that day starts labelled
  with the new season. Nobody has to change the site or its data between this feature's release and that
  day.
- **SC-002**: Every day from 1 September 2026 to 31 December 2030 is checked one by one. Each day belongs to
  exactly one season, and the default for a new build on that day is that season. All 1,583 days must
  pass.
- **SC-003**: Over the same range, no season is listed or offered on any day before it starts.
- **SC-004**: At the first snapshot after Season 15 has run for a month, the share of builds created in
  Season 15 that carry an older label is no higher than the 6–9% seen in Seasons 12 and 13. In Season 14
  it was 68%.
- **SC-005**: Adding a season by hand is no longer needed for any season that follows the schedule. The
  owner edits the season list only to add an expansion name or to record a break in the schedule.
- **SC-006**: Working out the seasons and today's default adds no database reads or writes and no network
  requests. The answer is the same whether the visitor is signed in, offline, or using the site's fallback
  data path.

## Assumptions

- The quarterly schedule from Update 16.1.9737 continues: Season 15 starts on 1 December 2026 and each later
  season starts three months after the one before.
- A season's name uses the year it starts in, so Winter 2026 runs from December 2026 to February 2027. This
  follows the existing "Summer 2026" and "Fall 2026". Winter always takes the year of its December, even for
  a season that starts off the schedule in January or February. If the game names it differently, the owner can fix it
  with a hand-written entry (FR-007).
- Seasons are numbered one after another with no gaps.
- Dates are counted in whole days in the visitor's own calendar, the same way the season date labels
  already are. The 10:00 Pacific start time is not used.
- The visitor's device clock is trusted. A clock is not worth a server request in a feature whose whole
  point is to work out the season without asking anyone.
- Season 14's hand-written end date, 30 November 2026, matches the schedule, so Season 15 follows straight
  on.
- **Deadline fallback**: if this feature has not shipped by 30 November, Season 15 is added by hand the old
  way. FR-007 makes that entry compatible with this feature when it does ship, so missing the date costs
  one manual entry and no wrongly labelled builds.

## Out of Scope

- Relabelling existing builds, either in bulk or through an author-confirmed prompt (see the Decision
  above).
- Changing which season a remix starts with. A remix keeps the original build's season, as it does now.
- Checking or cleaning season labels from imported files that do not match a known season.
- Telling authors that a new season has started, or asking them to update their builds.
- Using the game's exact start time (10:00 Pacific) or a server clock in place of the visitor's calendar
  day.
