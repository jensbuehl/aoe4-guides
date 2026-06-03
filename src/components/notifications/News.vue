<template>
  <v-card
    flat
    rounded="lg"
    class="mb-4"
    :style="{ border: '1px solid ' + $vuetify.theme.current.colors.accent }"
  >
    <v-card-text class="pa-4">
      <div class="text-caption font-weight-bold mb-1" :style="{ color: $vuetify.theme.current.colors.accent }">
        Season 13 · Live
      </div>
      <div class="text-h6 font-weight-bold mb-1">Yue Fei's Legacy</div>
      <div class="text-body-2 text-medium-emphasis">
        The new Jin Dynasty civilization is fully supported — start sharing your guides.
      </div>
      <div class="d-flex flex-wrap justify-center ga-2 mt-3">
        <a href="https://ko-fi.com/jensbuehl" target="_blank" style="text-decoration:none">
          <v-btn variant="text" size="small" color="primary">
            <template v-slot:prepend>
              <v-icon color="red">mdi-heart</v-icon>
            </template>
            Donate
          </v-btn>
        </a>
        <a href="https://discord.gg/Nau9BN5E7J" target="_blank" style="text-decoration:none">
          <v-btn variant="text" size="small" color="primary" prepend-icon="mdi-chat">
            Discord
          </v-btn>
        </a>
        <v-btn variant="text" size="small" color="primary" prepend-icon="mdi-github" to="/github">
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
