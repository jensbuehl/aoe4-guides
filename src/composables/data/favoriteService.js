//Composables
import collectionService from "@/composables/data/collectionService";

const {
    addElementToArray,
    removeElementFromArray,
    get,
    add
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
 * The guard is not defensive padding. `collectionService.add` writes with
 * `setDoc` and no merge, so calling this on an established account would
 * replace the list with `[]` — and account setup is no longer a one-shot at
 * registration: it re-runs whenever an account is found unfinished, which is
 * how an abandoned Google sign-up is repaired (spec 032, R-7).
 *
 * @param {string} userId - The ID of the user for whom favorites are being created.
 * @return {Promise<void>} - The function does not return anything.
 */
export async function createUserFavorites(userId) {
    const existing = await get(userId);
    if (existing) return;
    return add({ favorites: [] }, userId);
}

/**
 * Retrieves the favorites of a specific user.
 *
 * @param {string} userId - The ID of the user whose favorites are to be retrieved.
 * @return {Promise} A Promise that resolves with the favorites of the user.
 */
export async function getUserFavorites(userId) {
    return get(userId);
}
