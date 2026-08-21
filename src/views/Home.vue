<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="8">
        <!-- One slot, two possible occupants, never both. The banner hides
             itself once the tournament is over, and the spotlight takes the
             position with nothing to edit — but the banner cannot announce its
             own absence from inside a `v-if`, so the same predicate is asked
             here. See src/config/event.js. -->
        <EventBanner />
        <ContributorSpotlight
          v-if="!eventLive && (featuredContributor || spotlightPending)"
          :contributor="featuredContributor"
          :loading="!snapshotLoaded"
        />

        <CivPicker
          :civs="civs"
          :recent-civ-builds="recentCivBuilds"
        />

        <BuildLaneTabs
          class="mt-6"
          :popular-builds="popularBuildsList"
          :all-time-classics="allTimeClassicsList"
          :recent-builds="recentBuildsList"
        />
        <!-- mobile sidebar (below builds, hidden on desktop)

             This stack is a DUPLICATE of the desktop one below, not a
             responsive variant of it, so anything added to one must be added to
             both. A card added to only one looks perfectly correct on whichever
             width you happen to test. -->
        <div class="hidden-md-and-up mt-4">
          <News></News>
          <FundingStatus />
          <TopContributors :contributors="topContributorsList"></TopContributors>
          <YoutubeGuides></YoutubeGuides>
          <RegisterAd v-if="!user && authIsReady"></RegisterAd>
        </div>
      </v-col>

      <!-- sidebar (duplicate of the mobile stack above — keep them in step) -->
      <v-col cols="12" md="4" class="hidden-sm-and-down">
        <News></News>
        <FundingStatus />
        <TopContributors :contributors="topContributorsList"></TopContributors>
        <YoutubeGuides></YoutubeGuides>
        <RegisterAd class="mt-4" v-if="!user && authIsReady"></RegisterAd>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useStore } from "vuex";
import { computed, onMounted, ref } from "vue";

import RegisterAd from "@/components/notifications/RegisterAd.vue";
import News from "@/components/notifications/News.vue";
import YoutubeGuides from "@/components/notifications/YoutubeGuides.vue";
import TopContributors from "@/components/home/TopContributors.vue";
import CivPicker from "@/components/home/CivPicker.vue";
import BuildLaneTabs from "@/components/home/BuildLaneTabs.vue";
import EventBanner from "@/components/home/EventBanner.vue";
import ContributorSpotlight from "@/components/home/ContributorSpotlight.vue";
import FundingStatus from "@/components/common/FundingStatus.vue";

import { isEventLive } from "@/config/event";
import { getHomeSnapshot } from "@/composables/data/homeService";
import { civs as allCivs } from "@/composables/filter/civDefaultProvider";
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";

export default {
  name: "Home",
  components: {
    RegisterAd,
    News,
    YoutubeGuides,
    TopContributors,
    CivPicker,
    BuildLaneTabs,
    EventBanner,
    ContributorSpotlight,
    FundingStatus,
  },
  setup() {
    const store = useStore();
    const allTimeClassicsList = computed(() => store.state.cache.allTimeClassicsList);
    const popularBuildsList = computed(() => store.state.cache.popularBuildsList);
    const recentBuildsList = computed(() => store.state.cache.recentBuildsList);
    const topContributorsList = computed(() => store.state.cache.topContributorsList);
    const civs = allCivs.value.filter((element) => element.shortName != "ANY");
    const user = computed(() => store.state.user);
    const recentCivBuilds = ref([]);
    const featuredContributor = ref(null);
    const snapshotLoaded = ref(false);

    // Reserving space for a card that never comes is its own layout shift, and
    // on a site with nobody nominated that would be every single home page load.
    // So the placeholder is shown only when the *last* visit ended with a
    // spotlight — a one-bit memo that is wrong at most once, on the visit where
    // the answer changes, and corrects itself the same load.
    //
    // First-ever visitors get no reservation and one shift. Nothing available
    // before the snapshot arrives can tell us more than this.
    const SPOTLIGHT_MEMO = "aoe4guides.spotlightSeen";
    const readMemo = () => {
      try {
        return localStorage.getItem(SPOTLIGHT_MEMO) === "1";
      } catch {
        return false; // private mode, or storage disabled
      }
    };
    const spotlightPending = ref(readMemo());
    // Read once at mount, like EventBanner does with the same dates: nobody
    // keeps the home page open across the boundary, and a ticking clock would
    // re-render the page every second for a card that changes twice in its life.
    const eventLive = isEventLive();

    onMounted(() => {
      store.commit("setFilterConfig", getDefaultConfig());
      store.commit("setAllBuildsList", null);
      store.commit("setMyBuildsList", null);
      store.commit("setMyFavoritesList", null);
      initData();
    });

    const initData = async () => {
      // Single read replaces 4 separate live queries (~23 reads → 1 read).
      // Data is pre-generated hourly by the updateHomeSnapshot Cloud Function.
      // After first load, IndexedDB persistence serves this from local cache.
      const snapshot = await getHomeSnapshot();
      recentCivBuilds.value = snapshot?.recentCivBuilds ?? [];
      // Rides inside the snapshot rather than being fetched, which is what
      // keeps this page at one read even when the spotlighted contributor is
      // nowhere near the top-eight list. Null and absent mean the same thing:
      // a snapshot written before this feature shipped has no such key.
      featuredContributor.value = snapshot?.featuredContributor ?? null;
      snapshotLoaded.value = true;
      spotlightPending.value = !!featuredContributor.value;
      try {
        localStorage.setItem(SPOTLIGHT_MEMO, featuredContributor.value ? "1" : "0");
      } catch {
        // Storage unavailable. The placeholder simply never shows; the card
        // still does, one shift later.
      }
      store.commit("setPopularBuildsList", snapshot?.popularBuilds ?? []);
      store.commit("setAllTimeClassicsList", snapshot?.allTimeClassics ?? []);
      store.commit("setRecentBuildsList", snapshot?.recentBuilds ?? []);
      store.commit("setTopContributorsList", snapshot?.topContributors ?? []);
      store.commit("setResultsCount", snapshot?.buildsCount ?? null);
    };

    return {
      user,
      authIsReady: computed(() => store.state.authIsReady),
      civs,
      recentCivBuilds,
      featuredContributor,
      snapshotLoaded,
      spotlightPending,
      eventLive,
      recentBuildsList,
      popularBuildsList,
      allTimeClassicsList,
      topContributorsList,
    };
  },
};
</script>
