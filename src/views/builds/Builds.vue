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
            <BuildListCard
              :build="item"
              :creatorName="getCreatorName(item.creatorId)"
            ></BuildListCard>
          </router-link>
        </div>
        <div style="text-align: center" v-if="count === 0">
          <NoFilterResults></NoFilterResults>
        </div>

        <v-pagination
          v-if="paginationConfig.totalPages > 1 && count != 0"
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
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

//Components
import RegisterAd from "@/components/notifications/RegisterAd.vue";
import NoFilterResults from "@/components/notifications/NoFilterResults.vue";
import FilterConfig from "@/components/filter/FilterConfig.vue";
import BuildListCard from "@/components/builds/BuildListCard.vue";

//Composables
import useCollection from "@/composables/useCollection";
import queryService from "@/composables/useQueryService";

export default {
  name: "Builds",
  components: { FilterConfig, BuildListCard, RegisterAd, NoFilterResults },
  setup() {
    window.scrollTo(0, 0);

    const { getAll, getQuery, getSize } = useCollection("builds");
    const { getAll: getAllCreators } = useCollection("creators");
    const builds = ref(null);
    const allCreators = computed(() => store.state.creators);
    const store = useStore();
    const user = computed(() => store.state.user);
    const filterAndOrderConfig = computed(() => store.state.filterConfig);
    const route = useRoute();
    const router = useRouter();
    const count = computed(() => store.state.resultsCount);
    const paginationConfig = ref({
      currentPage: 1,
      totalPages: null,
      pageStart: null,
      pageEnd: null,
      limit: 10,
    });

    const initQueryParameters = () => {
      if (route.query.civ) {
        store.commit("setCivs", route.query.civ);
      }
      if (route.query.creator) {
        store.commit("setCreator", route.query.creator);
      }
      if (route.query.author) {
        store.commit("setAuthor", route.query.author);
      }
    };

    initQueryParameters();
    onMounted(() => {
      initData();
    });

    const configChanged = () => {
      initData();
      router.replace("/builds");
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
      //reset results count
      store.commit("setResultsCount", null);

      //exclude drafts
      store.commit("setDrafts", false);

      //get builds that match the filter
      const paginationQuery = getQuery(
        queryService.getQueryParametersFromConfig(
          filterAndOrderConfig.value,
          paginationConfig.value.limit
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

      //get all creators
      if (!allCreators.value) {
        store.commit("setCreators", await getAllCreators());
      }

      //init page count, current page, and commit overall results count
      const allDocsQuery = getQuery(
        queryService.getQueryParametersFromConfig(filterAndOrderConfig.value)
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
          paginationConfig.value.pageEnd
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
          paginationConfig.value.pageStart
        )
      );
      const res = await getAll(query);
      getSize(query);
      builds.value = res;

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
      authIsReady: computed(() => store.state.authIsReady),
      paginationConfig,
      filterAndOrderConfig,
      configChanged,
      nextPage,
      previousPage,
      getCreatorName,
    };
  },
};
</script>
