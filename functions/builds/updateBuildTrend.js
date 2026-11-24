const { gzipSync } = require("node:zlib");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const logger = require("firebase-functions/logger");
const { TRENDING_SOURCE, activityTotal, nextTrend, scoreFromTrend } = require("./trend");
const { buildSearchIndex, shouldPublish } = require("./searchIndex");

const BATCH_SIZE = 500;
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
 * Reads every build with select(): `steps` is ~7.9 of a build's ~8.5 KB and
 * nothing here needs it. A select costs the same read ops, but keeps the
 * function's memory and transfer small.
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
    const snapshot = await db
      .collection("builds")
      .select(
        "title", "views", "likes", "upvotes", "isDraft", "score", "trend", "trendBase", "trendAt", "trendWeights",
        // For the search index only:
        "author", "authorUid", "civ", "season", "ageTimings"
      )
      .get();

    const now = Timestamp.now();
    const nowMs = now.toMillis();
    const counts = { seeded: 0, held: 0, rebased: 0, updated: 0, unchanged: 0 };
    const writes = [];
    const listed = [];
    const searchRows = [];

    for (const doc of snapshot.docs) {
      const build = doc.data();
      const result = nextTrend(build, activityTotal(build), nowMs);
      counts[result.kind]++;

      const update = {};
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
      if (Object.keys(update).length) writes.push({ ref: doc.ref, update });

      // Every build, unlisted ones included: buildSearchIndex is the one place
      // that drops them, so check:search can prove it does.
      searchRows.push({
        id: doc.id,
        title: build.title,
        author: build.author,
        authorUid: build.authorUid,
        civ: build.civ,
        season: build.season,
        isDraft: build.isDraft,
        score: nextScore,
        ageTimings: build.ageTimings,
      });

      if (build.isDraft !== true) {
        // Not `?? 0`: the old weekly job stored NaN for builds without `views`,
        // and one NaN makes the sort comparator meaningless for the whole list.
        const score = Number.isFinite(build.score) ? build.score : 0;
        listed.push({ id: doc.id, title: build.title ?? "", trend: result.trend, score });
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
    logger.log("updateBuildTrend: done", { builds: snapshot.size, written: writes.length, ...counts });

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
