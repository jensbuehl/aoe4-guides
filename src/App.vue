<template>
  <v-app id="inspire">
    <Header></Header>
    <v-main class="mt-2 mx-md-2" id="main-content">
      <Snackbar />
      <router-view />
    </v-main>
    <Footer></Footer>
  </v-app>
</template>

<script>
//External
import { onBeforeMount, watch } from "vue";

//Components
import Header from "@/components/Header.vue";
import Footer from "@/components/Footer.vue";
import Snackbar from "@/components/notifications/Snackbar.vue";

//Composables
import { useTheme } from "vuetify";
import {
  getSavedTheme,
  applyVuetifyTheme,
  THEME_STORAGE_KEY,
} from "@/composables/useThemePreference";

export default {
  name: "App",
  components: { Header, Footer, Snackbar },
  setup() {
    const theme = useTheme();
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const updateRootCSSVariables = (isDark) => {
      const root = document.documentElement;
      if (isDark) {
        root.style.setProperty('--color-background', '#161A25');
        root.style.setProperty('--color-background-soft', '#161A25');
        root.style.setProperty('--color-background-mute', '#161A25');
      } else {
        root.style.setProperty('--color-background', '#E9EBEE');
        root.style.setProperty('--color-background-soft', '#F5F5F5');
        root.style.setProperty('--color-background-mute', '#E9EBEE');
      }
    };

    onBeforeMount(() => {
      const applyIfSystem = () => {
        if (localStorage.getItem(THEME_STORAGE_KEY) != null) return;
        applyVuetifyTheme(theme, media.matches);
      };
      media.addEventListener("change", applyIfSystem);

      const saved = getSavedTheme();
      if (saved === "light") applyVuetifyTheme(theme, false);
      else if (saved === "dark") applyVuetifyTheme(theme, true);
      else applyVuetifyTheme(theme, media.matches);

      // Initial sync
      updateRootCSSVariables(theme.global.name.value === "customDarkTheme");

      // Watch for theme changes
      watch(() => theme.global.name.value, (newTheme) => {
        updateRootCSSVariables(newTheme === "customDarkTheme");
      });
    });

    return {};
  },
};
</script>
<style>
.v-tooltip .v-overlay__content {
  background: rgba(var(--v-theme-surface-variant), 0.9) !important;
}
</style>
