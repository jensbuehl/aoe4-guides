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

export async function getTopContributors(limit) {
  const topContributorsQuery = getQuery(getQueryParametersFromConfig(null, limit).concat(getOrderByQueryParam(null, "viewCount"))); 
  const result = await getAll(topContributorsQuery);

  return result;
}
