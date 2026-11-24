import { ref } from "vue";

// THE SEASON LIST LARGELY KEEPS ITSELF. Read this before adding an entry.
//
// Since Season 13, ranked seasons are no longer tied to updates: four
// three-month seasons a year, each starting on the 1st at 10:00 PT (Spring Mar,
// Summer Jun, Fall Sep, Winter Dec), per Update 16.1.9737. Season 14 was the
// first on that schedule, so every season after the newest entry below is
// calculated: numbered on, named after its time of year, dated by the schedule.
// Season 15 appears on 1 December 2026 without anyone touching this file.
//
// Write an entry only to
//   - name the expansion released during a season (tagline + expansion), or
//   - record a break in the schedule: give the season the dates it really had.
//     `endDate` means exactly that, "this season did not end on schedule". The
//     season after it starts the next day and runs to the next scheduled start,
//     so a break stretches or shortens one season and the schedule resumes.
// An entry may be written ahead of time: no season is listed, offered or used
// as a default before its start day.
//
// Without an endDate, a season ends the day before the next entry starts, or,
// for the newest, the day before the next scheduled start.
//
// After any edit, run `npm run check:seasons`. A gap or an overlap here shows up
// only on the day a season starts, months after the edit that caused it.
//
// Newest first. Never mutated: buildSeasons copies.
const HAND_WRITTEN = [
  {
    title: "Season 14",
    tagline: "Fall 2026",
    expansion: "Raiders of the North",
    startDate: new Date(2026, 8, 1),
  },
  {
    title: "Season 13",
    tagline: "Summer 2026",
    expansion: "Yue Fei's Legacy",
    startDate: new Date(2026, 4, 7)
  },
  {
    title: "Season 12",
    tagline: "Dynasties of the East",
    startDate: new Date(2025, 10, 30)
  },
  {
    title: "Season 11",
    tagline: "Trade Secrets",
    startDate: new Date(2025, 7, 2)
  },
  {
    title: "Season 10",
    tagline: "Knights of Cross and Rose",
    startDate: new Date(2025, 4, 8)
  },
  {
    title: "Season 9",
    tagline: "Hallow's Hearth",
    startDate: new Date(2024, 10, 23)
  },
  {
    title: "Season 8",
    tagline: "Summer Sights",
    startDate: new Date(2024, 7, 18)
  },
  {
    title: "Season 7",
    tagline: "Spring Tournaments",
    startDate: new Date(2024, 3, 20)
  },
  {
    title: "Season 6",
    tagline: "The Sultans Ascend",
    startDate: new Date(2023, 11, 14)
  },
  {
    title: "Season 5",
    tagline: "Map Monsters: Summer Party Edition",
    startDate: new Date(2023, 6, 15)
  },
  {
    title: "Season 4",
    tagline: "Enchanted Grove",
    startDate: new Date(2023, 1, 16)
  },
  {
    title: "Season 3",
    tagline: "Anniversary Update",
    startDate: new Date(2022, 9, 25)
  },
  {
    title: "Season 2",
    tagline: "Map Monsters",
    startDate: new Date(2022, 6, 12)
  },
  {
    title: "Season 1",
    tagline: "Festival of Ages",
    startDate: new Date(2022, 3, 7)
  },
];

/** Months (0-based) a scheduled season starts in, on the 1st. */
const SCHEDULED_START_MONTHS = [2, 5, 8, 11];

/**
 * A date moved by whole calendar days, at local midnight.
 *
 * Calendar arithmetic, not milliseconds: a day is 23 or 25 hours across a
 * daylight-saving change, and `+ 86400000` lands an hour off midnight there.
 *
 * @param {Date} date
 * @param {number} days
 * @return {Date}
 */
function addDays(date, days) {
  const moved = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  moved.setDate(moved.getDate() + days);
  return moved;
}

/**
 * The first scheduled season start (1 Mar, 1 Jun, 1 Sep or 1 Dec) strictly
 * after the given day.
 *
 * @param {Date} date
 * @return {Date}
 */
function nextScheduledStart(date) {
  for (let year = date.getFullYear(); ; year++) {
    for (const month of SCHEDULED_START_MONTHS) {
      const start = new Date(year, month, 1);
      if (start > date) return start;
    }
  }
}

/**
 * The time-of-year name for a season starting on the given day: the quarter the
 * start month falls in. Winter takes the year of its December, so a season
 * that starts off schedule in January 2027 is still "Winter 2026".
 *
 * @param {Date} start
 * @return {string}
 */
function scheduledTagline(start) {
  const month = start.getMonth();
  if (month <= 1) return `Winter ${start.getFullYear() - 1}`;
  const name = month <= 4 ? "Spring" : month <= 7 ? "Summer" : month <= 10 ? "Fall" : "Winter";
  return `${name} ${start.getFullYear()}`;
}

/**
 * Every season that has started by `now`, newest first, each with its end date
 * resolved: the hand-written entries, continued on the schedule.
 *
 * Ends are resolved against the whole list before anything is hidden. A season
 * written ahead of time still decides where the one before it ends, even while
 * it is itself not listed yet.
 *
 * @param {Date} [now]
 * @param {Object[]} [hand] - Newest first. Defaults to the list above; the
 *   check script passes made-up ones.
 * @return {Object[]}
 */
export function buildSeasons(now = new Date(), hand = HAND_WRITTEN) {
  const list = hand.map((season, i) => ({
    ...season,
    endDate:
      season.endDate ??
      (i > 0 ? addDays(hand[i - 1].startDate, -1) : addDays(nextScheduledStart(season.startDate), -1)),
  }));

  for (;;) {
    const newest = list[0];
    const startDate = addDays(newest.endDate, 1);
    if (startDate > now) break;
    list.unshift({
      title: `Season ${Number(newest.title.match(/Season (\d+)/)[1]) + 1}`,
      tagline: scheduledTagline(startDate),
      startDate,
      endDate: addDays(nextScheduledStart(startDate), -1),
    });
  }

  return list.filter((season) => season.startDate <= now);
}

/**
 * Every season that had started when the page loaded. Rebuilt on each load, so
 * a new season appears with no deploy; a tab left open across a season's first
 * day picks it up on the next load.
 */
export const seasons = ref(buildSeasons());

/**
 * Whether a season is running on the given day.
 *
 * @param {Object} season - An entry of `seasons`.
 * @param {Date} [now]
 * @return {boolean}
 */
export function isSeasonCurrent(season, now = new Date()) {
  return now >= season.startDate && now < addDays(season.endDate, 1);
}

/**
 * The season a new build starts in: the one running today.
 *
 * Falls back to the newest started season (a tab left open across a season's
 * first day), and to Season 1 when none has started (a clock set before
 * April 2022). It never returns undefined: the editor reads `.title` from it in
 * setup(), where a throw blanks the page behind a green build.
 *
 * @param {Object[]} [list] - Defaults to `seasons`.
 * @param {Date} [now]
 * @return {Object}
 */
export function currentSeason(list = seasons.value, now = new Date()) {
  return (
    list.find((season) => isSeasonCurrent(season, now)) ??
    list[0] ??
    buildSeasons(HAND_WRITTEN.at(-1).startDate).at(-1)
  );
}

/**
 * Looks a season up by the title a build stores ("Season 13"). Null for a title
 * the list does not know, or for a season that has not started yet.
 *
 * @param {string} title
 * @return {Object|null}
 */
export function getSeasonByTitle(title) {
  return seasons.value.find((s) => s.title === title) ?? null;
}

const md = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const mdy = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/**
 * A season's dates as one label: "May 7 – Aug 31, 2026", or with both years
 * when it spans a new year ("Dec 1, 2026 – Feb 28, 2027").
 *
 * @param {Object} season - An entry of `seasons`.
 * @return {string}
 */
export function seasonDateRange(season) {
  const { startDate, endDate } = season;
  return startDate.getFullYear() === endDate.getFullYear()
    ? `${md(startDate)} – ${mdy(endDate)}`
    : `${mdy(startDate)} – ${mdy(endDate)}`;
}
