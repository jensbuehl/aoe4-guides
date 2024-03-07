<template>
  <v-container>
    <v-alert rounded="lg" outlined color="accent" class="pa-1">
      <v-card flat rounded="lg" align="center">
        <v-card-title>404</v-card-title>
        <v-card-text>Page not found<br /> </v-card-text>

        <v-row class="ma-2" no-gutters justify="center">
          <v-btn
            color="primary"
            style="background-color: transparent"
            variant="text"
            to="/"
          >
            Home
          </v-btn>
        </v-row>
      </v-card></v-alert
    >
  </v-container>
</template>

<script>
export default {
  name: "BuildNotFound",
  setup() {},
};
</script>
