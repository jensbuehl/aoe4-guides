<template>
  <v-container v-if="!user && authIsReady">
    <v-row>
      <v-col cols="12" md="8" align="center">
        <RegisterAdShort v-if="!user && authIsReady"></RegisterAdShort
      ></v-col>
      <v-col cols="12" md="4">
        <RegisterAd v-if="!user && authIsReady"></RegisterAd>
      </v-col>
    </v-row>
  </v-container>

  <v-container v-if="user">
    <v-card flat v-if="error" class="mb-4" rounded="lg" color="error">
      <v-card-text>{{ error }}</v-card-text>
    </v-card>
    <v-card flat rounded="lg" class="hidden-md-and-up">
      <v-card-title>{{ build.title }}</v-card-title>
      <v-card-actions
        ><v-spacer></v-spacer
        ><v-tooltip location="top" text="Save Build Order">
          <span
            :style="{
              color: $vuetify.theme.current.colors.primary,
            }"
            >Save Build Order</span
          >
          <template :props="props" v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              color="accent"
              variant="text"
              icon="mdi-content-save"
              @click="handleSave"
            ></v-btn>
          </template>
        </v-tooltip>
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              icon="mdi-dots-horizontal"
              color="accent"
              variant="text"
              v-bind="props"
            ></v-btn>
          </template>
          <v-list>
            <v-tooltip>
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Save Build Order as Draft</span
              >
              <template v-slot:activator="{ props }">
                <v-list-item
                  :style="'color: ' + $vuetify.theme.current.colors.primary"
                  @click="handleDraft"
                  v-bind="props"
                >
                  <v-icon color="accent" class="mr-4"
                    >mdi-content-save-cog</v-icon
                  >
                  Save as Draft
                </v-list-item>
              </template>
            </v-tooltip>
          </v-list>
        </v-menu></v-card-actions
      >
    </v-card>
    <v-card flat rounded="lg" class="hidden-sm-and-down">
      <v-row class="d-flex align-center flex-nowrap hidden-sm-and-down">
        <v-col cols="2" md="3" class="pa-0 ma-0 hidden-sm-and-down">
          <v-img
            v-if="build.civ && build.civ != 'ANY'"
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
            :gradient="
              'to right, transparent, ' + $vuetify.theme.current.colors.surface
            "
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
          <v-img
            v-else
            src="/assets/flags/any-large.png"
            lazy-src="/assets/flags/any-small.png"
            :gradient="
              'to right, transparent, ' + $vuetify.theme.current.colors.surface
            "
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
            <v-tooltip location="top">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Save Build Order</span
              >
              <template :props="props" v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  color="accent"
                  variant="text"
                  block
                  icon="mdi-content-save"
                  @click="handleSave"
                ></v-btn>
              </template>
            </v-tooltip>
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-dots-horizontal"
                  color="accent"
                  variant="text"
                  v-bind="props"
                ></v-btn>
              </template>
              <v-list>
                <v-tooltip>
                  <span
                    :style="{
                      color: $vuetify.theme.current.colors.primary,
                    }"
                    >Save Build Order as Draft</span
                  >
                  <template v-slot:activator="{ props }">
                    <v-list-item
                      :style="'color: ' + $vuetify.theme.current.colors.primary"
                      @click="handleDraft"
                      v-bind="props"
                    >
                      <v-icon color="accent" class="mr-4"
                        >mdi-content-save-cog</v-icon
                      >
                      Save as Draft
                    </v-list-item>
                  </template>
                </v-tooltip>
              </v-list>
            </v-menu>
          </v-col>
        </v-row>
      </v-row>
    </v-card>

    <v-row>
      <v-col cols="12" md="8">
        <v-card flat rounded="lg" class="mt-4" fluid fill-height>
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
        <v-card flat rounded="lg" class="mt-n2 mt-md-4 ml-md-n2 flex-grow-1">
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
import RegisterAd from "../../components/notifications/RegisterAd.vue";
import RegisterAdShort from "../../components/notifications/RegisterAdShort.vue";
import StepsEditor from "../../components/builds/StepsEditor.vue";
import { ref, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { civs as allCivs, getCivById } from "../../composables/filter/civService";
import { seasons } from "../../composables/filter/seasonService";
import useCollection from "../../composables/useCollection";
import useBuildValidator from "../../composables/builds/useBuildValidator";
import useYoutube from "../../composables/builds/useYoutube";
import sanitizeHtml from "sanitize-html";
import { maps } from "../../composables/filter/mapService";
import { strategies } from "../../composables/filter/strategyService";
import queryService from "../../composables/useQueryService";

export default {
  name: "BuildNew",
  components: { StepsEditor, RegisterAd, RegisterAdShort },
  setup() {
    window.scrollTo(0, 0);

    const { add, getQuery, getSize, error } = useCollection("builds");
    const { get: getCreator, add: addCreator } = useCollection("creators");
    const { validateBuild, validateVideo } = useBuildValidator();
    const {
      extractVideoId,
      buildEmbedUrl,
      getVideoCreatorId,
      getVideoMetaData,
      getChannelIcon,
    } = useYoutube();
    const civs = allCivs.value.filter(
      (element) => element.shortName != "ANY"
    );
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
        steps: [
          {
            type: "age",
            age: 0,
            steps: [
              {
                time: "",
                builders: "",
                food: "",
                wood: "",
                gold: "",
                stone: "",
                description: "",
              },
            ],
          },
        ],
        video: "",
        civ: "",
        map: "",
        season: "Season 6",
        strategy: "",
        views: 0,
        likes: 0,
        upvotes: 0,
        downvotes: 0,
        score: 0,
        isDraft: false,
        timeCreated: null,
        timeUpdated: null,
      };
    }
    const handleDraft = async () => {
      const maxDrafts = 2;

      build.value.isDraft = true;
      const allDocsQuery = getQuery(
        queryService.getQueryParametersForDrafts(true, user.value.uid)
      );
      const size = await getSize(allDocsQuery);
      console.log(size);
      if (size >= maxDrafts) {
        error.value = `Villagers shall only manage ${maxDrafts} drafts at the same time. Please publish or delete your open drafts, first.`;
      } else {
        handleSave();
      }
    };

    const handleSave = async () => {
      console.log(build.value);
      error.value = validateBuild(build.value);
      sanitizeSteps();

      //Write to database
      if (!error.value) {
        build.value.sortTitle =
          build.value.title.toLowerCase() + crypto.randomUUID();
        build.value.authorUid = user.value.uid;
        build.value.author = user.value.displayName;

        //Add creatorId if empty for some reason...
        if (!build.value.creatorId && build.value.video) {
          const videoId = extractVideoId(build.value.video);
          build.value.creatorId = await getVideoCreatorId(videoId);
        }

        //Add build order document
        const id = await add(build.value);

        if (build.value.video) {
          //Add content creator document
          const creatorDoc = await getVideoMetaData(
            extractVideoId(build.value.video)
          );
          const res = await getCreator(creatorDoc.creatorId);
          console.log(creatorDoc);
          if (!res) {
            creatorDoc.creatorImage = await getChannelIcon(
              creatorDoc.creatorId
            );
            await addCreator(creatorDoc, creatorDoc.creatorId);
            store.commit("addCreator", creatorDoc);
          }
        }

        //Navigate to new build order
        if (!error.value) {
          router.replace("/builds/" + id);
        }
      }
    };

    const sanitizeSteps = () => {
      build.value.steps.forEach(function (stepCollection) {
        stepCollection.steps.forEach(function (step, index) {
          this[index].description = sanitizeHtml(step.description, {
            allowedTags: ["img", "br"],
            allowedClasses: {
              img: [
                "icon",
                "icon-none",
                "icon-military",
                "icon-tech",
                "icon-default",
                "icon-landmark",
                "icon-ability",
              ],
            },
            allowedAttributes: {
              img: ["style", "class", "src", "title"],
            },
            allowedStyles: {
              "*": {
                "vertical-align": [/^middle$/],
              },
            },
          });
        }, stepCollection.steps);
      });
    };

    const handleStepsChanged = (steps) => {
      build.value.steps = steps;
    };

    const handleVideoInput = async () => {
      error.value = validateVideo(build.value.video);

      if (!error.value && build.value.video) {
        const videoId = extractVideoId(build.value.video);
        build.value.video = buildEmbedUrl(videoId);
        build.value.creatorId = await getVideoCreatorId(videoId);
      } else {
        build.value.creatorId = "";
      }
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
      handleSave,
      handleDraft,
      handleVideoInput,
      handleStepsChanged,
    };
  },
};
</script>
