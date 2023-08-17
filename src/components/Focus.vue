<template>
  <v-card rounded="0" >
    <v-row
      :style="{
        'background-color': $vuetify.theme.current.colors.background,
      }"
      no-gutters
      class="justify-end"
    >
      <v-btn flat color="accent" class="ma-4" icon="mdi-close" @click="handleClose"></v-btn>
    </v-row>

    <v-row
      :style="{
        'background-color': $vuetify.theme.current.colors.background,
      }"
      no-gutters
      class="justify-center align-center"
      ><v-card-title class="ma-4">{{ build.title }}</v-card-title></v-row
    >

    <v-row no-gutters class="h-75 align-center justify-center"
      ><v-col class="d-flex justify-center align-center">
        <span
          style="text-align: center"
          v-html="currentStep?.description ? currentStep?.description : ''"
        /> </v-col
    ></v-row>

    <v-row
      :style="{
        'background-color': $vuetify.theme.current.colors.background,
      }"
      no-gutters
      class="align-center justify-center"
      ><v-col cols="auto"
        ><v-table
          :style="{
            'background-color': $vuetify.theme.current.colors.background,
          }"
          class="mx-4 my-4"
        >
          <thead>
            <tr>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img
                  class="mx-auto titleIcon"
                  src="/assets/resources/time.png"
                ></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img
                  class="mx-auto titleIcon"
                  src="/assets/resources/villager.png"
                ></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img
                  class="mx-auto titleIcon"
                  src="/assets/resources/repair.png"
                ></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img
                  class="mx-auto titleIcon"
                  src="/assets/resources/food.png"
                ></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img
                  class="mx-auto titleIcon"
                  src="/assets/resources/wood.png"
                ></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img
                  class="mx-auto titleIcon"
                  src="/assets/resources/gold.png"
                ></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img
                  class="mx-auto titleIcon"
                  src="/assets/resources/stone.png"
                ></v-img>
              </th>
            </tr>
          </thead>
          <tbody style="user-select: none;">
            <tr>
              <td class="text-center py-1" v-html="currentStep?.time"></td>
              <td class="text-center py-1">todo</td>
              <td
                class="text-center py-1"
                v-html="currentStep?.builders ? currentStep.builders : ''"
              ></td>
              <td class="text-center py-1" v-html="currentStep?.food"></td>
              <td class="text-center py-1" v-html="currentStep?.wood"></td>
              <td class="text-center py-1" v-html="currentStep?.gold"></td>
              <td class="text-center py-1" v-html="currentStep?.stone"></td>
            </tr>
          </tbody> </v-table></v-col
    ></v-row>

    <v-row
      :style="{
        'background-color': $vuetify.theme.current.colors.background,
      }"
      no-gutters
      class="justify-center align-center"
    >
      <v-btn
        :disabled="!currentStepIndex"
        color="accent"
        flat
        class="ma-4"
        icon="mdi-chevron-left"
        @click="handlePreviousStep"
        ></v-btn
      >
      <span style="user-select: none;">
        {{ currentStepIndex + 1 }} of {{ build.steps.length }}
      </span>
      
      <v-btn
        :disabled="currentStepIndex === build.steps.length-1"
        color="accent"
        flat
        class="ma-4"
        icon="mdi-chevron-right"
        @click="handleNextStep"
        ></v-btn
      >
    </v-row>
  </v-card>
</template>

<script>
import { ref, onMounted } from "vue";

export default {
  name: "Focus",
  props: ["build"],
  emits: ["closeDialog"],
  setup(props, context) {
    const currentStep = ref(null);
    const currentStepIndex = ref(0);

    onMounted(async () => {
      currentStep.value = props.build.steps[currentStepIndex.value];
    });

    const handleNextStep = async () => {
      currentStepIndex.value = Math.min(
        ++currentStepIndex.value,
        props.build.steps.length-1
      );
      currentStep.value = props.build.steps[currentStepIndex.value];
    };

    const handlePreviousStep = async () => {
      currentStepIndex.value = Math.max(--currentStepIndex.value, 0);
      currentStep.value = props.build.steps[currentStepIndex.value];
    };

    const handleClose = () => {
      console.log("close Dialog")
        context.emit('closeDialog');        
      }

    return {
      currentStep,
      handleNextStep,
      handlePreviousStep,
      currentStepIndex,
      handleClose
    };
  },
};
</script>
<style scoped>
:deep(.icon) {
  vertical-align: middle;
  height: auto;
  width: 60px;
  margin: 2px;
  border-radius: 4px;
}

:deep(.icon-tech) {
  vertical-align: middle;
  height: auto;
  width: 60px;
  margin: 2px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #469586, #266d5b);
}

:deep(.icon-military) {
  vertical-align: middle;
  height: auto;
  width: 60px;
  margin: 2px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #8b5d44, #683a22);
}

:deep(.icon-none) {
  vertical-align: middle;
  height: auto;
  width: 60px;
  margin: 2px;
  border-radius: 4px;
  background: radial-gradient(
    circle at top center,
    rgb(var(--v-theme-icon-background-highlight)),
    rgb(var(--v-theme-icon-background))
  );
}

:deep(.icon-default) {
  vertical-align: middle;
  height: auto;
  width: 60px;
  margin: 2px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #4b6382, #1d2432);
}

:deep(.icon-landmark) {
  vertical-align: middle;
  height: auto;
  width: 60px;
  margin: 2px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #232e3e, #0c0f17);
}

:deep(.titleIcon) {
  vertical-align: middle;
  width: auto;
  height: 60px;
}
</style>
