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
          icon="mdi-trophy"
          size="small"
          class="mr-4"
          color="accent"
        ></v-icon>
        Season 13 · Live
      </span>
    </v-card-title>
    <v-card-text class="px-4">
      <div class="text-body-2 text-medium-emphasis">
        The new Jin Dynasty civilization is fully supported — start sharing your
        guides.
      </div>
      <div class="d-flex flex-wrap justify-center ga-2 mt-3">
        <a
          href="https://ko-fi.com/jensbuehl"
          target="_blank"
          style="text-decoration: none"
        >
          <v-btn variant="text" size="small" color="primary">
            <template v-slot:prepend>
              <v-icon color="red">mdi-heart</v-icon>
            </template>
            Donate
          </v-btn>
        </a>
        <a
          href="https://discord.gg/Nau9BN5E7J"
          target="_blank"
          style="text-decoration: none"
        >
          <v-btn
            variant="text"
            size="small"
            color="primary"
            prepend-icon="mdi-chat"
          >
            Discord
          </v-btn>
        </a>
        <v-btn
          variant="text"
          size="small"
          color="primary"
          prepend-icon="mdi-github"
          to="/github"
        >
          Contribute
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: "News",
};
</script>
