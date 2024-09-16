<template>
  <v-card @click="" class="mb-2" rounded="lg" flat>
    <v-skeleton-loader
      v-if="build.loading"
      :loading="build.loading"
      :color="build.loading ? 'loading' : 'surface'"
      :height="height"
    >
    </v-skeleton-loader
    ><v-row v-if="!build.loading" no-gutters class="fill-height">
      <v-col v-if="build.civ" cols="3" class="pa-0 ma-0 d-flex flex-column">
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
          :gradient="'to right, transparent, ' + $vuetify.theme.current.colors.surface"
          alt="{{build.civ}}"
          cover
        >
          <template v-slot:placeholder>
            <v-row class="fill-height ma-0" align="center" justify="center">
              <v-progress-circular indeterminate color="grey lighten-5"></v-progress-circular>
            </v-row>
          </template>
        </v-img>
      </v-col>
      <v-col v-if="!build.civ" cols="3" class="pa-0 ma-0">
        <v-img
          :min-height="height"
          src="/assets/flags/any-large.png"
          lazy-src="/assets/flags/any-small.png"
          :gradient="'to right, transparent, ' + $vuetify.theme.current.colors.surface"
          alt="{{build.civ}}"
          cover
        >
          <template v-slot:placeholder>
            <v-row class="fill-height ma-0" align="center" justify="center">
              <v-progress-circular indeterminate color="grey lighten-5"></v-progress-circular>
            </v-row>
          </template>
        </v-img>
      </v-col>
      <v-col cols="9" align-self="center">
        <!--small title-->
        <v-card-title
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          class="text-subtitle-2 hidden-lg-and-up mx-4 my-0 pa-0"
          style="font-family: 'Segoe UI' !important; text-overflow: ellipsis !important"
        >
          {{ build.title }}
        </v-card-title>
        <!--small chips-->
        <v-item-group class="ml-4 mb-2 hidden-lg-and-up">
          <v-chip class="mr-1 mt-1" v-if="build.isDraft" label color="error" size="x-small"
            ><v-icon start icon="mdi-pencil-circle"></v-icon>Draft</v-chip
          >
          <v-chip
            class="mr-1 mt-1"
            v-if="isNew(build.timeCreated.toDate())"
            label
            color="accent"
            size="x-small"
            ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
          >
          <v-chip
            class="mr-1 mt-1"
            label
            size="x-small"
            color="accent"
            :to="{
              name: 'Builds',
              query: { author: build.authorId },
            }"
            ><v-icon start icon="mdi-account-edit"></v-icon>{{ build.author }}</v-chip
          >
          <v-chip class="mr-1 mt-1" v-if="build.timeCreated" label size="x-small"
            ><v-icon start icon="mdi-clock-edit-outline"></v-icon
            >{{ timeSince(build.timeCreated.toDate()) }}</v-chip
          >
          <v-chip
            class="mr-1 mt-1"
            label
            size="x-small"
            v-show="
              build.views && (orderBy == 'views' || orderBy == 'score' || orderBy == 'scoreAllTime')
            "
          >
            <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}</v-chip
          >
          <v-chip v-if="build.season" class="mr-1 mt-1 hidden-xs" label size="x-small"
            ><v-icon start icon="mdi-trophy"></v-icon>{{ build.season }}</v-chip
          >
          <v-chip v-show="build.map && filterByMap" class="mr-1 mt-1 hidden-xs" label size="x-small"
            ><v-icon start icon="mdi-map"></v-icon>{{ build.map }}</v-chip
          >
          <v-chip class="mr-1 mt-1" v-if="build.creatorId" variant="plain" size="x-small"
            ><v-icon color="accent" start icon="mdi-youtube"></v-icon
            >{{ build.creatorName }}</v-chip
          >
          <!--v-chip
            v-if="build.strategy"
            class="mr-1 mt-1 hidden-xs"
            label
            size="x-small"
            ><v-icon start icon="mdi-strategy"></v-icon
            >{{ build.strategy }}</v-chip-->
        </v-item-group>
        <!--large title-->
        <v-card-title
          class="pt-0 pb-2 hidden-md-and-down"
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
        >
          {{ build.title }}
        </v-card-title>
        <!--large chips-->
        <v-item-group class="ml-md-4 pt-2 hidden-md-and-down">
          <v-chip class="mr-2 mb-2" v-if="build.isDraft" label color="error" size="small"
            ><v-icon start icon="mdi-pencil-circle"></v-icon>Draft</v-chip
          >
          <v-chip
            class="mr-2 mb-2"
            v-if="isNew(build.timeCreated.toDate())"
            label
            color="accent"
            size="small"
            ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
          >
          <v-chip
            class="mr-2 mb-2"
            label
            size="small"
            color="accent"
            :to="{
              name: 'Builds',
              query: { author: build.authorUid },
            }"
            ><v-icon start icon="mdi-account-edit"></v-icon>{{ build.author }}</v-chip
          >
          <v-chip class="mr-2 mb-2" v-if="build.timeCreated" label size="small"
            ><v-icon start icon="mdi-clock-edit-outline"></v-icon
            >{{ timeSince(build.timeCreated.toDate()) }}</v-chip
          >
          <v-chip
            class="mr-2 mb-2"
            label
            size="small"
            v-show="
              build.views && (orderBy == 'views' || orderBy == 'score' || orderBy == 'scoreAllTime')
            "
          >
            <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}</v-chip
          >
          <v-chip v-if="build.comments > 0" class="mr-2 mb-2 hidden-xs" label size="small"
            ><v-icon start icon="mdi-message"></v-icon>{{ build.comments }}</v-chip
          >
          <v-chip v-if="build.season" class="mr-2 mb-2 hidden-xs" label size="small">
            <v-icon start icon="mdi-trophy"></v-icon>{{ build.season }}</v-chip
          >
          <v-chip v-show="build.map && filterByMap" class="mr-2 mb-2" label size="small"
            ><v-icon start icon="mdi-map"></v-icon>{{ build.map }}</v-chip
          >
          <!--v-chip v-if="build.strategy" class="mr-2 mb-2" label size="small"
              ><v-icon start icon="mdi-strategy"></v-icon
                >{{ build.strategy }}</v-chip-->
          <v-chip class="mr-2 mb-2" v-if="build.creatorId" variant="plain" size="small"
            ><v-icon color="accent" start icon="mdi-youtube"></v-icon
            >{{ build.creatorName }}</v-chip
          >
        </v-item-group>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
//External
import { computed } from "vue";
import { useDisplay } from "vuetify";
import { useStore } from "vuex";

//Components

//Composables
import { civs as allCivs } from "@/composables/filter/civDefaultProvider";
import useTimeSince from "@/composables/useTimeSince";

export default {
  components: {},
  name: "BuildListCard",
  props: ["build"],
  setup() {
    const civs = allCivs.value;
    const store = useStore();
    const { name } = useDisplay();
    const orderBy = computed(() => store.state.filterConfig.orderBy);
    const filterByMap = computed(() => store.state.filterConfig.map);
    const { timeSince, isNew } = useTimeSince();

    const height = computed(() => {
      switch (name.value) {
        case "xs":
          return 90;
        case "sm":
          return 125;
        case "md":
          return 90;
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
