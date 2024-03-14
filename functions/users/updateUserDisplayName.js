const { getFirestore } = require("firebase-admin/firestore");
const { onCall } = require("firebase-functions/v2/https");
const { getAuth } = require("firebase-admin/auth");
const logger = require("firebase-functions/logger");

/**
 * Updates the display name of a user.
 *
 * @param {Object} data - The data containing the authentication and user data.
 * @param {Object} data.auth - The authentication object.
 * @param {Object} data.data - The user data containing the display name and uid.
 * @param {string} data.data.displayName - The new display name of the user.
 * @param {string} data.data.uid - The uid of the user to update.
 * @return {Promise<Object>} A promise that resolves to an object with the status, code, and message.
 *                            If successful, the status is "ok", the code is 200, and the message is "Success".
 *                            If there is an error, the status is "error", the code is 401, and the message is "Not signed in".
 */
exports.updateUserDisplayName = onCall((data) => {
  logger.log("updateUserDisplayNameCalled", data.data);

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
