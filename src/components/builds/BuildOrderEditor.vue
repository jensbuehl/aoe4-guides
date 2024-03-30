<template>
  <!--Common delete confirmation dialog-->
  <v-dialog v-model="removeAgeConfirmationDialog" width="auto">
    <v-card rounded="lg" class="text-center primary" flat>
      <v-card-title>Regress to {{ getPreviousAgeName() }}</v-card-title>
      <v-card-text>
        Do you really want to regress to {{ getPreviousAgeName() }} and delete all contained build
        order steps?<br />
        The action cannot be undone.
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
            @click="handleActivateFocusMode"
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
            @textChanged="(event) => handleTextChanged(event)"
            @selectionChanged="(event) => handleSelectionChanged(event, index)"
            @stepsChanged="(event) => handleStepsChanged(event, index)"
            :section="section"
            :readonly="readonly"
            :civ="civ"
            :focus="sectionFocus == index"
          ></BuildOrderSectionEditor>
          <span contenteditable="true">asd</span>
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
            >Advance to {{ getNextAgeName() }}
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
            >Regress to {{ getPreviousAgeName() }}
          </v-btn>
        </v-row>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
//External
import { ref, computed, reactive, onMounted } from "vue";

//Components
import BuildOrderSectionEditor from "@/components/builds/BuildOrderSectionEditor.vue";

//Composables

export default {
  name: "BuildOrderEditor",
  props: ["steps", "readonly", "civ"],
  emits: ["stepsChanged", "activateFocusMode"],
  components: { BuildOrderSectionEditor },
  setup(props, context) {
    var sections;
    if (!props.steps[0]?.type) {
      //migrate old format
      sections = reactive([
        {
          type: "age",
          age: 0,
          steps: JSON.parse(JSON.stringify(props.steps)),
        },
      ]);
    } else {
      sections = reactive(JSON.parse(JSON.stringify(props.steps)));
    }

    onMounted(async () => {
      alignTableColumnWidth("align-to-widest");
    });

    const removeAgeConfirmationDialog = ref(false);
    const readonly = props.readonly;
    const civ = computed(() => {
      return props.civ;
    });
    const sectionFocus = ref(null);

    const handleActivateFocusMode = () => {
      context.emit("activateFocusMode");
    };

    const handleTextChanged = (event) => {
      alignTableColumnWidth("align-to-widest");
    };

    const handleSelectionChanged = (event, index) => {
      sectionFocus.value = index;
    };

    const handleStepsChanged = (event, index) => {
      sections[index].steps = event;
      context.emit("stepsChanged", sections);
    };

    const ageUp = () => {
      const currentAge = getCurrentAge();

      //If migrated / no age information => initialize now
      sections[0].age = 1;

      sections.push({
        type: "ageUp",
        age: currentAge,
        steps: [{}],
      });
      sections.push({
        type: "age",
        age: currentAge + 1,
        steps: [{}],
      });
      alignTableColumnWidth("align-to-widest");
      context.emit("stepsChanged", sections);
    };

    const ageDown = () => {
      if (getCurrentAge() == 1 && sections[0]?.age > 0) {
        console.log("hia!");
        sections[0].age = 0;
      } else {
        sections.pop();
        sections.pop();
        context.emit("stepsChanged", sections);
      }
      removeAgeConfirmationDialog.value = false;
    };

    const getCurrentAge = () => {
      return sections.filter((sec) => sec.type == "age").length;
    };

    const getNextAgeName = () => {
      const ages = ["Feudal Age", "Castle Age", "Imperial Age"];
      const currentAgeIndex = getCurrentAge() - 1;
      return ages[currentAgeIndex] || "";
    };

    const getPreviousAgeName = () => {
      const currentAgeIndex = getCurrentAge() - 1;
      const ageNames = ["No Particular Age", "Dark Age", "Feudal Age", "Castle Age"];
      return ageNames[currentAgeIndex] || "";
    };

    const getNextAgeImgSrc = () => {
      const currentAge = getCurrentAge();
      const imgSrcMap = {
        1: "/assets/pictures/age/age_2.png",
        2: "/assets/pictures/age/age_3.png",
        3: "/assets/pictures/age/age_4.png",
      };
      return imgSrcMap[currentAge] || "";
    };

    const getPreviousAgeImgSrc = () => {
      const currentAge = getCurrentAge();
      const ageImageUrlMap = {
        2: "/assets/pictures/age/age_1.png",
        3: "/assets/pictures/age/age_2.png",
        4: "/assets/pictures/age/age_3.png",
      };
      return ageImageUrlMap[currentAge] || "";
    };

    function alignTableColumnWidth(class_name) {
      // Set each column in each table to the max width of that column across all tables.
      // Align tables with the specified class so that all columns line up across tables.
      const col_width_defaults = [
        "50px",
        "50px",
        "50px",
        "50px",
        "50px",
        "50px",
        "50px",
        "auto",
        "180px",
      ];

      // Reset to allow shrinking
      document.querySelectorAll("." + class_name).forEach(function (element, index) {
        element.querySelectorAll("tr:first-child th").forEach(function (element2, index2) {
          element2.style.width = col_width_defaults[index2];
        });
      });

      // Find the max width of each column across all tables
      var col_widths = [];
      document.querySelectorAll("." + class_name).forEach(function (element, index) {
        element.querySelectorAll("tr:first-child th").forEach(function (element2, index2) {
          col_widths[index2] = Math.max(col_widths[index2] || 0, element2.offsetWidth);
        });
      });

      // Keep description column on auto
      col_widths[7] = col_width_defaults[7];

      // Set each column in each table to the max width of that column across all tables.
      document.querySelectorAll("." + class_name).forEach(function (element, index) {
        element.querySelectorAll("tr:first-child th").forEach(function (element2, index2) {
          element2.style.width = col_widths[index2] + "px";
        });
      });
    }

    return {
      handleActivateFocusMode,
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
      handleSelectionChanged,
      handleTextChanged,
      sectionFocus,
      removeAgeConfirmationDialog,
    };
  },
};
</script>
