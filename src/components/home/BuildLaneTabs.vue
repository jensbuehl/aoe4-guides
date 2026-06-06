<template>
  <div class="build-lane-tabs pb-2">
    <HeroBuild
      v-if="isLoading || heroBuild"
      :build="isLoading ? null : heroBuild"
      :flag-url="heroCiv?.flagLarge ?? null"
      :civ-name="heroCiv?.title ?? null"
      :eyebrow="heroEyebrow"
      :icon="heroIcon"
      :loading="isLoading"
      class="mb-4"
    />

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
import HeroBuild from "@/components/home/HeroBuild.vue";
import { civs } from "@/composables/filter/civDefaultProvider";

const lanes = [
  { value: "trending",  label: "Trending",          icon: "mdi-trending-up",        orderBy: "score" },
  { value: "classics",  label: "All-Time Classics",  icon: "mdi-star",               orderBy: "scoreAllTime" },
  { value: "new",       label: "New",                icon: "mdi-clock-edit-outline",  orderBy: "timeCreated" },
];

const heroEyebrowLabels = {
  trending: "#1 Trending",
  classics: "#1 All-Time Classic",
  new:      "Latest Build",
};

const heroIcons = {
  trending: "mdi-trending-up",
  classics: "mdi-star",
  new:      "mdi-clock-edit-outline",
};

// Module-level ref: persists across navigations for the lifetime of the SPA session.
// Navigating away and back restores the last-selected tab.
const activeTab = ref("trending");

export default {
  name: "BuildLaneTabs",
  components: { BuildListCard, HeroBuild },
  props: {
    popularBuilds:   { type: Array, required: true },
    allTimeClassics: { type: Array, required: true },
    recentBuilds:    { type: Array, required: true },
    extraQuery:      { type: Object, default: () => ({}) },
  },
  setup(props) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const rawLane = (value) => {
      if (value === "trending") return props.popularBuilds;
      if (value === "classics") return props.allTimeClassics;
      return props.recentBuilds;
    };

    const laneList = (value) => {
      const items = rawLane(value);
      const hero = items[0];
      return hero && !hero.loading ? items.filter((b) => b.id !== hero.id) : items;
    };

    const heroBuild = computed(() => {
      const items = rawLane(activeTab.value);
      return items.length > 0 ? items[0] : null;
    });

    const heroCiv = computed(() =>
      civs.value.find((c) => c.shortName === heroBuild.value?.civ) ?? null
    );

    const heroEyebrow = computed(() => {
      const label = heroEyebrowLabels[activeTab.value] ?? "";
      const civ = heroCiv.value?.title ?? "";
      return civ ? `${label} · ${civ}` : label;
    });

    const heroIcon = computed(() => heroIcons[activeTab.value] ?? "mdi-trending-up");

    const isLoading = computed(() => heroBuild.value?.loading === true);

    const viewAllRoute = computed(() => ({
      name: "Builds",
      query: { orderBy: lanes.find((l) => l.value === activeTab.value)?.orderBy, ...props.extraQuery },
    }));

    return {
      lanes,
      activeTab,
      reducedMotion,
      laneList,
      heroBuild,
      heroCiv,
      heroEyebrow,
      heroIcon,
      isLoading,
      viewAllRoute,
    };
  },
};
</script>
