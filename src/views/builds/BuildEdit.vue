<template>
  <v-container v-if="user && build">
    <v-card rounded="lg">
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
              v-if="isNew(build.timeCreated.toDate())"
              label
              color="primary"
              size="x-small"
              ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
            >
            <v-chip
              color="primary"
              class="mr-2 mb-2"
              v-if="build.season"
              label
              size="x-small"
              >{{ build.season }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              color="primary"
              v-if="build.map"
              label
              size="x-small"
              >{{ build.map }}</v-chip
            >
            <v-chip
              color="primary"
              class="mr-2 mb-2"
              v-if="build.strategy"
              label
              size="x-small"
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
              v-if="isNew(build.timeCreated.toDate())"
              label
              color="primary"
              size="small"
              ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
            >
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
              <template :props="props" v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  color="primary"
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
                  color="primary"
                  variant="text"
                  v-bind="props"
                ></v-btn>
              </template>
              <v-list>
                <v-tooltip text="Duplicate and Edit Build Order">
                  <template v-slot:activator="{ props }">
                    <v-list-item
                      v-show="user"
                      @click="handleDuplicate"
                      v-bind="props"
                    >
                      <v-icon color="primary" class="mr-4"
                        >mdi-content-duplicate</v-icon
                      >
                      Duplicate Build
                    </v-list-item>
                  </template>
                </v-tooltip>
                <v-list-item @click="handleCopyOverlayFormat">
                  <v-tooltip
                    text="Copy RTS_Overlay / AoE4_Overlay Format to Clipboard"
                  >
                    <template v-slot:activator="{ props }">
                      <v-icon color="primary" class="mr-5" v-bind="props"
                        >mdi-content-copy
                      </v-icon>
                      <v-list-item-content v-bind="props"
                        >Overlay Tool</v-list-item-content
                      >
                    </template>
                  </v-tooltip>
                  <v-tooltip
                    location="top"
                    text="Visit AoE4_Overlay Project Page"
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
                        color="primary"
                        class="ml-2"
                        >mdi-information-outline</v-icon
                      >
                    </template>
                  </v-tooltip>
                </v-list-item>
                <v-tooltip text="Download RTS_Overlay / AoE4_Overlay File">
                  <template v-slot:activator="{ props }">
                    <v-list-item
                      v-bind="props"
                      @click="handleDownloadOverlayFormat"
                    >
                      <v-icon color="primary" class="mr-4">mdi-download</v-icon>
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
        align="center"
        justify="center"
        class="fill-height d-flex flex-nowrap hidden-sm-and-down"
      >
        <v-col
          v-if="build.civ"
          cols="2"
          md="4"
          lg="3"
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
        <v-col
          v-if="!build.civ"
          cols="2"
          md="4"
          lg="3"
          class="pa-0 ma-0 hidden-sm-and-down"
        >
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
        <v-col cols="9" md="6">
          <v-card-title class="py-2 mb-4 hidden-sm-and-down">
            {{ build.title }}
          </v-card-title>
          <v-item-group class="ml-4 pt-2 hidden-sm-and-down">
            <v-chip
              class="mr-2 mb-2"
              v-if="isNew(build.timeCreated.toDate())"
              label
              color="primary"
              size="small"
              ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
            >
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
        <v-row justify="end" class="my-2 mr-2 hidden-sm-and-down">
          <v-col cols="auto">
            <v-tooltip location="top" text="Save Build Order">
              <template :props="props" v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  color="primary"
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
                  color="primary"
                  variant="text"
                  v-bind="props"
                ></v-btn>
              </template>
              <v-list>
                <v-tooltip text="Duplicate and Edit Build Order">
                  <template v-slot:activator="{ props }">
                    <v-list-item
                      v-show="user"
                      @click="handleDuplicate"
                      v-bind="props"
                    >
                      <v-icon color="primary" class="mr-4"
                        >mdi-content-duplicate</v-icon
                      >
                      Duplicate Build
                    </v-list-item>
                  </template>
                </v-tooltip>
                <v-list-item @click="handleCopyOverlayFormat">
                  <v-tooltip
                    text="Copy RTS_Overlay / AoE4_Overlay Format to Clipboard"
                  >
                    <template v-slot:activator="{ props }">
                      <v-icon color="primary" class="mr-5" v-bind="props"
                        >mdi-content-copy
                      </v-icon>
                      <v-list-item-content v-bind="props"
                        >Overlay Tool</v-list-item-content
                      >
                    </template>
                  </v-tooltip>
                  <v-tooltip
                    location="top"
                    text="Visit AoE4_Overlay Project Page"
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
                        color="primary"
                        class="ml-2"
                        >mdi-information-outline</v-icon
                      >
                    </template>
                  </v-tooltip>
                </v-list-item>
                <v-tooltip text="Download RTS_Overlay / AoE4_Overlay File">
                  <template v-slot:activator="{ props }">
                    <v-list-item
                      v-bind="props"
                      @click="handleDownloadOverlayFormat"
                    >
                      <v-icon color="primary" class="mr-4">mdi-download</v-icon>
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
        <v-card rounded="lg" class="mt-4" fluid fill-height>
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
import Favorite from "../../components/Favorite.vue";
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
import useOverlayConversion from "../../composables/useOverlayConversion";

export default {
  name: "BuildEdit",
  components: { Favorite, StepsEditor },
  props: ["id"],
  setup(props) {
    window.scrollTo(0, 0);

    const store = useStore();
    const router = useRouter();
    const user = computed(() => store.state.user);
    const civs = getCivs().civs;
    const matchups = getCivs().civs;
    const maps = getMaps().maps;
    const seasons = getSeasons().seasons;
    const strategies = getStrategies().strategies;
    const build = ref(null);
    const { convertToOverlayFormat, download, copyToClipboard } =
      useOverlayConversion();
    const { timeSince, isNew } = useTimeSince();
    const { get, update, error } = useCollection("builds");

    onMounted(async () => {
      const res = await get(props.id);
      build.value = res;
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
        map: build.value.map,
        season: build.value.season,
        strategy: build.value.strategy,
        views: 0,
        likes: 0,
        timeCreated: null,
        timeUpdated: null,
      };

      store.commit("setTemplate", template);
      router.push({ name: "BuildNew" });
    };

    const handleSave = async () => {
      build.value.sortTitle =
        build.value.title.toLowerCase() + crypto.randomUUID();
      await update(props.id, build.value);
      if (!error.value) {
        router.push("/builds/" + props.id);
      }
    };

    const handleCopyOverlayFormat = () => {
      const overlayBuild = convertToOverlayFormat(build.value);
      const overlayBuildString = JSON.stringify(overlayBuild, null, 3);
      copyToClipboard(overlayBuildString);
    };

    const handleDownloadOverlayFormat = () => {
      const overlayBuild = convertToOverlayFormat(build.value);
      const overlayBuildString = JSON.stringify(overlayBuild, null, 3);
      download(overlayBuildString, build.value.title);
    };

    const handleStepsChanged = (steps) => {
      build.value.steps = steps;
    };
    const handleVideoInput = () => {
      build.value.video = build.value.video.replace(/watch\?v=/, "embed/");
    };

    return {
      build,
      user,
      civs,
      matchups,
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
    };
  },
};
</script>

<style scoped></style>
