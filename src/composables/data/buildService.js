//External
import { store } from "@/store/index.js";
import { computed } from "vue";

//Composables
import useCollection from "@/composables/data/useCollection";
import queryService from "@/composables/useQueryService";
import {
   getMostRecentBuildsConfig,
   getPopularBuildsConfig,
   getDefaultConfig,
   getDraftsConfig,
} from "@/composables/filter/configDefaultProvider";

const {
   incrementNumber,
   decrementNumber,
   add,
   get,
   del,
   update,
   getAll,
   getQuery,
   getSize,
   error: useCollectionError,
} = useCollection("builds");

/**
 * Returns the error value of the useCollection composable.
 *
 * @return {Ref<string|null>} The error value, which is a reactive reference to a string or null.
 */
export const error = computed(() => useCollectionError).value;

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

export async function incrementViews(buildId) {
   incrementNumber(buildId, "views");
}

/**
 * Retrieves the count of builds using the defaultConfig.
 *
 * @return {Promise<number>} Number of builds in total.
 */
export async function getBuildsCount() {
   const allBuildsQuery = getQuery(queryService.getQueryParametersFromConfig(getDefaultConfig()));
   return getSize(allBuildsQuery);
}

/**
 * Retrieves the count of drafts for a specific user.
 *
 * @param {string} userId - The unique identifier of the user
 * @return {number} The count of drafts for the user
 */
export async function getUserDraftsCount(userId) {
   const limit = null;
   const userDraftsQuery = getQuery(
      queryService.getQueryParametersFromConfig(getDraftsConfig(), limit, userId)
   );
   return getSize(userDraftsQuery);
}

/**
 * Retrieves the user drafts from the server.
 *
 * @param {string} userId - The ID of the user.
 * @param {number|null} [limit=null] - The maximum number of drafts to retrieve. If null, retrieves all drafts.
 * @return {Promise<Array>} A promise that resolves to an array of user drafts.
 */
export async function getUserDrafts(userId, limit = null) {
   const userDraftsQuery = getQuery(
      queryService.getQueryParametersFromConfig(getDraftsConfig(), limit, userId)
   );
   return getAll(userDraftsQuery);
}

/**
 * Retrieve a build by its ID.
 *
 * @param {string} buildId - The ID of the build to retrieve
 * @return {Promise<any>} The retrieved build
 */
export async function getBuild(buildId) {
   return get(buildId);
}

/**
 * Adds a build to the database and store, optionally uses a custom ID.
 *
 * @param {Object} build - The build object to be added.
 * @param {string|null} [customId=null] - An optional custom ID for the build.
 * @return {Promise<void>} - A promise that resolves when the build is added and operations are completed.
 */
export async function addBuild(build, customId = null) {
   store.commit("setBuild", build);
   add(build, customId);
}

/**
 * Deletes a build with the specified ID.
 *
 * @param {string} buildId - The ID of the build to delete.
 * @return {Promise} A promise that resolves when the build is successfully deleted.
 */
export async function deleteBuild(buildId) {
   return del(buildId);
}

/**
 * Update a build with the given buildId and build data.
 *
 * @param {type} buildId - The ID of the build to update.
 * @param {type} build - The new build data to update.
 * @param {type} updateCreatedTimestamp - Optional parameter to update the created timestamp.
 * @return {Promise} A promise that resolves with the updated build data.
 */
export async function updateBuild(buildId, build, updateCreatedTimestamp = false) {
   return update(buildId, build, updateCreatedTimestamp);
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
