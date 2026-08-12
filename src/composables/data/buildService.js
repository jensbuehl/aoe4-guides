//External
import { store } from "@/store/index.js";
import { computed } from "vue";
import { Timestamp } from "@/firebase";

//Composables
import collectionService from "@/composables/data/collectionService";
import {
  getQueryParametersFromConfig,
  getStartAfterQueryParam,
  getEndBeforeQueryParam,
  getLimitToLastQueryParam,
} from "@/composables/data/queryParameterBuilder";
import { getAgeTimings, toStoredAgeTimings } from "@/composables/builds/useAgeTimings.js";
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
  getOrThrow,
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
  return incrementNumber(buildId, "likes");
}

/**
 * Decrements the number of likes for a specific build.
 *
 * @param {string} buildId - The ID of the build to decrement likes for
 * @return {Promise<void>} This function does not return anything
 */
export async function decrementLikes(buildId) {
  return decrementNumber(buildId, "likes");
}

/**
 * Increment downvotes for a specific build.
 *
 * @param {string} buildId - The ID of the build to update.
 * @return {Promise<void>} A Promise that resolves once the downvotes are incremented.
 */
export async function incrementDownvotes(buildId) {
  return incrementNumber(buildId, "downvotes");
}

/**
 * Decrements the count of downvotes for a specific build.
 *
 * @param {string} buildId - The identifier of the build to decrement downvotes for.
 * @return {Promise<void>} This function does not return anything.
 */
export async function decrementDownvotes(buildId) {
  return decrementNumber(buildId, "downvotes");
}

/**
 * Increment upvotes for a specific build.
 *
 * @param {string} buildId - The unique identifier of the build
 * @return {Promise<void>} This function does not return anything.
 */
export async function incrementUpvotes(buildId) {
  return incrementNumber(buildId, "upvotes");
}

/**
 * Decrements the upvotes count for a specific build.
 *
 * @param {string} buildId - The unique identifier of the build.
 * @return {Promise<void>} A promise that resolves when the upvotes count is decremented.
 */
export async function decrementUpvotes(buildId) {
  return decrementNumber(buildId, "upvotes");
}

/**
 * Increments the number of views for a given build.
 *
 * @param {string} buildId - The ID of the build.
 * @return {Promise<void>} A promise that resolves when the increment is complete.
 */
export async function incrementViews(buildId) {
  return incrementNumber(buildId, "views");
}

/**
 * Increment the number of comments for a specific build.
 *
 * @param {type} buildId - The identifier of the build
 * @return {Promise<void>} A promise that resolves when the increment is complete.
 */
export async function incrementComments(buildId) {
  return incrementNumber(buildId, "comments");
}

/**
 * Decrements the number of comments associated with the given build ID.
 *
 * @param {any} buildId - the ID of the build
 * @return {Promise<void>} a Promise that resolves when the comments are decremented
 */
export async function decrementComments(buildId) {
  return decrementNumber(buildId, "comments");
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
export async function getUserFavoritesCount(favorites, filterConfig = getDefaultConfig()) {
  const limit = null;
  const userDraftsQuery = getQuery(
    getQueryParametersFromConfig(filterConfig, limit, null, favorites)
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
  favorites,
  filterConfig = getDefaultConfig(),
  limit = null
) {
  const userDraftsQuery = getQuery(
    getQueryParametersFromConfig(filterConfig, limit, null, favorites)
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
  endBuildId,
  favorites,
  filterConfig = getDefaultConfig(),
  limit = null
) {
  const snapshot = await getSnapshot(endBuildId);

  const query = getQuery(
    getQueryParametersFromConfig(filterConfig, null, null, favorites)
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
  startBuildId,
  favorites,
  filterConfig = getDefaultConfig(),
  limit = null
) {
  const snapshot = await getSnapshot(startBuildId);

  const query = getQuery(
    getQueryParametersFromConfig(filterConfig, limit, null, favorites).concat(
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

//The codes that mean "the database could not answer", as opposed to "this build
//does not exist". Only these reach the fallback.
//
//Both observed failure modes produce the same symptom — an existing build
//rendering as "Build Order Not Found" — through different causes:
//
//  permission-denied  App Check refused to attest the client. Googlebot's
//  unauthenticated    renderer denies the reCAPTCHA iframe storage access, so
//                     no token can be minted. Measured in Search Console.
//
//  unavailable        Firestore's own connection never came up and the client
//                     dropped into offline mode. A blocked or filtered network
//                     reaches Firestore's transport before it reaches App Check.
//
//`unavailable` is included despite looking like plain "no internet", because
//when that is genuinely the case the fetch below fails at the browser without
//reaching Cloud Run — free, and harmlessly useless. When it is *not* the case,
//and only Firestore is unreachable, it is the difference between a readable page
//and an error. It is a last resort after a ten-second failure either way, never
//a shortcut around a working database.
//
//Deliberately absent: a build that simply does not exist. That resolves without
//throwing and must keep saying so.
const RECOVERABLE_READ_FAILURES = new Set(["permission-denied", "unauthenticated", "unavailable"]);

/**
 * Rebuilds Firestore Timestamps from their JSON form.
 *
 * The API serialises a Timestamp as `{_seconds, _nanoseconds}` — note the
 * underscores, which `toDateSafe` does not recognise, so every date would
 * silently render as blank. Recursive rather than field-by-field because a
 * build carries dates at more than one depth and a new one must not go missing.
 *
 * @param {*} value - Anything from the API response.
 * @return {*} The same shape, with timestamp objects turned back into Timestamps.
 */
function reviveTimestamps(value) {
  if (Array.isArray(value)) return value.map(reviveTimestamps);
  if (!value || typeof value !== "object") return value;

  if (typeof value._seconds === "number") {
    return new Timestamp(value._seconds, value._nanoseconds ?? 0);
  }

  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, reviveTimestamps(item)]));
}

/**
 * Reads a build through the site's own API, which does not use App Check.
 *
 * The API runs server-side on Cloud Run with a service account, so the Admin
 * SDK reads Firestore directly and neither security rules nor App Check apply.
 * That is the whole reason it can answer where the browser cannot.
 *
 * @param {string} buildId
 * @return {Promise<any>} The build, or undefined.
 */
async function getBuildFromApi(buildId) {
  try {
    const response = await fetch(`/api/builds/${encodeURIComponent(buildId)}`);
    //404 is the API's answer for a build that genuinely does not exist.
    if (!response.ok) return undefined;

    const build = await response.json();

    //Checked rather than trusted. Whatever answers on this path is whatever the
    //environment has wired to /api — during development that was a placeholder
    //proxy pointing at an unrelated public API, and a truthy non-build response
    //reaches `build.value` and breaks rendering somewhere far from the cause.
    if (!build || typeof build !== "object" || !("steps" in build)) {
      console.error("buildService: /api/builds returned something that is not a build.");
      return undefined;
    }

    return reviveTimestamps(build);
  } catch (err) {
    console.error("buildService.getBuild API fallback failed:", err?.message ?? err);
    return undefined;
  }
}

/**
 * Retrieve a build by its ID.
 *
 * Firestore first, always. The API is a fallback for exactly one situation and
 * is not reached in any other: the client could not produce an App Check token,
 * so a read the security rules permit was refused anyway — or Firestore could not be reached at all.
 *
 * That situation is real and was measured, not imagined. Googlebot's renderer
 * denies the reCAPTCHA iframe storage access, App Check gets a 403 and throttles
 * itself for 24 hours, and the read fails with "Missing or insufficient
 * permissions" — so every build page rendered "Build Order Not Found" and Google
 * classified all ~4,200 of them as soft 404s. The same happens to any reader
 * whose browser blocks reCAPTCHA.
 *
 * **A successful Firestore read never touches the API.** Nor does a build that
 * simply does not exist — that resolves to `undefined` without throwing, and
 * must keep showing "not found" rather than costing a second round trip. The
 * fallback is deliberately narrow: widening it to every error would quietly turn
 * a Cloud Run invocation into the normal path and put load on the API that the
 * database is supposed to carry.
 *
 * @param {string} buildId - The ID of the build to retrieve
 * @return {Promise<any>} The retrieved build
 */
export async function getBuild(buildId) {
  try {
    return await getOrThrow(buildId);
  } catch (err) {
    if (!RECOVERABLE_READ_FAILURES.has(err?.code)) {
      //Everything else keeps behaving as it always did: logged, swallowed, and
      //surfaced to the reader as "not found".
      console.error("buildService.getBuild failed:", err?.message ?? err);
      return undefined;
    }

    console.warn(
      `buildService.getBuild: Firestore could not answer (${err.code}). Falling back to the ` +
        `public API, which reads server-side and needs no App Check token.`
    );
    return await getBuildFromApi(buildId);
  }
}

/**
 * Stamps a build with its derived age timings.
 *
 * Done here rather than in the views because all three write paths — create,
 * edit and publish-draft — funnel through addBuild/updateBuild, so no caller can
 * forget. The whole field is replaced on every write, which is what removes ages
 * an edit has taken away.
 *
 * @param {Object} build - The build about to be written.
 * @return {Object} The same build, with ageTimings set.
 */
function withAgeTimings(build) {
  build.ageTimings = toStoredAgeTimings(getAgeTimings(build?.steps));
  return build;
}

/**
 * Removes `undefined` anywhere in a build, and says where it was.
 *
 * Firestore refuses a document containing `undefined` at any depth, and its
 * error names only the document — not the field — so an author sees "we couldn't
 * save this" and nobody can tell why. The build order is nested now (a step, a
 * path, a path's steps), which is exactly the shape where one is easy to
 * introduce and impossible to spot by eye.
 *
 * Stripping rather than throwing: an author's work is worth more than the field
 * that went missing, and `undefined` never carries meaning here — the writers
 * all use "" or null when they mean "nothing". The warning is how it still gets
 * fixed rather than silently tolerated.
 *
 * @param {*} value - Any part of a build.
 * @param {string} path - Dotted path, for the warning.
 * @param {Array} found - Collects the paths that were dropped.
 * @return {*} The same shape with every undefined removed.
 */
function stripUndefined(value, path = "", found = []) {
  if (Array.isArray(value)) {
    return value.map((entry, index) => stripUndefined(entry, `${path}[${index}]`, found));
  }

  //Plain objects and arrays only. A Firestore Timestamp, a Date, a
  //DocumentReference and anything else with a prototype is a *value* — rebuilt
  //as a bare object it loses its methods, and written back it becomes a map in
  //the document. That is what turned `timeCreated` into `{seconds, nanoseconds}`
  //and made every list card throw on `.toDate()`.
  const plain = value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;

  if (plain) {
    const clean = {};
    for (const [key, entry] of Object.entries(value)) {
      const at = path ? `${path}.${key}` : key;
      if (entry === undefined) {
        found.push(at);
        continue;
      }
      clean[key] = stripUndefined(entry, at, found);
    }
    return clean;
  }

  return value;
}

/**
 * A build in a shape Firestore will accept.
 *
 * @param {Object} build - The build about to be written.
 * @return {Object} The same build, minus any undefined field.
 */
function saveable(build) {
  const found = [];
  const clean = stripUndefined(build, "", found);

  if (found.length) {
    console.warn(
      `[build] dropped ${found.length} undefined field(s) before saving:`,
      found.join(", ")
    );
  }

  return clean;
}

/**
 * Adds a build to the database and store, optionally uses a custom ID.
 *
 * @param {Object} build - The build object to be added.
 * @param {string|null} [customId=null] - An optional custom ID for the build.
 * @return {Promise<void>} - A promise that resolves when the build is added and operations are completed.
 */
export async function addBuild(build, customId = null) {
  withAgeTimings(build);
  store.commit("setBuild", build);
  return add(saveable(build), customId);
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
  return update(buildId, saveable(withAgeTimings(build)), updateCreatedTimestamp);
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
