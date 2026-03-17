export const THEME_STORAGE_KEY = "aoe4-guides-theme";

/** @returns {'light' | 'dark' | null} */
export function getSavedTheme() {
  const s = localStorage.getItem(THEME_STORAGE_KEY);
  return s === "light" || s === "dark" ? s : null;
}

/** @param theme Return value of Vuetify's useTheme() */
export function applyVuetifyTheme(theme, useDark) {
  theme.global.name.value = useDark
    ? "customDarkTheme"
    : "customLightTheme";
}

export function setSavedTheme(mode) {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
}
