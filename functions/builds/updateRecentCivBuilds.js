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
  {
    shortName: "HOL",
  },
  {
    shortName: "KTE",
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
        .orderBy("timeCreated", 'desc')
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
