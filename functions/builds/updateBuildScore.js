const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const { TRENDING_SOURCE, activityTotal } = require("./trend");

const BATCH_SIZE = 500;

exports.updateBuildScore = onSchedule(
  { schedule: "0 0 * * 5", timeoutSeconds: 1800 },
  async (event) => {
    // Retired by the recency score (spec 040): once trend.js says "recency",
    // updateBuildTrend writes `score` daily and this must not overwrite it.
    if (TRENDING_SOURCE === "recency") {
      logger.log("updateBuildScore: skipped, trending is recency-based");
      return;
    }
    logger.log("start updateBuildScore");
    const db = getFirestore();
    const snapshot = await db.collection("builds").get();
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      docs.slice(i, i + BATCH_SIZE).forEach((doc) => {
        batch.set(doc.ref, { score: calculateScore(doc.data()) }, { merge: true });
      });
      await batch.commit();
      logger.log(`updateBuildScore: committed ${Math.min(i + BATCH_SIZE, docs.length)} / ${docs.length}`);
    }

    logger.log("updateBuildScore: done", docs.length, "builds updated");
  }
);

const calculateScore = (build) => {
  // Shared with updateBuildTrend. A build without `views` used to score NaN here.
  const score = activityTotal(build);

  let baseScore = Math.log(Math.max(score, 1));

  const msPerWeek = 60 * 1000 * 60 * 24 * 7;
  const elapsed = Date.now() - build.timeCreated.toDate().getTime();
  const weeks = Math.floor(elapsed / msPerWeek);

  if (weeks > 6) {
    const x = weeks - 6;
    baseScore *= Math.exp(-0.05 * x * x);
  }

  return baseScore;
};
