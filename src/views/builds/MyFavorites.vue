<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="4" class="hidden-md-and-up">
        <BuildsConfig class="mb-2" @configChanged="configChanged">
        </BuildsConfig>
        <v-alert
          v-if="!user && authIsReady"
          rounded="lg"
          outlined
          color="primary"
          class="mt-4 pa-1"
        >
          <v-card rounded="lg">
            <v-card-title v-if="!user">Create</v-card-title>
            <v-card-text
              >Create new Age of Empires 4 build orders and share them with your
              friends.</v-card-text
            >

            <v-card-title>Like</v-card-title>
            <v-card-text
              >Manage your own favorite AoE 4 build orders and find the good
              ones with ease.</v-card-text
            >

            <v-card-title>Comment</v-card-title>
            <v-card-text
              >Write build order comments and get in touch with the author and
              the community.</v-card-text
            >

            <v-card-title>Sign up</v-card-title>
            <v-card-text
              >Registered villagers gather and manage build orders up to 20%
              faster. ;)</v-card-text
            >
            <v-list-item>
              <span>New Villager?</span>
              <v-btn
                size="small"
                color="primary"
                style="background-color: transparent"
                variant="plain"
                to="/register"
              >
                Register now!
              </v-btn>
            </v-list-item>
          </v-card></v-alert
        >
      </v-col>

      <v-col cols="12" md="8">
        <div v-for="item in builds">
          <router-link
            style="text-decoration: none"
            :to="{
              name: item.loading ? 'MyFavorites' : 'BuildDetails',
              params: { id: !item.loading ? item.id : null },
            }"
          >
            <SingleBuild
              :build="item"
              :creatorName="getCreatorName(item.creatorId)"
            ></SingleBuild>
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
        <BuildsConfig @configChanged="configChanged"> </BuildsConfig>
        <v-alert
          v-if="!user && authIsReady"
          rounded="lg"
          outlined
          color="primary"
          class="mt-4 pa-1"
        >
          <v-card rounded="lg">
            <v-card-title v-if="!user">Create</v-card-title>
            <v-card-text
              >Create new Age of Empires 4 build orders and share them with your
              friends.</v-card-text
            >

            <v-card-title>Like</v-card-title>
            <v-card-text
              >Manage your own favorite AoE 4 build orders and find the good
              ones with ease.</v-card-text
            >

            <v-card-title>Comment</v-card-title>
            <v-card-text
              >Write build order comments and get in touch with the author and
              the community.</v-card-text
            >

            <v-card-title>Sign up</v-card-title>
            <v-card-text
              >Registered villagers gather and manage build orders up to 20%
              faster. ;)</v-card-text
            >
            <v-list-item>
              <span>New Villager?</span>
              <v-btn
                size="small"
                color="primary"
                style="background-color: transparent"
                variant="plain"
                to="/register"
              >
                Register now!
              </v-btn>
            </v-list-item>
          </v-card></v-alert
        >
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

    const { getAll, getQuery, getSize } = useCollection("builds");
    const { get } = useCollection("favorites");
    const { getAll: getAllCreators, getQuery: getQueryCreators } =
      useCollection("creators");
    const builds = ref(null);
    const favorites = ref(null);
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
      //get all creators
      creators.value = await getAllCreators();

      //get favorites list
      favorites.value = await get(user.value.uid).then((user) => {
        return user.favorites;
      });
      console.log("favorites", favorites.value);
      if (!favorites.value.length > 0) {
        builds.value = null;
        return;
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

      //get builds that match the filter
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
      const res = await getAll(paginationQuery);
      builds.value = res;

      updatePageBoundaries();
    };

    const nextPage = async () => {
      console.log("page changed to:", paginationConfig.value.currentPage);
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
          null,
          favorites.value
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
      getCreatorName
    };
  },
};
</script>
