<template>
  <v-card rounded="0">
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
    >
      <v-col align="center"
        ><v-card-title class="ma-4">{{ build.title }}</v-card-title></v-col
      >
    </v-row>

    <v-row
      no-gutters
      class="h-75 align-center justify-center"
      v-touch="{
        left: () => handleNextStep(),
        right: () => handlePreviousStep(),
      }"
      ><v-col class="ma-4 d-flex justify-center align-center">
        <span style="text-align: center" v-html="getContent()" /> </v-col
    ></v-row>

    <v-row
      class="py-4"
      v-if="currentStep?.gameplan && !currentStep?.description"
      :style="{
        'background-color': $vuetify.theme.current.colors.background,
      }"
      no-gutters
      align="center"
      justify="center"
    >
      <v-tooltip location="top">
        <div
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
        >
          Gameplan or notes for this build order section
        </div>
        <template v-slot:activator="{ props }">
          <div v-bind="props">
            Notes
            <v-icon
              color="accent"
              style="vertical-align: middle; width: auto; height: 40px"
              class="mx-auto"
              >mdi-information-outline</v-icon
            >
          </div>
        </template>
      </v-tooltip>
    </v-row>

    <v-row
      class="py-4"
      :style="{
        'background-color': $vuetify.theme.current.colors.background,
      }"
      v-if="$vuetify.display.xs && !currentStep?.gameplan"
      no-gutters
      align="center"
      justify="center"
    >
      <v-col cols="12">
        <v-row no-gutters align="center" justify="center">
          <v-col>
            <v-img class="titleIconXs" src="/assets/resources/time.png"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs" src="/assets/resources/villager.png"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs" src="/assets/resources/repair.png"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs" src="/assets/resources/food.png"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs" src="/assets/resources/wood.png"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs" src="/assets/resources/gold.png"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs" src="/assets/resources/stone.png"></v-img>
          </v-col>
        </v-row>
        <v-row class="mt-2" no-gutters align="center" justify="center">
          <v-col class="text-center">
            {{ currentStep?.time }}
          </v-col>
          <v-col class="text-center">
            <span v-if="currentStep">{{ aggregateVillagers() }}</span>
          </v-col>
          <v-col class="text-center">
            {{ currentStep?.builders ? currentStep.builders : "" }}
          </v-col>
          <v-col class="text-center">
            {{ currentStep?.food }}
          </v-col>
          <v-col class="text-center">
            {{ currentStep?.wood }}
          </v-col>
          <v-col class="text-center">
            {{ currentStep?.gold }}
          </v-col>
          <v-col class="text-center">
            {{ currentStep?.stone }}
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-row
      v-if="!$vuetify.display.xs && !currentStep?.gameplan"
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
                <v-img class="mx-auto titleIcon" src="/assets/resources/time.png"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/villager.png"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/repair.png"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/food.png"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/wood.png"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/gold.png"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/stone.png"></v-img>
              </th>
            </tr>
          </thead>
          <tbody style="user-select: none">
            <tr>
              <td class="text-center py-1" v-html="currentStep?.time"></td>
              <td v-if="currentStep" class="text-center py-1">
                {{ aggregateVillagers() }}
              </td>
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
      <v-tooltip location="top">
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Previous Build Order Step (ARROW LEFT)</span
        >
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            color="accent"
            flat
            class="ma-4"
            icon="mdi-chevron-left"
            @click="handlePreviousStep"
          ></v-btn>
        </template>
      </v-tooltip>
      <span style="user-select: none"> {{ currentStepIndex + 1 }} of {{ steps.length }} </span>
      <v-tooltip location="top">
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Next Build Order Step (ARROW RIGHT)</span
        >
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            color="accent"
            flat
            class="ma-4"
            icon="mdi-chevron-right"
            @click="handleNextStep"
          ></v-btn>
        </template>
      </v-tooltip>
    </v-row>
  </v-card>
</template>

<script>
//External
import { ref } from "vue";
import { useEventListener } from "@vueuse/core";

//Components

//Composables

export default {
  name: "FocusMode",
  props: ["build"],
  emits: ["closeDialog"],
  setup(props, context) {
    const currentStep = ref(null);
    const currentStepIndex = ref(0);

    var steps = [];
    if (!props.build.steps[0]?.type) {
      //For backwards compatibility
      steps = props.build.steps;
    } else {
      props.build.steps.forEach((section) => {
        steps = steps.concat(section.steps);
        //Include gamplan as step which is also providing content
        if (section.gameplan) {
          steps = steps.concat({ gameplan: section.gameplan });
        }
      });
    }

    
    function aggregateVillagers() {
      const builders = parseInt(currentStep.value.builders) || 0;
      const food = parseInt(currentStep.value.food) || 0;
      const wood = parseInt(currentStep.value.wood) || 0;
      const gold = parseInt(currentStep.value.gold) || 0;
      const stone = parseInt(currentStep.value.stone) || 0;
      
      return builders + food + wood + gold + stone || "";
    }
    
    useEventListener(document, "keyup", (e) => handleKeyPressed(e));
    function handleKeyPressed(e) {
      currentStep.value = steps[currentStepIndex.value];

      switch (e.key) {
        case "ArrowLeft":
          handlePreviousStep();
          break;
        case "ArrowRight":
          handleNextStep();
          break;
      }
    }

    function handleNextStep() {
      currentStepIndex.value = Math.min(++currentStepIndex.value, steps.length - 1);
      currentStep.value = steps[currentStepIndex.value];
    }

    function handlePreviousStep() {
      currentStepIndex.value = Math.max(--currentStepIndex.value, 0);
      currentStep.value = steps[currentStepIndex.value];
    }

    function handleClose() {
      context.emit("closeDialog");
    }

    function getContent() {
      if (currentStep.value?.description) {
        return currentStep.value?.description;
      } else if (currentStep.value?.gameplan) {
        return currentStep.value?.gameplan;
      } else {
        return "";
      }
    }

    return {
      steps,
      currentStep,
      handleNextStep,
      handlePreviousStep,
      currentStepIndex,
      handleClose,
      aggregateVillagers,
      getContent,
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

:deep(.icon-ability) {
  vertical-align: middle;
  height: auto;
  width: 60px;
  margin: 2px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #5c457b, #4d366e);
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
  margin: 2px;
  width: 60px;
  height: auto;
}

:deep(.titleIconXs) {
  vertical-align: middle;
  width: auto;
  height: 30px;
}
</style>
