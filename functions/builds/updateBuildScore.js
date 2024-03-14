const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

/**
 * Updates the score of all builds on a schedule.
 *
 * @name updateBuildScore
 * @function
 * @async
 * @memberof module:functions
 * @param {Object} event - The Firebase event object.
 * @param {Object} event.data - The event data.
 * @return {Promise} A promise that resolves when all builds have been updated.
 */
exports.updateBuildScore = onSchedule(
  { schedule: "0 0 * * 5" },
  async (event) => {
    logger.log("updateBuildScoreCalled", event.data.data());

    // Get all builds
    const snapshot = await getFirestore().collection("builds").get();

    for (const doc of snapshot.docs) {
      console.log(doc.id, "=>", doc.data().score);

      // Set updated build
      const buildRef = getFirestore().collection("builds").doc(doc.id);
      await buildRef.set(
        {
          score: await calculateAndUpdateScore(doc.data()),
        },
        { merge: true }
      );
    }
  }
);

/**
 * Calculate and update the score of a build.
 *
 * @name calculateAndUpdateScore
 * @function
 * @async
 * @memberof module:functions
 * @param {Object} build - The build object.
 * @param {number} build.views - The number of views the build has.
 * @param {number} [build.upvotes=0] - The number of upvotes the build has.
 * @param {number} [build.downvotes=0] - The number of downvotes the build has.
 * @param {number} [build.likes=0] - The number of likes the build has.
 * @return {Promise<number>} The updated score of the build.
 */
const calculateAndUpdateScore = async (build) => {
  //score calculation
  var score = build.views;
  score = score + 5 * (build.upvotes ? build.upvotes : 0);
  score = score - 10 * (build.downvotes ? build.downvotes : 0);
  score = score + 50 * (build.likes ? build.likes : 0);

  var baseScore = Math.log(Math.max(score, 1));

  //elapsed time in weeks
  var msPerMinute = 60 * 1000;
  var msPerHour = msPerMinute * 60;
  var msPerDay = msPerHour * 24;
  var msPerWeek = msPerDay * 7;

  var now = new Date();
  var elapsed = now - build.timeCreated.toDate();
  var timeDiff = Math.floor(elapsed / msPerWeek);

  //slowly decay after 6 weeks
  if (timeDiff > 6) {
    var x = timeDiff - 6;
    baseScore = baseScore * Math.exp(-0.05 * x * x);
  }

  return baseScore;
};
