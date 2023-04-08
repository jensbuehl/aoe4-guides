import {
  where,
  orderBy,
  limit,
  endBefore,
  startAfter,
  limitToLast,
} from "../firebase";

const getQueryParametersPreviousPage = (
  config,
  limitToLast,
  pageEnd,
  userUid,
  favorites
) => {
  try {
    var queryParams = limitToLastWith(limitToLast);
    if (config) {
      queryParams = queryParams
        .concat(filterWith(config, favorites))
        .concat(orderByWith(config));
    }
    if (userUid) {
      queryParams = queryParams.concat(filterAuthorBy(userUid));
    }
    queryParams = queryParams.concat(filterPageWith(null, pageEnd));

    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

const getQueryParametersNextPage = (
  config,
  limit,
  pageStart,
  userUid,
  favorites
) => {
  try {
    var queryParams = getQueryParametersFromConfig(
      config,
      limit,
      userUid,
      favorites
    );
    queryParams = queryParams.concat(filterPageWith(pageStart, null));

    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

const getQueryParametersFromConfig = (
  config,
  pageLimit,
  userUid,
  favorites
) => {
  try {
    var queryParams = [];
    if (pageLimit) {
      queryParams = limitWith(pageLimit);
    }
    if (config) {
      queryParams = queryParams
        .concat(filterWith(config, favorites))
        .concat(orderByWith(config));
    }
    if (userUid) {
      queryParams = queryParams.concat(filterAuthorBy(userUid));
    }
    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

const filterAuthorBy = (userUid) => {
  try {
    const queryParams = [];
    const whereOp = where("authorUid", "==", userUid);
    queryParams.push(whereOp);
    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

const filterPageWith = (start, end) => {
  try {
    const queryParams = [];
    if (start) {
      const startAfterOp = startAfter(start);
      queryParams.push(startAfterOp);
    }
    if (end) {
      const endBeforeOp = endBefore(end);
      queryParams.push(endBeforeOp);
    }
    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

const limitWith = (pageLimit) => {
  try {
    const queryParams = [];
    const limitOp = limit(pageLimit);
    queryParams.push(limitOp);
    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

const limitToLastWith = (pageLimit) => {
  try {
    const queryParams = [];
    const limitOp = limitToLast(pageLimit);
    queryParams.push(limitOp);
    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

const orderByWith = (config) => {
  try {
    const queryParams = [];

    var dir = "desc";
    if (config.orderBy === "sortTitle") {
      dir = "asc";
    }
    const orderByOp = orderBy(config.orderBy, dir);
    queryParams.push(orderByOp);

    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

const filterWith = (config, favorites) => {
  try {
    const queryParams = [];

    if (config?.civs.length > 0) {
      const civsOp = where("civ", "in", config.civs);
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

    if (favorites) {
      const favoritesOp = where("id", "in", favorites);
      queryParams.push(favoritesOp);
    }

    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

const whereEqual = (field, value) => {
  try {
    const queryParams = [];
    const whereOp = where(field, "==", value);
    queryParams.push(whereOp);

    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

export default {
  getQueryParametersFromConfig,
  filterAuthorBy,
  orderByWith,
  getQueryParametersNextPage,
  getQueryParametersPreviousPage,
  limitWith,
  filterWith,
  whereEqual
};
