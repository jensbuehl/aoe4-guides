const functions = require("firebase-functions");
const { getFirestore } = require("firebase-admin/firestore");

/**
 * Creates a new user document in the "users" collection in Firestore.
 *
 * @param {Object} user - The user object containing user information.
 * @param {string} user.uid - The user's unique ID.
 * @param {string} user.email - The user's email.
 * @return {Promise<WriteResult>} A promise that resolves with the write result.
 */
exports.createUser = functions.auth.user().onCreate((user) => {
    return getFirestore().collection("users").doc(user.uid).set(
      {
        email: user.email,
        id: user.uid,
      },
      { merge: true }
    );
  });

  /**
 * Creates a new contributor document in the "contributors" collection in Firestore.
 *
 * @param {Object} contributor - The user object containing user information.
 * @return {Promise<WriteResult>} A promise that resolves with the write result.
 */
exports.createContributor = functions.auth.user().onCreate((user) => {
  return getFirestore().collection("contributors").doc(user.uid).set(
    {
      authorId: user.uid,
    },
    { merge: true }
  );
});