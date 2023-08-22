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
        ><div v-for="section in sections">
          <StepSectionEditor
            v-if="section.steps"
            :section="section"
            :readonly="readonly"
            :civ="civ"
          ></StepSectionEditor></div
      ></v-col>
    </v-row>
  </v-card>
</template>

<script>
import { computed, reactive } from "vue";
import StepSectionEditor from "../../components/builds/StepSectionEditor.vue";

export default {
  name: "StepsEditor",
  props: ["steps", "readonly", "civ"],
  emits: ["stepsChanged", "activateFocusMode"],
  components: { StepSectionEditor },
  setup(props, context) {
    //const sections = reactive(JSON.parse(JSON.stringify(props.steps)));
    const sections = [
      {
        type: "age",
        age: 1,
        steps: reactive(JSON.parse(JSON.stringify(props.steps))),
      },
      {
        type: "ageUp",
        age: 1,
        steps: reactive(JSON.parse(JSON.stringify(props.steps))),
      },
      {
        type: "age",
        age: 2,
        steps: reactive(JSON.parse(JSON.stringify(props.steps))),
      },
    ];

    const readonly = props.readonly;

    const civ = computed(() => {
      return props.civ;
    });

    const handleActivateFocusMode = () => {
      context.emit("activateFocusMode");
    };

    return {
      handleActivateFocusMode,
      civ,
      readonly,
      sections,
    };
  },
};
</script>

<style scoped>
table tbody tr td:nth-child(2) {
  color: #828282;
}

table tbody tr td:nth-child(4) {
  background: #ff000034;
}

table tbody tr td:nth-child(5) {
  background: #75400c5b;
}

table tbody tr td:nth-child(6) {
  background: #edbe003e;
}

table tbody tr td:nth-child(7) {
  background: #7a7a7b69;
}

td:empty {
  line-height: 46px;
}

:deep(.icon) {
  vertical-align: middle;
  height: auto;
  width: 42px;
  margin: 2px 2px 2px 0px;
  border-radius: 4px;
}

:deep(.icon-tech) {
  vertical-align: middle;
  height: auto;
  width: 42px;
  margin: 2px 2px 2px 0px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #469586, #266d5b);
}
:deep(.icon-tech + img) {
  margin: 2px;
}

:deep(.icon-military) {
  vertical-align: middle;
  height: auto;
  width: 42px;
  margin: 2px 2px 2px 0px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #8b5d44, #683a22);
}
:deep(.icon-military + img) {
  margin: 2px;
}

:deep(.icon-none) {
  vertical-align: middle;
  width: auto;
  height: 42px;
  margin: 2px 2px 2px 0px;
  border-radius: 4px;
  background: radial-gradient(
    circle at top center,
    rgb(var(--v-theme-icon-background-highlight)),
    rgb(var(--v-theme-icon-background))
  );
}
:deep(.icon-none + img) {
  margin: 2px;
}

:deep(.icon-default) {
  vertical-align: middle;
  height: auto;
  width: 42px;
  margin: 2px 2px 2px 0px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #4b6382, #1d2432);
}
:deep(.icon-default + img) {
  margin: 2px;
}

:deep(.icon-landmark) {
  vertical-align: middle;
  height: auto;
  width: 42px;
  margin: 2px 2px 2px 0px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #232e3e, #0c0f17);
}
:deep(.icon-landmark + img) {
  margin: 2px;
}

:deep(.titleIcon) {
  vertical-align: middle;
  width: auto;
  height: 40px;
}
:deep(.titleIconXs) {
  vertical-align: middle;
  width: auto;
  height: 30px;
}
</style>
