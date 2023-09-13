<template>
  <v-app id="inspire">
    <Header></Header>
    <v-main class="mt-md-2 mx-md-2" id="main-content">
      <VLayoutItem model-value position="bottom" class="text-end" size="88">
        <div class="ma-4">
          <v-tooltip>
            <span
              :style="{
                color: $vuetify.theme.current.colors.primary,
              }"
              >Create new build order from scratch</span
            >
            <template v-slot:activator="{ props }">
              <v-btn class="hidden-md-and-up"
                :style="'color: ' + $vuetify.theme.current.colors.primary"
                to="/new"
                v-bind="props"
                icon="mdi-plus"
                size="large"
                color="primary"
                elevation="8"
              />
            </template>
          </v-tooltip>
        </div>
      </VLayoutItem>
      <router-view />
    </v-main>
    <Footer></Footer>
  </v-app>
</template>

<script>
import Header from "./components/Header.vue";
import Footer from "./components/Footer.vue";
import { onBeforeMount } from "vue";
import { useVuetify } from "./composables/useVuetify";

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
