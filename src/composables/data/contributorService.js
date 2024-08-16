//External
import { store } from "@/store/index.js";
import { computed } from "vue";

//Composables
import collectionService from "@/composables/data/collectionService";
import {
  getQueryParametersFromConfig,
} from "@/composables/data/queryParameterBuilder";

const {
  incrementNumber,
  decrementNumber,
  getQuery,
  getAll,
  error: collectionServiceError,
} = collectionService("contributors");

/**
 * Returns the error value of the collectionService composable.
 *
 * @return {Ref<string|null>} The error value, which is a reactive reference to a string or null.
 */
export const error = computed(() => collectionServiceError).value;


export async function getTopContributors(limit) {
  //TODO: Use limit, sort by views
  const topContributorsQuery = getQuery(getQueryParametersFromConfig(null, limit));
  const result = await getAll(topContributorsQuery);

  //Add to cache
  store.commit("setTopContributorsList", result);
  return result;
}
