// One-off developer script (spec 045): rewrites every build's `map` and
// `strategy` to a value the app offers, the hard way.
//
//   map:      Water and Hybrid kept; everything else — Open, Closed, empty,
//             missing, junk — becomes Land.
//   strategy: an option (any case) is kept; a value naming exactly one option
//             becomes it ("Feudal Rush" → Rush); everything else, null
//             included, is removed ("").
//
// The rules come from normaliseMap / normaliseStrategy, the same functions the
// save path and the importer use, so the cleanup cannot disagree with them.
// It must run before firestore.rules' allowedFacets() is deployed, or authors
// editing a legacy build would be refused (spec 045 research R8).
//
// Must run through the Admin SDK: firestore.rules restricts build writes to each
// build's own author, so no signed-in user can rewrite every build from the
// client. It writes ONLY `map` and `strategy`, and only on documents where one
// of them changes — counters, scores, timestamps and content are untouched.
//
// The @ alias is a Vite concept that plain Node cannot resolve, and the
// providers are imported through it, so bundle first. One line — PowerShell
// treats a trailing backslash as an argument, not a line continuation:
//
//   npx esbuild scripts/backfill-map-strategy.mjs --bundle --platform=node --external:firebase-admin --alias:@=./src --outfile=scripts/.build/map-strategy.cjs
//
// The project is whatever the credentials say — .firebaserc aliases do not apply
// to the Admin SDK. Use a dev service-account key to hit aoe4-guides-dev, a prod
// one to hit aoe4-guides. The project is printed before anything runs.
//
// PowerShell:
//   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\dev-sa.json"
//   node scripts/.build/map-strategy.cjs            # dry run — the default
//   node scripts/.build/map-strategy.cjs --apply    # writes
//
// Review the dry run's table before --apply: every removed strategy is listed,
// and anything worth keeping can be moved into a description by hand first.
// A second dry run after --apply must report 0 changes (spec 045 SC-001).

import { readFileSync } from "fs";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { normaliseMap } from "@/composables/filter/mapDefaultProvider.js";
import { normaliseStrategy } from "@/composables/filter/strategyDefaultProvider.js";

// Writing is opt-in. The target project comes from the credentials alone, so a
// mistyped env var silently points at production. Defaulting to a dry run
// makes that harmless.
const APPLY = process.argv.includes("--apply");
const BATCH_LIMIT = 500;
const PAGE_SIZE = 500;

/**
 * The project these credentials actually point at, printed before anything
 * happens so the target is never a guess.
 *
 * @return {string|null} The project id, or null if it cannot be determined.
 */
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

/** Counts one old → new transition under its kind (published / draft). */
function tally(table, kind, before, after) {
  const key = `${JSON.stringify(before)} → ${JSON.stringify(after)}`;
  table[kind][key] = (table[kind][key] ?? 0) + 1;
}

function printTable(title, table) {
  for (const kind of ["published", "draft"]) {
    const rows = Object.entries(table[kind]).sort((a, b) => b[1] - a[1]);
    console.log(`\n${title}, ${kind} (${rows.reduce((sum, [, n]) => sum + n, 0)} changes):`);
    if (!rows.length) console.log("  (none)");
    for (const [transition, count] of rows) {
      console.log(`  ${String(count).padStart(6)}  ${transition}`);
    }
  }
}

async function main() {
  const projectId = resolveProjectId();

  console.log(`Project:  ${projectId ?? "UNKNOWN — check your credentials"}`);
  console.log(`Mode:     ${APPLY ? "APPLY — this writes" : "dry run — nothing is written"}\n`);

  if (APPLY && !projectId) {
    console.error("Refusing to write when the target project cannot be identified.");
    process.exit(1);
  }

  initializeApp();
  const db = getFirestore();

  const maps = { published: {}, draft: {} };
  const strategies = { published: {}, draft: {} };
  let processed = 0;
  let changed = 0;
  let written = 0;
  let batch = db.batch();
  let batchSize = 0;
  let cursor = null;

  for (;;) {
    let query = db.collection("builds").orderBy("__name__").limit(PAGE_SIZE);
    if (cursor) query = query.startAfter(cursor);

    const snapshot = await query.get();
    if (snapshot.empty) break;

    for (const doc of snapshot.docs) {
      processed++;
      const data = doc.data() ?? {};
      const kind = data.isDraft ? "draft" : "published";

      //A missing key and a stored value both count as a change when they differ
      //from the normalised one: Land is not stored on any build before this.
      const map = normaliseMap(data.map);
      const strategy = normaliseStrategy(data.strategy);
      const mapChanges = data.map !== map;
      const strategyChanges = data.strategy !== strategy;

      if (mapChanges) tally(maps, kind, data.map, map);
      if (strategyChanges) tally(strategies, kind, data.strategy, strategy);
      if (!mapChanges && !strategyChanges) continue;

      changed++;
      if (!APPLY) continue;

      batch.update(doc.ref, { map, strategy });
      batchSize++;
      written++;

      if (batchSize >= BATCH_LIMIT) {
        await batch.commit();
        console.log(`  committed ${written} …`);
        batch = db.batch();
        batchSize = 0;
      }
    }

    cursor = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < PAGE_SIZE) break;
  }

  if (APPLY && batchSize > 0) {
    await batch.commit();
    console.log(`  committed ${written}`);
  }

  printTable("map", maps);
  printTable("strategy", strategies);

  console.log(
    `\n${APPLY ? "Updated" : "Would update"} ${APPLY ? written : changed} of ${processed} builds.`
  );
  if (!APPLY) console.log("Re-run with --apply to write.");
}

main().catch((err) => {
  console.error("Cleanup failed:", err.message);
  process.exit(1);
});
