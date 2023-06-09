<template>
  <v-container v-if="builds">
    <v-row>
      <v-col cols="12" md="8">
        <div v-for="item in builds" :key="item.id">
          <router-link
            style="text-decoration: none"
            :to="{ name: 'BuildDetails', params: { id: item.id } }"
          >
            <SingleBuild :build="item"></SingleBuild>
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

      <v-col cols="12" md="4">
        <BuildsConfig @configChanged="configChanged"> </BuildsConfig>
        <v-alert
          v-if="!user"
          rounded="lg"
          outlined
          color="primary"
          class="mt-4 pa-1"
          ><v-card rounded="lg">

            <v-list lines="two">
              <v-list-item>
                <v-label>New Villager?</v-label>
                <v-btn
                  class="pb-1"
                  color="primary"
                  style="background-color: transparent"
                  variant="plain"
                  to="/register"
                >
                  Register now!
                </v-btn>
              </v-list-item>
              <v-list-item
                title="Create"
                subtitle="Create new Age of Empires 4 build orders and share them with your friends."
              ></v-list-item>
              <v-list-item
                title="Like"
                subtitle="Manage your own favorite AoE 4 build orders and find the good ones with ease."
              ></v-list-item>
              <v-list-item
                title="Comment"
                subtitle="Write build order comments and get in touch with the author and the community."
              ></v-list-item>
              <v-list-item
                title="Sign up"
                subtitle="Registered villagers gather and manage build orders up to 20% faster. ;)"
              ></v-list-item>
            </v-list> </v-card
        ></v-alert>
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
import { ref, computed, onMounted, getCurrentInstance } from "vue";

export default {
  name: "Builds",
  components: { BuildsConfig, SingleBuild },
  setup() {
    window.scrollTo(0, 0);

    const { getAll, getQuery, getSize } = useCollection("builds");
    const builds = ref(null);
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

    onMounted(() => {
      if (!filterAndOrderConfig.value) {
        store.commit("setFilterConfig", getDefaultConfig());
      }
      const instance = getCurrentInstance()
      console.log(instance.proxy.$vuetify.theme.themes)
      initData();
    });

    const configChanged = () => {
      initData();
    };

    const initData = async () => {
      //get builds
      const paginationQuery = getQuery(
        queryService.getQueryParametersFromConfig(
          filterAndOrderConfig.value,
          paginationConfig.value.limit
        )
      );
      const res = await getAll(paginationQuery);
      builds.value = res;
      
      //init page count and current page
      const allDocsQuery = getQuery(
        queryService.getQueryParametersFromConfig(filterAndOrderConfig.value)
      );
      const size = await getSize(allDocsQuery);
      store.commit("setResultsCount", size)
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
      authIsReady: computed(() => store.state.authIsReady),
      paginationConfig,
      filterAndOrderConfig,
      configChanged,
      nextPage,
      previousPage,
    };
  },
};
</script>
