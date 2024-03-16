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
        <FilterConfig class="mb-2" @configChanged="configChanged">
        </FilterConfig>
        <RegisterAd v-if="!user && authIsReady"></RegisterAd>
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
            <BuildListCard
              :build="item"
              :creatorName="getCreatorName(item.creatorId)"
            ></BuildListCard>
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
        <RegisterAd class="mt-6" v-if="!user && authIsReady"></RegisterAd>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
//External
import { useStore } from "vuex";
import { ref, computed, onMounted, watch } from "vue";

//Components
import RegisterAd from "@/components/notifications/RegisterAd.vue";
import FilterConfig from "@/components/filter/FilterConfig.vue";
import BuildListCard from "@/components/builds/BuildListCard.vue";
import NoFilterResults from "@/components/notifications/NoFilterResults.vue";

//Composables
import { getDefaultConfig } from "@/composables/filter/defaultConfigService";
import useCollection from "@/composables/useCollection";
import queryService from "@/composables/useQueryService";

export default {
  name: "Builds",
  components: { FilterConfig, BuildListCard, RegisterAd, NoFilterResults },
  setup() {
    const { getAll, getQuery, getSize } = useCollection("builds");
    const { get } = useCollection("favorites");
    const { getAll: getAllCreators, getQuery: getQueryCreators } =
      useCollection("creators");
    const builds = ref(null);
    const favorites = ref(null);
    const allCreators = computed(() => store.state.cache.creators);
    const store = useStore();
    const user = computed(() => store.state.user);
    const filterAndOrderConfig = computed(() => store.state.filterConfig);
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
        if (!filterAndOrderConfig.value) {
          store.commit("setFilterConfig", getDefaultConfig());
        }
        initData();
      }
    );

    onMounted(() => {
      if (!filterAndOrderConfig.value) {
        store.commit("setFilterConfig", getDefaultConfig());
      }
      if (user.value) {
        initData();
      }
    });

    const configChanged = () => {
      initData();
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

    const initData = async () => {
      store.commit("setLoading", true);

      //reset results count
      store.commit("setResultsCount", null);

      //exclude drafts
      store.commit("setDrafts", false);

      //reset author filter
      store.commit("setAuthor", null);

      //get favorites list
      favorites.value = await get(user.value.uid).then((user) => {
        return user.favorites;
      });
      console.log("favorites", favorites.value);
      if (!favorites.value.length > 0) {
        builds.value = null;
        return;
      }

      //get all creators
      if (!allCreators.value) {
        store.commit("setCreators", await getAllCreators());
      }

      //init page count and current page
      const allDocsQuery = getQuery(
        queryService.getQueryParametersFromConfig(
          filterAndOrderConfig.value,
          null,
          null,
          favorites.value
        )
      );
      const size = await getSize(allDocsQuery);
      store.commit("setResultsCount", size);
      paginationConfig.value.totalPages = Math.ceil(
        size / paginationConfig.value.limit
      );
      paginationConfig.value.currentPage = 1;

      //get builds query
      const paginationQuery = getQuery(
        queryService.getQueryParametersFromConfig(
          filterAndOrderConfig.value,
          paginationConfig.value.limit,
          null,
          favorites.value
        )
      );
      const currentPageSize = Math.min(
        await getSize(paginationQuery),
        paginationConfig.value.limit
      );
      builds.value = Array(currentPageSize).fill({
        loading: true,
      });

      //get builds
      var res = null;
      if (store.state.cache.allBuildsList) {
        console.log("loading from cache"); 
        res = store.state.cache.allBuildsList;
      } else {
        res = await getAll(paginationQuery);
        store.commit("setAllBuildsList", res);
      }
      builds.value = res;
      store.commit("setBuilds", res);

      updatePageBoundaries();
      store.commit("setLoading", false);
    };

    const nextPage = async () => {
      console.log("page changed to:", paginationConfig.value.currentPage);

      //reset cache
      store.commit("setAllBuildsList", null);
      store.commit("setMyBuildsList", null);
      store.commit("setMyFavoritesList", null);

      const query = getQuery(
        queryService.getQueryParametersNextPage(
          filterAndOrderConfig.value,
          paginationConfig.value.limit,
          paginationConfig.value.pageEnd,
          null,
          favorites.value
        )
      );
      const res = await getAll(query);
      builds.value = res;
      store.commit("setBuilds", res);
      getSize(query);

      updatePageBoundaries();
      window.scrollTo(0, 0);
    };

    const previousPage = async () => {
      console.log("page changed to:", paginationConfig.value.currentPage);

      //reset cache
      store.commit("setAllBuildsList", null);
      store.commit("setMyBuildsList", null);
      store.commit("setMyFavoritesList", null);

      const query = getQuery(
        queryService.getQueryParametersPreviousPage(
          filterAndOrderConfig.value,
          paginationConfig.value.limit,
          paginationConfig.value.pageStart,
          null,
          favorites.value
        )
      );
      const res = await getAll(query);
      builds.value = res;
      store.commit("setBuilds", res);
      getSize(query);

      updatePageBoundaries();
      window.scrollTo(0, 0);
    };

    const updatePageBoundaries = () => {
      if (builds.value.length) {
        paginationConfig.value.pageStart =
          builds.value[0][filterAndOrderConfig.value.orderBy];
        paginationConfig.value.pageEnd =
          builds.value[builds.value.length - 1][
            filterAndOrderConfig.value.orderBy
          ];
      }
    };

    return {
      builds,
      user,
      count,
      loading,
      authIsReady: computed(() => store.state.authIsReady),
      paginationConfig,
      configChanged,
      nextPage,
      previousPage,
      getCreatorName,
    };
  },
};
</script>
