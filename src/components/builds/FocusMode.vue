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

    <v-progress-linear
      v-if="autoplaySupported"
      color="accent"
      height="4"
      :model-value="currentStepProgress"
    />

    <v-row
      no-gutters
      class="h-75 align-center justify-center"
      v-touch="{
        left: () => handleNextStep(),
        right: () => handlePreviousStep(),
      }"
      ><v-col cols="12" class="ma-4" justify="center" align="center"
        ><div class="mb-4" v-if="currentStep?.gameplan">
          Notes
          <v-icon
            color="accent"
            style="vertical-align: middle; width: auto; height: 40px"
            class="mx-auto"
            >mdi-information-outline</v-icon
          >
        </div>
        <span style="text-align: center" v-html="getContent()" />
      </v-col>
    </v-row>
    <v-progress-linear bg-color="accent" color="accent" height="4" :model-value="getProgress()" />
    <v-row
      class="py-4"
      :style="{
        'background-color': $vuetify.theme.current.colors.background,
      }"
      v-if="$vuetify.display.xs"
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
            {{ totalElapsedTimeFormattedString }}
          </v-col>
          <v-col class="text-center">
            <span v-if="currentStep">{{ aggregateVillagers(currentStep) }}</span>
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
      v-if="!$vuetify.display.xs"
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
              <th class="text-center ma-0 pa-0" width="80px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/time.png"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="80px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/villager.png"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="80px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/repair.png"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="80px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/food.png"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="80px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/wood.png"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="80px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/gold.png"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="80px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/stone.png"></v-img>
              </th>
            </tr>
          </thead>
          <tbody style="user-select: none">
            <tr>
              <td class="text-center py-1">{{ totalElapsedTimeFormattedString }}</td>
              <td v-if="currentStep" class="text-center py-1">
                {{ aggregateVillagers(currentStep) }}
              </td>
              <td class="text-center py-1">{{ getBuilders() }}</td>
              <td class="text-center py-1">
                {{ getFood() }}
              </td>
              <td class="text-center py-1">{{ getWood() }}</td>
              <td class="text-center py-1">{{ getGold() }}</td>
              <td class="text-center py-1">{{ getStone() }}</td>
            </tr>
          </tbody>
        </v-table></v-col
      ></v-row
    >

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
            class="ma-2"
            icon="mdi-chevron-left"
            @click="handlePreviousStep"
          ></v-btn>
        </template>
      </v-tooltip>
      <span v-if="!autoplaySupported" style="user-select: none">
        {{ currentStepIndex + 1 }} of {{ steps.length }}
      </span>
      <v-tooltip location="top">
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Toggle auto-playback</span
        >
        <template v-slot:activator="{ props }">
          <v-btn
            v-if="autoplaySupported"
            v-bind="props"
            color="accent"
            flat
            class="ma-2"
            :icon="timer ? 'mdi-pause' : 'mdi-play'"
            @click="handleTogglePlayback"
          ></v-btn>
        </template>
      </v-tooltip>
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
            class="ma-2"
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
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useEventListener } from "@vueuse/core";

//Components

//Composables
import { aggregateVillagers } from "@/composables/builds/villagerAggregator.js";

import { initTextToSpeech, speak } from "@/composables/builds/textToSpeechHelper.js";
import {
  getTimings,
  toDateFromString,
  toDateFromSeconds,
  getFormattedTime,
} from "@/composables/builds/timingsHelper.js";

export default {
  name: "FocusMode",
  props: ["build"],
  emits: ["closeDialog"],
  setup(props, context) {
    const currentStep = ref(null);
    const currentStepIndex = ref(0);
    const steps = ref([]);

    const timer = ref(null);
    const autoplaySupported = ref(false);
    const autoplay = ref(false);
    const stepsTimings = ref([]);
    const totalElapsedTime = ref(null);
    const totalElapsedTimeFormattedString = ref(null);
    const currentStepElapsedTime = ref(null);
    const currentStepDuration = ref(null);
    const currentStepProgress = ref(0);

    onMounted(async () => {
      //init steps
      if (!props.build.steps[0]?.type) {
        //For backwards compatibility
        steps.value = props.build.steps;
      } else {
        props.build.steps.forEach((section) => {
          steps.value = steps.value.concat(section.steps);
          //Include gamplan as step which is also providing content
          if (section.gameplan) {
            steps.value = steps.value.concat({ gameplan: section.gameplan });
          }
        });
      }

      //init current step
      currentStep.value = steps.value[currentStepIndex.value];

      //init timings
      stepsTimings.value = getTimings(steps.value);
      autoplaySupported.value = stepsTimings.value ? true : false;
      steps.value.forEach((step, index) => {
        step.time = getFormattedTime(toDateFromSeconds(stepsTimings.value[index].startTime));
      });

      //init timer
      totalElapsedTime.value = new Date();
      totalElapsedTime.value.setSeconds(0);
      totalElapsedTime.value.setMinutes(0);
      totalElapsedTime.value.setHours(0);
      totalElapsedTimeFormattedString.value = getFormattedTime(totalElapsedTime.value);
      setElapsedTimeToCurrentStepStartTime();

      //speak test
      await initTextToSpeech();
      speak();
    });

    onBeforeUnmount(() => {
      clearTimer();
    });

    useEventListener(document, "keyup", (e) => handleKeyPressed(e));
    function handleKeyPressed(e) {
      currentStep.value = steps.value[currentStepIndex.value];

      switch (e.key) {
        case "ArrowLeft":
          handlePreviousStep();
          break;
        case "ArrowRight":
          handleNextStep();
          break;
        case " ":
          handleTogglePlayback();
          break;
      }
    }

    function updateStepProgress() {
      totalElapsedTime.value.setSeconds(totalElapsedTime.value.getSeconds() + 1);
      totalElapsedTimeFormattedString.value = getFormattedTime(totalElapsedTime.value);
      updateProgress();

      const isLastStep = currentStepIndex.value == steps.value.length - 1;
      if (!isLastStep) {
        var nextStep = steps.value[currentStepIndex.value + 1];
        if (totalElapsedTime.value >= toDateFromString(nextStep.time)) {
          handleNextStep();
        }
      }
    }

    function initTimer() {
      clearInterval(timer.value);
      timer.value = setInterval(() => {
        updateStepProgress();
      }, 1000);
    }

    function updateProgress() {
      var nextStep = steps.value[currentStepIndex.value + 1];
      if (!nextStep) {
        currentStepProgress.value = 100;
      } else {
        currentStepElapsedTime.value =
          totalElapsedTime.value - toDateFromString(currentStep.value.time);
        currentStepDuration.value =
          toDateFromString(nextStep.time) - toDateFromString(currentStep.value.time);
        currentStepProgress.value =
          (currentStepElapsedTime.value / currentStepDuration.value) * 100;
      }
    }

    function setElapsedTimeToCurrentStepStartTime() {
      totalElapsedTime.value = toDateFromString(currentStep.value?.time);
      totalElapsedTimeFormattedString.value = getFormattedTime(totalElapsedTime.value);
    }

    function clearTimer() {
      clearInterval(timer.value);
      timer.value = null;
    }

    function handleTogglePlayback() {
      autoplay.value = !autoplay.value;
      if (timer.value) {
        clearTimer();
      } else {
        if (autoplay.value) {
          initTimer();
        }
      }
    }

    function getProgress() {
      return ((currentStepIndex.value + 1) / steps.value.length) * 100;
    }

    function getFood() {
      if (currentStep.value?.gameplan) return steps.value[currentStepIndex.value - 1]?.food;

      return currentStep.value?.food;
    }

    function getWood() {
      if (currentStep.value?.gameplan) return steps.value[currentStepIndex.value - 1]?.wood;

      return currentStep.value?.wood;
    }

    function getGold() {
      if (currentStep.value?.gameplan) return steps.value[currentStepIndex.value - 1]?.gold;

      return currentStep.value?.gold;
    }

    function getStone() {
      if (currentStep.value?.gameplan) return steps.value[currentStepIndex.value - 1]?.stone;

      return currentStep.value?.stone;
    }

    function getBuilders() {
      if (currentStep.value?.gameplan)
        return steps.value[currentStepIndex.value - 1]?.builders
          ? steps.value[currentStepIndex.value - 1].builders
          : "";

      return currentStep?.builders ? currentStep.builders : "";
    }

    function handleNextStep(event) {
      currentStepIndex.value = Math.min(++currentStepIndex.value, steps.value.length - 1);
      currentStep.value = steps.value[currentStepIndex.value];

      clearTimer();
      if (event) {
        setElapsedTimeToCurrentStepStartTime();
      }
      updateProgress();
      if (autoplay.value) {
        initTimer();
      }
    }

    function handlePreviousStep(event) {
      currentStepIndex.value = Math.max(--currentStepIndex.value, 0);
      currentStep.value = steps.value[currentStepIndex.value];

      clearTimer();
      if (event) {
        setElapsedTimeToCurrentStepStartTime();
      }
      updateProgress();
      if (autoplay.value) {
        initTimer();
      }
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
      getProgress,
      totalElapsedTimeFormattedString,
      currentStep,
      currentStepProgress,
      getFormattedTime,
      handleNextStep,
      handlePreviousStep,
      handleTogglePlayback,
      timer,
      autoplaySupported,
      currentStepIndex,
      handleClose,
      aggregateVillagers,
      getContent,
      getFood,
      getWood,
      getGold,
      getStone,
      getBuilders,
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
