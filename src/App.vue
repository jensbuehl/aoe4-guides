<script setup>
import AppBar from "./components/AppBar.vue";
import Footer from "./components/Footer.vue"
</script>

<template>
  <v-app id="inspire">
    <AppBar></AppBar>
    <v-main>
      <router-view />
    </v-main>
    <Footer></Footer>
  </v-app>
</template>
