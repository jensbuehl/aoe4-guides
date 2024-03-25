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
        <News class="mb-6"></News>
        <v-card flat rounded="lg" class="mb-2">
          <v-card-title v-if="!user">Welcome, Villager!</v-card-title>
          <v-card-title v-if="user">Welcome, {{ user.displayName }}!</v-card-title>
          <v-card-text>
            <span v-if="!count">Gathering build orders...</span>
            <span v-if="count">Busy villagers have gathered {{ count }} build order</span
            ><span v-if="count > 1">s</span><span>.</span></v-card-text
          >
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <!-- civilizations xs-->
        <v-row align="center" no-gutters class="hidden-sm-and-up mt-n2">
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

        <!--featured creators xs-->
        <v-row no-gutters class="hidden-md-and-up"
          ><v-col class="ml-2 mt-4 mb-4" cols="auto"
            ><v-icon icon="mdi-account-star" size="small" class="mx-2 mb-1"></v-icon
            ><span class="text-h6">Featured Villagers</span>
          </v-col></v-row
        >
        <v-row no-gutters class="hidden-md-and-up">
          <v-col cols="6" v-for="(creator, index) in featuredVillagers" :key="creator.userId">
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Explore all build orders from
                {{ creator.creatorTitle }}
              </span>
              <template v-slot:activator="{ props }">
                <v-card
                  flat
                  height="56"
                  v-bind:class="{
                    'mb-2 mr-2': index % 2 == 0,
                    'mb-2 ml-2': index % 2 != 0,
                  }"
                  rounded="lg"
                  v-bind="props"
                  :to="{
                    name: 'Builds',
                    query: { authorUid: creator.userId },
                  }"
                >
                  <v-row no-gutters class="fill-height" align="center" justify="center"
                    ><v-col cols="12"
                      ><v-skeleton-loader
                        :color="creator.loading ? 'loading' : 'surface'"
                        :loading="creator.loading"
                      >
                        <v-row no-gutters align="center">
                          <v-col cols="auto" align="center">
                            <v-avatar
                              class="my-2 mx-4"
                              color="accent"
                              :image="creator.creatorImage"
                            ></v-avatar>
                          </v-col>
                          <v-col cols="auto" align="start" justify="start">
                            <!--xs title-->
                            <div
                              :style="{
                                color: $vuetify.theme.current.colors.primary,
                              }"
                              class="text-subtitle-2 hidden-sm-and-up"
                              style="font-size: 0.8rem !important"
                            >
                              {{ creator.creatorTitle }}
                            </div>
                            <!--sm title-->
                            <div
                              :style="{
                                color: $vuetify.theme.current.colors.primary,
                              }"
                              class="text-subtitle-2 hidden-xs"
                              style="font-family: 'Segoe UI' !important"
                            >
                              {{ creator.creatorTitle }}
                            </div>
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

        <!--featured creators xs-->
        <v-row no-gutters class="hidden-md-and-up"
          ><v-col class="ml-2 mt-4 mb-4" cols="auto"
            ><v-icon icon="mdi-youtube" size="small" class="mx-2 mb-1"></v-icon
            ><span class="text-h6">Featured Creators</span>
          </v-col></v-row
        >
        <v-row no-gutters class="hidden-md-and-up">
          <v-col cols="6" v-for="(creator, index) in featuredCreators" :key="creator.creatorId">
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Explore all build orders from
                {{ creator.creatorTitle }}
              </span>
              <template v-slot:activator="{ props }">
                <v-card
                  flat
                  height="56"
                  v-bind:class="{
                    'mb-2 mr-2': index % 2 == 0,
                    'mb-2 ml-2': index % 2 != 0,
                  }"
                  rounded="lg"
                  v-bind="props"
                  :to="{
                    name: 'Builds',
                    query: { creator: creator.creatorId },
                  }"
                >
                  <v-row no-gutters class="fill-height" align="center" justify="center"
                    ><v-col cols="12"
                      ><v-skeleton-loader
                        :color="creator.loading ? 'loading' : 'surface'"
                        :loading="creator.loading"
                      >
                        <v-row no-gutters align="center">
                          <v-col cols="auto" align="center">
                            <v-avatar
                              class="my-2 mx-4"
                              color="accent"
                              :image="creator.creatorImage"
                            ></v-avatar>
                          </v-col>
                          <v-col cols="auto" align="start" justify="start">
                            <!--xs title-->
                            <div
                              :style="{
                                color: $vuetify.theme.current.colors.primary,
                              }"
                              class="text-subtitle-2 hidden-sm-and-up"
                              style="font-size: 0.8rem !important"
                            >
                              {{ creator.creatorTitle }}
                            </div>
                            <!--sm title-->
                            <div
                              :style="{
                                color: $vuetify.theme.current.colors.primary,
                              }"
                              class="text-subtitle-2 hidden-xs"
                              style="font-family: 'Segoe UI' !important"
                            >
                              {{ creator.creatorTitle }}
                            </div>
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
      </v-col>

      <v-col cols="12" md="4" class="hidden-md-and-up">
        <RegisterAd v-if="!user && authIsReady"></RegisterAd>
        <EmailVerificationAd
          v-if="user && authIsReady && !user.emailVerified"
        ></EmailVerificationAd>
      </v-col>

      <!-- sidebar -->
      <v-col cols="12" md="4" class="hidden-sm-and-down">
        <News class="mb-6"></News>
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

        <!--featured creators sm and up-->
        <v-row no-gutters align="center" class="hidden-xs">
          <v-col class="ml-2 mt-4 mb-4" cols="auto"
            ><v-icon icon="mdi-account-star" size="small" class="mx-2 mb-1"></v-icon
            ><span class="text-h6">Featured Villagers</span></v-col
          >

          <v-row align="center" no-gutters
            ><v-col cols="12" v-for="creator in featuredVillagers">
              <v-tooltip location="top" open-delay="1000">
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >Explore all build orders from
                  {{ creator.creatorTitle }}
                </span>
                <template v-slot:activator="{ props }">
                  <v-card
                    flat
                    height="56"
                    class="mb-2"
                    rounded="lg"
                    v-bind="props"
                    :to="{
                      name: 'Builds',
                      query: { author: creator.userId },
                    }"
                  >
                    <v-row no-gutters class="fill-height" align="center" justify="center"
                      ><v-col cols="12"
                        ><v-skeleton-loader
                          :color="creator.loading ? 'loading' : 'surface'"
                          :loading="creator.loading"
                        >
                          <v-row no-gutters align="center" justify="start">
                            <v-col cols="auto">
                              <div>
                                <v-avatar
                                  class="ml-4"
                                  color="accent"
                                  :image="creator.creatorImage"
                                ></v-avatar>
                              </div>
                            </v-col>
                            <v-col cols="9" align="start">
                              <!--small title-->
                              <div
                                :style="{
                                  color: $vuetify.theme.current.colors.primary,
                                }"
                                class="text-subtitle-2 ml-4 hidden-lg-and-up"
                              >
                                {{ creator.creatorTitle }}
                              </div>
                              <!--large title-->
                              <v-card-title
                                class="hidden-md-and-down"
                                :style="{
                                  color: $vuetify.theme.current.colors.primary,
                                }"
                              >
                                {{ creator.creatorTitle }}
                              </v-card-title>
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
        </v-row>

        <!--featured creators sm and up-->
        <v-row no-gutters align="center" class="hidden-xs">
          <v-col class="ml-2 mt-4 mb-4" cols="auto"
            ><v-icon icon="mdi-youtube" size="small" class="mx-2 mb-1"></v-icon
            ><span class="text-h6">Featured Creators</span></v-col
          >

          <v-row align="center" no-gutters
            ><v-col cols="12" v-for="creator in featuredCreators">
              <v-tooltip location="top" open-delay="1000">
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >Explore all build orders from
                  {{ creator.creatorTitle }}
                </span>
                <template v-slot:activator="{ props }">
                  <v-card
                    flat
                    height="56"
                    class="mb-2"
                    rounded="lg"
                    v-bind="props"
                    :to="{
                      name: 'Builds',
                      query: { creator: creator.creatorId },
                    }"
                  >
                    <v-row no-gutters class="fill-height" align="center" justify="center"
                      ><v-col cols="12"
                        ><v-skeleton-loader
                          :color="creator.loading ? 'loading' : 'surface'"
                          :loading="creator.loading"
                        >
                          <v-row no-gutters align="center" justify="start">
                            <v-col cols="auto">
                              <div>
                                <v-avatar
                                  class="ml-4"
                                  color="accent"
                                  :image="creator.creatorImage"
                                ></v-avatar>
                              </div>
                            </v-col>
                            <v-col cols="9" align="start">
                              <!--small title-->
                              <div
                                :style="{
                                  color: $vuetify.theme.current.colors.primary,
                                }"
                                class="text-subtitle-2 ml-4 hidden-lg-and-up"
                              >
                                {{ creator.creatorTitle }}
                              </div>
                              <!--large title-->
                              <v-card-title
                                class="hidden-md-and-down"
                                :style="{
                                  color: $vuetify.theme.current.colors.primary,
                                }"
                              >
                                {{ creator.creatorTitle }}
                              </v-card-title>
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
        </v-row>
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

//Components
import RegisterAd from "@/components/notifications/RegisterAd.vue";
import News from "@/components/notifications/News.vue";
import EmailVerificationAd from "@/components/notifications/EmailVerificationAd.vue";
import FilterConfig from "@/components/filter/FilterConfig.vue";
import BuildListCard from "@/components/builds/BuildListCard.vue";

//Composables
import { civs as allCivs } from "@/composables/filter/civDefaultProvider";
import { featuredCreators } from "@/composables/filter/featuredCreatorDefaultProvider";
import { featuredVillagers } from "@/composables/filter/featuredVillagerDefaultProvider";
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";
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
    EmailVerificationAd,
  },
  setup() {
    const allTimeClassicsList = computed(() => store.state.cache.allTimeClassicsList);
    const popularBuildsList = computed(() => store.state.cache.popularBuildsList);
    const recentBuildsList = computed(() => store.state.cache.recentBuildsList);
    const civs = allCivs.value.filter((element) => element.shortName != "ANY");
    const store = useStore();
    const count = computed(() => store.state.resultsCount);
    const user = computed(() => store.state.user);

    onMounted(() => {
      store.commit("setFilterConfig", getDefaultConfig());
      initData();
    });

    const initData = async () => {
      //reset results count
      store.commit("setResultsCount", null);

      //get most recent
      if (recentBuildsList.value[0].loading) {
        const recentBuilds = await getRecentBuilds(5);
        store.commit("setRecentBuildsList", recentBuilds);
      }

      //get popular
      if (popularBuildsList.value[0].loading) {
        const popularBuildsList = await getPopularBuilds(5);
        store.commit("setPopularBuildsList", popularBuildsList);
      }

      //get all time classics
      if (allTimeClassicsList.value[0].loading) {
        const allTimeClassicsList = await getAllTimeClassics(5);
        store.commit("setAllTimeClassicsList", allTimeClassicsList);
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
      featuredCreators,
      featuredVillagers
    };
  },
};
</script>
