<template>
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

    <div v-if="!sections?.length && !readonly" class="text-center">
      <v-btn
        variant="text"
        color="primary"
        class="pt-5 pb-10"
        @click="addStep(0)"
      >
        <template v-slot:prepend>
          <v-icon color="accent">mdi-plus</v-icon>
        </template>
        Add your first build step</v-btn
      >
    </div>
    <v-row no-gutters align="center" justify="center">
      <v-col cols="12"
        ><div v-for="(section, index) in sections">
          <StepSectionEditor
            v-if="section.steps"
            @textChanged="(event) => handleTextChanged(event)"
            @selectionChanged="(event) => handleSelectionChanged(event, index)"
            @stepsChanged="(event) => handleStepsChanged(event, index)"
            :section="section"
            :readonly="readonly"
            :civ="civ"
            :focus="sectionFocus == index"
          ></StepSectionEditor></div
      ></v-col>
    </v-row>
  </v-card>
</template>

<script>
import { ref, computed, reactive } from "vue";
import StepSectionEditor from "../../components/builds/StepSectionEditor.vue";

export default {
  name: "StepsEditor",
  props: ["steps", "readonly", "civ"],
  emits: ["stepsChanged", "activateFocusMode"],
  components: { StepSectionEditor },
  setup(props, context) {
    var sections;
    if (!props.steps[0].age) {
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

    function alignTableColumnWidth(class_name) {
      // Set each column in each table to the max width of that column across all tables.
      // Align tables with the specified class so that all columns line up across tables.
      const col_width_defaults = ["50px", "50px", "50px", "50px", "50px", "50px", "50px", "auto", "180px"];

      // Reset to allow shrinking
      document.querySelectorAll("." + class_name).forEach(function (element, index) {
        element.querySelectorAll("tr:first-child th")
        .forEach(function (element2, index2) {
          element2.style.width = col_width_defaults[index2]
        });
      });

      // Find the max width of each column across all tables
      var col_widths = [];
      document.querySelectorAll("." + class_name).forEach(function (element, index) {
        element.querySelectorAll("tr:first-child th")
          .forEach(function (element2, index2) {
            col_widths[index2] = Math.max(
              col_widths[index2] || 0,
              element2.offsetWidth  
            );
          });
      });

      // Keep description column on auto
      col_widths[7] = col_width_defaults[7]

      // Set each column in each table to the max width of that column across all tables.
      document.querySelectorAll("." + class_name).forEach(function (element, index) {
        element.querySelectorAll("tr:first-child th")
          .forEach(function (element2, index2) {
            element2.style.width = col_widths[index2]+"px"
          });
      });
    }

    return {
      handleActivateFocusMode,
      civ,
      readonly,
      sections,
      handleStepsChanged,
      handleSelectionChanged,
      handleTextChanged,
      sectionFocus,
    };
  },
};
</script>
