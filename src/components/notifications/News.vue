<template>
  <v-card
    flat
    rounded="lg"
    class="mb-4"
    :style="{ border: '1px solid ' + $vuetify.theme.current.colors.accent }"
  >
    <v-card-title class="px-4 py-2 pb-2">
      <span class="v-card-title pa-0 d-flex align-center">
        <v-icon icon="mdi-alert-decagram" size="small" class="mr-4" color="primary"></v-icon>
        Vikings &amp; Scots
      </span>
    </v-card-title>
    <v-card-text class="px-4">
      <div class="text-body-2 text-medium-emphasis">
        Both civilizations from <strong>Raiders of the North</strong> are in the build order editor:
        every unit, building, technology, landmark and ability, with icons, costs and descriptions.
      </div>

      <!-- The official trailer, 16:9 at column width. Lazy so the home page
           does not pay for YouTube's player on every visit, and the no-cookie
           host so watching it here does not follow anyone around. -->
      <div class="news-video mt-3">
        <iframe
          src="https://www.youtube-nocookie.com/embed/7NPJPZX896Y"
          title="Age of Empires IV: Raiders of the North trailer"
          loading="lazy"
          frameborder="0"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>

      <div class="text-body-2 text-medium-emphasis mt-3">
        <v-icon icon="mdi-sword-cross" size="x-small" class="mr-1" color="accent"></v-icon>
        <strong>Also new.</strong> The icon picker groups military units by kind, with siege and
        ships last, civ menus show each flag, and hovering a season shows when it ran.
      </div>

      <div class="text-body-2 text-medium-emphasis mt-2">
        <v-icon icon="mdi-heart" size="x-small" class="mr-1" color="red"></v-icon>
        The game data comes from
        <a class="text-primary" href="https://aoe4world.com" target="_blank" rel="noopener">AoE4World</a>.
        Special thanks to <strong>CascadeFury</strong>, who went through the Vikings and Scots data
        ahead of release.
      </div>

      <v-divider class="mt-3"></v-divider>
      <div class="d-flex flex-wrap justify-center ga-2 mt-3">
        <!-- No Donate button here. The funding status card renders directly
             below this one in the same sidebar, and a bare ask beside a
             specific "€85 of €240" line makes the specific one read as
             decoration. One ask per page, and it is the one with a number. -->
        <v-btn
          v-for="civ in ['VIK', 'SCO']"
          :key="civ"
          variant="text"
          size="small"
          color="primary"
          :to="civPageRoute(civ)"
        >
          <template #prepend><CivFlag :civ="civ" /></template>
          {{ civ === "VIK" ? "Vikings" : "Scots" }}
        </v-btn>
        <a href="https://discord.gg/Nau9BN5E7J" target="_blank" style="text-decoration: none">
          <v-btn variant="text" size="small" color="primary" prepend-icon="mdi-chat">
            Discord
          </v-btn>
        </a>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import CivFlag from "@/components/common/CivFlag.vue";
import { civPageRoute } from "@/composables/filter/civDefaultProvider";

export default {
  name: "News",
  components: { CivFlag },
  setup() {
    return { civPageRoute };
  },
};
</script>

<style scoped>
.news-video {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
}

.news-video iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
