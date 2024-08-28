//Composables
import collectionService from "@/composables/data/collectionService";

const {
  get,
} = collectionService("home");

export async function getRecentYoutubeVideos() {
  const home = await get("home")
  console.log(home);
  
  return home.recentVideos;
}

export async function getRecentCivBuilds() {
  const home = await get("home")
  console.log(home);
  
  return home.recentCivBuilds;
}
