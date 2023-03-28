<template>
  <v-card rounded="lg" class="pt-6 mb-4">
    <v-list>
      <v-list-item>
        <v-autocomplete
          v-model="config.civs"
          prepend-icon="mdi-filter-variant"
          label="Civilization"
          density="compact"
          :items="civs"
          item-value="shortName"
          item-title="title"
          clearable
          multiple
        >
        </v-autocomplete>
      </v-list-item>
      <v-list-item>
        <v-autocomplete
          v-model="config.maps"
          prepend-icon="mdi-map"
          label="Map"
          density="compact"
          :items="maps"
          item-value="shortName"
          item-title="title"
          clearable
          multiple
        >
        </v-autocomplete>
      </v-list-item>
      <v-list-item>
        <v-autocomplete
          v-model="config.strategies"
          prepend-icon="mdi-strategy"
          label="Strategy"
          density="compact"
          :items="strategies"
          item-value="shortName"
          item-title="title"
          clearable
          multiple
        >
        </v-autocomplete>
      </v-list-item>
      <v-list-item>
        <v-select
          v-model="config.orderBy"
          prepend-icon="mdi-sort"
          density="compact"
          label="Order by"
          item-value="id"
          item-title="title"
          :items="sortOptions"
        ></v-select>
      </v-list-item>
    </v-list>
    <v-card-actions class="justify-center">
      <v-btn color="primary" prepend-icon="mdi-close" flat @click="handleReset">Reset Filters</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { ref, reactive, watch } from "vue";
import getCivs from "../composables/getCivs";
import getMaps from "../composables/getMaps";
import getDefaultConfig from "../composables/getDefaultConfig";
import getStrategies from "../composables/getStrategies";

export default {
  name: "BuildsConfig",
  setup(props, context) {
    const civs = getCivs().civs;
    const maps = getMaps().maps;
    const strategies = getStrategies().strategies;
    const config = reactive(getDefaultConfig());
    const sortOptions = ref([
      {
        title: "Title",
        id: "sortTitle",
      },
      {
        title: "Time Created",
        id: "timeCreated",
      },
    ]);

    watch(config, () => {
      context.emit("configChanged", config);
    });

    const handleReset = () => {
      Object.assign(config, getDefaultConfig());
      context.emit("configChanged", config);
    };

    return {
      config,
      sortOptions,
      civs,
      maps,
      strategies,
      handleReset,
    };
  },
};
</script>
