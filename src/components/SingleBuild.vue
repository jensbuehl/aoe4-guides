<template>
  <v-card class="d-flex align-center mb-4" rounded="lg" :min-height="height">
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
          gradient="to right, transparent, #222222"
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
          gradient="to right, transparent, #222222"
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
      <v-col>
        <!--small title-->
        <div
          class="pb-1 ml-4 text-subtitle-2 hidden-lg-and-up"
          style="font-family: 'Segoe UI' !important"
        >
          {{ build.title }}
        </div>
        <!--small chips-->
        <v-item-group class="ml-4 pt-1 hidden-sm-and-down hidden-lg-and-up">
          <v-chip
            class="mr-2"
            v-if="isNew(build.timeCreated.toDate())"
            label
            color="primary"
            size="x-small"
            ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
          >
          <v-chip class="mr-2" label size="x-small"
            ><v-icon start icon="mdi-account-edit"></v-icon
            >{{ build.author }}</v-chip
          >
          <v-chip
            class="mr-2"
            v-if="build.timeCreated && orderBy == 'timeCreated'"
            label
            size="x-small"
            ><v-icon start icon="mdi-clock-edit-outline"></v-icon
            >{{ timeSince(build.timeCreated.toDate()) }}</v-chip
          >
          <v-chip
            class="mr-2"
            label
            size="x-small"
            v-show="build.views && (orderBy == 'views' || 'score')"
          >
            <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}</v-chip
          >
          <v-chip
            v-show="build.likes > 0 && orderBy == 'likes'"
            class="mr-2"
            label
            size="x-small"
          >
            <v-icon start icon="mdi-heart"></v-icon>
            {{ build.likes }}</v-chip
          >
          <v-chip
            v-show="build.upvotes > 0 && orderBy == 'score'"
            class="mr-2"
            label
            size="x-small"
          >
            <v-icon start icon="mdi-thumb-up"></v-icon>
            {{ build.upvotes }}</v-chip
          >
          <v-chip v-if="build.season" class="mr-2" label size="x-small"
            ><v-icon start icon="mdi-trophy"></v-icon>{{ build.season }}</v-chip
          >
          <v-chip v-if="build.map" class="mr-2" label size="x-small"
            ><v-icon start icon="mdi-map"></v-icon>{{ build.map }}</v-chip
          >
          <v-chip v-if="build.strategy" class="mr-2" label size="x-small"
            ><v-icon start icon="mdi-strategy"></v-icon>{{ build.strategy }}</v-chip
          >
        </v-item-group>
        <!--large title-->
        <v-card-title class="pt-0 pb-2 hidden-md-and-down">
          {{ build.title }}
        </v-card-title>
        <!--large chips-->
        <v-item-group class="ml-md-4 pt-2 hidden-md-and-down">
          <v-chip
            class="mr-2 mb-2"
            v-if="isNew(build.timeCreated.toDate())"
            label
            color="primary"
            size="small"
            ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
          >
          <v-chip class="mr-2 mb-2" label size="small"
            ><v-icon start icon="mdi-account-edit"></v-icon
            >{{ build.author }}</v-chip
          >
          <v-chip
            class="mr-2 mb-2"
            v-if="build.timeCreated && orderBy == 'timeCreated'"
            label
            size="small"
            ><v-icon start icon="mdi-clock-edit-outline"></v-icon
            >{{ timeSince(build.timeCreated.toDate()) }}</v-chip
          >
          <v-chip
            class="mr-2 mb-2"
            label
            size="small"
            v-show="build.views && (orderBy == 'views' || 'score')"
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
          <v-chip v-if="build.season" class="mr-2 mb-2" label size="small">
            <v-icon start icon="mdi-trophy"></v-icon>{{ build.season }}</v-chip
          >
          <v-chip v-if="build.map" class="mr-2 mb-2" label size="small"
            ><v-icon start icon="mdi-map"></v-icon>{{ build.map }}</v-chip
          >
          <v-chip v-if="build.strategy" class="mr-2 mb-2" label size="small"
            ><v-icon start icon="mdi-strategy"></v-icon>{{ build.strategy }}</v-chip
          >
        </v-item-group>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
import getCivs from "../composables/getCivs";
import useTimeSince from "../composables/useTimeSince";
import { useStore } from "vuex";
import { computed, getCurrentInstance } from "vue";
import { useDisplay } from "vuetify";

export default {
  name: "SingleBuild",
  props: ["build"],
  setup() {
    const civs = getCivs().civs;
    const store = useStore();
    const { name } = useDisplay();
    const orderBy = computed(() => store.state.filterConfig.orderBy);
    const { timeSince, isNew } = useTimeSince();

    const height = computed(() => {
      switch (name.value) {
        case "xs":
          return 60;
        case "sm":
          return 60;
        case "md":
          return 60;
        case "lg":
          return 112;
        case "xl":
          return 112;
        case "xxl":
          return 112;
      }
    });

    return {
      civs,
      orderBy,
      height,
      timeSince,
      isNew,
    };
  },
};
</script>
