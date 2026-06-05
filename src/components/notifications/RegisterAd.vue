<template>
  <v-card
    flat
    rounded="lg"
    class="mb-4"
    :style="{ border: '1px solid ' + $vuetify.theme.current.colors.accent }"
  >
    <v-card-title class="px-4 py-2 pb-2">
      <span
        class="v-card-title pa-0 d-flex align-center"
        :style="{ color: $vuetify.theme.current.colors.accent }"
      >
        <v-icon
          icon="mdi-sword-cross"
          size="small"
          class="mr-4"
          color="accent"
        ></v-icon>
        Build. Share. Dominate.
      </span>
    </v-card-title>
    <v-card-text class="px-4">
      <div class="text-body-2 text-medium-emphasis">
        Join thousands of AoE4 players — craft and share build orders, bookmark
        your go-to strategies, and discuss tactics with the community.
      </div>
      <div class="d-flex justify-center mt-3">
        <v-btn variant="text" size="small" color="primary" to="/register">
          Create Free Account
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: "RegisterAd",
};
</script>
