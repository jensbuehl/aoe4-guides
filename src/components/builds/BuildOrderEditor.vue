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
      <v-tooltip>
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Switch to Focus Mode. This allows for Autoplay and Voice Over with less distraction.</span
        >
        <template v-slot:activator="{ props }">
          <v-btn
            v-if="readonly"
            v-bind="props"
            color="accent"
            variant="text"
            size="small"
            prepend-icon="mdi-play"
            @click="activateFocusMode"
            >Play</v-btn
          >
        </template>
      </v-tooltip>
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
            :readonly="readonly"
            :civ="civ"
            :focus="sectionFocus == index"
            :isLastAgeUp="section.type === 'ageUp' && index === sections.length - 2"
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
      context.emit("activateFocusMode");
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
      const newSectionEditor = sectionEditorRefs.value[sections.value.length - 1];
      newSectionEditor?.timestampRefs?.value[0]?.focus();
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
    }

    return {
      activateFocusMode,
      civ,
      readonly,
      sections,
      ageUp,
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
</style>
