const functions = require("firebase-functions/v1");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const { cleanUpAccountActivity } = require("./accountCleanup");

/**
 * Cleans up after a deleted account: gives back every like, upvote and downvote
 * it cast, then removes its favorites and user documents.
 *
 * Lives in the trigger rather than in the client on purpose. It fires for every
 * deletion whatever caused it — the app, an administrator, the Firebase console
 * — and it runs on the Admin SDK, so it cannot be refused by security rules the
 * way client-side cleanup was. Cleanup that only happens when the user chooses
 * the polite exit is not cleanup.
 *
 * Stays on the v1 namespace because Cloud Functions v2 has no background auth
 * trigger; its blocking functions run *before* an operation and cannot observe
 * a deletion after the fact.
 *
 * What deliberately survives: the account's build orders stay published, and
 * `contributors/{uid}` stays with them so they keep their attribution.
 *
 * @name deleteUser
 * @function
 * @async
 * @memberof module:functions
 * @param {Object} user - The Firebase user object; only `uid` is used.
 * @return {Promise} Resolves once cleanup is complete.
 */
exports.deleteUser = functions.auth.user().onDelete(async (user) => {
  const uid = user.uid;
  logger.log("deleteUser: start", { uid });

  const db = getFirestore();

  // The order below is the invariant, not a preference. `favorites/{uid}` is
  // both the map of what this account owes back and one of the things being
  // deleted; destroying it before acting on it loses the map permanently, which
  // is precisely the bug this replaced. Counters first, then the map, then the
  // user. If cleanup throws, nothing below runs and the map survives — leaving
  // the work recorded rather than silently dropped.
  await cleanUpAccountActivity(uid);

  await db.collection("favorites").doc(uid).delete();
  await db.collection("users").doc(uid).delete();

  logger.log("deleteUser: complete", { uid });
});
