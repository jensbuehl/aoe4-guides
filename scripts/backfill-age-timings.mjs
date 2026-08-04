// One-off developer script: stamps every existing build with its derived
// ageTimings, so builds saved before the field existed still show their age
// timings — in particular on the home lanes, which read a pre-generated summary
// and have no steps of their own to derive from.
//
// Must run through the Admin SDK: firestore.rules restricts build writes to each
// build's own author, so no signed-in user can rewrite 4k builds from the client.
//
// The @ alias is a Vite concept that plain Node cannot resolve, and
// timingsHelper.js imports through it, so bundle first. One line — PowerShell
// treats a trailing backslash as an argument, not a line continuation:
//
//   npx esbuild scripts/backfill-age-timings.mjs --bundle --platform=node --external:firebase-admin --alias:@=./src --outfile=scripts/.build/backfill.cjs
//
// The project is whatever the credentials say — .firebaserc aliases do not apply
// to the Admin SDK. Use a dev service-account key to hit aoe4-guides-dev, a prod
// one to hit aoe4-guides. The project is printed before anything runs.
//
// PowerShell:
//   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\dev-sa.json"
//   node scripts/.build/backfill.cjs            # dry run — the default
//   node scripts/.build/backfill.cjs --apply    # writes
//
// bash:
//   export GOOGLE_APPLICATION_CREDENTIALS=path/to/dev-sa.json
//   node scripts/.build/backfill.cjs
//   node scripts/.build/backfill.cjs --apply

import { readFileSync } from "fs";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAgeTimings, toStoredAgeTimings } from "@/composables/builds/useAgeTimings.js";

// Writing is opt-in. The target project comes from the credentials alone —
// .firebaserc aliases mean nothing to the Admin SDK — so a mistyped env var
// silently points at production. Defaulting to a dry run makes that harmless.
const APPLY = process.argv.includes("--apply");
const DRY_RUN = !APPLY;
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

const summarise = (stored) => {
  const parts = Object.entries(stored).map(
    ([age, value]) => `${age} ${value.e ? "~" : ""}${Math.floor(value.t / 60)}:${String(value.t % 60).padStart(2, "0")}`
  );
  return parts.length ? parts.join(" · ") : "(none)";
};

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

  let processed = 0;
  let written = 0;
  let empty = 0;
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
      const stored = toStoredAgeTimings(getAgeTimings(doc.data()?.steps));
      if (!Object.keys(stored).length) empty++;

      // Log the first page in dry run so the shape can be eyeballed before
      // 4k documents carry it.
      if (DRY_RUN && processed <= 20) {
        console.log(`  ${doc.id}  ${summarise(stored)}`);
      }

      if (!DRY_RUN) {
        batch.update(doc.ref, { ageTimings: stored });
        batchSize++;
        written++;

        if (batchSize >= BATCH_LIMIT) {
          await batch.commit();
          console.log(`  committed ${written} …`);
          batch = db.batch();
          batchSize = 0;
        }
      }
    }

    cursor = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < PAGE_SIZE) break;
  }

  if (!DRY_RUN && batchSize > 0) {
    await batch.commit();
    console.log(`  committed ${written}`);
  }

  console.log(
    `\n${DRY_RUN ? "Would update" : "Updated"} ${DRY_RUN ? processed : written} of ${processed} builds` +
      ` (${empty} have no derivable timings and get an empty map).`
  );
  if (DRY_RUN) console.log("Re-run with --apply to write.");
}

main().catch((err) => {
  console.error("Backfill failed:", err.message);
  process.exit(1);
});
