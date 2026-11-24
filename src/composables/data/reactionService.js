//External
import { db, doc, writeBatch, increment, arrayUnion, arrayRemove } from "@/firebase";

//Composables
import { writeWithTokenRetry } from "@/composables/data/collectionService";

/** Which build counter each list on `favorites/{uid}` moves with. */
const COUNTER = { favorites: "likes", upvotes: "upvotes" };

/**
 * Likes or upvotes a build, or takes it back — the only code that does (spec 042).
 *
 * The count on the build and the entry in the player's own list are ONE batched
 * write, because the Firestore rules accept each only together with the other:
 * a `likes` step needs the same write to add (or remove) the build in the
 * caller's `favorites`, and a list may only change together with that step.
 * That is what makes one account count once. Sent as two writes — as it was —
 * the rules would refuse both, and a half-landed pair is exactly the drift
 * between counts and lists the spec's check measures.
 *
 * `lastChange` names the one build this write adds or removes. The rules
 * cannot find it on their own (a set cannot be indexed, and `arrayRemove`
 * removes from any position), so the write declares it and the rules prove
 * the declaration by comparing the list before and after.
 *
 * A removal whose count already stands at 0 or below (legacy drift) removes
 * the list entry without a step; the rules allow exactly that case, and a −1
 * would take the count negative.
 *
 * Throws on failure. Callers must not show the reaction as done until this
 * resolves. Offline it throws at once instead of writing: Firestore queues an
 * offline write and the promise would sit unresolved while the button said
 * "liked".
 *
 * @param {object} args
 * @param {string} args.uid - The signed-in player.
 * @param {string} args.buildId - The build.
 * @param {"favorites"|"upvotes"} args.list - Which list (favourites = likes).
 * @param {boolean} args.on - true to add, false to take back.
 * @param {number} args.currentCount - The build's current count for this list.
 * @return {Promise<void>}
 */
export async function setReaction({ uid, buildId, list, on, currentCount }) {
  const counter = COUNTER[list];
  if (!counter) throw new Error(`setReaction: unknown list "${list}"`);
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw Object.assign(new Error("offline"), { code: "offline" });
  }

  const step = on ? 1 : Number(currentCount) > 0 ? -1 : 0;

  // A batch can be committed once, and writeWithTokenRetry may run the
  // operation twice, so the batch is built inside it.
  await writeWithTokenRetry(() => {
    const batch = writeBatch(db);
    if (step) batch.update(doc(db, "builds", buildId), { [counter]: increment(step) });
    batch.set(
      doc(db, "favorites", uid),
      { [list]: on ? arrayUnion(buildId) : arrayRemove(buildId), lastChange: { list, buildId } },
      { merge: true }
    );
    return batch.commit();
  });
}
