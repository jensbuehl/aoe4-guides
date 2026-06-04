<template>
  <v-layout-item model-value position="bottom" class="text-end" size="88">
    <div class="ma-4">
      <v-tooltip>
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Create new build order from scratch</span
        >
        <template v-slot:activator="{ props }">
          <v-btn
            class="hidden-md-and-up"
            :style="'color: ' + $vuetify.theme.current.colors.primary"
            to="/new"
            v-bind="props"
            icon="mdi-plus"
            size="large"
            color="primary"
            elevation="8"
          />
        </template>
      </v-tooltip>
    </div>
  </v-layout-item>
  <v-container>
    <v-row>
      <v-col cols="12" md="8">
        <CivPicker
          :civs="civs"
          :recent-civ-builds="recentCivBuilds"
        />

        <!-- popular builds -->
        <v-row no-gutters align="center">
          <v-col class="ml-2 mt-4 mb-2" cols="auto"
            ><v-icon icon="mdi-trending-up" size="small" class="mx-2 mb-1"></v-icon
            ><span class="text-h6">Trending Build Orders</span>
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Show All Trending Builds</span
              >
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="small"
                  class="mx-2 mb-1"
                  variant="text"
                  color="primary"
                  icon="mdi-chevron-right"
                  :to="{
                    name: 'Builds',
                    query: { orderBy: 'score' },
                  }"
                ></v-btn>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>
        <v-row align="center" no-gutters>
          <v-col cols="12">
            <div v-for="item in popularBuildsList">
              <router-link
                style="text-decoration: none"
                :to="{
                  name: item.loading ? 'Home' : 'BuildDetails',
                  params: {
                    id: !item.loading ? item.id : null,
                  },
                }"
              >
                <BuildListCard :build="item"></BuildListCard>
              </router-link>
            </div> </v-col
        ></v-row>

        <!-- all time classics -->
        <v-row no-gutters>
          <v-col class="ml-2 mt-4 mb-2" cols="auto"
            ><v-icon icon="mdi-star" size="small" class="mx-2 mb-1"></v-icon
            ><span class="text-h6">All Time Classics</span>
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Show All Time Classics</span
              >
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="small"
                  class="mx-2 mb-1"
                  variant="text"
                  color="primary"
                  icon="mdi-chevron-right"
                  :to="{
                    name: 'Builds',
                    query: { orderBy: 'scoreAllTime' },
                  }"
                ></v-btn>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>
        <v-row align="center" no-gutters>
          <v-col cols="12">
            <div v-for="item in allTimeClassicsList">
              <router-link
                style="text-decoration: none"
                :to="{
                  name: item.loading ? 'Home' : 'BuildDetails',
                  params: {
                    id: !item.loading ? item.id : null,
                  },
                }"
              >
                <BuildListCard :build="item"></BuildListCard>
              </router-link>
            </div> </v-col
        ></v-row>

        <!-- recent builds -->
        <v-row no-gutters align="center">
          <v-col class="ml-2 mt-4 mb-2" cols="auto"
            ><v-icon icon="mdi-clock-edit-outline" size="small" class="mx-2 mb-1"></v-icon
            ><span class="text-h6">New Build Orders</span>
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Show All Recent Builds</span
              >
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="small"
                  class="mx-2 mb-1"
                  variant="text"
                  color="primary"
                  icon="mdi-chevron-right"
                  :to="{
                    name: 'Builds',
                    query: { orderBy: 'timeCreated' },
                  }"
                ></v-btn>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>
        <v-row align="center" no-gutters>
          <v-col cols="12">
            <div v-for="item in recentBuildsList">
              <router-link
                style="text-decoration: none"
                :to="{
                  name: item.loading ? 'Home' : 'BuildDetails',
                  params: {
                    id: !item.loading ? item.id : null,
                  },
                }"
              >
                <BuildListCard :build="item"></BuildListCard>
              </router-link>
            </div> </v-col
        ></v-row>
        <!-- mobile sidebar (below builds, hidden on desktop) -->
        <div class="hidden-md-and-up mt-4">
          <News></News>
          <TopContributors :contributors="topContributorsList"></TopContributors>
          <YoutubeGuides></YoutubeGuides>
          <RegisterAd v-if="!user && authIsReady"></RegisterAd>
          <EmailVerificationAd v-if="user && authIsReady && !user.emailVerified"></EmailVerificationAd>
        </div>
      </v-col>

      <!-- sidebar -->
      <v-col cols="12" md="4" class="hidden-sm-and-down">
        <News></News>
        <TopContributors :contributors="topContributorsList"></TopContributors>
        <YoutubeGuides></YoutubeGuides>
        <RegisterAd class="mt-4" v-if="!user && authIsReady"></RegisterAd>
        <EmailVerificationAd
          class="mt-4"
          v-if="user && authIsReady && !user.emailVerified"
        ></EmailVerificationAd>
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
import EmailVerificationAd from "@/components/notifications/EmailVerificationAd.vue";
import BuildListCard from "@/components/builds/BuildListCard.vue";
import TopContributors from "@/components/home/TopContributors.vue";
import CivPicker from "@/components/home/CivPicker.vue";

import { getHomeSnapshot } from "@/composables/data/homeService";
import { civs as allCivs } from "@/composables/filter/civDefaultProvider";
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";

export default {
  name: "Home",
  components: {
    BuildListCard,
    RegisterAd,
    News,
    YoutubeGuides,
    EmailVerificationAd,
    TopContributors,
    CivPicker,
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
      recentBuildsList,
      popularBuildsList,
      allTimeClassicsList,
      topContributorsList,
    };
  },
};
</script>
