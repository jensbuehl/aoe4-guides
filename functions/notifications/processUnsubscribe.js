const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");

exports.processUnsubscribe = onCall(async (request) => {
  const { userId, buildId, token, action } = request.data;

  if (!userId || !buildId || !token || !action) {
    throw new HttpsError("invalid-argument", "userId, buildId, token, and action are required.");
  }

  if (action !== "unsubscribe" && action !== "resubscribe") {
    throw new HttpsError("invalid-argument", "action must be 'unsubscribe' or 'resubscribe'.");
  }

  const db = getFirestore();
  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new HttpsError("not-found", "User not found.");
  }

  const userData = userSnap.data();
  const prefs = userData.notificationPreferences || {};
  const storedToken = (prefs.tokens || {})[buildId];

  if (!storedToken || storedToken !== token) {
    throw new HttpsError("invalid-argument", "Invalid or unrecognised unsubscribe token.");
  }

  const optedOut = Array.isArray(prefs.optedOut) ? [...prefs.optedOut] : [];

  if (action === "unsubscribe") {
    if (!optedOut.includes(buildId)) {
      optedOut.push(buildId);
    }
  } else {
    const idx = optedOut.indexOf(buildId);
    if (idx !== -1) {
      optedOut.splice(idx, 1);
    }
  }

  await userRef.update({ "notificationPreferences.optedOut": optedOut });

  return { success: true, action, buildId };
});
