<template>
  <!-- Loading skeleton (edit mode before fetch resolves) -->
  <v-container v-if="!isLoaded" class="pb-footer">
    <v-skeleton-loader type="card" class="mt-2"></v-skeleton-loader>
    <v-row class="mt-2">
      <v-col cols="12" md="8">
        <v-skeleton-loader type="card, sentences"></v-skeleton-loader>
      </v-col>
      <v-col cols="12" md="4">
        <v-skeleton-loader type="card"></v-skeleton-loader>
      </v-col>
    </v-row>
  </v-container>

  <!-- Editor form -->
  <v-container v-else-if="user && build">
    <BuildHeader :build="build" :readonly="false">
      <template v-slot:actions>
        <div class="d-flex flex-column align-end pa-1" style="height: 100%">
          <div class="d-flex align-center ga-1">
          <v-btn color="accent" size="small" prepend-icon="mdi-publish" @click="handleSave">
            <span class="d-none d-sm-inline">Publish</span>
            <span class="d-sm-none">Publish</span>
          </v-btn>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn class="ml-2" icon="mdi-dots-vertical" size="small" color="accent" variant="text" v-bind="props"></v-btn>
            </template>
            <v-list>
              <v-list-item @click="handleDraft">
                <v-icon color="accent" class="mr-4">mdi-content-save-outline</v-icon>
                Save as draft
              </v-list-item>
              <v-list-item :disabled="!isDirty" @click="handleDiscard">
                <v-icon color="accent" class="mr-4">mdi-undo</v-icon>
                Discard changes
              </v-list-item>
              <v-divider v-if="mode === 'edit'" class="my-1"></v-divider>
              <v-list-item v-if="mode === 'edit'" @click="handleDuplicate">
                <v-icon color="accent" class="mr-4">mdi-content-duplicate</v-icon>
                Duplicate build
              </v-list-item>
              <v-list-item v-if="mode === 'edit' && clipboardIsSupported" @click="handleCopyOverlayFormat">
                <v-icon color="accent" class="mr-4">mdi-content-copy</v-icon>
                Copy to overlay tool
              </v-list-item>
              <v-list-item v-if="mode === 'edit'" @click="handleDownloadOverlayFormat">
                <v-icon color="accent" class="mr-4">mdi-download</v-icon>
                Download as file
              </v-list-item>
            </v-list>
          </v-menu>
          </div>
          <v-spacer></v-spacer>
          <span v-if="isDirty" class="unsaved-indicator text-caption">
            <v-icon size="x-small" color="warning">mdi-circle-medium</v-icon>Unsaved
          </span>
        </div>
      </template>
    </BuildHeader>

    <!-- Build details card -->
    <v-card flat rounded="lg" class="mt-4">
      <div class="build-card-section-header d-flex align-center px-4 ga-2">
        <v-icon size="16" color="accent">mdi-text-box-outline</v-icon>
        <span class="text-caption text-uppercase font-weight-bold">Build details</span>
      </div>
      <v-card-text class="pt-4 pb-2">
        <v-text-field
          label="Title"
          density="compact"
          v-model="build.title"
        ></v-text-field>
        <v-textarea
          label="Description"
          rows="2"
          density="compact"
          v-model="build.description"
        ></v-textarea>
        <v-text-field
          label="Video"
          density="compact"
          @update:model-value="handleVideoInput"
          v-model="build.video"
          placeholder="https://youtube.com/watch?v=..."
        ></v-text-field>
        <div v-if="ytState === 'valid'" class="d-flex align-center gap-2 mt-2 mb-1">
          <v-img
            class="yt-thumb rounded mr-3"
            :src="`https://img.youtube.com/vi/${ytVideoId}/mqdefault.jpg`"
            max-width="120"
            cover
          ></v-img>
          <v-chip color="success" size="x-small" label>
            <v-icon start>mdi-check-circle</v-icon>Valid YouTube link
          </v-chip>
        </div>
        <div v-if="ytState === 'invalid'" class="d-flex align-center mt-2 mb-1">
          <v-chip color="error" size="x-small" label>
            <v-icon start>mdi-alert-circle-outline</v-icon>Invalid URL
          </v-chip>
        </div>
      </v-card-text>
    </v-card>

    <!-- Classification card -->
    <v-card flat rounded="lg" class="mt-4">
      <div class="build-card-section-header d-flex align-center px-4 ga-2">
        <v-icon size="16" color="accent">mdi-tag-outline</v-icon>
        <span class="text-caption text-uppercase font-weight-bold">Classification</span>
      </div>
      <v-card-text class="pb-2">
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-select
              prepend-icon="mdi-earth"
              label="Civilization"
              :items="civs"
              v-model="build.civ"
              density="compact"
              item-value="shortName"
              item-title="title"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              prepend-icon="mdi-trophy"
              label="Season"
              :items="seasons"
              v-model="build.season"
              density="compact"
              item-value="title"
              item-title="title"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              prepend-icon="mdi-map"
              label="Map"
              :items="maps"
              v-model="build.map"
              density="compact"
              item-value="title"
              item-title="title"
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              prepend-icon="mdi-strategy"
              label="Strategy"
              :items="strategies"
              v-model="build.strategy"
              density="compact"
              item-value="title"
              item-title="title"
              clearable
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <BuildOrderEditor
      :key="buildOrderKey"
      @stepsChanged="handleStepsChanged"
      :steps="build.steps"
      :civ="build.civ"
    ></BuildOrderEditor>

  </v-container>
</template>

<script>
import { ref, computed, watch, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { onBeforeRouteLeave } from "vue-router";
import sanitizeHtml from "sanitize-html";

import BuildOrderEditor from "@/components/builds/BuildOrderEditor.vue";
import BuildHeader from "@/components/builds/BuildHeader.vue";

import { getCreator, addCreator } from "@/composables/data/creatorService";
import {
  addBuild,
  getBuild,
  updateBuild,
  getUserDraftsCount,
  error as buildServiceError,
} from "@/composables/data/buildService";
import {
  addContributor,
  getContributor,
  incrementBuilds,
} from "@/composables/data/contributorService";
import { validateBuild } from "@/composables/builds/buildOrderValidator";
import youtubeService from "@/composables/builds/youtubeService";
import { civs as allCivs } from "@/composables/filter/civDefaultProvider";
import { seasons } from "@/composables/filter/seasonDefaultProvider";
import { maps } from "@/composables/filter/mapDefaultProvider";
import { strategies } from "@/composables/filter/strategyDefaultProvider";
import useExportOverlayFormat from "@/composables/converter/useExportOverlayFormat";
import useCopyToClipboard from "@/composables/converter/useCopyToClipboard";
import useDownload from "@/composables/converter/useDownload";

export default {
  name: "BuildEditor",
  components: { BuildOrderEditor, BuildHeader },
  props: {
    mode: {
      type: String,
      required: true,
      validator: (v) => ["new", "edit"].includes(v),
    },
    id: {
      type: String,
      default: null,
    },
  },
  setup(props) {
    const store = useStore();
    const router = useRouter();

    const error = ref(null);
    const user = computed(() => store.state.user);
    const build = ref(null);
    const originalBuild = ref(null);
    const isLoaded = ref(false);
    const isDirty = ref(false);
    const buildOrderKey = ref(0);
    const ytState = ref("empty");
    const ytVideoId = ref(null);
    const clipboardIsSupported = ref(false);
    let ytDebounceTimer = null;

    const civs = allCivs.value.filter((element) => element.shortName !== "ANY");
    const { convert } = useExportOverlayFormat();
    const { copyToClipboard, copyToClipboardSupported } = useCopyToClipboard();
    const { download } = useDownload();
    const { extractVideoId, buildEmbedUrl, getVideoCreatorId, getVideoMetaData, getChannelIcon } =
      youtubeService();

    // Create mode: initialize synchronously before watcher is set up
    if (props.mode === "new") {
      const template = store.state.template;
      if (template) {
        build.value = template;
        store.commit("setTemplate", null);
      } else {
        build.value = {
          author: "",
          authorUid: "",
          description: "",
          title: "",
          sortTitle: "",
          steps: [
            {
              type: "age",
              age: 0,
              gameplan: "",
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
          creatorId: null,
          creatorName: "",
          civ: "",
          map: "",
          season: "Season 13",
          strategy: "",
          views: 0,
          likes: 0,
          upvotes: 0,
          downvotes: 0,
          score: 0,
          comments: 0,
          scoreAllTime: 0,
          isDraft: false,
          timeCreated: null,
          timeUpdated: null,
        };
      }
      originalBuild.value = JSON.parse(JSON.stringify(build.value));
      isLoaded.value = true;
    }

    onMounted(async () => {
      if (props.mode === "edit") {
        let resBuild = null;
        if (props.id in store.state.cache.builds) {
          resBuild = store.state.cache.builds[props.id];
        } else {
          resBuild = await getBuild(props.id);
        }

        if (!resBuild) {
          router.replace({ name: "NotFound" });
          return;
        }

        build.value = resBuild;
        document.title = build.value.title + " - " + document.title;
        originalBuild.value = JSON.parse(JSON.stringify(resBuild));

        // Seed ytState for existing video so thumbnail shows on load
        if (build.value.video) {
          const existingId = extractVideoId(build.value.video);
          if (existingId) {
            ytVideoId.value = existingId;
            ytState.value = "valid";
          }
        }

        isLoaded.value = true;
      }

      clipboardIsSupported.value = await copyToClipboardSupported();
    });

    // flush:'sync' fires the callback in the same tick as the assignment, so the
    // isLoaded guard works correctly during onMounted hydration (async flush would
    // see isLoaded=true and spuriously mark the form dirty on first load).
    watch(
      build,
      () => {
        if (isLoaded.value) isDirty.value = true;
      },
      { deep: true, flush: "sync" }
    );

    // Navigation guard when unsaved changes exist
    onBeforeRouteLeave(() => {
      if (isDirty.value) {
        return window.confirm("You have unsaved changes — leave anyway?");
      }
    });

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

    const handleSave = async () => {
      error.value = validateBuild(build.value);
      sanitizeSteps();

      if (!error.value) {
        build.value.sortTitle = build.value.title.toLowerCase() + crypto.randomUUID();

        if (props.mode === "new") {
          build.value.authorUid = user.value.uid;
          build.value.author = user.value.displayName;
        }

        if (!build.value.creatorId && build.value.video) {
          const videoId = extractVideoId(build.value.video);
          build.value.creatorId = (await getVideoCreatorId(videoId)) ?? null;
        }

        if (build.value.video) {
          const creatorDoc = await getVideoMetaData(extractVideoId(build.value.video));
          if (creatorDoc) {
            const res = await getCreator(creatorDoc.creatorId);
            if (!res) {
              creatorDoc.creatorImage = await getChannelIcon(creatorDoc.creatorId);
              await addCreator(creatorDoc, creatorDoc.creatorId);
            } else {
              build.value.creatorName = res.creatorDisplayTitle
                ? res.creatorDisplayTitle
                : res.creatorTitle;
            }
          }
        }

        let buildId = props.id;

        if (props.mode === "new") {
          const res = await getContributor(build.value.authorUid);
          if (!res) {
            await addContributor(
              { displayName: build.value.author, boCount: 1 },
              build.value.authorUid
            );
          } else {
            await incrementBuilds(build.value.authorUid);
          }
          buildId = await addBuild(build.value);
          store.commit("setBuild", build.value);
        } else {
          await updateBuild(props.id, build.value);
          store.commit("setBuild", build.value);
        }

        if (!error.value && !buildServiceError.value) {
          await store.dispatch("showSnackbar", {
            text:
              props.mode === "new"
                ? "Build order created successfully!"
                : "Build order updated successfully!",
            type: "success",
          });

          if (props.mode === "new") {
            store.commit("setAllBuildsList", null);
            store.commit("setMyBuildsList", null);
            store.commit("setMyFavoritesList", null);
          }

          isDirty.value = false;
          originalBuild.value = JSON.parse(JSON.stringify(build.value));
          router.replace("/builds/" + buildId);
        } else {
          const errorMessage = error.value ? error.value : buildServiceError.value;
          await store.dispatch("showSnackbar", { text: errorMessage, type: "error" });
        }
      } else {
        const errorMessage = error.value ? error.value : buildServiceError.value;
        await store.dispatch("showSnackbar", { text: errorMessage, type: "error" });
      }
    };

    const handleDraft = async () => {
      if (props.mode === "new") {
        const maxDrafts = 10;
        const size = await getUserDraftsCount(user.value.uid);
        if (size >= maxDrafts) {
          await store.dispatch("showSnackbar", {
            text: "Oh, no! Villagers can only work on up to 10 drafts at a time. Please, don't forget to publish or delete your unfinished builds.",
            type: "error",
          });
          return;
        }
      }
      build.value.isDraft = true;
      await handleSave();
    };

    const handleDiscard = () => {
      const { timeCreated, timeUpdated } = build.value;
      Object.assign(build.value, JSON.parse(JSON.stringify(originalBuild.value)));
      // Restore Firestore Timestamps — JSON round-trip strips .toDate()
      build.value.timeCreated = timeCreated;
      build.value.timeUpdated = timeUpdated;
      isDirty.value = false;
      buildOrderKey.value++;
    };

    const handleVideoInput = (newValue) => {
      clearTimeout(ytDebounceTimer);

      const video = newValue ?? "";
      if (!video.trim()) {
        ytState.value = "empty";
        ytVideoId.value = null;
        return;
      }

      ytDebounceTimer = setTimeout(async () => {
        let id = null;
        try { id = extractVideoId(video); } catch { /* non-YouTube URL */ }
        if (id) {
          ytVideoId.value = id;
          ytState.value = "valid";
          build.value.video = buildEmbedUrl(id);
          build.value.creatorId = (await getVideoCreatorId(id)) ?? null;
        } else {
          ytState.value = "invalid";
          build.value.creatorName = "";
          build.value.creatorId = "";
        }
      }, 400);
    };

    const handleStepsChanged = (sections) => {
      build.value.steps = sections;
    };

    const handleDuplicate = async () => {
      const template = {
        author: "",
        authorUid: "",
        description: build.value.description,
        title: build.value.title + " - copy",
        sortTitle: "",
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
        comments: 0,
        scoreAllTime: 0,
        timeCreated: null,
        timeUpdated: null,
      };
      store.commit("setTemplate", template);
      router.push({ name: "BuildNew" });
    };

    const handleCopyOverlayFormat = () => {
      const overlayBuild = convert(build.value);
      copyToClipboard(JSON.stringify(overlayBuild, null, 3));
    };

    const handleDownloadOverlayFormat = () => {
      const overlayBuild = convert(build.value);
      download(JSON.stringify(overlayBuild, null, 3), build.value.title);
    };

    return {
      build,
      buildOrderKey,
      error,
      user,
      civs,
      maps,
      strategies,
      seasons,
      isLoaded,
      isDirty,
      ytState,
      ytVideoId,
      clipboardIsSupported,
      handleSave,
      handleDraft,
      handleDiscard,
      handleVideoInput,
      handleStepsChanged,
      handleDuplicate,
      handleCopyOverlayFormat,
      handleDownloadOverlayFormat,
    };
  },
};
</script>

<style scoped>
.build-card-section-header {
  letter-spacing: 0.05em;
  height: 36px;
}

.unsaved-indicator {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0.6;
}

.yt-thumb {
  flex-shrink: 0;
}
</style>
