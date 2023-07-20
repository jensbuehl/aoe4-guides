<template>
  <v-container v-if="!user && authIsReady">
    <v-row>
      <v-col cols="12" md="8" align="center"
        ><v-card
          class="d-flex justify-center align-center mb-n2"
          height="96"
          rounded="lg"
        >
        <div>
            <v-label>Would you like to craft your own build orders?</v-label>
            <v-btn
              class="pb-1"
              color="primary"
              style="background-color: transparent"
              variant="plain"
              to="/register"
            >
              Register now!
            </v-btn>
          </div>
        </v-card></v-col
      >
      <v-col cols="12" md="4"
        ><v-alert
          v-if="!user && authIsReady"
          rounded="lg"
          outlined
          color="primary"
          class="pa-1"
        >
          <v-card rounded="lg">
            <v-card-title v-if="!user">Create</v-card-title>
            <v-card-text
              >Create new Age of Empires 4 build orders and share them with your
              friends.</v-card-text
            >

            <v-card-title>Like</v-card-title>
            <v-card-text
              >Manage your own favorite AoE 4 build orders and find the good
              ones with ease.</v-card-text
            >

            <v-card-title>Comment</v-card-title>
            <v-card-text
              >Write build order comments and get in touch with the author and
              the community.</v-card-text
            >

            <v-card-title>Sign up</v-card-title>
            <v-card-text
              >Registered villagers gather and manage build orders up to 20%
              faster. ;)</v-card-text
            >
            <v-list-item>
              <span>New Villager?</span>
              <v-btn
                size="small"
                color="primary"
                style="background-color: transparent"
                variant="plain"
                to="/register"
              >
                Register now!
              </v-btn>
            </v-list-item>
          </v-card></v-alert
        ></v-col>
    </v-row>
  </v-container>

  <v-container v-if="user">
    <v-card v-if="error" class="mb-4" rounded="lg" color="error">
      <v-card-text>{{ error }}</v-card-text>
    </v-card>
    <v-card rounded="lg" class="hidden-md-and-up">
      <v-card-title>{{ build.title }}</v-card-title>
      <v-card-actions
        ><v-spacer></v-spacer
        ><v-tooltip location="top">
          <span
            :style="{
              color: $vuetify.theme.themes.customDarkTheme.colors.primary,
            }"
            >Save Build Order</span
          >
          <template :props="props" v-slot:activator="{ props }">
            <v-btn
              color="primary"
              variant="text"
              icon="mdi-content-save"
              @click="save"
            ></v-btn>
          </template> </v-tooltip
      ></v-card-actions>
    </v-card>
    <v-card rounded="lg" class="hidden-sm-and-down">
      <v-row class="d-flex align-center flex-nowrap hidden-sm-and-down">
        <v-col
          v-if="build.civ"
          cols="2"
          md="3"
          class="pa-0 ma-0 hidden-sm-and-down"
        >
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
        <v-col
          v-if="!build.civ"
          cols="2"
          md="3"
          class="pa-0 ma-0 hidden-sm-and-down"
        >
          <v-img
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
        <v-col cols="8" md="6" lg="6" class="hidden-sm-and-down">
          <v-card-title>{{ build.title }}</v-card-title>
        </v-col>
        <v-row
          align="center"
          justify="end"
          class="fill-height mr-4 hidden-sm-and-down"
        >
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
            autofocus=""
            density="compact"
            v-model="build.title"
            :value="build.title"
          ></v-text-field>

          <v-textarea
            label="Description"
            class="pa-4"
            rows="1"
            density="compact"
            multi-line
            auto-grow
            v-model="build.description"
            :value="build.description"
          ></v-textarea>

          <v-text-field
            label="Video"
            class="px-4 pt-4"
            density="compact"
            @input="handleVideoInput($event)"
            :value="build.video"
            v-model="build.video"
          ></v-text-field> </v-card
      ></v-col>
      <v-col cols="12" md="4" class="d-flex">
        <v-card rounded="lg" class="mt-n2 mt-md-4 ml-md-n2 flex-grow-1">
          <v-card-text class="pb-0">
            <v-select
              prepend-icon="mdi-earth"
              label="Civilization"
              :items="civs"
              v-model="build.civ"
              density="compact"
              item-value="shortName"
              item-title="title"
            >
            </v-select>
            <v-select
              prepend-icon="mdi-sword-cross"
              label="Matchup"
              :items="matchups"
              v-model="build.matchup"
              density="compact"
              item-value="shortName"
              item-title="title"
              multiple
            >
            </v-select>
            <v-select
              prepend-icon="mdi-trophy"
              label="Season"
              :items="seasons"
              v-model="build.season"
              density="compact"
              item-value="title"
              item-title="title"
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
      v-if="build"
      @stepsChanged="handleStepsChanged"
      :steps="build.steps"
      :civ="build.civ"
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
import useBuildValidator from "../../composables/useBuildValidator";
import useYoutube from "../../composables/useYoutube";
import getMaps from "../../composables/getMaps";
import getStrategies from "../../composables/getStrategies";

export default {
  name: "BuildNew",
  components: { StepsEditor },
  setup(props) {
    window.scrollTo(0, 0);

    const { add, error } = useCollection("builds");
    const { get:getCreator, add:addCreator } = useCollection("creators");
    const { validateBuild, validateVideo } = useBuildValidator();
    const { extractVideoId, buildEmbedUrl, getVideoCreatorId, getVideoMetaData } = useYoutube();
    const civs = getCivs().civs;
    const matchups = getCivs().civs;
    const maps = getMaps().maps;
    const strategies = getStrategies().strategies;
    const seasons = getSeasons().seasons;
    const store = useStore();
    const user = computed(() => store.state.user);
    const template = computed(() => store.state.template);
    const router = useRouter();
    const build = ref(null);

    if (template.value) {
      build.value = template.value;
      store.commit("setTemplate", null);
    } else {
      build.value = {
        author: "",
        authorUid: "",
        description: "",
        title: "",
        sortTitle: "", //firestore does not support case-insensitive sorting
        steps: [],
        video: "",
        civ: "ANY",
        map: "",
        season: "Season 5",
        strategy: "",
        matchup: ["ANY"],
        views: 0,
        likes: 0,
        upvotes: 0,
        downvotes: 0,
        score: 0,
        timeCreated: null,
        timeUpdated: null,
      };
    }

    const save = async () => {
      error.value = validateBuild(build.value);

      //Write to database
      if (!error.value) {
        build.value.sortTitle =
          build.value.title.toLowerCase() + crypto.randomUUID();
        build.value.authorUid = user.value.uid;
        build.value.author = user.value.displayName;

        const id = await add(build.value);
        //Navigate to new build order
        if (!error.value) {
          router.push("/builds/" + id);
        }

        //Add content creator document
        const creatorDoc = await getVideoMetaData(extractVideoId(build.value.video))
        const res = await getCreator(creatorDoc.creatorId);
        console.log(creatorDoc)
        if(!res){
          await addCreator(creatorDoc, creatorDoc.creatorId)
        }
      }
    };

    const handleStepsChanged = (steps) => {
      build.value.steps = steps;
    };

    const handleVideoInput = async () => {
      error.value = validateVideo(build.value.video);
      if (!error.value) {
        const videoId = extractVideoId(build.value.video)
        build.value.video = buildEmbedUrl(videoId);
        build.value.creatorId = await getVideoCreatorId(videoId);
      }
    };

    return {
      build,
      error,
      civs,
      matchups,
      maps,
      strategies,
      seasons,
      user,
      authIsReady: computed(() => store.state.authIsReady),
      save,
      handleVideoInput,
      handleStepsChanged,
    };
  },
};
</script>
