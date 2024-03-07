<template>
  <v-app id="inspire">
    <Header></Header>
    <v-main class="mt-2 mx-md-2" id="main-content">
      <router-view />
    </v-main>
    <Footer></Footer>
  </v-app>
</template>

<script>
//External
import { onBeforeMount } from "vue";

//Components
import Header from "@/components/Header.vue";
import Footer from "@/components/Footer.vue";

//Composables
import { useVuetify } from "@/composables/useVuetify";

export default {
  name: "App",
  components: { Header, Footer },
  setup() {
    onBeforeMount(() => {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", ({ matches }) => {
          if (matches) {
            vuetify.theme.global.name = "customDarkTheme";
          } else {
            vuetify.theme.global.name = "customLightTheme";
          }
        });

      const vuetify = useVuetify();

      if (window.matchMedia("(prefers-color-scheme: light)").matches) {
        vuetify.theme.global.name = "customLightTheme";
      }
    });
  },
};
</script>
<style>
.v-tooltip .v-overlay__content {
  background: rgba(var(--v-theme-surface-variant), 0.9) !important;
}
</style>
