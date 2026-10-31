//Composables
import collectionService from "@/composables/data/collectionService";

const {
    addElementToArray,
    removeElementFromArray,
    getOrThrow,
} = collectionService("favorites");

/**
 * Function to add a build to a user's favorites.
 *
 * @param {string} userId - The ID of the user
 * @param {string} buildId - The ID of the build to add to favorites
 * @return {Promise<void>} - The function does not return anything.
 */
export async function addFavorite(userId, buildId) {
    return addElementToArray(userId, "favorites", buildId);
}

/**
 * Removes a favorite buildId from the user's favorites array.
 *
 * @param {string} userId - description of userId
 * @param {string} buildId - description of buildId
 * @return {Promise<void>} - The function does not return anything.
 */
export async function removeFavorite(userId, buildId) {
    return removeElementFromArray(userId, "favorites", buildId);
}

/**
 * Function to add a vote up for a specific user and build.
 *
 * @param {string} userId - The ID of the user adding the vote.
 * @param {string} buildId - The ID of the build to vote up.
 * @return {Promise<void>} - The function does not return anything.
 */
export async function addUpvote(userId, buildId) {
    return addElementToArray(userId, "upvotes", buildId);
}

/**
 * Remove a user's upvote for a specific build.
 *
 * @param {string} userId - The ID of the user who wants to remove the upvote.
 * @param {string} buildId - The ID of the build from which the upvote should be removed.
 * @return {Promise<void>} - The function does not return anything.
 */
export async function removeUpvote(userId, buildId) {
    return removeElementFromArray(userId, "upvotes", buildId);
}

/**
 * Function to add a downvote to a specific user for a given build.
 *
 * @param {string} userId - The ID of the user performing the downvote
 * @param {string} buildId - The ID of the build being downvoted
 * @return {Promise<void>} A promise that resolves once the downvote is added
 */
export async function addDownvote(userId, buildId) {
    return addElementToArray(userId, "downvotes", buildId);
}

/**
 * Removes a downvote for a specific user and build.
 *
 * @param {string} userId - The ID of the user
 * @param {string} buildId - The ID of the build
 * @return {Promise<void>} 
 */
export async function removeDownvote(userId, buildId) {
    return removeElementFromArray(userId, "downvotes", buildId);
}

/**
 * Ensures a favorites document exists for a user, without disturbing one that
 * already does.
 *
 * One merge write rather than a read and a create. Account setup is not a
 * one-shot at registration: it re-runs whenever an account is found
 * unfinished, which is how an abandoned Google sign-up is repaired (spec 032,
 * R-7), so this runs on accounts that may already hold favorites. The old
 * guard read with `get`, which returns `undefined` for a refused read as well
 * as a missing document, and then wrote with `setDoc` and no merge — so a
 * refused read, or a first heart landing between the read and the write,
 * replaced the list with `[]`. `arrayUnion()` with no elements creates the
 * array where there is none and leaves an existing one exactly as it is.
 *
 * The `id`/`timeCreated`/`timeUpdated` fields the old create wrote are gone on
 * purpose: nothing reads them (`getUserFavorites` supplies `id`), and a
 * document made by a first heart never had them either.
 *
 * Best-effort: a failed write is logged, not thrown. The document is optional
 * — the first heart or vote creates it with the same merge, and a missing one
 * reads as "no favorites" — so failing account setup over it would be worse
 * than not having it (useAccountSetup).
 *
 * @param {string} userId - The ID of the user for whom favorites are being created.
 * @return {Promise<void>} - The function does not return anything.
 */
export async function createUserFavorites(userId) {
    return addElementToArray(userId, "favorites");
}

/**
 * Retrieves the favorites of a specific user — the hearts and both kinds of
 * vote, which share one document.
 *
 * A missing document is an account with nothing hearted yet, not an error:
 * some accounts never got one (a sign-up whose setup never finished, an old
 * account), and the first heart or vote creates it (`addElementToArray`
 * merges). So it resolves to the empty shape, and every field a reader touches
 * is present even on a document that a single vote created.
 *
 * Only a failed read resolves to `undefined`, which is why this reads through
 * `getOrThrow` rather than `get`: `get` returns `undefined` for both, and
 * telling a reader whose read was refused that they have no favorites would
 * be a lie.
 *
 * @param {string} userId - The ID of the user whose favorites are to be retrieved.
 * @return {Promise<object|undefined>} `{ id, favorites, upvotes, downvotes }`,
 *   or `undefined` when the document could not be read.
 */
export async function getUserFavorites(userId) {
    try {
        const data = await getOrThrow(userId);
        return { id: userId, favorites: [], upvotes: [], downvotes: [], ...data };
    } catch (err) {
        console.error("favoriteService.getUserFavorites failed:", err?.code, err?.message);
        return undefined;
    }
}
