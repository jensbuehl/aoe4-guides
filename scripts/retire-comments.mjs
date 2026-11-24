// Retires the stored comments (spec 047, step 3).
//
// Deletes every `comments/*` document, removes the `comments` counter from
// every build that has one, and removes `notificationPreferences` (the
// reply-email opt-outs and cooldowns) from every user that has it.
//
// DRY RUN BY DEFAULT: without --write it only counts and prints, and writes
// nothing. Run it for real only after spec 047's step 2 (rules refusing comment
// writes) is deployed, so no old cached client can add a comment afterwards,
// and only with the owner's explicit go-ahead: there is no undo.
//
// Idempotent: a second run finds nothing and reports 0 / 0 / 0.
//
// Cost: one read per matching document (dry run 2026-11-24: 353 comments,
// 5,287 builds — nearly every build was seeded with comments: 0 — and 17
// users), and the same number of writes with --write. No function triggers
// on build or user writes, and the sitemap dates come from `created`, so
// touching every build changes nothing else.
//
// The project is whatever the credentials say (.firebaserc does not apply to
// the Admin SDK); it is printed first.
//
// PowerShell:
//   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\prod-sa.json"
//   node scripts/retire-comments.mjs            # dry run
//   node scripts/retire-comments.mjs --write    # delete
//   Remove-Item Env:GOOGLE_APPLICATION_CREDENTIALS
//
// Manual only: not wired into any npm script, never run on a deploy, and
// imports nothing from src/.
import { readFileSync } from "node:fs";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const WRITE = process.argv.includes("--write");

function projectId() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyPath) return null;
  try {
    return JSON.parse(readFileSync(keyPath, "utf8")).project_id ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const project = projectId();
  if (!project) {
    console.error("Set GOOGLE_APPLICATION_CREDENTIALS to a service-account key first.");
    process.exit(1);
  }
  console.log(`project: ${project}`);
  console.log(WRITE ? "mode: WRITE — deleting" : "mode: dry run — nothing will be written (pass --write to delete)");

  initializeApp({ projectId: project });
  const db = getFirestore();

  // `!= null` matches exactly the documents where the field exists (any type,
  // maps included); select() keeps the bodies of builds and users off the wire.
  const [comments, builds, users] = await Promise.all([
    db.collection("comments").select().get(),
    db.collection("builds").where("comments", "!=", null).select().get(),
    db.collection("users").where("notificationPreferences", "!=", null).select().get(),
  ]);

  console.log(`comment documents:                 ${comments.size}`);
  console.log(`builds with a comments counter:    ${builds.size}`);
  console.log(`users with notificationPreferences: ${users.size}`);

  if (!WRITE) return;

  const writer = db.bulkWriter();
  let failed = 0;
  writer.onWriteError((err) => {
    if (err.failedAttempts < 3) return true; // retry
    failed++;
    console.error(`  failed: ${err.documentRef.path}: ${err.message}`);
    return false;
  });

  for (const d of comments.docs) writer.delete(d.ref);
  for (const d of builds.docs) writer.update(d.ref, { comments: FieldValue.delete() });
  for (const d of users.docs) writer.update(d.ref, { notificationPreferences: FieldValue.delete() });
  await writer.close();

  const total = comments.size + builds.size + users.size;
  console.log(`done: ${total - failed} of ${total} writes succeeded${failed ? `, ${failed} FAILED` : ""}.`);
  console.log("Run again without --write to confirm 0 / 0 / 0.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
