// READ-ONLY check: has anyone been inflating likes or upvotes? (spec 042, US1)
//
// Every account's `favorites/{uid}` document lists the builds it has liked
// (`favorites`) and upvoted (`upvotes`). For every build this compares each
// count with the number of accounts whose list holds it:
//
//   gap = count − holders
//
// The size of a gap means nothing on its own: before 2026-11-07 anyone could
// write any value to these counts, and the count and the list used to be two
// separate writes that drifted apart honestly. What shows abuse is a gap that
// GROWS between two runs — a count rising faster than the accounts that hold
// the build. So each run saves a snapshot, and compares with the latest one
// before it.
//
// Writes NOTHING to Firestore. The snapshot goes to scripts/.scratch/vote-gaps/
// (gitignored, never bundled): build ids, titles and counts only, all of which
// are public; no account id is printed or stored.
//
// Cost: one read per build plus one per favourites document (~9.5k, 2026-11).
//
// The project is whatever the credentials say (.firebaserc does not apply to
// the Admin SDK); it is printed first.
//
// PowerShell:
//   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\prod-sa.json"
//   node scripts/check-vote-gaps.mjs
//   Remove-Item Env:GOOGLE_APPLICATION_CREDENTIALS
//
// Imports nothing from src/: it never runs on a deploy, but there is no reason
// to tie it to the app's module format either.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "scripts", ".scratch", "vote-gaps");
const LISTS = [
  { list: "favorites", counter: "likes" },
  { list: "upvotes", counter: "upvotes" },
];
const BUCKETS = [[0, 0], [1, 5], [6, 10], [11, 20], [21, 25], [26, 29], [30, 30], [31, Infinity]];

function projectId() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyPath) return null;
  try {
    return JSON.parse(readFileSync(keyPath, "utf8")).project_id ?? null;
  } catch {
    return null;
  }
}

/** The latest snapshot in OUT_DIR, or null. Names are ISO timestamps, so they sort by time. */
function latestSnapshot() {
  let files;
  try {
    files = readdirSync(OUT_DIR).filter((f) => f.endsWith(".json")).sort();
  } catch {
    return null;
  }
  if (!files.length) return null;
  const file = files[files.length - 1];
  return { file, data: JSON.parse(readFileSync(join(OUT_DIR, file), "utf8")) };
}

function distribution(lengths) {
  const sorted = [...lengths].sort((a, b) => a - b);
  const nonEmpty = sorted.filter((n) => n > 0);
  const at = (p) => nonEmpty[Math.min(nonEmpty.length - 1, Math.floor((p / 100) * nonEmpty.length))] ?? 0;
  // Pairs, not an object: integer-like keys ("0", "30") would be reordered
  // ahead of the others.
  const buckets = BUCKETS.map(([lo, hi]) => [
    lo === hi ? `${lo}` : hi === Infinity ? `${lo}+` : `${lo}-${hi}`,
    sorted.filter((n) => n >= lo && n <= hi).length,
  ]);
  return { accounts: nonEmpty.length, median: at(50), p90: at(90), p99: at(99), max: nonEmpty.at(-1) ?? 0, buckets };
}

async function main() {
  const project = projectId();
  console.log(`project: ${project ?? "(unknown — set GOOGLE_APPLICATION_CREDENTIALS)"}`);
  if (!project) process.exit(1);

  initializeApp();
  const db = getFirestore();

  const [buildSnap, favSnap] = await Promise.all([
    db.collection("builds").select("title", "likes", "upvotes", "isDraft").get(),
    db.collection("favorites").select("favorites", "upvotes").get(),
  ]);

  // Holders per build and list. Each list is deduplicated first: an old list
  // can hold an id twice, and that is still one account.
  const holders = { favorites: new Map(), upvotes: new Map() };
  const lengths = { favorites: [], upvotes: [] };
  for (const doc of favSnap.docs) {
    for (const { list } of LISTS) {
      const value = doc.get(list);
      const ids = new Set(Array.isArray(value) ? value : []);
      lengths[list].push(ids.size);
      for (const id of ids) holders[list].set(id, (holders[list].get(id) ?? 0) + 1);
    }
  }

  const builds = {};
  const nonFinite = [];
  for (const doc of buildSnap.docs) {
    const d = doc.data();
    const row = { title: String(d.title ?? ""), isDraft: d.isDraft === true };
    for (const { list, counter } of LISTS) {
      if (d[counter] !== undefined && !Number.isFinite(d[counter])) nonFinite.push({ id: doc.id, counter, value: String(d[counter]) });
      row[counter] = Number.isFinite(d[counter]) ? d[counter] : 0;
      row[`${counter}Holders`] = holders[list].get(doc.id) ?? 0;
    }
    builds[doc.id] = row;
  }

  const takenAt = new Date().toISOString();
  const snapshot = {
    takenAt,
    project,
    builds,
    nonFinite,
    lengths: { favorites: distribution(lengths.favorites), upvotes: distribution(lengths.upvotes) },
  };

  const previous = latestSnapshot();
  mkdirSync(OUT_DIR, { recursive: true });
  const outFile = join(OUT_DIR, `${takenAt.replace(/[:.]/g, "-")}.json`);
  writeFileSync(outFile, JSON.stringify(snapshot));

  console.log(`builds: ${buildSnap.size} · favourites documents: ${favSnap.size}`);
  console.log(`snapshot saved: ${outFile}`);

  console.log("\n== list lengths (accounts with ≥1; aggregates only)");
  for (const { list } of LISTS) {
    const s = snapshot.lengths[list];
    console.log(`  ${list}: ${s.accounts} accounts · median ${s.median}, p90 ${s.p90}, p99 ${s.p99}, max ${s.max}`);
    console.log(`    ${s.buckets.map(([k, v]) => `${k}: ${v}`).join(" · ")}`);
  }

  if (nonFinite.length) {
    console.log(`\n== non-finite counts (${nonFinite.length}) — reported apart, counted as 0 above`);
    for (const n of nonFinite) console.log(`  ${n.id} ${n.counter} = ${n.value} · ${builds[n.id].title}`);
  }

  if (!previous) {
    console.log("\nNo earlier snapshot: this is the baseline. Run again in ≥ 7 days to see which gaps grow.");
    return;
  }

  const days = (Date.parse(takenAt) - Date.parse(previous.data.takenAt)) / 86400000;
  console.log(`\n== compared with ${previous.file} (${days.toFixed(1)} days earlier)`);
  if (previous.data.project !== project) {
    console.log(`  ! previous snapshot is from project ${previous.data.project} — comparison skipped`);
    return;
  }

  for (const { counter } of LISTS) {
    const growing = [];
    const drifting = [];
    for (const [id, now] of Object.entries(builds)) {
      const before = previous.data.builds[id];
      // A build new since the last run is compared against a gap of 0: an
      // honest new build has as many holders as likes.
      const gapBefore = before ? before[counter] - before[`${counter}Holders`] : 0;
      const gapNow = now[counter] - now[`${counter}Holders`];
      const growth = gapNow - gapBefore;
      const row = { id, title: now.title, count: now[counter], holders: now[`${counter}Holders`], growth };
      if (growth > 0) growing.push(row);
      else if (growth < 0) drifting.push(row);
    }
    growing.sort((a, b) => b.growth - a.growth);
    drifting.sort((a, b) => a.growth - b.growth);

    console.log(`\n== ${counter}: growing gaps (the finding) — ${growing.length || "none"}`);
    for (const r of growing) console.log(`  +${r.growth}  ${r.id}  ${r.count} ${counter}, ${r.holders} holders · ${r.title}`);
    console.log(`== ${counter}: drift (gap shrank) — ${drifting.length || "none"}`);
    for (const r of drifting.slice(0, 20)) console.log(`  ${r.growth}  ${r.id}  ${r.count} ${counter}, ${r.holders} holders · ${r.title}`);
    if (drifting.length > 20) console.log(`  … and ${drifting.length - 20} more`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
