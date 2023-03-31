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
      <v-card-title class="pt-0 text-subtitle-2 text-md-h6" style="font-family: 'Segoe UI' !important" to="/editbuild">{{
        build.title
      }}</v-card-title>
      <v-chip-group class="ml-4 hidden-sm-and-down">
        <v-chip label size="small" disabled>Author: {{ build.author }}</v-chip>
        <v-chip v-if="build.timeCreated" label size="small" disabled
          >Created: {{ build.timeCreated?.toDate().toDateString() }}</v-chip
        >
        <v-chip v-if="build.map" label size="small" disabled>{{
          build.map
        }}</v-chip>
        <v-chip v-if="build.strategy" label size="small" disabled>{{
          build.strategy
        }}</v-chip>
      </v-chip-group>
    </v-col>
  </v-card>
</template>

<script>
import getCivs from "../composables/getCivs";

export default {
  props: ["build"],
  name: "SingleBuild",
  setup() {
    const civs = getCivs().civs;

    return {
      civs,
    };
  },
};
</script>
