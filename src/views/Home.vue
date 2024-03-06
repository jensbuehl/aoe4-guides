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
          <v-card-title v-if="user"
            >Welcome, {{ user.displayName }}!</v-card-title
          >
          <v-card-text>
            <span v-if="!count">Gathering build orders...</span>
            <span v-if="count"
              >Busy villagers have gathered {{ count }} build order</span
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
                          'to right, transparent, ' +
                          $vuetify.theme.current.colors.surface
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
                        style="
                          font-family: 'Segoe UI' !important;
                          font-size: 0.8rem !important;
                        "
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
                          'to right, transparent, ' +
                          $vuetify.theme.current.colors.surface
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
                        style="font-family: 'Segoe UI' !important"
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
        <div
          class="text-h6 mt-2 mb-2 ml-4 hidden-md-and-up"
          style="font-family: 'Segoe UI' !important"
        >
          Featured Creators
        </div>
        <v-row no-gutters class="hidden-md-and-up">
          <v-col
            cols="6"
            v-for="(creator, index) in featuredCreators"
            :key="creator.creatorId"
          >
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
                  <v-row
                    no-gutters
                    class="fill-height"
                    align="center"
                    justify="center"
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
                              style="
                                font-family: 'Segoe UI' !important;
                                font-size: 0.8rem !important;
                              "
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

        <!--villager of the day xs-->
        <!--v-row no-gutters class="hidden-md-and-up">
          <div
            class="text-h6 mt-2 mb-2 ml-4"
            style="font-family: 'Segoe UI' !important"
          >
            Villager of the Day
          </div>
          <v-col cols="12" v-model="villagerOfTheDay">
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Explore all build orders from
                {{ villagerOfTheDay.displayName }}
              </span>
              <template v-slot:activator="{ props }">
                <v-card
                  flat
                  rounded="lg"
                  v-bind="props"
                  :to="{
                    name: 'Builds',
                    query: { author: villagerOfTheDay.id },
                  }"
                >
                  <v-row
                    no-gutters
                    class="fill-height"
                    align="center"
                    justify="center"
                    ><v-col cols="12"
                      ><v-skeleton-loader
                        :color="
                          villagerOfTheDay.loading ? 'loading' : 'surface'
                        "
                        height="84"
                        :loading="villagerOfTheDay.loading"
                      >
                        <v-row no-gutters align="center" justify="start">
                          <v-col cols="auto">
                            <div>
                              <v-avatar class="ml-4" color="accent">{{
                                villagerOfTheDay.displayName
                                  .slice(0, 2)
                                  .toUpperCase()
                              }}</v-avatar>
                            </div>
                          </v-col>
                          <v-col cols="9" align="start">
                            //small title
                            <v-card-title
                              :style="{
                                color: $vuetify.theme.current.colors.primary,
                              }"
                              class="text-subtitle-2 hidden-lg-and-up"
                              style="font-family: 'Segoe UI' !important"
                            >
                              {{ villagerOfTheDay.displayName }}
                            </v-card-title>
                            <v-card-text
                              v-if="villagerOfTheDay.count > 1"
                              class="hidden-lg-and-up"
                              >{{ villagerOfTheDay.count }} build orders
                              gathered</v-card-text
                            >
                            <v-card-text
                              v-else-if="villagerOfTheDay.count == 1"
                              class="hidden-lg-and-up"
                              >{{ villagerOfTheDay.count }} build order
                              gathered</v-card-text
                            >
                            <v-card-text v-else class="hidden-lg-and-up"
                              >No build order gathered so far. Researching
                              wheelbarrow...</v-card-text
                            >
                          </v-col>
                        </v-row>
                      </v-skeleton-loader></v-col
                    ></v-row
                  >
                </v-card>
              </template>
            </v-tooltip>
          </v-col>
        </v-row-->

        <!-- recent builds -->
        <v-row align="center" no-gutters>
          <v-col cols="12">
            <div
              class="text-h6 mt-4 ml-4"
              style="font-family: 'Segoe UI' !important"
            >
              New Build Orders
            </div>
            <div class="mt-2" v-for="item in mostRecentBuilds">
              <router-link
                style="text-decoration: none"
                :to="{
                  name: item.loading ? 'Home' : 'BuildDetails',
                  params: { id: !item.loading ? item.id : null },
                }"
              >
                <BuildListCard
                  :build="item"
                  :creatorName="getCreatorNameFromId(item.creatorId)"
                ></BuildListCard>
              </router-link>
            </div> </v-col
        ></v-row>

        <!-- popular builds -->
        <v-row align="center" no-gutters>
          <v-col cols="12">
            <div
              class="text-h6 mt-4 ml-4"
              style="font-family: 'Segoe UI' !important"
            >
              Popular Build Orders
            </div>
            <div class="mt-2" v-for="item in popularBuilds">
              <router-link
                style="text-decoration: none"
                :to="{
                  name: item.loading ? 'Home' : 'BuildDetails',
                  params: { id: !item.loading ? item.id : null },
                }"
              >
                <BuildListCard
                  :build="item"
                  :creatorName="getCreatorNameFromId(item.creatorId)"
                ></BuildListCard>
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
          <v-card-title v-if="user"
            >Welcome, {{ user.displayName }}!</v-card-title
          >
          <v-card-text
            >Create new Age of Empires 4 build orders and share them with your
            friends and the community. </v-card-text
          ><v-card-text>
            <span v-if="!count">Gathering build orders...</span>
            <span v-if="count"
              >Busy villagers have gathered {{ count }} build order</span
            ><span v-if="count > 1">s</span><span>.</span>
          </v-card-text>
        </v-card>

        <!--featured creators sm and up-->
        <v-row no-gutters class="hidden-xs">
          <div
            class="text-h6 mt-4 mb-2 ml-4"
            style="font-family: 'Segoe UI' !important"
          >
            Featured Creators
          </div>
          <v-col cols="12" v-for="creator in featuredCreators">
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
                  <v-row
                    no-gutters
                    class="fill-height"
                    align="center"
                    justify="center"
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
                              style="font-family: 'Segoe UI' !important"
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
          </v-col>
        </v-row>

        <!--villager of the day sm and up-->
        <!--v-row no-gutters class="hidden-xs">
          <div
            class="text-h6 mt-4 mb-2 ml-4"
            style="font-family: 'Segoe UI' !important"
          >
            Villager of the Day
          </div>
          <v-col cols="12" v-model="villagerOfTheDay">
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Explore all build orders from
                {{ villagerOfTheDay.displayName }}
              </span>
              <template v-slot:activator="{ props }">
                <v-card
                  flat
                  rounded="lg"
                  v-bind="props"
                  :to="{
                    name: 'Builds',
                    query: { author: villagerOfTheDay.id },
                  }"
                >
                  <v-row
                    no-gutters
                    class="fill-height"
                    align="center"
                    justify="center"
                    ><v-col cols="12"
                      ><v-skeleton-loader
                        :color="
                          villagerOfTheDay.loading ? 'loading' : 'surface'
                        "
                        height="84"
                        :loading="villagerOfTheDay.loading"
                      >
                        <v-row no-gutters align="center" justify="start">
                          <v-col cols="auto">
                            <div>
                              <v-avatar class="ml-4" color="accent">{{
                                villagerOfTheDay.displayName
                                  .slice(0, 2)
                                  .toUpperCase()
                              }}</v-avatar>
                            </div>
                          </v-col>
                          <v-col cols="9" align="start">
                            //small title
                            <v-card-title
                              :style="{
                                color: $vuetify.theme.current.colors.primary,
                              }"
                              class="text-subtitle-2 hidden-lg-and-up"
                              style="font-family: 'Segoe UI' !important"
                            >
                              {{ villagerOfTheDay.displayName }}
                            </v-card-title>
                            //large title
                            <v-card-title
                              class="hidden-md-and-down"
                              :style="{
                                color: $vuetify.theme.current.colors.primary,
                              }"
                            >
                              {{ villagerOfTheDay.displayName }}
                            </v-card-title>
                            <v-card-text
                              v-if="villagerOfTheDay.count > 1"
                              class="hidden-sm-and-down"
                              >{{ villagerOfTheDay.count }} build orders
                              gathered</v-card-text
                            >
                            <v-card-text
                              v-else-if="villagerOfTheDay.count == 1"
                              class="hidden-sm-and-down"
                              >{{ villagerOfTheDay.count }} build order
                              gathered</v-card-text
                            >
                            <v-card-text v-else class="hidden-sm-and-down"
                              >No build order gathered so far. Researching
                              wheelbarrow...</v-card-text
                            >
                          </v-col>
                        </v-row>
                      </v-skeleton-loader></v-col
                    ></v-row
                  >
                </v-card>
              </template>
            </v-tooltip>
          </v-col>
        </v-row-->
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
import RegisterAd from "../components/notifications/RegisterAd.vue";
import News from "../components/notifications/News.vue";
import EmailVerificationAd from "../components/notifications/EmailVerificationAd.vue";
import FilterConfig from "../components/filter/FilterConfig.vue";
import getCivs from "../composables/filter/getCivs";
import getFeaturedCreators from "../composables/filter/getFeaturedCreators";
import getDefaultConfig from "../composables/filter/getDefaultConfig";
import BuildListCard from "../components/builds/BuildListCard.vue";
import useCollection from "../composables/useCollection";
import queryService from "../composables/useQueryService";
import { useStore } from "vuex";
import { ref, computed, onMounted } from "vue";
import { functions } from "../firebase";
import { httpsCallable } from "firebase/functions";

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
    window.scrollTo(0, 0);

    const { getAll, getQuery, getSize } = useCollection("builds");
    const { getAll: getAllCreators, getQuery: getQueryCreators } =
      useCollection("creators");
    const popularBuilds = computed(() => store.state.popularBuilds);
    const mostRecentBuilds = computed(() => store.state.mostRecentBuilds);
    const featuredCreators = getFeaturedCreators().featuredCreators;
    const allCreators = computed(() => store.state.creators);
    const villagerOfTheDay = ref({ loading: true });
    const civs = getCivs().civs.value.filter(
      (element) => element.shortName != "ANY"
    );
    const store = useStore();
    const count = computed(() => store.state.resultsCount);
    const user = computed(() => store.state.user);
    const filterAndOrderConfig = computed(() => store.state.filterConfig);
    const popularConfig = ref(getDefaultConfig());
    const mostRecentConfig = ref(getDefaultConfig());
    const authorConfig = ref(getDefaultConfig());
    mostRecentConfig.value.orderBy = "timeCreated";

    onMounted(() => {
      store.commit("setFilterConfig", getDefaultConfig());
      initData();
    });

    const getCreatorNameFromId = (id) => {
      if (allCreators.value) {
        const currentCreator = allCreators.value.find(
          (element) => element.id === id
        );
        if (currentCreator) {
          return currentCreator.creatorDisplayTitle
            ? currentCreator.creatorDisplayTitle
            : currentCreator.creatorTitle;
        }
      }
    };

    const initData = async () => {
      //reset results count
      store.commit("setResultsCount", null);

      //get most recent
      if (mostRecentBuilds.value[0].loading) {
        const mostRecentQuery = getQuery(
          queryService.getQueryParametersFromConfig(mostRecentConfig.value, 5)
        );
        store.commit("setMostRecentBuilds", await getAll(mostRecentQuery));
      }

      //get popular
      if (popularBuilds.value[0].loading) {
        const popularBuildsQuery = getQuery(
          queryService.getQueryParametersFromConfig(popularConfig.value, 5)
        );
        store.commit("setPopularBuilds", await getAll(popularBuildsQuery));
      }

      //get all creators
      if (!allCreators.value) {
        store.commit("setCreators", await getAllCreators());
      }

      //get count
      const allDocsQuery = getQuery(
        queryService.getQueryParametersFromConfig(filterAndOrderConfig.value)
      );
      const size = await getSize(allDocsQuery);
      store.commit("setResultsCount", size);
    };

    return {
      user,
      authIsReady: computed(() => store.state.authIsReady),
      civs,
      count,
      mostRecentBuilds,
      popularBuilds,
      featuredCreators,
      getCreatorNameFromId,
      villagerOfTheDay,
    };
  },
};
</script>
