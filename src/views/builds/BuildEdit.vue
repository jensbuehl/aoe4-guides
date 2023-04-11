<template>
  <v-container v-if="user && build">
    <v-card rounded="lg">
      <v-row class="d-flex align-center flex-nowrap">
        <v-col v-if="build.civ" cols="2" md="3" class="pa-0 ma-0 hidden-sm-and-down">
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
        <v-col v-if="!build.civ" cols="2" md="3" class="pa-0 ma-0">
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
        <v-col cols="10" md="6" lg="6">
          <v-card-title class="py-0 mb-4">{{ build.title }}</v-card-title>
          <v-item-group class="ml-4 pt-2">
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
            <v-chip class="mr-2 mb-2" label size="small" v-show="build.views">
              <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}</v-chip
            >
            <v-chip v-show="build.likes" class="mr-2 mb-2" label size="small">
              <v-icon start icon="mdi-heart"></v-icon>
              {{ build.likes }}</v-chip
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
              v-if="build.timeCreated"
              label
              size="small"
              ><v-icon start icon="mdi-update"></v-icon
              >{{ timeSince(build.timeUpdated.toDate()) }}</v-chip
            >
          </v-item-group>
          <v-item-group class="ml-4">
            <v-chip
              color="primary"
              class="mr-2 mb-2"
              v-if="build.season"
              label
              size="small"
              >{{ build.season }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              color="primary"
              v-if="build.map"
              label
              size="small"
              >{{ build.map }}</v-chip
            >
            <v-chip
              color="primary"
              class="mr-2 mb-2"
              v-if="build.strategy"
              label
              size="small"
              >{{ build.strategy }}</v-chip
            >
          </v-item-group>
        </v-col>
        <v-row align="center" justify="end" class="fill-height mr-4">
          <v-col cols="auto">
            <v-btn
              color="primary"
              variant="text"
              block
              icon="mdi-content-save"
              @click="handleSave"
            ></v-btn>
          </v-col>
        </v-row>
      </v-row>
    </v-card>

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" class="mt-4" fluid fill-height>
          <v-text-field
            class="pa-4"
            label="Title"
            multi-line
            v-model="build.title"
            :value="build.title"
          ></v-text-field>

          <v-textarea
            label="Description"
            class="pa-4"
            rows="1"
            auto-grow
            v-model="build.description"
            :value="build.description"
          ></v-textarea>

          <v-text-field
            label="Video"
            class="pa-4"
            @input="handleVideoInput($event)"
            :value="build.video"
            v-model="build.video"
          ></v-text-field> </v-card
      ></v-col>
      <v-col cols="12" md="4">
        <v-card rounded="lg" class="mt-n2 mt-md-4 ml-md-n2">
          <v-card-text>
            <v-select
              prepend-icon="mdi-earth"
              label="Civilization"
              :items="civs"
              v-model="build.civ"
              density="compact"
              item-value="shortName"
              item-title="title"
              clearable
            >
            </v-select>
            <v-select
              prepend-icon="mdi-update"
              label="Season"
              :items="seasons"
              v-model="build.season"
              density="compact"
              item-value="title"
              item-title="title"
              clearable
            >
            </v-select>
            <v-select
              prepend-icon="mdi-map"
              label="Map"
              :items="maps"
              v-model="build.map"
              density="compact"
              item-value="title"
              item-title="title"
              clearable
            >
            </v-select>
            <v-select
              prepend-icon="mdi-strategy"
              label="Strategy"
              :items="strategies"
              v-model="build.strategy"
              density="compact"
              item-value="title"
              item-title="title"
              clearable
            >
            </v-select>
          </v-card-text> </v-card
      ></v-col>
    </v-row>
    <StepsEditor :steps="build.steps"></StepsEditor>
  </v-container>
</template>

<script>
import StepsEditor from "../../components/StepsEditor.vue";
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import useCollection from "../../composables/useCollection";
import getCivs from "../../composables/getCivs";
import getSeasons from "../../composables/getSeasons";
import getMaps from "../../composables/getMaps";
import getStrategies from "../../composables/getStrategies";
import useTimeSince from "../../composables/useTimeSince";

export default {
  name: "BuildEdit",
  components: { StepsEditor },
  props: ["id"],
  setup(props) {
    window.scrollTo(0, 0);

    const store = useStore();
    const router = useRouter();
    const user = computed(() => store.state.user);
    const civs = getCivs().civs;
    const maps = getMaps().maps;
    const seasons = getSeasons().seasons;
    const strategies = getStrategies().strategies;
    const build = ref(null);
    const { timeSince, isNew } = useTimeSince();
    const { get, update, error } = useCollection("builds");

    onMounted(async () => {
      const res = await get(props.id);
      build.value = res;
    });

    const handleSave = async () => {
      build.value.sortTitle =
        build.value.title.toLowerCase() + crypto.randomUUID();
      await update(props.id, build.value);
      if (!error.value) {
        router.push("/builds/" + props.id);
      }
    };

    const handleVideoInput = () => {
      build.value.video = build.value.video.replace(/watch\?v=/, "embed/");
    };

    return {
      build,
      user,
      civs,
      maps,
      strategies,
      seasons,
      handleSave,
      handleVideoInput,
      timeSince,
      isNew
    };
  },
};
</script>

<style scoped>
</style>
