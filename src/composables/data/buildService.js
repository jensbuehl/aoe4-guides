//Composables
import useCollection from "@/composables/data/useCollection";

const { incrementNumber, decrementNumber } = useCollection("builds");

/**
 * Increments the number of likes for a build.
 *
 * @param {string} buildId - The ID of the build to increment the likes for.
 * @return {Promise} A promise that resolves when the number of likes has been incremented.
 */
export async function incrementLikes(buildId) {
    incrementNumber(buildId, "likes");
}

/**
 * Decrements the number of likes for a specific build.
 *
 * @param {string} buildId - The ID of the build to decrement likes for
 * @return {Promise<void>} This function does not return anything
 */
export async function decrementLikes(buildId) {
    decrementNumber(buildId, "likes");
}

/**
 * Increment downvotes for a specific build.
 *
 * @param {string} buildId - The ID of the build to update.
 * @return {Promise<void>} A Promise that resolves once the downvotes are incremented.
 */
export async function incrementDownvotes(buildId) {
    incrementNumber(buildId, "downvotes");
}

/**
 * Decrements the count of downvotes for a specific build.
 *
 * @param {string} buildId - The identifier of the build to decrement downvotes for.
 * @return {Promise<void>} This function does not return anything.
 */
export async function decrementDownvotes(buildId) {
    decrementNumber(buildId, "downvotes");
}

/**
 * Increment upvotes for a specific build.
 *
 * @param {string} buildId - The unique identifier of the build
 * @return {Promise<void>} This function does not return anything.
 */
export async function incrementUpvotes(buildId) {
    incrementNumber(buildId, "upvotes");
}

/**
 * Decrements the upvotes count for a specific build.
 *
 * @param {string} buildId - The unique identifier of the build.
 * @return {Promise<void>} A promise that resolves when the upvotes count is decremented.
 */
export async function decrementUpvotes(buildId) {
    decrementNumber(buildId, "upvotes");
}