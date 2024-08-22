//External
import { store } from "@/store/index.js";
import { computed } from "vue";

//Composables
import collectionService from "@/composables/data/collectionService";
import {
  getQueryParametersFromConfig,
  getOrderByQueryParam,
} from "@/composables/data/queryParameterBuilder";

const {
  incrementNumber,
  decrementNumber,
  add,
  getQuery,
  getAll,
  get,
  error: collectionServiceError,
} = collectionService("contributors");

/**
 * Returns the error value of the collectionService composable.
 *
 * @return {Ref<string|null>} The error value, which is a reactive reference to a string or null.
 */
export const error = computed(() => collectionServiceError).value;

/**
 * Retrieve a contributor by its ID.
 *
 * @param {string} contributorId - The ID of the contributor to retrieve
 * @return {Promise<any>} The retrieved contributor
 */
export async function getContributor(contributorId) {
  const result =  await get(contributorId);
  
  return result;
}

/**
 * Increments the view count for a contributor.
 *
 * @param {string} contributorId - The ID of the contributor to update.
 * @return {Promise<void>} A promise that resolves when the view count has been incremented.
 */
export async function incrementViews(contributorId) {
  return incrementNumber(contributorId, "viewCount");
}

export async function decrementViews(contributorId, decrementCount = 1) {
  return decrementNumber(contributorId, "viewCount", decrementCount);
}

/**
 * Decrements the number of builds associated with a contributor.
 *
 * @param {string} contributorId - The ID of the contributor to update.
 * @return {Promise<void>} A promise that resolves when the builds count has been decremented.
 */
export async function decrementBuilds(contributorId) {
  return decrementNumber(contributorId, "boCount");
}

/**
 * Increments the number of builds associated with a contributor.
 *
 * @param {string} contributorId - The ID of the contributor to update.
 * @return {Promise<void>} A promise that resolves when the builds count has been incremented.
 */
export async function incrementBuilds(contributorId) {
  return incrementNumber(contributorId, "boCount");
}

/**
 * Add a contributor with custom ID.
 *
 * @param {any} contributor - The contributor to add.
 * @param {any} customId - The custom ID to assign to the contributor.
 * @return {Promise<void>}
 */
export async function addContributor(contributor, customId) {
  return add(contributor, customId);
}

/**
 * Retrieves the top contributors based on the specified limit.
 *
 * @param {number} limit - The maximum number of top contributors to retrieve.
 * @return {Promise<any>} The list of top contributors.
 */
export async function getTopContributors(limit) {
  const topContributorsQuery = getQuery(getQueryParametersFromConfig(null, limit).concat(getOrderByQueryParam(null, "viewCount"))); 
  const result = await getAll(topContributorsQuery);

  return result;
}
