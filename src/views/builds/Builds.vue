<template>
  <v-container v-if="builds">
    <v-row>
      <v-col>
        <v-container class="pt-0" v-for="item in builds" :key="item.id">
          <router-link
            style="text-decoration: none"
            :to="{ name: 'BuildDetails', params: { id: item.id } }"
          >
            <SingleBuild :build="item"></SingleBuild>
          </router-link>
        </v-container>
        
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

      <v-col cols="12" md="4">
        <BuildsConfig class="mr-0 mr-md-4" @configChanged="configChanged">
        </BuildsConfig>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import BuildsConfig from "../../components/BuildsConfig.vue";
import getDefaultConfig from "../../composables/getDefaultConfig";
import SingleBuild from "../../components/SingleBuild.vue";
import useCollection from "../../composables/useCollection";
import queryService from "../../composables/queryService";
import { useStore } from "vuex";
import { ref, computed, onMounted, watch } from "vue";

export default {
  name: "Builds",
  components: { BuildsConfig, SingleBuild },
  setup() {
    window.scrollTo(0, 0);

    const { getCustom, getQuery, getSize } = useCollection("builds");
    const builds = ref(null);
    const store = useStore();
    const user = computed(() => store.state.user);
    const filterAndOrderConfig = ref(getDefaultConfig());
    const paginationConfig = ref({
      currentPage: 1,
      totalPages: null,
      pageStart: null,
      pageEnd: null,
      limit: 20,
    });

    onMounted(() => {
      initData();
    });

    const configChanged = (newConfig) => {
      console.log("config changed:", newConfig);
      filterAndOrderConfig.value = newConfig;
      initData();
    };

    const initData = async () => {
      //init page count and current page
      const allDocsQuery = getQuery(
        queryService.getQueryParametersFromConfig(filterAndOrderConfig.value)
      );
      const size = await getSize(allDocsQuery);
      paginationConfig.value.totalPages = Math.ceil(
        size / paginationConfig.value.limit
      );
      paginationConfig.value.currentPage = 1;
      console.log("page changed to:", paginationConfig.value.currentPage);
      console.log("total pages", paginationConfig.value.totalPages);

      //get builds
      const paginationQuery = getQuery(
        queryService.getQueryParametersFromConfig(
          filterAndOrderConfig.value,
          paginationConfig.value.limit
        )
      );
      const res = await getCustom(paginationQuery);
      builds.value = res;

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
      const res = await getCustom(query);
      builds.value = res;
      getSize(query);

      updatePageBoundaries();
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
      const res = await getCustom(query);
      getSize(query);
      builds.value = res;

      updatePageBoundaries();
    };

    const updatePageBoundaries = () => {
      if (builds.value.length) {
        paginationConfig.value.pageStart =
          builds.value[0][filterAndOrderConfig.value.orderBy];
        paginationConfig.value.pageEnd =
          builds.value[builds.value.length - 1][
            filterAndOrderConfig.value.orderBy
          ];
        console.log("page start", paginationConfig.value.pageStart);
        console.log("page end", paginationConfig.value.pageEnd);
      }
    };

    return {
      builds,
      user,
      authIsReady: computed(() => store.state.authIsReady),
      paginationConfig,
      configChanged,
      nextPage,
      previousPage
    };
  },
};
</script>
