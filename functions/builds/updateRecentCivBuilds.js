const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const civs = [
  {
    shortName: "ABB",
  },
  {
    shortName: "AYY",
  },
  {
    shortName: "BYZ",
  },
  {
    shortName: "CHI",
  },
  {
    shortName: "DEL",
  },
  {
    shortName: "ENG",
  },
  {
    shortName: "FRE",
  },
  {
    shortName: "HRE",
  },
  {
    shortName: "JAP",
  },
  {
    shortName: "JDA",
  },
  {
    shortName: "MAL",
  },
  {
    shortName: "MON",
  },
  {
    shortName: "DRA",
  },
  {
    shortName: "OTT",
  },
  {
    shortName: "RUS",
  },
  {
    shortName: "ZXL",
  },
];

exports.updateRecentCivBuilds = onSchedule(
  { schedule: "0 0 * * *", timeoutSeconds: 3600 },
  async (event) => {
    logger.log("start updateNewCivBuildTags");
    logger.log("civs", civs);

    // Get the most recent build per civ
    const recentCivBuilds = [];

    const buildsRef = getFirestore().collection("builds");

    for (const civ of civs) {
      logger.log("civ", civ.shortName);
      const snapshot = await buildsRef
        .where("civ", "==", civ.shortName)
        .orderBy("timeCreated")
        .limit(1)
        .get();
      snapshot.forEach((doc) => {
        recentCivBuilds.push({ civ: doc.data().civ, timeCreated: doc.data().timeCreated });
      });
    }

    // Write result to home.recentCivBuilds
    return getFirestore().collection("home").doc("home").set(
      {
        recentCivBuilds: recentCivBuilds,
      },
      { merge: true }
    );
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
const calculateAndUpdateScore = (build) => {
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

  logger.log("score", baseScore);

  return baseScore;
};
