// One-off developer script (spec 044): seeds every build's lineage fields and
// links old copies to the build they were copied from.
//
//   seed:  every build without them gets `duplicateOf: null` (public lists
//          filter `== null`, and Firestore never matches a missing field),
//          `stepsHash` (the nightly job's fingerprint) and `stepsSince`
//          (Firestore's own createTime). Present fields are never touched.
//   link:  a build with NO `remixOf` field gets `remixOf` = the earliest
//          build with exactly the same steps and civilisation, when that
//          earliest build is by ANOTHER account. Only builds that still exist
//          are read, so a deleted original passes to the next in line. `remixOf: null`
//          is left alone: it records a remix of one's own build.
//   review: copy-titled builds that only nearly match (≥ 0.8 of their step rows)
//          are written to scripts/.scratch/remix-review.md and linked only when
//          the owner lists their ids in --approve=<file>.
//
// "Earliest" is Firestore's createTime, which only the server sets. Never
// `timeCreated`: a client writes it, and Publish resets it (research R2).
//
// Must run through the Admin SDK: these fields are server-owned in
// firestore.rules. Runs locally only — it is not deploy-safe, and nothing on
// Netlify runs it. No bundling needed: it imports nothing from src/.
//
// The project is whatever the credentials say; it is printed before anything
// runs. PowerShell:
//   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\key.json"
//   node scripts/link-remixes.mjs                          # dry run — the default
//   node scripts/link-remixes.mjs --apply                  # seed + exact links
//   node scripts/link-remixes.mjs --apply --approve=ids.txt  # + approved near matches
//
// A second dry run after --apply must report 0 changes.
//
// Run it BEFORE the functions deploy that switches on remix credit (spec 044
// quickstart §4): links made after it count as new activity in Trending.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const require = createRequire(import.meta.url);
const { stepRows, fingerprint, MIN_ROWS } = require("../functions/builds/lineage.js");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REVIEW_FILE = join(ROOT, "scripts", ".scratch", "remix-review.md");

const APPLY = process.argv.includes("--apply");
const APPROVE = process.argv.find((arg) => arg.startsWith("--approve="))?.slice("--approve=".length);
const BATCH_LIMIT = 500;
const PAGE_SIZE = 500;
/** Share of identical step rows from which a copy-titled build is worth a look. */
const REVIEW_THRESHOLD = 0.8;
const COPY_TITLE = /(\s-\s*copy|\(copy\)|\bcopy\s*$|副本)/i;

function resolveProjectId() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyPath) {
    try {
      return JSON.parse(readFileSync(keyPath, "utf8")).project_id ?? null;
    } catch {
      // fall through to the environment
    }
  }
  return process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCLOUD_PROJECT ?? null;
}

/** Ids the owner approved, one per line; blank lines and # comments ignored. */
function readApproved(path) {
  if (!path) return new Set();
  return new Set(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.replace(/#.*/, "").trim())
      .filter(Boolean)
  );
}

/** Share of identical rows, against the larger of the two builds. */
function similarity(a, b) {
  if (!a.length || !b.length) return 0;
  const B = new Set(b);
  const A = new Set(a);
  let shared = 0;
  for (const row of A) if (B.has(row)) shared++;
  return shared / Math.max(A.size, B.size);
}

const earlier = (a, b) => a.createMs - b.createMs || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const link = (target) => ({
  id: target.id,
  title: target.title ?? "",
  author: target.author ?? "",
  authorUid: target.authorUid ?? "",
});
const cell = (text) => String(text ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").slice(0, 80);

async function main() {
  const projectId = resolveProjectId();
  console.log(`Project:  ${projectId ?? "UNKNOWN — check your credentials"}`);
  console.log(`Mode:     ${APPLY ? "APPLY — this writes" : "dry run — nothing is written"}`);
  const approved = readApproved(APPROVE);
  if (APPROVE) console.log(`Approved: ${approved.size} id(s) from ${APPROVE}`);
  console.log("");

  if (APPLY && !projectId) {
    console.error("Refusing to write when the target project cannot be identified.");
    process.exit(1);
  }

  initializeApp();
  const db = getFirestore();

  // ── Read everything once ───────────────────────────────────────────────────
  const builds = [];
  let cursor = null;
  for (;;) {
    let query = db.collection("builds").orderBy("__name__").limit(PAGE_SIZE);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    if (snapshot.empty) break;
    for (const doc of snapshot.docs) {
      const data = doc.data() ?? {};
      const rows = stepRows(data.steps);
      builds.push({
        id: doc.id,
        ref: doc.ref,
        createTime: doc.createTime,
        createMs: doc.createTime.toMillis(),
        civ: data.civ,
        title: data.title,
        author: data.author,
        authorUid: data.authorUid,
        isDraft: data.isDraft,
        hasRemixOf: Object.prototype.hasOwnProperty.call(data, "remixOf"),
        has: {
          duplicateOf: Object.prototype.hasOwnProperty.call(data, "duplicateOf"),
          stepsHash: Object.prototype.hasOwnProperty.call(data, "stepsHash"),
          stepsSince: Object.prototype.hasOwnProperty.call(data, "stepsSince"),
        },
        rows,
        hash: fingerprint(data.steps),
      });
    }
    cursor = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < PAGE_SIZE) break;
  }

  // ── Plan ───────────────────────────────────────────────────────────────────
  const updates = new Map(); // id -> update
  const put = (build, fields) => updates.set(build.id, { ...(updates.get(build.id) ?? {}), ...fields });
  const counts = { seedDuplicateOf: 0, seedHash: 0, seedSince: 0, exact: 0, exactPublished: 0, review: 0, approved: 0 };

  for (const build of builds) {
    if (!build.has.duplicateOf) (put(build, { duplicateOf: null }), counts.seedDuplicateOf++);
    if (!build.has.stepsHash) (put(build, { stepsHash: build.hash }), counts.seedHash++);
    if (!build.has.stepsSince) (put(build, { stepsSince: build.createTime }), counts.seedSince++);
  }

  const groups = new Map();
  for (const build of builds) {
    if (!build.hash) continue;
    const key = `${build.civ}\n${build.hash}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(build);
  }
  for (const group of groups.values()) group.sort(earlier);

  const exactIds = new Set();
  const examples = [];
  for (const build of builds) {
    if (build.hasRemixOf || !build.hash) continue;
    const group = groups.get(`${build.civ}\n${build.hash}`);
    // The earliest build with these steps is the original. A copy is linked
    // only when that original is someone else's: an author's own later
    // copies are no remix (and must not be linked to another player's copy
    // of their own build, which "earliest by another account" would do).
    const target = group[0];
    if (target === build || target.authorUid === build.authorUid) continue;
    put(build, { remixOf: link(target) });
    exactIds.add(build.id);
    counts.exact++;
    if (build.isDraft === false) counts.exactPublished++;
    if (examples.length < 8 && build.isDraft === false) examples.push([build, target]);
  }

  const byCiv = new Map();
  for (const build of builds) {
    if (!byCiv.has(build.civ)) byCiv.set(build.civ, []);
    byCiv.get(build.civ).push(build);
  }
  const review = [];
  for (const build of builds) {
    if (build.hasRemixOf || exactIds.has(build.id) || build.rows.length < MIN_ROWS) continue;
    if (!COPY_TITLE.test(build.title ?? "")) continue;
    let best = null;
    for (const other of byCiv.get(build.civ) ?? []) {
      if (other === build || other.authorUid === build.authorUid || earlier(other, build) >= 0) continue;
      const share = similarity(build.rows, other.rows);
      // Ties go to the earlier build: a copy of the original matches as well
      // as the original does, and the link must name the original.
      if (!best || share > best.share || (share === best.share && earlier(other, best.other) < 0)) {
        best = { other, share };
      }
    }
    if (!best || best.share < REVIEW_THRESHOLD) continue;
    review.push({ build, ...best });
    counts.review++;
    if (approved.has(build.id)) {
      put(build, { remixOf: link(best.other) });
      counts.approved++;
    }
  }
  review.sort((a, b) => b.share - a.share);

  // ── Report ────────────────────────────────────────────────────────────────
  mkdirSync(dirname(REVIEW_FILE), { recursive: true });
  const lines = [
    "# Remix review (spec 044)",
    "",
    `Project ${projectId}, ${new Date().toISOString()}. Copy-titled builds with no exact match whose`,
    `step rows match an earlier build by another account at ≥ ${REVIEW_THRESHOLD}. Copy the ids to link`,
    "into a file, one per line, and run with --apply --approve=<file>.",
    "",
    "| Id | Copy | By | Best match | By | Share | Listed |",
    "|---|---|---|---|---|---|---|",
    ...review.map(
      ({ build, other, share }) =>
        `| ${build.id} | ${cell(build.title)} | ${cell(build.author)} | ${cell(other.title)} | ${cell(other.author)} | ${share.toFixed(2)} | ${build.isDraft === false ? "yes" : "no"} |`
    ),
    "",
  ];
  writeFileSync(REVIEW_FILE, lines.join("\n"));

  console.log(`builds read:                 ${builds.length}`);
  console.log(`seed duplicateOf: null       ${counts.seedDuplicateOf}`);
  console.log(`seed stepsHash               ${counts.seedHash}`);
  console.log(`seed stepsSince              ${counts.seedSince}`);
  console.log(`exact links                  ${counts.exact} (published ${counts.exactPublished})`);
  console.log(`near matches for review      ${counts.review}  → ${REVIEW_FILE}`);
  if (APPROVE) console.log(`approved near matches linked ${counts.approved}`);
  if (examples.length) {
    console.log("\nexamples:");
    for (const [copy, target] of examples) {
      console.log(`  "${copy.title}" (${copy.author}) → "${target.title}" (${target.author})`);
    }
  }

  // ── Write ─────────────────────────────────────────────────────────────────
  const byId = new Map(builds.map((build) => [build.id, build]));
  if (APPLY) {
    let batch = db.batch();
    let size = 0;
    let written = 0;
    for (const [id, update] of updates) {
      batch.update(byId.get(id).ref, update);
      size++;
      written++;
      if (size >= BATCH_LIMIT) {
        await batch.commit();
        console.log(`  committed ${written} …`);
        batch = db.batch();
        size = 0;
      }
    }
    if (size) await batch.commit();
    console.log(`\nUpdated ${written} of ${builds.length} builds.`);
  } else {
    console.log(`\nWould update ${updates.size} of ${builds.length} builds.`);
    console.log("Re-run with --apply to write.");
  }
}

main().catch((err) => {
  console.error("Link failed:", err.message);
  process.exit(1);
});
