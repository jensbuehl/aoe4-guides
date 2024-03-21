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
        <RegisterAd v-if="!user && authIsReady"></RegisterAd>
      </v-col>

      <v-col cols="12" md="8">
        <v-row v-if="drafts?.length" no-gutters
          ><div class="text-h6 mt-4 ml-4 mb-2">My Drafts</div></v-row
        >
        <v-row v-if="drafts?.length" align="center" no-gutters>
          <v-col cols="12">
            <div v-if="drafts?.length" v-for="item in drafts">
              <router-link
                style="text-decoration: none"
                :to="{
                  name: item.loading ? 'MyBuilds' : 'BuildDetails',
                  params: { id: !item.loading ? item.id : null },
                }"
              >
                <BuildListCard :build="item"></BuildListCard>
              </router-link></div
          ></v-col>
        </v-row>

        <div v-if="drafts?.length" class="text-h6 mt-4 ml-4 mb-2">My Builds</div>
        <div v-if="builds" v-for="item in builds">
          <router-link
            style="text-decoration: none"
            :to="{
              name: item.loading ? 'MyBuilds' : 'BuildDetails',
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
        <RegisterAd class="mt-6" v-if="!user && authIsReady"></RegisterAd>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
//External
import { useStore } from "vuex";
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";

//Components
import RegisterAd from "@/components/notifications/RegisterAd.vue";
import FilterConfig from "@/components/filter/FilterConfig.vue";
import BuildListCard from "@/components/builds/BuildListCard.vue";
import NoFilterResults from "@/components/notifications/NoFilterResults.vue";

//Composables
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";
import { getUserDrafts, getUserBuilds, getUserBuildsCount, getUserBuildsFrom, getUserBuildsUntil } from "@/composables/data/buildService";

export default {
  name: "Builds",
  components: { FilterConfig, BuildListCard, RegisterAd, NoFilterResults },
  setup() {
    const builds = ref(null);
    const drafts = ref(null);
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
          store.commit("setFilterConfig", getDefaultConfig());
        }
        initData();
      }
    );

    onMounted(() => {
      if (!filterConfig.value) {
        store.commit("setFilterConfig", getDefaultConfig());
      }
      if (user.value) {
        initData();
      }
    });

    onBeforeUnmount(() => {
      if (paginationConfig.value.currentPage != 1) {
        //reset cache
        store.commit("setMyBuildsList", null);
      }
    });

    const configChanged = () => {
      initData();
    };

    const initData = async () => {
      store.commit("setLoading", true);

      //reset results count
      store.commit("setResultsCount", null);

      //reset author filter
      store.commit("setAuthor", null);

      //get drafts
      drafts.value = await getUserDrafts(user.value.uid);

      //init count
      const size = await getUserBuildsCount(user.value.uid, filterConfig.value);
      store.commit("setResultsCount", size);

      //get page size
      const currentPageSize = Math.min(size, paginationConfig.value.limit);
      builds.value = Array(currentPageSize).fill({
        loading: true,
      });

      //get my builds
      if (store.state.cache.myBuildsList) {
        builds.value = store.state.cache.myBuildsList;
      } else {
        const res = await getUserBuilds(
          user.value.uid,
          filterConfig.value,
          paginationConfig.value.limit
        );
        builds.value = res;
        store.commit("setMyBuildsList", res);
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
      store.commit("setMyBuildsList", null);

      builds.value = await getUserBuildsFrom(
        user.value.uid,
        paginationConfig.value.pageEnd,
        filterConfig.value,
        paginationConfig.value.limit
      );

      updatePageBoundaries();
      window.scrollTo(0, 0);
    };

    const previousPage = async () => {
      console.log("page changed to:", paginationConfig.value.currentPage);

      //reset cache
      store.commit("setMyBuildsList", null);

      builds.value = await getUserBuildsUntil(
        user.value.uid,
        paginationConfig.value.pageStart,
        filterConfig.value,
        paginationConfig.value.limit
      );

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
      drafts,
      user,
      count,
      loading,
      authIsReady: computed(() => store.state.authIsReady),
      paginationConfig,
      configChanged,
      nextPage,
      previousPage,
    };
  },
};
</script>
