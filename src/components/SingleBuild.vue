<template>
  <v-card class="d-flex align-center mb-4" rounded="lg">
    <v-col cols="3" class="pa-0 ma-0">
      <v-img
        v-if="build.civ"
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
    <v-col>
      <v-card-title
        class="pt-md-0 pt-2 text-subtitle-2 text-md-h6"
        style="font-family: 'Segoe UI' !important"
        to="/editbuild"
        >{{ build.title }}</v-card-title
      >
      <v-item-group class="ml-4 hidden-sm-and-down">
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
        <v-chip class="mr-2 mb-2" v-if="build.timeCreated" label size="small"
          ><v-icon start icon="mdi-alarm-plus"></v-icon
          >{{ timeSince(build.timeCreated.toDate()) }}</v-chip
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

export default {
  props: ["build"],
  name: "SingleBuild",
  setup() {
    const civs = getCivs().civs;
    const { timeSince, isNew } = useTimeSince();

    return {
      civs,
      timeSince,
      isNew,
    };
  },
};
</script>
