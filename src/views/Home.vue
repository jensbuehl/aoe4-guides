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
      <!-- main content -->
      <v-col cols="12" md="4" class="hidden-md-and-up">
        <v-card flat rounded="lg" class="mb-2">
          <v-card-title v-if="!user">Welcome, Villager!</v-card-title>
          <v-card-title v-if="user">Welcome, {{ user.displayName }}!</v-card-title>
          <v-card-text>
            <span v-if="!count">Gathering build orders...</span>
            <span v-if="count">Busy villagers have gathered {{ count }} build order</span
            ><span v-if="count > 1">s</span><span>.</span></v-card-text
          >
        </v-card>
        <News></News>
        <Gold3DadAd></Gold3DadAd>
      </v-col>

      <v-col cols="12" md="8">
        <!-- civilizations xs-->
        <v-row no-gutters class="hidden-md-and-up"
          ><v-col class="ml-2 mb-4" cols="auto"
            ><v-icon icon="mdi-earth" size="small" class="mx-2 mb-1"></v-icon
            ><span class="text-h6">Civilizations</span>
          </v-col></v-row
        >
        <v-row align="center" no-gutters class="hidden-sm-and-up">
          <v-col cols="6" v-for="(civ, index) in civs" :key="civ.title">
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Explore all {{ civ.title }} build orders</span
              >
              <template v-slot:activator="{ props }">
                <v-card
                  flat
                  v-bind:class="{
                    'mb-2 mr-2': index % 2 == 0,
                    'mb-2 ml-2': index % 2 != 0,
                  }"
                  min-height="50"
                  rounded="lg"
                  v-bind="props"
                  :to="{
                    name: 'Builds',
                    query: { civ: civ.shortName },
                  }"
                >
                  <v-row no-gutters align="center" justify="center">
                    <v-col cols="4">
                      <v-img
                        min-height="50"
                        :src="civ.flagLarge"
                        :lazy-src="civ.flagSmall"
                        :gradient="
                          'to right, transparent, ' + $vuetify.theme.current.colors.surface
                        "
                        alt="{{civ.title}}"
                        cover
                      >
                      </v-img>
                    </v-col>
                    <v-col cols="8">
                      <!--small title-->
                      <div
                        :style="{
                          color: $vuetify.theme.current.colors.primary,
                        }"
                        class="text-subtitle-2 mx-2"
                        style="font-size: 0.8rem !important"
                      >
                        {{ civ.title }}
                      </div>
                    </v-col>
                  </v-row>
                </v-card>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>
        <!-- civilizations sm and up-->
        <v-row align="center" no-gutters class="hidden-xs">
          <v-col cols="6" v-for="(civ, index) in civs" :key="civ.title">
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Explore all {{ civ.title }} build orders</span
              >
              <template v-slot:activator="{ props }">
                <v-card
                  flat
                  v-bind:class="{
                    'mb-2 mr-2': index % 2 == 0,
                    'mb-2 ml-2': index % 2 != 0,
                  }"
                  min-height="50"
                  rounded="lg"
                  v-bind="props"
                  :to="{
                    name: 'Builds',
                    query: { civ: civ.shortName },
                  }"
                >
                  <v-row no-gutters align="center" justify="center">
                    <v-col cols="4">
                      <v-img
                        min-height="70"
                        :src="civ.flagLarge"
                        :lazy-src="civ.flagSmall"
                        :gradient="
                          'to right, transparent, ' + $vuetify.theme.current.colors.surface
                        "
                        alt="{{civ.title}}"
                        cover
                      >
                      </v-img>
                    </v-col>
                    <v-col cols="8">
                      <!--small title-->
                      <div
                        :style="{
                          color: $vuetify.theme.current.colors.primary,
                        }"
                        class="text-subtitle-2 mx-2 hidden-lg-and-up"
                      >
                        {{ civ.title }}
                      </div>
                      <!--large title-->
                      <v-card-title
                        class="hidden-md-and-down"
                        :style="{
                          color: $vuetify.theme.current.colors.primary,
                        }"
                      >
                        {{ civ.title }}
                      </v-card-title>
                    </v-col>
                  </v-row>
                </v-card>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>

        <v-row no-gutters class="hidden-md-and-up"
          ><v-col class="ml-2 mt-4 mb-4" cols="auto"
            ><v-icon icon="mdi-account-star" size="small" class="mx-2 mb-1"></v-icon
            ><span class="text-h6">Top Contributors</span>
          </v-col></v-row
        >

        <!--top contributors sm-->
        <v-row no-gutters class="hidden-xs hidden-md-and-up">
          <v-col
            cols="6"
            v-for="(contributor, index) in topContributorsList"
            :key="contributor.userId"
          >
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Explore all build orders from
                {{ contributor.displayName }}
              </span>
              <template v-slot:activator="{ props }">
                <v-card
                  flat
                  :height="contributorsCardHeight"
                  v-bind:class="{
                    'mb-2 mr-2': index % 2 == 0,
                    'mb-2 ml-2': index % 2 != 0,
                  }"
                  rounded="lg"
                  v-bind="props"
                  :to="{
                    name: 'Builds',
                    query: { author: contributor.authorId },
                  }"
                >
                  <v-row no-gutters class="fill-height" align="center" justify="center"
                    ><v-col cols="12"
                      ><v-skeleton-loader
                        :color="contributor.loading ? 'loading' : 'surface'"
                        :loading="contributor.loading"
                        :height="contributorsCardHeight"
                      >
                        <v-row no-gutters align="center">
                          <v-col cols="auto" align="center">
                            <v-avatar
                              v-if="contributor.icon"
                              class="mx-4"
                              color="accent"
                              :image="contributor.icon"
                            ></v-avatar>
                            <v-avatar v-else class="mx-4" color="accent">{{
                              contributor.displayName.slice(0, 2).toUpperCase()
                            }}</v-avatar>
                          </v-col>
                          <v-col cols="auto" align="start" justify="start">
                            <v-row no-gutters>
                              <!--sm title-->
                              <div
                                :style="{
                                  color: $vuetify.theme.current.colors.primary,
                                }"
                                class="text-subtitle-2 hidden-xs mt-n1"
                                style="font-family: 'Segoe UI' !important"
                              >
                                {{ contributor.displayName }}
                              </div></v-row
                            ><v-row no-gutters>
                              <v-col cols="auto"
                                ><v-chip class="mr-2 hidden-xs" label size="x-small"
                                  ><v-icon start icon="mdi-eye"></v-icon
                                  >{{ contributor.viewCount }}</v-chip
                                ></v-col
                              >

                              <v-col cols="auto"
                                ><v-chip class="hidden-xs" label size="x-small"
                                  ><v-icon start icon="mdi-hammer"></v-icon
                                  >{{ contributor.boCount }}</v-chip
                                ></v-col
                              >
                            </v-row>
                          </v-col>
                        </v-row>
                      </v-skeleton-loader></v-col
                    ></v-row
                  >
                </v-card>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>

        <!--top contributors xs-->
        <v-row no-gutters class="hidden-sm-and-up">
          <v-col
            cols="6"
            v-for="(contributor, index) in topContributorsList"
            :key="contributor.userId"
          >
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Explore all build orders from
                {{ contributor.displayName }}
              </span>
              <template v-slot:activator="{ props }">
                <v-card
                  flat
                  :height="contributorsCardHeight"
                  v-bind:class="{
                    'mb-2 mr-2': index % 2 == 0,
                    'mb-2 ml-2': index % 2 != 0,
                  }"
                  rounded="lg"
                  v-bind="props"
                  :to="{
                    name: 'Builds',
                    query: { author: contributor.authorId },
                  }"
                >
                  <v-row no-gutters class="fill-height" align="center" justify="center"
                    ><v-col cols="12"
                      ><v-skeleton-loader
                        :color="contributor.loading ? 'loading' : 'surface'"
                        :loading="contributor.loading"
                        :height="contributorsCardHeight"
                      >
                        <v-row no-gutters align="center">
                          <v-col cols="auto" align="center">
                            <v-avatar
                              v-show="contributor.icon"
                              class="mx-4"
                              color="accent"
                              :image="contributor.icon"
                            ></v-avatar>
                            <v-avatar v-show="!contributor.icon" class="mx-4" color="accent">{{
                              contributor.displayName.slice(0, 2).toUpperCase()
                            }}</v-avatar>
                          </v-col>
                          <v-col cols="*" align="start" justify="start">
                            <v-row no-gutters
                              ><!--xs title-->
                              <div
                                :style="{
                                  color: $vuetify.theme.current.colors.primary,
                                }"
                                class="text-subtitle-2 hidden-sm-and-up"
                                style="font-size: 0.8rem !important"
                              >
                                {{ contributor.displayName }}
                              </div>
                              <!--sm title-->
                              <div
                                :style="{
                                  color: $vuetify.theme.current.colors.primary,
                                }"
                                class="text-subtitle-2 hidden-xs"
                                style="font-family: 'Segoe UI' !important"
                              >
                                {{ contributor.displayName }}
                              </div></v-row
                            ><v-row no-gutters>
                              <v-col cols="auto"
                                ><v-label class="hidden-xs"
                                  >{{ contributor.viewCount }} views</v-label
                                ></v-col
                              >

                              <v-col cols="auto"
                                ><v-label class="ml-4 hidden-xs"
                                  >{{ contributor.boCount }} builds</v-label
                                ></v-col
                              >
                            </v-row>
                          </v-col>
                        </v-row>
                      </v-skeleton-loader></v-col
                    ></v-row
                  >
                </v-card>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>

        <!-- popular builds -->
        <v-row no-gutters align="center">
          <v-col class="ml-2 mt-4 mb-2" cols="auto"
            ><v-icon icon="mdi-trending-up" size="small" class="mx-2 mb-1"></v-icon
            ><span class="text-h6">Popular Build Orders</span>
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Show All Popular Builds</span
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
        <v-container class="mx-0 pa-0 hidden-md-and-up"
          ><YoutubeGuides></YoutubeGuides
        ></v-container>
      </v-col>

      <v-col cols="12" md="4" class="hidden-md-and-up">
        <RegisterAd v-if="!user && authIsReady"></RegisterAd>
        <EmailVerificationAd
          v-if="user && authIsReady && !user.emailVerified"
        ></EmailVerificationAd>
      </v-col>

      <!-- sidebar -->
      <v-col cols="12" md="4" class="hidden-sm-and-down">
        <v-card flat rounded="lg" class="mb-2">
          <v-card-title v-if="!user">Welcome, Villager!</v-card-title>
          <v-card-title v-if="user">Welcome, {{ user.displayName }}!</v-card-title>
          <v-card-text
            >Create new Age of Empires 4 build orders and share them with your friends and the
            community. </v-card-text
          ><v-card-text>
            <span v-if="!count">Gathering build orders...</span>
            <span v-if="count">Busy villagers have gathered {{ count }} build order</span
            ><span v-if="count > 1">s</span><span>.</span>
          </v-card-text>
        </v-card>
        <News></News>
        <v-container class="mx-0 pa-0 mb-2"><Gold3DadAd></Gold3DadAd></v-container>

        <!--top contributors md and up-->
        <v-row no-gutters align="center" class="hidden-xs">
          <v-col class="ml-2 mt-4 mb-4" cols="auto"
            ><v-icon icon="mdi-account-star" size="small" class="mx-2 mb-1"></v-icon
            ><span class="text-h6">Top Contributors</span></v-col
          ></v-row
        >
        <v-row align="center" no-gutters
          ><v-col cols="12" v-for="contributor in topContributorsList">
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Explore all build orders from
                {{ contributor.displayName }}
              </span>
              <template v-slot:activator="{ props }">
                <v-card
                  flat
                  :height="contributorsCardHeight"
                  rounded="lg"
                  class="mb-2"
                  v-bind="props"
                  :to="{
                    name: 'Builds',
                    query: { author: contributor.authorId },
                  }"
                >
                  <v-row no-gutters class="fill-height" align="center" justify="center"
                    ><v-col cols="12"
                      ><v-skeleton-loader
                        :color="contributor.loading ? 'loading' : 'surface'"
                        :loading="contributor.loading"
                        :height="contributorsCardHeight"
                      >
                        <v-row no-gutters align="center">
                          <v-col cols="auto" align="center">
                            <v-avatar
                              v-if="contributor.icon"
                              class="mx-4"
                              color="accent"
                              :image="contributor.icon"
                            ></v-avatar>
                            <v-avatar v-else class="mx-4" color="accent">{{
                              contributor.displayName.slice(0, 2).toUpperCase()
                            }}</v-avatar>
                          </v-col>
                          <v-col cols="*" align="start" justify="start">
                            <v-row no-gutters
                              ><!--lg title-->
                              <v-card-title
                                :style="{
                                  color: $vuetify.theme.current.colors.primary,
                                }"
                                class="ml-n4 mt-lg-n4 hidden-md-and-down"
                              >
                                {{ contributor.displayName }}
                              </v-card-title>
                              <!--md title-->
                              <div
                                :style="{
                                  color: $vuetify.theme.current.colors.primary,
                                }"
                                class="text-subtitle-2 hidden-sm-and-down hidden-lg-and-up mt-n1"
                                style="font-family: 'Segoe UI' !important"
                              >
                                {{ contributor.displayName }}
                              </div></v-row
                            ><v-row no-gutters class="hidden-sm-and-down hidden-lg-and-up mt-2">
                              <v-chip class="mr-2" label size="x-small"
                                ><v-icon start icon="mdi-eye"></v-icon
                                >{{ contributor.viewCount }}</v-chip
                              >
                              <v-chip label size="x-small"
                                ><v-icon start icon="mdi-hammer"></v-icon
                                >{{ contributor.boCount }}</v-chip
                              >
                            </v-row>
                            <v-row no-gutters class="hidden-md-and-down mt-n1">
                              <v-chip class="mr-2" label size="small"
                                ><v-icon start icon="mdi-eye"></v-icon
                                >{{ contributor.viewCount }}</v-chip
                              >
                              <v-chip label size="small"
                                ><v-icon start icon="mdi-hammer"></v-icon
                                >{{ contributor.boCount }}</v-chip
                              >
                            </v-row>
                          </v-col>
                        </v-row>
                      </v-skeleton-loader></v-col
                    ></v-row
                  >
                </v-card>
              </template>
            </v-tooltip>
          </v-col></v-row
        >
        <YoutubeGuides class="hidden-md-and-up mt-4"></YoutubeGuides>
        <RegisterAd class="mt-6" v-if="!user && authIsReady"></RegisterAd>
        <EmailVerificationAd
          class="mt-6"
          v-if="user && authIsReady && !user.emailVerified"
        ></EmailVerificationAd>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
//External
import { useStore } from "vuex";
import { computed, onMounted } from "vue";
import { useDisplay } from "vuetify";

//Components
import RegisterAd from "@/components/notifications/RegisterAd.vue";
import News from "@/components/notifications/News.vue";
import YoutubeGuides from "@/components/notifications/YoutubeGuides.vue";
import Gold3DadAd from "@/components/notifications/Gold3DadAd.vue";
import EmailVerificationAd from "@/components/notifications/EmailVerificationAd.vue";
import FilterConfig from "@/components/filter/FilterConfig.vue";
import BuildListCard from "@/components/builds/BuildListCard.vue";

//Composables
import { civs as allCivs } from "@/composables/filter/civDefaultProvider";
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";
import { getTopContributors } from "@/composables/data/contributorService";
import {
  getRecentBuilds,
  getPopularBuilds,
  getAllTimeClassics,
  getBuildsCount,
} from "@/composables/data/buildService";

export default {
  name: "Home",
  components: {
    FilterConfig,
    BuildListCard,
    RegisterAd,
    News,
    YoutubeGuides,
    Gold3DadAd,
    EmailVerificationAd,
  },
  setup() {
    const allTimeClassicsList = computed(() => store.state.cache.allTimeClassicsList);
    const popularBuildsList = computed(() => store.state.cache.popularBuildsList);
    const recentBuildsList = computed(() => store.state.cache.recentBuildsList);
    const topContributorsList = computed(() => store.state.cache.topContributorsList);
    const civs = allCivs.value.filter((element) => element.shortName != "ANY");
    const store = useStore();
    const { name } = useDisplay();
    const count = computed(() => store.state.resultsCount);
    const user = computed(() => store.state.user);

    const contributorsCardHeight = computed(() => {
      switch (name.value) {
        case "xs":
          return 50;
        case "sm":
          return 70;
        case "md":
          return 70;
        case "lg":
          return 70;
        case "xl":
          return 84;
        case "xxl":
          return 84;
      }
    });

    onMounted(() => {
      store.commit("setFilterConfig", getDefaultConfig());

      //reset cache
      store.commit("setAllBuildsList", null);
      store.commit("setMyBuildsList", null);
      store.commit("setMyFavoritesList", null);

      initData();
    });

    const initData = async () => {
      //reset results count
      store.commit("setResultsCount", null);

      //get popular
      if (!popularBuildsList || popularBuildsList.value[0].loading) {
        const popularBuildsList = await getPopularBuilds(5);
        store.commit("setPopularBuildsList", popularBuildsList);
      }

      //get all time classics
      if (!allTimeClassicsList || allTimeClassicsList.value[0].loading) {
        const allTimeClassicsList = await getAllTimeClassics(5);
        store.commit("setAllTimeClassicsList", allTimeClassicsList);
      }

      //get most recent
      if (!recentBuildsList || recentBuildsList.value[0].loading) {
        const recentBuilds = await getRecentBuilds(5);
        store.commit("setRecentBuildsList", recentBuilds);
      }

      //get top contributors
      if (!topContributorsList || topContributorsList.value[0].loading) {
        const topContributors = await getTopContributors(10);
        store.commit("setTopContributorsList", topContributors);
      }

      //get count
      const size = await getBuildsCount();
      store.commit("setResultsCount", size);
    };

    return {
      user,
      authIsReady: computed(() => store.state.authIsReady),
      civs,
      count,
      recentBuildsList,
      popularBuildsList,
      allTimeClassicsList,
      topContributorsList,
      contributorsCardHeight,
    };
  },
};
</script>
