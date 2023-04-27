<template>
  <v-card class="d-flex align-center mb-4" rounded="lg">
    <v-col v-if="build.civ" cols="3" class="pa-0 ma-0">
      <v-img
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
      <div
        class="text-subtitle-2 hidden-md-and-up"
        style="font-family: 'Segoe UI' !important"
      >
        {{ build.title }}
      </div>
      <v-card-title class="pt-0 hidden-sm-and-down">
        {{ build.title }}
      </v-card-title>
      <v-item-group class="ml-md-4 hidden-sm-and-down">
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
          v-show="build.views && orderBy == 'views'"
        >
          <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}</v-chip
        >
        <v-chip v-show="build.likes && orderBy == 'likes'" class="mr-2 mb-2" label size="small">
              <v-icon start icon="mdi-heart"></v-icon>
              {{ build.likes }}</v-chip
            >
        <v-chip v-if="build.season" class="mr-2 mb-2" label size="small">{{
          build.season
        }}</v-chip>
        <v-chip v-if="build.map" class="mr-2 mb-2" label size="small">{{
          build.map
        }}</v-chip>
        <v-chip v-if="build.strategy" class="mr-2 mb-2" label size="small">{{
          build.strategy
        }}</v-chip>
      </v-item-group>
    </v-col>
  </v-card>
</template>

<script>
import getCivs from "../composables/getCivs";
import useTimeSince from "../composables/useTimeSince";
import { useStore } from "vuex";
import { computed, onMounted } from "vue";

export default {
  name: "SingleBuild",
  props: ["build"],
  setup() {
    const civs = getCivs().civs;
    const store = useStore();
    const orderBy = computed(() => store.state.filterConfig.orderBy);
    const { timeSince, isNew } = useTimeSince();

    onMounted(() => {
      console.log(orderBy.value);
    });

    return {
      civs,
      orderBy,
      timeSince,
      isNew,
    };
  },
};
</script>
