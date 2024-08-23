const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const axios = require("axios");

const API_KEY = process.env.GOOGLE_API_KEY_CLOUD_FUNCTION;

/**
 * Updates the recent YT videos on a schedule. (daily)
 *
 * @name updateRecentYoutubeVideos
 * @function
 * @async
 * @memberof module:functions
 * @param {Object} event - The Firebase event object.
 * @return {Promise} A promise that resolves when all builds have been updated.
 */
exports.updateRecentYoutubeVideos = onSchedule(
  { schedule: "0 0 * * *", timeoutSeconds: 3600 },
  async (event) => {
    logger.log("start updateRecentYoutubeVideos");
    logger.log("API key", API_KEY);

    // Get all builds
    const count = 5;
    var recentVideos = await search("aoe4 build order guide", count);
    recentVideos = recentVideos.map((video) => {
      return video.id.videoId;
    });

    logger.log("recentVideos", recentVideos);

    return getFirestore().collection("home").doc("home").set(
      {
        recentVideos: recentVideos,
      },
      { merge: true }
    );
  }
);

async function search(searchParam, maxResults) {
  return await axios
    .get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        key: API_KEY,
        q: searchParam,
        part: "snippet",
        maxResults: maxResults,
        order: "date",
        type: "video",
      },
    })
    .then((response) => {
      if (response.data.items.length > 0) {
        return response.data.items;
      } else {
        throw new Error(`No search result for term ${searchParam} found.`);
      }
    })
    .catch((error) => {
      console.log("Could not retrive search result: ", error.message);
    });
}
