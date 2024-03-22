//External
import { store } from "@/store/index.js";
import { computed } from "vue";

//Composables
import collectionService from "@/composables/data/collectionService";
import {
  getQueryParametersFromConfig,
  getStartAfterQueryParam,
  getEndBeforeQueryParam,
  getLimitToLastQueryParam,
} from "@/composables/data/queryParameterBuilder";
import {
  getMostRecentBuildsConfig,
  getPopularBuildsConfig,
  getAllTimeClassicsConfig,
  getDefaultConfig,
  getDraftsConfig,
} from "@/composables/filter/configDefaultProvider";

const {
  incrementNumber,
  decrementNumber,
  add,
  get,
  getSnapshot,
  del,
  update,
  getAll,
  getQuery,
  getSize,
  error: collectionServiceError,
} = collectionService("builds");

/**
 * Returns the error value of the collectionService composable.
 *
 * @return {Ref<string|null>} The error value, which is a reactive reference to a string or null.
 */
export const error = computed(() => collectionServiceError).value;

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
 * Increments the number of views for a given build.
 *
 * @param {string} buildId - The ID of the build.
 * @return {Promise<void>} A promise that resolves when the increment is complete.
 */
export async function incrementViews(buildId) {
  incrementNumber(buildId, "views");
}

/**
 * Retrieves the count of builds based on the provided filter configuration.
 *
 * @param {Object} filterConfig - The filter configuration object. Defaults to the default configuration if not provided.
 * @return {Promise<number>} A Promise that resolves to the count of builds.
 */
export async function getBuildsCount(filterConfig = getDefaultConfig()) {
  const allBuildsQuery = getQuery(getQueryParametersFromConfig(filterConfig));
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
  const userDraftsQuery = getQuery(getQueryParametersFromConfig(getDraftsConfig(), limit, userId));
  return getSize(userDraftsQuery);
}

/**
 * Retrieves the count of user builds based on the provided user ID and filter configuration.
 *
 * @param {string} userId - The ID of the user.
 * @param {Object} [filterConfig=getDefaultConfig()] - The filter configuration to apply. Defaults to the default configuration.
 * @return {Promise<number>} - A promise that resolves to the count of user builds.
 */
export async function getUserBuildsCount(userId, filterConfig = getDefaultConfig()) {
  const limit = null;
  const userDraftsQuery = getQuery(getQueryParametersFromConfig(filterConfig, limit, userId));
  return getSize(userDraftsQuery);
}

/**
 * Retrieves the count of user favorites based on the provided user ID, favorites array, and optional filter configuration.
 *
 * @param {string} userId - The ID of the user
 * @param {Array} favorites - The array of user favorites
 * @param {object} filterConfig - The optional filter configuration (default: getDefaultConfig())
 * @return {Promise<number>} The count of user favorites
 */
export async function getUserFavoritesCount(userId, favorites, filterConfig = getDefaultConfig()) {
  const limit = null;
  const userDraftsQuery = getQuery(
    getQueryParametersFromConfig(filterConfig, limit, userId, favorites)
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
  const userDraftsQuery = getQuery(getQueryParametersFromConfig(getDraftsConfig(), limit, userId));
  return getAll(userDraftsQuery);
}

/**
 * Retrieves the builds for a specific user based on the provided user ID and filter configuration.
 *
 * @param {string} userId - The ID of the user for whom the builds are being retrieved.
 * @param {object} filterConfig - The configuration object used to filter the builds (default value is getDefaultConfig()).
 * @param {number | null} limit - The maximum number of builds to retrieve (optional, default value is null).
 * @return {Promise<object[]>} An array of build objects retrieved for the user.
 */
export async function getUserBuilds(userId, filterConfig = getDefaultConfig(), limit = null) {
  const userDraftsQuery = getQuery(getQueryParametersFromConfig(filterConfig, limit, userId));
  const result = await getAll(userDraftsQuery);
  store.commit("setBuilds", result);
  return result;
}

/**
 * Retrieves the favorites for a specific user based on the provided user ID, favorites array, filter configuration, and optional limit.
 *
 * @param {string} userId - The ID of the user
 * @param {Array} favorites - Array of user's favorite items
 * @param {Object} filterConfig - Configuration object for filtering the favorites
 * @param {number} limit - Optional limit for the number of favorites to retrieve
 * @return {Promise<Array>} A promise that resolves to the retrieved favorites
 */
export async function getUserFavorites(
  userId,
  favorites,
  filterConfig = getDefaultConfig(),
  limit = null
) {
  const userDraftsQuery = getQuery(
    getQueryParametersFromConfig(filterConfig, limit, userId, favorites)
  );
  const result = await getAll(userDraftsQuery);
  store.commit("setBuilds", result);
  return result;
}

/**
 * Retrieves builds based on the provided filter configuration and limit.
 *
 * @param {Object} filterConfig - The filter configuration to apply.
 * @param {number} limit - The maximum number of builds to retrieve.
 * @return {Promise} The result of the build retrieval.
 */
export async function getBuilds(filterConfig = getDefaultConfig(), limit = null) {
  const userDraftsQuery = getQuery(getQueryParametersFromConfig(filterConfig, limit));
  const result = await getAll(userDraftsQuery);
  store.commit("setBuilds", result);
  return result;
}

/**
 * Retrieves user builds until a specified build ID based on provided filters and limit.
 *
 * @param {string} userId - The ID of the user
 * @param {string} endBuildId - The build ID to retrieve builds until
 * @param {object} filterConfig - The configuration object for filtering (default is getDefaultConfig())
 * @param {number} limit - The maximum number of builds to retrieve (optional)
 * @return {Array} An array of builds retrieved based on the provided parameters
 */
export async function getUserBuildsUntil(
  userId,
  endBuildId,
  filterConfig = getDefaultConfig(),
  limit = null
) {
  const snapshot = await getSnapshot(endBuildId);

  const query = getQuery(
    getQueryParametersFromConfig(filterConfig, null, userId)
      .concat(getLimitToLastQueryParam(limit))
      .concat(getEndBeforeQueryParam(snapshot))
  );
  const res = await getAll(query);
  store.commit("setBuilds", res);
  return res;
}

/**
 * Retrieves user favorites until a specified build ID.
 *
 * @param {string} userId - The ID of the user
 * @param {number} endBuildId - The build ID to retrieve favorites until
 * @param {Array} favorites - List of favorites
 * @param {object} filterConfig - Filter configuration object (default is getDefaultConfig())
 * @param {number} limit - Maximum number of results to return
 * @return {Promise} Resolves with the retrieved favorites
 */
export async function getUserFavoritesUntil(
  userId,
  endBuildId,
  favorites,
  filterConfig = getDefaultConfig(),
  limit = null
) {
  const snapshot = await getSnapshot(endBuildId);

  const query = getQuery(
    getQueryParametersFromConfig(filterConfig, null, userId, favorites)
      .concat(getLimitToLastQueryParam(limit))
      .concat(getEndBeforeQueryParam(snapshot))
  );
  const res = await getAll(query);
  store.commit("setBuilds", res);
  return res;
}

/**
 * Retrieves builds until a specified build ID.
 *
 * @param {number} endBuildId - The build ID until which builds should be retrieved.
 * @param {Object} filterConfig - The configuration object for filtering builds. Defaults to getDefaultConfig().
 * @param {number} limit - The maximum number of builds to retrieve.
 * @return {Promise<Array>} An array of builds retrieved until the specified build ID.
 */
export async function getBuildsUntil(endBuildId, filterConfig = getDefaultConfig(), limit = null) {
  const snapshot = await getSnapshot(endBuildId);

  const query = getQuery(
    getQueryParametersFromConfig(filterConfig, null)
      .concat(getLimitToLastQueryParam(limit))
      .concat(getEndBeforeQueryParam(snapshot))
  );
  const res = await getAll(query);
  store.commit("setBuilds", res);
  return res;
}

/**
 * Retrieves user builds starting from a specific build ID.
 *
 * @param {string} userId - The ID of the user whose builds are being retrieved.
 * @param {number} startBuildId - The ID of the build to start from.
 * @param {object} filterConfig - The configuration object for filtering (default is getDefaultConfig()).
 * @param {number} limit - The maximum number of builds to retrieve.
 * @return {Promise} Resolves with the builds retrieved.
 */
export async function getUserBuildsFrom(
  userId,
  startBuildId,
  filterConfig = getDefaultConfig(),
  limit = null
) {
  const snapshot = await getSnapshot(startBuildId);

  const query = getQuery(
    getQueryParametersFromConfig(filterConfig, limit, userId).concat(
      getStartAfterQueryParam(snapshot)
    )
  );
  const res = await getAll(query);
  store.commit("setBuilds", res);
  return res;
}

export async function getUserFavoritesFrom(
  userId,
  startBuildId,
  favorites,
  filterConfig = getDefaultConfig(),
  limit = null
) {
  const snapshot = await getSnapshot(startBuildId);

  const query = getQuery(
    getQueryParametersFromConfig(filterConfig, limit, userId, favorites).concat(
      getStartAfterQueryParam(snapshot)
    )
  );
  const res = await getAll(query);
  store.commit("setBuilds", res);
  return res;
}

/**
 * Retrieves builds starting from a specified build ID, filtered by the provided configuration and limited to a specific number of builds.
 *
 * @param {number} startBuildId - The ID of the build to start retrieving from.
 * @param {object} filterConfig - The configuration object used to filter the builds (defaults to getDefaultConfig()).
 * @param {number} limit - The maximum number of builds to retrieve (defaults to null).
 * @return {Promise<object>} The retrieved builds.
 */
export async function getBuildsFrom(startBuildId, filterConfig = getDefaultConfig(), limit = null) {
  const snapshot = await getSnapshot(startBuildId);

  const query = getQuery(
    getQueryParametersFromConfig(filterConfig, limit).concat(getStartAfterQueryParam(snapshot))
  );
  const res = await getAll(query);
  store.commit("setBuilds", res);
  return res;
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
    getQueryParametersFromConfig(getMostRecentBuildsConfig(), limit)
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
  const popularQuery = getQuery(getQueryParametersFromConfig(getPopularBuildsConfig(), limit));
  const result = await getAll(popularQuery);
  store.commit("setBuilds", result);
  return result;
}

/**
 * Retrieves all-time classic builds based on the specified limit.
 *
 * @param {number} limit - The maximum number of items to retrieve.
 * @return {Promise} The result of retrieving all-time classics.
 */
export async function getAllTimeClassics(limit) {
  const popularQuery = getQuery(getQueryParametersFromConfig(getAllTimeClassicsConfig(), limit));
  const result = await getAll(popularQuery);
  store.commit("setBuilds", result);
  return result;
}
