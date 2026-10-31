<template>
  <!-- Editor form -->
  <v-container v-if="user && build">
    <BuildHeader :build="build" :readonly="false">
      <template v-slot:actions>
        <div class="d-flex align-center ga-1">
          <!--hasUnsavedWork, not isDirty: an import nobody has edited yet is
              still unsaved, and this has to agree with the leave prompt.-->
          <span v-if="hasUnsavedWork" class="unsaved-indicator text-caption mr-1">
            <v-icon size="x-small" color="accent">mdi-circle-medium</v-icon>Modified
          </span>
          <!--Filled primary, like Play on the read view: this is the one action
              the editor exists to reach. Accent is the site's *text* colour and
              only reads as a fill in dark mode, where accent and primary happen
              to be the same gold — in light mode it filled the button with that
              gold and left the label fighting it for contrast.-->
          <!--Nothing to publish while the build still matches what was saved.
              Only in edit mode: a new build (or a remix template) has never been
              saved, so it is legitimately publishable without an edit first.-->
          <v-btn
            color="primary"
            variant="flat"
            size="small"
            prepend-icon="mdi-publish"
            :disabled="mode === 'edit' && !isDirty"
            @click="handleSave"
            >Publish</v-btn
          >
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn icon="mdi-dots-vertical" color="accent" variant="text" v-bind="props"></v-btn>
            </template>
            <template v-slot:default="{ isActive }">
              <v-list>
                <v-tooltip>
                  <span :style="{ color: $vuetify.theme.current.colors.primary }"
                    >Save your progress without publishing it</span
                  >
                  <template v-slot:activator="{ props }">
                    <v-list-item v-bind="props" @click="handleDraft">
                      <v-icon color="accent" class="mr-4">mdi-content-save-outline</v-icon>
                      Save as draft
                    </v-list-item>
                  </template>
                </v-tooltip>
                <v-tooltip>
                  <span :style="{ color: $vuetify.theme.current.colors.primary }"
                    >Undo every edit made since this build order was last saved</span
                  >
                  <template v-slot:activator="{ props }">
                    <v-list-item :disabled="!isDirty" v-bind="props" @click="handleDiscard">
                      <v-icon color="accent" class="mr-4">mdi-undo</v-icon>
                      Discard changes
                    </v-list-item>
                  </template>
                </v-tooltip>
                <v-divider v-if="mode === 'edit'" class="my-1"></v-divider>
                <v-tooltip>
                  <span :style="{ color: $vuetify.theme.current.colors.primary }"
                    >Start a new build order from a copy of this one</span
                  >
                  <template v-slot:activator="{ props }">
                    <v-list-item v-if="mode === 'edit'" v-bind="props" @click="handleRemix">
                      <v-icon color="accent" class="mr-4">mdi-shuffle-variant</v-icon>
                      Remix
                    </v-list-item>
                  </template>
                </v-tooltip>
                <!-- Same two exports as BuildDetails, folded into one row. There is
                     no "Open in RTS Overlay" here to act as the primary, so the row
                     itself downloads and the trailing button copies. The button needs
                     .stop so the row's download doesn't also fire, which suppresses
                     the menu's close-on-content-click — hence the explicit isActive.
                     The row's tooltip hangs off the label rather than the whole item,
                     so hovering the button doesn't open both at once. -->
                <v-list-item v-if="mode === 'edit'" @click="handleDownloadOverlayFormat">
                  <v-tooltip>
                    <span :style="{ color: $vuetify.theme.current.colors.primary }"
                      >Download this build order as a file to import into the overlay tool</span
                    >
                    <template v-slot:activator="{ props }">
                      <span class="d-flex align-center" v-bind="props">
                        <v-icon color="accent" class="mr-4">mdi-download</v-icon>
                        Download for overlay tool
                      </span>
                    </template>
                  </v-tooltip>
                  <template v-slot:append>
                    <v-tooltip v-if="clipboardIsSupported">
                      <span :style="{ color: $vuetify.theme.current.colors.primary }"
                        >Copy to the clipboard instead of downloading a file</span
                      >
                      <template v-slot:activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon="mdi-content-copy"
                          variant="text"
                          size="small"
                          color="accent"
                          class="ml-4"
                          aria-label="Copy build order to clipboard instead"
                          @click.stop="isActive.value = false; handleCopyOverlayFormat()"
                        ></v-btn>
                      </template>
                    </v-tooltip>
                  </template>
                </v-list-item>
              </v-list>
            </template>
          </v-menu>
        </div>
      </template>
    </BuildHeader>

    <!-- Unsaved work from an earlier visit, usually a tab the phone OS killed.
         Offered, never applied: the author may have meant to drop it. It stays
         up while they edit, so a decision is not forced before they can look
         at the build — and Restore asks before replacing anything typed since. -->
    <v-card v-if="draftOffer" flat rounded="lg" class="mt-4" role="status">
      <div class="d-flex align-center flex-wrap pl-4 pr-1 gc-3">
        <v-icon size="20" color="accent" class="align-self-start mt-3">mdi-clock-edit-outline</v-icon>
        <div class="draft-offer-text text-body-2 py-3">
          <div>Unsaved changes from {{ draftSavedLabel }}</div>
          <div v-if="draftOffer.conflict" class="text-caption text-medium-emphasis mt-1">
            This build was saved again after these changes were made. Restoring and
            publishing replaces that version.
          </div>
        </div>
        <div class="d-flex ml-auto">
          <v-btn variant="text" height="44" @click="discardDraft">Discard</v-btn>
          <v-btn variant="text" color="primary" height="44" @click="restoreDraft">Restore</v-btn>
        </div>
      </div>
    </v-card>

    <!-- Import, for the screens where the FAB is the way in. The FAB creates in
         one tap and so offers no choice; desktop chooses in the header's Add
         Build menu instead, which is why this shares the FAB's breakpoint.
         Keyed to how the build started, not to isDirty, so it does not vanish
         from above the Title field the moment the author types into it.
         The label names both ways in, as the header's tooltip does, in words
         short enough to stay on one line beside the button at 360px. -->
    <v-card v-if="startedBlank" flat rounded="lg" class="mt-4 hidden-md-and-up">
      <div class="d-flex align-center pl-4 pr-1 ga-3">
        <v-icon size="20" color="accent">mdi-tray-arrow-down</v-icon>
        <span class="text-body-2 text-medium-emphasis flex-grow-1">
          From a file or clipboard
        </span>
        <v-btn variant="text" color="primary" height="44" @click="openImportDialog"
          >Import</v-btn
        >
      </div>
    </v-card>

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
          <!--No "valid link" chip. The thumbnail is the confirmation: it can only
              appear if the link resolved, and it says which video, which the
              chip never did. The error chip below stays — that one tells the
              author something they cannot see for themselves.-->
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
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps">
                  <template #prepend><CivFlag :civ="item.raw.shortName" class="mr-3" /></template>
                </v-list-item>
              </template>
              <template #selection="{ item }">
                <CivFlag :civ="item.raw.shortName" class="mr-2" />{{ item.title }}
              </template>
            </v-select>
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
            >
              <template #item="{ props: itemProps, item }">
                <SeasonListItem :item-props="itemProps" :title="item.raw.title" />
              </template>
            </v-select>
          </v-col>
          <!-- Map and strategy are stored as "" when unset, but a v-select
               reads any value other than null as a selection, even one that
               matches no item: an empty field then showed its clear X and a
               floated label. So the field sees null for "", and a clear (which
               emits null) is written back as the "" a new build starts with. -->
          <v-col cols="12" sm="6" md="3">
            <v-select
              prepend-icon="mdi-map"
              label="Map"
              :items="maps"
              :model-value="build.map || null"
              @update:model-value="(value) => (build.map = value ?? '')"
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
              :model-value="build.strategy || null"
              @update:model-value="(value) => (build.strategy = value ?? '')"
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
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import { onBeforeRouteLeave } from "vue-router";
import sanitizeHtml from "sanitize-html";

import BuildOrderEditor from "@/components/builds/BuildOrderEditor.vue";
import BuildHeader from "@/components/builds/BuildHeader.vue";
import CivFlag from "@/components/common/CivFlag.vue";
import SeasonListItem from "@/components/common/SeasonListItem.vue";

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
import { selectionFromActive } from "@/composables/builds/alternativesDraft.js";
import { forEachStep } from "@/composables/builds/useAgeTimings.js";
import { migrateSectionNotes } from "@/composables/builds/sectionNoteMigration";
import useEditorDraft, { draftKey, contentHash } from "@/composables/builds/useEditorDraft";
import useCopyToClipboard from "@/composables/converter/useCopyToClipboard";
import useDownload from "@/composables/converter/useDownload";

export default {
  name: "BuildEditor",
  components: { BuildOrderEditor, BuildHeader, CivFlag, SeasonListItem },
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
    const route = useRoute();
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

    // A blank new build, not a remix or an import. Read before the template
    // below is consumed.
    const startedBlank = ref(props.mode === "new" && !store.state.template);

    // An import is unsaved from the moment it lands: once the clipboard moves
    // on or the file is closed, the editor holds the only copy. A remix is not —
    // its source is still published, one tap away — so it becomes unsaved work
    // with its first edit, as a blank build does. The two are told apart by
    // `remixOf`, which both remix paths always set (null on your own build) and
    // the import converter never does.
    const isImport = (template) => !!template && !("remixOf" in template);
    const unsavedImport = ref(props.mode === "new" && isImport(store.state.template));
    const hasUnsavedWork = computed(() => isDirty.value || unsavedImport.value);

    const draft = useEditorDraft({
      key: () => draftKey(user.value?.uid, props.mode === "edit" ? props.id : null),
      build: () => build.value,
      unsaved: () => hasUnsavedWork.value,
    });
    // A draft from an earlier visit, offered until the author answers or leaves.
    const draftOffer = ref(null);
    // What the form held when the offer appeared, so Restore can tell whether
    // it would now throw away work done since.
    let offerBaseline = null;
    const offerDraft = () => {
      draftOffer.value = draft.check(build.value);
      offerBaseline = contentHash(build.value);
    };
    const draftSavedLabel = computed(() => {
      if (!draftOffer.value) return "";
      const at = new Date(draftOffer.value.savedAt);
      const time = at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      if (at.toDateString() === new Date().toDateString()) return `today at ${time}`;
      return `${at.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${time}`;
    });

    // A reload, or a phone bringing back a discarded tab, restores the scroll
    // position — usually somewhere in the build order, far below the offer and
    // looking at a build without the edits. An offer nobody sees is one they
    // type over, so the page goes up to it. After the router has applied its own
    // saved position, which it does on the first navigation and would undo this.
    watch(
      draftOffer,
      async (offer) => {
        if (!offer) return;
        await router.isReady();
        await nextTick();
        requestAnimationFrame(() => {
          if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "smooth" });
        });
      },
      { flush: "post" }
    );

    // The thumbnail state for a video that arrived with a build rather than
    // through the field, which is what drives it otherwise.
    const seedVideoState = () => {
      ytVideoId.value = null;
      try { ytVideoId.value = extractVideoId(build.value.video || "") || null; } catch { /* non-YouTube URL */ }
      ytState.value = ytVideoId.value ? "valid" : "empty";
    };

    // Create mode: initialize synchronously before watcher is set up
    if (props.mode === "new") {
      const template = store.state.template;
      if (template) {
        //A remix arrives carrying another build's sections, so it needs the
        //conversion as much as an opened build does. Before the assignment, so
        //the store object is not mutated while it is still store state.
        migrateSectionNotes(template.steps);
        build.value = template;
        store.commit("setTemplate", null);
      } else {
        build.value = {
          author: "",
          authorUid: "",
          remixOf: null,
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
          // A civ page's "Create build order" passes its civ along; anything
          // that is not a civ's short name is ignored, not stored.
          civ: civs.some((c) => c.shortName === route.query.civ) ? route.query.civ : "",
          map: "",
          season: seasons.value[0].title,
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
      //Asked before an import is written, since the import takes the same key.
      offerDraft();
      draft.save();

      // An import started from this page. The dialog hands over through the
      // store and pushes BuildNew, which is a no-op here (router-view is keyed
      // by path), so the editor has to take the template up itself. Unsaved
      // work is asked about, as the leave guard asks on any other route.
      watch(
        () => store.state.template,
        (template) => {
          if (!template) return;
          store.commit("setTemplate", null);
          if (hasUnsavedWork.value && !window.confirm("Replace your unsaved changes with the imported build?")) {
            store.dispatch("showSnackbar", { text: "Import cancelled — your changes are kept.", type: "info" });
            return;
          }
          isLoaded.value = false;
          migrateSectionNotes(template.steps);
          build.value = template;
          originalBuild.value = JSON.parse(JSON.stringify(build.value));
          seedVideoState();
          isDirty.value = false;
          isLoaded.value = true;
          startedBlank.value = false;
          unsavedImport.value = isImport(template);
          //Section editors own their lists from mount, so they must remount.
          buildOrderKey.value++;
          draft.save();
        }
      );
    }

    const openImportDialog = () => store.dispatch("openImportDialog");

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

        //Detached from the cache before anything is changed. `resBuild` is very
        //often `store.state.cache.builds[id]` itself, which BuildDetails and
        //focus mode read: converting in place would move the note for a reader
        //who never opened the editor, which is the one thing the editor-only
        //gate exists to prevent. A shallow copy keeps the Firestore Timestamps
        //(timeCreated/timeUpdated) that a JSON round-trip would flatten, and
        //`steps` is deep-copied because that is the tree being rewritten.
        build.value = { ...resBuild, steps: JSON.parse(JSON.stringify(resBuild.steps ?? [])) };
        migrateSectionNotes(build.value.steps);

        document.title = build.value.title + " - " + document.title;
        //Snapshot the converted build, not the document as it was read, so
        //"Discard changes" returns to what the author is looking at rather than
        //resurrecting the section note they have been editing as an item.
        originalBuild.value = JSON.parse(JSON.stringify(build.value));

        // Seed ytState for existing video so thumbnail shows on load
        if (build.value.video) {
          const existingId = extractVideoId(build.value.video);
          if (existingId) {
            ytVideoId.value = existingId;
            ytState.value = "valid";
          }
        }

        //Every load-time normalisation of the document has to happen above this
        //line, and none may happen in a child. This flips synchronously, while
        //the children are still unmounted — BuildOrderEditor is behind
        //`v-if="user && build"`, so it cannot mount before `build` is assigned
        //and therefore always mounts with isLoaded already true. Anything it
        //changes on mount reaches the watcher unguarded and marks a build the
        //author has only looked at as modified: unsaved indicator, enabled
        //Publish, and a confirm dialog on the way out.
        isLoaded.value = true;
        offerDraft();
      }

      clipboardIsSupported.value = await copyToClipboardSupported();
    });

    // flush:'sync' fires the callback in the same tick as the assignment, so the
    // isLoaded guard works correctly during onMounted hydration (async flush would
    // see isLoaded=true and spuriously mark the form dirty on first load).
    watch(
      build,
      () => {
        if (!isLoaded.value) return;
        isDirty.value = true;
        //A change that lands while the page is hidden — a field some browser
        //commits only after hiding — is written now: a background tab may
        //never run the debounce timer.
        if (document.hidden) draft.save();
        else draft.schedule();
      },
      { deep: true, flush: "sync" }
    );

    // Navigation guard when unsaved changes exist. Leaving anyway keeps the
    // draft: on a phone this confirm is one stray tap away, and a draft offered
    // once too often costs a tap on Discard, where one cleared too eagerly is
    // gone for good.
    onBeforeRouteLeave(() => {
      if (hasUnsavedWork.value) {
        return window.confirm("You have unsaved changes — leave anyway?");
      }
    });

    // A reload, a closed tab, a typed URL. Mobile browsers mostly skip the
    // prompt, which is why the draft is written on the way out regardless —
    // and on hide, the last moment a phone OS reliably lets the page run
    // before it may discard the tab.
    const onBeforeUnload = (event) => {
      //The step fields commit on focusout, and an unload does not blur them —
      //so the text being typed when the author hit reload would be in neither
      //the build nor the draft. Committed by the event rather than by blur(),
      //as the icon insert does: the author may cancel the prompt, and must
      //land back in the field still typing, not on <body> with the next
      //keystroke gone. Hiding the tab needs no such help: the browser blurs
      //the field itself when the window loses focus.
      const field = document.activeElement;
      if (field && field !== document.body) field.dispatchEvent(new FocusEvent("focusout"));
      draft.flush();
      if (!hasUnsavedWork.value) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") draft.flush();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", draft.flush);
    document.addEventListener("visibilitychange", onHidden);
    onBeforeUnmount(() => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", draft.flush);
      document.removeEventListener("visibilitychange", onHidden);
      draft.flush();
    });

    /**
     * Cleans every step's description before the build is written.
     *
     * Through forEachStep, because a section's entries are no longer all steps.
     * Walking them directly reached the main line only: the steps inside an
     * alternatives block were never cleaned — and they are saved like any other
     * — while the block object itself was handed a description it has no use
     * for, sanitised from `undefined`.
     */
    const sanitizeSteps = () => {
      forEachStep(build.value.steps, (step) => {
        step.description = sanitizeHtml(step.description, {
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
          unsavedImport.value = false;
          //Last, after every write above has touched the build and scheduled
          //another save of it.
          draft.clear();
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
      //An import discarded back to itself is still unsaved, and still kept.
      if (hasUnsavedWork.value) draft.save();
      else draft.clear();
    };

    /**
     * Puts the offered draft back into the form.
     *
     * Asks first when the author has worked on since the offer appeared: the
     * banner names the draft's time, not what Restore would throw away, and
     * edits made with the banner still up are exactly the ones nobody expects
     * a restore to take.
     */
    const restoreDraft = () => {
      if (
        contentHash(build.value) !== offerBaseline &&
        !window.confirm(
          `Replace the changes you've made since opening the editor with the ones from ${draftSavedLabel.value}?`
        )
      ) {
        return;
      }
      const content = JSON.parse(JSON.stringify(draftOffer.value.content));
      draftOffer.value = null;
      //A no-op for any draft this editor wrote, which holds converted sections
      //already; here so the guarantee does not depend on where it came from.
      migrateSectionNotes(content.steps);
      Object.assign(build.value, content);
      seedVideoState();
      startedBlank.value = false;
      //Section editors own their lists from mount, so they must remount.
      buildOrderKey.value++;
      draft.save();
    };

    /**
     * Turns the offer down. Only the offered draft goes: anything typed since
     * it appeared already lives under the same key and stays protected.
     */
    const discardDraft = () => {
      draftOffer.value = null;
      if (hasUnsavedWork.value) draft.save();
      else draft.clear();
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

    const handleRemix = async () => {
      const template = {
        author: "",
        authorUid: "",
        // Same rule as BuildDetails: no attribution when you remix yourself.
        // This menu item only exists in edit mode, so that is the usual case.
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

    const handleCopyOverlayFormat = async () => {
      //The path the author has open, which is what they mean by "this build".
      const overlayBuild = convert(build.value, selectionFromActive(build.value.steps));
      // See BuildDetails: a failed clipboard write resolves false rather than
      // throwing, so it has to be reported explicitly.
      const copied = await copyToClipboard(JSON.stringify(overlayBuild, null, 3));
      store.dispatch("showSnackbar", {
        text: copied
          ? `Build order copied to clipboard!`
          : `Could not copy to clipboard. Try the download option instead.`,
        type: copied ? "success" : "error",
      });
    };

    const handleDownloadOverlayFormat = () => {
      //The path the author has open, which is what they mean by "this build".
      const overlayBuild = convert(build.value, selectionFromActive(build.value.steps));
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
      hasUnsavedWork,
      ytState,
      ytVideoId,
      clipboardIsSupported,
      startedBlank,
      draftOffer,
      draftSavedLabel,
      restoreDraft,
      discardDraft,
      openImportDialog,
      handleSave,
      handleDraft,
      handleDiscard,
      handleVideoInput,
      handleStepsChanged,
      handleRemix,
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

/* Takes the row beside the icon, and wraps the buttons under it only when the
   two no longer fit — at 360px the message alone fills the line. */
.draft-offer-text {
  flex: 1 1 12rem;
  min-width: 0;
}
</style>
