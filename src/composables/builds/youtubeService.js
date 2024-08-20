//External
import axios from "axios";

const API_KEY = "AIzaSyCizsvBzR6vDVQQ1fp_H8pEB6XjJ1T5qjY"

export default function youtubeService() {
  const search = async (searchParam, maxResults) => {
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
      console.log("Could not retrive search result: ", error);
    });
  };

  const extractVideoId = (videoUrl) => {
    if (videoUrl) {
      var regExp =
        /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\??v?=?))([^#\&\?]*).*/;
      return videoUrl.match(regExp)[7];
    }
    throw new Error(`Could not extract video id from ${videoUrl}`)
  };

  const buildEmbedUrl = (videoId) => {
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    throw new Error(`Could not create embed url from empty video id`)
  };

  const getVideoCreatorId = async (videoId) => {
    return await axios
      .get("https://www.googleapis.com/youtube/v3/videos", {
        params: {
          key: API_KEY,
          part: "snippet",
          id: videoId,
        },
      })
      .then((response) => {
        if (response.data.items.length > 0) {
          return response.data.items[0].snippet.channelId;
        } else {
          throw new Error(`No video with id ${videoId} found.`);
        }
      })
      .catch((error) => {
        console.log("Could not retrive youtube video meta data: ", error);
      });
  };

  const getVideoMetaData = async (videoId) => {
    return await axios
      .get("https://www.googleapis.com/youtube/v3/videos", {
        params: {
          key: API_KEY,
          part: "snippet",
          id: videoId,
        },
      })
      .then((response) => {
        if (response.data.items.length > 0) {
          return {
            creatorId: response.data.items[0].snippet.channelId,
            creatorTitle: response.data.items[0].snippet.channelTitle,
            creatorDisplayTitle: "", //override when needed
          }
        } else {
          throw new Error(`No video with id ${videoId} found.`);
        }
      })
      .catch((error) => {
        console.log("Could not retrive youtube video meta data: ", error);
      });
  };

  const getChannelIcon = async (channelId) => {
    return await axios
    .get("https://www.googleapis.com/youtube/v3/channels", {
      params: {
        key: API_KEY,
        part: "snippet",
        id: channelId,
      },
    })
    .then((response) => {
      if (response.data.items.length > 0) {
        return response.data.items[0].snippet.thumbnails.default.url
      } else {
        throw new Error(`No video with id ${videoId} found.`);
      }
    })
    .catch((error) => {
      console.log("Could not retrive youtube video meta data: ", error);
    });
  };

  return { extractVideoId, buildEmbedUrl, getVideoCreatorId, getVideoMetaData, getChannelIcon, search };
}
