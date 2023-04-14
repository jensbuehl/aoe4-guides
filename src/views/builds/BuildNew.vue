<template>
  <v-container v-if="!user && authIsReady">
    <v-row>
      <v-col cols="12" md="8"
        ><v-card
          class="d-flex justify-center align-center"
          height="96"
          rounded="lg"
        >
          <v-card-title
            class="justify-center align-center pt-0 text-subtitle-2 text-md-h6"
            style="font-family: 'Segoe UI' !important"
            >Please login to create your own build orders.</v-card-title
          >
        </v-card></v-col
      >
      <v-col cols="12" md="4"
        ><v-alert
          v-if="!user"
          rounded="lg"
          outlined
          color="primary"
          class="pa-1"
          ><v-card rounded="lg">
            <v-card-title> Ready for Age Up?</v-card-title>

            <v-list lines="two">
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
            </v-list> </v-card></v-alert
      ></v-col>
    </v-row>
  </v-container>
  <v-container v-if="user">
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
        <v-col v-if="!build.civ" cols="2" md="3" class="pa-0 ma-0 hidden-sm-and-down">
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
        <v-col cols="8" md="6" lg="6">
          <v-card-title>{{ build.title }}</v-card-title>
        </v-col>
        <v-row align="center" justify="end" class="fill-height mr-4">
          <v-col cols="auto">
            <v-btn
              color="primary"
              variant="text"
              block
              icon="mdi-content-save"
              @click="save"
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
            v-model="build.title"
            :value="build.title"
          ></v-text-field>

          <v-textarea
            label="Description"
            class="pa-4"
            rows="1"
            multi-line
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
    <StepsEditor
      @stepsChanged="handleStepsChanged"
      :steps="build.steps"
    ></StepsEditor>
  </v-container>
</template>

<script>
import StepsEditor from "../../components/StepsEditor.vue";
import { ref, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import getCivs from "../../composables/getCivs";
import getSeasons from "../../composables/getSeasons";
import useCollection from "../../composables/useCollection";
import getMaps from "../../composables/getMaps";
import getStrategies from "../../composables/getStrategies";

export default {
  name: "BuildNew",
  components: { StepsEditor },
  setup() {
    window.scrollTo(0, 0);

    const { add, error } = useCollection("builds");
    const civs = getCivs().civs;
    const maps = getMaps().maps;
    const strategies = getStrategies().strategies;
    const seasons = getSeasons().seasons;
    const store = useStore();
    const user = computed(() => store.state.user);
    const router = useRouter();

    const build = ref({
      author: "",
      authorUid: "",
      description: "",
      title: "",
      sortTitle: "", //Since firestore does not support case-insensitive sorting
      steps: [],
      video: "",
      civ: "",
      map: "",
      season: "",
      strategy: "",
      timeCreated: null,
      timeUpdated: null,
    });

    const stepsCopy = ref(null);
    const save = async () => {
      //Hack, since using the reference in step editor broke the selection which is needed of adding icons
      build.value.steps.forEach(
        (step, index) => (step.description = stepsCopy.value[index].description)
      );
      build.value.sortTitle =
        build.value.title.toLowerCase() + crypto.randomUUID();
      build.value.authorUid = user.value.uid;
      build.value.author = user.value.displayName;
      const id = await add(build.value);
      if (!error.value) {
        router.push("/builds/" + id);
      }
    };
    const handleStepsChanged = (steps) => {
      stepsCopy.value = steps;
    };
    const handleVideoInput = () => {
      build.value.video = build.value.video.replace(/watch\?v=/, "embed/");
    };

    return {
      build,
      error,
      civs,
      maps,
      strategies,
      seasons,
      user,
      authIsReady: computed(() => store.state.authIsReady),
      save,
      handleVideoInput,
      handleStepsChanged
    };
  },
};
</script>
