const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

// Take the text parameter passed to this HTTP endpoint and insert it into
exports.updateviews = onRequest(async (req, res) => {
  //Update view count here, so that no any user is allowed to update all documents
  logger.log("Update views called!");
});

exports.updatelikes = onRequest(async (req, res) => {
  //Update like count here, so that no any user is allowed to update all documents
  logger.log("Update likes called!");
});

exports.updatevotes = onRequest(async (req, res) => {
  //Update vote count here, so that no any user is allowed to update all documents
  logger.log("Update votes called!");
});

exports.logbuild = onDocumentCreated("/builds/{documentId}", (event) => {
  // Grab the current value of what was written to Firestore.
  logger.log(event.data.data());
  const original = event.data.data();
  logger.log("Document created", original);
});

// Run once a day at midnight, to update the build score
// Manually run the task here https://console.cloud.google.com/cloudscheduler
exports.updatescore = onSchedule(
  { schedule: "every day 00:00" },
  async (event) => {
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
