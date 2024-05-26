const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

/**
 * Updates the all time score of all builds on a schedule. (monthly)
 *
 * @name updateBuildScore
 * @function
 * @async
 * @memberof module:functions
 * @param {Object} event - The Firebase event object.
 * @return {Promise} A promise that resolves when all builds have been updated.
 */
exports.updateBuildAllTimeScore = onSchedule(
  { schedule: "0 0 1 * *", timeoutSeconds: 3600 },
  async (event) => {
    logger.log("start updateBuildAllTimeScore");

    // Get all builds
    const snapshot = await getFirestore().collection("builds").get();

    //Get count
    var countSnapshot = await getFirestore().collection("builds").count().get();
    var count = countSnapshot.data().count;

    const promise = [];
    var index = 1;
    snapshot.forEach((doc) => {
      console.log("Build", doc.id, index, "of", count);
      index++;

      // Set updated build
      promise.push(
        getFirestore()
          .collection("builds")
          .doc(doc.id)
          .set(
            {
              scoreAllTime: calculateAndUpdateAllTimeScore(doc.data()),
            },
            { merge: true }
          )
      );
    });
    return Promise.all(promise);
  }
);

/**
 * Calculates the all-time score for a given build based on its views, upvotes, downvotes, and likes.
 *
 * @param {Object} build - The build object containing the views, upvotes, downvotes, and likes.
 * @return {number} The calculated all-time score.
 */
const calculateAndUpdateAllTimeScore = (build) => {
  //score calculation
  var score = build.views;
  score = score + 5 * (build.upvotes ? build.upvotes : 0);
  score = score - 10 * (build.downvotes ? build.downvotes : 0);
  score = score + 50 * (build.likes ? build.likes : 0);

  var baseScore = Math.log(Math.max(score, 1));

  logger.log("score", baseScore);

  return baseScore;
};
