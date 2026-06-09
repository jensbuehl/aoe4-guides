<template>
  <v-app id="inspire">
    <Header></Header>
    <v-main class="mt-2 mx-md-2" id="main-content">
      <Snackbar />
      <AuthDialog />
      <BuildImportDialog v-model="importOpen" />
      <router-view :key="$route.path" />
    </v-main>
    <v-fab
      v-if="route.meta.showFab"
      class="hidden-md-and-up"
      icon="mdi-plus"
      color="primary"
      size="large"
      elevation="8"
      location="bottom end"
      app
      to="/builds/new"
    />
    <Footer></Footer>
  </v-app>
</template>

<script>
//External
import { computed, onBeforeMount, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import { auth } from "@/firebase";

//Components
import Header from "@/components/Header.vue";
import Footer from "@/components/Footer.vue";
import Snackbar from "@/components/notifications/Snackbar.vue";
import AuthDialog from "@/components/account/AuthDialog.vue";
import BuildImportDialog from "@/components/builds/BuildImportDialog.vue";

//Composables
import { useTheme } from "vuetify";
import {
  getSavedTheme,
  applyVuetifyTheme,
  THEME_STORAGE_KEY,
} from "@/composables/useThemePreference";

export default {
  name: "App",
  components: { Header, Footer, Snackbar, AuthDialog, BuildImportDialog },
  setup() {
    const route = useRoute();
    const store = useStore();
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
        root.style.setProperty('--color-background-soft', '#E9EBEE');
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

      // Initial sync — remove no-transition after colors are set so the 0.5s
      // body transition doesn't animate the Vuetify-to-override color change on load
      updateRootCSSVariables(theme.global.name.value === "customDarkTheme");
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('no-transition');
      });

      // Watch for theme changes
      watch(() => theme.global.name.value, (newTheme) => {
        updateRootCSSVariables(newTheme === "customDarkTheme");
      });
    });

    const importOpen = computed({
      get: () => store.state.ui.importDialog.open,
      set: (v) => store.commit("setImportDialog", v),
    });

    // When the user clicks the verification link in their email and switches
    // back to this tab, reload the Firebase auth token so emailVerified
    // updates immediately without requiring a full page refresh.
    const onVisibilityChange = async () => {
      if (document.visibilityState === "visible" && auth.currentUser && !store.state.user?.emailVerified) {
        await auth.currentUser.reload();
        store.commit("setUser", auth.currentUser.toJSON());
      }
    };
    onMounted(() => document.addEventListener("visibilitychange", onVisibilityChange));
    onBeforeUnmount(() => document.removeEventListener("visibilitychange", onVisibilityChange));

    return { route, importOpen };
  },
};
</script>
<style>
.v-tooltip .v-overlay__content {
  background: rgba(var(--v-theme-surface-variant), 0.9) !important;
}
</style>
