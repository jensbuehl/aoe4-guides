//External
import { where, orderBy, limit, endBefore, startAfter, limitToLast } from "@/firebase";

const getQueryParametersPreviousPage = (config, limitToLast, pageEnd, userUid, favorites) => {
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

const getQueryParametersNextPage = (config, limit, pageStart, userUid, favorites) => {
   try {
      var queryParams = getQueryParametersFromConfig(config, limit, userUid, favorites);
      queryParams = queryParams.concat(filterPageWith(pageStart, null));

      return queryParams;
   } catch (err) {
      console.log(err.message);
   }
};

const getQueryParametersForCreators = (isFeatured, limit) => {
   try {
      var queryParams = [];
      if (limit) {
         const limitOp = limitWith(limit);
         queryParams.push(limitOp);
      }
      if (isFeatured) {
         const featuredOp = where("isFeatured", "==", true);
         queryParams.push(featuredOp);
      }
      return queryParams;
   } catch (err) {
      console.log(err.message);
   }
};

const getQueryParametersFromConfig = (config, pageLimit, userUid, favorites) => {
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

const orderByWith = (config, dir) => {
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

const filterWith = (config, favorites) => {
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

const whereNotEqual = (field, value) => {
   try {
      const queryParams = [];
      const whereOp = where(field, "!=", value);
      queryParams.push(whereOp);

      return queryParams;
   } catch (err) {
      console.log(err.message);
   }
};

export default {
   getQueryParametersFromConfig,
   getQueryParametersForCreators,
   filterAuthorBy,
   orderByWith,
   getQueryParametersNextPage,
   getQueryParametersPreviousPage,
   limitWith,
   filterWith,
   whereEqual,
   whereNotEqual,
};
