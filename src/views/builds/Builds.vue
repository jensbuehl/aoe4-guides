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

//Components
import RegisterAd from "@/components/notifications/RegisterAd.vue";
import NoFilterResults from "@/components/notifications/NoFilterResults.vue";
import FilterConfig from "@/components/filter/FilterConfig.vue";
import BuildListCard from "@/components/builds/BuildListCard.vue";

//Composables
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";
import { getBuilds, getBuildsCount, getBuildsFrom, getBuildsUntil } from "@/composables/data/buildService";


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
    const paginationConfig = ref({
      currentPage: 1,
      totalPages: null,
      pageStart: null,
      pageEnd: null,
      limit: 10,
    });

    const initQueryParameters = () => {
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

    initQueryParameters();

    onMounted(() => {
      initData();
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
      if (store.state.cache.myBuildsList) {
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
    };
  },
};
</script>
