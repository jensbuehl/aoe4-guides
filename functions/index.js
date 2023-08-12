const functions = require("firebase-functions");
const { onCall } = require("firebase-functions/v2/https");
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

// The Firebase Admin SDK to access Firestore and Auth.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

initializeApp();

exports.createUser = functions.auth.user().onCreate((user) => {
  return getFirestore().collection("users").doc(user.uid).set(
    {
      email: user.email,
      id: user.uid,
    },
    { merge: true }
  );
});

exports.getUsers = onCall(() => {
  return getFirestore()
    .collection("users")
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        console.log(doc.id, "=>", doc.data());
      });
      return snapshot.docs.map((doc) => {
        return {
          displayName: doc.data().displayName,
          id: doc.data().id,
        };
      });
    })
    .catch(function (error) {
      logger.log(error.message);
      return null;
    });
});

exports.updateUserDisplayName = onCall((data) => {
  if (!data.auth)
    return { status: "error", code: 401, message: "Not signed in" };

  const displayName = data.data.displayName;
  const uid = data.data.uid;
  return getAuth()
    .updateUser(uid, {
      displayName: displayName,
    })
    .then(function () {
      return getFirestore()
        .collection("users")
        .doc(uid)
        .set(
          {
            displayName: displayName,
          },
          { merge: true }
        )
        .catch(function (error) {
          logger.log(error.message);
          return null;
        });
    })
    .catch(function (error) {
      logger.log(error.message);
      return null;
    });
});

exports.deleteUser = functions.auth.user().onDelete((user) => {
  const doc = getFirestore().collection("users").doc(user.uid);
  return doc.delete();
});

exports.cleanUserRefs = functions.auth.user().onDelete((user) => {
  // TODO: Remove corresponding "favorites" document and adjust upvotes, downvotes, likes in the "builds" collection
  logger.log("User deleted", user);
});

exports.cleanBuildRefs = onDocumentDeleted("/builds/{documentId}", (event) => {
  // TODO: Clean up dead references to this build (upvotes, downvotes, likes)
  logger.log("Build deleted", event.data.data());
});

exports.updateBuildScore = onSchedule(
  { schedule: "0 0 * * 5" },
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
