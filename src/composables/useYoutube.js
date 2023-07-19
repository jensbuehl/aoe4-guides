import axios from "axios";

export default function useYoutube() {
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
          key: "AIzaSyCizsvBzR6vDVQQ1fp_H8pEB6XjJ1T5qjY",
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
          key: "AIzaSyCizsvBzR6vDVQQ1fp_H8pEB6XjJ1T5qjY",
          part: "snippet",
          id: videoId,
        },
      })
      .then((response) => {
        if (response.data.items.length > 0) {
          return {
            channelId: response.data.items[0].snippet.channelId,
            channelTitle: response.data.items[0].snippet.channelTitle,
            displayTitle: response.data.items[0].snippet.channelTitle
          }
        } else {
          throw new Error(`No video with id ${videoId} found.`);
        }
      })
      .catch((error) => {
        console.log("Could not retrive youtube video meta data: ", error);
      });
  };

  return { extractVideoId, buildEmbedUrl, getVideoCreatorId, getVideoMetaData };
}
