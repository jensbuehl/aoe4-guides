// Reads Firestore and writes data/seo-snapshot.ndjson, the committed build data
// every deploy generates pages from.
//
// This is the ONLY file in the feature that touches the database. A deploy runs
// scripts/prerender.mjs, which reads the file this writes and nothing else — so
// pushing to main costs zero reads and needs no credential. That split is the
// whole point; see .specify/specs/033-prerender-build-seo/research.md R11.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE FILE FORMAT IS LOAD-BEARING. DO NOT PRETTY-PRINT IT.
//
// One JSON object per line, sorted by build id, no indentation. That is not a
// style choice and "let me just prettify this" is the quiet way to undo it.
//
// A refresh rewrites ~4 MB roughly a dozen times a year. As a single indented
// JSON array, every refresh is a whole-file diff and the repository accumulates
// ~48 MB of history a year. Line-per-record sorted by a stable key means an
// unchanged build produces no diff at all, and git stores only the lines that
// actually moved. Reformatting, re-sorting, or adding a fast-changing field
// destroys that property silently — the file still works, it just costs a
// hundred times more forever. (FR-027)
// ─────────────────────────────────────────────────────────────────────────────
//
// Usage:
//   node scripts/refresh-snapshot.mjs [--limit=N] [--out=path]
//
// Environment:
//   FIREBASE_SERVICE_ACCOUNT   service-account JSON for the aoe4-guides project
//
// Exits 1 on any failure — the opposite policy to prerender.mjs, deliberately.
// The generator must never break a deploy, because absent pages degrade to
// today's behaviour. A refresh that quietly does nothing leaves every page
// generating from stale data indefinitely, with nothing to indicate it. (FR-028)

import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { convertDescriptionToText } from "../src/composables/builds/icons/iconText.js";
import { forEachStep } from "../src/composables/builds/useAgeTimings.js";
import { civs } from "../src/composables/filter/civDefaultProvider.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUT = join(ROOT, "data", "seo-snapshot.ndjson");
const SNAPSHOT_VERSION = 1;

/**
 * A failure the operator caused and can fix — a missing secret, a typo'd flag.
 *
 * Marked so the handler prints the sentence and stops. FR-028 rests on a failed
 * refresh being noticed and understood; a stack trace above the one actionable
 * line is how it gets skimmed past instead.
 *
 * @param {string} message
 * @return {Error}
 */
function configError(message) {
  const error = new Error(message);
  error.expected = true;
  return error;
}

/**
 * @param {Array<string>} argv - process.argv.slice(2).
 * @return {{limit: number|null, out: string}}
 */
function parseArgs(argv) {
  const options = { limit: null, out: DEFAULT_OUT };

  for (const arg of argv) {
    const limit = arg.match(/^--limit=(\d+)$/);
    if (limit) {
      options.limit = Number(limit[1]);
      continue;
    }

    const out = arg.match(/^--out=(.+)$/);
    if (out) {
      options.out = out[1];
      continue;
    }

    throw configError(`unrecognised argument: ${arg}`);
  }

  return options;
}

/**
 * The service account, from the environment.
 *
 * @return {Object} Parsed service-account JSON.
 */
function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw configError(
      "FIREBASE_SERVICE_ACCOUNT is not set. It holds the service-account JSON " +
        "for the aoe4-guides project and lives in GitHub Secrets — never in Netlify " +
        "and never in the repository."
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw configError(`FIREBASE_SERVICE_ACCOUNT is not valid JSON: ${error.message}`);
  }

  if (!parsed.project_id) throw configError("FIREBASE_SERVICE_ACCOUNT has no project_id");
  return parsed;
}

/**
 * Reduces a rich-text field to plain text.
 *
 * Deliberately not convertDescriptionToText: that one carries the *step*
 * vocabulary, where "6 > gold" means "6 on gold". A build's own description is
 * ordinary prose, and turning every ">" in it into "on" would be wrong.
 *
 * Not truncated either — truncation is a presentation choice and belongs to the
 * generator, which is where the length limit is known.
 *
 * @param {*} text - A description, or anything else.
 * @return {string} Plain text, whitespace collapsed.
 */
export function stripMarkup(text) {
  return String(text ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    //Last: decoding it earlier would let "&amp;lt;" become a working "<".
    .replaceAll("&amp;", "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * An entry's text, whichever field it keeps it in.
 *
 * A step keeps its content in `description`; a note keeps its in `gameplan`,
 * and a note is an ordinary entry in a section's list. Reading `description`
 * alone walks straight past every note.
 *
 * @param {Object} entry - A step or a note.
 * @return {string} The raw markup.
 */
function textOf(entry) {
  const description = entry?.description ?? "";
  return description.trim() ? description : (entry?.gameplan ?? "");
}

/**
 * A build's steps as ordered plain-text sentences.
 *
 * forEachStep, not flattenSections: flattenSections resolves each alternatives
 * block to a single path because it answers "what is being read". A crawler
 * should see the whole document, including the paths nobody chose — they are
 * saved with the build and are one tab click from a reader. (R8, FR-012)
 *
 * SECTION NOTES ARE INCLUDED, WHICH THE CONTRACT DID NOT ASK FOR. Measured over
 * 230 real published builds: 39% still carry their section note in
 * `section.gameplan` rather than as a note *item*, because that migration is
 * lazy and only runs when an author next saves. forEachStep iterates
 * `section.steps` and so never sees them, and following it alone would have
 * dropped section-level guidance from two builds in five. FocusMode folds these
 * in for exactly the same reason. Once the Firestore backfill runs, this branch
 * stops firing on its own — it does not need removing.
 *
 * @param {Object} build - A build document.
 * @param {Function} onUnresolvedIcon - Called with each unresolvable image src.
 * @return {Array<string>} Non-empty step texts, in document order.
 */
export function stepsOf(build, onUnresolvedIcon) {
  const steps = [];
  const convert = (raw) => convertDescriptionToText(raw, { onUnresolvedIcon });

  for (const section of build.steps ?? []) {
    //The section's own note first: it introduces the section rather than
    //commenting on any one step in it.
    const note = convert(section?.gameplan ?? "");
    if (note) steps.push(note);

    forEachStep([section], (entry) => {
      const text = convert(textOf(entry));
      if (text) steps.push(text);
    });
  }

  return steps;
}

/**
 * Unix seconds from whatever shape the timestamp arrived in.
 *
 * @param {*} value - A Firestore Timestamp, or a number.
 * @return {number|null}
 */
function toUnixSeconds(value) {
  if (typeof value?.seconds === "number") return value.seconds;
  if (typeof value?._seconds === "number") return value._seconds;
  if (typeof value === "number") return Math.floor(value);
  return null;
}

/**
 * One snapshot line's worth of build.
 *
 * Fast-changing fields are excluded on purpose: views, likes, upvotes,
 * downvotes, comments and score change constantly, and including any of them
 * would make every refresh a whole-file diff — defeating the format — for data
 * that would be visibly stale on a prerendered page anyway. (FR-014, FR-027)
 *
 * @param {string} id - The document id.
 * @param {Object} data - The document data.
 * @param {Function} onUnresolvedIcon
 * @return {Object} The record, with keys in a fixed order so the JSON is stable.
 */
export function toRecord(id, data, onUnresolvedIcon) {
  return {
    id,
    title: data.title ?? "",
    description: stripMarkup(data.description),
    civ: data.civ ?? "",
    strategy: data.strategy ?? null,
    map: data.map ?? "",
    season: data.season ?? "",
    author: data.author ?? "",
    created: toUnixSeconds(data.timeCreated),
    steps: stepsOf(data, onUnresolvedIcon),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const serviceAccount = readServiceAccount();

  //Logged before anything else is read. A refresh pointed at aoe4-guides-dev
  //produces a completely plausible-looking snapshot for builds that do not
  //exist in production, and this line plus _meta.project in the committed diff
  //are the two places that would show it. (R4)
  console.log(`refresh: project ${serviceAccount.project_id}`);
  if (serviceAccount.project_id !== "aoe4-guides") {
    console.warn(
      `refresh: WARNING — expected project "aoe4-guides", got ` +
        `"${serviceAccount.project_id}". Production pages would be generated from ` +
        `the wrong database.`
    );
  }

  initializeApp({ credential: cert(serviceAccount) });

  let query = getFirestore().collection("builds").where("isDraft", "==", false);
  if (options.limit) query = query.limit(options.limit);

  const started = Date.now();
  const snapshot = await query.get();

  const unresolved = new Map();
  const count = (src) => unresolved.set(src, (unresolved.get(src) ?? 0) + 1);

  const records = snapshot.docs.map((doc) => toRecord(doc.id, doc.data(), count));
  //Sorted by id, which is what makes an unchanged build a zero-line diff.
  records.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const meta = {
    _meta: {
      project: serviceAccount.project_id,
      generated: new Date().toISOString(),
      builds: records.length,
      version: SNAPSHOT_VERSION,
      //Civ code -> display name, carried in the file so the generator needs no
      //import from src/ at all. That is a deploy-safety constraint, not tidiness
      //— see the header of scripts/prerender.mjs. 23 entries, once, not per
      //record: putting the name on every build would cost bytes 4,000 times and
      //make a civ rename a whole-file diff.
      civs: Object.fromEntries((civs.value ?? []).map((civ) => [civ.shortName, civ.title])),
    },
  };

  const lines = [meta, ...records].map((entry) => JSON.stringify(entry));
  const body = lines.join("\n") + "\n";

  //Written beside the target and renamed, so an interrupted run cannot leave a
  //truncated snapshot to be committed. (FR-021)
  mkdirSync(dirname(options.out), { recursive: true });
  const temporary = `${options.out}.tmp`;
  try {
    writeFileSync(temporary, body, "utf8");
    renameSync(temporary, options.out);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }

  const totalUnresolved = [...unresolved.values()].reduce((sum, n) => sum + n, 0);
  const steps = records.reduce((sum, record) => sum + record.steps.length, 0);

  console.log(
    `refresh: ${records.length} builds · ${steps} steps · ` +
      `${(body.length / 1048576).toFixed(2)} MB · ${((Date.now() - started) / 1000).toFixed(1)}s`
  );
  console.log(`refresh: unresolved icons: ${totalUnresolved} across ${unresolved.size} distinct src(s)`);
  for (const [src, n] of [...unresolved.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log(`refresh:   ${String(n).padStart(5)} x  ${src}`);
  }
  console.log(`refresh: wrote ${options.out}`);
}

//Only when run as the script, so the pure helpers above can be imported and
//exercised without a credential — which is the only way to check the record
//shape without spending 4,000 reads.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(`refresh: FAILED — ${error?.message ?? error}`);
    if (!error?.expected && error?.stack) console.error(error.stack);
    process.exit(1);
  });
}
