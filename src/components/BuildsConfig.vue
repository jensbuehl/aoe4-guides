<template>
  <v-card rounded="lg">
    <v-card-text>
      <v-select
        v-model="selectedCivs"
        prepend-icon="mdi-earth"
        label="Civilization"
        density="compact"
        :items="civs"
        item-value="shortName"
        item-title="title"
        clearable
        multiple
      >
      </v-select>
      <v-select
        v-model="selectedSeasons"
        prepend-icon="mdi-update"
        label="Season"
        density="compact"
        :items="seasons"
        item-value="title"
        item-title="title"
        clearable
        multiple
      >
      </v-select>
      <v-select
        v-model="selectedMaps"
        prepend-icon="mdi-map"
        label="Map"
        density="compact"
        :items="maps"
        item-value="title"
        item-title="title"
        clearable
        multiple
      >
      </v-select>
      <v-select
        v-model="selectedStrategies"
        prepend-icon="mdi-strategy"
        label="Strategy"
        density="compact"
        :items="strategies"
        item-value="title"
        item-title="title"
        clearable
        multiple
      >
      </v-select>
      <v-select
        v-model="selectedOrderBy"
        prepend-icon="mdi-sort"
        density="compact"
        label="Order by"
        item-value="id"
        item-title="title"
        :items="sortOptions"
      ></v-select>
    </v-card-text>
    <v-card-actions class="justify-center">
      <v-btn color="primary" prepend-icon="mdi-close" flat @click="handleReset"
        >Reset Filters</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import { ref, watch, computed, onMounted } from "vue";
import { useStore } from "vuex";
import getCivs from "../composables/getCivs";
import getMaps from "../composables/getMaps";
import getSeasons from "../composables/getSeasons";
import getDefaultConfig from "../composables/getDefaultConfig";
import getStrategies from "../composables/getStrategies";

export default {
  name: "BuildsConfig",
  setup(props, context) {
    const store = useStore();
    const civs = getCivs().civs;
    const maps = getMaps().maps;
    const seasons = getSeasons().seasons;
    const strategies = getStrategies().strategies;
    const sortOptions = ref([
      {
        title: "Popularity",
        id: "score",
      },
      {
        title: "Time Created",
        id: "timeCreated",
      },
      {
        title: "Views",
        id: "views",
      },
      {
        title: "Favorites",
        id: "likes",
      },
      {
        title: "Title",
        id: "sortTitle",
      },
    ]);

    const selectedCivs = computed({
      get() {
        return store.state.filterConfig?.civs;
      },
      set(value) {
        store.commit("setCivs", value);
        context.emit("configChanged");
      },
    });

    const selectedMaps = computed({
      get() {
        return store.state.filterConfig?.maps;
      },
      set(value) {
        store.commit("setMaps", value);
        context.emit("configChanged");
      },
    });

    const selectedStrategies = computed({
      get() {
        return store.state.filterConfig?.strategies;
      },
      set(value) {
        store.commit("setStrategies", value);
        context.emit("configChanged");
      },
    });

    const selectedSeasons = computed({
      get() {
        return store.state.filterConfig?.seasons;
      },
      set(value) {
        store.commit("setSeasons", value);
        context.emit("configChanged");

      },
    });

    const selectedOrderBy = computed({
      get() {
        return store.state.filterConfig?.orderBy;
      },
      set(value) {
        store.commit("setOrderBy", value);
        context.emit("configChanged");
      },
    });

    const handleReset = () => {
      store.commit("setFilterConfig", getDefaultConfig());
      context.emit("configChanged");
    };

    return {
      sortOptions,
      civs,
      maps,
      seasons,
      strategies,
      selectedCivs,
      selectedMaps,
      selectedStrategies,
      selectedSeasons,
      selectedOrderBy,
      handleReset,
    };
  },
};
</script>
