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

// Guarded like the theme (useThemePreference): with site data blocked, touching
// `localStorage` throws. Unreadable is "nothing stored", which resolves to
// "here"; an unwritable choice still plays, it is just not remembered.
/** @returns {'here' | 'floating' | 'phone' | null} */
export function getSavedPlayTarget() {
  try {
    const stored = localStorage.getItem(PLAY_TARGET_STORAGE_KEY);
    return PLAY_TARGETS.includes(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function setSavedPlayTarget(target) {
  if (!PLAY_TARGETS.includes(target)) return;
  try {
    localStorage.setItem(PLAY_TARGET_STORAGE_KEY, target);
  } catch {
    // Not remembered past this visit.
  }
}

/**
 * Whether this is the device a player holds beside the game rather than the one
 * running it: a phone or a tablet.
 *
 * Both targets other than "here" exist for the machine the game runs on. A
 * floating window floats over *that* screen, and "Send to phone" moves the
 * build off it. On a handheld the first has no game to float over and the
 * second sends the build to the device it is already on, so Focus mode in the
 * tab is the only target that means anything.
 *
 * Platform rather than viewport or pointer, because neither of those answers
 * this. A phone turned sideways is 851px wide, an iPad 1024px, and a Surface in
 * tablet mode reports a coarse pointer while being exactly the PC that floating
 * and sending exist for. The header reads the same platform to give phones the
 * bottom navigation, but checks only `android || ios`. This adds a Mac with
 * touch, deliberately, because that is an iPad: iPadOS asks for the desktop
 * site under a Mac user agent, and no Mac has a touchscreen. The header's
 * question is a different one — an iPad has room for the desktop navigation —
 * so the two are not meant to agree.
 *
 * @param {{android: boolean, ios: boolean, mac: boolean, touch: boolean}} platform
 *   - Vuetify's `useDisplay().platform.value`.
 * @return {boolean}
 */
export function isHandheld({ android, ios, mac, touch }) {
  return android || ios || (mac && touch);
}

/**
 * The target to actually run, given what was stored and what this device offers.
 *
 * Every way a stored value stops being usable ends at "here", which is offered
 * everywhere: nothing was ever stored, or what was stored is not offered here —
 * a "floating" read on a browser without Document Picture-in-Picture, or any
 * other target read on a handheld. The preference is per-browser, so a player
 * who uses Chrome at home and Firefox at work would otherwise arrive at a
 * button that does nothing at all, and one who once sent a build to their phone
 * *from* that phone at a button that shows them a QR code of the page they are
 * on.
 *
 * @param {string|null} stored - Result of getSavedPlayTarget().
 * @param {string[]} offered - The targets this device offers.
 * @return {'here' | 'floating' | 'phone'} A target that is always runnable.
 */
export function resolvePlayTarget(stored, offered) {
  return offered.includes(stored) ? stored : "here";
}
