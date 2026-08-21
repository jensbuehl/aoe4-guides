const functions = require("firebase-functions/v1");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
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
 * Two fields on that record are the exception, and the distinction is the
 * point: attribution is a fact about who wrote something, while the
 * introduction and the channel are personal expression. Once the account is
 * gone their author can never edit or withdraw them — and they can still be
 * published, since the home page spotlight reads this same record. So the name,
 * the avatar and the counts stay, and those two are cleared. The rule to take
 * from this is not "clear everything on deletion" but "anything a departed
 * person can no longer retract should not outlive them".
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

  // The contributor record survives for attribution; the fields its author can
  // no longer withdraw do not. A missing record means there was nothing to
  // clear, which is not a reason to fail a deletion that has already happened.
  //
  // This list must gain every new profile field. It is the one place where
  // forgetting is silent: nothing breaks, the value simply outlives the person
  // who wrote it. The fields are in src/composables/useContributorProfile.js,
  // which this CommonJS package cannot import.
  try {
    await db.collection("contributors").doc(uid).update({
      bio: FieldValue.delete(),
      youtube: FieldValue.delete(),
      twitch: FieldValue.delete(),
      aoe4world: FieldValue.delete(),
    });
  } catch (error) {
    logger.warn("deleteUser: could not clear public profile", { uid, message: error.message });
  }

  logger.log("deleteUser: complete", { uid });
});
