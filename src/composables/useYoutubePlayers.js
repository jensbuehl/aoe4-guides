import { computed, onBeforeUnmount, ref } from "vue";

const IFRAME_API_SRC = "https://www.youtube.com/iframe_api";

// YT.PlayerState values we treat as "the user is watching".
const PLAYING = 1;
const BUFFERING = 3;

let apiPromise = null;

/**
 * Loads the YouTube IFrame API once per page and resolves once YT is usable.
 * Every caller shares the same promise, so the script is injected only once.
 */
function loadIframeApi() {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve(window.YT);
    };

    const script = document.createElement("script");
    script.src = IFRAME_API_SRC;
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("Could not load the YouTube IFrame API"));
    };
    document.head.appendChild(script);
  });

  return apiPromise;
}

/**
 * Embed url that lets the IFrame API talk to the player.
 * Without enablejsapi the player cannot be paused or observed from here.
 */
export function buildEmbedSrc(videoId) {
  const params = new URLSearchParams({
    enablejsapi: "1",
    origin: window.location.origin,
    playsinline: "1",
    rel: "0",
  });
  return `https://www.youtube.com/embed/${videoId}?${params}`;
}

/**
 * Tracks a set of embedded players so a host component can react to playback
 * and pause them on demand. Keys are caller-chosen, typically the video id.
 */
export function useYoutubePlayers() {
  const players = new Map();
  const playingKey = ref(null);
  let unmounted = false;

  const isPlaying = computed(() => playingKey.value !== null);

  function handleStateChange(key, state) {
    if (state === PLAYING || state === BUFFERING) {
      playingKey.value = key;
    } else if (playingKey.value === key) {
      // Paused, ended, cued — nobody is watching this one any more.
      playingKey.value = null;
    }
  }

  /**
   * Ref callback for an iframe. Vue calls it with the element on mount and
   * with null on unmount; carousel items mount lazily, so this may run late.
   */
  function registerPlayer(key, element) {
    if (!element || players.has(key)) return;

    players.set(key, null); // Reserve the slot against a second registration.
    loadIframeApi()
      .then((YT) => {
        if (unmounted) return;
        players.set(
          key,
          new YT.Player(element, {
            events: {
              onStateChange: (event) => handleStateChange(key, event.data),
            },
          })
        );
      })
      .catch((error) => {
        players.delete(key);
        console.error("Could not attach the YouTube player: ", error);
      });
  }

  function pause(key) {
    const player = players.get(key);
    if (!player?.pauseVideo) return;
    try {
      player.pauseVideo();
    } catch (error) {
      console.error("Could not pause the YouTube player: ", error);
    }
    if (playingKey.value === key) playingKey.value = null;
  }

  onBeforeUnmount(() => {
    unmounted = true;
    players.forEach((player) => {
      try {
        player?.destroy?.();
      } catch {
        // The iframe may already be gone; nothing left to release.
      }
    });
    players.clear();
    playingKey.value = null;
  });

  return { registerPlayer, pause, isPlaying };
}
