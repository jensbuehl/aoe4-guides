# Research: Season Rollover

Each decision below was checked against the code on `main` at `0b96ea9` and against the snapshot
`data/seo-snapshot.ndjson` (generated 2026-11-09).

## R1 — Where the logic lives

**Decision**: All of it goes in `src/composables/filter/seasonDefaultProvider.js`, which already owns the
season list and its date helpers. The two default call sites stop reading `seasons.value[0]` and call a new
`currentSeason()`.

**Checked**: the provider is imported in exactly five places: `BuildEditor.vue`, `FilterConfig.vue`,
`SeasonListItem.vue`, `SeasonToolTip.vue` and `useImportOverlayFormat.js`. Only two read `seasons.value[0]`
as a default: `BuildEditor.vue:473` and `useImportOverlayFormat.js:22`. `BuildImportDialog.vue:194` also
mentions `season`, but only for the preview row; it does not choose one. Remix (`BuildEditor.vue:905`,
`BuildDetails.vue:743`) copies the source build's season and stays as it is (spec, Out of Scope). Nothing in
`scripts/`, `functions/` or `aoe4-guides-api` reads the list. Prerender takes each build's season string
from the snapshot, so the Netlify Node 22.1.0 trap does not apply.

**Alternatives considered**: a separate `seasonSchedule.js` holding the pure logic. Rejected, because there
is only one consumer, and Node in CI can import the provider as it is (probed: it loads under Node 22.22
with module detection).

## R2 — How generation anchors: continue after the newest hand-written entry

**Decision**: The hand-written list stays exactly as it is, newest first. The generator looks at the newest
entry, works out where it ends, and adds one calculated season at a time until the next one would start
after today. A hand-written entry for a season after Season 14 is simply a longer hand-written list, so
generation continues after it. That is how FR-007's precedence works. No merging by title is needed.

**Rationale**: It is the simplest construction that satisfies FR-007. The owner writes a complete entry in
the same five-line shape as the existing ones. A partial "override" that only adds an expansion would save
three lines per expansion, about once a year, at the cost of merge logic and a second shape.

**Alternatives considered**: a map of partial overrides keyed by title and merged onto calculated seasons.
Rejected for the reason above.

## R3 — End dates and breaks in the schedule

**Decision**: A season ends on:

1. its own `endDate`, if the entry has one;
2. otherwise, the day before the next entry starts, if there is a next entry (this is today's rule, and it
   is what gives Season 13 its 31 August end);
3. otherwise, the day before the first scheduled start date (1 Mar / 1 Jun / 1 Sep / 1 Dec) that falls
   strictly after its own start.

A calculated season starts **the day after the previous one ends**. Under rule 3 it then runs to the next
scheduled start. So a break lengthens or shortens exactly one season, and the schedule takes over again from
the next quarter.

**Why the spec was amended**: the first draft of FR-007 said the season after a hand-written one starts "on
the first scheduled start date after" its end. Take a Season 15 that runs until 9 March. That wording puts
Season 16 on 1 June and leaves 10 March–31 May in no season at all, which contradicts SC-002. FR-007, US3
scenario 2 and US3's independent test now say "the day after it ends".

**Consequence**: Season 14's explicit `endDate: 2026-11-30` becomes redundant, because rule 3 gives the
same date. It is removed, together with the header comment's "only the newest needs an explicit endDate".
After this change an `endDate` means one thing only: this season broke the schedule.

## R4 — Computing every end once, at build time

**Decision**: `buildSeasons(now)` returns new objects, each with a resolved `endDate`. It never mutates the
hand-written entries. `seasonDateRange` and `isSeasonCurrent` read `season.endDate` directly.
`seasonEndDate` is removed: its only callers are inside the provider.

**Rationale**: Visibility filtering (R5) can hide the successor of the newest visible season, for example a
Season 15 written by hand before 1 December. Today `seasonEndDate` works out an end from the next entry *in
the visible list*. That would make the end disappear, and the "Since …" label would come back for the
running season (FR-009). So ends have to be resolved against the full list before any filtering. The
`Since …` branch in `seasonDateRange` can then never be reached, and it is deleted (constitution II: no
dead branches).

## R5 — Seasons that have not started are not listed

**Decision**: `buildSeasons(now)` drops every entry whose start is after `now`, whether calculated or
hand-written. Generation stops at the same boundary. `getSeasonByTitle` searches the visible list, so a
build labelled with a season that has not started, by a device whose clock is ahead, gets no dates in its
tooltip. That is the same treatment as a title the list does not know (spec, Edge Cases).

**Rationale**: FR-006. It is also the only thing that makes it safe to write a season in advance. Today a
hand-written future entry would immediately become the editor default and the newest filter option.

## R6 — Day boundaries: local calendar, calendar arithmetic

**Decision**: Dates stay local midnight (`new Date(y, m, d)`), as all fourteen entries already are. "Today
is inside a season" means `start <= now < the day after end`, and "the day after" is computed with
`setDate(getDate() + 1)`, not `+ 86400000`.

**Rationale**: The existing `isSeasonCurrent` adds 86,400,000 ms. On a daylight-saving transition day that
is an hour off. No season boundary falls on such a day: the boundaries are the last days of Feb, May, Aug
and Nov, while the EU switches on the last Sunday of Mar and Oct and the US on the second Sunday of Mar and
the first Sunday of Nov. But that is luck, not construction, and a hand-written off-schedule end could fall
on one. The spec's assumption that the 10:00 PT start hour is not modelled is unchanged.

## R7 — Title, tagline, and what a calculated season leaves out

**Decision**:

- Title: the newest entry's number plus one, read from `/Season (\d+)/`. "Season 14" gives "Season 15".
- Tagline: the season name by start month (2 → Spring, 5 → Summer, 8 → Fall, 11 → Winter), followed by the
  start year. Dec 2026 gives "Winter 2026", matching "Summer 2026" and "Fall 2026".
- `expansion`: absent. `SeasonToolTip` already handles entries without one, as Seasons 1–12 have none.

A calculated season that starts off the schedule (the one right after a break, R3) takes its name from
the quarter its start month falls in: Mar–May Spring, Jun–Aug Summer, Sep–Nov Fall, Dec–Feb Winter.
Winter takes the year of its December, so a season starting on 10 January 2027 is "Winter 2026". A lookup
keyed only on the four start months is not enough: prototyping it gave a January or February start no name
at all.

## R8 — The default when today is in no season

**Decision**: `currentSeason(list = seasons.value, now = new Date())` returns
`list.find(s => isSeasonCurrent(s, now)) ?? list[0] ?? <Season 1>`. With generation in place, the first
fallback is reached only when an app tab is left open across the start of a new season, and "the newest
started season" is the right answer then. The second fallback is reached only with a clock set before
7 April 2022, when the started-only filter (R5) leaves the list empty. It exists because the editor reads
`currentSeason().title` inside `setup()`, where `undefined.title` would throw and blank the editor behind a
green build (CLAUDE.md, Verification). Season 1 is resolved from the hand-written list, unfiltered.

`seasons` stays a `ref`, computed once when the module loads. No timer re-evaluates it. A tab left open
across midnight on a season's start day catches up when it is next loaded (spec, Edge Cases). Making it
tick would add a timer to every page for a case the author can correct in a visible field.

## R9 — Verification: a permanent `check:seasons` in CI

**Decision**: Add `scripts/check-seasons.mjs` (run as `npm run check:seasons`) and a step for it in
`.github/workflows/ci.yml`. It checks, for every day from 2026-09-01 to 2030-12-31:

- the full built list is contiguous: each season's end plus one day is the next season's start;
- no listed season starts after that day;
- exactly one listed season contains that day, and `currentSeason` returns it;
- titles are consecutive.

It also pins concrete cases: 2026-11-30 gives Season 14; 2026-12-01 gives Season 15 "Winter 2026", running
to 2027-02-28; 2028-02-29 is inside Winter 2027; Seasons 1–14 come out with the same dates as today.

**Rationale**: The failure this feature removes is silent and triggered by the date. It surfaces months
after the edit that caused it, on a day nobody is watching. A future hand-written break (R3) is exactly the
kind of edit that could introduce a gap. `check:plurals` is the precedent: a hand-edited list guarded in CI.
A throwaway harness would cover the code that ships now, but not the next edit to the list.

**Deploy safety**: the script imports from `src/`, so under CLAUDE.md's Netlify rule it is CI-only, the
same as `check:plurals`. It must never be added to the Netlify build command. CLAUDE.md's list of exempt
scripts gets this one added.

## R10 — No announcement

The feature has no visible surface beyond the correct season appearing on time. The home news card
(memory: one small news card) is for things players would notice, and this one should be unnoticeable.
