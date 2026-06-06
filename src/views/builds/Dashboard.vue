<template>
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
                  <v-card-title>
                    {{
                      civs.find((item) => {
                        return item.shortName === civ;
                      })?.title
                    }}
                  </v-card-title>
                  <v-card-text>
                    {{
                      civs.find((item) => {
                        return item.shortName === civ;
                      })?.tagLine
                    }}
                  </v-card-text>
                </v-col>
              </v-row>
            </v-card></v-col
          >
          <v-col cols="12" class="hidden-md-and-up"
            ><span
              ><FilterConfig
                @configChanged="configChanged"
                context="civ-locked"
                :civName="civDisplayName"
              ></FilterConfig></span
          ></v-col>

          <v-col cols="12">
            <NoFilterResults v-if="count !== null && count === 0" @cleared="handleCleared" />
            <BuildLaneTabs
              v-else
              :popular-builds="popularBuildsList"
              :all-time-classics="allTimeClassicsList"
              :recent-builds="recentBuildsList"
              :extra-query="civ ? { civ } : {}"
            />
          </v-col>
        </v-row>
      </v-col>
      <!-- sidebar -->
      <v-col cols="8" md="4" class="hidden-sm-and-down"
        ><v-row no-gutters>
          <v-col cols="12"
            ><FilterConfig
              @configChanged="configChanged"
              context="civ-locked"
              :civName="civDisplayName"
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
import BuildLaneTabs from "@/components/home/BuildLaneTabs.vue";
import NoFilterResults from "@/components/notifications/NoFilterResults.vue";

//Composables
import { civs as allCivs } from "@/composables/filter/civDefaultProvider";
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";
import { getBuilds, getBuildsCount } from "@/composables/data/buildService";

export default {
  name: "Dashboard",
  components: {
    FilterConfig,
    BuildLaneTabs,
    NoFilterResults,
  },
  setup() {
    const allTimeClassicsList = ref(Array(10).fill({ loading: true }));
    const popularBuildsList = ref(Array(10).fill({ loading: true }));
    const recentBuildsList = ref(Array(10).fill({ loading: true }));
    const trendingCount = ref(null);
    const route = useRoute();
    const store = useStore();
    const count = computed(() => store.state.resultsCount);
    const user = computed(() => store.state.user);
    const filterConfig = computed(() => store.state.filterConfig);
    const { name } = useDisplay();
    const civs = allCivs.value;
    const civ = ref(null);
    const civDisplayName = computed(() =>
      civs.find((c) => c.shortName === civ.value)?.title ?? civ.value
    );

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

    const handleCleared = () => {
      if (route.query.civ) store.commit("setCivs", route.query.civ);
      initData();
    };

    onMounted(() => {
      store.commit("setFilterConfig", getDefaultConfig());
      initQueryParameters();
      initData();
      window.scrollTo(0, 0);
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
      allTimeClassicsList.value = Array(10).fill({ loading: true });
      popularBuildsList.value = Array(10).fill({ loading: true });
      recentBuildsList.value = Array(10).fill({ loading: true });

      civ.value = filterConfig.value.civs;

      //reset results count
      store.commit("setResultsCount", null);

      // Count first — if zero we show NoFilterResults immediately without
      // ever resolving the lists to [], which would cause a flicker through
      // BuildLaneTabs' own empty-state before the outer guard kicks in.
      var configpopularBuildsList = JSON.parse(JSON.stringify(filterConfig.value));
      configpopularBuildsList.orderBy = "score";
      trendingCount.value = await getBuildsCount(configpopularBuildsList);
      store.commit("setResultsCount", trendingCount.value);
      if (trendingCount.value === 0) return;

      //get popular
      popularBuildsList.value = await getBuilds(configpopularBuildsList, 10);

      //get all time classics
      var configAllTimeClassicsList = JSON.parse(JSON.stringify(filterConfig.value));
      configAllTimeClassicsList.orderBy = "scoreAllTime";
      allTimeClassicsList.value = await getBuilds(configAllTimeClassicsList, 10);

      //get most recent
      var configRecentBuildsList = JSON.parse(JSON.stringify(filterConfig.value));
      configRecentBuildsList.orderBy = "timeCreated";
      recentBuildsList.value = await getBuilds(configRecentBuildsList, 10);
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
      handleCleared,
      civs,
      civ,
      civDisplayName,
    };
  },
};
</script>

