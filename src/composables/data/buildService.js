//External
import { store } from "@/store/index.js";

//Composables
import useCollection from "@/composables/data/useCollection";
import queryService from "@/composables/useQueryService";
import {
   getMostRecentBuildsConfig,
   getPopularBuildsConfig,
} from "@/composables/filter/configDefaultProvider";

const { incrementNumber, decrementNumber, getAll, getQuery, getSize } = useCollection("builds");

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

/**
 * Retrieves the count of builds using the defaultConfig.
 *
 * @return {Promise<number>} Number of builds in total.
 */
export async function getBuildsCount() {
   const allDallBuildsQuery = getQuery(
      queryService.getQueryParametersFromConfig(getDefaultConfig())
   );
   return getSize(allDallBuildsQuery);
}

/**
 * Retrieves recent builds based on the specified limit.
 *
 * @param {number} limit - The maximum number of recent builds to retrieve
 * @return {Promise} The result of the operation, representing the recent builds
 */
export async function getRecentBuilds(limit) {
   const mostRecentQuery = getQuery(
      queryService.getQueryParametersFromConfig(getMostRecentBuildsConfig(), limit)
   );
   const result = await getAll(mostRecentQuery);
   store.commit("setBuilds", result);
   return result;
}

/**
 * Retrieves popular builds based on the provided limit.
 *
 * @param {number} limit - The maximum number of popular builds to retrieve
 * @return {Promise} A Promise that resolves with the retrieved popular builds
 */
export async function getPopularBuilds(limit) {
   const popularQuery = getQuery(
      queryService.getQueryParametersFromConfig(getPopularBuildsConfig(), limit)
   );
   const result = await getAll(popularQuery);
   store.commit("setBuilds", result);
   return result;
}
