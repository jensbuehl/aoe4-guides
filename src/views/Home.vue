<template>
  <v-container>
    <v-row>
      <!-- main content -->
      <v-col cols="12" md="4" class="hidden-md-and-up">
        <v-card rounded="lg" class="mb-2">
          <v-card-title v-if="!user">Welcome, Villager!</v-card-title>
          <v-card-title v-if="user"
            >Welcome, {{ user.displayName }}!</v-card-title
          >
        </v-card>
        <v-alert
          v-if="!user && authIsReady"
          rounded="lg"
          outlined
          color="primary"
          class="mt-4 pa-1"
        >
          <v-card rounded="lg">
            <v-card-title v-if="!user">Create</v-card-title>
            <v-card-text
              >Create new Age of Empires 4 build orders and share them with your
              friends.</v-card-text
            >

            <v-card-title>Like</v-card-title>
            <v-card-text
              >Manage your own favorite AoE 4 build orders and find the good
              ones with ease.</v-card-text
            >

            <v-card-title>Comment</v-card-title>
            <v-card-text
              >Write build order comments and get in touch with the author and
              the community.</v-card-text
            >

            <v-card-title>Sign up</v-card-title>
            <v-card-text
              >Registered villagers gather and manage build orders up to 20%
              faster. ;)</v-card-text
            >
            <v-list-item>
              <span>New Villager?</span>
              <v-btn
                size="small"
                color="primary"
                style="background-color: transparent"
                variant="plain"
                to="/register"
              >
                Register now!
              </v-btn>
            </v-list-item>
          </v-card></v-alert
        >
      </v-col>

      <v-col cols="12" md="8">
        <!--civilizations-->
        <div
          class="text-h6 mb-2 ml-4"
          style="font-family: 'Segoe UI' !important"
        >
          Civilizations
        </div>
        <!-- civilizations xs-->
        <v-row align="center" no-gutters class="hidden-sm-and-up">
          <v-col cols="6" v-for="(civ, index) in civs" :key="civ.title">
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.themes.customDarkTheme.colors.primary,
                }"
                >Explore all {{ civ.title }} build orders</span
              >
              <template v-slot:activator="{ props }">
                <v-card
                  v-bind:class="{
                    'mb-2 mr-2': index % 2 == 0,
                    'mb-2 ml-2': index % 2 != 0,
                  }"
                  min-height="50"
                  rounded="lg"
                  v-bind="props"
                  @click="civSelected(civ.shortName)"
                >
                  <v-row no-gutters align="center" justify="center">
                    <v-col cols="4">
                      <v-img
                        min-height="50"
                        :src="civ.flagLarge"
                        :lazy-src="civ.flagSmall"
                        gradient="to right, transparent, #1D2432"
                        alt="{{civ.title}}"
                        cover
                      >
                      </v-img>
                    </v-col>
                    <v-col cols="8">
                      <!--small title-->
                      <div
                        :style="{
                          color:
                            $vuetify.theme.themes.customDarkTheme.colors
                              .primary,
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
                  color: $vuetify.theme.themes.customDarkTheme.colors.primary,
                }"
                >Explore all {{ civ.title }} build orders</span
              >
              <template v-slot:activator="{ props }">
                <v-card
                  v-bind:class="{
                    'mb-2 mr-2': index % 2 == 0,
                    'mb-2 ml-2': index % 2 != 0,
                  }"
                  min-height="50"
                  rounded="lg"
                  v-bind="props"
                  @click="civSelected(civ.shortName)"
                >
                  <v-row no-gutters align="center" justify="center">
                    <v-col cols="4">
                      <v-img
                        min-height="50"
                        :src="civ.flagLarge"
                        :lazy-src="civ.flagSmall"
                        gradient="to right, transparent, #1D2432"
                        alt="{{civ.title}}"
                        cover
                      >
                      </v-img>
                    </v-col>
                    <v-col cols="8">
                      <!--small title-->
                      <div
                        :style="{
                          color:
                            $vuetify.theme.themes.customDarkTheme.colors
                              .primary,
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
                          color:
                            $vuetify.theme.themes.customDarkTheme.colors
                              .primary,
                        }"
                      >
                        {{ civ.title }}
                      </v-card-title>
                    </v-col>
                  </v-row>
                </v-card>
              </template>
            </v-tooltip>
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.themes.customDarkTheme.colors.primary,
                }"
                >Explore all {{ civ.title }} build orders</span
              >
              <template v-slot:activator="{ props }">
                <v-card
                  class="mb-2 hidden-sm-and-up"
                  min-height="50"
                  rounded="lg"
                  v-bind="props"
                  @click="civSelected(civ.shortName)"
                >
                  <v-row align="center" justify="center">
                    <v-col cols="4">
                      <v-img
                        min-height="50"
                        :src="civ.flagLarge"
                        :lazy-src="civ.flagSmall"
                        gradient="to right, transparent, #1D2432"
                        alt="{{civ.title}}"
                        cover
                      >
                      </v-img>
                    </v-col>
                    <v-col cols="8">
                      <!--small title-->
                      <div
                        :style="{
                          color:
                            $vuetify.theme.themes.customDarkTheme.colors
                              .primary,
                        }"
                        class="text-subtitle-2 hidden-lg-and-up"
                        style="font-family: 'Segoe UI' !important"
                      >
                        {{ civ.title }}
                      </div>
                      <!--large title-->
                      <v-card-title
                        class="hidden-md-and-down"
                        :style="{
                          color:
                            $vuetify.theme.themes.customDarkTheme.colors
                              .primary,
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
          class="text-h6 mt-4 mb-2 ml-4 hidden-md-and-up"
          style="font-family: 'Segoe UI' !important"
        >
          Featured Creators
        </div>
        <v-row no-gutters class="hidden-md-and-up">
          <v-col
            cols="6"
            v-for="(creator, index) in creators"
            :key="creator.creatorId"
          >
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.themes.customDarkTheme.colors.primary,
                }"
                >Explore all build orders from
                {{ getCreatorName(creator.creatorId) }}
              </span>
              <template v-slot:activator="{ props }">
                <v-card
                  height="56"
                  v-bind:class="{
                    'mb-2 mr-2': index % 2 == 0,
                    'mb-2 ml-2': index % 2 != 0,
                  }"
                  rounded="lg"
                  v-bind="props"
                  @click="creatorSelected(creator.creatorId)"
                >
                  <v-row
                    no-gutters
                    class="fill-height"
                    align="center"
                    justify="center"
                    ><v-col cols="12"
                      ><v-skeleton-loader :loading="creator.loading">
                        <v-row no-gutters align="center">
                          <v-col cols="4" align="center">
                            <v-avatar
                              class="my-2 mx-4"
                              color="primary"
                              :image="creator.image"
                            ></v-avatar>
                          </v-col>
                          <v-col cols="8" align="start">
                            <!--xs title-->
                            <div
                              :style="{
                                color:
                                  $vuetify.theme.themes.customDarkTheme.colors
                                    .primary,
                              }"
                              class="text-subtitle-2 ml-2 hidden-sm-and-up"
                              style="
                                font-family: 'Segoe UI' !important;
                                font-size: 0.8rem !important;
                              "
                            >
                              {{ getCreatorName(creator.creatorId) }}
                            </div>
                            <!--sm title-->
                            <div
                              :style="{
                                color:
                                  $vuetify.theme.themes.customDarkTheme.colors
                                    .primary,
                              }"
                              class="text-subtitle-2 hidden-xs mx-2"
                              style="font-family: 'Segoe UI' !important"
                            >
                              {{ getCreatorName(creator.creatorId) }}
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
                <SingleBuild
                  :build="item"
                  :creatorName="getCreatorName(item.creatorId)"
                ></SingleBuild>
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
                <SingleBuild
                  :build="item"
                  :creatorName="getCreatorName(item.creatorId)"
                ></SingleBuild>
              </router-link>
            </div> </v-col
        ></v-row>
      </v-col>

      <!-- sidebar -->
      <v-col cols="12" md="4" class="hidden-sm-and-down">
        <v-card rounded="lg" class="mb-2">
          <v-card-title v-if="!user">Welcome, Villager!</v-card-title>
          <v-card-title v-if="user"
            >Welcome, {{ user.displayName }}!</v-card-title
          >
          <v-card-text
            >Create new Age of Empires 4 build orders and share them with your
            friends and the community.</v-card-text
          >
        </v-card>

        <!--featured creators sm and up-->
        <v-row no-gutters class="hidden-xs">
          <div
            class="text-h6 mt-4 mb-2 ml-4"
            style="font-family: 'Segoe UI' !important"
          >
            Featured Creators
          </div>
          <v-col cols="12" v-for="creator in creators" :key="creator.creatorId">
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.themes.customDarkTheme.colors.primary,
                }"
                >Explore all build orders from
                {{ getCreatorName(creator.creatorId) }}
              </span>
              <template v-slot:activator="{ props }">
                <v-card
                  height="56"
                  class="mb-2"
                  rounded="lg"
                  v-bind="props"
                  @click="creatorSelected(creator.creatorId)"
                >
                  <v-row
                    no-gutters
                    class="fill-height"
                    align="center"
                    justify="center"
                    ><v-col cols="12"
                      ><v-skeleton-loader :loading="creator.loading">
                        <v-row no-gutters align="center" justify="start">
                          <v-col cols="auto">
                            <div>
                              <v-avatar
                                class="ml-4"
                                color="primary"
                                :image="creator.image"
                              ></v-avatar>
                            </div>
                          </v-col>
                          <v-col cols="9" align="start">
                            <!--small title-->
                            <div
                              :style="{
                                color:
                                  $vuetify.theme.themes.customDarkTheme.colors
                                    .primary,
                              }"
                              class="text-subtitle-2 ml-4 hidden-lg-and-up"
                              style="font-family: 'Segoe UI' !important"
                            >
                              {{ getCreatorName(creator.creatorId) }}
                            </div>
                            <!--large title-->
                            <v-card-title
                              class="hidden-md-and-down"
                              :style="{
                                color:
                                  $vuetify.theme.themes.customDarkTheme.colors
                                    .primary,
                              }"
                            >
                              {{ getCreatorName(creator.creatorId) }}
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

        <v-alert
          v-if="!user && authIsReady"
          rounded="lg"
          outlined
          color="primary"
          class="mt-4 pa-1"
        >
          <v-card rounded="lg">
            <v-card-title v-if="!user">Create</v-card-title>
            <v-card-text
              >Create new Age of Empires 4 build orders and share them with your
              friends.</v-card-text
            >

            <v-card-title>Like</v-card-title>
            <v-card-text
              >Manage your own favorite AoE 4 build orders and find the good
              ones with ease.</v-card-text
            >

            <v-card-title>Comment</v-card-title>
            <v-card-text
              >Write build order comments and get in touch with the author and
              the community.</v-card-text
            >

            <v-card-title>Sign up</v-card-title>
            <v-card-text
              >Registered villagers gather and manage build orders up to 20%
              faster. ;)</v-card-text
            >
            <v-list-item>
              <span>New Villager?</span>
              <v-btn
                size="small"
                color="primary"
                style="background-color: transparent"
                variant="plain"
                to="/register"
              >
                Register now!
              </v-btn>
            </v-list-item>
          </v-card></v-alert
        >
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import BuildsConfig from "../components/BuildsConfig.vue";
import getCivs from "../composables/getCivs";
import getDefaultConfig from "../composables/getDefaultConfig";
import SingleBuild from "../components/SingleBuild.vue";
import { useRouter } from "vue-router";
import useCollection from "../composables/useCollection";
import queryService from "../composables/queryService";
import { useStore } from "vuex";
import { ref, computed, onMounted } from "vue";
import useYoutube from "../composables/useYoutube";
import { VSkeletonLoader } from "vuetify/labs/VSkeletonLoader";

export default {
  name: "Home",
  components: { BuildsConfig, SingleBuild, VSkeletonLoader },
  setup() {
    window.scrollTo(0, 0);

    const { getAll, getQuery, getSize } = useCollection("builds");
    const { getAll: getAllCreators, getQuery: getQueryCreators } =
      useCollection("creators");
    const { getChannelIcon } = useYoutube();
    const popularBuilds = ref(Array(5).fill({ loading: true }));
    const mostRecentBuilds = ref(Array(5).fill({ loading: true }));
    const creators = ref(Array(6).fill({ loading: true }));
    const allCreators = ref(null);
    const civs = getCivs().civs.value.filter(
      (element) => element.shortName != "ANY"
    );
    const router = useRouter();
    const store = useStore();
    const count = computed(() => store.state.resultsCount);
    const user = computed(() => store.state.user);
    const filterAndOrderConfig = computed(() => store.state.filterConfig);
    const popularConfig = ref(getDefaultConfig());
    const mostRecentConfig = ref(getDefaultConfig());
    mostRecentConfig.value.orderBy = "timeCreated";

    onMounted(() => {
      if (!filterAndOrderConfig.value) {
        store.commit("setFilterConfig", getDefaultConfig());
      }
      initData();
    });

    const civSelected = (id) => {
      filterAndOrderConfig.value.civs = id;
      store.commit("setFilterConfig", filterAndOrderConfig.value);
      router.push({ name: "Builds" });
    };

    const creatorSelected = (id) => {
      filterAndOrderConfig.value.creator = id;
      store.commit("setFilterConfig", filterAndOrderConfig.value);
      router.push({ name: "Builds" });
    };

    const getCreatorName = (id) => {
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

    const sortByNameCompareFunction = (a, b) => {
      const nameA = getCreatorName(a.creatorId);
      const nameB = getCreatorName(b.creatorId);
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    };

    const initData = async () => {
      //get featured creators
      const isFeatured = true;
      const creatorsQuery = getQueryCreators(
        queryService.getQueryParametersForCreators(isFeatured, 6)
      );
      creators.value = await getAllCreators(creatorsQuery);
      creators.value.sort(sortByNameCompareFunction)
      for (const creator of creators.value) {
        creator.image = await getChannelIcon(creator.creatorId);
      }

      //get all creators
      allCreators.value = await getAllCreators();

      //get most recent
      const mostRecentQuery = getQuery(
        queryService.getQueryParametersFromConfig(mostRecentConfig.value, 5)
      );
      mostRecentBuilds.value = await getAll(mostRecentQuery);

      //get popular
      const popularBuildsQuery = getQuery(
        queryService.getQueryParametersFromConfig(popularConfig.value, 5)
      );
      popularBuilds.value = await getAll(popularBuildsQuery);

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
      creators,
      civSelected,
      creatorSelected,
      getCreatorName,
    };
  },
};
</script>
