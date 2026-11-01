<template>
  <v-card
    flat
    rounded="lg"
    :class="collapsible ? 'mb-6' : 'mb-4'"
    :style="{ border: '1px solid ' + $vuetify.theme.current.colors.accent }"
  >
    <!-- On phones the header is the same strip as the cards above it, open or
         folded, so the title never changes style when it is tapped; only the
         content beneath comes and goes. See the `collapsible` prop. -->
    <HomeBannerFold
      icon="mdi-alert-decagram"
      :title="TITLE"
      :disclosure="collapsible"
      v-model:expanded="expanded"
    >
      <v-card-title v-if="!collapsible" class="px-4 py-2 pb-2">
        <span class="v-card-title pa-0 d-flex align-center">
          <v-icon icon="mdi-alert-decagram" size="small" class="mr-4" color="primary"></v-icon>
          {{ TITLE }}
        </span>
      </v-card-title>
      <v-card-text :class="collapsible ? 'px-4 pt-0' : 'px-4'">
        <div class="text-body-2 text-medium-emphasis mb-3">
          <v-icon icon="mdi-cellphone-link" size="x-small" class="mr-1" color="accent"></v-icon>
          <strong>Mobile update.</strong> The site now feels at home on your phone, with a new light
          theme and a long list of fixes.
          <router-link class="text-primary" to="/news">Read more</router-link>
        </div>

        <div class="text-body-2 text-medium-emphasis">
          <v-icon icon="mdi-sword-cross" size="x-small" class="mr-1" color="accent"></v-icon>
          <strong>Vikings &amp; Scots.</strong> Both civilizations from <strong>Raiders of the North</strong> are in the build order editor:
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
          <v-icon icon="mdi-heart" size="x-small" class="mr-1" color="red"></v-icon>
          The game data comes from
          <a class="text-primary" href="https://aoe4world.com" target="_blank" rel="noopener">AoE4World</a>.
          Special thanks to <strong>CascadeFury</strong>, who went through the Vikings and Scots data
          ahead of release.
        </div>

        <v-divider class="mt-3"></v-divider>
        <div class="d-flex flex-wrap justify-center ga-2 mt-3">
          <!-- No Donate button here. The funding status card renders directly
               below this one in the sidebar (further down on phones, where this
               card sits under the top banner instead), and a bare ask beside a
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
    </HomeBannerFold>
  </v-card>
</template>

<script>
import { onMounted, ref } from "vue";
import CivFlag from "@/components/common/CivFlag.vue";
import HomeBannerFold from "@/components/home/HomeBannerFold.vue";
import { civPageRoute } from "@/composables/filter/civDefaultProvider";

// The headline, and also which news this browser has seen: the next item has
// a new title, so it shows in full again without anyone clearing anything —
// the same arrangement as ReleaseBanner's SEEN_KEY.
const TITLE = "New civs & a mobile update";
const SEEN_KEY = "aoe4guides.newsSeen";

// Decided once per page load, not per mount, for the reason ReleaseBanner
// gives at length: Home remounts on every Back, and a card that folded between
// two mounts would move everything under it, so the router's saved scroll
// position lands the reader hundreds of pixels off. `expanded` is kept the same
// way, so Back restores an opened card open.
let seenThisLoad = null;
const expanded = ref(false);

export default {
  name: "News",
  components: { CivFlag, HomeBannerFold },
  props: {
    // A strip header that opens and closes the card, open on the first visit
    // and folded once this news has been seen. Only the phone
    // instance asks for it: there the card sits above the civ picker, and a
    // returning reader should not scroll past a trailer they have watched to
    // reach it. In the desktop sidebar it costs the fold nothing.
    collapsible: { type: Boolean, default: false },
  },
  setup() {
    // Read before the first render, so the page paints in its final form.
    // Unreadable storage means nothing is ever "seen": the card shows in full.
    if (seenThisLoad === null) {
      seenThisLoad = false;
      try {
        seenThisLoad = localStorage.getItem(SEEN_KEY) === TITLE;
      } catch {
        // Show it in full.
      }
      // Open on the first visit, folded on later ones. Set only here, once per
      // load, so a Back keeps whatever the reader last chose.
      expanded.value = !seenThisLoad;
    }

    // Shown, so seen — in either instance, at any width. Takes effect on the
    // next page load (see seenThisLoad).
    onMounted(() => {
      try {
        localStorage.setItem(SEEN_KEY, TITLE);
      } catch {
        // Unwritable storage: the next visit shows it in full again.
      }
    });

    return { TITLE, civPageRoute, expanded };
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
