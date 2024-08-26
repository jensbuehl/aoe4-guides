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
      <v-col cols="12" md="8">
        <v-row>
          <v-col cols="12"
            ><v-card rounded="lg" flat>
              <v-row no-gutters class="fill-height">
                <v-col cols="3" class="pa-0 ma-0 d-flex flex-column">
                  <v-img
                    :min-height="height"
                    :src="
                      '/' +
                      civs.find((item) => {
                        return item.shortName === civ;
                      })?.flagLarge
                    "
                    :lazy-src="
                      '/' +
                      civs.find((item) => {
                        return item.shortName === civ;
                      })?.flagSmall
                    "
                    :gradient="'to right, transparent, ' + $vuetify.theme.current.colors.surface"
                    alt="{{civ}}"
                    cover
                  >
                    <template v-slot:placeholder>
                      <v-row class="fill-height ma-0" align="center" justify="center">
                        <v-progress-circular
                          indeterminate
                          color="grey lighten-5"
                        ></v-progress-circular>
                      </v-row>
                    </template>
                  </v-img>
                </v-col>
                <v-col cols="9" align-self="center">
                  <v-card-title> Selected Civ </v-card-title>
                </v-col>
              </v-row>
            </v-card></v-col
          >
          <v-col cols="12" class="hidden-md-and-up"
            ><span
              ><FilterConfig
                @configChanged="configChanged"
                :hideCivs="true"
                :defaultCivOverride="civ"
              ></FilterConfig></span
          ></v-col>

          <v-col cols="12"
            ><!-- popular builds -->
            <v-row no-gutters align="center">
              <v-col class="ml-2 mb-2" cols="auto"
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
                </div> </v-col></v-row
          ></v-col>
        </v-row>
      </v-col>
      <!-- sidebar -->
      <v-col cols="8" md="4" class="hidden-sm-and-down"
        ><v-row no-gutters>
          <v-col cols="12"
            ><FilterConfig
              @configChanged="configChanged"
              :hideCivs="true"
              :defaultCivOverride="civ"
            ></FilterConfig
          ></v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
//External
import { useStore } from "vuex";
import { computed, ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";

//Components
import FilterConfig from "@/components/filter/FilterConfig.vue";
import BuildListCard from "@/components/builds/BuildListCard.vue";

//Composables
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";
import { civs as allCivs } from "@/composables/filter/civDefaultProvider";
import { getBuilds, getBuildsCount } from "@/composables/data/buildService";

export default {
  name: "Dashboard",
  components: {
    FilterConfig,
    BuildListCard,
  },
  setup() {
    const allTimeClassicsList = ref(Array(5).fill({ loading: true }));
    const popularBuildsList = ref(Array(5).fill({ loading: true }));
    const recentBuildsList = ref(Array(5).fill({ loading: true }));
    const route = useRoute();
    const store = useStore();
    const count = computed(() => store.state.resultsCount);
    const user = computed(() => store.state.user);
    const filterConfig = computed(() => store.state.filterConfig);
    const { name } = useDisplay();
    const civs = allCivs.value;
    const civ = ref(null);

    const initQueryParameters = async () => {
      //pply query parameters if they are set
      if (route.query.civ) {
        store.commit("setCivs", route.query.civ);
        civ.value = route.query.civ;
      }
    };

    const configChanged = () => {
      initData();
    };

    onMounted(() => {
      initQueryParameters();
      initData();
    });

    const height = computed(() => {
      switch (name.value) {
        case "xs":
          return 90;
        case "sm":
          return 125;
        case "md":
          return 90;
        case "lg":
          return 112;
        case "xl":
          return 125;
        case "xxl":
          return 125;
      }
    });

    const initData = async () => {
      allTimeClassicsList.value = Array(5).fill({ loading: true });
      popularBuildsList.value = Array(5).fill({ loading: true });
      recentBuildsList.value = Array(5).fill({ loading: true });
      
      civ.value = filterConfig.value.civs;

      //reset results count
      store.commit("setResultsCount", null);

      //get popular
      popularBuildsList.value = await getBuilds(filterConfig.value, 5);
      //TODO: set order by setting!

      //get all time classics
      allTimeClassicsList.value = await getBuilds(filterConfig.value, 5);
      //TODO: set order by setting!

      //get most recent
      recentBuildsList.value = await getBuilds(filterConfig.value, 5);
      //TODO: set order by setting!

      //get count
      const size = await getBuildsCount();
      store.commit("setResultsCount", size);
    };

    return {
      user,
      authIsReady: computed(() => store.state.authIsReady),
      count,
      recentBuildsList,
      popularBuildsList,
      allTimeClassicsList,
      height,
      configChanged,
      civs,
      civ,
    };
  },
};
</script>
