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
                      civs.find((item) => {
                        return item.shortName === civ;
                      })?.flagLarge
                    "
                    :lazy-src="
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
              :context="civ ? 'civ-locked' : 'default'"
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

    // Monotonic token identifying the latest initData run, so responses from
    // a superseded run never overwrite the current one.
    let initDataRun = 0;

    const initData = async () => {
      const runId = ++initDataRun;
      allTimeClassicsList.value = Array(10).fill({ loading: true });
      popularBuildsList.value = Array(10).fill({ loading: true });
      recentBuildsList.value = Array(10).fill({ loading: true });

      civ.value = filterConfig.value.civs;

      //reset results count
      store.commit("setResultsCount", null);

      // The count and the three lane queries are independent, so run them in
      // parallel instead of stacking four sequential round-trips.
      var configpopularBuildsList = JSON.parse(JSON.stringify(filterConfig.value));
      configpopularBuildsList.orderBy = "score";
      var configAllTimeClassicsList = JSON.parse(JSON.stringify(filterConfig.value));
      configAllTimeClassicsList.orderBy = "scoreAllTime";
      var configRecentBuildsList = JSON.parse(JSON.stringify(filterConfig.value));
      configRecentBuildsList.orderBy = "timeCreated";

      const countPromise = getBuildsCount(configpopularBuildsList);
      const lanes = [
        { promise: getBuilds(configpopularBuildsList, 10), target: popularBuildsList },
        { promise: getBuilds(configAllTimeClassicsList, 10), target: allTimeClassicsList },
        { promise: getBuilds(configRecentBuildsList, 10), target: recentBuildsList },
      ];

      // The count aggregation is consistently the slowest of the four queries,
      // so each lane renders as soon as its own query resolves instead of
      // waiting for the whole batch. An empty lane result stays a skeleton:
      // only the count decides between "no results for this filter"
      // (NoFilterResults) and data, avoiding a flash of BuildLaneTabs' own
      // empty state.
      for (const { promise, target } of lanes) {
        promise
          .then((builds) => {
            if (runId === initDataRun && builds.length > 0) target.value = builds;
          })
          .catch(() => {}); // rejections surface via the await below
      }

      // Still await the lanes so a mid-flight supersede is detected and any
      // rejection surfaces; the progressive handlers above already assigned
      // their results, so only the count value is needed here.
      const [count] = await Promise.all([
        countPromise,
        ...lanes.map((lane) => lane.promise),
      ]);

      // A newer initData run (filter change mid-flight) supersedes this one.
      if (runId !== initDataRun) return;

      // Commit the count: >0 keeps the progressively-assigned lanes on screen;
      // ===0 leaves the lanes as skeletons and flips the template to
      // NoFilterResults (gated on count), so there is no empty-state flicker.
      trendingCount.value = count;
      store.commit("setResultsCount", count);
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

