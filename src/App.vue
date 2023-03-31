<script setup>
import Header from "./components/Header.vue";
import Footer from "./components/Footer.vue"
</script>

<template>
  <v-app id="inspire">
    <Header></Header>
    <v-main class="mt-md-2 mx-md-2">
      <router-view />
    </v-main>
    <Footer></Footer>
  </v-app>
</template>
