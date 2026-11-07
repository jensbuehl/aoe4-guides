<template>
  <!-- Back is answered through the route (?focus=true, see handlePlay), not by
       closeOnBack. That cancels the Back navigation, and the router undoes a
       cancelled Back by stepping forward again — onto the ?focus entry, under a
       dialog that has just closed. -->
  <v-dialog
    v-model="focusDialog"
    fullscreen
    content-class="focus-dialog"
    transition="dialog-bottom-transition"
    :close-on-back="false"
  >
    <FocusMode
      ref="focusModeRef"
      v-on:closeDialog="focusDialog = false"
      @poppedOut="handlePoppedOut"
      @popOutFailed="handlePopOutFailed"
      @progress="handleFocusProgress"
      :popOut="popOutRequest"
      :resume="focusResume"
      :build="build"
    ></FocusMode>
  </v-dialog>

  <!-- Build not found -->
  <v-container align="center" v-if="!loading && !build"
    ><BuildNotFound></BuildNotFound
  ></v-container>

  <v-container v-if="build">
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
          <BuildActionsFallback
            v-if="actionsPending || actionsFailed"
            :failed="actionsFailed"
            :retrying="actionsRetrying"
            @retry="retryActions"
          />
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
                  >List this build so other players can find it</span
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
        <BuildActionsFallback
          v-else-if="actionsPending || actionsFailed"
          class="d-md-none"
          :failed="actionsFailed"
          :retrying="actionsRetrying"
          @retry="retryActions"
        />
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
import { ref, onMounted, onUnmounted, computed, provide, watch } from "vue";
import { useElementVisibility, useEventListener, useSwipe } from "@vueuse/core";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";

//components
import Favorite from "@/components/Favorite.vue";
import FocusMode from "@/components/builds/FocusMode.vue";
import Vote from "@/components/Vote.vue";
import { discardDraft } from "@/composables/builds/useEditorDraft";
import BuildActionsFallback from "@/components/builds/BuildActionsFallback.vue";
import { useRetry } from "@/composables/useRetry";
import BuildOrderEditor from "@/components/builds/BuildOrderEditor.vue";
import AgeTimeline from "@/components/builds/AgeTimeline.vue";
import Discussion from "@/components/Discussion.vue";
import BuildNotFound from "@/components/notifications/BuildNotFound.vue";
import BuildHeader from "@/components/builds/BuildHeader.vue";
import BuildShareDialog from "@/components/builds/BuildShareDialog.vue";
import { HIDE_AFTER } from "@/components/Header.vue";

//composables
import { getUserFavorites } from "@/composables/data/favoriteService";
import { decrementBuilds, decrementViews } from "@/composables/data/contributorService";
import {
  getBuild,
  deleteBuild,
  recordView,
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
import { ACTIVE_PATH, useActivePath } from "@/composables/builds/useActivePath.js";

export default {
  name: "BuildDetails",
  components: {
    Favorite,
    Vote,
    BuildActionsFallback,
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
    const highlight = useStepHighlight();
    provide(STEP_HIGHLIGHT, highlight);

    //Which alternative the reader is following, for the same reason and in the
    //same place: the steps table, the age timeline and the economy chart are
    //siblings, and a choice made in one has to be visible to the others or the
    //page contradicts itself.
    const activePath = useActivePath();
    provide(ACTIVE_PATH, activePath);

    //An index taken under one path points at a different step under another, so
    //a switch drops whatever the two halves were pointing at (invariant S-2).
    activePath.onSwitch(() => {
      highlight.clear("plot");
      highlight.clear("table");
    });

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
    //The step and path choices focus mode had reached, kept for as long as this
    //page lives. Focus mode unmounts when it closes, and a Back pressed by
    //accident mid-game should cost the player a press to get back in, not
    //their place in the build. A fresh load starts at the first step.
    //
    //Kept only across a Back, the close that happens by accident. ✕ and Esc —
    //in the page or in the floating window — say the player is done with this
    //run, and a finished run is done however it closed: either way the next
    //Play starts a fresh one, which is what a practice run needs.
    const focusResume = ref(null);
    //Set by the route watcher for the one close that came from Back, and read
    //by the close itself, which runs right after it.
    let closedByBack = false;

    //Only while open: a step taken during the closing animation, by the clock,
    //must not bring back a place the close has just let go of.
    const handleFocusProgress = (progress) => {
      if (focusDialog.value) focusResume.value = progress;
    };

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
      //A ?focus link opens focus mode through here too, and it is the link's
      //choice, not the player's: the phone that scanned the QR code would
      //otherwise overwrite the target this browser remembers.
      const fromLink = !!route.query.focus;

      popOutRequest.value = target === "floating" ? popOutRequest.value + 1 : 0;
      focusDialog.value = true;
      if (target === "here" && !fromLink) setSavedPlayTarget("here");

      //Focus mode gets a history entry of its own, so that Back — the press
      //most likely to happen by accident mid-game — closes it instead of
      //leaving the build, or the site for a reader who came from Discord or a
      //search. The router keeps the page where it is for this navigation
      //(isFocusToggle).
      //
      //The dialog opens first, without waiting for the navigation: the
      //floating window is requested as focus mode mounts, and only while the
      //click still counts as a user gesture. A link already stands on its
      //?focus entry, with the build put underneath it below.
      if (!fromLink) router.push({ query: { ...route.query, focus: "true" } });
    };

    //A ?focus link arrives with no build page under it. The QR code opens one
    //in a fresh tab on the phone, whose only entry is that link, so Back mid-
    //game would close the tab or drop the player in the camera app — the one
    //thing the focus entry exists to prevent. The link's entry becomes the
    //plain build and the focus entry goes back on top: Back closes focus mode,
    //and the next Back leaves as it always did.
    //
    //Through the router's history object, not router.replace/push, and before
    //anything renders. Those would be navigations, and the route watcher below
    //would read the first as Back (close) and the second as Forward (open,
    //before the build has loaded). Written directly, the address bar ends
    //where the route already is, so the route never changes at all.
    //
    //Skipped when the plain build is already underneath: a reload after Play
    //here, or of a link that was already put on top of its build this way.
    if (route.query.focus) {
      const routerHistory = router.options.history;
      const { focus: _focus, ...query } = route.query;
      const plain = router.resolve({ query }).fullPath;
      if (window.history.state?.back !== plain) {
        const link = routerHistory.location;
        routerHistory.replace(plain);
        routerHistory.push(link);
      }
    }

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
    //
    //Opening focus mode is itself a route change, to ?focus on the same path,
    //and the one this must sit out. Back off that entry is not exempt: it is
    //how Back closes focus mode.
    //
    //Arriving on that entry with the dialog closed is Forward, after a Back or
    //a ✕, and it reopens focus mode rather than leave a focus URL over the
    //plain page. Here, never floating: a floating window needs a click, and
    //this has none.
    watch(
      () => [route.path, !!route.query.focus],
      ([path, focus], [previousPath]) => {
        if (focus && path === previousPath) {
          if (!focusDialog.value) {
            popOutRequest.value = 0;
            focusDialog.value = true;
          }
          return;
        }
        //Same path and no ?focus: Back off the focus entry. Only when the
        //dialog is still open — ✕ steps back over the entry too, after it has
        //closed, and that close is not a Back.
        closedByBack = focus === false && path === previousPath && focusDialog.value;
        focusModeRef.value?.closePiP?.();
        focusDialog.value = false;
      }
    );

    //Every other way out — ✕, Esc — takes the ?focus entry with it. Left
    //behind, the build would stand on a focus URL, and the next Back would
    //"close" a dialog that is already gone, with nothing visible happening.
    //Back has removed the entry itself by the time this runs.
    //
    //Stepped back over when it sits directly on the build, so ✕ and Back end
    //in the same place: a replace would leave the build in history twice, and
    //the Back after ✕ would land on it again rather than on the page before.
    //A link is given the build underneath on arrival (above), so the replace
    //is only a fallback, for an entry that somehow has something else under it.
    watch(focusDialog, (open) => {
      if (open) return;
      if (!closedByBack || focusResume.value?.last) focusResume.value = null;
      closedByBack = false;
      focusModeRef.value?.closePiP?.();
      if (!route.query.focus) return;
      const { focus: _focus, ...query } = route.query;
      const underneath = router.resolve({ query }).fullPath;
      if (window.history.state?.back === underneath) router.back();
      else router.replace({ query });
    });

    //Vote and Favorite need the user's favorites document, so they follow the
    //user rather than reading it once on mount. This is a public route, and the
    //router does not wait for auth on those (router.beforeEach), so a hard load
    //or a shared link mounts the page before anyone is signed in — read once,
    //that left a signed-in reader without the buttons until they navigated
    //within the app. Following it also answers a sign-in or sign-out made here.
    //
    //Immediate, so an already-known user's fetch starts in setup, alongside the
    //build's in onMounted rather than after it. Keyed on the uid: the store
    //replaces the user object on profile edits too, and those change nothing
    //here.
    //
    //On a phone the buttons get a row of their own in the header, above the
    //steps, and the favorites read lands just after the build. Arriving into
    //nothing, the row pushed the build down 48px under a reader who had
    //already started on it, so it is held open while the read is out
    //(actionsPending), and stays open with a retry if the read fails
    //(actionsFailed): a signed-in reader is owed their buttons, or a reason.
    //
    //Nothing is held before auth has answered, and nothing needs to be:
    //Firestore queues every read until auth has reported its first user, so
    //the build cannot arrive sooner, and by then this knows whether to wait.
    //The /api fallback cannot beat it either: it runs only after a Firestore
    //read has failed, and that read waited for auth too.
    const actionsPending = ref(false);
    const actionsFailed = ref(false);
    const loadActions = async (uid) => {
      const favorites = await getUserFavorites(uid);
      //A sign-out made while this was in flight has already cleared it.
      if (user.value?.uid !== uid) return;
      userData.value = favorites;
      actionsPending.value = false;
      actionsFailed.value = !favorites;
    };
    const { retrying: actionsRetrying, retry: retryActions } = useRetry(() => loadActions(user.value?.uid));
    watch(
      () => user.value?.uid,
      async (uid) => {
        userData.value = null;
        actionsFailed.value = false;
        actionsPending.value = !!uid;
        if (uid) await loadActions(uid);
      },
      { immediate: true }
    );

    onMounted(async () => {
      const cachedBuild = props.id in store.state.cache.builds ? store.state.cache.builds[props.id] : null;
      const resBuild = cachedBuild ? cachedBuild : await getBuild(props.id);

      if (resBuild) {
        build.value = resBuild;
        document.title = build.value.title + " - " + document.title;
        //One view per browser per day, never the author's own; raises the
        //author's total along with the build's (spec 040). The id comes from
        //the route: a build served from the in-app cache need not carry one.
        recordView({ id: props.id, authorUid: build.value.authorUid });
      }
      if (route.query) {
        focusMode.value = route.query.focus;
      }

      clipboardIsSupported.value = await copyToClipboardSupported();
      loading.value = false;
    });

    //Swiping up hides the bottom navigation for more canvas, and swiping down
    //is the way back. Only this page has that gesture, so the hidden state
    //belongs to it.
    //
    //Heard on the whole document, not on the build's container: the footer
    //sits outside this view, and at the end of a build it fills half the
    //screen or more, so a swipe down that started on it scrolled the page but
    //never brought the navigation back. The geometry is the v-touch directive's
    //that this replaced: 16px of travel, and vertical only while the sideways
    //part stays under half the vertical one.
    //
    //A swipe that starts in an overlay is not about this page. Focus mode is a
    //fullscreen dialog that steps on sideways swipes of its own, and a drag in
    //a menu, sheet or dialog belongs to that overlay.
    let swipeInOverlay = false;
    const { lengthX, lengthY } = useSwipe(document, {
      threshold: 16,
      onSwipeStart: (e) => {
        swipeInOverlay = !!e.target.closest?.(".v-overlay");
      },
      onSwipeEnd: (e, direction) => {
        if (swipeInOverlay || !build.value) return;
        if (Math.abs(lengthX.value) >= 0.5 * Math.abs(lengthY.value)) return;
        if (direction === "up") store.commit("setShowBottomNavigation", false);
        if (direction === "down") store.commit("setShowBottomNavigation", true);
      },
    });

    //Back near the top, the navigation returns by itself, at the line where the
    //header's bar always shows. That covers a reader who never learned the
    //gesture, and the iOS status-bar tap that jumps to the top. Only when the
    //page crosses that line on the way up: a swipe up made near the top scrolls
    //the page too, and a rule that held for the whole band would undo it.
    //
    //An open dialog pins <html> with `position: fixed`, which reads as scrollY
    //0 and would cross the line every time Focus mode opened. Those events are
    //skipped and the last real position kept, so closing it is not a crossing
    //either.
    let lastScroll = window.scrollY;
    useEventListener(
      window,
      "scroll",
      () => {
        if (document.documentElement.classList.contains("v-overlay-scroll-blocked")) return;
        const scroll = window.scrollY;
        if (scroll < HIDE_AFTER && lastScroll >= HIDE_AFTER) {
          store.commit("setShowBottomNavigation", true);
        }
        lastScroll = scroll;
      },
      { passive: true }
    );

    //The flag lives in the store because the header draws the navigation, so
    //the page that set it has to clear it on the way out. The bottom navigation
    //is the only navigation on Android/iOS, and no other page can swipe it back.
    //Unmount, not a router hook, marks the page's end: `<router-view>` is keyed
    //on the path, so every path change remounts this view, build to build too.
    //A query-only change (?focus) stays on the page and keeps the reader's choice.
    onUnmounted(() => store.commit("setShowBottomNavigation", true));

    //An unlisted build is reachable by link but must not turn up in search
    //results, so its page asks crawlers not to index it. Built the same way as
    //setCanonical in the router: one tag in document.head, owned here.
    //
    //A watch, not a mount-time check: Publish replaces the route with the same
    //path, which reuses this view, so a just-published build would otherwise
    //keep its noindex until the next reload. And removed on unmount, because
    //document.head is shared — left behind, it would mark every page visited
    //afterwards. Prerendered pages exist for published builds only; one that
    //is unlisted later keeps its indexable static copy until the weekly
    //snapshot refresh, and crawlers that render JS still see this tag.
    const setNoIndex = (noindex) => {
      let tag = document.querySelector('meta[name="robots"]');
      if (!noindex) {
        tag?.remove();
        return;
      }
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "robots");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", "noindex");
    };
    watch(() => build.value?.isDraft === true, setNoIndex, { immediate: true });
    onUnmounted(() => setNoIndex(false));

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
        discardDraft(user.value?.uid, props.id);
        store.dispatch("showSnackbar", {
          text: `Build order deleted!`,
          type: "success",
        });

        //decrement build count of contributor object
        decrementBuilds(build.value.authorUid);

        //Take the build's views off its author's total. Only the author can
        //delete, and the rules let a contributor lower their own total, by any
        //amount, for exactly this. There used to be a `+ 1` here for the
        //deleting visit's own view; the author's visits are not counted any
        //more. Views gained since this page opened stay on the total, an
        //accepted drift (spec 040, research R4).
        decrementViews(build.value.authorUid, build.value.views ?? 0);

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
        const backPath = typeof back === "string" ? back.split("?")[0] : "";
        const cameFromList = listRoutes.includes(backPath) || backPath.startsWith("/civ/");
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
          text: "Build published! Other players can find it now.",
          type: "success",
        });
        router.replace("/builds/" + props.id);
      }
    };

    const handleCopyOverlayFormat = async () => {
      const overlayBuild = convert(build.value, activePath.paths.value);
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
      const overlayBuild = convert(build.value, activePath.paths.value);
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
      actionsPending,
      actionsFailed,
      actionsRetrying,
      retryActions,
      loading,
      focusMode,
      timelineEl,
      timelineVisible,
      deleteDialog,
      focusDialog,
      shareDialog,
      focusModeRef,
      popOutRequest,
      focusResume,
      handleFocusProgress,
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
