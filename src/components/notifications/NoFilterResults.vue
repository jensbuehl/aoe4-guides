<template>
  <v-card flat rounded="lg" class="pa-6 text-center">
    <!-- Nothing to clear either: the user has not hearted anything yet, so the
         filters are not what hides the list. Say where a heart comes from. -->
    <template v-if="favorites === 'none'">
      <v-icon size="48" class="nfr-icon mb-3">mdi-heart-outline</v-icon>
      <div class="nfr-text mb-3">No favorites yet. Heart a build order to keep it here.</div>
      <v-btn variant="text" color="primary" :to="{ name: 'Builds' }">Browse build orders</v-btn>
    </template>
    <!-- The favorites could not be read (App Check, offline). Not "no
         favorites": that would tell someone with thirty that they have none. -->
    <template v-else-if="favorites === 'unreadable'">
      <v-icon size="48" class="nfr-icon mb-3">mdi-alert-circle-outline</v-icon>
      <div class="nfr-text mb-1">Your favorites could not be loaded.</div>
      <!-- The read swallows its error code, so both likely causes are named;
           the blocker wording is the save path's (collectionService's
           toUserMessage), since the same check refuses both. -->
      <div class="nfr-text nfr-hint mb-3">
        Check your internet connection. If that is fine, disable any ad blocker, tracker blocker,
        or privacy shield for this site — they can block our bot-protection check.
      </div>
      <v-btn variant="text" color="primary" prepend-icon="mdi-refresh" :loading="retrying" @click="$emit('retry')">
        Try again
      </v-btn>
    </template>
    <!-- My Builds with nothing written yet, filters untouched: not a filter
         problem but a first build. Both ways of adding one, since a phone has
         no Add Build menu to offer Import from. -->
    <template v-else-if="mine === 'none'">
      <v-icon size="48" class="nfr-icon mb-3">mdi-playlist-edit</v-icon>
      <div class="nfr-text mb-3">You haven't written a build order yet.</div>
      <div class="d-flex flex-wrap justify-center ga-2">
        <v-btn variant="text" color="primary" prepend-icon="mdi-plus" :to="{ name: 'BuildNew' }">
          Create build order
        </v-btn>
        <v-btn variant="text" color="primary" prepend-icon="mdi-tray-arrow-down" @click="openImportDialog">
          Import build order
        </v-btn>
      </div>
    </template>
    <!-- Nothing to clear: the civ simply has no builds yet, which is the state
         of every new civ on release day. Ask for the first one instead. -->
    <template v-else-if="unfiltered">
      <v-icon size="48" class="nfr-icon mb-3">mdi-playlist-edit</v-icon>
      <div class="nfr-text mb-3">No {{ civName }} build orders yet. Be the first to write one.</div>
      <v-btn
        variant="text"
        color="primary"
        prepend-icon="mdi-plus"
        :to="{ name: 'BuildNew', query: { civ } }"
      >
        Create build order
      </v-btn>
    </template>
    <template v-else>
      <v-icon size="48" class="nfr-icon mb-3">mdi-magnify-close</v-icon>
      <div class="nfr-text mb-3">No builds match these filters.</div>
      <v-btn variant="text" color="primary" @click="clearFilters">Clear filters</v-btn>
    </template>
  </v-card>
</template>

<script>
import { computed } from "vue";
import { useStore } from "vuex";
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";

export default {
  name: "NoFilterResults",
  props: {
    // Set by a civ page, whose civ is the page rather than a filter. Without
    // it the empty state always means the filters, as on every other list.
    civ: { type: String, default: null },
    civName: { type: String, default: null },
    // Set by My Favorites when the list is empty before any filter applies:
    // "none" (nothing hearted) or "unreadable" (the read failed).
    favorites: { type: String, default: null },
    // While the read behind "Try again" is out, so a second failure reads as
    // a new attempt rather than a button that did nothing.
    retrying: { type: Boolean, default: false },
    // Set by My Builds, the same way: "none" when nothing is written yet.
    mine: { type: String, default: null },
  },
  emits: ["cleared", "retry"],
  setup(props, { emit }) {
    const store = useStore();

    // The sort order is left out on purpose: it reorders, it never hides.
    const unfiltered = computed(() => {
      if (!props.civ) return false;
      const cfg = store.state.filterConfig;
      const def = getDefaultConfig();
      return (
        cfg?.creator == null &&
        cfg?.author == def.author &&
        JSON.stringify(cfg?.maps) === JSON.stringify(def.maps) &&
        JSON.stringify(cfg?.strategies) === JSON.stringify(def.strategies) &&
        JSON.stringify(cfg?.seasons) === JSON.stringify(def.seasons)
      );
    });

    const clearFilters = () => {
      store.commit("setFilterConfig", getDefaultConfig());
      store.commit("setAllBuildsList", null);
      store.commit("setMyBuildsList", null);
      store.commit("setMyFavoritesList", null);
      emit("cleared");
    };

    const openImportDialog = () => store.dispatch("openImportDialog");

    return { unfiltered, clearFilters, openImportDialog };
  },
};
</script>

<style scoped>

.nfr-icon {
  color: rgba(var(--v-theme-on-surface), 0.3);
}

.nfr-text {
  font-size: 14px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* Secondary to the line above it, and kept to a readable measure on desktop */
.nfr-hint {
  font-size: 13px;
  max-width: 420px;
  margin-inline: auto;
}

/* Every action here is the one thing to do next, so it is a 44px target on
   any pointer. The buttons are `text`, not `plain`, for the same reason:
   plain sits at 0.62 opacity until hovered, which a touch screen never does,
   and gives no press feedback — text is full strength and ripples. Scoped, so
   this reaches each v-btn's root here and nothing outside the card. */
.v-btn {
  min-height: 44px;
}
</style>
