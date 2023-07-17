<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="4" class="hidden-md-and-up">
        <BuildsConfig class="mb-2" @configChanged="configChanged">
        </BuildsConfig>
        <v-alert
          v-if="!user"
          rounded="lg"
          outlined
          color="primary"
          class="mt-4 mb-2 pa-1"
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

      <v-col cols="12" md="8">
        <div v-for="item in builds">
          <router-link
            style="text-decoration: none"
            :to="{
              name: item.loading ? 'MyFavorites' : 'BuildDetails',
              params: { id: !item.loading ? item.id : null },
            }"
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

      <v-col cols="12" md="4" class="hidden-sm-and-down">
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
import { ref, computed, onMounted, watch } from "vue";

export default {
  name: "Builds",
  components: { BuildsConfig, SingleBuild },
  setup() {
    window.scrollTo(0, 0);

    const { getAll, getQuery, getSize } = useCollection("builds");
    const { get } = useCollection("favorites");
    const builds = ref(null);
    const favorites = ref(null);
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

    const initData = async () => {
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
      //TODO: if favorites count != received favorites count, then update favorites list in DB (remove deprecated links)
      //Preferably, fix in cloud function, whenever a build is removed.
      const currentPageSize = Math.min(await getSize(paginationQuery), paginationConfig.value.limit)
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
    };
  },
};
</script>
