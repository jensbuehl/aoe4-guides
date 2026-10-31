export const THEME_STORAGE_KEY = "aoe4-guides-theme";

// Every access goes through these, guarded. With site data blocked entirely,
// merely touching `localStorage` throws a SecurityError, and the theme is read
// during the first render of App and Header: one unguarded read there and the
// app does not mount at all. Unreadable storage is "system", and an unwritable
// choice still applies for the rest of the visit.

/** @returns {'light' | 'dark' | null} */
export function getSavedTheme() {
  try {
    const s = localStorage.getItem(THEME_STORAGE_KEY);
    return s === "light" || s === "dark" ? s : null;
  } catch {
    return null;
  }
}

/** @param theme Return value of Vuetify's useTheme() */
export function applyVuetifyTheme(theme, useDark) {
  theme.global.name.value = useDark
    ? "customDarkTheme"
    : "customLightTheme";
}

export function setSavedTheme(mode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Not remembered past this visit.
  }
}

/** Back to following the system, which is what no stored value means. */
export function clearSavedTheme() {
  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // Nothing stored that could be removed.
  }
}
