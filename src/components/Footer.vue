<template>
  <div height="100px">
    <v-footer padless class="text-center d-flex flex-column">
      <v-row justify="center" class="mt-2 mb-16 mb-sm-4 text-center">
        <v-col cols="12">
          <a href="https://ko-fi.com/jensbuehl"
            ><v-btn class="mx-1" variant="text" color="primary">
              <template v-slot:prepend>
                <v-icon color="red">mdi-heart</v-icon>
              </template>
              Donate
            </v-btn></a
          >
          <a href="https://discord.gg/Nau9BN5E7J"
            ><v-btn class="mx-1" variant="text" color="primary">
              <template v-slot:prepend>
                <v-icon color="primary">mdi-chat</v-icon>
              </template>
              Discord
            </v-btn></a
          >
          <v-btn prepend-icon="mdi-github" class="mx-1" variant="text" color="primary" to="/github"
            >Contribute
          </v-btn>
          <v-btn prepend-icon="mdi-api" class="mx-1" variant="text" color="primary" to="/apidoc"
            >Interface
          </v-btn>
          <v-btn
            prepend-icon="mdi-shield-account"
            class="mx-1"
            variant="text"
            color="primary"
            to="/privacy"
            >Privacy Policy
          </v-btn>
          <v-btn
            prepend-icon="mdi-information"
            class="mx-1"
            variant="text"
            color="primary"
            to="/about"
            >About
          </v-btn>
        </v-col>
        <v-col cols="12" md="8"
          >Age of Empires IV&copy; Microsoft Corporation. aoe4guides.com was created under
          Microsoft's
          <a
            :style="{
              color: $vuetify.theme.current.colors.primary,
            }"
            style="text-decoration: none"
            href="https://www.xbox.com/en-US/developers/rules"
            >Game Content Usage Rules</a
          >
          using assets from
          <a
            :style="{
              color: $vuetify.theme.current.colors.primary,
            }"
            style="text-decoration: none"
            href="https://www.ageofempires.com/games/age-of-empires-iv/"
            >Age of Empires IV</a
          >, and it is not endorsed by or affiliated with Microsoft.</v-col
        >
        <v-col cols="12"
          ><v-label>v{{ version }}</v-label></v-col
        >
      </v-row>
    </v-footer>

    <!-- Fixed so it stays clickable (not covered by main/sheets) -->
    <div
      class="theme-rail"
      role="radiogroup"
      aria-label="Color theme"
    >
      <button
        type="button"
        class="theme-rail__btn"
        :class="{ 'theme-rail__btn--checked': mode === 'system' }"
        role="radio"
        :aria-checked="mode === 'system'"
        aria-label="System theme"
        @click="setSystem"
      >
        <v-icon class="theme-rail__icon" size="22">mdi-monitor</v-icon>
      </button>
      <button
        type="button"
        class="theme-rail__btn"
        :class="{ 'theme-rail__btn--checked': mode === 'light' }"
        role="radio"
        :aria-checked="mode === 'light'"
        aria-label="Light theme"
        @click="setLight"
      >
        <v-icon class="theme-rail__icon" size="22">mdi-white-balance-sunny</v-icon>
      </button>
      <button
        type="button"
        class="theme-rail__btn"
        :class="{ 'theme-rail__btn--checked': mode === 'dark' }"
        role="radio"
        :aria-checked="mode === 'dark'"
        aria-label="Dark theme"
        @click="setDark"
      >
        <v-icon class="theme-rail__icon" size="22">mdi-weather-night</v-icon>
      </button>
    </div>
  </div>
</template>

<script>
//External
import { ref } from "vue";
import { useTheme } from "vuetify";
import {
  applyVuetifyTheme,
  THEME_STORAGE_KEY,
} from "@/composables/useThemePreference";

function readMode() {
  const s = localStorage.getItem(THEME_STORAGE_KEY);
  if (s === "light" || s === "dark") return s;
  return "system";
}

export default {
  name: "Footer",
  setup() {
    const theme = useTheme();
    const version = APP_VERSION;
    const mode = ref(readMode());

    const setSystem = () => {
      localStorage.removeItem(THEME_STORAGE_KEY);
      mode.value = "system";
      applyVuetifyTheme(
        theme,
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    };

    const setLight = () => {
      localStorage.setItem(THEME_STORAGE_KEY, "light");
      mode.value = "light";
      applyVuetifyTheme(theme, false);
    };

    const setDark = () => {
      localStorage.setItem(THEME_STORAGE_KEY, "dark");
      mode.value = "dark";
      applyVuetifyTheme(theme, true);
    };

    return {
      version,
      mode,
      setSystem,
      setLight,
      setDark,
    };
  },
};
</script>

<style scoped>
.theme-rail {
  position: fixed;
  left: max(10px, env(safe-area-inset-left));
  bottom: max(10px, env(safe-area-inset-bottom));
  z-index: 2500;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
  padding: 4px;
  border-radius: 9999px;
  pointer-events: auto;
  /* light app shell */
  background: rgba(15, 23, 42, 0.05);
  color: rgba(15, 23, 42, 0.92);
}

.v-theme--customDarkTheme .theme-rail {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.95);
}

.theme-rail__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 8px;
  border: none;
  border-radius: 9999px;
  background: transparent;
  cursor: pointer;
  color: inherit;
  line-height: 0;
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.theme-rail__btn:hover:not(.theme-rail__btn--checked) {
  background: rgba(15, 23, 42, 0.04);
}

.v-theme--customDarkTheme .theme-rail__btn:hover:not(.theme-rail__btn--checked) {
  background: rgba(255, 255, 255, 0.06);
}

.theme-rail__icon {
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  display: flex !important;
  align-items: center;
  justify-content: center;
  opacity: 0.72;
  transition:
    opacity 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.theme-rail__btn--checked .theme-rail__icon {
  opacity: 1;
}

/* Selected: same full pill as hover (button radius + padding), not a smaller icon circle */
.v-theme--customLightTheme .theme-rail__btn--checked {
  background: #fff;
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.85);
}

.v-theme--customLightTheme .theme-rail__btn--checked .theme-rail__icon {
  color: rgba(15, 23, 42, 0.9) !important;
}

.v-theme--customDarkTheme .theme-rail__btn--checked {
  background: rgb(55, 65, 81);
  box-shadow: none;
}

.v-theme--customDarkTheme .theme-rail__btn--checked .theme-rail__icon {
  color: #fff !important;
}
</style>
