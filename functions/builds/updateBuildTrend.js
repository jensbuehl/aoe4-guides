const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const { TRENDING_SOURCE, activityTotal, nextTrend, scoreFromTrend } = require("./trend");

const BATCH_SIZE = 500;
const COMPARE_TOP = 8;

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
 */
exports.updateBuildTrend = onSchedule(
  { schedule: "30 23 * * *", timeZone: "UTC", timeoutSeconds: 540 },
  async () => {
    logger.log("updateBuildTrend: start", { source: TRENDING_SOURCE });
    const db = getFirestore();
    const snapshot = await db
      .collection("builds")
      .select("title", "views", "likes", "upvotes", "downvotes", "isDraft", "score", "trend", "trendBase", "trendAt")
      .get();

    const now = Timestamp.now();
    const nowMs = now.toMillis();
    const counts = { seeded: 0, held: 0, updated: 0, unchanged: 0 };
    const writes = [];
    const listed = [];

    for (const doc of snapshot.docs) {
      const build = doc.data();
      const result = nextTrend(build, activityTotal(build), nowMs);
      counts[result.kind]++;

      const update = {};
      if (result.kind !== "unchanged") {
        Object.assign(update, { trend: result.trend, trendBase: result.trendBase, trendAt: now });
      }
      if (TRENDING_SOURCE === "recency") {
        const score = scoreFromTrend(result.trend);
        if (score !== build.score) update.score = score;
      }
      if (Object.keys(update).length) writes.push({ ref: doc.ref, update });

      if (build.isDraft !== true) {
        listed.push({ id: doc.id, title: build.title ?? "", trend: result.trend, score: build.score ?? 0 });
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
  }
);
