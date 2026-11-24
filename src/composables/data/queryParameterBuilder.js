//External
import { where, orderBy, limit, endBefore, startAfter, limitToLast } from "@/firebase";

/**
 * Generate query parameters based on the provided configuration, page limit and user ID.
 *
 * @param {Object} config - The configuration object.
 * @param {number} pageLimit - The limit of items per page.
 * @param {string} userUid - The ID of the user.
 * @return {Array} An array of query parameters.
 */
export function getQueryParametersFromConfig(config, pageLimit, userUid) {
  try {
    var queryParams = [];
    if (pageLimit) {
      queryParams = getLimitQueryParam(pageLimit);
    }
    if (config) {
      queryParams = queryParams
        .concat(getFilterQueryParams(config))
        .concat(getOrderByQueryParam(config));
    }
    if (userUid) {
      queryParams = queryParams.concat(getFilterAuthorQueryParam(userUid));
    }
    return queryParams;
  } catch (err) {
    console.error(err.message);
  }
}

/**
 * Function to generate filter author query parameter.
 *
 * @param {string} userUid - The user's unique identifier
 * @return {array} Array of query parameters
 */
export function getFilterAuthorQueryParam(userUid) {
  try {
    const queryParams = [];
    const whereOp = where("authorUid", "==", userUid);
    queryParams.push(whereOp);
    return queryParams;
  } catch (err) {
    console.error(err.message);
  }
}

/**
 * Retrieves the startAfter query parameter based on the given snapshot.
 *
 * @param {type} snapshot - The snapshot used to generate the startAfter query parameter
 * @return {Array} An array containing the startAfter query parameter
 */
export function getStartAfterQueryParam(snapshot) {
  try {
    const queryParams = [];

    const startAfterOp = startAfter(snapshot);
    queryParams.push(startAfterOp);

    return queryParams;
  } catch (err) {
    console.error(err.message);
  }
}

/**
 * Retrieves the query parameters for the "end before" operation based on the provided snapshot.
 *
 * @param {Object} snapshot - The snapshot object used to generate the query parameters.
 * @return {Array} An array of query parameters for the "end before" operation.
 */
export function getEndBeforeQueryParam(snapshot) {
  try {
    const queryParams = [];

    const endBeforeOp = endBefore(snapshot);
    queryParams.push(endBeforeOp);

    return queryParams;
  } catch (err) {
    console.error(err.message);
  }
}

/**
 * Generates the query parameters for limiting the number of results.
 *
 * @param {number} pageLimit - The maximum number of results to return.
 * @return {array} An array of query parameters.
 */
export function getLimitQueryParam(pageLimit) {
  try {
    const queryParams = [];
    const limitOp = limit(pageLimit);
    queryParams.push(limitOp);
    return queryParams;
  } catch (err) {
    console.error(err.message);
  }
}

/**
 * Retrieves the last n elements from a collection.
 *
 * @param {number} pageLimit - The number of elements to retrieve.
 * @return {Array} An array containing the last n elements.
 */
export function getLimitToLastQueryParam(pageLimit) {
  try {
    const queryParams = [];
    const limitOp = limitToLast(pageLimit);
    queryParams.push(limitOp);
    return queryParams;
  } catch (err) {
    console.error(err.message);
  }
}

/**
 * Generates an array of query parameters for ordering the results based on the given configuration and direction.
 *
 * @param {Object} config - The configuration object containing the orderBy property.
 * @param {string} [dir] - The direction of the ordering. Defaults to "desc" if not provided.
 * @return {Array} An array of query parameters for ordering the results.
 */
export function getOrderByQueryParam(config, sortPropertyName, dir) {
  try {
    const queryParams = [];
    var myDir = "desc";

    if (dir) {
      myDir = dir;
    }
    if (sortPropertyName) {
      const orderByOp = orderBy(sortPropertyName, myDir);
      queryParams.push(orderByOp);
    } else {
      if (config.orderBy === "sortTitle") {
        myDir = "asc";
      }
      const orderByOp = orderBy(config.orderBy, myDir);
      queryParams.push(orderByOp);
    }

    return queryParams;
  } catch (err) {
    console.error(err.message);
  }
}

/**
 * The most combinations Firestore will answer for one query. Every `in` below
 * is expanded into a disjunctive normal form, and a query whose expansion has
 * more terms is refused with "Too many disjunctions after normalization"
 * (verified on dev, spec 045 research R10) — which the list's read swallows, so
 * the user would see an empty list as if nothing matched.
 */
export const MAX_DISJUNCTIONS = 30;

/**
 * How many combinations a filter config expands to: the product of its
 * multi-select lists, each counted as 1 when empty. Civ, creator and author
 * are single-value `in`s and always count 1. Kept beside getFilterQueryParams
 * so a new multi-select filter is added to both (spec 045 FR-017).
 *
 * @param {Object} config - A filter configuration (applied or draft).
 * @return {number} The number of disjunctions the query would have.
 */
export function disjunctionCount(config) {
  return [config?.seasons, config?.maps, config?.strategies].reduce(
    (product, list) => product * Math.max(1, list?.length ?? 0),
    1
  );
}

/**
 * Generates query parameters based on the provided configuration.
 *
 * @param {Object} config - The configuration object containing various filter options.
 * @return {Array} An array of query parameters for filtering.
 */
export function getFilterQueryParams(config) {
  try {
    const queryParams = [];

    if (config?.creator) {
      const creatorOp = where("creatorId", "in", [config.creator]);
      queryParams.push(creatorOp);
    }

    if (config?.drafts == true) {
      const draftOp = where("isDraft", "==", config?.drafts);
      queryParams.push(draftOp);
    } else {
      const draftOp = where("isDraft", "==", false);
      queryParams.push(draftOp);
    }

    if (config?.author) {
      const authorOp = where("authorUid", "in", [config.author]);
      queryParams.push(authorOp);
    }

    if (config?.civs) {
      const civsOp = where("civ", "in", [config.civs]);
      queryParams.push(civsOp);
    }

    if (config?.seasons.length > 0) {
      const seasonsOp = where("season", "in", config.seasons);
      queryParams.push(seasonsOp);
    }

    if (config?.maps.length > 0) {
      const mapsOp = where("map", "in", config.maps);
      queryParams.push(mapsOp);
    }

    if (config?.strategies.length > 0) {
      const strategiesOp = where("strategy", "in", config.strategies);
      queryParams.push(strategiesOp);
    }

    return queryParams;
  } catch (err) {
    console.error(err.message);
  }
}

/**
 * Generates a query parameter array with a condition matching a field with a specific value.
 *
 * @param {string} field - The field to match in the query.
 * @param {any} value - The value to match against the field.
 * @return {Array} An array containing the query parameter for matching field and value.
 */
export function getWhereEqualQueryParam(field, value) {
  try {
    const queryParams = [];
    const whereOp = where(field, "==", value);
    queryParams.push(whereOp);

    return queryParams;
  } catch (err) {
    console.error(err.message);
  }
}

/**
 * Generates a query parameter for a "!=" (not equal) condition on a specific field.
 *
 * @param {string} field - the field to apply the "!=" condition on
 * @param {any} value - the value to compare against
 * @return {Array} an array containing the generated query parameter
 */
export function getWhereNotEqualQueryParam(field, value) {
  try {
    const queryParams = [];
    const whereOp = where(field, "!=", value);
    queryParams.push(whereOp);

    return queryParams;
  } catch (err) {
    console.error(err.message);
  }
}


/**
 * A filter on a list of build ids, for loading builds by id (My Favorites).
 *
 * Deliberately never combined with the filters above: an `in` filter takes at
 * most 30 values, and a query at most 30 disjunctions across all its `in`
 * filters multiplied together — 20 favourites × 2 seasons is already refused.
 * Callers pass at most 30 ids and filter the result in memory
 * (applyListConfig, spec 042).
 *
 * @param {string[]} ids - At most 30 build ids.
 * @return {Array} The query parameter.
 */
export function getIdsQueryParam(ids) {
  return [where("id", "in", ids)];
}
