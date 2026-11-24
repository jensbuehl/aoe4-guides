// Guards the season list, which mostly calculates itself and is edited rarely.
//
// Seasons after the newest hand-written entry in seasonDefaultProvider.js are
// worked out from the quarterly schedule, and a new build starts in the season
// whose dates include today. What can go wrong is quiet and dated: an entry
// with a stray endDate, a skipped number or a start in the wrong month opens a
// gap or an overlap that nobody sees until the day a season starts, months
// after the edit. On that day new builds pick up the wrong label, which is how
// 75 builds came to be labelled Season 13 during Season 14 (spec 041).
//
// So this walks every day from the start of the schedule to the end of 2030 and
// checks that exactly one season holds it, plus a few pinned dates and made-up
// hand-written lists for the cases the owner might write.
//
// CI-ONLY. It imports from src/, which Netlify's Node 22.1.0 cannot load (see
// CLAUDE.md). Never add it to the Netlify build command.
//
// Usage:
//   node scripts/check-seasons.mjs
//
// Exits 1 on any failure.
import {
  buildSeasons,
  currentSeason,
  isSeasonCurrent,
  seasonDateRange,
} from "../src/composables/filter/seasonDefaultProvider.js";

const failures = [];
const fail = (message) => failures.push(message);
const day = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min);
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const nextDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
const num = (s) => Number(s.title.match(/Season (\d+)/)[1]);

function expectEqual(label, actual, expected) {
  if (actual !== expected) fail(`${label}: expected ${expected}, got ${actual}`);
}

/** The data-model invariants for one built list on one day. */
function checkList(list, now, label) {
  list.forEach((season, i) => {
    if (season.startDate > now) fail(`${label}: ${season.title} listed before it starts (${iso(season.startDate)})`);
    if (!(season.endDate instanceof Date)) fail(`${label}: ${season.title} has no end date`);
    const older = list[i + 1];
    if (!older) return;
    if (iso(nextDay(older.endDate)) !== iso(season.startDate)) {
      fail(`${label}: ${older.title} ends ${iso(older.endDate)} but ${season.title} starts ${iso(season.startDate)}`);
    }
    if (num(older) + 1 !== num(season)) fail(`${label}: ${older.title} is followed by ${season.title}`);
  });
  const holding = list.filter((s) => isSeasonCurrent(s, now));
  if (holding.length !== 1) {
    fail(`${label}: ${holding.length} seasons contain ${iso(now)} (${holding.map((s) => s.title).join(", ")})`);
  } else if (currentSeason(list, now) !== holding[0]) {
    fail(`${label}: currentSeason is not ${holding[0].title}`);
  }
}

/** Every day from 2026-09-01 (Season 14, the first on schedule) to 2030-12-31. */
function walk(hand, label) {
  let days = 0;
  for (let d = day(2026, 9, 1); d <= day(2030, 12, 31); d = nextDay(d), days++) {
    checkList(hand ? buildSeasons(d, hand) : buildSeasons(d), d, `${label} ${iso(d)}`);
    // One report per walk is enough to act on; thousands are not.
    if (failures.length) return days;
  }
  return days;
}

function seasonOn(now, title, hand) {
  const list = hand ? buildSeasons(now, hand) : buildSeasons(now);
  return list.find((s) => s.title === title);
}

// ── Baseline: the hand-written history comes out unchanged (FR-012) ─────────
const today = buildSeasons(day(2026, 11, 24));
expectEqual("seasons listed on 2026-11-24", today.length, 14);
expectEqual("Season 1 start", iso(today.at(-1).startDate), "2022-04-07");
expectEqual("Season 13 range", seasonDateRange(today[1]), "May 7 – Aug 31, 2026");
expectEqual("Season 14 range", seasonDateRange(today[0]), "Sep 1 – Nov 30, 2026");
expectEqual("Season 14 expansion", today[0].expansion, "Raiders of the North");

// ── US1: the default is the season running today ────────────────────────────
for (const [d, title] of [
  [day(2026, 9, 1), "Season 14"],
  [day(2026, 11, 24), "Season 14"],
  [day(2026, 11, 30, 23, 59), "Season 14"],
  [day(2026, 12, 1), "Season 15"],
]) {
  expectEqual(`currentSeason on ${iso(d)}`, currentSeason(buildSeasons(d), d).title, title);
}
const beforeSeasonOne = day(2021, 1, 1);
expectEqual("seasons before Season 1", buildSeasons(beforeSeasonOne).length, 0);
expectEqual("currentSeason before Season 1", currentSeason(buildSeasons(beforeSeasonOne), beforeSeasonOne)?.title, "Season 1");

// ── US2: seasons continue on the schedule ───────────────────────────────────
const s15 = seasonOn(day(2026, 12, 1), "Season 15");
expectEqual("Season 15 tagline", s15?.tagline, "Winter 2026");
expectEqual("Season 15 range", s15 && seasonDateRange(s15), "Dec 1, 2026 – Feb 28, 2027");
expectEqual("Season 15 listed on 2026-11-30", seasonOn(day(2026, 11, 30, 23), "Season 15"), undefined);
const march27 = buildSeasons(day(2027, 3, 1));
expectEqual("current on 2027-03-01", currentSeason(march27, day(2027, 3, 1)).tagline, "Spring 2027");
expectEqual("Season 16 title", march27[0].title, "Season 16");
const leap = currentSeason(buildSeasons(day(2028, 2, 29)), day(2028, 2, 29));
expectEqual("current on 2028-02-29", `${leap.title} ${leap.tagline} ${iso(leap.endDate)}`, "Season 19 Winter 2027 2028-02-29");

const walked = walk(null, "schedule");

// ── US3: hand-written entries win, and a break moves one season ─────────────
const real = buildSeasons(day(2026, 11, 24)).map(({ endDate, ...entry }) => entry);
real[0].endDate = undefined;
const withExpansion = [{ title: "Season 15", tagline: "Winter 2026", expansion: "X", startDate: day(2026, 12, 1) }, ...real];
const jan27 = buildSeasons(day(2027, 1, 15), withExpansion);
expectEqual("Season 15 entries with a hand-written one", jan27.filter((s) => s.title === "Season 15").length, 1);
expectEqual("hand-written Season 15 expansion", jan27[0].expansion, "X");
expectEqual("hand-written Season 15 hidden on 2026-11-30", seasonOn(day(2026, 11, 30), "Season 15", withExpansion), undefined);
expectEqual(
  "currentSeason on 2026-11-30 with Season 15 written ahead",
  currentSeason(buildSeasons(day(2026, 11, 30), withExpansion), day(2026, 11, 30)).title,
  "Season 14",
);
walk(withExpansion, "with hand-written Season 15");

const lateEnd = [{ title: "Season 15", tagline: "Winter 2026", startDate: day(2026, 12, 1), endDate: day(2027, 3, 9) }, ...real];
const s16 = seasonOn(day(2027, 6, 1), "Season 16", lateEnd);
expectEqual("Season 16 after a late Season 15", s16 && `${iso(s16.startDate)} ${iso(s16.endDate)} ${s16.tagline}`, "2027-03-10 2027-05-31 Spring 2027");
expectEqual("Season 17 after a late Season 15", iso(seasonOn(day(2027, 6, 1), "Season 17", lateEnd)?.startDate ?? day(1970, 1, 1)), "2027-06-01");
walk(lateEnd, "with a late Season 15");

const lateFourteen = [{ ...real[0], endDate: day(2027, 1, 9) }, ...real.slice(1)];
expectEqual("Season 15 starting in January", seasonOn(day(2027, 1, 10), "Season 15", lateFourteen)?.tagline, "Winter 2026");

if (failures.length) {
  console.error(`check:seasons — ${failures.length} failure(s):`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`check:seasons — ok (${walked} days walked, plus pinned and hand-written cases)`);
