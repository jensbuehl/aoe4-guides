// Emits one static HTML file per public build, carrying that build's own head
// tags, so a crawler or a link unfurler sees the build rather than the SPA
// shell's site-wide defaults.
//
// ─────────────────────────────────────────────────────────────────────────────
// THIS SCRIPT MAY NEVER FAIL A BUILD. IT EXITS 0 IN EVERY CASE, INCLUDING ERROR.
//
// It runs as `postbuild`, which means it runs after every `npm run build` a
// developer types and every deploy Netlify performs. Absent pages degrade
// exactly to today's behaviour — the SPA catch-all serves the shell and the
// site works — so there is no failure here worth breaking a deploy over. A
// generator that can turn a red deploy out of a working site is worse than no
// generator at all. (FR-018, FR-019, FR-020)
// ─────────────────────────────────────────────────────────────────────────────
//
// It also reads NO database. The build data is data/seo-snapshot.ndjson,
// committed to the repository and refreshed by a scheduled Action. So a deploy
// costs zero Firestore reads, needs no credential, and reproduces from a
// checkout alone. firebase-admin is imported by scripts/refresh-snapshot.mjs
// and must never be imported here. (FR-025, research R11)
//
// Usage:
//   node scripts/prerender.mjs [--force] [--limit=N] [--dry-run]
//
// Environment:
//   NETLIFY   set by Netlify. Its presence is what distinguishes a deploy from
//             a local build or a CI run, and is why neither generates pages.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT = join(ROOT, "data", "seo-snapshot.ndjson");
const DIST = join(ROOT, "dist");
const TEMPLATE = join(DIST, "index.html");
const OUTPUT_DIR = join(DIST, "builds");

//The built shell must contain both of these or it cannot boot the application.
//Asserted rather than assumed: emitting thousands of pages from a template that
//loads nothing would be far worse than emitting none, and a changed Vite output
//shape is a code defect that has to be visible in the deploy log.
const HEAD_CLOSE = "</head>";
const HASHED_MODULE = /<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["']\/assets\/[^"']+["']/i;

const LOG = "prerender:";

/**
 * @param {Array<string>} argv - process.argv.slice(2).
 * @return {{force: boolean, limit: number|null, dryRun: boolean}}
 */
function parseArgs(argv) {
  const options = { force: false, limit: null, dryRun: false };

  for (const arg of argv) {
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    const limit = arg.match(/^--limit=(\d+)$/);
    if (limit) {
      options.limit = Number(limit[1]);
      continue;
    }

    //Not fatal. An unknown flag is a typo, and a typo must not cost a deploy
    //its pages — it is reported and the run continues with what it understood.
    console.warn(`${LOG} ignoring unrecognised argument: ${arg}`);
  }

  return options;
}

/**
 * The snapshot's `_meta` line, or null when the file cannot be used.
 *
 * Only the first line is read here. The records behind it are the generator's
 * business and are parsed one at a time, so a single malformed record costs one
 * page rather than four thousand.
 *
 * @param {string} text - The whole snapshot.
 * @return {Object|null}
 */
function readMeta(text) {
  const firstLine = text.slice(0, text.indexOf("\n") + 1 || undefined).trim();
  if (!firstLine) return null;

  try {
    return JSON.parse(firstLine)?._meta ?? null;
  } catch {
    return null;
  }
}

/**
 * How stale the snapshot is, in whole days.
 *
 * @param {string} generated - ISO-8601 timestamp from `_meta`.
 * @return {number|null}
 */
function ageInDays(generated) {
  const at = Date.parse(generated ?? "");
  if (Number.isNaN(at)) return null;
  return Math.floor((Date.now() - at) / 86_400_000);
}

/**
 * Decides whether to run, and reports why not.
 *
 * The order is the contract (contracts/prerender-cli.md): first match wins, and
 * every outcome exits 0.
 *
 * @param {Object} options - Parsed arguments.
 * @return {{run: boolean, snapshot?: string, meta?: Object, template?: string}}
 */
function decide(options) {
  //1 — not a deploy. The common case by far: every local build lands here, and
  //it has to be cheap and quiet enough that nobody minds it running.
  if (!process.env.NETLIFY && !options.force) {
    console.log(`${LOG} skipped — not a Netlify build (pass --force to run anyway)`);
    return { run: false };
  }

  //2 — no data. Not an error: a fresh clone before the first refresh, or a
  //branch predating the snapshot, both land here legitimately.
  if (!existsSync(SNAPSHOT)) {
    console.log(`${LOG} skipped — data/seo-snapshot.ndjson not found`);
    return { run: false };
  }

  let snapshot;
  try {
    snapshot = readFileSync(SNAPSHOT, "utf8");
  } catch (error) {
    console.log(`${LOG} skipped — data/seo-snapshot.ndjson unreadable: ${error.message}`);
    return { run: false };
  }

  const meta = readMeta(snapshot);
  if (!meta) {
    console.log(`${LOG} skipped — data/seo-snapshot.ndjson has no readable _meta line`);
    return { run: false };
  }

  //3 — the template. Loud, because unlike the two above this is a defect and
  //not a condition: dist/index.html is always present after a successful vite
  //build, so its absence or a changed shape means something is wrong with the
  //build itself and someone has to look.
  if (!existsSync(TEMPLATE)) {
    console.error(`${LOG} NOT GENERATING — dist/index.html is missing. Did vite build run?`);
    return { run: false };
  }

  const template = readFileSync(TEMPLATE, "utf8");
  if (!template.includes(HEAD_CLOSE)) {
    console.error(`${LOG} NOT GENERATING — dist/index.html has no ${HEAD_CLOSE} to inject before.`);
    return { run: false };
  }
  if (!HASHED_MODULE.test(template)) {
    console.error(
      `${LOG} NOT GENERATING — dist/index.html has no hashed <script type="module" ` +
        `src="/assets/…">. Pages built from it would render nothing. This is a build ` +
        `defect, not a missing snapshot.`
    );
    return { run: false };
  }

  return { run: true, snapshot, meta, template };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const decision = decide(options);
  if (!decision.run) return;

  const { meta } = decision;
  const age = ageInDays(meta.generated);

  //The one line every successful run prints, and the only observability this
  //has. Both facts on it earn their place: the project id catches a refresh
  //that ran against aoe4-guides-dev, which would otherwise produce a plausible
  //set of pages for builds that do not exist in production; the age catches a
  //scheduled refresh that has quietly stopped running, which is the failure
  //FR-028 exists to prevent. (FR-023)
  console.log(
    `${LOG} snapshot ${meta.project} @ ${(meta.generated ?? "?").slice(0, 10)}` +
      `${age === null ? "" : ` (${age} day${age === 1 ? "" : "s"} old)`} · ` +
      `${meta.builds ?? "?"} build${meta.builds === 1 ? "" : "s"}`
  );

  if (meta.project !== "aoe4-guides") {
    console.warn(
      `${LOG} WARNING — snapshot came from "${meta.project}", not "aoe4-guides". ` +
        `These pages would describe builds that do not exist in production.`
    );
  }
  if (age !== null && age > 45) {
    console.warn(
      `${LOG} WARNING — snapshot is ${age} days old. The refresh runs monthly, so ` +
        `it has probably stopped: check the Refresh SEO snapshot workflow.`
    );
  }

  if (options.limit) console.log(`${LOG} limit: ${options.limit} builds`);
  if (options.dryRun) console.log(`${LOG} dry run — nothing will be renamed into place`);

  //── Phase 6 seam ────────────────────────────────────────────────────────────
  //Everything above is the safe path, built and verified first on purpose: the
  //guard rails go up before there is anything behind them that could run
  //unsafely. Page emission into OUTPUT_DIR lands here next.
  console.log(`${LOG} no pages emitted — generation is not implemented yet`);
  void OUTPUT_DIR;
}

//Nothing below this line may throw past it. A crash here is still a green
//deploy serving the site exactly as it does today.
try {
  main();
} catch (error) {
  console.error(`${LOG} failed, continuing anyway — ${error?.message ?? error}`);
  if (error?.stack) console.error(error.stack);
}

process.exit(0);
