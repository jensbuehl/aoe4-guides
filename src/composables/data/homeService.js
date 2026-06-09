import collectionService from "@/composables/data/collectionService";
import { db, doc, getDocFromServer, getDoc } from "@/firebase";

const { get } = collectionService("home");

export async function getHomeSnapshot() {
  // Always fetch from server so the hourly Cloud Function update is
  // immediately visible. Falls back to cached copy when offline.
  const ref = doc(db, "home", "home");
  try {
    const snap = await getDocFromServer(ref);
    return snap.data();
  } catch {
    const snap = await getDoc(ref);
    return snap.data();
  }
}

export async function getRecentYoutubeVideos() {
  const home = await get("home");
  return home.recentVideos;
}

export async function getRecentCivBuilds() {
  const home = await get("home");
  return home.recentCivBuilds;
}
