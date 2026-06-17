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
          icon="mdi-sync"
          size="small"
          class="mr-4"
          color="accent"
        ></v-icon>
        Icon Library Update
      </span>
    </v-card-title>
    <v-card-text class="px-4">
      <div class="text-body-2 text-medium-emphasis">
        The full icon library has been synced with
        AOE4World's latest data. All icons now carry accurate descriptions, resource costs, and
        a direct link back to the explorer.
      </div>
      <div class="text-body-2 text-medium-emphasis mt-2">
        <v-icon icon="mdi-star-outline" size="x-small" class="mr-1" color="accent"></v-icon>
        <strong>Abilities are here.</strong>
        A large set of unit and hero abilities is now available as build-order icons.
      </div>
      <div class="text-body-2 text-medium-emphasis mt-2">
        <v-icon icon="mdi-trophy" size="x-small" class="mr-1" color="accent"></v-icon>
        <strong>Season 13</strong> Jin Dynasty fully supported. But are you ready for the Vikings?
      </div>
      <div class="d-flex flex-wrap justify-center ga-2 mt-3">
        <a
          href="https://aoe4world.com"
          target="_blank"
          style="text-decoration: none"
        >
          <v-btn variant="text" size="small" color="primary" prepend-icon="mdi-earth">
            AOE4World
          </v-btn>
        </a>
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
