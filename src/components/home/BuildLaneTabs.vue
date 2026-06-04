<template>
  <div class="build-lane-tabs py-2">
    <v-tabs
      v-model="activeTab"
      color="primary"
      density="comfortable"
      class="mb-3"
    >
      <v-tab
        v-for="lane in lanes"
        :key="lane.value"
        :value="lane.value"
        :prepend-icon="lane.icon"
        :ripple="false"
      >
        {{ lane.label }}
      </v-tab>

      <v-spacer />

      <v-btn
        variant="text"
        color="primary"
        size="small"
        :to="viewAllRoute"
        class="align-self-center mr-1"
        append-icon="mdi-chevron-right"
      >
        View all
      </v-btn>
    </v-tabs>

    <v-window
      v-model="activeTab"
      :transition="reducedMotion ? false : undefined"
      :reverse-transition="reducedMotion ? false : undefined"
    >
      <v-window-item v-for="lane in lanes" :key="lane.value" :value="lane.value">
        <v-alert
          v-if="laneList(lane.value).length === 0"
          type="info"
          color="primary"
          border="start"
          elevation="0"
          icon="mdi-information"
          class="mt-2"
        >
          No build orders available yet.
        </v-alert>
        <template v-else>
          <router-link
            v-for="item in laneList(lane.value)"
            :key="item.id ?? item.loading"
            style="text-decoration: none"
            :to="item.loading ? { name: 'Home' } : { name: 'BuildDetails', params: { id: item.id } }"
          >
            <BuildListCard :build="item" />
          </router-link>
        </template>
      </v-window-item>
    </v-window>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import BuildListCard from "@/components/builds/BuildListCard.vue";

const lanes = [
  { value: "trending",  label: "Trending",          icon: "mdi-trending-up",        orderBy: "score" },
  { value: "classics",  label: "All-Time Classics",  icon: "mdi-star",               orderBy: "scoreAllTime" },
  { value: "new",       label: "New",                icon: "mdi-clock-edit-outline",  orderBy: "timeCreated" },
];

// Module-level ref: persists across navigations for the lifetime of the SPA session.
// Navigating away and back restores the last-selected tab.
const activeTab = ref("trending");

export default {
  name: "BuildLaneTabs",
  components: { BuildListCard },
  props: {
    popularBuilds:   { type: Array, required: true },
    allTimeClassics: { type: Array, required: true },
    recentBuilds:    { type: Array, required: true },
  },
  setup(props) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const laneList = (value) => {
      if (value === "trending") return props.popularBuilds;
      if (value === "classics") return props.allTimeClassics;
      return props.recentBuilds;
    };

    const viewAllRoute = computed(() => ({
      name: "Builds",
      query: { orderBy: lanes.find((l) => l.value === activeTab.value)?.orderBy },
    }));

    return { lanes, activeTab, reducedMotion, laneList, viewAllRoute };
  },
};
</script>
