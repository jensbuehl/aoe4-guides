const { gzipSync } = require("node:zlib");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const logger = require("firebase-functions/logger");
const { TRENDING_SOURCE, activityTotal, nextTrend, scoreFromTrend } = require("./trend");
const { buildSearchIndex, shouldPublish } = require("./searchIndex");
const { fingerprint, derive } = require("./lineage");

const BATCH_SIZE = 500;
/** Builds read per page: one page of steps in memory at a time (~4 MB at p95). */
const PAGE_SIZE = 500;
const COMPARE_TOP = 8;

/** Where the app fetches the search index from (contracts/search-index-object.md). */
const SEARCH_INDEX_PATH = "search/builds.json";
/** An hour in every browser's cache; after that a revalidation, which transfers no body. */
const SEARCH_INDEX_CACHE_CONTROL = "public, max-age=3600";
/** Above this gzip size the index is nearing SC-004's limit; warn well before it. */
const SEARCH_INDEX_WARN_BYTES = 300 * 1024;

/**
 * Daily recalculation of every build's recency score (spec 040, see trend.js
 * for the method).
 *
 * 23:30 UTC so the 00:00 home snapshot picks up the fresh order the same night.
 * The time zone is set explicitly; left out, Cloud Scheduler also uses UTC, but
 * that is a default nobody reading this would know.
 *
 * Reads every build in pages of PAGE_SIZE, `steps` included since spec 044:
 * each page's steps are fingerprinted (lineage.js) and dropped before the next
 * page is read, so memory holds one page of steps, not 36 MB. Read ops are the
 * same as before, and the transfer stays inside Google Cloud — it is not the
 * internet egress the bill charges for.
 *
 * Lineage (spec 044), from that one read: which published builds are exact
 * duplicates of another (`duplicateOf`, which every public list filters on),
 * when each build's current steps were first seen (`stepsHash`, `stepsSince`
 * — the server's own clock decides who was first, never the client's
 * `timeCreated`), and each build's remix credit and remix list. The credit is
 * part of the activity both scores weigh, so it is derived BEFORE the scores.
 *
 * Writes only builds whose values changed. While TRENDING_SOURCE is "legacy"
 * it writes only the trend* fields, which nothing reads yet; once "recency",
 * it also writes `score`, which every Trending surface sorts by.
 *
 * Each run logs one `updateBuildTrend: comparison` entry: the top eight by the
 * new score beside the top eight by the stored one. That is how the shadow
 * period is judged before switching (quickstart §3).
 *
 * It also writes the build search index (spec 043). This job already reads
 * every build, so the index costs no extra reads, and running after the score
 * writes means it carries tomorrow's Trending order. See publishSearchIndex.
 */
exports.updateBuildTrend = onSchedule(
  { schedule: "30 23 * * *", timeZone: "UTC", timeoutSeconds: 540 },
  async () => {
    logger.log("updateBuildTrend: start", { source: TRENDING_SOURCE });
    const db = getFirestore();
    // Taken BEFORE the read. The app retires a build from an author's own hide
    // list once the index is newer than the unlist; stamped at upload instead,
    // an unlist landing between this read and the upload would count as covered
    // while the index still holds the build (spec 043 data-model).
    const indexGenerated = new Date().toISOString();
    const docs = await readBuilds(db);

    const now = Timestamp.now();
    const nowMs = now.toMillis();
    const counts = { seeded: 0, held: 0, rebased: 0, updated: 0, unchanged: 0 };
    const writes = [];
    const listed = [];
    const searchRows = [];

    const lineage = derive(
      docs.map(({ id, build, hash, createTimeMs }) => ({
        id,
        civ: build.civ,
        authorUid: build.authorUid,
        author: build.author,
        title: build.title,
        isDraft: build.isDraft,
        scoreAllTime: build.scoreAllTime,
        createTimeMs,
        stepsHash: hash,
        // undefined when the field is absent (first sight), null when it holds null.
        storedHash: build.stepsHash,
        storedSinceMs: build.stepsSince?.toMillis?.(),
        remixOf: build.remixOf,
      })),
      nowMs
    );
    const lineageCounts = { hashed: 0, changedHash: 0, duplicates: 0, unhidden: 0, credited: 0, remixListed: 0 };

    for (const { id, ref, build } of docs) {
      const derived = lineage.get(id);
      const lineageUpdate = lineageChanges(build, derived, lineageCounts);
      // The score reads tonight's credit, not yesterday's.
      build.remixCredit = derived.remixCredit;

      const result = nextTrend(build, activityTotal(build), nowMs);
      counts[result.kind]++;

      const update = { ...lineageUpdate };
      if (result.kind !== "unchanged") {
        Object.assign(update, {
          trend: result.trend,
          trendBase: result.trendBase,
          trendAt: now,
          trendWeights: result.trendWeights,
        });
      }
      const nextScore = TRENDING_SOURCE === "recency" ? scoreFromTrend(result.trend) : build.score;
      if (TRENDING_SOURCE === "recency" && nextScore !== build.score) update.score = nextScore;
      if (Object.keys(update).length) writes.push({ ref, update });

      // Every build, unlisted ones and duplicates included: buildSearchIndex is
      // the one place that drops them, so check:search can prove it does.
      searchRows.push({
        id,
        title: build.title,
        author: build.author,
        authorUid: build.authorUid,
        civ: build.civ,
        season: build.season,
        isDraft: build.isDraft,
        duplicateOf: derived.duplicateOf,
        score: nextScore,
        ageTimings: build.ageTimings,
      });

      // The comparison log is what Trending shows, and Trending hides duplicates.
      if (build.isDraft !== true && !derived.duplicateOf) {
        // Not `?? 0`: the old weekly job stored NaN for builds without `views`,
        // and one NaN makes the sort comparator meaningless for the whole list.
        const score = Number.isFinite(build.score) ? build.score : 0;
        listed.push({ id, title: build.title ?? "", trend: result.trend, score });
      }
    }

    for (let i = 0; i < writes.length; i += BATCH_SIZE) {
      const batch = db.batch();
      writes.slice(i, i + BATCH_SIZE).forEach(({ ref, update }) => batch.update(ref, update));
      await batch.commit();
    }

    const top = (key) =>
      [...listed]
        .sort((a, b) => b[key] - a[key])
        .slice(0, COMPARE_TOP)
        .map(({ id, title, trend, score }) => ({ id, title, trend: Math.round(trend), score: Number(score.toFixed(3)) }));

    logger.log("updateBuildTrend: comparison", {
      source: TRENDING_SOURCE,
      byTrend: top("trend"),
      byStoredScore: top("score"),
    });
    logger.log("updateBuildTrend: lineage", lineageCounts);
    logger.log("updateBuildTrend: done", { builds: docs.length, written: writes.length, ...counts });

    // After the Trending writes and in its own try, deliberately. A search
    // failure must never cost a Trending update; and if the Trending writes
    // throw, the run ends above this line and yesterday's index keeps serving.
    try {
      await publishSearchIndex(searchRows, indexGenerated);
    } catch (error) {
      // logger.error, not log: Error Reporting raises it. A stale index is
      // invisible to players, so nobody else would ever notice.
      logger.error("updateBuildTrend: search index failed", { error: error.message, stack: error.stack });
    }
  }
);

/**
 * Every build, read in pages with its steps, which are fingerprinted and then
 * dropped (see the header): `{ id, ref, build, hash, createTimeMs }` per build,
 * `build` without `steps`.
 *
 * `createTime` is Firestore's own document metadata — the only creation time a
 * client cannot set. lineage.js uses it, never the build's `timeCreated`.
 *
 * @param {FirebaseFirestore.Firestore} db
 * @return {Promise<Array<Object>>}
 */
async function readBuilds(db) {
  const docs = [];
  let cursor = null;
  for (;;) {
    let query = db
      .collection("builds")
      .select(
        "title", "views", "likes", "upvotes", "isDraft", "score", "trend", "trendBase", "trendAt", "trendWeights",
        // For the search index:
        "author", "authorUid", "civ", "season", "ageTimings",
        // For lineage (spec 044):
        "steps", "scoreAllTime", "remixOf", "duplicateOf", "stepsHash", "stepsSince", "remixCredit", "remixes"
      )
      .orderBy("__name__")
      .limit(PAGE_SIZE);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    for (const doc of snapshot.docs) {
      const build = doc.data();
      const hash = fingerprint(build.steps);
      delete build.steps;
      docs.push({ id: doc.id, ref: doc.ref, build, hash, createTimeMs: doc.createTime.toMillis() });
    }
    if (snapshot.size < PAGE_SIZE) break;
    cursor = snapshot.docs[snapshot.docs.length - 1];
  }
  return docs;
}

/** Same value, as stored data: key order and nesting included. */
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * The lineage fields of one build that differ from what derive() says they
 * should be, as an update. Only changes are written, as for the scores.
 *
 * `duplicateOf` is written as null on any build that lacks it, even when
 * nothing else changed: every public list filters `duplicateOf == null`, and a
 * missing field never matches, so this is the safety net for builds an older
 * cached app created without it (spec 044, research R5).
 *
 * @param {Object} build - the stored fields.
 * @param {Object} derived - lineage.js derive() for this build.
 * @param {Object} counts - tallies for the lineage log line, updated in place.
 * @return {Object}
 */
function lineageChanges(build, derived, counts) {
  const update = {};
  if (derived.stepsHash) counts.hashed++;
  if (build.stepsHash !== derived.stepsHash) {
    if (build.stepsHash !== undefined) counts.changedHash++;
    update.stepsHash = derived.stepsHash;
  }
  if (build.stepsSince?.toMillis?.() !== derived.stepsSince) {
    update.stepsSince = Timestamp.fromMillis(derived.stepsSince);
  }
  if (!("duplicateOf" in build) || !same(build.duplicateOf, derived.duplicateOf)) {
    update.duplicateOf = derived.duplicateOf;
  }
  if (derived.duplicateOf) counts.duplicates++;
  else if (build.duplicateOf) counts.unhidden++;
  if ((Number.isFinite(build.remixCredit) ? build.remixCredit : 0) !== derived.remixCredit || !("remixCredit" in build)) {
    update.remixCredit = derived.remixCredit;
  }
  if (derived.remixCredit) counts.credited++;
  if (!same(build.remixes, derived.remixes)) {
    // Absent when there are none: the page shows nothing, and most builds stay small.
    update.remixes = derived.remixes ?? FieldValue.delete();
  }
  if (derived.remixes) counts.remixListed++;
  return update;
}

/**
 * Builds the search index and uploads it to Storage, unless it looks broken.
 *
 * Gzipped at rest with `Content-Encoding: gzip`, so the browser downloads
 * ~170 KB rather than ~400 KB and inflates it itself. Readable without App
 * Check — see the rule in storage.rules for why that must stay true.
 *
 * @param {Array<Object>} rows - Every build read, unlisted ones included.
 * @param {string} generated - ISO time the read started.
 * @return {Promise<void>}
 */
async function publishSearchIndex(rows, generated) {
  const file = getStorage().bucket().file(SEARCH_INDEX_PATH);

  let previousCount = 0;
  try {
    const [metadata] = await file.getMetadata();
    previousCount = Number(metadata.metadata?.buildCount) || 0;
  } catch (error) {
    // 404 on the first run; anything else is a real failure.
    if (error.code !== 404) throw error;
  }

  const index = buildSearchIndex(rows, generated);
  const count = index.builds.length;
  if (!shouldPublish(previousCount, count)) {
    logger.error("updateBuildTrend: search index withheld", { previousCount, count });
    return;
  }

  const json = JSON.stringify(index);
  await file.save(json, {
    gzip: true,
    contentType: "application/json",
    metadata: {
      cacheControl: SEARCH_INDEX_CACHE_CONTROL,
      metadata: { buildCount: String(count), generated },
    },
  });

  const gzipBytes = gzipSync(json).length;
  // Positions 6-7 Feudal, 8-9 Castle (searchIndex.js). These figures decide
  // whether an age-time filter is worth building (spec 043 FR-027/FR-028): a
  // filter hides every build without a time.
  const withFeudal = index.builds.filter((row) => row[6] !== null);
  const withCastle = index.builds.filter((row) => row[8] !== null);
  logger.log("updateBuildTrend: search index written", {
    count,
    authors: index.authors.length,
    gzipBytes,
    withFeudal: withFeudal.length,
    feudalEstimated: withFeudal.filter((row) => row[7] === 1).length,
    withCastle: withCastle.length,
    castleEstimated: withCastle.filter((row) => row[9] === 1).length,
  });
  if (gzipBytes > SEARCH_INDEX_WARN_BYTES) {
    logger.warn("updateBuildTrend: search index is nearing its size limit", { gzipBytes });
  }
}
