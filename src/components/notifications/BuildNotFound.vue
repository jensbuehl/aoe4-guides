<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1">
    <v-card flat rounded="lg">
      <v-card-title>Build Order Not Found</v-card-title>
      <v-card-text
        >The requested build order was not found.<br />
        Please make sure the build order exists or create a new Age of Empires 4
        build order.</v-card-text
      >

      <v-row class="ma-2" no-gutters justify="center">
        <v-btn
          color="primary"
          style="background-color: transparent"
          variant="text"
          to="/"
        >
          Home
        </v-btn>
        <v-btn
          color="primary"
          style="background-color: transparent"
          variant="text"
          to="/new"
        >
          Create New Build Order
        </v-btn>
      </v-row>
    </v-card></v-alert
  >
</template>

<script>
export default {
  name: "BuildNotFound",
  setup() {},
};
</script>
