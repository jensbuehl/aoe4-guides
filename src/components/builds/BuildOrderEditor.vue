<template>
  <!--Common delete confirmation dialog-->
  <v-dialog v-model="removeAgeConfirmationDialog" width="auto" @keydown.enter="ageDown()">
    <v-card rounded="lg" class="text-center primary" flat>
      <v-card-title>Age down to {{ getPreviousAgeName() }}?</v-card-title>
      <v-card-text>
        This removes the age-up and all steps that follow.<br />
        The action cannot be undone.
      </v-card-text>
      <v-card-actions class="justify-center ga-2">
        <v-btn variant="text" @click="removeAgeConfirmationDialog = false">Cancel</v-btn>
        <v-btn color="error" variant="tonal" @click="ageDown()">Age down</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-card rounded="lg" class="mt-4" flat>
    <div class="build-card-section-header d-flex align-center px-4 ga-2">
      <v-icon size="16" color="accent">mdi-format-list-numbered</v-icon>
      <span class="text-caption text-uppercase font-weight-bold">Build Order</span>
      <v-spacer></v-spacer>
      <!--The section header is 36px and stays 36px: the Build Order card lines
          up with Description and Timeline, and a taller button here breaks that
          alignment down the whole page. The control is sized to fit inside it
          rather than the header being grown around the control.-->
      <v-btn-group v-if="readonly && !$vuetify.display.xs" class="play-group">
        <v-btn color="primary" variant="flat" prepend-icon="mdi-play" @click="handlePlayDefault"
          >Play</v-btn
        >
        <v-menu location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              color="primary"
              variant="flat"
              icon="mdi-menu-down"
              class="play-caret"
              aria-label="Choose where to play this build"
            ></v-btn>
          </template>
          <v-list width="268">
            <!--One line each, with the explanation on the tooltip. Two-line rows
                would make this the only stacked menu on the page.-->
            <v-tooltip v-for="target in playTargets" :key="target.value" location="left">
              <span :style="{ color: $vuetify.theme.current.colors.primary }">{{
                target.description
              }}</span>
              <template v-slot:activator="{ props }">
                <v-list-item v-bind="props" @click="handlePlay(target.value)">
                  <v-icon color="primary" class="mr-4">{{ target.icon }}</v-icon>
                  {{ target.title }}
                </v-list-item>
              </template>
            </v-tooltip>
          </v-list>
        </v-menu>
      </v-btn-group>
    </div>

    <!--On a phone the header has no room for it, and a play control the player
        has to hunt for is the whole problem this replaced.-->
    <div v-if="readonly && $vuetify.display.xs" class="px-4 pt-3">
      <v-btn-group class="play-group play-group--block d-flex">
        <v-btn
          class="flex-grow-1"
          color="primary"
          variant="flat"
          prepend-icon="mdi-play"
          @click="handlePlayDefault"
          >Play</v-btn
        >
        <v-menu location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              color="primary"
              variant="flat"
              icon="mdi-menu-down"
              class="play-caret"
              aria-label="Choose where to play this build"
            ></v-btn>
          </template>
          <v-list width="268">
            <v-tooltip v-for="target in playTargets" :key="target.value" location="left">
              <span :style="{ color: $vuetify.theme.current.colors.primary }">{{
                target.description
              }}</span>
              <template v-slot:activator="{ props }">
                <v-list-item v-bind="props" @click="handlePlay(target.value)">
                  <v-icon color="primary" class="mr-4">{{ target.icon }}</v-icon>
                  {{ target.title }}
                </v-list-item>
              </template>
            </v-tooltip>
          </v-list>
        </v-menu>
      </v-btn-group>
    </div>

    <v-row no-gutters align="center" justify="center">
      <v-col cols="12"
        ><div v-for="(section, index) in sections">
          <BuildOrderSectionEditor
            v-if="section.steps"
            :ref="el => registerSectionEditor(el, index)"
            @selectionChanged="
              () => {
                sectionFocus = index;
              }
            "
            @stepsChanged="(steps) => handleStepsChanged(steps, index)"
            @gameplanChanged="(gameplan) => handleGameplanChanged(gameplan, index)"
            @ageDownRequested="removeAgeConfirmationDialog = true"
            :section="section"
            :resolvedTimes="resolvedTimes[index]"
            :readonly="readonly"
            :civ="civ"
            :focus="sectionFocus == index"
            :isLastAgeUp="section.type === 'ageUp' && index === sections.length - 2"
            :previousStep="previousSectionLastStep(index)"
          ></BuildOrderSectionEditor>
        </div>
        <v-row no-gutters justify="center" class="ma-4">
          <v-btn
            v-if="sections[0]?.steps && !readonly && getCurrentAge() < 4"
            variant="text"
            color="accent"
            class="ma-2"
            @click="ageUp()"
            ><v-img
              class="mr-2"
              style="vertical-align: middle; height: auto; width: 30px"
              :src="getNextAgeImgSrc()"
            ></v-img
            >Age up to {{ getNextAgeName() }}
          </v-btn>

        </v-row>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
//External
import { ref, computed, onMounted, nextTick } from "vue";

//Components
import BuildOrderSectionEditor from "@/components/builds/BuildOrderSectionEditor.vue";

//Composables
import { flattenSections } from "@/composables/builds/useAgeTimings.js";
import { resolveStepTimes } from "@/composables/builds/timingsHelper.js";
import { isDocumentPiPSupported } from "@/composables/builds/useStepPiP.js";
import {
  getSavedPlayTarget,
  resolvePlayTarget,
} from "@/composables/usePlayTargetPreference.js";

/**
 * Where a build can be started from, in the order the menu offers them.
 *
 * The overlay export is deliberately absent: it hands the build to another
 * application rather than starting a session here, so it stays in the build's
 * overflow menu where the other export-shaped actions are.
 */
const PLAY_TARGET_ITEMS = [
  {
    value: "here",
    icon: "mdi-play-circle-outline",
    title: "Play here",
    description: "Full-screen focus mode in this tab.",
  },
  {
    value: "floating",
    icon: "mdi-picture-in-picture-bottom-right",
    title: "Floating window",
    description: "Stays above the game on one monitor.",
    requiresFloating: true,
  },
  {
    value: "phone",
    icon: "mdi-cellphone-link",
    title: "Send to phone",
    description: "QR code, opens focus mode there.",
  },
];

export default {
  name: "BuildOrderEditor",
  props: ["steps", "readonly", "civ", "focus"],
  emits: ["stepsChanged", "activateFocusMode"],
  components: { BuildOrderSectionEditor },
  setup(props, context) {
    const sections = ref([]);
    const removeAgeConfirmationDialog = ref(false);
    const readonly = props.readonly;
    const sectionFocus = ref(null);
    const sectionEditorRefs = ref([]);
    const registerSectionEditor = (el, index) => { sectionEditorRefs.value[index] = el; };
    const civ = computed(() => {
      return props.civ;
    });

    /**
     * Resolved times for every step, sliced per section.
     *
     * Read-only only, and deliberately so: in the editor the time cell is an
     * input bound to the step's own value, so showing an estimate there would let
     * an author save a time they never wrote — poisoning the anchors every future
     * read of the build depends on. A reader sees estimates; an author sees only
     * their own work.
     *
     * The resolver works on the flattened list while sections render in slices,
     * so each section needs its offset. This is the second caller to want that
     * mapping — the economy plot was the first — which is what makes it worth
     * having rather than speculative.
     */
    const resolvedTimes = computed(() => {
      if (!readonly) return [];

      const flat = flattenSections(sections.value);
      if (!flat.length) return [];

      const times = resolveStepTimes(flat);
      const perSection = [];
      let cursor = 0;

      for (const section of sections.value) {
        const length = section?.steps?.length ?? 0;
        perSection.push(times.slice(cursor, cursor + length));
        cursor += length;
      }

      return perSection;
    });

    onMounted(() => {
      initializeSections();

      if (props.focus) {
        activateFocusMode();
      }
    });

    /**
     * Activates the focus mode by emitting the "activateFocusMode" event.
     *
     * @return {void} This function does not return a value.
     */
    function activateFocusMode() {
      context.emit("activateFocusMode", "here");
    }

    /**
     * Whether this browser can float a window above the game.
     *
     * Read once: a capability does not change while the page is open, and a UA
     * string is never consulted — support arriving in another browser needs no
     * change here.
     */
    const floatingSupported = isDocumentPiPSupported();

    /**
     * The menu, minus anything this browser cannot do.
     *
     * Omitted entirely rather than shown disabled. A greyed-out row invites the
     * player to work out why, and there is nothing they can do about it.
     */
    const playTargets = computed(() =>
      PLAY_TARGET_ITEMS.filter((target) => !target.requiresFloating || floatingSupported)
    );

    /**
     * The button body runs whatever was used last.
     *
     * Read at click time rather than cached at setup: the preference is written
     * once a target has actually run, so a player who picks the floating window
     * from the menu and comes back to the page should find the body doing that
     * now — without the page having been reloaded in between.
     *
     * Resolved rather than replayed verbatim, because the preference is stored
     * per browser and "floating" is not portable between them. A player who last
     * used the floating window in Chrome and then opens the same build in
     * Firefox gets a button that plays here, not one that does nothing.
     */
    function handlePlayDefault() {
      handlePlay(getSavedPlayTarget());
    }

    function handlePlay(target) {
      context.emit("activateFocusMode", resolvePlayTarget(target, floatingSupported));
    }

    /**
     * Handle the change of steps for a specific section.
     *
     * @param {Object} steps - the updated steps
     * @param {number} index - the index of the section
     */
    function handleStepsChanged(steps, index) {
      sections.value[index].steps = steps;
      context.emit("stepsChanged", sections.value);
    }

    function handleGameplanChanged(gameplan, index) {
      sections.value[index].gameplan = gameplan;
      context.emit("stepsChanged", sections.value);
    }

    /**
     * The last step preceding a section, so its first row can show a resource
     * delta. Skips empty sections rather than reporting nothing for them.
     *
     * @param {number} index - Index of the section asking.
     * @return {Object|null} The preceding step, or null at the start of a build.
     */
    function previousSectionLastStep(index) {
      for (let cursor = index - 1; cursor >= 0; cursor--) {
        const steps = sections.value[cursor]?.steps ?? [];
        if (steps.length) return steps[steps.length - 1];
      }
      return null;
    }

    /**
     * Age up to the next age.
     **/
    async function ageUp() {
      //Initialize age if migrated or no age information available
      sections.value[0].age = 1;

      const currentAge = getCurrentAge();
      sections.value.push({
        type: "ageUp",
        age: currentAge,
        gameplan: "",
        steps: [{}],
      });
      sections.value.push({
        type: "age",
        age: currentAge + 1,
        gameplan: "",
        steps: [{}],
      });

      context.emit("stepsChanged", sections.value);

      await nextTick();
      await nextTick(); // child components need a second tick to register their refs
      const ageUpSectionEditor = sectionEditorRefs.value[sections.value.length - 2];
      ageUpSectionEditor?.timestampRefs?.[0]?.focus();
    }

    /**
     * Age down to the previous age.
     **/
    function ageDown() {
      if (getCurrentAge() == 1 && sections.value[0]?.age > 0) {
        sections.value[0].age = 0;
      } else {
        sections.value.pop();
        sections.value.pop();
      }

      context.emit("stepsChanged", sections.value);
      removeAgeConfirmationDialog.value = false;
    }

    /**
     * Returns the current age (based on the number of sections).
     *
     * @return {number} The count of sections with a type of "age".
     */
    function getCurrentAge() {
      return sections.value.filter((sec) => sec.type == "age").length;
    }

    /**
     * Generate the name of the next age based on the current age.
     *
     * @return {string} The name of the next age.
     */
    function getNextAgeName() {
      const ages = ["Feudal Age", "Castle Age", "Imperial Age"];
      const currentAgeIndex = getCurrentAge() - 1;
      return ages[currentAgeIndex] || "";
    }

    /**
     * Generates the name of the age that comes before the current age.
     *
     * @return {string} the name of the previous age or an empty string if not found
     */
    function getPreviousAgeName() {
      const currentAgeIndex = getCurrentAge() - 1;
      const ageNames = ["No Particular Age", "Dark Age", "Feudal Age", "Castle Age"];
      return ageNames[currentAgeIndex] || "";
    }

    /**
     * Returns the image source for the next age based on the current age.
     *
     * @return {string} The image source for the next age. If the current age is not 1, 2, or 3, an empty string is returned.
     */
    function getNextAgeImgSrc() {
      const currentAge = getCurrentAge();
      const imgSrcMap = {
        1: "/assets/pictures/age/age_2.webp",
        2: "/assets/pictures/age/age_3.webp",
        3: "/assets/pictures/age/age_4.webp",
      };
      return imgSrcMap[currentAge] || "";
    }

    /**
     * Returns the image source URL of the previous age based on the current age.
     *
     * @return {string} The image source URL of the previous age or an empty string if the current age is 1.
     */
    function getPreviousAgeImgSrc() {
      const currentAge = getCurrentAge();
      const ageImageUrlMap = {
        2: "/assets/pictures/age/age_1.webp",
        3: "/assets/pictures/age/age_2.webp",
        4: "/assets/pictures/age/age_3.webp",
      };
      return ageImageUrlMap[currentAge] || "";
    }

    // Resource/timing cells are plain-text fields, but they are edited via
    // contenteditable divs where Chrome leaves a stray "<br>" (and sometimes a
    // wrapping block) when a cell is cleared. Those builds were persisted with
    // e.g. stone: "<br>", which then renders as literal text. Strip any markup
    // from these fields on load so existing builds display correctly.
    const PLAIN_TEXT_STEP_FIELDS = ["time", "builders", "food", "wood", "gold", "stone"];
    function sanitizeStepFields(sects) {
      for (const section of sects) {
        for (const step of section.steps ?? []) {
          for (const field of PLAIN_TEXT_STEP_FIELDS) {
            if (typeof step[field] === "string") {
              step[field] = step[field].replace(/<[^>]*>/g, "").trim();
            }
          }
        }
      }
    }

    /**
     * Initialize sections based on props.steps data.
     * If props.steps[0].type is not defined, migrates to a new format.
     */
    function initializeSections() {
      if (!props.steps[0]?.type) {
        //migrate old format
        sections.value = [
          {
            type: "age",
            age: 0,
            gameplan: "",
            steps: JSON.parse(JSON.stringify(props.steps)),
          },
        ];
      } else {
        sections.value = JSON.parse(JSON.stringify(props.steps));
      }
      sanitizeStepFields(sections.value);
    }

    return {
      activateFocusMode,
      playTargets,
      handlePlay,
      handlePlayDefault,
      civ,
      readonly,
      sections,
      resolvedTimes,
      ageUp,
      previousSectionLastStep,
      ageDown,
      getCurrentAge,
      getNextAgeName,
      getPreviousAgeName,
      getNextAgeImgSrc,
      getPreviousAgeImgSrc,
      handleStepsChanged,
      handleGameplanChanged,
      sectionFocus,
      removeAgeConfirmationDialog,
      registerSectionEditor,
    };
  },
};
</script>

<style scoped>
.build-card-section-header {
  letter-spacing: 0.05em;
  height: 36px;
}

/* 28px inside a 36px header, so the Build Order card keeps lining up with
   Description and Timeline. Sized explicitly rather than through a density prop
   because Vuetify's comfortable density lands at 40px, which grows the header. */
.play-group {
  height: 28px;
  border-radius: 6px;
}

.play-group :deep(.v-btn) {
  height: 28px;
  min-height: 28px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  /* "Play", not "PLAY" — it reads as a label here, not as a shouted action. */
  text-transform: none;
}

.play-group :deep(.v-btn:first-child) {
  padding: 0 13px 0 14px;
}

.play-group :deep(.v-btn:first-child .v-icon) {
  font-size: 20px;
  margin-left: -4px;
}

/* Both halves are the same fill; only a hairline says they are two controls.
   A themed divider reads as a gap and breaks the button into two buttons.

   Drawn from the button's own text colour rather than a fixed black: primary is
   gold in the dark theme and navy in the light one, and black on navy is no
   hairline at all. currentColor is the one value already guaranteed to read
   against whichever fill is underneath. The rgba line stays as the fallback for
   browsers without color-mix. */
.play-group :deep(.v-btn.play-caret) {
  width: 26px;
  min-width: 26px;
  padding: 0;
  border-left: 1px solid rgba(0, 0, 0, 0.18);
  border-left-color: color-mix(in srgb, currentColor 28%, transparent);
}

.play-group :deep(.v-btn.play-caret .v-icon) {
  font-size: 20px;
}

/* On a phone it is the primary action on the card, so it takes the full width
   rather than sitting in a corner of it. */
.play-group--block {
  width: 100%;
  height: 36px;
}

.play-group--block :deep(.v-btn) {
  height: 36px;
  min-height: 36px;
}
</style>
