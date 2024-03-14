const { onCall } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

/**
 * Callable Cloud Function to get all users. (email redacted!)
 *
 * @name getUsers
 * @function
 * @async
 * @memberof module:functions
 * @param {Object} data - The data passed with the callable function.
 * @param {Object} context - The context of the callable function.
 * @return {Promise<Array<Object>>} An array of user objects with id and displayName.
 */
exports.getUsers = onCall(() => {
  logger.log("getUsersCalled");
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
