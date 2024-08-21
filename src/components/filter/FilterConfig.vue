<template>
  <v-card rounded="lg" flat class="hidden-md-and-up">
    <v-card-text class="mb-md-4">
      <v-expansion-panels>
        <v-expansion-panel elevation="0">
          <v-expansion-panel-title expand-icon="mdi-filter-variant">
            Filter
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
              v-model="selectedOrderBy"
              prepend-icon="mdi-sort"
              density="compact"
              label="Order by"
              item-value="id"
              item-title="title"
              :items="sortOptions"
            ></v-select>
            <v-select
              v-model="selectedVideoCreator"
              prepend-icon="mdi-youtube"
              label="Video Creator"
              density="compact"
              :items="creators"
              item-value="creatorId"
              :item-title="
                (item) => (item.creatorDisplayTitle ? item.creatorDisplayTitle : item.creatorTitle)
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
      <v-row no-gutters align="center" justify="center" class="fill-height">
        <v-col class="d-flex justify-center" cols="6" v-if="configChanged">
          <v-btn
            v-if="configChanged"
            color="primary"
            prepend-icon="mdi-check"
            flat
            @click="handleApply"
            >Apply</v-btn
          ></v-col
        >
        <v-col class="d-flex justify-center" cols="6">
          <v-btn
            color="primary"
            v-if="showReset"
            prepend-icon="mdi-close"
            variant="text"
            flat
            @click="handleReset"
            >Reset</v-btn
          ></v-col
        ></v-row
      >
    </v-card-text>
  </v-card>
  <v-card rounded="lg" flat class="hidden-sm-and-down">
    <v-card-text class="pb-0">
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
      <v-autocomplete
        class="hidden-xs"
        v-model="selectedVideoCreator"
        prepend-icon="mdi-youtube"
        label="Video Creator"
        density="compact"
        :items="creators"
        item-value="creatorId"
        :item-title="
          (item) => (item.creatorDisplayTitle ? item.creatorDisplayTitle : item.creatorTitle)
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
          (item) => (item.creatorDisplayTitle ? item.creatorDisplayTitle : item.creatorTitle)
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
    <v-row align="center" justify="center" class="fill-height mb-2">
      <v-col class="d-flex justify-center" cols="6" v-if="configChanged">
        <v-btn
          color="primary"
          v-if="configChanged"
          prepend-icon="mdi-check"
          flat
          @click="handleApply"
          >Apply</v-btn
        ></v-col
      >
      <v-col class="d-flex justify-center" cols="6">
        <v-btn
          color="primary"
          v-if="showReset"
          prepend-icon="mdi-close"
          variant="text"
          flat
          @click="handleReset"
          >Reset</v-btn
        ></v-col
      ></v-row
    >
    <v-divider></v-divider>
    <v-container>
      <v-row align="center" justify="center" class="fill-height">
        <v-col class="d-flex justify-center">
          <span v-if="loading && !count">Gathering...</span>
          <span v-else-if="!count">0 build orders</span>
          <span v-else-if="count === 1">{{ count }} build order</span
          ><span v-else-if="count > 1">{{ count }} build orders</span>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script>
//External
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRoute } from "vue-router";

//Components

//Composables
import { civs as allCivs } from "@/composables/filter/civDefaultProvider";
import { featuredCreators } from "@/composables/filter/featuredCreatorDefaultProvider";
import { maps } from "@/composables/filter/mapDefaultProvider";
import { seasons } from "@/composables/filter/seasonDefaultProvider";
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";
import { strategies } from "@/composables/filter/strategyDefaultProvider";

export default {
  name: "FilterConfig",
  inheritAttrs: false,
  emits: ["configChanged"],
  setup(props, context) {
    const store = useStore();
    const civs = allCivs.value.filter((element) => element.shortName != "ANY");
    const creators = featuredCreators;
    const route = useRoute();
    const loading = computed(() => store.state.loading);
    const count = computed(() => store.state.resultsCount);

    const initQueryParameters = async () => {
      if (route.query.civ) {
        selectedCivs.value = route.query.civ;
      }
      if (route.query.creator) {
        selectedVideoCreator.value = route.query.creator;
      }
    };

    onMounted(async () => {
      await initQueryParameters();
    });

    //Show apply when config different from state in store
    const configChanged = computed(() => {
      return (
        selectedCivs.value != store.state.filterConfig?.civs ||
        selectedVideoCreator.value != store.state.filterConfig?.creator ||
        JSON.stringify(selectedMaps.value) != JSON.stringify(store.state.filterConfig?.maps) ||
        JSON.stringify(selectedStrategies.value) !=
          JSON.stringify(store.state.filterConfig?.strategies) ||
        JSON.stringify(selectedSeasons.value) !=
          JSON.stringify(store.state.filterConfig?.seasons) ||
        selectedOrderBy.value != store.state.filterConfig?.orderBy
      );
    });
    //Show reset when state config different from default
    const showReset = computed(() => {
      return (
        store.state.filterConfig?.author ||
        store.state.filterConfig?.civs != getDefaultConfig().civs ||
        store.state.filterConfig?.creator != getDefaultConfig().creator ||
        JSON.stringify(store.state.filterConfig?.maps) != JSON.stringify(getDefaultConfig().maps) ||
        JSON.stringify(store.state.filterConfig?.strategies) !=
          JSON.stringify(getDefaultConfig().strategies) ||
        JSON.stringify(store.state.filterConfig?.seasons) !=
          JSON.stringify(getDefaultConfig().seasons) ||
        store.state.filterConfig?.orderBy != getDefaultConfig().orderBy
      );
    });

    const sortOptions = ref([
      {
        title: "All Time Score",
        id: "scoreAllTime",
      },
      {
        title: "Views",
        id: "views",
      },
      {
        title: "Trending",
        id: "score",
      },
      {
        title: "Time Created",
        id: "timeCreated",
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

    const selectedCivs = ref(store.state.filterConfig?.civs);
    const selectedVideoCreator = ref(store.state.filterConfig?.creator);
    const selectedMaps = ref(store.state.filterConfig?.maps);
    const selectedStrategies = ref(store.state.filterConfig?.strategies);
    const selectedSeasons = ref(store.state.filterConfig?.seasons);
    const selectedOrderBy = ref(store.state.filterConfig?.orderBy);

    const handleApply = () => {
      store.commit("setCivs", selectedCivs.value);
      store.commit("setCreator", selectedVideoCreator.value);
      store.commit("setMaps", selectedMaps.value);
      store.commit("setStrategies", selectedStrategies.value);
      store.commit("setSeasons", selectedSeasons.value);
      store.commit("setOrderBy", selectedOrderBy.value);

      //reset cache
      store.commit("setAllBuildsList", null);
      store.commit("setMyBuildsList", null);
      store.commit("setMyFavoritesList", null);

      context.emit("configChanged");
    };

    const handleReset = () => {
      selectedCivs.value = getDefaultConfig().civs;
      selectedVideoCreator.value = getDefaultConfig().creator;
      selectedMaps.value = getDefaultConfig().maps;
      selectedStrategies.value = getDefaultConfig().strategies;
      selectedSeasons.value = getDefaultConfig().seasons;
      selectedOrderBy.value = getDefaultConfig().orderBy;

      store.commit("setCivs", getDefaultConfig().civs);
      store.commit("setCreator", getDefaultConfig().creator);
      store.commit("setMaps", getDefaultConfig().maps);
      store.commit("setStrategies", getDefaultConfig().strategies);
      store.commit("setSeasons", getDefaultConfig().seasons);
      store.commit("setOrderBy", getDefaultConfig().orderBy);
      store.commit("setFilterConfig", getDefaultConfig());

      //reset cache
      store.commit("setAllBuildsList", null);
      store.commit("setMyBuildsList", null);
      store.commit("setMyFavoritesList", null);

      context.emit("configChanged");
    };

    return {
      sortOptions,
      civs,
      maps,
      seasons,
      creators,
      strategies,
      selectedCivs,
      selectedMaps,
      selectedStrategies,
      selectedSeasons,
      selectedOrderBy,
      selectedVideoCreator,
      count,
      loading,
      handleReset,
      handleApply,
      configChanged,
      showReset,
    };
  },
};
</script>
