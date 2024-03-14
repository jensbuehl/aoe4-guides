const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");

/**
 * Deletes all references to a build when its document is deleted.
 *
 * @name deleteBuild
 * @function
 * @async
 * @memberof module:functions
 * @param {Object} event - The Firebase event object.
 * @param {Object} event.data - The event data.
 * @param {Object} event.data.data - The Firestore document data.
 * @return {Promise} A promise that resolves when all references to the build have been successfully deleted.
 */
exports.deleteBuild = onDocumentDeleted("/builds/{documentId}", (event) => {
  logger.log("deleteBuildCalled", event.data.data());
  
  // TODO: Clean up dead references to this build (upvotes, downvotes, likes)
});
