//Composables
import collectionService from "@/composables/data/collectionService";
import {
  getOrderByQueryParam,
  getWhereEqualQueryParam,
} from "@/composables/data/queryParameterBuilder";
const { getAll, getQuery, getSize, add, del } = collectionService("comments");

/**
 * A function to add a comment with a custom ID.
 *
 * @param {string} comment - the comment to be added
 * @param {string} customId - the custom ID for the comment
 * @return {Promise} a promise that resolves after the comment is added
 */
export async function addComment(comment, customId) {
  return add(comment, customId);
}

/**
 * Deletes a comment with the specified commentId.
 *
 * @param {type} commentId - The ID of the comment to be deleted
 * @return {type}
 */
export async function deleteComment(commentId) {
  return del(commentId);
}

/**
 * Retrieves comments based on the provided buildId.
 *
 * @param {type} buildId - The ID of the build to retrieve comments for
 * @return {type} The comments retrieved based on the buildId
 */
export async function getComments(buildId) {
  var queryParams = getWhereEqualQueryParam("buildId", buildId);
  queryParams = queryParams.concat(getOrderByQueryParam(null, "timeCreated", "asc"));
  const query = getQuery(queryParams);

  return getAll(query);
}

/**
 * Retrieves the count of comments for a specific build.
 *
 * @param {string} buildId - The ID of the build to retrieve comments count for.
 * @return {Promise<number>} The number of comments for the specified build.
 */
export async function getCommentsCount(buildId) {
  var queryParams = getWhereEqualQueryParam("buildId", buildId);
  const query = getQuery(queryParams);

  return getSize(query);
}
