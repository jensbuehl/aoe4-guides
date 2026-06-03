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
      <v-col cols="12" md="8">
        <!-- Civ filter box (all screen sizes) -->
        <v-row no-gutters>
          <v-col cols="6" class="mb-2" />
          <v-col cols="6" class="mb-2" />
        </v-row>
        <v-row no-gutters>
          <v-col cols="12" class="mb-2 mt-n2">
            <v-text-field
              v-model="civFilter"
              label="Find your civilization"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              rounded="lg"
              variant="outlined"
              color="primary"
              class="mb-2"
              hide-details
              style="margin-left: 0; margin-right: 0;"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row align="center" no-gutters class="hidden-sm-and-up">
          <template v-if="filteredCivs.length">
            <v-col cols="6" v-for="(civ, index) in filteredCivs" :key="civ.title">
              <v-tooltip location="top" open-delay="1000">
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >Explore all {{ civ.title }} build orders</span
                >
                <template v-slot:activator="{ props }">
                  <v-card
                    flat
                    v-bind:class="{
                      'mb-2 mr-2': index % 2 == 0,
                      'mb-2 ml-2': index % 2 != 0,
                    }"
                    min-height="50"
                    rounded="lg"
                    v-bind="props"
                    :to="{
                      name: 'Dashboard',
                      query: { civ: civ.shortName },
                    }"
                  >
                    <v-row no-gutters align="center" justify="center">
                      <v-col cols="4">
                        <v-img
                          min-height="50"
                          :src="civ.flagLarge"
                          :lazy-src="civ.flagSmall"
                          :gradient="
                            'to right, transparent, ' + $vuetify.theme.current.colors.surface
                          "
                          alt="{{civ.title}}"
                          cover
                        >
                        </v-img>
                      </v-col>
                      <v-col cols="8">
                        <!--xs title-->
                        <div
                          :style="{
                            color: $vuetify.theme.current.colors.primary,
                          }"
                          class="text-subtitle-2 ml-1"
                          style="font-size: 0.8rem !important"
                        >
                          {{ civ.title }}
                          <v-chip
                            v-if="
                              isNew(
                                recentCivBuilds
                                  .find((element) => element.civ == civ.shortName)
                                  ?.timeCreated.toDate()
                              )
                            "
                            class="pa-1 pr-2"
                            color="accent"
                            size="x-small"
                            ><v-icon class="ml-1" start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
                          >
                        </div>
                      </v-col>
                    </v-row>
                  </v-card>
                </template>
              </v-tooltip>
            </v-col>
          </template>
          <template v-else>
            <v-col cols="12" class="text-center my-0">
              <v-alert type="info" color="primary" border="start" elevation="0" icon="mdi-information">
                No civilizations found. Try a different search term.
              </v-alert>
            </v-col>
          </template>
        </v-row>
        <!-- civilizations sm and up-->
        <v-row align="center" no-gutters class="hidden-xs">
          <template v-if="filteredCivs.length">
            <v-col cols="6" v-for="(civ, index) in filteredCivs" :key="civ.title">
              <v-tooltip location="top" open-delay="1000">
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >Explore all {{ civ.title }} build orders</span
                >
                <template v-slot:activator="{ props }">
                  <v-card
                    flat
                    v-bind:class="{
                      'mb-2 mr-2': index % 2 == 0,
                      'mb-2 ml-2': index % 2 != 0,
                    }"
                    min-height="50"
                    rounded="lg"
                    v-bind="props"
                    :to="{
                      name: 'Dashboard',
                      query: { civ: civ.shortName },
                    }"
                  >
                    <v-row no-gutters align="center" justify="center">
                      <v-col cols="4">
                        <v-img
                          min-height="70"
                          :src="civ.flagLarge"
                          :lazy-src="civ.flagSmall"
                          :gradient="
                            'to right, transparent, ' + $vuetify.theme.current.colors.surface
                          "
                          alt="{{civ.title}}"
                          cover
                        >
                        </v-img>
                      </v-col>
                      <v-col cols="8">
                        <!--small title-->
                        <v-row no-gutters class="hidden-lg-and-up">
                          <div
                            :style="{
                              color: $vuetify.theme.current.colors.primary,
                            }"
                            class="text-subtitle-2 mx-2 mb-n1 hidden-lg-and-up"
                          >
                            {{ civ.title }}
                            <v-chip
                              v-if="
                                isNew(
                                  recentCivBuilds
                                    .find((element) => element.civ == civ.shortName)
                                    ?.timeCreated.toDate()
                                )
                              "
                              class="px-1 pr-2"
                              color="accent"
                              size="x-small"
                              ><v-icon class="ma-1" start icon="mdi-alert-decagram"></v-icon
                              >NEW</v-chip
                            >
                          </div></v-row
                        >
                        <!--large title-->
                        <v-row no-gutters class="hidden-md-and-down py-0" align="center">
                          <v-card-title
                            class="ml-2 pa-0"
                            :style="{
                              color: $vuetify.theme.current.colors.primary,
                            }"
                          >
                            {{ civ.title }} </v-card-title
                          ><v-chip
                            v-if="
                              isNew(
                                recentCivBuilds
                                  .find((element) => element.civ == civ.shortName)
                                  ?.timeCreated.toDate()
                              )
                            "
                            class="mt-1 ml-2 pl-1"
                            color="accent"
                            size="small"
                            ><v-icon class="ma-1" start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
                          >
                        </v-row>
                      </v-col>
                    </v-row>
                  </v-card>
                </template>
              </v-tooltip>
            </v-col>
          </template>
          <template v-else>
            <v-col cols="12" class="text-center my-0">
              <v-alert type="info" color="primary" border="start" elevation="0" icon="mdi-information">
                No civilizations found. Try a different search term.
              </v-alert>
            </v-col>
          </template>
        </v-row>

        <!-- popular builds -->
        <v-row no-gutters align="center">
          <v-col class="ml-2 mt-4 mb-2" cols="auto"
            ><v-icon icon="mdi-trending-up" size="small" class="mx-2 mb-1"></v-icon
            ><span class="text-h6">Trending Build Orders</span>
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Show All Trending Builds</span
              >
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="small"
                  class="mx-2 mb-1"
                  variant="text"
                  color="primary"
                  icon="mdi-chevron-right"
                  :to="{
                    name: 'Builds',
                    query: { orderBy: 'score' },
                  }"
                ></v-btn>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>
        <v-row align="center" no-gutters>
          <v-col cols="12">
            <div v-for="item in popularBuildsList">
              <router-link
                style="text-decoration: none"
                :to="{
                  name: item.loading ? 'Home' : 'BuildDetails',
                  params: {
                    id: !item.loading ? item.id : null,
                  },
                }"
              >
                <BuildListCard :build="item"></BuildListCard>
              </router-link>
            </div> </v-col
        ></v-row>

        <!-- all time classics -->
        <v-row no-gutters>
          <v-col class="ml-2 mt-4 mb-2" cols="auto"
            ><v-icon icon="mdi-star" size="small" class="mx-2 mb-1"></v-icon
            ><span class="text-h6">All Time Classics</span>
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Show All Time Classics</span
              >
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="small"
                  class="mx-2 mb-1"
                  variant="text"
                  color="primary"
                  icon="mdi-chevron-right"
                  :to="{
                    name: 'Builds',
                    query: { orderBy: 'scoreAllTime' },
                  }"
                ></v-btn>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>
        <v-row align="center" no-gutters>
          <v-col cols="12">
            <div v-for="item in allTimeClassicsList">
              <router-link
                style="text-decoration: none"
                :to="{
                  name: item.loading ? 'Home' : 'BuildDetails',
                  params: {
                    id: !item.loading ? item.id : null,
                  },
                }"
              >
                <BuildListCard :build="item"></BuildListCard>
              </router-link>
            </div> </v-col
        ></v-row>

        <!-- recent builds -->
        <v-row no-gutters align="center">
          <v-col class="ml-2 mt-4 mb-2" cols="auto"
            ><v-icon icon="mdi-clock-edit-outline" size="small" class="mx-2 mb-1"></v-icon
            ><span class="text-h6">New Build Orders</span>
            <v-tooltip location="top" open-delay="1000">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Show All Recent Builds</span
              >
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="small"
                  class="mx-2 mb-1"
                  variant="text"
                  color="primary"
                  icon="mdi-chevron-right"
                  :to="{
                    name: 'Builds',
                    query: { orderBy: 'timeCreated' },
                  }"
                ></v-btn>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>
        <v-row align="center" no-gutters>
          <v-col cols="12">
            <div v-for="item in recentBuildsList">
              <router-link
                style="text-decoration: none"
                :to="{
                  name: item.loading ? 'Home' : 'BuildDetails',
                  params: {
                    id: !item.loading ? item.id : null,
                  },
                }"
              >
                <BuildListCard :build="item"></BuildListCard>
              </router-link>
            </div> </v-col
        ></v-row>
        <!-- mobile sidebar (below builds, hidden on desktop) -->
        <div class="hidden-md-and-up mt-4">
          <News></News>
          <TopContributors :contributors="topContributorsList"></TopContributors>
          <YoutubeGuides></YoutubeGuides>
          <RegisterAd v-if="!user && authIsReady"></RegisterAd>
          <EmailVerificationAd v-if="user && authIsReady && !user.emailVerified"></EmailVerificationAd>
        </div>
      </v-col>

      <!-- sidebar -->
      <v-col cols="12" md="4" class="hidden-sm-and-down">
        <News></News>
        <TopContributors :contributors="topContributorsList"></TopContributors>
        <YoutubeGuides></YoutubeGuides>
        <RegisterAd class="mt-4" v-if="!user && authIsReady"></RegisterAd>
        <EmailVerificationAd
          class="mt-4"
          v-if="user && authIsReady && !user.emailVerified"
        ></EmailVerificationAd>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
//External
import { useStore } from "vuex";
import { computed, onMounted, ref, watch } from "vue";

//Components
import RegisterAd from "@/components/notifications/RegisterAd.vue";
import News from "@/components/notifications/News.vue";
import YoutubeGuides from "@/components/notifications/YoutubeGuides.vue";
import EmailVerificationAd from "@/components/notifications/EmailVerificationAd.vue";
import FilterConfig from "@/components/filter/FilterConfig.vue";
import BuildListCard from "@/components/builds/BuildListCard.vue";
import TopContributors from "@/components/home/TopContributors.vue";

//Composables
import useTimeSince from "@/composables/useTimeSince";
import { getHomeSnapshot } from "@/composables/data/homeService";
import { civs as allCivs } from "@/composables/filter/civDefaultProvider";
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";

export default {
  name: "Home",
  components: {
    FilterConfig,
    BuildListCard,
    RegisterAd,
    News,
    YoutubeGuides,
    EmailVerificationAd,
    TopContributors,
  },
  setup() {
    const store = useStore();
    const allTimeClassicsList = computed(() => store.state.cache.allTimeClassicsList);
    const popularBuildsList = computed(() => store.state.cache.popularBuildsList);
    const recentBuildsList = computed(() => store.state.cache.recentBuildsList);
    const topContributorsList = computed(() => store.state.cache.topContributorsList);
    const civs = allCivs.value.filter((element) => element.shortName != "ANY");
    const civFilter = ref("");
    const filteredCivs = computed(() => {
      if (!civFilter.value) return civs;
      const filter = civFilter.value.toLowerCase();
      return civs.filter(
        (civ) =>
          civ.title.toLowerCase().includes(filter) ||
          civ.shortName.toLowerCase().includes(filter)
      );
    });
    const user = computed(() => store.state.user);
    const recentCivBuilds = ref([]);
    const { isNew } = useTimeSince();

    onMounted(() => {
      store.commit("setFilterConfig", getDefaultConfig());

      //reset cache
      store.commit("setAllBuildsList", null);
      store.commit("setMyBuildsList", null);
      store.commit("setMyFavoritesList", null);

      initData();
    });

    const initData = async () => {
      // Single read replaces 4 separate live queries (~23 reads → 1 read).
      // Data is pre-generated hourly by the updateHomeSnapshot Cloud Function.
      // After first load, IndexedDB persistence serves this from local cache.
      const snapshot = await getHomeSnapshot();
      recentCivBuilds.value = snapshot?.recentCivBuilds ?? [];
      store.commit("setPopularBuildsList", snapshot?.popularBuilds ?? []);
      store.commit("setAllTimeClassicsList", snapshot?.allTimeClassics ?? []);
      store.commit("setRecentBuildsList", snapshot?.recentBuilds ?? []);

      // The snapshot is updated hourly, so the current user's icon may lag
      // behind their latest avatar selection. Patch their entry from the live
      // userAvatar state so the snapshot can never override a recent change.
      let contributors = snapshot?.topContributors ?? [];
      const uid = user.value?.uid;
      const av = store.state.userAvatar;
      if (uid && av) {
        let liveIcon = null;
        if (av.type === "civ") {
          const match = allCivs.value.find((c) => c.shortName === av.ref);
          liveIcon = match ? match.flagLarge : null;
        } else if (av.type === "upload") {
          liveIcon = av.ref;
        }
        contributors = contributors.map((c) =>
          c.authorId === uid ? { ...c, icon: liveIcon } : c
        );
      }
      store.commit("setTopContributorsList", contributors);
      store.commit("setResultsCount", snapshot?.buildsCount ?? null);
    };

    // userAvatar loads async after auth — may arrive after initData() already
    // ran with a null avatar. Re-patch whenever it settles so the stale
    // snapshot icon is always overridden by the user's actual current avatar.
    watch(
      () => store.state.userAvatar,
      (av) => {
        if (!av || !user.value?.uid) return;
        const uid = user.value.uid;
        let liveIcon = null;
        if (av.type === "civ") {
          const match = allCivs.value.find((c) => c.shortName === av.ref);
          liveIcon = match ? match.flagLarge : null;
        } else if (av.type === "upload") {
          liveIcon = av.ref;
        }
        const list = store.state.cache.topContributorsList;
        if (list.some((c) => c.authorId === uid && c.icon !== liveIcon)) {
          store.commit(
            "setTopContributorsList",
            list.map((c) => (c.authorId === uid ? { ...c, icon: liveIcon } : c))
          );
        }
      }
    );

    return {
      user,
      authIsReady: computed(() => store.state.authIsReady),
      civs,
      civFilter,
      filteredCivs,
      recentBuildsList,
      popularBuildsList,
      allTimeClassicsList,
      topContributorsList,
      recentCivBuilds,
      isNew,
    };
  },
};
</script>
