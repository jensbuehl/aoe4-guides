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
      <v-col cols="12" md="4" class="hidden-md-and-up">
        <v-card
          v-if="filterConfig.author"
          flat
          class="mb-6"
          :height="contributorsCardHeight"
          rounded="lg"
        >
          <v-row no-gutters class="fill-height" align="center" justify="center"
            ><v-col cols="12"
              ><v-skeleton-loader
                :color="contributor == null ? 'loading' : 'surface'"
                :loading="contributor == null"
                :height="contributorsCardHeight"
              >
                <v-row no-gutters align="center" class="pa-2">
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
                    <v-row no-gutters>
                      <div
                        :style="{
                          color: $vuetify.theme.current.colors.primary,
                        }"
                        class="text-subtitle-2 hidden-lg-and-up mt-n1"
                        style="font-family: 'Segoe UI' !important"
                      >
                        {{ contributor.displayName }}
                      </div></v-row
                    ><v-row no-gutters class="hidden-lg-and-up mt-2">
                      <v-chip class="mr-2" label size="x-small"
                        ><v-icon start icon="mdi-eye"></v-icon>{{ contributor.viewCount }}</v-chip
                      >
                      <v-chip label size="x-small"
                        ><v-icon start icon="mdi-hammer"></v-icon>{{ contributor.boCount }}</v-chip
                      >
                    </v-row>
                  </v-col>
                </v-row>
              </v-skeleton-loader></v-col
            ></v-row
          >
        </v-card>

        <FilterConfig class="mb-2" @configChanged="configChanged"> </FilterConfig>
        <RegisterAd class="mt-4" v-if="!user && authIsReady"></RegisterAd>
      </v-col>
      <v-col cols="12" md="8">
        <div v-if="builds" v-for="item in builds">
          <router-link
            style="text-decoration: none"
            :to="{
              name: item.loading ? 'Builds' : 'BuildDetails',
              params: { id: !item.loading ? item.id : null },
            }"
          >
            <BuildListCard :build="item"></BuildListCard>
          </router-link>
        </div>
        <div style="text-align: center" v-if="!loading && count === 0">
          <NoFilterResults></NoFilterResults>
        </div>

        <v-pagination
          v-if="paginationConfig.totalPages > 1"
          @next="nextPage"
          @prev="previousPage"
          v-model="paginationConfig.currentPage"
          :length="paginationConfig.totalPages"
          total-visible="1"
          rounded="lg"
        ></v-pagination>
      </v-col>

      <v-col cols="12" md="4" class="hidden-sm-and-down">
        <v-card
          v-if="filterConfig.author"
          flat
          :height="contributorsCardHeight"
          rounded="lg"
          class="mb-2"
        >
          <v-row no-gutters class="fill-height" align="center" justify="center"
            ><v-col cols="12"
              ><v-skeleton-loader
                :color="contributor == null ? 'loading' : 'surface'"
                :loading="contributor == null"
                :height="contributorsCardHeight"
              >
                <v-row no-gutters align="center" class="pa-2">
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
                      ><!--lg title-->
                      <v-card-title
                        :style="{
                          color: $vuetify.theme.current.colors.primary,
                        }"
                        class="ml-n4 mt-n4 hidden-md-and-down"
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
                        ><v-icon start icon="mdi-eye"></v-icon>{{ contributor.viewCount }}</v-chip
                      >
                      <v-chip label size="x-small"
                        ><v-icon start icon="mdi-hammer"></v-icon>{{ contributor.boCount }}</v-chip
                      >
                    </v-row>
                    <v-row no-gutters class="hidden-md-and-down mt-n1">
                      <v-chip class="mr-2" label size="small"
                        ><v-icon start icon="mdi-eye"></v-icon>{{ contributor.viewCount }}</v-chip
                      >
                      <v-chip label size="small"
                        ><v-icon start icon="mdi-hammer"></v-icon>{{ contributor.boCount }}</v-chip
                      >
                    </v-row>
                  </v-col>
                </v-row>
              </v-skeleton-loader></v-col
            ></v-row
          >
        </v-card>
        <FilterConfig @configChanged="configChanged"> </FilterConfig>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
//External
import { useStore } from "vuex";
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";

//Components
import RegisterAd from "@/components/notifications/RegisterAd.vue";
import NoFilterResults from "@/components/notifications/NoFilterResults.vue";
import FilterConfig from "@/components/filter/FilterConfig.vue";
import BuildListCard from "@/components/builds/BuildListCard.vue";

//Composables
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";
import { getContributor } from "@/composables/data/contributorService";
import {
  getBuilds,
  getBuildsCount,
  getBuildsFrom,
  getBuildsUntil,
} from "@/composables/data/buildService";

export default {
  name: "Builds",
  components: { FilterConfig, BuildListCard, RegisterAd, NoFilterResults },
  setup() {
    const builds = ref(null);
    const store = useStore();
    const user = computed(() => store.state.user);
    const filterConfig = computed(() => store.state.filterConfig);
    const route = useRoute();
    const router = useRouter();
    const count = computed(() => store.state.resultsCount);
    const loading = computed(() => store.state.loading);
    const contributor = ref(null);
    const { name } = useDisplay();
    const paginationConfig = ref({
      currentPage: 1,
      totalPages: null,
      pageStart: null,
      pageEnd: null,
      limit: 10,
    });

    const contributorsCardHeight = computed(() => {
      switch (name.value) {
        case "xs":
          return 70;
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

    const initQueryParameters = async () => {
      //Reset config and only apply query parameters if they are set
      if (Object.keys(route.query).length) {
        store.commit("setFilterConfig", getDefaultConfig());

        //reset cache
        store.commit("setAllBuildsList", null);
        store.commit("setMyBuildsList", null);
        store.commit("setMyFavoritesList", null);
      }
      if (route.query.civ) {
        store.commit("setCivs", route.query.civ);
      }
      if (route.query.creator) {
        store.commit("setCreator", route.query.creator);
      }
      if (route.query.author) {
        store.commit("setAuthor", route.query.author);
      }
      if (route.query.orderBy) {
        store.commit("setOrderBy", route.query.orderBy);
      }      
    };

    onMounted(async () => {
      await initQueryParameters();
      initData();
      window.scrollTo(0, 0);
    });

    onBeforeUnmount(() => {
      if (paginationConfig.value.currentPage != 1) {
        //reset cache
        store.commit("setAllBuildsList", null);
      }
    });

    const configChanged = () => {
      initData();
      router.replace("/builds");
    };

    const initData = async () => {
      store.commit("setLoading", true);

      //get contributor
      contributor.value = await getContributor(filterConfig.value.author);
      console.log(contributor.value);

      //reset results count
      store.commit("setResultsCount", null);

      //init count
      const size = await getBuildsCount(filterConfig.value);
      store.commit("setResultsCount", size);

      //get page size
      const currentPageSize = Math.min(size, paginationConfig.value.limit);
      builds.value = Array(currentPageSize).fill({
        loading: true,
      });

      //get builds
      if (store.state.cache.allBuildsList) {
        builds.value = store.state.cache.allBuildsList;
      } else {
        const res = await getBuilds(filterConfig.value, paginationConfig.value.limit);
        builds.value = res;
        store.commit("setAllBuildsList", res);
      }

      //init pagination config
      paginationConfig.value.totalPages = Math.ceil(size / paginationConfig.value.limit);
      paginationConfig.value.currentPage = 1;
      updatePageBoundaries();

      store.commit("setLoading", false);
    };

    const nextPage = async () => {
      console.log("page changed to:", paginationConfig.value.currentPage);

      //reset cache
      store.commit("setAllBuildsList", null);

      builds.value = await getBuildsFrom(
        paginationConfig.value.pageEnd,
        filterConfig.value,
        paginationConfig.value.limit
      );

      //set cache
      store.commit("setAllBuildsList", builds.value);

      updatePageBoundaries();
      window.scrollTo(0, 0);
    };

    const previousPage = async () => {
      console.log("page changed to:", paginationConfig.value.currentPage);

      //reset cache
      store.commit("setAllBuildsList", null);

      builds.value = await getBuildsUntil(
        paginationConfig.value.pageStart,
        filterConfig.value,
        paginationConfig.value.limit
      );

      //set cache
      store.commit("setAllBuildsList", builds.value);

      updatePageBoundaries();
      window.scrollTo(0, 0);
    };

    const updatePageBoundaries = () => {
      var firstPageElement = builds.value[0];
      var lastPageElement = builds.value[builds.value.length - 1];
      if (builds.value.length) {
        paginationConfig.value.pageStart = firstPageElement.id;
        paginationConfig.value.pageEnd = lastPageElement.id;
      }
    };

    return {
      builds,
      user,
      count,
      loading,
      authIsReady: computed(() => store.state.authIsReady),
      paginationConfig,
      filterConfig,
      configChanged,
      nextPage,
      previousPage,
      contributor,
      contributorsCardHeight,
    };
  },
};
</script>
