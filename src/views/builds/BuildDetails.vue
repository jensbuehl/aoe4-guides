<template>
  <v-dialog
    v-model="focusDialog"
    fullscreen
    content-class="focus-dialog"
    transition="dialog-bottom-transition"
  >
    <FocusMode
      ref="focusModeRef"
      v-on:closeDialog="focusDialog = false"
      @poppedOut="handlePoppedOut"
      @popOutFailed="handlePopOutFailed"
      :popOut="popOutRequest"
      :build="build"
    ></FocusMode>
  </v-dialog>

  <!-- Build not found -->
  <v-container align="center" v-if="!loading && !build"
    ><BuildNotFound></BuildNotFound
  ></v-container>

  <v-container
    v-if="build"
    v-touch="{
      up: () => swipe('Up'),
      down: () => swipe('Down'),
    }"
  >
    <v-dialog v-model="deleteDialog" width="auto">
      <v-card rounded="lg" flat class="text-center primary">
        <v-card-title>Delete Build</v-card-title>
        <v-card-text>
          Do you really want to delete this build?<br />
          The action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-btn type="button" color="error" block @click="handleDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <BuildShareDialog v-model="shareDialog" :build="build"></BuildShareDialog>

    <BuildHeader :build="build" :readonly="true">
      <template v-slot:actions>
        <!-- Vote + Favorite: desktop only -->
        <div class="d-none d-md-flex align-center">
          <Vote
            v-if="userData"
            v-model="userData"
            :buildId="build.id"
            @voteUpAdded="() => { build.upvotes++; }"
            @voteUpRemoved="() => { build.upvotes--; }"
          ></Vote>
          <Favorite v-if="userData" v-model="userData" :buildId="build.id"></Favorite>
        </div>
        <!-- Overflow menu: always visible (mobile slim header + desktop) -->
        <!-- No v-model here: BuildHeader renders this slot twice (mobile card and
             desktop card, one hidden by CSS), so a shared open-state ref would
             open both menus at once — the hidden one at 0,0 for lack of a
             positioned activator. Vuetify's per-instance state is what we want;
             the trailing buttons below close their own menu via isActive. -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-dots-vertical" color="accent" variant="text" v-bind="props"></v-btn>
          </template>
          <template v-slot:default="{ isActive }">
            <v-list>
              <v-tooltip>
                <span :style="{ color: $vuetify.theme.current.colors.primary }"
                  >Change the steps, timings or details of this build order</span
                >
                <template v-slot:activator="{ props }">
                  <v-list-item
                    v-show="user?.uid === build.authorUid"
                    :to="{ name: 'BuildEdit', params: { id: id } }"
                    v-bind="props"
                  >
                    <v-icon color="accent" class="mr-4">mdi-pencil</v-icon>
                    Edit
                  </v-list-item>
                </template>
              </v-tooltip>
              <v-tooltip>
                <span :style="{ color: $vuetify.theme.current.colors.primary }"
                  >Make this draft public so other players can find it</span
                >
                <template v-slot:activator="{ props }">
                  <v-list-item v-show="user && build.isDraft" v-bind="props" @click="handlePublish">
                    <v-icon color="accent" class="mr-4">mdi-publish</v-icon>
                    Publish
                  </v-list-item>
                </template>
              </v-tooltip>
              <v-tooltip>
                <span :style="{ color: $vuetify.theme.current.colors.primary }"
                  >Start your own build order from a copy of this one</span
                >
                <template v-slot:activator="{ props }">
                  <v-list-item v-show="user" v-bind="props" @click="handleRemix">
                    <v-icon color="accent" class="mr-4">mdi-shuffle-variant</v-icon>
                    Remix
                  </v-list-item>
                </template>
              </v-tooltip>
              <v-tooltip>
                <span :style="{ color: $vuetify.theme.current.colors.primary }"
                  >Get a link or QR code to this build order</span
                >
                <template v-slot:activator="{ props }">
                  <v-list-item v-bind="props" @click="shareDialog = true">
                    <v-icon color="accent" class="mr-4">mdi-share-variant</v-icon>
                    Share
                  </v-list-item>
                </template>
              </v-tooltip>
              <!-- One row for the whole "get this into RTS Overlay" errand. The row
                   is the easy path (no file handling); the trailing buttons are the
                   manual import for the desktop overlay app. They need .stop so the
                   row's own handler doesn't also fire, which also suppresses the
                   menu's close-on-content-click — hence the explicit isActive.
                   This row carries three tooltips, so the row's own one hangs off
                   the label rather than the whole item: hovering a trailing button
                   would otherwise open the row tooltip on top of the button's. -->
              <v-list-item @click="handleOpenInOverlayTool">
                <v-tooltip>
                  <span :style="{ color: $vuetify.theme.current.colors.primary }"
                    >Open this build order in the RTS Overlay web app, in a new tab</span
                  >
                  <template v-slot:activator="{ props }">
                    <span class="d-flex align-center" v-bind="props">
                      <v-icon color="accent" class="mr-4">mdi-button-cursor</v-icon>
                      Open in RTS Overlay
                    </span>
                  </template>
                </v-tooltip>
                <template v-slot:append>
                  <div class="d-flex align-center ga-1 ml-4">
                    <v-tooltip v-if="clipboardIsSupported">
                      <span :style="{ color: $vuetify.theme.current.colors.primary }"
                        >Copy this build order to clipboard for the overlay tool</span
                      >
                      <template v-slot:activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon="mdi-content-copy"
                          variant="text"
                          size="small"
                          color="accent"
                          aria-label="Copy build order for the overlay tool"
                          @click.stop="isActive.value = false; handleCopyOverlayFormat()"
                        ></v-btn>
                      </template>
                    </v-tooltip>
                    <v-tooltip>
                      <span :style="{ color: $vuetify.theme.current.colors.primary }"
                        >Download this build order as a file for the overlay tool</span
                      >
                      <template v-slot:activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon="mdi-download"
                          variant="text"
                          size="small"
                          color="accent"
                          aria-label="Download build order for the overlay tool"
                          @click.stop="isActive.value = false; handleDownloadOverlayFormat()"
                        ></v-btn>
                      </template>
                    </v-tooltip>
                  </div>
                </template>
              </v-list-item>
              <v-divider v-show="user?.uid === build.authorUid"></v-divider>
              <v-tooltip>
                <span :style="{ color: $vuetify.theme.current.colors.primary }"
                  >Remove this build order - This cannot be undone</span
                >
                <template v-slot:activator="{ props }">
                  <v-list-item
                    v-show="user?.uid === build.authorUid"
                    v-bind="props"
                    @click="deleteDialog = true"
                  >
                    <v-icon color="error" class="mr-4">mdi-delete</v-icon>
                    <span style="color: rgb(var(--v-theme-error))">Delete</span>
                  </v-list-item>
                </template>
              </v-tooltip>
            </v-list>
          </template>
        </v-menu>
      </template>
      <!-- Vote + Favorite have no other route in on mobile: they are not in the
           overflow menu, and the inline block above is desktop-only. -->
      <template v-slot:mobile-actions>
        <div v-if="userData" class="d-flex d-md-none align-center">
          <Vote
            v-model="userData"
            :buildId="build.id"
            @voteUpAdded="() => { build.upvotes++; }"
            @voteUpRemoved="() => { build.upvotes--; }"
          ></Vote>
          <Favorite v-model="userData" :buildId="build.id"></Favorite>
        </div>
      </template>
    </BuildHeader>

    <!-- Description card: collapsible on mobile, static on desktop -->
    <v-card v-if="build.description" flat rounded="lg" class="mt-4">
      <!-- Mobile: collapsible header -->
      <div
        class="d-md-none build-card-section-header d-flex align-center px-4 ga-2"
        style="cursor: pointer"
        @click="descriptionExpanded = !descriptionExpanded"
      >
        <v-icon size="16" color="accent">mdi-text-box-outline</v-icon>
        <span class="text-caption text-uppercase font-weight-bold flex-grow-1">Description</span>
        <v-icon size="16" :icon="descriptionExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"></v-icon>
      </div>
      <v-expand-transition>
        <!-- wrapper with no padding so height can animate cleanly to 0 -->
        <div v-show="descriptionExpanded" class="d-md-none">
          <v-card-text style="white-space: pre-line">{{ build.description }}</v-card-text>
        </div>
      </v-expand-transition>

      <!-- Desktop: always expanded -->
      <div class="d-none d-md-flex build-card-section-header align-center px-4 ga-2">
        <v-icon size="16" color="accent">mdi-text-box-outline</v-icon>
        <span class="text-caption text-uppercase font-weight-bold">Description</span>
      </div>
      <v-card-text class="d-none d-md-block" style="white-space: pre-line">{{ build.description }}</v-card-text>
    </v-card>

    <!-- Summary of the steps, so it sits immediately before them: the reader gets
         the shape, then the detail. View route only.

         Wrapped so its visibility can be watched: the card sits above a build
         order that runs far past a screenful, and hovering row forty to light up
         a chart two thousand pixels above is work spent on something nobody can
         look at. -->
    <div ref="timelineEl">
      <AgeTimeline :steps="build.steps" />
    </div>

    <BuildOrderEditor
      :steps="build.steps"
      :readonly="true"
      :civ="build.civ"
      :focus="focusMode"
      :link-enabled="timelineVisible"
      @activateFocusMode="handlePlay"
    ></BuildOrderEditor>

    <!-- Video card: always after build order -->
    <v-card flat v-if="build.video" rounded="lg" class="mt-4">
      <div class="build-card-section-header d-flex align-center px-4 ga-2">
        <v-icon size="16" color="accent">mdi-youtube</v-icon>
        <span class="text-caption text-uppercase font-weight-bold">Video</span>
      </div>
      <div class="px-4 pb-4">
        <div style="border-radius: 8px; overflow: hidden; aspect-ratio: 16/9">
          <iframe
            width="100%"
            height="100%"
            :src="build.video"
            frameborder="0"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </v-card>

    <div class="mt-4">
      <Discussion :buildId="build.id"></Discussion>
    </div>
  </v-container>
</template>

<script>
//External
import { ref, onMounted, computed, provide, watch } from "vue";
import { useElementVisibility } from "@vueuse/core";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";

//components
import Favorite from "@/components/Favorite.vue";
import FocusMode from "@/components/builds/FocusMode.vue";
import Vote from "@/components/Vote.vue";
import BuildOrderEditor from "@/components/builds/BuildOrderEditor.vue";
import AgeTimeline from "@/components/builds/AgeTimeline.vue";
import Discussion from "@/components/Discussion.vue";
import BuildNotFound from "@/components/notifications/BuildNotFound.vue";
import BuildHeader from "@/components/builds/BuildHeader.vue";
import BuildShareDialog from "@/components/builds/BuildShareDialog.vue";

//composables
import { getUserFavorites } from "@/composables/data/favoriteService";
import {
  incrementViews as incrementContributorViews,
  decrementBuilds,
  decrementViews,
} from "@/composables/data/contributorService";
import {
  getBuild,
  deleteBuild,
  incrementViews,
  updateBuild,
  error,
} from "@/composables/data/buildService";
import useExportOverlayFormat from "@/composables/converter/useExportOverlayFormat";
import useCopyToClipboard from "@/composables/converter/useCopyToClipboard";
import useDownload from "@/composables/converter/useDownload";
import { useVerificationGuard } from "@/composables/auth/useVerificationGuard";
import { setSavedPlayTarget } from "@/composables/usePlayTargetPreference";
import {
  STEP_HIGHLIGHT,
  useStepHighlight,
} from "@/composables/builds/useStepHighlight.js";

export default {
  name: "BuildDetails",
  components: {
    Favorite,
    Vote,
    Discussion,
    BuildOrderEditor,
    AgeTimeline,
    FocusMode,
    BuildNotFound,
    BuildHeader,
    BuildShareDialog,
  },
  props: ["id"],
  setup(props) {
    //The timeline card and the build order are siblings that never import each
    //other; this page is the only place that knows both exist, so it owns the
    //highlight they share. Created here rather than inside the composable so a
    //page showing two builds cannot end up with one highlight between them.
    provide(STEP_HIGHLIGHT, useStepHighlight());

    //Coarse on purpose: any part of the card showing is enough to be worth
    //answering, and a partial-visibility threshold is a knob nobody can tune by
    //feel
    const timelineEl = ref(null);
    const timelineVisible = useElementVisibility(timelineEl);

    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const { assertVerified } = useVerificationGuard();
    const user = computed(() => store.state.user);
    const build = ref(null);
    const deleteDialog = ref(false);
    const focusDialog = ref(false);
    const shareDialog = ref(false);
    const { convert } = useExportOverlayFormat();
    const { copyToClipboard, copyToClipboardSupported } = useCopyToClipboard();
    const { download } = useDownload();
    const userData = ref(null);
    const loading = ref(true);
    const focusMode = ref(false);
    const clipboardIsSupported = ref(false);
    const descriptionExpanded = ref(true);
    const focusModeRef = ref(null);
    //A counter, not a boolean: choosing the floating window twice in a row is a
    //request twice, and a flag that is already true says nothing the second time.
    //
    //It has to be *cleared* by the other targets, not merely left alone. Focus
    //mode reads it on mount to decide whether to pop straight out, and a counter
    //that only ever climbs answers "has the floating window ever been asked
    //for?" — which is true forever after the first time. Playing here would then
    //pop out anyway on any fresh mount.
    const popOutRequest = ref(0);

    /**
     * Starts the build at the target the player chose.
     *
     * The preference is written once a target has actually run, never when it is
     * clicked. A floating window the browser refuses falls back to the dialog,
     * and persisting the choice at click time would make that one refusal the
     * new default — a single blocked pop-up turning into a permanently wrong
     * button.
     *
     * @param {'here'|'floating'|'phone'} target - Already resolved against this
     *   browser's capabilities by the caller.
     */
    const handlePlay = (target) => {
      if (target === "phone") {
        //The share dialog already carries the QR code and already points it at
        //focus mode. Reused rather than reimplemented.
        shareDialog.value = true;
        setSavedPlayTarget("phone");
        return;
      }

      //Set before the dialog opens, so focus mode has the answer by the time it
      //mounts and reads it.
      popOutRequest.value = target === "floating" ? popOutRequest.value + 1 : 0;
      focusDialog.value = true;
      if (target === "here") setSavedPlayTarget("here");
    };

    const handlePoppedOut = () => {
      setSavedPlayTarget("floating");
    };

    const handlePopOutFailed = () => {
      store.dispatch("showSnackbar", {
        text: "Your browser blocked the floating window. Playing here instead.",
        type: "info",
      });
    };

    //The floating window is a view onto this page's session, so it never
    //outlives the page. The platform only closes it when the opener loads a new
    //*document*, and a route change in this app never does — so build A to build
    //B would otherwise leave a window floating over the game still counting
    //through a build the player has navigated away from.
    watch(
      () => route.fullPath,
      () => {
        focusModeRef.value?.closePiP?.();
        focusDialog.value = false;
      }
    );

    watch(focusDialog, (open) => {
      if (!open) focusModeRef.value?.closePiP?.();
    });

    onMounted(async () => {
      const cachedBuild = props.id in store.state.cache.builds ? store.state.cache.builds[props.id] : null;

      // The build and the user's favorites are independent (favorites only needs
      // the uid, not the build), so fetch them in parallel instead of in series.
      const [resBuild, favorites] = await Promise.all([
        cachedBuild ? Promise.resolve(cachedBuild) : getBuild(props.id),
        user.value ? getUserFavorites(user.value.uid) : Promise.resolve(null),
      ]);

      if (resBuild) {
        if (user.value) {
          userData.value = favorites;
        }

        build.value = resBuild;
        document.title = build.value.title + " - " + document.title;
        incrementViews(props.id);

        //icrement contributor views
        incrementContributorViews(build.value.authorUid);
      }
      if (route.query) {
        focusMode.value = route.query.focus;
      }

      clipboardIsSupported.value = await copyToClipboardSupported();
      loading.value = false;
    });

    const swipe = async (dir) => {
      switch (dir) {
        case "Up":
          store.commit("setShowBottomNavigation", false);
          break;
        case "Down":
          store.commit("setShowBottomNavigation", true);
          break;
      }
    };

    const handleRemix = async () => {
      if (!assertVerified()) return;
      var template = {
        author: "",
        authorUid: "",
        // Credit only points at someone else's work: remixing your own build is
        // just a starting point and gets no attribution line.
        remixOf:
          user.value?.uid === build.value.authorUid
            ? null
            : {
                id: build.value.id,
                title: build.value.title,
                author: build.value.author ?? "",
                authorUid: build.value.authorUid ?? "",
              },
        description: build.value.description,
        title: build.value.title + " (remix)",
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
        comments: 0,
        scoreAllTime: 0,
        timeCreated: null,
        timeUpdated: null,
      };

      store.commit("setTemplate", template);
      router.push({ name: "BuildNew" });
    };

    const handleDelete = async () => {
      await deleteBuild(props.id);

      if (!error.value) {
        store.dispatch("showSnackbar", {
          text: `Build order deleted!`,
          type: "success",
        });

        //decrement build count of contributor object
        decrementBuilds(build.value.authorUid);

        //icrement contributor views
        decrementViews(build.value.authorUid, build.value.views + 1);

        //Reset cache
        store.commit("setRecentBuildsList", null);
        store.commit("removeBuild", props.id);

        // Land on a sensible page instead of the now-deleted build. Prefer the
        // list the user came from (all builds / my builds / my favorites /
        // dashboard); fall back to home. window.history.state.back holds the
        // previous entry's fullPath, or null on a deep link / fresh load.
        // Using replace() (a) drops the deleted build from history so Back
        // can't return to a 404, and (b) always targets a different route than
        // the current one, avoiding the no-op navigation that previously left
        // the deleted build on screen until a manual reload.
        const listRoutes = ["/builds", "/mybuilds", "/favorites", "/dashboard"];
        const back = window.history.state?.back;
        const cameFromList =
          typeof back === "string" && listRoutes.includes(back.split("?")[0]);
        router.replace(cameFromList ? back : "/");
      }
      deleteDialog.value = false;
    };

    const handlePublish = async () => {
      build.value.isDraft = false;
      await updateBuild(props.id, build.value, true);

      //Navigate to new build order
      if (!error.value) {
        store.dispatch("showSnackbar", {
          text: `Draft published successfully!`,
          type: "success",
        });
        router.replace("/builds/" + props.id);
      }
    };

    const handleCopyOverlayFormat = async () => {
      const overlayBuild = convert(build.value);
      const overlayBuildString = JSON.stringify(overlayBuild, null, 3);
      // copyToClipboard resolves false instead of throwing when both the write
      // and its fallback fail, so a discarded result leaves the player with no
      // idea whether anything landed on the clipboard.
      const copied = await copyToClipboard(overlayBuildString);
      store.dispatch("showSnackbar", {
        text: copied
          ? `Build order copied to clipboard!`
          : `Could not copy to clipboard. Try the download option instead.`,
        type: copied ? "success" : "error",
      });
    };

    const handleDownloadOverlayFormat = () => {
      const overlayBuild = convert(build.value);
      const overlayBuildString = JSON.stringify(overlayBuild, null, 3);
      download(overlayBuildString, build.value.title);
    };

    const handleOpenInOverlayTool = (e) => {
      e.stopPropagation();
      const buildOrderId = build.value.id;
      const url = `https://rts-overlay.github.io/?gameId=aoe4&buildOrderId=aoe4guides|${buildOrderId}`;
      window.open(url, "_blank").focus();
    };

    return {
      build,
      props,
      user,
      userData,
      loading,
      swipe,
      focusMode,
      timelineEl,
      timelineVisible,
      deleteDialog,
      focusDialog,
      shareDialog,
      focusModeRef,
      popOutRequest,
      handlePlay,
      handlePoppedOut,
      handlePopOutFailed,
      descriptionExpanded,
      handlePublish,
      handleDelete,
      handleRemix,
      handleCopyOverlayFormat,
      handleDownloadOverlayFormat,
      handleOpenInOverlayTool,
      clipboardIsSupported,
    };
  },
};
</script>

<style scoped>
.build-card-section-header {
  letter-spacing: 0.05em;
  height: 36px;
}
</style>

<!--Unscoped on purpose: the dialog teleports to the overlay container at body
    level, so it is not a descendant of this component and :deep() cannot reach
    it. Kept to a single selector that only matches this one dialog.-->
<style>
/* Focus mode sizes itself to this box and clips its own overflow — nothing in
   it is ever supposed to scroll. Vuetify makes a fullscreen dialog's content a
   scroll container, which puts a scrollbar down the side of a layout built not
   to have one, and steals a few pixels of width from the container query while
   it is there. */
.v-overlay__content.focus-dialog {
  overflow: hidden;
}
</style>
