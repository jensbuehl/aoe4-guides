<template>
  <v-app id="inspire">
    <Header></Header>
    <v-main class="mt-md-2 mx-md-2">
      <router-view />
    </v-main>
    <Footer></Footer>
  </v-app>
</template>

<script>
import Header from "./components/Header.vue";
import Footer from "./components/Footer.vue"
import { onBeforeMount } from "vue";
import { useVuetify } from "./composables/useVuetify"

export default {
  name: "App",
  components: { Header, Footer},
  setup() {
    onBeforeMount(() => {
      const vuetify = useVuetify();
      console.log(vuetify)

      if(window.matchMedia('(prefers-color-scheme: light)').matches) {
        vuetify.theme.global.name = "customLightTheme";
      }
    })
  },
};
</script>
