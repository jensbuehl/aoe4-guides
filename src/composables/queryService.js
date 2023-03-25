import { where, orderBy, limit } from "../firebase";

const getQueryParametersMyBuilds = (config, userUid) => {
  try {
    var queryParams = filterAuthorBy(userUid);
    if (config) {
      queryParams = queryParams.concat(limitWith(config));
      queryParams = queryParams.concat(filterWith(config));
      queryParams = queryParams.concat(orderByWith(config));
    }
    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

const getQueryParametersAllBuilds = (config,) => {
  try {
    if (config) {
      var queryParams = limitWith(config);
      queryParams = queryParams.concat(filterWith(config));
      queryParams = queryParams.concat(orderByWith(config));
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

const limitWith = (config) => {
  try {
    const queryParams = [];
    const limitOp = limit(config.limit);
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

const filterWith = (config) => {
  try {
    const queryParams = [];

    if (config.civs.length > 0) {
      const civsOp = where("civ", "in", config.civs);
      queryParams.push(civsOp);
    }

    if (config.maps.length > 0) {
      const mapsOp = where("map", "in", config.maps);
      queryParams.push(mapsOp);
    }

    if (config.strategies.length > 0) {
      const strategiesOp = where("strategy", "in", config.strategies);
      queryParams.push(strategiesOp);
    }

    return queryParams;
  } catch (err) {
    console.log(err.message);
  }
};

export default {
  getQueryParametersAllBuilds,
  getQueryParametersMyBuilds,
  filterAuthorBy,
  orderByWith,
  limitWith,
  filterWith,
};
