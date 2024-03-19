//Composables
import useCollection from "@/composables/data/useCollection";
import queryService from "@/composables/useQueryService";

const { getAll, getQuery, add, del } = useCollection("comments");

/**
 * A function to add a comment with a custom ID.
 *
 * @param {string} comment - the comment to be added
 * @param {string} customId - the custom ID for the comment
 * @return {Promise} a promise that resolves after the comment is added
 */
export async function addComment(comment, customId) {
    add(comment, customId);
}

/**
 * Deletes a comment with the specified commentId.
 *
 * @param {type} commentId - The ID of the comment to be deleted
 * @return {type} 
 */
export async function deleteComment(commentId) {
    del(commentId);
}

/**
 * Retrieves comments based on the provided buildId.
 *
 * @param {type} buildId - The ID of the build to retrieve comments for
 * @return {type} The comments retrieved based on the buildId
 */
export async function getComments(buildId) {
    
    var queryParams = queryService.whereEqual("buildId", buildId);
    queryParams = queryParams.concat(
        queryService.orderByWith({ orderBy: "timeCreated" }, "asc")
        );
        const query = getQuery(queryParams);
        
    return getAll(query);
}