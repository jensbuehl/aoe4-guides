const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getAuth } = require("firebase-admin/auth");
const logger = require("firebase-functions/logger");

/**
 * Callable Cloud Function to mark a user's email as verified.
 * Admin-only: requires caller to have `admin: true` custom claim.
 *
 * Request data: { uid: string }
 * Response: { success: true, uid: string }
 */
exports.setEmailVerified = onCall(async (req) => {
  if (!req.auth || req.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "Admin only");
  }

  const uid = req.data && req.data.uid;
  if (!uid || typeof uid !== "string") {
    throw new HttpsError("invalid-argument", "" + "Missing or invalid uid");
  }

  logger.log("setEmailVerified called by", req.auth.uid, "for", uid);

  try {
    await getAuth().updateUser(uid, { emailVerified: true });
    return { success: true, uid };
  } catch (err) {
    logger.error("Failed to set emailVerified for", uid, err);
    // Hide implementation details from caller but give a useful message
    throw new HttpsError("internal", "Failed to update user: " + err.message);
  }
});
