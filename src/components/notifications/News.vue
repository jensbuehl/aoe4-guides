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
          icon="mdi-share-variant"
          size="small"
          class="mr-4"
          color="accent"
        ></v-icon>
        Share &amp; Remix
      </span>
    </v-card-title>
    <v-card-text class="px-4">
      <div class="text-body-2 text-medium-emphasis">
        Every build now has a <strong>Share</strong> option in the ⋮ menu. Scan the QR code with
        your phone and the build opens in focus mode — a second screen next to your monitor, no
        URL to type.
      </div>
      <div class="text-body-2 text-medium-emphasis mt-2">
        <v-icon icon="mdi-shuffle-variant" size="x-small" class="mr-1" color="accent"></v-icon>
        <strong>Remix, don't duplicate.</strong>
        Building on someone else's opening now credits them — your copy links straight back to the
        original in the header.
      </div>
      <div class="text-body-2 text-medium-emphasis mt-2">
        <v-icon icon="mdi-monitor" size="x-small" class="mr-1" color="accent"></v-icon>
        <strong>Focus mode stays awake.</strong> Your screen no longer dims mid-build, and the home
        page loads noticeably faster.
      </div>
      <v-divider class="mt-3"></v-divider>
      <div class="text-body-2 text-medium-emphasis mt-3">
        <v-icon icon="mdi-heart" size="x-small" class="mr-1" color="accent"></v-icon>
        <strong>Thanks to our open-source contributors.</strong> The code lives on GitHub, and
        every issue and pull request makes this site better.
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
