export const PLAY_TARGET_STORAGE_KEY = "aoe4-guides-play-target";

/**
 * Where a build starts playing when the player presses the button body rather
 * than opening the menu.
 *
 * A device preference, not session state, which is why it lives here beside the
 * theme rather than in the Vuex store — the store holds the signed-in user, the
 * filter config and the build cache, all of which die with the tab.
 */
export const PLAY_TARGETS = ["here", "floating", "phone"];

/** @returns {'here' | 'floating' | 'phone' | null} */
export function getSavedPlayTarget() {
  const stored = localStorage.getItem(PLAY_TARGET_STORAGE_KEY);
  return PLAY_TARGETS.includes(stored) ? stored : null;
}

export function setSavedPlayTarget(target) {
  if (!PLAY_TARGETS.includes(target)) return;
  localStorage.setItem(PLAY_TARGET_STORAGE_KEY, target);
}

/**
 * The target to actually run, given what was stored and what this browser can do.
 *
 * Two ways a stored value stops being usable, and both end at "here": nothing
 * was ever stored, and a stored "floating" read on a browser without Document
 * Picture-in-Picture. The second is the one that matters — the preference is
 * per-browser, so a player who uses Chrome at home and Firefox at work would
 * otherwise arrive at a button that does nothing at all.
 *
 * @param {string|null} stored - Result of getSavedPlayTarget().
 * @param {boolean} floatingSupported - Whether this browser has Document PiP.
 * @return {'here' | 'floating' | 'phone'} A target that is always runnable.
 */
export function resolvePlayTarget(stored, floatingSupported) {
  if (stored === "floating" && !floatingSupported) return "here";
  return PLAY_TARGETS.includes(stored) ? stored : "here";
}
