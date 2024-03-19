//Composables
import useCollection from "@/composables/data/useCollection";

const {
    addElementToArray,
    removeElementFromArray,
    get,
    add,
    del
} = useCollection("favorites");

/**
 * Function to add a build to a user's favorites.
 *
 * @param {string} userId - The ID of the user
 * @param {string} buildId - The ID of the build to add to favorites
 * @return {Promise<void>} - The function does not return anything.
 */
export async function addFavorite(userId, buildId) {
    addElementToArray(userId, "favorites", buildId);
}

/**
 * Removes a favorite buildId from the user's favorites array.
 *
 * @param {string} userId - description of userId
 * @param {string} buildId - description of buildId
 * @return {Promise<void>} - The function does not return anything.
 */
export async function removeFavorite(userId, buildId) {
    removeElementFromArray(userId, "favorites", buildId);
}

/**
 * Function to add a vote up for a specific user and build.
 *
 * @param {string} userId - The ID of the user adding the vote.
 * @param {string} buildId - The ID of the build to vote up.
 * @return {Promise<void>} - The function does not return anything.
 */
export async function addUpvote(userId, buildId) {
    addElementToArray(userId, "upvotes", buildId);
}

/**
 * Remove a user's upvote for a specific build.
 *
 * @param {string} userId - The ID of the user who wants to remove the upvote.
 * @param {string} buildId - The ID of the build from which the upvote should be removed.
 * @return {Promise<void>} - The function does not return anything.
 */
export async function removeUpvote(userId, buildId) {
    removeElementFromArray(userId, "upvotes", buildId);
}

/**
 * Function to add a downvote to a specific user for a given build.
 *
 * @param {string} userId - The ID of the user performing the downvote
 * @param {string} buildId - The ID of the build being downvoted
 * @return {Promise<void>} A promise that resolves once the downvote is added
 */
export async function addDownvote(userId, buildId) {
    addElementToArray(userId, "downvotes", buildId);
}

/**
 * Removes a downvote for a specific user and build.
 *
 * @param {string} userId - The ID of the user
 * @param {string} buildId - The ID of the build
 * @return {Promise<void>} 
 */
export async function removeDownvote(userId, buildId) {
    removeElementFromArray(userId, "downvotes", buildId);
}

/**
 * Creates user favorites for a specific user.
 *
 * @param {string} userId - The ID of the user for whom favorites are being created.
 * @return {Promise<void>} - The function does not return anything.
 */
export async function createUserFavorites(userId) {
    add({ favorites: [] }, userId);
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

/**
 * Delete user's favorites.
 *
 * @param {string} userId - The ID of the user whose favorites are to be deleted
 * @return {Promise<void>} - The function does not return anything.
 */
export async function deleteUserFavorites(userId) {
    del(userId);
}
