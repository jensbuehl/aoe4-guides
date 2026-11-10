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
        <!-- Says what players get, not what was wrong: no word about inflated
             counts or how they could be inflated (spec 040). "Per visitor"
             rather than "per person", because that is what one browser is. -->
        <div class="text-body-2 text-medium-emphasis mb-3">
          <v-icon icon="mdi-trending-up" size="x-small" class="mr-1" color="accent"></v-icon>
          <strong>Trending shows what's popular now.</strong> Builds rank by how much they're used
          these days, so new builds can show up within a day and classics people still play come
          back. A view counts once per visitor per day, and authors' own visits don't count.
        </div>

        <div class="text-body-2 text-medium-emphasis">
          <v-icon icon="mdi-cellphone-link" size="x-small" class="mr-1" color="accent"></v-icon>
          <strong>Mobile update.</strong> The site now feels at home on your phone, with a new light
          theme and a long list of fixes.
          <router-link class="text-primary" to="/news">Read more</router-link>
        </div>

        <v-divider class="mt-3"></v-divider>
        <div class="d-flex flex-wrap justify-center ga-2 mt-3">
          <!-- No Donate button here. The funding status card renders directly
               below this one in the sidebar (further down on phones, where this
               card sits under the top banner instead), and a bare ask beside a
               specific "€85 of €240" line makes the specific one read as
               decoration. One ask per page, and it is the one with a number. -->
          <!-- The same route as the Trending lane's "View all" on Home, and the
               lane tab's label. "Trending builds" wrapped Discord onto a second
               row in the 960px sidebar (~240px of content). -->
          <v-btn
            variant="text"
            size="small"
            color="primary"
            prepend-icon="mdi-trending-up"
            :to="{ name: 'Builds', query: { orderBy: 'score' } }"
          >
            Trending
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
import HomeBannerFold from "@/components/home/HomeBannerFold.vue";

// The headline, and also which news this browser has seen: the next item has
// a new title, so it shows in full again without anyone clearing anything —
// the same arrangement as ReleaseBanner's SEEN_KEY.
const TITLE = "A fairer Trending list";
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
  components: { HomeBannerFold },
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

    return { TITLE, expanded };
  },
};
</script>
