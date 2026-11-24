// Guards remix lineage (spec 044): the step fingerprint that decides which builds
// are the same, and derive(), which decides who is the original, who is hidden
// as a duplicate, and who gets remix credit. Both live in pure code
// (functions/builds/lineage.js) so they can be checked here without credentials.
//
// Two things here protect people, not just behaviour. A build must never be
// hidden as a "duplicate" of a build that only LOOKS older: precedence comes
// from times the server sets (stepsSince, createTime), never the client-written
// timeCreated (research R2). And two builds that differ only in an icon are
// different builds: icons are the content of a step (research R4).
//
// Imports nothing from src/, so it would also run on Netlify's Node 22.1.0 — but
// it belongs in CI, beside check:search.
//
// Usage:
//   node scripts/check-lineage.mjs
//
// Exits 1 on any failure.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { stepRows, fingerprint, derive } = require("../functions/builds/lineage.js");

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

// ─── Fixtures ────────────────────────────────────────────────────────────────

const icon = (name, ext = "webp") =>
  `<img src="/assets/pictures/unit_worker/${name}.${ext}" class="icon" title="${name}"></img>`;
const step = (description, over = {}) => ({
  time: "0:00",
  villagers: "6",
  builders: "",
  food: "6",
  wood: "",
  gold: "",
  stone: "",
  description,
  ...over,
});
/** One age section holding the given items, as the editor stores it. */
const section = (items, gameplan = "") => [{ type: "age", age: 1, gameplan, steps: items }];
const five = (prefix = "Step") => [1, 2, 3, 4, 5].map((n) => step(`${prefix} ${n}`));

// ─── stepRows / fingerprint ──────────────────────────────────────────────────

check("rows: ordinary steps, in order", () => {
  equal(stepRows(section([step("A"), step("B")])).length, 2);
});

check("rows: alternatives paths are read, notes are not, the gameplan is not", () => {
  const steps = section(
    [
      step("A"),
      { kind: "note", text: "a note" },
      { kind: "alternatives", paths: [{ steps: [step("P1")] }, { steps: [step("P2"), step("P3")] }] },
    ],
    "a gameplan"
  );
  const rows = stepRows(steps);
  equal(rows.length, 4, "count: ");
  ok(rows.some((r) => r.includes("p2")), "a step inside a path is a row");
  ok(!rows.some((r) => r.includes("note") || r.includes("gameplan")), "no note or gameplan row");
});

check("rows: a nested block inside a path is skipped, not descended into", () => {
  const steps = section([
    { kind: "alternatives", paths: [{ steps: [step("P1"), { kind: "alternatives", paths: [{ steps: [step("deep")] }] }] }] },
  ]);
  equal(stepRows(steps).length, 1);
});

check("fingerprint: null under five rows", () => {
  equal(fingerprint(section(five().slice(0, 4))), null);
  ok(typeof fingerprint(section(five())) === "string", "five rows give a hash");
});

check("fingerprint: formatting does not matter (HTML, case, whitespace, &nbsp;)", () => {
  const a = section(five().map((s, i) => ({ ...s, description: `Build   <b>House</b> ${i}` })));
  const b = section(five().map((s, i) => ({ ...s, description: `build&nbsp;house ${i}` })));
  equal(fingerprint(a), fingerprint(b));
});

check("fingerprint: an icon swapped in one step makes a different build", () => {
  const a = section(five().map((s) => ({ ...s, description: `Build ${icon("house")}` })));
  const b = section(five().map((s, i) => ({ ...s, description: `Build ${icon(i === 2 ? "farm" : "house")}` })));
  ok(fingerprint(a) !== fingerprint(b), "icons are content");
});

check("fingerprint: the same icon as .png (old builds) and .webp is the same", () => {
  const a = section(five().map((s) => ({ ...s, description: `Build ${icon("house", "png")}` })));
  const b = section(five().map((s) => ({ ...s, description: `Build ${icon("house", "webp")}` })));
  equal(fingerprint(a), fingerprint(b));
});

check("fingerprint: a resource number is content", () => {
  const a = section(five());
  const b = section(five().map((s, i) => (i === 3 ? { ...s, wood: "4" } : s)));
  ok(fingerprint(a) !== fingerprint(b), "different wood");
});

check("fingerprint: missing or malformed steps are no rows, never a throw", () => {
  equal(fingerprint(undefined), null);
  equal(fingerprint([null, { steps: null }, { steps: [null] }]), null);
});

// ─── derive ──────────────────────────────────────────────────────────────────

const NOW = Date.UTC(2026, 11, 1);
const DAY = 86_400_000;
const H = fingerprint(section(five("Same")));
const OTHER = fingerprint(section(five("Other")));

/** A build as updateBuildTrend hands it to derive(): tonight's hash already set. */
const b = (id, over = {}) => ({
  id,
  civ: "RUS",
  authorUid: `u-${id}`,
  author: `Author ${id}`,
  title: `Title ${id}`,
  isDraft: false,
  scoreAllTime: 1,
  createTimeMs: NOW - 100 * DAY,
  stepsHash: H,
  storedHash: H,
  storedSinceMs: NOW - 100 * DAY,
  remixOf: null,
  ...over,
});
const run = (builds) => derive(builds, NOW);
const dupOf = (out, id) => out.get(id).duplicateOf?.id ?? null;

check("since: first sight takes createTime; unchanged keeps it; a change is now", () => {
  const out = run([
    b("new", { storedHash: undefined, storedSinceMs: undefined, createTimeMs: NOW - 5 * DAY }),
    b("same", { storedSinceMs: NOW - 9 * DAY }),
    b("edited", { storedHash: OTHER, storedSinceMs: NOW - 9 * DAY }),
  ]);
  equal(out.get("new").stepsSince, NOW - 5 * DAY, "new: ");
  equal(out.get("same").stepsSince, NOW - 9 * DAY, "same: ");
  equal(out.get("edited").stepsSince, NOW, "edited: ");
  equal(out.get("edited").stepsHash, H, "hash carried: ");
});

check("duplicates: a later copy by another account is hidden as the original's", () => {
  const out = run([
    b("orig", { storedSinceMs: NOW - 50 * DAY }),
    b("copy", { storedSinceMs: NOW - 10 * DAY, scoreAllTime: 99 }),
  ]);
  equal(dupOf(out, "orig"), null, "original listed: ");
  equal(dupOf(out, "copy"), "orig", "copy hidden: ");
  equal(out.get("copy").duplicateOf, { id: "orig", title: "Title orig", author: "Author orig" }, "shape: ");
});

check("duplicates: timeCreated is never read — a back-dated copy is still the copy", () => {
  const out = run([
    b("orig", { storedSinceMs: NOW - 50 * DAY, timeCreated: NOW }),
    b("forger", { storedSinceMs: NOW - 10 * DAY, createTimeMs: NOW - 10 * DAY, timeCreated: 0 }),
  ]);
  equal(dupOf(out, "forger"), "orig");
});

check("duplicates: an old build edited to match a newer one is the copy (stepsSince is now)", () => {
  const out = run([
    b("victim", { createTimeMs: NOW - 20 * DAY, storedSinceMs: NOW - 20 * DAY }),
    b("attacker", { createTimeMs: NOW - 900 * DAY, storedHash: OTHER, storedSinceMs: NOW - 900 * DAY }),
  ]);
  equal(dupOf(out, "victim"), null, "victim stays listed: ");
  equal(dupOf(out, "attacker"), "victim", "attacker hidden: ");
});

check("duplicates: one author's copies — the most active is listed", () => {
  const out = run([
    b("a1", { authorUid: "u-a", storedSinceMs: NOW - 30 * DAY, scoreAllTime: 2 }),
    b("a2", { authorUid: "u-a", storedSinceMs: NOW - 20 * DAY, scoreAllTime: 9 }),
    b("a3", { authorUid: "u-a", storedSinceMs: NOW - 10 * DAY, scoreAllTime: 5 }),
  ]);
  equal([dupOf(out, "a1"), dupOf(out, "a2"), dupOf(out, "a3")], ["a2", null, "a2"]);
});

check("duplicates: another author's copy points at the listed build, not the earliest", () => {
  const out = run([
    b("a1", { authorUid: "u-a", storedSinceMs: NOW - 30 * DAY, scoreAllTime: 2 }),
    b("a2", { authorUid: "u-a", storedSinceMs: NOW - 20 * DAY, scoreAllTime: 9 }),
    b("x", { storedSinceMs: NOW - 25 * DAY, scoreAllTime: 50 }),
  ]);
  equal([dupOf(out, "a1"), dupOf(out, "a2"), dupOf(out, "x")], ["a2", null, "a2"]);
});

check("duplicates: unlisted builds are neither hidden nor originals", () => {
  const out = run([
    b("orig", { storedSinceMs: NOW - 50 * DAY, isDraft: true }),
    b("copy1", { storedSinceMs: NOW - 10 * DAY }),
    b("copy2", { storedSinceMs: NOW - 5 * DAY }),
    b("draftCopy", { storedSinceMs: NOW - 1 * DAY, isDraft: true }),
  ]);
  equal(dupOf(out, "orig"), null, "unlisted original: ");
  equal(dupOf(out, "copy1"), null, "next in line is listed: ");
  equal(dupOf(out, "copy2"), "copy1", "the one after is hidden: ");
  equal(dupOf(out, "draftCopy"), null, "unlisted copy: ");
});

check("duplicates: other civilisations, other steps and short builds never match", () => {
  const out = run([
    b("orig", { storedSinceMs: NOW - 50 * DAY }),
    b("otherCiv", { civ: "HRE", storedSinceMs: NOW - 10 * DAY }),
    b("otherSteps", { stepsHash: OTHER, storedHash: OTHER, storedSinceMs: NOW - 10 * DAY }),
    b("short1", { stepsHash: null, storedHash: null }),
    b("short2", { stepsHash: null, storedHash: null }),
  ]);
  equal(["otherCiv", "otherSteps", "short1", "short2"].map((id) => dupOf(out, id)), [null, null, null, null]);
});

check("duplicates: ties fall to createTime, then id", () => {
  const out = run([
    b("z", { storedSinceMs: NOW - 9 * DAY, createTimeMs: NOW - 9 * DAY }),
    b("y", { storedSinceMs: NOW - 9 * DAY, createTimeMs: NOW - 9 * DAY }),
  ]);
  equal([dupOf(out, "y"), dupOf(out, "z")], [null, "y"]);
});

check("credit: distinct other accounts, published or unlisted; own remixes and dangling links count nothing", () => {
  const to = (id) => ({ id, title: "x", author: "x", authorUid: "x" });
  const out = run([
    b("orig", { stepsHash: OTHER, storedHash: OTHER }),
    b("r1", { remixOf: to("orig"), stepsHash: null }),
    b("r2", { remixOf: to("orig"), stepsHash: null, isDraft: true }),
    b("r3", { remixOf: to("orig"), stepsHash: null }),
    b("r4a", { authorUid: "u-four", remixOf: to("orig"), stepsHash: null }),
    b("r4b", { authorUid: "u-four", remixOf: to("orig"), stepsHash: null }),
    b("own", { authorUid: "u-orig", remixOf: to("orig"), stepsHash: null }),
    b("gone", { remixOf: to("deleted"), stepsHash: null }),
  ]);
  equal(out.get("orig").remixCredit, 4, "credit: ");
  equal(out.get("r1").remixCredit, 0, "a remix itself: ");
});

check("remix list: published by others, top 10 by all-time activity, true count", () => {
  const to = { id: "orig", title: "o", author: "o", authorUid: "u-orig" };
  const remixes = Array.from({ length: 12 }, (_, i) =>
    b(`r${i}`, { remixOf: to, stepsHash: null, scoreAllTime: i, title: `R${i}`, author: `A${i}` })
  );
  const out = run([
    b("orig", { stepsHash: null }),
    ...remixes,
    b("unlisted", { remixOf: to, stepsHash: null, isDraft: true, scoreAllTime: 100 }),
    b("own", { authorUid: "u-orig", remixOf: to, stepsHash: null, scoreAllTime: 100 }),
  ]);
  const list = out.get("orig").remixes;
  equal(list.count, 12, "count: ");
  equal(list.items.length, 10, "cap: ");
  equal(list.items[0], { id: "r11", title: "R11", author: "A11" }, "first: ");
  equal(out.get("r0").remixes, null, "no remixes is null: ");
});

check("remix list: a hidden exact copy is still listed — readers find their way back", () => {
  const to = { id: "orig", title: "o", author: "o", authorUid: "u-orig" };
  const out = run([
    b("orig", { storedSinceMs: NOW - 50 * DAY }),
    b("copy", { remixOf: to, storedSinceMs: NOW - 10 * DAY }),
  ]);
  equal(dupOf(out, "copy"), "orig", "hidden: ");
  equal(out.get("orig").remixes.count, 1, "listed: ");
});

check("a remix of a remix credits its direct parent only", () => {
  const out = run([
    b("a", { stepsHash: null }),
    b("b", { stepsHash: null, remixOf: { id: "a", title: "", author: "", authorUid: "u-a" } }),
    b("c", { stepsHash: null, remixOf: { id: "b", title: "", author: "", authorUid: "u-b" } }),
  ]);
  equal([out.get("a").remixCredit, out.get("b").remixCredit], [1, 1]);
});

if (failed) {
  console.log(`\n${failed} check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log("\nAll lineage checks passed.");
}
