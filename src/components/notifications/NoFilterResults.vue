<template>
  <v-card flat rounded="lg" class="pa-6 text-center">
    <v-icon size="48" class="nfr-icon mb-3">mdi-magnify-close</v-icon>
    <div class="nfr-text mb-3">No builds match these filters.</div>
    <v-btn variant="plain" color="primary" @click="clearFilters">Clear filters</v-btn>
  </v-card>
</template>

<script>
import { useStore } from "vuex";
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";

export default {
  name: "NoFilterResults",
  emits: ["cleared"],
  setup(_, { emit }) {
    const store = useStore();

    const clearFilters = () => {
      store.commit("setFilterConfig", getDefaultConfig());
      store.commit("setAllBuildsList", null);
      store.commit("setMyBuildsList", null);
      store.commit("setMyFavoritesList", null);
      emit("cleared");
    };

    return { clearFilters };
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
