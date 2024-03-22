//External
import { where, orderBy, limit, endBefore, startAfter, limitToLast } from "@/firebase";

export function getQueryParametersFromConfig (config, pageLimit, userUid, favorites) {
  try {
    var queryParams = [];
    if (pageLimit) {
      queryParams = limitWith(pageLimit);
    }
    if (config) {
      queryParams = queryParams.concat(filterWith(config, favorites)).concat(orderByWith(config));
    }
    if (userUid) {
      queryParams = queryParams.concat(filterAuthorBy(userUid));
    }
    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

export function filterAuthorBy (userUid) {
  try {
    const queryParams = [];
    const whereOp = where("authorUid", "==", userUid);
    queryParams.push(whereOp);
    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

export function startAfterQueryParam(snapshot) {
  try {
    const queryParams = [];

    const startAfterOp = startAfter(snapshot);
    queryParams.push(startAfterOp);

    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
}

export function endBeforeQueryParam(snapshot) {
  try {
    const queryParams = [];

    const endBeforeOp = endBefore(snapshot);
    queryParams.push(endBeforeOp);

    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
}

export function limitWith (pageLimit) {
  try {
    const queryParams = [];
    const limitOp = limit(pageLimit);
    queryParams.push(limitOp);
    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

export function limitToLastWith (pageLimit) {
  try {
    const queryParams = [];
    const limitOp = limitToLast(pageLimit);
    queryParams.push(limitOp);
    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

export function orderByWith (config, dir) {
  try {
    const queryParams = [];
    var myDir = "desc";

    if (dir) {
      myDir = dir;
    }
    if (config.orderBy === "sortTitle") {
      myDir = "asc";
    }
    const orderByOp = orderBy(config.orderBy, myDir);
    queryParams.push(orderByOp);

    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

export function filterWith (config, favorites) {
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

    if (favorites?.length > 0) {
      const favoritesOp = where("id", "in", favorites);
      queryParams.push(favoritesOp);
    }

    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

export function whereEqual (field, value) {
  try {
    const queryParams = [];
    const whereOp = where(field, "==", value);
    queryParams.push(whereOp);

    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

export function whereNotEqual (field, value) {
  try {
    const queryParams = [];
    const whereOp = where(field, "!=", value);
    queryParams.push(whereOp);

    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};