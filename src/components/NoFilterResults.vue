<template>
  <v-alert
    rounded="lg"
    outlined
    color="accent"
    class="pa-1"
  >
    <v-card flat rounded="lg">
      <v-card-title>No Build Orders Found</v-card-title>
      <v-card-text
        >No build order for the given filter available.<br>
        Please update the filter or create a new Age of Empires 4 build order.</v-card-text
      >

      <v-row class="ma-2" no-gutters justify="center">
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
  setup() {
  },
};
</script>
