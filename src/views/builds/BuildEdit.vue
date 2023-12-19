<template>
  <v-container v-if="user && build">
    <v-card flat v-if="error" class="mb-4" rounded="lg" color="error">
      <v-card-text>{{ error }}</v-card-text>
    </v-card>
    <v-card flat rounded="lg">
      <v-card-title class="hidden-md-and-up">
        {{ build.title }}
      </v-card-title>
      <!--sm and down-->
      <v-row
        no-gutters
        align="center"
        justify="start"
        class="fill-height d-flex flex-nowrap pl-4 hidden-sm-and-up"
      >
        <v-col cols="12">
          <!--xs-->
          <v-item-group class="pt-2 hidden-sm-and-up">
            <v-chip
              class="mr-2 mb-2"
              v-if="build.isDraft"
              label
              color="error"
              size="x-small"
              ><v-icon start icon="mdi-pencil-circle"></v-icon>Draft</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="isNew(build.timeCreated.toDate())"
              label
              color="accent"
              size="x-small"
              ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.creatorId && creatorName"
              label
              color="accent"
              size="x-small"
              ><v-icon start icon="mdi-youtube"></v-icon
              >{{ creatorName }}</v-chip
            >
            <v-chip
              color="accent"
              class="mr-2 mb-2"
              v-if="build.season"
              label
              size="x-small"
              ><v-icon start icon="mdi-trophy"></v-icon
              >{{ build.season }}</v-chip
            >
          </v-item-group>
          <v-item-group class="hidden-sm-and-up">
            <v-chip
              class="mr-2 mb-2"
              color="accent"
              v-if="build.map"
              label
              size="x-small"
              ><v-icon start icon="mdi-map"></v-icon>{{ build.map }}</v-chip
            >
            <v-chip
              color="accent"
              class="mr-2 mb-2"
              v-if="build.strategy"
              label
              size="x-small"
              ><v-icon start icon="mdi-strategy"></v-icon
              >{{ build.strategy }}</v-chip
            >
          </v-item-group>
          <v-item-group class="hidden-sm-and-up">
            <v-chip class="mr-2 mb-2" label size="x-small"
              ><v-icon start icon="mdi-account-edit"></v-icon
              >{{ build.author }}</v-chip
            >
            <v-chip class="mr-2 mb-2" label size="x-small" v-show="build.views">
              <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}</v-chip
            >
            <v-chip
              v-show="build.upvotes"
              class="mr-2 mb-2"
              label
              size="x-small"
            >
              <v-icon start icon="mdi-thumb-up"></v-icon>
              {{ build.upvotes }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.timeCreated"
              label
              size="x-small"
              ><v-icon start icon="mdi-clock-edit-outline"></v-icon
              >{{ timeSince(build.timeCreated.toDate()) }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.timeCreated"
              label
              size="x-small"
              ><v-icon start icon="mdi-update"></v-icon
              >{{ timeSince(build.timeUpdated.toDate()) }}</v-chip
            >
          </v-item-group>
          <!--sm-->

          <v-item-group class="pt-2 hidden-xs hidden-md-and-up">
            <v-chip
              class="mr-2 mb-2"
              v-if="build.isDraft"
              label
              color="error"
              size="small"
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
              v-if="build.creatorId && creatorName"
              label
              color="accent"
              size="small"
              ><v-icon start icon="mdi-youtube"></v-icon
              >{{ creatorName }}</v-chip
            >
            <v-chip
              color="accent"
              class="mr-2 mb-2"
              v-if="build.season"
              label
              size="small"
              ><v-icon start icon="mdi-trophy"></v-icon
              >{{ build.season }}</v-chip
            >
          </v-item-group>
          <v-item-group class="hidden-xs hidden-md-and-up">
            <v-chip
              class="mr-2 mb-2"
              color="accent"
              v-if="build.map"
              label
              size="small"
              ><v-icon start icon="mdi-map"></v-icon>{{ build.map }}</v-chip
            >
            <v-chip
              color="accent"
              class="mr-2 mb-2"
              v-if="build.strategy"
              label
              size="small"
              ><v-icon start icon="mdi-strategy"></v-icon
              >{{ build.strategy }}</v-chip
            >
          </v-item-group>
          <v-item-group class="hidden-xs hidden-md-and-up">
            <v-chip class="mr-2 mb-2" label size="small"
              ><v-icon start icon="mdi-account-edit"></v-icon
              >{{ build.author }}</v-chip
            >
            <v-chip class="mr-2 mb-2" label size="small" v-show="build.views">
              <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}</v-chip
            >
            <v-chip v-show="build.upvotes" class="mr-2 mb-2" label size="small">
              <v-icon start icon="mdi-thumb-up"></v-icon>
              {{ build.upvotes }}</v-chip
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
        </v-col>
      </v-row>
      <v-card-actions class="hidden-md-and-up">
        <v-spacer></v-spacer>
        <v-tooltip location="top" text="Save Build Order">
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
                >Duplicate and Edit Build Order</span
              >
              <template v-slot:activator="{ props }">
                <v-list-item
                  :style="'color: ' + $vuetify.theme.current.colors.primary"
                  v-show="user"
                  @click="handleDuplicate"
                  v-bind="props"
                >
                  <v-icon color="accent" class="mr-4"
                    >mdi-content-duplicate</v-icon
                  >
                  Duplicate Build
                </v-list-item>
              </template>
            </v-tooltip>
            <v-list-item @click="handleCopyOverlayFormat">
              <v-tooltip>
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >Copy RTS_Overlay / AoE4_Overlay Format to Clipboard</span
                >
                <template v-slot:activator="{ props }">
                  <v-icon color="accent" class="mr-5" v-bind="props"
                    >mdi-content-copy
                  </v-icon>
                  <v-list-item-content
                    :style="'color: ' + $vuetify.theme.current.colors.primary"
                    v-bind="props"
                    >Overlay Tool</v-list-item-content
                  >
                </template>
              </v-tooltip>
              <v-tooltip location="top">
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >Visit AoE4_Overlay Project Page</span
                >
                <template v-slot:activator="{ props }">
                  <v-icon
                    v-bind="props"
                    size="small"
                    @click="
                      (e) => {
                        e.stopPropagation();
                        window
                          .open(
                            'https://github.com/FluffyMaguro/AoE4_Overlay',
                            '_blank'
                          )
                          .focus();
                      }
                    "
                    color="accent"
                    class="ml-2"
                    >mdi-information-outline</v-icon
                  >
                </template>
              </v-tooltip>
            </v-list-item>
            <v-tooltip>
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Download RTS_Overlay / AoE4_Overlay File</span
              >
              <template v-slot:activator="{ props }">
                <v-list-item
                  :style="'color: ' + $vuetify.theme.current.colors.primary"
                  v-bind="props"
                  @click="handleDownloadOverlayFormat"
                >
                  <v-icon color="accent" class="mr-4">mdi-download</v-icon>
                  Download
                </v-list-item>
              </template>
            </v-tooltip>
          </v-list>
        </v-menu>
      </v-card-actions>
      <!--md and up-->
      <v-row
        no-gutters
        class="fill-height d-flex flex-nowrap hidden-sm-and-down"
      >
        <v-col
          cols="2"
          md="4"
          lg="3"
          class="pa-0 ma-0 d-flex flex-column"
        >
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
        <v-col cols="9" md="6" lg="7" xl="8" class="d-flex flex-column">
          <v-card-title class="py-0 mt-2 hidden-sm-and-down">
            {{ build.title }}
          </v-card-title>
          <v-spacer></v-spacer>
          <v-item-group class="ml-4 pt-2 hidden-sm-and-down">
            <v-chip
              class="mr-2 mb-2"
              v-if="build.isDraft"
              label
              color="error"
              size="small"
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
              v-if="build.creatorId && creatorName"
              label
              color="accent"
              size="small"
              ><v-icon start icon="mdi-youtube"></v-icon
              >{{ creatorName }}</v-chip
            >
            <v-chip
              color="accent"
              class="mr-2 mb-2"
              v-if="build.season"
              label
              size="small"
              ><v-icon start icon="mdi-trophy"></v-icon
              >{{ build.season }}</v-chip
            >
          </v-item-group>
          <v-item-group class="ml-4 hidden-sm-and-down">
            <v-chip
              class="mr-2 mb-2"
              color="accent"
              v-if="build.map"
              label
              size="small"
              ><v-icon start icon="mdi-map"></v-icon>{{ build.map }}</v-chip
            >
            <v-chip
              color="accent"
              class="mr-2 mb-2"
              v-if="build.strategy"
              label
              size="small"
              ><v-icon start icon="mdi-strategy"></v-icon
              >{{ build.strategy }}</v-chip
            >
          </v-item-group>
          <v-item-group class="ml-4 hidden-sm-and-down">
            <v-chip class="mr-2 mb-2" label size="small"
              ><v-icon start icon="mdi-account-edit"></v-icon
              >{{ build.author }}</v-chip
            >
            <v-chip class="mr-2 mb-2" label size="small" v-show="build.views">
              <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}</v-chip
            >
            <v-chip v-show="build.upvotes" class="mr-2 mb-2" label size="small">
              <v-icon start icon="mdi-thumb-up"></v-icon>
              {{ build.upvotes }}</v-chip
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
        </v-col>
        <v-row
          align-content="center"
          justify="end"
          class="my-2 mr-2 hidden-sm-and-down"
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
                    >Duplicate and Edit Build Order</span
                  >
                  <template v-slot:activator="{ props }">
                    <v-list-item
                      :style="'color: ' + $vuetify.theme.current.colors.primary"
                      v-show="user"
                      @click="handleDuplicate"
                      v-bind="props"
                    >
                      <v-icon color="accent" class="mr-4"
                        >mdi-content-duplicate</v-icon
                      >
                      Duplicate Build
                    </v-list-item>
                  </template>
                </v-tooltip>
                <v-list-item @click="handleCopyOverlayFormat">
                  <v-tooltip>
                    <span
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >Copy to Clipboard (RTS_Overlay / AoE4_Overlay)</span
                    >
                    <template v-slot:activator="{ props }">
                      <v-icon color="accent" class="mr-5" v-bind="props"
                        >mdi-content-copy
                      </v-icon>
                      <v-list-item-content
                        :style="
                          'color: ' + $vuetify.theme.current.colors.primary
                        "
                        v-bind="props"
                        >Overlay Tool</v-list-item-content
                      >
                    </template>
                  </v-tooltip>
                  <v-tooltip location="top">
                    <span
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >Visit AoE4_Overlay Project Page</span
                    >
                    <template v-slot:activator="{ props }">
                      <v-icon
                        v-bind="props"
                        size="small"
                        @click="
                          (e) => {
                            e.stopPropagation();
                            window
                              .open(
                                'https://github.com/FluffyMaguro/AoE4_Overlay',
                                '_blank'
                              )
                              .focus();
                          }
                        "
                        color="accent"
                        class="ml-2"
                        >mdi-information-outline</v-icon
                      >
                    </template>
                  </v-tooltip>
                </v-list-item>
                <v-tooltip>
                  <span
                    :style="{
                      color: $vuetify.theme.current.colors.primary,
                    }"
                    >Download RTS_Overlay / AoE4_Overlay File</span
                  >
                  <template v-slot:activator="{ props }">
                    <v-list-item
                      :style="'color: ' + $vuetify.theme.current.colors.primary"
                      v-bind="props"
                      @click="handleDownloadOverlayFormat"
                    >
                      <v-icon color="accent" class="mr-4">mdi-download</v-icon>
                      Download
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
      @stepsChanged="handleStepsChanged"
      :steps="build.steps"
      :civ="build.civ"
    ></StepsEditor>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

//Components
import Favorite from "../../components/Favorite.vue";
import StepsEditor from "../../components/builds/StepsEditor.vue";

//Composables
import useCollection from "../../composables/useCollection";
import useBuildValidator from "../../composables/builds/useBuildValidator";
import useYoutube from "../../composables/builds/useYoutube";
import getCivs from "../../composables/filter/getCivs";
import getSeasons from "../../composables/filter/getSeasons";
import getMaps from "../../composables/filter/getMaps";
import getStrategies from "../../composables/filter/getStrategies";
import useTimeSince from "../../composables/useTimeSince";
import sanitizeHtml from "sanitize-html";
import useExportOverlayFormat from "../../composables/converter/useExportOverlayFormat";
import useCopyToClipboard from "../../composables/converter/useCopyToClipboard";
import useDownload from "../../composables/converter/useDownload";

export default {
  name: "BuildEdit",
  components: { Favorite, StepsEditor },
  props: ["id"],
  setup(props) {
    window.scrollTo(0, 0);

    const store = useStore();
    const router = useRouter();
    const user = computed(() => store.state.user);
    const civs = getCivs().civs.value.filter(
      (element) => element.shortName != "ANY"
    );
    const creatorName = ref("");
    const maps = getMaps().maps;
    const seasons = getSeasons().seasons;
    const strategies = getStrategies().strategies;
    const build = ref(null);
    const { convert } = useExportOverlayFormat();
    const { copyToClipboard } = useCopyToClipboard();
    const { download } = useDownload();
    const { timeSince, isNew } = useTimeSince();
    const {
      get: getBuild,
      update: updateBuild,
      error,
    } = useCollection("builds");
    const { get: getCreator, add: addCreator } = useCollection("creators");
    const { validateBuild, validateVideo } = useBuildValidator();
    const {
      extractVideoId,
      buildEmbedUrl,
      getVideoCreatorId,
      getVideoMetaData,
      getChannelIcon
    } = useYoutube();

    onMounted(async () => {
      const resBuild = await getBuild(props.id);
      if (resBuild.creatorId) {
        const resCreator = await getCreator(resBuild.creatorId);
        creatorName.value = resCreator.creatorDisplayTitle
          ? resCreator.creatorDisplayTitle
          : resCreator.creatorTitle;
      }

      build.value = resBuild;
      document.title = build.value.title + " - " + document.title;
    });

    const handleDuplicate = async () => {
      var template = {
        author: "",
        authorUid: "",
        description: build.value.description,
        title: build.value.title + " - copy",
        sortTitle: "", //firestore does not support case-insensitive sorting
        steps: build.value.steps,
        video: build.value.video,
        civ: build.value.civ,
        map: build.value.map || "",
        season: build.value.season,
        strategy: build.value.strategy,
        isDraft: false,
        views: 0,
        likes: 0,
        score: 0,
        timeCreated: null,
        timeUpdated: null,
      };

      store.commit("setTemplate", template);
      router.push({ name: "BuildNew" });
    };

    const handleSave = async () => {
      error.value = validateBuild(build.value);
      sanitizeSteps();

      //Write to database
      if (!error.value) {
        build.value.sortTitle =
          build.value.title.toLowerCase() + crypto.randomUUID();

        //Add creatorId if empty for some reason...
        if (!build.value.creatorId && build.value.video) {
          const videoId = extractVideoId(build.value.video);
          build.value.creatorId = await getVideoCreatorId(videoId);
        }

        //Update build order document
        await updateBuild(props.id, build.value);

        if (build.value.video) {
          //Add content creator document
          const creatorDoc = await getVideoMetaData(
            extractVideoId(build.value.video)
          );
          const res = await getCreator(creatorDoc.creatorId);
          console.log(creatorDoc);
          if (!res) {
            creatorDoc.creatorImage = await getChannelIcon(creatorDoc.creatorId);
            await addCreator(creatorDoc, creatorDoc.creatorId);
            store.commit("addCreator", creatorDoc);
          }
        }

        //Navigate to new build order
        if (!error.value) {
          router.replace("/builds/" + props.id);
        }
      }
    };

    const sanitizeSteps = () => {  
      build.value.steps.forEach(function(stepCollection){
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
      })
    };

    const handleCopyOverlayFormat = () => {
      const overlayBuild = convert(build.value);
      const overlayBuildString = JSON.stringify(overlayBuild, null, 3);
      copyToClipboard(overlayBuildString);
    };

    const handleDownloadOverlayFormat = () => {
      const overlayBuild = convert(build.value);
      const overlayBuildString = JSON.stringify(overlayBuild, null, 3);
      download(overlayBuildString, build.value.title);
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
        creatorName.value = (await getVideoMetaData(videoId)).creatorTitle;
      } else {
        creatorName.value = "";
        build.value.creatorId = "";
      }
    };

    return {
      build,
      error,
      user,
      civs,
      maps,
      strategies,
      seasons,
      handleSave,
      handleDuplicate,
      handleCopyOverlayFormat,
      handleDownloadOverlayFormat,
      handleStepsChanged,
      handleVideoInput,
      timeSince,
      isNew,
      creatorName
    };
  },
};
</script>

<style scoped></style>
