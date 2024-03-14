const functions = require("firebase-functions");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

/**
 * Deletes the user document from Firestore when the user account is deleted.
 *
 * @name deleteUser
 * @function
 * @async
 * @memberof module:functions
 * @param {Object} user - The Firebase user object.
 * @return {Promise} A promise that resolves when the user document is successfully deleted.
 */
exports.deleteUser = functions.auth.user().onDelete((user) => {
  logger.log("deleteUserCalled", user);
  
  const doc = getFirestore().collection("users").doc(user.uid);
  // TODO: Remove corresponding "favorites" document and adjust upvotes, downvotes, likes in the "builds" collection

  return doc.delete();
});
