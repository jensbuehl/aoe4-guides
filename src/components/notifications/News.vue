<template>
  <v-card
    flat
    rounded="lg"
    class="mb-4"
    :style="{ border: '1px solid ' + $vuetify.theme.current.colors.accent }"
  >
    <v-card-title class="px-4 py-2 pb-2">
      <span class="v-card-title pa-0 d-flex align-center">
        <v-icon
          icon="mdi-picture-in-picture-bottom-right"
          size="small"
          class="mr-4"
          color="primary"
        ></v-icon>
        Build Order Overlay
      </span>
    </v-card-title>
    <v-card-text class="px-4">
      <div class="text-body-2 text-medium-emphasis">
        Your build order, always on top. <strong>Play > Floating window</strong> opens the
        current build in focus mode that floats above the game.
      </div>

      <!-- Vertical short, capped: the sidebar is a quarter of the page, and a
           9:16 video at full column width would be taller than the card it is
           announcing. Lazy so the home page does not pay for YouTube's player
           on every visit, and the no-cookie host so watching it here does not
           follow anyone around. -->
      <div class="news-short mx-auto mt-3">
        <iframe
          src="https://www.youtube-nocookie.com/embed/iQwBrcphC5E"
          title="Floating window on AOE4 Guides"
          loading="lazy"
          frameborder="0"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>

      <div class="text-body-2 text-medium-emphasis mt-3">
        Chrome and Edge for now. The RTS Overlay export is untouched if you would rather keep using
        that.
      </div>

      <div class="text-body-2 text-medium-emphasis mt-2">
        <v-icon icon="mdi-chart-line" size="x-small" class="mr-1" color="accent"></v-icon>
        <strong>Build timeline.</strong> Ages on a track, so you can see when a build reaches Feudal,
        Castle and Imperial. Expand <strong>Economy</strong> to see where its villagers go.
      </div>

      <v-divider class="mt-3"></v-divider>
      <div class="d-flex flex-wrap justify-center ga-2 mt-3">
        <!-- No Donate button here. The funding status card renders directly
             below this one in the same sidebar, and a bare ask beside a
             specific "€85 of €240" line makes the specific one read as
             decoration. One ask per page, and it is the one with a number. -->
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

<style scoped>
.news-short {
  width: 100%;
  max-width: 240px;
  aspect-ratio: 9 / 16;
  border-radius: 8px;
  overflow: hidden;
}

.news-short iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
