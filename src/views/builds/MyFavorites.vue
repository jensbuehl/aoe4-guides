<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="8">
        <!-- The phone's filter toolbar, sticky, so it lives in the list's column. -->
        <FilterConfig class="hidden-md-and-up" context="default" :countFn="myFavoritesCountFn" @configChanged="configChanged"> </FilterConfig>
        <div v-if="builds" v-for="item in builds">
          <router-link
            style="text-decoration: none"
            :to="{
              name: item.loading ? 'MyFavorites' : 'BuildDetails',
              params: { id: !item.loading ? item.id : null },
            }"
          >
            <BuildListCard
              :build="item"
              :filter-config="filterConfig"
            ></BuildListCard>
          </router-link>
        </div>
        <div style="text-align: center" v-if="emptyReason">
          <NoFilterResults :favorites="emptyReason" :retrying="retrying" @retry="retry"></NoFilterResults>
        </div>
        <div style="text-align: center" v-else-if="!loading && count === 0">
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
    // Why the list is empty before any filter applies: "none" or "unreadable"
    // (see NoFilterResults). Null while unknown, so nothing claims "no
    // favorites" before the read has answered.
    const emptyReason = ref(null);
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

    // The empty state stays up while the read is out (initData sets
    // emptyReason only once it answers), so the button carries the spinner.
    const retrying = ref(false);
    const retry = async () => {
      retrying.value = true;
      try {
        await initData();
      } finally {
        retrying.value = false;
      }
    };

    const initData = async () => {
      // The user watch also fires on sign-out, before the route guard leaves.
      if (!user.value) return;

      store.commit("setLoading", true);

      //reset results count
      store.commit("setResultsCount", null);

      //reset author filter
      store.commit("setAuthor", null);

      // Favorites array is needed by both the count and list queries, so it
      // must be fetched first.
      // A missing document already reads as an empty list; only a failed read
      // comes back undefined.
      const favoritesDoc = await getUserFavoritesArray(user.value.uid);
      favorites.value = favoritesDoc?.favorites ?? [];
      emptyReason.value = !favoritesDoc ? "unreadable" : favorites.value.length ? null : "none";
      if (emptyReason.value) {
        // "0 builds" in the filter strip, as My Builds shows. Not for an
        // unreadable list: its count is unknown, not zero.
        if (emptyReason.value === "none") store.commit("setResultsCount", 0);
        builds.value = null;
        store.commit("setLoading", false);
        return;
      }

      // On a cache hit we already have the list synchronously, so show it
      // immediately instead of a skeleton (count still runs in parallel below).
      const cachedList = store.state.cache.myFavoritesList;
      builds.value = cachedList ?? Array(paginationConfig.value.limit).fill({ loading: true });

      // Given the favorites array, count and list are independent — parallelize.
      const [size, listRes] = await Promise.all([
        getUserFavoritesCount(favorites.value, filterConfig.value),
        cachedList
          ? Promise.resolve(cachedList)
          : getUserFavorites(favorites.value, filterConfig.value, paginationConfig.value.limit),
      ]);

      // The favorites document was readable but the builds it names were not
      // (buildService's cacheBuilds passes that back as undefined): the same
      // honest state as an unreadable document, with its retry.
      if (!Array.isArray(listRes)) {
        emptyReason.value = "unreadable";
        builds.value = null;
        store.commit("setLoading", false);
        return;
      }

      store.commit("setResultsCount", size);
      if (!cachedList) store.commit("setMyFavoritesList", listRes);
      builds.value = listRes;

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

      const page = await getUserFavoritesFrom(
        paginationConfig.value.pageEnd,
        favorites.value,
        filterConfig.value,
        paginationConfig.value.limit
      );
      // Unreadable: the skeletons stay up, as in initData, and nothing is cached.
      if (!Array.isArray(page)) return;
      builds.value = page;

      //set cache
      store.commit("setMyFavoritesList", builds.value);

      updatePageBoundaries();
      window.scrollTo(0, 0);
    };

    const previousPage = async () => {
      //reset cache
      store.commit("setMyFavoritesList", null);
      builds.value = Array(paginationConfig.value.limit).fill({ loading: true });

      const page = await getUserFavoritesUntil(
        paginationConfig.value.pageStart,
        favorites.value,
        filterConfig.value,
        paginationConfig.value.limit
      );
      // Unreadable: the skeletons stay up, as in initData, and nothing is cached.
      if (!Array.isArray(page)) return;
      builds.value = page;

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
      emptyReason,
      user,
      count,
      loading,
      paginationConfig,
      filterConfig,
      configChanged,
      retrying,
      retry,
      myFavoritesCountFn,
      nextPage,
      previousPage,
    };
  },
};
</script>
