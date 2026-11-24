// Guards build search (spec 043): the index the nightly job builds, and the
// matcher the app runs over it on the device.
//
// Two things here are promises to people, not just behaviour. The index must
// never contain an unlisted build — spec 039 tells authors an unlisted build "is
// not shown in search", and nothing else stands between that sentence and the
// file every visitor downloads. And a run that produced an empty index must
// never replace a good one. Both live in pure code exactly so they can be
// checked here, without credentials.
//
// CI-ONLY. It imports from src/, which Netlify's Node 22.1.0 cannot load (see
// CLAUDE.md). Never add it to the Netlify build command.
//
// Usage:
//   node scripts/check-search.mjs
//
// Exits 1 on any failure.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { buildSearchIndex, shouldPublish } = require("../functions/builds/searchIndex.js");

let failed = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    failed++;
    console.log(`✗ ${name}\n    ${error.message}`);
  }
}
function equal(actual, expected, label = "") {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${label}expected ${e}, got ${a}`);
}
function ok(value, label) {
  if (!value) throw new Error(label);
}

// ─── The index builder (functions/builds/searchIndex.js) ─────────────────────

const GENERATED = "2026-11-24T23:30:00.000Z";
const build = (over) => ({
  id: "b1",
  title: "Title",
  author: "Kestrel",
  authorUid: "uid-k",
  civ: "RUS",
  season: "Season 12",
  isDraft: false,
  score: 1,
  ...over,
});

check("builder: an unlisted build is never written (FR-007, SC-005)", () => {
  const index = buildSearchIndex(
    [build({ id: "listed" }), build({ id: "unlisted", isDraft: true })],
    GENERATED
  );
  equal(index.builds.map((row) => row[0]), ["listed"]);
});

check("builder: two builds by one uid share one author", () => {
  const index = buildSearchIndex([build({ id: "a" }), build({ id: "b" })], GENERATED);
  equal(index.authors, [["uid-k", "Kestrel"]]);
  equal(index.builds.map((row) => row[2]), [0, 0]);
});

check("builder: one display name, two uids → two authors", () => {
  const index = buildSearchIndex(
    [build({ id: "a", authorUid: "u1" }), build({ id: "b", authorUid: "u2" })],
    GENERATED
  );
  equal(index.authors.length, 2);
});

check("builder: no uid → author keyed by name, no link", () => {
  const index = buildSearchIndex(
    [build({ id: "a", authorUid: undefined }), build({ id: "b", authorUid: "" })],
    GENERATED
  );
  equal(index.authors, [["", "Kestrel"]]);
});

check("builder: season label → number", () => {
  const index = buildSearchIndex(
    [build({ id: "a", season: "Season 12" }), build({ id: "b", season: "" }), build({ id: "c", season: undefined })],
    GENERATED
  );
  equal(index.builds.map((row) => row[4]).sort(), [0, 0, 12]);
});

check("builder: a non-finite score is 0, others are rounded to 2 decimals", () => {
  const index = buildSearchIndex(
    [build({ id: "nan", score: NaN }), build({ id: "x", score: 3.14159 }), build({ id: "u", score: undefined })],
    GENERATED
  );
  const byId = Object.fromEntries(index.builds.map((row) => [row[0], row[5]]));
  equal(byId, { x: 3.14, nan: 0, u: 0 });
});

check("builder: Feudal and Castle times with their estimated flags (FR-026)", () => {
  const index = buildSearchIndex(
    [
      build({ id: "castleOnly", ageTimings: { castle: { t: 524.6, e: true } } }),
      build({ id: "both", ageTimings: { feudal: { t: 250, e: false }, castle: { t: 600, e: false } } }),
      build({ id: "feudalOnly", ageTimings: { feudal: { t: 279.6, e: true }, imperial: { t: 1200, e: false } } }),
      build({ id: "none" }),
      build({ id: "garbage", ageTimings: { feudal: null, castle: { t: "x" } } }),
      build({ id: "negative", ageTimings: { castle: { t: -5, e: true } } }),
    ],
    GENERATED
  );
  // [feudalSeconds, feudalEstimated, castleSeconds, castleEstimated]
  const byId = Object.fromEntries(index.builds.map((row) => [row[0], row.slice(6)]));
  equal(byId, {
    castleOnly: [null, 0, 525, 1],
    both: [250, 0, 600, 0],
    feudalOnly: [280, 1, null, 0],
    none: [null, 0, null, 0],
    garbage: [null, 0, null, 0],
    negative: [null, 0, null, 0],
  });
});

check("builder: every row has exactly 10 elements; a missing civ becomes ANY", () => {
  const index = buildSearchIndex([build({ civ: undefined, title: undefined })], GENERATED);
  index.builds.forEach((row) => equal(row.length, 10, "row length: "));
  equal(index.builds[0][3], "ANY");
  equal(index.builds[0][1], "");
});

check("builder: sorted by score, highest first", () => {
  const index = buildSearchIndex(
    [build({ id: "lo", score: 1 }), build({ id: "hi", score: 9 }), build({ id: "mid", score: 5 })],
    GENERATED
  );
  equal(index.builds.map((row) => row[0]), ["hi", "mid", "lo"]);
});

check("builder: top-level shape is exactly the contract (FR-014)", () => {
  const index = buildSearchIndex([build({})], GENERATED);
  equal(Object.keys(index), ["v", "generated", "authors", "builds"]);
  equal(index.v, 1);
  equal(index.generated, GENERATED);
});

check("shouldPublish: never replace a good index with an empty or collapsed one (FR-010)", () => {
  equal(shouldPublish(0, 100), true, "first run: ");
  equal(shouldPublish(100, 0), false, "empty: ");
  equal(shouldPublish(0, 0), false, "empty first run: ");
  equal(shouldPublish(100, 49), false, "under half: ");
  equal(shouldPublish(100, 50), true, "exactly half: ");
  equal(shouldPublish(100, 120), true, "growth: ");
});

// ─── Size against the real catalogue (SC-004) ────────────────────────────────

/** Snapshot builds in the builder's input shape. Author ids are not in the snapshot. */
function snapshotBuilds() {
  const lines = readFileSync(join(ROOT, "data", "seo-snapshot.ndjson"), "utf8").trim().split("\n");
  return lines
    .map((line) => JSON.parse(line))
    .filter((record) => record.id)
    .map((record, i) => ({
      id: record.id,
      title: record.title,
      author: record.author,
      // A 28-character stand-in, the length of a Firebase uid, so the size is honest.
      authorUid: `uid-${record.author}`.padEnd(28, "x").slice(0, 28),
      civ: record.civ,
      season: record.season,
      isDraft: false,
      score: ((i * 7919) % 5000) / 100,
      // The snapshot has no ageTimings. Shares as measured on prod (2026-11-24):
      // Feudal on 49% of builds, Castle on 19%, roughly a quarter estimated.
      ageTimings: {
        ...(i % 100 < 49 ? { feudal: { t: 200 + ((i * 13) % 160), e: i % 4 === 1 } } : {}),
        ...(i % 100 < 19 ? { castle: { t: 420 + ((i * 37) % 300), e: i % 4 === 1 } } : {}),
      },
    }));
}

const SIZE_LIMIT_AT_DOUBLE = 400 * 1024;
let snapshotIndex = null;

check("size: index of the snapshot stays under 400 KB gzip at twice the builds (SC-004)", () => {
  const builds = snapshotBuilds();
  snapshotIndex = buildSearchIndex(builds, GENERATED);
  const raw = Buffer.byteLength(JSON.stringify(snapshotIndex));
  const gz = gzipSync(JSON.stringify(snapshotIndex), { level: 9 }).length;
  const atDouble = Math.round(gz * (8700 / snapshotIndex.builds.length));
  console.log(
    `    ${snapshotIndex.builds.length} builds, ${snapshotIndex.authors.length} authors: ` +
      `${(raw / 1024).toFixed(0)} KB raw, ${(gz / 1024).toFixed(0)} KB gzip; ` +
      `≈${(atDouble / 1024).toFixed(0)} KB gzip at 8,700 builds`
  );
  ok(atDouble < SIZE_LIMIT_AT_DOUBLE, `projected ${atDouble} bytes ≥ ${SIZE_LIMIT_AT_DOUBLE}`);
});

// ─── The matcher (src/composables/search/searchIndex.js) ─────────────────────

const { prepare, search, withinOneEdit, TIER } = await import("../src/composables/search/searchIndex.js");
const { civs } = await import("../src/composables/filter/civDefaultProvider.js");
const civList = civs.value;

const fixture = prepare(
  buildSearchIndex(
    [
      build({ id: "rus-fc", title: "Rus 2TC into Fast Castle", author: "Kestrel", authorUid: "k", civ: "RUS", score: 40 }),
      build({ id: "rus-fc2", title: "Fast Castle Hunting Cabins", author: "MarchOfOats", authorUid: "m", civ: "RUS", score: 20 }),
      build({ id: "fre-fc", title: "French fast castle into knights", author: "Valdrin", authorUid: "v", civ: "FRE", score: 30 }),
      build({ id: "eco", title: "Éco boom with fishing", author: "Valdrin", authorUid: "v", civ: "ENG", score: 5 }),
      build({ id: "cn", title: "法国手推车背鹿 - 中文", author: "Cherihawn", authorUid: "c", civ: "FRE", score: 3 }),
      build({ id: "hre", title: "Prelate double TC", author: "Kestrel", authorUid: "k", civ: "HRE", score: 10 }),
      build({ id: "any", title: "Generic english-style opener", author: "Someone", authorUid: "s", civ: "ANY", score: 50 }),
      build({ id: "dra", title: "Gilded spearmen timing", author: "Someone", authorUid: "s", civ: "DRA", score: 8 }),
      build({ id: "twin1", title: "Tower rush", author: "Twin", authorUid: "t1", civ: "ENG", score: 2 }),
      build({ id: "twin2", title: "Longbow tower", author: "Twin", authorUid: "t2", civ: "ENG", score: 1 }),
      build({ id: "castle-time", title: "Abbasid fast castle", author: "Kestrel", authorUid: "k", civ: "ABB", score: 4, ageTimings: { feudal: { t: 301, e: false }, castle: { t: 512, e: true } } }),
    ],
    GENERATED
  ),
  civList
);
const ids = (result) => result.builds.map((hit) => hit.entry.id);

check("matcher: words in any order and any case (FR-001, FR-002)", () => {
  equal(ids(search(fixture, "fast castle")).includes("rus-fc"), true, "fast castle: ");
  equal(ids(search(fixture, "CASTLE fast")).includes("rus-fc"), true, "CASTLE fast: ");
});

check("matcher: a word must match a word start, not the middle of a word", () => {
  equal(ids(search(fixture, "cast")).includes("rus-fc"), true, "cast: ");
  // Four letters, so no typo tolerance either. ("astle", five letters, IS one
  // edit from "castle" and is rightly found by the fuzzy pass.)
  equal(ids(search(fixture, "stle")).length, 0, "stle: ");
});

check("matcher: accents never matter", () => {
  equal(ids(search(fixture, "eco boom")), ["eco"]);
  equal(ids(search(fixture, "éco")), ["eco"]);
});

check("matcher: Chinese titles match anywhere (no word boundaries)", () => {
  equal(ids(search(fixture, "手推车")), ["cn"]);
});

check("matcher: one character returns nothing", () => {
  equal(search(fixture, "f").total, 0);
  equal(search(fixture, "  ").total, 0);
});

check("matcher: a typo is forgiven only when exact results are few (FR-003)", () => {
  equal(ids(search(fixture, "fast catsle")).includes("rus-fc"), true, "catsle: ");
  equal(withinOneEdit("castle", "catsle"), true, "swap: ");
  equal(withinOneEdit("castle", "castel"), true, "swap at end: ");
  equal(withinOneEdit("castle", "castles"), true, "insert: ");
  equal(withinOneEdit("castle", "cattle"), true, "substitute: ");
  equal(withinOneEdit("castle", "cattles"), false, "two edits: ");
  // Four-letter words are never fuzzy: "fats" must not find "fast".
  equal(ids(search(fixture, "fats")).length, 0, "short word: ");
  // With enough exact matches, fuzzy does not run.
  equal(search(fixture, "castle", { limit: 1 }).builds.every((hit) => hit.tier !== TIER.FUZZY), true, "no fuzzy when plenty: ");
});

check("matcher: a title that starts with the query ranks first, then score (FR-004)", () => {
  const result = search(fixture, "fast castle");
  equal(result.builds[0].entry.id, "rus-fc2", "starts-with first: ");
  equal(result.builds[0].tier, TIER.TITLE_START);
  // Among whole-word matches, the higher score first.
  const rest = result.builds.slice(1).map((hit) => hit.entry.id);
  ok(rest.indexOf("rus-fc") < rest.indexOf("fre-fc"), `score order: ${rest}`);
});

check("matcher: highlight ranges point at the original title", () => {
  const hit = search(fixture, "eco").builds[0];
  equal(hit.ranges, [[0, 3]]);
  equal(hit.entry.title.slice(0, 3), "Éco");
  const cn = search(fixture, "手推车").builds[0];
  equal(cn.entry.title.slice(cn.ranges[0][0], cn.ranges[0][1]), "手推车");
});

check("matcher: a civ by code, nickname or name; its builds rank first (FR-005, US2 #2)", () => {
  equal(search(fixture, "hre").civ?.code, "HRE", "code: ");
  equal(search(fixture, "ootd").civ?.code, "DRA", "alias: ");
  equal(ids(search(fixture, "ootd")), ["dra"], "alias finds builds: ");
  equal(search(fixture, "holy").civ?.code, "HRE", "name prefix: ");
  const rus = search(fixture, "rus fast");
  equal(rus.civ?.code, "RUS");
  equal(ids(rus).slice(0, 2).sort(), ["rus-fc", "rus-fc2"], "civ builds first: ");
});

check("matcher: \"the\" and \"of\" are not civ words", () => {
  equal(ids(search(fixture, "the")).includes("dra"), false);
});

check("matcher: Any Civilization is never a civ result and never matches a civ word (US2 #4)", () => {
  const result = search(fixture, "english");
  equal(result.civ?.code, "ENG");
  // "any" is found by its title word "english-style", never as an English build.
  equal(result.builds.find((hit) => hit.entry.id === "any")?.tier, TIER.TITLE_WORD);
  equal(search(fixture, "any civilization").civ, null, "ANY as civ: ");
});

check("matcher: every word must match somewhere across title, author, civ (US2 #3)", () => {
  equal(ids(search(fixture, "rus kestrel fast")), ["rus-fc"]);
  equal(ids(search(fixture, "rus kestrel tower")), []);
});

check("matcher: authors are offered, at most three, with counts", () => {
  const result = search(fixture, "kestrel");
  equal(result.authors.map((a) => [a.name, a.count]), [["Kestrel", 3]]);
  equal(search(fixture, "rus kestrel fast").authors.map((a) => a.name), ["Kestrel"], "mixed query: ");
  equal(search(fixture, "fast").authors, [], "no author named fast: ");
});

check("matcher: two authors with one name stay two results", () => {
  equal(search(fixture, "twin").authors.map((a) => a.uid).sort(), ["t1", "t2"]);
});

check("matcher: hidden builds are never returned (FR-009)", () => {
  equal(ids(search(fixture, "fast castle", { hiddenIds: new Set(["rus-fc"]) })).includes("rus-fc"), false);
});

check("matcher: Feudal and Castle times travel with the result (FR-026)", () => {
  const hit = search(fixture, "abbasid").builds[0];
  equal([hit.entry.feudalSeconds, hit.entry.feudalEstimated, hit.entry.castleSeconds, hit.entry.castleEstimated], [301, false, 512, true]);
  const none = search(fixture, "prelate").builds[0].entry;
  equal([none.feudalSeconds, none.castleSeconds], [null, null]);
});

check("matcher: total counts beyond the limit (FR-006)", () => {
  const result = search(fixture, "castle", { limit: 2 });
  equal(result.builds.length, 2);
  ok(result.total > 2, `total ${result.total}`);
});

check("matcher: speed over the real catalogue (SC-002)", () => {
  const prepared = prepare(snapshotIndex, civList);
  const vocabulary = prepared.entries.flatMap((entry) => entry.titleWords.map((word) => word.w)).filter((w) => w.length > 2);
  const started = performance.now();
  const runs = 1000;
  for (let i = 0; i < runs; i++) {
    const q = `${vocabulary[(i * 7919) % vocabulary.length]} ${vocabulary[(i * 104729) % vocabulary.length]}`;
    search(prepared, q);
  }
  const perQuery = (performance.now() - started) / runs;
  console.log(`    ${perQuery.toFixed(2)} ms per two-word query over ${prepared.entries.length} builds (desktop)`);
  ok(perQuery < 10, `${perQuery} ms per query; the phone budget is 50 ms at about 5× slower`);
});

// ─── The author's hide list (src/composables/search/hiddenBuilds.js) ──────────

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key),
};
const { addHidden, removeHidden, hiddenIds } = await import("../src/composables/search/hiddenBuilds.js");

check("hide list: an unlisted build is hidden until an index newer than the unlist (FR-009)", () => {
  memory.clear();
  addHidden("a");
  const before = new Date(Date.now() - 60_000);
  equal([...hiddenIds(before)], ["a"], "older index: ");
  const after = new Date(Date.now() + 60_000);
  equal([...hiddenIds(after)], [], "newer index retires it: ");
  equal(memory.has("aoe4guides.search.hidden"), false, "pruned from storage: ");
});

check("hide list: re-publishing removes the entry", () => {
  memory.clear();
  addHidden("a");
  addHidden("b");
  removeHidden("a");
  equal([...hiddenIds(new Date(0))], ["b"]);
});

check("hide list: bounded, and unreadable storage is an empty list", () => {
  memory.clear();
  for (let i = 0; i < 250; i++) addHidden(`id${i}`);
  equal(hiddenIds(new Date(0)).size, 200);
  memory.set("aoe4guides.search.hidden", "not json");
  equal(hiddenIds(new Date(0)).size, 0);
});

if (failed) {
  console.log(`\n${failed} check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log("\nAll search checks passed.");
}
