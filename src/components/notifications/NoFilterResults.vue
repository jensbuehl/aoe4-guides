<template>
  <v-card flat rounded="lg" class="pa-6 text-center">
    <!-- Nothing to clear: the civ simply has no builds yet, which is the state
         of every new civ on release day. Ask for the first one instead. -->
    <template v-if="unfiltered">
      <v-icon size="48" class="nfr-icon mb-3">mdi-playlist-edit</v-icon>
      <div class="nfr-text mb-3">No {{ civName }} build orders yet. Be the first to write one.</div>
      <v-btn
        variant="plain"
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
      <v-btn variant="plain" color="primary" @click="clearFilters">Clear filters</v-btn>
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
  },
  emits: ["cleared"],
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

    return { unfiltered, clearFilters };
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
</style>
