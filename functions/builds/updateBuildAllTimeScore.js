const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const BATCH_SIZE = 500;

exports.updateBuildAllTimeScore = onSchedule(
  { schedule: "0 0 1 * *", timeoutSeconds: 1800 },
  async (event) => {
    logger.log("start updateBuildAllTimeScore");
    const db = getFirestore();
    const snapshot = await db.collection("builds").get();
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      docs.slice(i, i + BATCH_SIZE).forEach((doc) => {
        batch.set(doc.ref, { scoreAllTime: calculateAllTimeScore(doc.data()) }, { merge: true });
      });
      await batch.commit();
      logger.log(`updateBuildAllTimeScore: committed ${Math.min(i + BATCH_SIZE, docs.length)} / ${docs.length}`);
    }

    logger.log("updateBuildAllTimeScore: done", docs.length, "builds updated");
  }
);

const calculateAllTimeScore = (build) => {
  let score = build.views;
  score += 5  * (build.upvotes  ?? 0);
  score -= 10 * (build.downvotes ?? 0);
  score += 50 * (build.likes    ?? 0);

  return Math.log(Math.max(score, 1));
};
