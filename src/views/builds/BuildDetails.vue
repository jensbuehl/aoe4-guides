<template>
  <v-dialog v-model="focusDialog" fullscreen transition="dialog-bottom-transition">
    <FocusMode v-on:closeDialog="focusDialog = false" :build="build"></FocusMode>
  </v-dialog>

  <!-- Loading skeleton (mobile-aware structure) -->
  <v-container v-if="loading">
    <v-skeleton-loader type="card" class="mt-2"></v-skeleton-loader>
    <v-skeleton-loader type="card" class="mt-4"></v-skeleton-loader>
    <v-skeleton-loader type="list-item-three-line" class="mt-4"></v-skeleton-loader>
    <v-skeleton-loader type="list-item-three-line" class="mt-2"></v-skeleton-loader>
    <v-skeleton-loader type="list-item-three-line" class="mt-2"></v-skeleton-loader>
  </v-container>

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
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-dots-vertical" color="accent" variant="text" size="small" v-bind="props"></v-btn>
          </template>
          <v-list>
            <v-list-item
              v-show="user?.uid === build.authorUid"
              :to="{ name: 'BuildEdit', params: { id: id } }"
            >
              <v-icon color="accent" class="mr-4">mdi-pencil</v-icon>
              Edit
            </v-list-item>
            <v-list-item v-show="user && build.isDraft" @click="handlePublish">
              <v-icon color="accent" class="mr-4">mdi-publish</v-icon>
              Publish
            </v-list-item>
            <v-list-item v-show="user" @click="handleDuplicate">
              <v-icon color="accent" class="mr-4">mdi-content-duplicate</v-icon>
              Duplicate build
            </v-list-item>
            <v-list-item v-if="clipboardIsSupported" @click="handleCopyOverlayFormat">
              <v-icon color="accent" class="mr-4">mdi-content-copy</v-icon>
              Copy to overlay tool
            </v-list-item>
            <v-list-item @click="handleDownloadOverlayFormat">
              <v-icon color="accent" class="mr-4">mdi-download</v-icon>
              Download
            </v-list-item>
            <v-list-item @click="handleOpenInOverlayTool">
              <v-icon color="accent" class="mr-4">mdi-button-cursor</v-icon>
              Open in RTS Overlay
            </v-list-item>
            <v-divider v-show="user?.uid === build.authorUid"></v-divider>
            <v-list-item
              v-show="user?.uid === build.authorUid"
              @click="deleteDialog = true"
            >
              <v-icon color="error" class="mr-4">mdi-delete</v-icon>
              <span style="color: rgb(var(--v-theme-error))">Delete</span>
            </v-list-item>
          </v-list>
        </v-menu>
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
        <v-card-text v-show="descriptionExpanded" class="d-md-none" style="white-space: pre-line">
          {{ build.description }}
        </v-card-text>
      </v-expand-transition>

      <!-- Desktop: always expanded -->
      <div class="d-none d-md-flex build-card-section-header align-center px-4 ga-2">
        <v-icon size="16" color="accent">mdi-text-box-outline</v-icon>
        <span class="text-caption text-uppercase font-weight-bold">Description</span>
      </div>
      <v-card-text class="d-none d-md-block" style="white-space: pre-line">{{ build.description }}</v-card-text>
    </v-card>

    <BuildOrderEditor
      :steps="build.steps"
      :readonly="true"
      :civ="build.civ"
      :focus="focusMode"
      @activateFocusMode="focusDialog = true"
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
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";

//components
import Favorite from "@/components/Favorite.vue";
import FocusMode from "@/components/builds/FocusMode.vue";
import Vote from "@/components/Vote.vue";
import BuildOrderEditor from "@/components/builds/BuildOrderEditor.vue";
import Discussion from "@/components/Discussion.vue";
import BuildNotFound from "@/components/notifications/BuildNotFound.vue";
import BuildHeader from "@/components/builds/BuildHeader.vue";

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

export default {
  name: "BuildDetails",
  components: {
    Favorite,
    Vote,
    Discussion,
    BuildOrderEditor,
    FocusMode,
    BuildNotFound,
    BuildHeader,
  },
  props: ["id"],
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const { assertVerified } = useVerificationGuard();
    const user = computed(() => store.state.user);
    const build = ref(null);
    const deleteDialog = ref(false);
    const focusDialog = ref(false);
    const { convert } = useExportOverlayFormat();
    const { copyToClipboard, copyToClipboardSupported } = useCopyToClipboard();
    const { download } = useDownload();
    const userData = ref(null);
    const loading = ref(true);
    const focusMode = ref(false);
    const clipboardIsSupported = ref(false);
    const descriptionExpanded = ref(true);

    onMounted(async () => {
      var resBuild = null;
      if (props.id in store.state.cache.builds) {
        //Build found in store
        resBuild = store.state.cache.builds[props.id];
      } else {
        //"Build not found in store, fetching from firestore"
        resBuild = await getBuild(props.id);
      }
      if (resBuild) {
        //Get user data (favorites and likes)
        if (user.value) {
          userData.value = await getUserFavorites(user.value.uid);
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

    const handleDuplicate = async () => {
      if (!assertVerified()) return;
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

        //workaround, since router.go(-1) does not work
        const previousRoute = window.history.state.back;
        router.push(previousRoute ? previousRoute : "/");
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
      deleteDialog,
      focusDialog,
      descriptionExpanded,
      handlePublish,
      handleDelete,
      handleDuplicate,
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
