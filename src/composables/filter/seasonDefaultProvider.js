import { ref } from "vue";

// Newest first — the build editor takes the first entry as the default season.
// Since Season 13, ranked seasons are no longer tied to updates: four
// three-month seasons a year, each starting on the 1st at 10:00 PT
// (Spring Mar, Summer Jun, Fall Sep, Winter Dec), per Update 16.1.9737. So the
// tagline is the time of year from then on, and the expansion released during
// the season, if any, gets its own field.
//
// A season ends where the next one starts (seasonEndDate below); only the
// newest needs an explicit endDate, since nothing follows it yet.
export const seasons = ref([
  {
    title: "Season 14",
    tagline: "Fall 2026",
    expansion: "Raiders of the North",
    startDate: new Date(2026, 8, 1),
    endDate: new Date(2026, 10, 30),
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
]);

/**
 * Looks a season up by the title a build stores ("Season 13").
 *
 * @param {string} title
 * @return {Object|null}
 */
export function getSeasonByTitle(title) {
  return seasons.value.find((s) => s.title === title) ?? null;
}

/**
 * The last day of a season: its own endDate, or the day before the next
 * season starts. Null for the newest season when it has no endDate.
 *
 * @param {Object} season - An entry of `seasons`.
 * @return {Date|null}
 */
export function seasonEndDate(season) {
  if (season.endDate) return season.endDate;
  const index = seasons.value.indexOf(season);
  const next = index > 0 ? seasons.value[index - 1] : null;
  if (!next) return null;
  const end = new Date(next.startDate);
  end.setDate(end.getDate() - 1);
  return end;
}

/**
 * Whether a season is running on the given day.
 *
 * @param {Object} season - An entry of `seasons`.
 * @param {Date} [now]
 * @return {boolean}
 */
export function isSeasonCurrent(season, now = new Date()) {
  const end = seasonEndDate(season);
  return now >= season.startDate && (!end || now < new Date(end.getTime() + 86400000));
}
