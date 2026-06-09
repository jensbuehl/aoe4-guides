<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="4" class="hidden-md-and-up">
        <FilterConfig class="mb-2" context="default" :countFn="myFavoritesCountFn" @configChanged="configChanged"> </FilterConfig>
      </v-col>

      <v-col cols="12" md="8">
        <div v-if="builds" v-for="item in builds">
          <router-link
            style="text-decoration: none"
            :to="{
              name: item.loading ? 'MyFavorites' : 'BuildDetails',
              params: { id: !item.loading ? item.id : null },
            }"
          >
            <BuildListCard :build="item"></BuildListCard>
          </router-link>
        </div>
        <div style="text-align: center" v-if="!loading && count === 0">
          <NoFilterResults @cleared="configChanged"></NoFilterResults>
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
        <FilterConfig context="default" :countFn="myFavoritesCountFn" @configChanged="configChanged"> </FilterConfig>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
//External
import { useStore } from "vuex";
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";

//Components
import FilterConfig from "@/components/filter/FilterConfig.vue";
import BuildListCard from "@/components/builds/BuildListCard.vue";
import NoFilterResults from "@/components/notifications/NoFilterResults.vue";

//Composables
import { getMostRecentBuildsConfig } from "@/composables/filter/configDefaultProvider";
import { getUserFavorites as getUserFavoritesArray } from "@/composables/data/favoriteService";
import {
  getUserFavorites,
  getUserFavoritesFrom,
  getUserFavoritesUntil,
  getUserFavoritesCount,
} from "@/composables/data/buildService";

export default {
  name: "Builds",
  components: { FilterConfig, BuildListCard, NoFilterResults },
  setup() {
    const builds = ref(null);
    const favorites = ref(null);
    const store = useStore();
    const user = computed(() => store.state.user);
    const filterConfig = computed(() => store.state.filterConfig);
    const count = computed(() => store.state.resultsCount);
    const loading = computed(() => store.state.loading);
    const paginationConfig = ref({
      currentPage: 1,
      totalPages: null,
      pageStart: null,
      pageEnd: null,
      limit: 10,
    });

    watch(
      () => user.value,
      () => {
        if (!filterConfig.value) {
          store.commit("setFilterConfig", getMostRecentBuildsConfig());
        }
        initData();
      }
    );

    onMounted(() => {
      store.commit("setFilterConfig", getMostRecentBuildsConfig());
      store.commit("setMyFavoritesList", null);
      if (user.value) {
        initData();
      }
    });

    onBeforeUnmount(() => {
      if (paginationConfig.value.currentPage != 1) {
        //reset cache
        store.commit("setMyFavoritesList", null);
      }
    });

    const myFavoritesCountFn = (config) => {
      if (!favorites.value?.length) return Promise.resolve(0);
      return getUserFavoritesCount(favorites.value, config);
    };

    const configChanged = () => {
      initData();
    };

    const initData = async () => {
      store.commit("setLoading", true);

      //reset results count
      store.commit("setResultsCount", null);

      //reset author filter
      store.commit("setAuthor", null);

      //get favorites array
      favorites.value = await getUserFavoritesArray(user.value.uid).then((user) => {
        return user.favorites;
      });
      if (!favorites.value.length > 0) {
        builds.value = null;
        return;
      }

      //init count
      const size = await getUserFavoritesCount(favorites.value, filterConfig.value);
      store.commit("setResultsCount", size);

      //get page size
      const currentPageSize = Math.min(size, paginationConfig.value.limit);
      builds.value = Array(currentPageSize).fill({
        loading: true,
      });

      //get favorites
      if (store.state.cache.myFavoritesList) {
        builds.value = store.state.cache.myFavoritesList;
      } else {
        const res = await getUserFavorites(
          favorites.value,
          filterConfig.value,
          paginationConfig.value.limit
        );
        builds.value = res;
        store.commit("setMyFavoritesList", res);
      }

      //init pagination config
      paginationConfig.value.totalPages = Math.ceil(size / paginationConfig.value.limit);
      paginationConfig.value.currentPage = 1;
      updatePageBoundaries();

      store.commit("setLoading", false);
    };

    const nextPage = async () => {
      //reset cache
      store.commit("setMyFavoritesList", null);
      builds.value = Array(paginationConfig.value.limit).fill({ loading: true });

      builds.value = await getUserFavoritesFrom(
        paginationConfig.value.pageEnd,
        favorites.value,
        filterConfig.value,
        paginationConfig.value.limit
      );

      //set cache
      store.commit("setMyFavoritesList", builds.value);

      updatePageBoundaries();
      window.scrollTo(0, 0);
    };

    const previousPage = async () => {
      //reset cache
      store.commit("setMyFavoritesList", null);
      builds.value = Array(paginationConfig.value.limit).fill({ loading: true });

      builds.value = await getUserFavoritesUntil(
        paginationConfig.value.pageStart,
        favorites.value,
        filterConfig.value,
        paginationConfig.value.limit
      );

      //set cache
      store.commit("setMyFavoritesList", builds.value);

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
      paginationConfig,
      configChanged,
      myFavoritesCountFn,
      nextPage,
      previousPage,
    };
  },
};
</script>
