<template>
  <v-card @click="" class="mb-2" rounded="lg">
    <v-skeleton-loader :loading="build.loading" :height="height">
      <v-row no-gutters class="fill-height" align="center" justify="center">
        <v-col v-if="build.civ" cols="3" class="pa-0 ma-0">
          <v-img
            :min-height="height"
            :src="
              '/' +
              civs.find((item) => {
                return item.shortName === build.civ;
              }).flagLarge
            "
            :lazy-src="
              '/' +
              civs.find((item) => {
                return item.shortName === build.civ;
              }).flagSmall
            "
            gradient="to right, transparent, #1D2432"
            alt="{{build.civ}}"
            cover
          >
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular
                  indeterminate
                  color="grey lighten-5"
                ></v-progress-circular>
              </v-row>
            </template>
          </v-img>
        </v-col>
        <v-col v-if="!build.civ" cols="3" class="pa-0 ma-0">
          <v-img
            :min-height="height"
            src="/assets/flags/any-large.png"
            lazy-src="/assets/flags/any-small.png"
            gradient="to right, transparent, #1D2432"
            alt="{{build.civ}}"
            cover
          >
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular
                  indeterminate
                  color="grey lighten-5"
                ></v-progress-circular>
              </v-row>
            </template>
          </v-img>
        </v-col>
        <v-col cols="9">
          <!--small title-->
          <div
            :style="{
              color: $vuetify.theme.themes.customDarkTheme.colors.primary,
            }"
            class="ml-4 text-subtitle-2 hidden-lg-and-up"
            style="font-family: 'Segoe UI' !important"
          >
            {{ build.title }}
          </div>
          <!--small chips-->
          <v-item-group class="ml-4 mb-1 hidden-lg-and-up">
            <v-chip
              class="mr-1 mt-1"
              v-if="isNew(build.timeCreated.toDate())"
              label
              color="primary"
              size="x-small"
              ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
            >
            <v-chip
              class="mr-1 mt-1"
              v-if="build.creatorId"
              label
              color="primary"
              size="x-small"
              ><v-icon start icon="mdi-youtube"></v-icon
              >{{ creatorName }}</v-chip
            >
            <v-chip class="mr-1 mt-1" label size="x-small"
              ><v-icon start icon="mdi-account-edit"></v-icon
              >{{ build.author }}</v-chip
            >
            <v-chip
              class="mr-1 mt-1"
              v-if="build.timeCreated"
              label
              size="x-small"
              ><v-icon start icon="mdi-clock-edit-outline"></v-icon
              >{{ timeSince(build.timeCreated.toDate()) }}</v-chip
            >
            <v-chip
              class="mr-1 mt-1"
              label
              size="x-small"
              v-show="build.views && (orderBy == 'views' || orderBy == 'score')"
            >
              <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}</v-chip
            >
            <v-chip
              v-show="build.likes > 0 && orderBy == 'likes'"
              class="mr-1 mt-1"
              label
              size="x-small"
            >
              <v-icon start icon="mdi-heart"></v-icon>
              {{ build.likes }}</v-chip
            >
            <v-chip
              v-show="build.upvotes > 0 && orderBy == 'score'"
              class="mr-1 mt-1"
              label
              size="x-small"
            >
              <v-icon start icon="mdi-thumb-up"></v-icon>
              {{ build.upvotes }}</v-chip
            >
            <v-chip
              v-if="build.season"
              class="mr-1 mt-1 hidden-xs"
              label
              size="x-small"
              ><v-icon start icon="mdi-trophy"></v-icon
              >{{ build.season }}</v-chip
            >
            <v-chip
              v-show="build.map && filterByMap"
              class="mr-1 mt-1 hidden-xs"
              label
              size="x-small"
              ><v-icon start icon="mdi-map"></v-icon>{{ build.map }}</v-chip
            >
            <v-chip
              v-if="build.strategy"
              class="mr-1 mt-1 hidden-xs"
              label
              size="x-small"
              ><v-icon start icon="mdi-strategy"></v-icon
              >{{ build.strategy }}</v-chip
            >
            <span v-for="item in build.matchup"
              ><v-chip
                v-show="item != 'ANY'"
                class="mr-1 mt-1 hidden-xs"
                label
                size="x-small"
                ><v-icon start icon="mdi-sword-cross"></v-icon
                >{{ item }}</v-chip
              ></span
            >
          </v-item-group>
          <!--large title-->
          <v-card-title
            class="pt-0 pb-2 hidden-md-and-down"
            :style="{
              color: $vuetify.theme.themes.customDarkTheme.colors.primary,
            }"
          >
            {{ build.title }}
          </v-card-title>
          <!--large chips-->
          <v-item-group class="ml-md-4 pt-2">
            <v-chip
              class="mr-2 mb-2"
              v-if="isNew(build.timeCreated.toDate())"
              label
              color="primary"
              size="small"
              ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.creatorId"
              label
              color="primary"
              size="small"
              ><v-icon start icon="mdi-youtube"></v-icon
              >{{ creatorName }}</v-chip
            >
            <v-chip class="mr-2 mb-2" label size="small"
              ><v-icon start icon="mdi-account-edit"></v-icon
              >{{ build.author }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.timeCreated"
              label
              size="small"
              ><v-icon start icon="mdi-clock-edit-outline"></v-icon
              >{{ timeSince(build.timeCreated.toDate()) }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              label
              size="small"
              v-show="build.views && (orderBy == 'views' || orderBy == 'score')"
            >
              <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}</v-chip
            >
            <v-chip
              v-show="build.likes > 0 && orderBy == 'likes'"
              class="mr-2 mb-2"
              label
              size="small"
            >
              <v-icon start icon="mdi-heart"></v-icon>
              {{ build.likes }}</v-chip
            >
            <v-chip
              v-show="build.upvotes > 0 && orderBy == 'score'"
              class="mr-2 mb-2"
              label
              size="small"
            >
              <v-icon start icon="mdi-thumb-up"></v-icon>
              {{ build.upvotes }}</v-chip
            >
            <v-chip
              v-if="build.season"
              class="mr-2 mb-2 hidden-xs"
              label
              size="small"
            >
              <v-icon start icon="mdi-trophy"></v-icon
              >{{ build.season }}</v-chip
            >
            <v-chip
              v-show="build.map && filterByMap"
              class="mr-2 mb-2"
              label
              size="small"
              ><v-icon start icon="mdi-map"></v-icon>{{ build.map }}</v-chip
            >
            <v-chip v-if="build.strategy" class="mr-2 mb-2" label size="small"
              ><v-icon start icon="mdi-strategy"></v-icon
              >{{ build.strategy }}</v-chip
            >
            <span v-for="item in build.matchup"
              ><v-chip
                v-show="item != 'ANY'"
                class="mr-2 mb-2"
                label
                size="small"
                ><v-icon start icon="mdi-sword-cross"></v-icon
                >{{ item }}</v-chip
              ></span
            >
          </v-item-group>
        </v-col>
      </v-row></v-skeleton-loader
    >
  </v-card>
</template>

<script>
import getCivs from "../composables/getCivs";
import useTimeSince from "../composables/useTimeSince";
import { useStore } from "vuex";
import { computed } from "vue";
import { useDisplay } from "vuetify";
import { VSkeletonLoader } from "vuetify/labs/VSkeletonLoader";

export default {
  components: {
    VSkeletonLoader,
  },
  name: "SingleBuild",
  props: ["build", "creatorName"],
  setup() {
    const civs = getCivs().civs;
    const store = useStore();
    const { name } = useDisplay();
    const orderBy = computed(() => store.state.filterConfig.orderBy);
    const filterByMap = computed(() => store.state.filterConfig.map);
    const { timeSince, isNew } = useTimeSince();

    const height = computed(() => {
      switch (name.value) {
        case "xs":
          return 80;
        case "sm":
          return 125;
        case "md":
          return 80;
        case "lg":
          return 112;
        case "xl":
          return 125;
        case "xxl":
          return 125;
      }
    });

    return {
      civs,
      orderBy,
      height,
      timeSince,
      isNew,
      name,
      filterByMap,
    };
  },
};
</script>
