<template>
  <v-card rounded="lg" flat class="hidden-md-and-up">
    <v-card-text class="pb-0 mb-4">
      <v-expansion-panels>
        <v-expansion-panel elevation="0">
          <v-expansion-panel-title expand-icon="mdi-filter-variant">
            Sort & Filter
          </v-expansion-panel-title>
          <v-expansion-panel-text class="mt-2">
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
              v-model="selectedVideoCreator"
              prepend-icon="mdi-youtube"
              label="Video Creator"
              density="compact"
              :items="creators"
              item-value="creatorId"
              :item-title="
                (item) =>
                  item.creatorDisplayTitle
                    ? item.creatorDisplayTitle
                    : item.creatorTitle
              "
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
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      <v-expansion-panels>
        <v-expansion-panel elevation="0">
          <v-expansion-panel-title expand-icon="mdi-tune">
            Advanced Filters
          </v-expansion-panel-title>
          <v-expansion-panel-text class="mt-2">
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
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
    <v-divider></v-divider>
    <v-container class="fill-height">
      <v-row align="center" justify="center" class="fill-height">
        <v-col class="d-flex justify-center" cols="6">
          <span v-if="!count">Gathering...</span>
          <span v-if="count">{{ count }} build order</span
          ><span v-if="count > 1">s</span>
        </v-col>
        <v-col class="d-flex justify-center" cols="6">
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
  <v-card rounded="lg" flat class="hidden-sm-and-down">
    <v-card-text class="pb-0 mb-4">
      <v-autocomplete
        class="hidden-xs"
        v-model="selectedCivs"
        label="Civilization"
        density="compact"
        :items="civs"
        item-value="shortName"
        item-title="title"
        clearable
        prepend-icon="mdi-earth"
      ></v-autocomplete>
      <v-select
        class="hidden-sm-and-up"
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
      <v-autocomplete
        class="hidden-xs"
        v-model="selectedVideoCreator"
        prepend-icon="mdi-youtube"
        label="Video Creator"
        density="compact"
        :items="creators"
        item-value="creatorId"
        :item-title="
          (item) =>
            item.creatorDisplayTitle
              ? item.creatorDisplayTitle
              : item.creatorTitle
        "
        clearable
      ></v-autocomplete>
      <v-select
        class="hidden-sm-and-up"
        v-model="selectedVideoCreator"
        prepend-icon="mdi-youtube"
        label="Video Creator"
        density="compact"
        :items="creators"
        item-value="creatorId"
        :item-title="
          (item) =>
            item.creatorDisplayTitle
              ? item.creatorDisplayTitle
              : item.creatorTitle
        "
        clearable
      >
      </v-select>
      <v-autocomplete
        class="hidden-xs"
        v-model="selectedSeasons"
        prepend-icon="mdi-trophy"
        label="Season"
        density="compact"
        :items="seasons"
        item-value="title"
        item-title="title"
        clearable
        multiple
      ></v-autocomplete>
      <v-select
        class="hidden-sm-and-up"
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
      <v-autocomplete
        class="hidden-xs"
        v-model="selectedOrderBy"
        prepend-icon="mdi-sort"
        density="compact"
        label="Order by"
        item-value="id"
        item-title="title"
        :items="sortOptions"
      ></v-autocomplete>
      <v-select
        class="hidden-sm-and-up"
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
      <v-autocomplete
        class="hidden-xs"
        v-if="showAdditionalFilters"
        v-model="selectedMatchups"
        prepend-icon="mdi-sword-cross"
        label="Matchup"
        density="compact"
        :items="matchups"
        item-value="shortName"
        item-title="title"
        clearable
      ></v-autocomplete>
      <v-select
        class="hidden-sm-and-up"
        v-if="showAdditionalFilters"
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
      <v-autocomplete
        class="hidden-xs"
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
      </v-autocomplete>
      <v-select
        class="hidden-sm-and-up"
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
      <v-autocomplete
        class="hidden-xs"
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
      </v-autocomplete>
      <v-select
        class="hidden-sm-and-up"
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
        <v-col class="d-flex justify-center" cols="6" md="12" lg="6">
          <span v-if="!count">Gathering...</span>
          <span v-if="count">{{ count }} build order</span
          ><span v-if="count > 1">s</span>
        </v-col>
        
        <v-col class="d-flex justify-center" cols="6" md="12" lg="6">
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
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import getCivs from "../../composables/filter/getCivs";
import getMaps from "../../composables/filter/getMaps";
import getSeasons from "../../composables/filter/getSeasons";
import getDefaultConfig from "../../composables/filter/getDefaultConfig";
import getStrategies from "../../composables/filter/getStrategies";
import useCollection from "../../composables/useCollection";

export default {
  name: "FilterConfig",
  emits: ["configChanged"],
  setup(props, context) {
    const { getAll } = useCollection("creators");
    const store = useStore();
    const civs = getCivs().civs;
    const matchups = getCivs().civs;
    const maps = getMaps().maps;
    const seasons = getSeasons().seasons;
    const strategies = getStrategies().strategies;
    const creators = ref([]);
    const showAdditionalFilters = ref(false);
    const count = computed(() => store.state.resultsCount);

    onMounted(async () => {
      creators.value = await getAll();
      creators.value.sort(sortByNameCompareFunction);
    });

    const sortByNameCompareFunction = (a, b) => {
      var nameA = getCreatorName(a.creatorId).toUpperCase();
      var nameB = getCreatorName(b.creatorId).toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    };

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

    const getCreatorName = (id) => {
      if (creators.value) {
        const currentCreator = creators.value.find(
          (element) => element.id === id
        );
        if (currentCreator) {
          return currentCreator.creatorDisplayTitle
            ? currentCreator.creatorDisplayTitle
            : currentCreator.creatorTitle;
        }
      } else "";
    };

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

    const selectedVideoCreator = computed({
      get() {
        return getCreatorName(store.state.filterConfig?.creator);
      },
      set(value) {
        store.commit("setCreator", value);
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
      creators,
      strategies,
      selectedCivs,
      selectedMatchups,
      selectedMaps,
      selectedStrategies,
      selectedSeasons,
      selectedOrderBy,
      selectedVideoCreator,
      showAdditionalFilters,
      count,
      handleReset,
      getCreatorName,
    };
  },
};
</script>
