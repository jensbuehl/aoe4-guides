<template>
  <div class="build-lane-tabs pb-2">
    <!-- `grow` only below md: on a phone the three tabs split the width into
         thirds and cannot overflow, which is what makes the rail scroll-free by
         construction rather than by hoping the labels stay short. On desktop the
         same prop would smear three tabs across 700px, so there they stay
         left-aligned at their natural width. -->
    <v-tabs
      v-model="activeTab"
      color="primary"
      density="comfortable"
      :grow="smAndDown"
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
    </v-tabs>

    <v-window
      ref="windowRef"
      v-model="activeTab"
    >
      <v-window-item v-for="lane in lanes" :key="lane.value" :value="lane.value">
        <!-- The hero lives INSIDE the panel, not above the tab bar: the tabs are
             the panel's header, so everything they switch has to sit below them.
             It also makes the lane change one movement instead of two — the hero
             slides with its list rather than swapping under a sliding list. -->
        <HeroBuild
          v-if="laneIsLoading(lane.value) || heroBuild(lane.value)"
          :build="laneIsLoading(lane.value) ? null : heroBuild(lane.value)"
          :flag-url="heroCiv(lane.value)?.flagLarge ?? null"
          :civ-name="heroCiv(lane.value)?.title ?? null"
          :eyebrow="heroEyebrow(lane.value)"
          :icon="heroIcon(lane.value)"
          :loading="laneIsLoading(lane.value)"
          class="mb-2"
        />

        <v-alert
          v-if="rawLane(lane.value).length === 0"
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
            v-for="(item, i) in laneList(lane.value)"
            :key="item.id ?? i"
            style="text-decoration: none"
            :to="item.loading ? { name: 'Home' } : { name: 'BuildDetails', params: { id: item.id } }"
          >
            <BuildListCard :build="item" :context="context" />
          </router-link>

          <!-- The exit sits after the list, not above it: it is the answer to
               "I have seen these five", so offering it before the first card
               asks the reader to decide something they cannot decide yet. Being
               inside the panel also means it belongs to one lane and carries a
               fixed route, instead of silently retargeting as the tab changes.

               Full width only below md, the same split as the tab rail's `grow`:
               a thumb needs the whole row as a target, a pointer does not, and a
               block button on desktop hovers a slab far wider than the thing that
               looks clickable. `rounded="lg"` matches BuildListCard, so the
               hovered surface on mobile has the shape of the cards above it
               rather than the button default. -->
          <div class="d-flex justify-center mt-1">
            <v-btn
              variant="text"
              color="primary"
              :block="smAndDown"
              rounded="lg"
              height="38"
              :to="viewAllRoute(lane.value)"
              append-icon="mdi-chevron-right"
            >
              View all
            </v-btn>
          </div>
        </template>
      </v-window-item>
    </v-window>
  </div>
</template>

<script>
import { ref, watch } from "vue";
import { useDisplay } from "vuetify";
import BuildListCard from "@/components/builds/BuildListCard.vue";
import HeroBuild from "@/components/home/HeroBuild.vue";
import { civs } from "@/composables/filter/civDefaultProvider";

const lanes = [
  { value: "trending",  label: "Trending",          icon: "mdi-trending-up",        orderBy: "score" },
  { value: "classics",  label: "Classics",           icon: "mdi-star",               orderBy: "scoreAllTime" },
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
    // Forwarded to the cards. Lanes are not filter-driven, so no filterConfig
    // is passed on — the cards show every field they have.
    context:         { type: String, default: "default" },
  },
  setup(props) {
    const { smAndDown, width } = useDisplay();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Every hero accessor takes the lane it belongs to rather than reading
    // activeTab: each window item renders its own hero, so three of them exist
    // at once and "the current lane" is not a property of the component.
    const rawLane = (value) => {
      if (value === "trending") return props.popularBuilds;
      if (value === "classics") return props.allTimeClassics;
      return props.recentBuilds;
    };

    const heroBuild = (value) => {
      const items = rawLane(value);
      return items.length > 0 ? items[0] : null;
    };

    const laneList = (value) => {
      const items = rawLane(value);
      const hero = items[0];
      return hero && !hero.loading ? items.filter((b) => b.id !== hero.id) : items;
    };

    const heroCiv = (value) =>
      civs.value.find((c) => c.shortName === heroBuild(value)?.civ) ?? null;

    const heroEyebrow = (value) => {
      const label = heroEyebrowLabels[value] ?? "";
      const civ = heroCiv(value)?.title ?? "";
      return civ ? `${label} · ${civ}` : label;
    };

    const heroIcon = (value) => heroIcons[value] ?? "mdi-trending-up";

    const laneIsLoading = (value) => heroBuild(value)?.loading === true;

    const viewAllRoute = (value) => ({
      name: "Builds",
      query: { orderBy: lanes.find((l) => l.value === value)?.orderBy, ...props.extraQuery },
    });

    // Lock the window at the tallest height seen so far.
    // When switching to a shorter-content tab, the page height would otherwise
    // shrink — pushing the user's scroll position above the new maximum and
    // causing the browser to snap the viewport upward.
    const windowRef = ref(null);
    let maxWindowHeight = 0;
    watch(activeTab, (_, oldVal) => {
      if (!oldVal) return;
      const el = windowRef.value?.$el;
      if (!el) return;
      maxWindowHeight = Math.max(maxWindowHeight, el.offsetHeight);
      el.style.minHeight = maxWindowHeight + "px";
    });

    // The lock is an absolute pixel value, and it is only ever raised — so it
    // has to be thrown away whenever the layout it was measured in stops being
    // the layout on screen. Card heights follow the viewport width (titles wrap
    // at xs that fit on one line at sm), so a height measured at one width is
    // not merely stale at another, it is unrelated. A too-high value survives as
    // dead space under the list that no later switch can remove, because Math.max
    // never lowers it. Width alone, not height: a height change (mobile URL bar)
    // does not reflow the cards, and resetting on it would drop the lock exactly
    // when scrolling makes it matter.
    watch(width, () => {
      maxWindowHeight = 0;
      const el = windowRef.value?.$el;
      if (el) el.style.minHeight = "";
    });

    return {
      lanes,
      activeTab,
      smAndDown,
      reducedMotion,
      rawLane,
      laneList,
      heroBuild,
      heroCiv,
      heroEyebrow,
      heroIcon,
      laneIsLoading,
      viewAllRoute,
      windowRef,
    };
  },
};
</script>

<style scoped>
.build-lane-tabs {
  overflow-x: hidden;
}
</style>
