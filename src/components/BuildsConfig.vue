<template>
  <v-card rounded="lg">
    <v-card-text class="pb-0 mb-4">
      <v-select
        v-model="selectedCivs"
        label="Civilization"
        density="compact"
        :items="civs"
        item-value="shortName"
        item-title="title"
        clearable
        prepend-icon="mdi-earth"
      >
      </v-select>
      <v-select
        v-model="selectedMatchups"
        prepend-icon="mdi-sword-cross"
        label="Matchup"
        density="compact"
        :items="matchups"
        item-value="shortName"
        item-title="title"
        clearable
      >
      </v-select>
      <v-select
        v-model="selectedSeasons"
        prepend-icon="mdi-trophy"
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
        v-model="selectedOrderBy"
        prepend-icon="mdi-sort"
        density="compact"
        label="Order by"
        item-value="id"
        item-title="title"
        :items="sortOptions"
      ></v-select>
      <v-btn
        v-show="!showAdditionalFilters"
        variant="plain"
        block
        append-icon="mdi-menu-down"
        @click="showAdditionalFilters = true"
        >More Filter Options</v-btn
      >
      <v-btn
        v-show="showAdditionalFilters"
        variant="plain"
        block
        class="mb-4"
        append-icon="mdi-menu-up"
        @click="showAdditionalFilters = false"
        >Hide Filter Options</v-btn
      >
      <v-select
        v-if="showAdditionalFilters"
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
        v-if="showAdditionalFilters"
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
    </v-card-text>
    <v-divider></v-divider>
      <v-container class="fill-height">
      <v-row align="center" justify="center" class="fill-height">
        <v-col class="d-flex justify-center" cols="12" lg="6">
          <v-label>{{count}} build order</v-label><v-label v-if="count > 1 || count == 0" >s</v-label>
        </v-col>
        <v-col class="d-flex justify-center" cols="12" lg="6">
          <v-btn
            color="primary"
            prepend-icon="mdi-close"
            variant="text"
            flat
            @click="handleReset"
            >Reset Filters</v-btn
          ></v-col
        >
      </v-row>
    </v-container>
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
    const matchups = getCivs().civs;
    const maps = getMaps().maps;
    const seasons = getSeasons().seasons;
    const strategies = getStrategies().strategies;
    const showAdditionalFilters = ref(false);
    const count = computed(() => store.state.resultsCount);

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

    const selectedMatchups = computed({
      get() {
        return store.state.filterConfig?.matchups;
      },
      set(value) {
        store.commit("setMatchups", value);
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
      matchups,
      maps,
      seasons,
      strategies,
      selectedCivs,
      selectedMatchups,
      selectedMaps,
      selectedStrategies,
      selectedSeasons,
      selectedOrderBy,
      showAdditionalFilters,
      count,
      handleReset,
    };
  },
};
</script>
