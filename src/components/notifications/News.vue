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
        <!-- Spec 043. Where to find it in each layout, because it lives in a
             different place on a phone (bottom bar) than on a desktop (header). -->
        <div class="text-body-2 text-medium-emphasis mb-3">
          <v-icon icon="mdi-magnify" size="x-small" class="mr-1" color="accent"></v-icon>
          <strong>Search is here.</strong> Find any build by title, author or civ from every page:
          the search box at the top, Search in your phone's bottom bar, or Ctrl K. Results show
          Feudal and Castle times.
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
          <!-- Opens the header's search rather than a page of its own. One word:
               a longer label wrapped Discord onto a second row in the 960px
               sidebar (~240px of content), as "Trending builds" once did. -->
          <v-btn variant="text" size="small" color="primary" prepend-icon="mdi-magnify" @click="requestSearch">
            Search
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
import { requestSearch } from "@/components/Header.vue";

// The headline, and also which news this browser has seen: the next item has
// a new title, so it shows in full again without anyone clearing anything —
// the same arrangement as ReleaseBanner's SEEN_KEY.
const TITLE = "Search builds";
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

    return { TITLE, expanded, requestSearch };
  },
};
</script>
