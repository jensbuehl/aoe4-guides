<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="4" class="hidden-md-and-up">
        <v-card rounded="lg">
          <v-card-title
            v-if="!user"
            :style="{
              color: $vuetify.theme.themes.customDarkTheme.colors.primary,
            }"
            >Welcome, Villager!</v-card-title
          >
          <v-card-title
            v-if="user"
            :style="{
              color: $vuetify.theme.themes.customDarkTheme.colors.primary,
            }"
            >Welcome, {{ user.displayName }}!</v-card-title
          >
        </v-card>
        <v-alert
          v-if="!user && authIsReady"
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

      <v-col cols="12" md="8">
        <!-- Civilization browser -->
        <div
          class="text-h6"
          :style="{
            color: $vuetify.theme.themes.customDarkTheme.colors.primary,
          }"
          style="font-family: 'Segoe UI' !important"
        >
          Explore by Civilization
        </div>
        <v-row align="center" no-gutters>
          <v-col
            cols="12"
            sm="6"
            v-for="(civ, index) in civs"
            :key="civ.title"
            class="mt-2"
          >
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.themes.customDarkTheme.colors.primary,
                }"
                >Explore all {{ civ.title }} build orders</span
              >
              <template v-slot:activator="{ props }">
                <v-card
                  class="hidden-xs"
                  v-bind:class="{
                    'mb-2': index % 2 == 0,
                    'mb-2 ml-4': index % 2 != 0,
                  }"
                  min-height="50"
                  rounded="lg"
                  v-bind="props"
                  @click="civSelected(civ.shortName)"
                >
                  <v-row align="center" justify="center">
                    <v-col cols="3" sm="4">
                      <v-img
                        min-height="50"
                        :src="civ.flagLarge"
                        :lazy-src="civ.flagSmall"
                        gradient="to right, transparent, #1D2432"
                        alt="{{civ.title}}"
                        cover
                      >
                      </v-img>
                    </v-col>
                    <v-col cols="9" sm="8">
                      <!--small title-->
                      <div
                        :style="{
                          color:
                            $vuetify.theme.themes.customDarkTheme.colors
                              .primary,
                        }"
                        class="text-subtitle-2 hidden-lg-and-up"
                        style="font-family: 'Segoe UI' !important"
                      >
                        {{ civ.title }}
                      </div>
                      <!--large title-->
                      <v-card-title
                        class="hidden-md-and-down"
                        :style="{
                          color:
                            $vuetify.theme.themes.customDarkTheme.colors
                              .primary,
                        }"
                      >
                        {{ civ.title }}
                      </v-card-title>
                    </v-col>
                  </v-row>
                </v-card>
              </template>
            </v-tooltip>
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.themes.customDarkTheme.colors.primary,
                }"
                >Explore all {{ civ.title }} build orders</span
              >
              <template v-slot:activator="{ props }">
                <v-card
                  class="mb-2 hidden-sm-and-up"
                  min-height="50"
                  rounded="lg"
                  v-bind="props"
                  @click="civSelected(civ.shortName)"
                >
                  <v-row align="center" justify="center">
                    <v-col cols="3" sm="4">
                      <v-img
                        min-height="50"
                        :src="civ.flagLarge"
                        :lazy-src="civ.flagSmall"
                        gradient="to right, transparent, #1D2432"
                        alt="{{civ.title}}"
                        cover
                      >
                      </v-img>
                    </v-col>
                    <v-col cols="9" sm="8">
                      <!--small title-->
                      <div
                        :style="{
                          color:
                            $vuetify.theme.themes.customDarkTheme.colors
                              .primary,
                        }"
                        class="text-subtitle-2 hidden-lg-and-up"
                        style="font-family: 'Segoe UI' !important"
                      >
                        {{ civ.title }}
                      </div>
                      <!--large title-->
                      <v-card-title
                        class="hidden-md-and-down"
                        :style="{
                          color:
                            $vuetify.theme.themes.customDarkTheme.colors
                              .primary,
                        }"
                      >
                        {{ civ.title }}
                      </v-card-title>
                    </v-col>
                  </v-row>
                </v-card>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>

        <!-- Most Recent Builds -->

        <v-row align="center" no-gutters>
          <v-col cols="12">
            <div
              class="text-h6 mt-4"
              :style="{
                color: $vuetify.theme.themes.customDarkTheme.colors.primary,
              }"
              style="font-family: 'Segoe UI' !important"
            >
              New Build Orders
            </div>
            <div class="mt-2" v-for="item in mostRecentBuilds" :key="item.id">
              <router-link
                style="text-decoration: none"
                :to="{ name: 'BuildDetails', params: { id: item.id } }"
              >
                <SingleBuild :build="item"></SingleBuild>
              </router-link>
            </div> </v-col
        ></v-row>

        <!-- Popular Builds -->

        <v-row align="center" no-gutters>
          <v-col cols="12">
            <div
              class="text-h6 mt-2"
              :style="{
                color: $vuetify.theme.themes.customDarkTheme.colors.primary,
              }"
              style="font-family: 'Segoe UI' !important"
            >
              Popular Build Orders
            </div>
            <div class="mt-2" v-for="item in popularBuilds" :key="item.id">
              <router-link
                style="text-decoration: none"
                :to="{ name: 'BuildDetails', params: { id: item.id } }"
              >
                <SingleBuild :build="item"></SingleBuild>
              </router-link>
            </div> </v-col
        ></v-row>
      </v-col>

      <v-col cols="12" md="4" class="hidden-xs">
        <v-card rounded="lg">
          <v-card-title
            v-if="!user"
            :style="{
              color: $vuetify.theme.themes.customDarkTheme.colors.primary,
            }"
            >Welcome, Villager!</v-card-title
          >
          <v-card-title
            v-if="user"
            :style="{
              color: $vuetify.theme.themes.customDarkTheme.colors.primary,
            }"
            >Welcome, {{ user.displayName }}!</v-card-title
          >
          <v-card-text
            >Create new Age of Empires 4 build orders and share them with your
            friends and the community.</v-card-text
          >

          <v-card-title
            :style="{
              color: $vuetify.theme.themes.customDarkTheme.colors.primary,
            }"
            >Try new Civilizations</v-card-title
          >
          <v-card-text
            >Get started with new civilizations and find the right build order
            and play style for you.</v-card-text
          >

          <v-card-title
            :style="{
              color: $vuetify.theme.themes.customDarkTheme.colors.primary,
            }"
            >Ilalu and 80 Bunti</v-card-title
          >
          <v-card-text
            >Scout new build orders and guides every day. Learn, improve and
            master your build orders. And most importantly: Have
            fun!</v-card-text
          >
        </v-card>
        <v-alert
          v-if="!user && authIsReady"
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
import BuildsConfig from "../components/BuildsConfig.vue";
import getCivs from "../composables/getCivs";
import getDefaultConfig from "../composables/getDefaultConfig";
import SingleBuild from "../components/SingleBuild.vue";
import { useRouter } from "vue-router";
import useCollection from "../composables/useCollection";
import queryService from "../composables/queryService";
import { useStore } from "vuex";
import { ref, computed, onMounted, getCurrentInstance } from "vue";

export default {
  name: "Home",
  components: { BuildsConfig, SingleBuild },
  setup() {
    window.scrollTo(0, 0);

    const { getAll, getQuery, getSize } = useCollection("builds");
    const popularBuilds = ref(null);
    const mostRecentBuilds = ref(null);
    const civs = getCivs().civs;
    const router = useRouter();
    const store = useStore();
    const user = computed(() => store.state.user);
    const filterAndOrderConfig = computed(() => store.state.filterConfig);
    const popularConfig = ref(getDefaultConfig());
    const mostRecentConfig = ref(getDefaultConfig());
    mostRecentConfig.value.orderBy = "timeCreated";

    onMounted(() => {
      if (!filterAndOrderConfig.value) {
        store.commit("setFilterConfig", getDefaultConfig());
      }
      const instance = getCurrentInstance();
      console.log(instance.proxy.$vuetify.theme.themes);
      initData();
    });

    const civSelected = (id) => {
      filterAndOrderConfig.value.civs = id;
      store.commit("setFilterConfig", filterAndOrderConfig.value);
      router.push({ name: "Builds" });
    };

    const initData = async () => {
      //get most recent
      const mostRecentQuery = getQuery(
        queryService.getQueryParametersFromConfig(mostRecentConfig.value, 5)
      );
      mostRecentBuilds.value = await getAll(mostRecentQuery);

      //get popular
      const popularBuildsQuery = getQuery(
        queryService.getQueryParametersFromConfig(popularConfig.value, 5)
      );
      popularBuilds.value = await getAll(popularBuildsQuery);
    };

    return {
      user,
      authIsReady: computed(() => store.state.authIsReady),
      civs,
      mostRecentBuilds,
      popularBuilds,
      civSelected,
    };
  },
};
</script>
