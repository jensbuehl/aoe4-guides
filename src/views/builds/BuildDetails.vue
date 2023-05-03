<template>
  <v-container v-if="build">
    <v-card rounded="lg">
      <v-row no-gutters align="center" justify="center" class="fill-height d-flex flex-nowrap">
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
          md="3"
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
          <v-card-title class="py-2 mb-4">
            {{ build.title }}
          </v-card-title>
          <v-item-group class="ml-4 pt-2 hidden-sm-and-up">
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
          <v-item-group class="ml-4 pt-2 hidden-xs">
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
          <v-item-group class="ml-4 hidden-sm-and-up">
            <v-chip class="mr-2 mb-2" label size="x-small"
              ><v-icon start icon="mdi-account-edit"></v-icon
              >{{ build.author }}</v-chip
            >
            <v-chip class="mr-2 mb-2" label size="x-small" v-show="build.views">
              <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}</v-chip
            >
            <v-chip v-show="build.likes" class="mr-2 mb-2" label size="x-small">
              <v-icon start icon="mdi-heart"></v-icon>
              {{ build.likes }}</v-chip
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
          <v-item-group class="ml-4 hidden-xs">
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
        </v-col>
        <v-row
          no-gutters
          justify="end"
          align="center"
          class="my-2 mr-4 flex-nowrap"
        >
          <v-col cols="auto" class="mr-4">
            <v-tooltip location="top" text="Edit Build Order">
              <template :props="props" v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  color="primary"
                  variant="text"
                  block
                  v-show="user"
                  icon="mdi-thumb-up"
                  :to="{ name: 'BuildEdit', params: { id: id } }"
                ></v-btn>
              </template>
            </v-tooltip>
            <v-tooltip location="top" text="Edit Build Order">
              <template :props="props" v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  color="primary"
                  variant="text"
                  v-show="user"
                  icon="mdi-thumb-down"
                  :to="{ name: 'BuildEdit', params: { id: id } }"
                ></v-btn>
              </template>
            </v-tooltip>
          </v-col>
          <v-col cols="auto">
            <Favorite
              @favoriteAdded="
                () => {
                  build.likes++;
                }
              "
              @favoriteRemoved="
                () => {
                  build.likes--;
                }
              "
              v-if="user"
              :buildId="build.id"
              :userId="user?.uid"
            ></Favorite>
            <v-tooltip location="top" text="Edit Build Order">
              <template :props="props" v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  color="primary"
                  variant="text"
                  block
                  v-show="user?.uid === build.authorUid"
                  icon="mdi-pencil"
                  :to="{ name: 'BuildEdit', params: { id: id } }"
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
                <v-divider v-show="user?.uid === build.authorUid"></v-divider>
                <v-tooltip text="Delete Build Order">
                  <template v-slot:activator="{ props }">
                    <v-list-item
                      v-bind="props"
                      v-show="user?.uid === build.authorUid"
                      @click="dialog = true"
                    >
                      <v-icon color="primary" class="mr-4">mdi-delete</v-icon>
                      Delete
                    </v-list-item>
                  </template>
                </v-tooltip>
              </v-list>
            </v-menu>
            <v-dialog v-model="dialog" width="auto">
              <v-card rounded="lg" class="text-center primary">
                <v-card-title>Delete Build</v-card-title>
                <v-card-text>
                  Do you really want to delete this build?<br />
                  The action cannot be undone.
                </v-card-text>
                <v-card-actions>
                  <v-btn color="error" block @click="handleDelete"
                    >Delete</v-btn
                  >
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-col>
        </v-row>
      </v-row>
    </v-card>

    <v-card v-if="build.description" rounded="lg" class="mt-4">
      <v-card-title>Description</v-card-title>
      <v-card-text style="white-space: pre-line">{{
        build.description
      }}</v-card-text>
    </v-card>

    <v-card v-if="build.video" rounded="lg" class="mt-4">
      <v-card-title>Video</v-card-title>
      <div align="center">
        <iframe
          width="100%"
          height="250px"
          :src="build.video"
          frameborder="0"
          class="mb-3"
          allowfullscreen
        ></iframe>
      </div>
    </v-card>

    <StepsEditor
      :steps="build.steps"
      :readonly="true"
      :civ="build.civ"
    ></StepsEditor>

    <div class="mt-4">
      <Discussion v-if="user" :buildId="build.id"></Discussion>
    </div>
  </v-container>
</template>

<script>
import Favorite from "../../components/Favorite.vue";
import StepsEditor from "../../components/StepsEditor.vue";
import Discussion from "../../components/Discussion.vue";
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import useCollection from "../../composables/useCollection";
import getCivs from "../../composables/getCivs";
import useTimeSince from "../../composables/useTimeSince";
import useOverlayConversion from "../../composables/useOverlayConversion";

export default {
  name: "BuildDetails",
  components: { Favorite, Discussion, StepsEditor },
  props: ["id"],
  setup(props) {
    window.scrollTo(0, 0);

    const store = useStore();
    const router = useRouter();
    const user = computed(() => store.state.user);
    const civs = getCivs().civs;
    const build = ref(null);
    const dialog = ref(false);
    const { convertToOverlayFormat, download, copyToClipboard } =
      useOverlayConversion();
    const { timeSince, isNew } = useTimeSince();
    const { get, del, incrementViews, error } = useCollection("builds");

    onMounted(async () => {
      const res = await get(props.id);
      build.value = res;
      incrementViews(props.id);
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

    const handleDelete = async () => {
      dialog.value = false;
      await del(props.id);
      if (!error.value) {
        router.go("-1");
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

    return {
      build,
      props,
      user,
      civs,
      error,
      dialog,
      window,
      handleDelete,
      handleDuplicate,
      handleCopyOverlayFormat,
      handleDownloadOverlayFormat,
      timeSince,
      isNew,
    };
  },
};
</script>

<style scoped></style>
