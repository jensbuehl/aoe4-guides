const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

/**
 * Builds adjusted per transaction. A Firestore transaction caps at 500
 * operations and a chunk costs one write per build plus one write to the
 * favorites document, so this leaves generous headroom. It is deliberately well
 * under the ceiling: a contention retry re-does one chunk, and a small chunk
 * makes that cheap.
 */
const CHUNK_SIZE = 200;

/**
 * Which array on `favorites/{uid}` gives back which counter on `builds/{id}`.
 * Note that two of the three names coincide and one does not — the favourites
 * list feeds `likes`, not `favorites`.
 */
const CATEGORIES = [
  { array: "favorites", counter: "likes" },
  { array: "upvotes", counter: "upvotes" },
  { array: "downvotes", counter: "downvotes" },
];

/**
 * Gives back one chunk's worth of a counter, and erases the evidence that it
 * was owed — in a single transaction, which is the whole idempotency mechanism.
 *
 * Because the `arrayRemove` commits atomically with the decrements it
 * authorises, a re-run can only ever see work that has not been done. There is
 * no flag and no lock: the work list *is* the ledger.
 *
 * A transaction rather than a batch for the reads. Three separate requirements
 * need the build's current value and a blind `increment(-1)` supplies none of
 * them — it has no floor, it would create a document for a build that no longer
 * exists, and it cannot be made safe against a vote cast in the same instant.
 * One read answers all three, and the transaction retries on contention.
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance.
 * @param {FirebaseFirestore.DocumentReference} favoritesRef - The account's favorites document.
 * @param {Array<string>} chunk - Build ids to process, at most CHUNK_SIZE of them.
 * @param {string} arrayField - The array on the favorites document these ids came from.
 * @param {string} counterField - The counter on each build to decrement.
 * @return {Promise<number>} How many builds were actually adjusted (missing ones are not).
 */
async function processChunk(db, favoritesRef, chunk, arrayField, counterField) {
  const refs = chunk.map((buildId) => db.collection("builds").doc(buildId));

  return db.runTransaction(async (transaction) => {
    // Every read must precede every write inside a transaction.
    //
    // The field mask is not an optimisation detail worth skipping: a build
    // document carries its entire step list, so reading 200 of them in full to
    // look at one number would pull megabytes through a transaction that has a
    // size limit — to decrement an integer. `exists` still works under a mask.
    const snapshots = await transaction.getAll(...refs, { fieldMask: [counterField] });

    let adjusted = 0;
    for (const snapshot of snapshots) {
      // A build deleted since the vote was cast. Skip it, but still drop its id
      // below — otherwise it would be outstanding forever and the account could
      // never finish being cleaned up.
      if (!snapshot.exists) continue;

      const current = snapshot.get(counterField) ?? 0;
      // Never below zero: historic counts are not guaranteed consistent, and a
      // negative count would outlive this cleanup in every ranking that reads it.
      transaction.update(snapshot.ref, { [counterField]: Math.max(0, current - 1) });
      adjusted += 1;
    }

    transaction.update(favoritesRef, { [arrayField]: FieldValue.arrayRemove(...chunk) });

    return adjusted;
  });
}

/**
 * Gives back every like, upvote and downvote an account cast.
 *
 * Safe to run more than once for the same account, and safe to resume: an
 * interrupted run leaves `favorites/{uid}` holding exactly the outstanding
 * items, so re-firing the trigger finishes the job without adjusting anything
 * twice. That surviving document is also the record of what failed.
 *
 * Throws rather than swallowing. The caller must not delete the favorites
 * document if this did not finish, because that document is the only map of
 * what is still owed — destroying it before acting on it is the original bug
 * this replaced.
 *
 * @param {string} uid - The deleted account's uid.
 * @return {Promise<Object>} Counts adjusted per category, for logging.
 */
async function cleanUpAccountActivity(uid) {
  const db = getFirestore();
  const favoritesRef = db.collection("favorites").doc(uid);
  const snapshot = await favoritesRef.get();

  // Legitimate: accounts predating the favorites document, and Google accounts
  // abandoned at the display-name prompt, never had one.
  if (!snapshot.exists) {
    logger.log("accountCleanup: no favorites document, nothing to give back", { uid });
    return { likes: 0, upvotes: 0, downvotes: 0 };
  }

  const data = snapshot.data() ?? {};
  const adjusted = { likes: 0, upvotes: 0, downvotes: 0 };

  for (const { array, counter } of CATEGORIES) {
    const buildIds = data[array] ?? [];

    for (let i = 0; i < buildIds.length; i += CHUNK_SIZE) {
      const chunk = buildIds.slice(i, i + CHUNK_SIZE);
      try {
        adjusted[counter] += await processChunk(db, favoritesRef, chunk, array, counter);
      } catch (error) {
        // Say where it stopped. The favorites document survives holding the
        // unprocessed ids, so this log is a pointer to recoverable state rather
        // than a postmortem of lost work.
        logger.error("accountCleanup: chunk failed, remaining work is still recorded", {
          uid,
          array,
          counter,
          chunkStart: i,
          chunkSize: chunk.length,
          message: error?.message,
        });
        throw error;
      }
    }
  }

  logger.log("accountCleanup: counters returned", { uid, ...adjusted });
  return adjusted;
}

module.exports = { cleanUpAccountActivity, CHUNK_SIZE };
