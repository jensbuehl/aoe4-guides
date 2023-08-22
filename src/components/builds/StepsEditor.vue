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
    } else{
      sections = reactive(JSON.parse(JSON.stringify(props.steps)));
    }

    const readonly = props.readonly;
    const civ = computed(() => {
      return props.civ;
    });
    const sectionFocus = ref(null)

    const handleActivateFocusMode = () => {
      context.emit("activateFocusMode");
    };

    const handleSelectionChanged = (event, index) => {
      console.log("section focus set to:", index);
      sectionFocus.value = index;
      console.log("selectionChanged");
    }
    const handleStepsChanged = (event, index) => {
      sections[index].steps = event;
      context.emit("stepsChanged", sections);
    };

    return {
      handleActivateFocusMode,
      civ,
      readonly,
      sections,
      handleStepsChanged,
      handleSelectionChanged,
      sectionFocus
    };
  },
};
</script>
