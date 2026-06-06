<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="4" class="hidden-md-and-up">
        <FilterConfig class="mb-2" context="default" :countFn="myBuildsCountFn" @configChanged="configChanged"> </FilterConfig>
      </v-col>

      <v-col cols="12" md="8">
        <div v-if="drafts?.length && paginationConfig.currentPage === 1" v-for="item in drafts">
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
        <FilterConfig context="default" :countFn="myBuildsCountFn" @configChanged="configChanged"> </FilterConfig>
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
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";
import { getUserDrafts, getUserBuilds, getUserBuildsCount, getUserBuildsFrom, getUserBuildsUntil } from "@/composables/data/buildService";

export default {
  name: "Builds",
  components: { FilterConfig, BuildListCard, NoFilterResults },
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
      store.commit("setFilterConfig", getDefaultConfig());
      store.commit("setMyBuildsList", null);
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

    const myBuildsCountFn = (config) => {
      if (!user.value?.uid) return Promise.resolve(0);
      return getUserBuildsCount(user.value.uid, config);
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
      //reset cache
      store.commit("setMyBuildsList", null);
      builds.value = Array(paginationConfig.value.limit).fill({ loading: true });

      builds.value = await getUserBuildsFrom(
        user.value.uid,
        paginationConfig.value.pageEnd,
        filterConfig.value,
        paginationConfig.value.limit
      );

      //set cache
      store.commit("setMyBuildsList", builds.value);

      updatePageBoundaries();
      window.scrollTo(0, 0);
    };

    const previousPage = async () => {
      //reset cache
      store.commit("setMyBuildsList", null);
      builds.value = Array(paginationConfig.value.limit).fill({ loading: true });

      builds.value = await getUserBuildsUntil(
        user.value.uid,
        paginationConfig.value.pageStart,
        filterConfig.value,
        paginationConfig.value.limit
      );

      //set cache
      store.commit("setMyBuildsList", builds.value);

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
      paginationConfig,
      configChanged,
      myBuildsCountFn,
      nextPage,
      previousPage,
    };
  },
};
</script>
