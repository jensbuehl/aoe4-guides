<template>
  <!--Common delete confirmation dialog-->
  <v-dialog v-model="removeAgeConfirmationDialog" width="auto">
    <v-card rounded="lg" class="text-center primary" flat>
      <v-card-title>Regress to {{ getPreviousAgeName() }}</v-card-title>
      <v-card-text>
        Are you sure you want to turn back the clock to {{ getPreviousAgeName() }} and erase all the progress and build order steps?<br> 
        Please confirm your decision carefully. The action cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-btn color="error" block @click="ageDown()">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-card rounded="lg" class="mt-4" flat>
    <v-row no-gutters>
      <v-card-title>Build Order</v-card-title><v-spacer></v-spacer>
      <v-tooltip>
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Activate Focus Mode</span
        >
        <template v-slot:activator="{ props }">
          <v-btn
            v-if="readonly"
            class="ma-2"
            v-bind="props"
            variant="text"
            color="accent"
            prepend-icon="mdi-controller"
            @click="activateFocusMode"
            >Focus Mode</v-btn
          >
        </template>
      </v-tooltip>
    </v-row>

    <v-row no-gutters align="center" justify="center">
      <v-col cols="12"
        ><div v-for="(section, index) in sections">
          <BuildOrderSectionEditor
            v-if="section.steps"
            @textChanged="() => alignTableColumnWidthsAcrossSections()"
            @selectionChanged="
              () => {
                sectionFocus = index;
              }
            "
            @stepsChanged="(steps) => handleStepsChanged(steps, index)"
            :section="section"
            :readonly="readonly"
            :civ="civ"
            :focus="sectionFocus == index"
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

          <v-btn
            v-if="sections[0]?.steps && !readonly && getCurrentAge() >= 1 && sections[0]?.age > 0"
            variant="text"
            color="accent"
            class="ma-2"
            @click="removeAgeConfirmationDialog = true"
            ><v-img
              class="mr-2"
              style="vertical-align: middle; height: auto; width: 30px"
              :src="getPreviousAgeImgSrc()"
            ></v-img
            >Age down to {{ getPreviousAgeName() }}
          </v-btn>
        </v-row>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
//External
import { ref, computed, nextTick, onMounted } from "vue";

//Components
import BuildOrderSectionEditor from "@/components/builds/BuildOrderSectionEditor.vue";

//Composables

export default {
  name: "BuildOrderEditor",
  props: ["steps", "readonly", "civ"],
  emits: ["stepsChanged", "activateFocusMode"],
  components: { BuildOrderSectionEditor },
  setup(props, context) {
    const sections = ref([]);
    const removeAgeConfirmationDialog = ref(false);
    const readonly = props.readonly;
    const sectionFocus = ref(null);
    const civ = computed(() => {
      return props.civ;
    });

    onMounted(async () => {
      initializeSections();

      //Wait until tables are rendered
      await nextTick();
      alignTableColumnWidthsAcrossSections();
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
        steps: [{}],
      });
      sections.value.push({
        type: "age",
        age: currentAge + 1,
        steps: [{}],
      });

      //Wait until tables are rendered
      await nextTick();
      alignTableColumnWidthsAcrossSections();
      context.emit("stepsChanged", sections.value);
    }

    /**
     * Age down to the previous age.
     **/
    async function ageDown() {
      if (getCurrentAge() == 1 && sections.value[0]?.age > 0) {
        sections.value[0].age = 0;
      } else {
        sections.value.pop();
        sections.value.pop();
      }

      //Wait until tables are rendered
      await nextTick();
      alignTableColumnWidthsAcrossSections();
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
        1: "/assets/pictures/age/age_2.png",
        2: "/assets/pictures/age/age_3.png",
        3: "/assets/pictures/age/age_4.png",
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
        2: "/assets/pictures/age/age_1.png",
        3: "/assets/pictures/age/age_2.png",
        4: "/assets/pictures/age/age_3.png",
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
            steps: JSON.parse(JSON.stringify(props.steps)),
          },
        ];
      } else {
        sections.value = JSON.parse(JSON.stringify(props.steps));
      }
    }

    /**
     * Aligns the widths of columns across multiple tables with a specified class.
     *
     * @return {void} This function does not return anything.
     */
    function alignTableColumnWidthsAcrossSections() {
      const className = "align-to-widest";

      const col_width_defaults = [
        "50px", //time
        "50px", //villagers
        "50px", //builders
        "50px", //food
        "50px", //wood
        "50px", //gold
        "50px", //stone
        "auto", //description
        "180px", //actions
      ];

      // Reset to allow shrinking to the given default
      document.querySelectorAll("." + className).forEach(function (element, index) {
        element.querySelectorAll("tr:first-child th").forEach(function (element2, index2) {
          element2.style.width = col_width_defaults[index2];
        });
      });

      // Find the max width of each column across all tables
      var col_widths = [];
      document.querySelectorAll("." + className).forEach(function (element, index) {
        element.querySelectorAll("tr:first-child th").forEach(function (element2, index2) {
          col_widths[index2] = Math.max(col_widths[index2] || 0, element2.offsetWidth);
        });
      });

      // Keep description column on auto
      col_widths[7] = col_width_defaults[7];

      // Set each column in each table to the max width of that column across all tables.
      document.querySelectorAll("." + className).forEach(function (element, index) {
        element.querySelectorAll("tr:first-child th").forEach(function (element2, index2) {
          element2.style.width = col_widths[index2] + "px";
        });
      });
    }

    return {
      activateFocusMode,
      alignTableColumnWidthsAcrossSections,
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
      sectionFocus,
      removeAgeConfirmationDialog,
    };
  },
};
</script>
