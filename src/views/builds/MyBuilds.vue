<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="4" class="hidden-md-and-up">
        <FilterConfig class="mb-2" @configChanged="configChanged">
        </FilterConfig>
        <RegisterAd v-if="!user && authIsReady"></RegisterAd>
      </v-col>

      <v-col cols="12" md="8">
        <div v-for="item in builds">
          <router-link
            style="text-decoration: none"
            :to="{
              name: item.loading ? 'MyBuilds' : 'BuildDetails',
              params: { id: !item.loading ? item.id : null },
            }"
          >
            <BuildListCard
              :build="item"
              :creatorName="getCreatorName(item.creatorId)"
            ></BuildListCard>
          </router-link>
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
import RegisterAd from "../../components/RegisterAd.vue";
import FilterConfig from "../../components/filter/FilterConfig.vue";
import getDefaultConfig from "../../composables/filter/getDefaultConfig";
import BuildListCard from "../../components/builds/BuildListCard.vue";
import useCollection from "../../composables/useCollection";
import queryService from "../../composables/useQueryService";
import { useStore } from "vuex";
import { ref, computed, onMounted, watch } from "vue";

export default {
  name: "Builds",
  components: { FilterConfig, BuildListCard, RegisterAd },
  setup() {
    window.scrollTo(0, 0);

    const { getAll, getQuery, getSize } = useCollection("builds");
    const { getAll: getAllCreators } =
      useCollection("creators");
    const builds = ref(null);
    const creators = ref(null);
    const store = useStore();
    const user = computed(() => store.state.user);
    const filterAndOrderConfig = computed(() => store.state.filterConfig);
    const paginationConfig = ref({
      currentPage: 1,
      totalPages: null,
      pageStart: null,
      pageEnd: null,
      limit: 20,
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
      if (creators.value) {
        const currentCreator = creators.value.find(
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
      //reset results count
      store.commit("setResultsCount", null);
      
      //include drafts
      store.commit ("setDrafts", true)

      //reset author filter
      store.commit("setAuthor", null);

      //get all creators
      creators.value = await getAllCreators();

      //get builds that match the filter
      const paginationQuery = getQuery(
        queryService.getQueryParametersFromConfig(
          filterAndOrderConfig.value,
          paginationConfig.value.limit,
          user.value.uid
        )
      );
      const currentPageSize = Math.min(
        await getSize(paginationQuery),
        paginationConfig.value.limit
      );
      builds.value = Array(currentPageSize).fill({
        loading: true,
      });
      const res = await getAll(paginationQuery);
      builds.value = res;

      //init page count, current page, and commit overall results count
      const allDocsQuery = getQuery(
        queryService.getQueryParametersFromConfig(
          filterAndOrderConfig.value,
          null,
          user.value.uid
        )
      );
      const size = await getSize(allDocsQuery);
      store.commit("setResultsCount", size);
      paginationConfig.value.totalPages = Math.ceil(
        size / paginationConfig.value.limit
      );
      paginationConfig.value.currentPage = 1;

      updatePageBoundaries();
    };

    const nextPage = async () => {
      console.log("page changed to:", paginationConfig.value.currentPage);
      const query = getQuery(
        queryService.getQueryParametersNextPage(
          filterAndOrderConfig.value,
          paginationConfig.value.limit,
          paginationConfig.value.pageEnd,
          user.value.uid
        )
      );
      const res = await getAll(query);
      builds.value = res;
      getSize(query);

      updatePageBoundaries();
      window.scrollTo(0, 0);
    };

    const previousPage = async () => {
      console.log("page changed to:", paginationConfig.value.currentPage);
      const query = getQuery(
        queryService.getQueryParametersPreviousPage(
          filterAndOrderConfig.value,
          paginationConfig.value.limit,
          paginationConfig.value.pageStart,
          user.value.uid
        )
      );
      const res = await getAll(query);
      builds.value = res;
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
