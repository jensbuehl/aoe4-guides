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
      ><v-col cols="12" class="ma-4" justify="center" align="center">
        <div class="ma-4">
          <div class="mb-4" v-if="currentStep?.gameplan">
            Notes
            <v-icon
              color="accent"
              style="vertical-align: middle; width: auto; height: 40px"
              class="mx-auto"
              >mdi-information-outline</v-icon
            >
          </div>
          <span style="text-align: center" v-html="getContent()" />
        </div>
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
            <v-img class="titleIconXs" src="/assets/resources/time.webp"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs" src="/assets/resources/villager.webp"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs" src="/assets/resources/repair.webp"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs" src="/assets/resources/food.webp"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs" src="/assets/resources/wood.webp"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs" src="/assets/resources/gold.webp"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs" src="/assets/resources/stone.webp"></v-img>
          </v-col>
        </v-row>
        <v-row class="mt-2" no-gutters align="center" justify="center">
          <!--"~" and the muted weight mean here what they mean on the timeline:
              this moment was not written by the author-->
          <v-col class="text-center" :class="{ 'fm-time--derived': currentStepDerived }">
            {{ currentStepDerived ? "~" : "" }}{{ totalElapsedTimeFormattedString }}
          </v-col>
          <v-col class="text-center">
            <span v-if="currentStep">{{ aggregateVillagers(currentStep) }}</span>
          </v-col>
          <v-col class="text-center" v-html="getBuilders()" />
          <v-col class="text-center" v-html="getFood()" />
          <v-col class="text-center" v-html="getWood()" />
          <v-col class="text-center" v-html="getGold()" />
          <v-col class="text-center" v-html="getStone()" />
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
                <v-img class="mx-auto titleIcon" src="/assets/resources/time.webp"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="80px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/villager.webp"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="80px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/repair.webp"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="80px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/food.webp"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="80px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/wood.webp"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="80px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/gold.webp"></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="80px">
                <v-img class="mx-auto titleIcon" src="/assets/resources/stone.webp"></v-img>
              </th>
            </tr>
          </thead>
          <tbody style="user-select: none">
            <tr>
              <td class="text-center py-1" :class="{ 'fm-time--derived': currentStepDerived }">
                {{ currentStepDerived ? "~" : "" }}{{ totalElapsedTimeFormattedString }}
              </td>
              <td v-if="currentStep" class="text-center py-1">
                {{ aggregateVillagers(currentStep) }}
              </td>
              <td class="text-center py-1" v-html="getBuilders()" />
              <td class="text-center py-1" v-html="getFood()" />
              <td class="text-center py-1" v-html="getWood()" />
              <td class="text-center py-1" v-html="getGold()" />
              <td class="text-center py-1" v-html="getStone()" />
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
            class="ma-2"
            icon="mdi-chevron-left"
            @click="handlePreviousStep"
          ></v-btn>
        </template>
      </v-tooltip>
      <v-tooltip location="top">
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Toggle voice over sound</span
        >
        <template v-slot:activator="{ props }">
          <v-btn
            v-if="!autoplaySupported"
            v-bind="props"
            color="accent"
            flat
            class="ma-2"
            :icon="audio ? 'mdi-volume-medium' : 'mdi-volume-off'"
            @click="handleToggleAudio"
          ></v-btn>
        </template>
      </v-tooltip>
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
          >Toggle voice over sound</span
        >
        <template v-slot:activator="{ props }">
          <v-btn
            v-if="autoplaySupported"
            v-bind="props"
            color="accent"
            flat
            class="ma-2"
            :icon="audio ? 'mdi-volume-medium' : 'mdi-volume-off'"
            @click="handleToggleAudio"
          ></v-btn>
        </template>
      </v-tooltip>
      <v-tooltip location="top">
        <span
          :style="{
            color: $vuetify.theme.current.colors.primary,
          }"
          >Toggle villager distribution announcements</span
        >
        <template v-slot:activator="{ props }">
          <v-btn
            v-if="audio"
            v-bind="props"
            color="accent"
            flat
            class="ma-2"
            :icon="announceVillagers ? 'mdi-account-check' : 'mdi-account-off-outline'"
            @click="handleToggleVillagerAnnouncements"
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
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useEventListener, useWakeLock } from "@vueuse/core";

//Components

//Composables
import { aggregateVillagers, hasResourceValue } from "@/composables/builds/villagerAggregator.js";

import { initTextToSpeech, speak, stop } from "@/composables/builds/textToSpeechHelper.js";
import { redundantMask } from "@/composables/builds/stepVisibility.js";
import {
  getTimings,
  resolveStepTimes,
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
    const audio = ref(true);
    const announceVillagers = ref(false);
    const autoplaySupported = ref(false);
    const autoplay = ref(false);
    const stepsTimings = ref([]);
    //Per-step: was this moment written by the author, or worked out for them?
    //The clock reads the same either way, so without this the player cannot tell
    //a time the author measured from one the site projected.
    const stepDerived = ref([]);
    const totalElapsedTime = ref(null);
    const totalElapsedTimeFormattedString = ref(null);
    const currentStepElapsedTime = ref(null);
    const currentStepDuration = ref(null);
    const currentStepProgress = ref(0);
    const { request, release } = useWakeLock();

    onMounted(async () => {
      //init steps
      if (!props.build.steps[0]?.type) {
        //For backwards compatibility
        steps.value = JSON.parse(JSON.stringify(props.build.steps));
      } else {
        props.build.steps.forEach((section) => {
          steps.value = steps.value.concat(JSON.parse(JSON.stringify(section.steps)));
          // Replace .png with .webp in all step descriptions
          steps.value.forEach((step) => {
            if (step.description) {
              step.description = step.description.replace(/\.png\b/gi, ".webp");
            }
          });
          if (section.gameplan) {
            //concat gameplan to current age's last step's description
            steps.value[steps.value.length - 1].description += " <br><br> " + section.gameplan;
          }
        });
      }

      //init timings
      stepsTimings.value = getTimings(steps.value);

      //Read a second time for provenance. The gate above is deliberately binary
      //— a build either plays through or it does not — so it carries no per-step
      //detail, and the marking below needs exactly that. Two passes over thirty
      //entries is cheaper than making "strict" mean less.
      const resolved = resolveStepTimes(steps.value);
      stepDerived.value = resolved.map((entry) => entry.provenance !== "stated");

      autoplaySupported.value = stepsTimings.value ? true : false;

      //Dev-only: autoplay is a single boolean by design, which makes "why not?"
      //impossible to answer from the UI. One unresolved step fails the whole
      //build, so print which ones and how far past the last measurement they sit.
      if (import.meta.env.DEV && !autoplaySupported.value) {
        const blocking = resolved
          .map((entry, index) => ({ index, ...entry }))
          .filter((entry) => entry.provenance === "unresolved" && !steps.value[entry.index]?.gameplan);
        //Approximate counts: the author still measured it, so it anchors
        const lastAnchor = resolved.reduce(
          (max, entry) =>
            entry.provenance === "stated" || entry.provenance === "approximate"
              ? Math.max(max, entry.seconds)
              : max,
          0
        );

        console.debug(
          `[autoplay] off — ${blocking.length} of ${steps.value.length} steps unresolved.`,
          `Last stated time ${getFormattedTime(toDateFromSeconds(lastAnchor))}.`,
          `Blocking step indices:`,
          blocking.map((entry) => entry.index)
        );
      }

      if (autoplaySupported.value) {
        //step.time stays a clean "m:ss": it is re-parsed for the elapsed-time and
        //progress maths below, and it is never rendered. The marker is a display
        //concern and lives in the template, driven by stepDerived.
        steps.value.forEach((step, index) => {
          step.time = getFormattedTime(toDateFromSeconds(stepsTimings.value[index].startTime));
        });
      }

      //Drop the steps that restate their predecessor and say nothing else. There
      //is nothing to announce and nothing to look at, so playing one is a pause
      //the build never asked for.
      //
      //After the timings, never before: the resolver and the gate above are keyed
      //by position in the full list, and filtering first would shift every anchor
      //and change the times of the steps that remain.
      const redundant = redundantMask(steps.value);
      steps.value = steps.value.filter((step, index) => !redundant[index]);
      stepDerived.value = stepDerived.value.filter((flag, index) => !redundant[index]);
      if (stepsTimings.value) {
        stepsTimings.value = stepsTimings.value.filter((timing, index) => !redundant[index]);
      }

      //init current step, from the list a player will actually move through
      currentStep.value = steps.value[currentStepIndex.value];

      //init timer
      totalElapsedTime.value = new Date();
      totalElapsedTime.value.setSeconds(0);
      totalElapsedTime.value.setMinutes(0);
      totalElapsedTime.value.setHours(0);
      totalElapsedTimeFormattedString.value = getFormattedTime(totalElapsedTime.value);
      setElapsedTimeToCurrentStepStartTime();

      //keep screen awake — deliberately before voice-over init so a speech
      //failure cannot leave the screen free to dim mid-build
      try {
        await request("screen");
      } catch {
        //Refused (battery saver, page not fully active). Degrade silently.
      }

      //init speak
      await initTextToSpeech();
      if (audio.value) {
        stop();
        if (!autoplaySupported.value) speak(currentStep.value, announceVillagers.value);
      }
    });

    onBeforeUnmount(() => {
      clearTimer();
      stop();
      //Required: useWakeLock registers no scope-dispose cleanup, so the lock
      //outlives the component without this. Sync hook, so catch rather than await.
      release().catch(() => {});
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
        stop();
        clearTimer();
      } else {
        if (autoplay.value) {
          initTimer();
          if (audio.value) {
            stop();
            speak(currentStep.value, announceVillagers.value);
          }
        }
      }
    }

    function handleToggleAudio() {
      audio.value = !audio.value;
      if (!audio.value) {
        stop();
      } else {
        if (!autoplaySupported.value) speak(currentStep.value, announceVillagers.value);
      }
    }

    function handleToggleVillagerAnnouncements() {
      announceVillagers.value = !announceVillagers.value;
      if (audio.value) {
        stop();
        speak(currentStep.value, announceVillagers.value);
      }
    }

    /**
     * Whether the clock is currently showing a moment nobody wrote down.
     *
     * Autoplay now accepts builds whose tail is projected, so the clock can be
     * counting through times the site invented. It reads identically either way,
     * which is exactly why it has to say which it is.
     */
    const currentStepDerived = computed(() => !!stepDerived.value[currentStepIndex.value]);

    function getProgress() {
      return ((currentStepIndex.value + 1) / steps.value.length) * 100;
    }

    function getFood() {
      if (currentStep.value?.gameplan)
        return resourceOrEmpty(steps.value[currentStepIndex.value - 1]?.food);

      return resourceOrEmpty(currentStep.value?.food);
    }

    function getWood() {
      if (currentStep.value?.gameplan)
        return resourceOrEmpty(steps.value[currentStepIndex.value - 1]?.wood);

      return resourceOrEmpty(currentStep.value?.wood);
    }

    function getGold() {
      if (currentStep.value?.gameplan)
        return resourceOrEmpty(steps.value[currentStepIndex.value - 1]?.gold);

      return resourceOrEmpty(currentStep.value?.gold);
    }

    function getStone() {
      if (currentStep.value?.gameplan)
        return resourceOrEmpty(steps.value[currentStepIndex.value - 1]?.stone);

      return resourceOrEmpty(currentStep.value?.stone);
    }

    function getBuilders() {
      if (currentStep.value?.gameplan)
        return resourceOrEmpty(steps.value[currentStepIndex.value - 1]?.builders);

      return resourceOrEmpty(currentStep.value?.builders);
    }

    // "0" carries no more information than an empty cell — render both as blank.
    function resourceOrEmpty(value) {
      return hasResourceValue(value) ? value : "";
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
      if (audio.value) {
        stop();
        speak(currentStep.value, announceVillagers.value);
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
      if (audio.value) {
        stop();
        speak(currentStep.value);
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
      currentStepDerived,
      currentStep,
      currentStepProgress,
      getFormattedTime,
      handleNextStep,
      handlePreviousStep,
      handleTogglePlayback,
      handleToggleAudio,
      handleToggleVillagerAnnouncements,
      timer,
      audio,
      announceVillagers,
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
/* The clock while it is counting through a moment nobody wrote down. Same
   treatment as .age-time--derived on the timeline, so "estimated" looks the
   same wherever the reader meets it. */
.fm-time--derived {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

/* Inline content icons — shared square box; variants override background only */
:deep(.icon),
:deep(.icon-ability),
:deep(.icon-tech),
:deep(.icon-military),
:deep(.icon-none),
:deep(.icon-default),
:deep(.icon-landmark) {
  display: inline-block;
  width: 60px;
  height: 60px;
  box-sizing: border-box;
  padding: 3px;
  margin: 3px 4px 3px 0;
  border-radius: 4px;
  object-fit: contain;
  vertical-align: middle;
}
:deep(.icon-ability)  { background: radial-gradient(circle at top center, #5c457b, #4d366e); }
:deep(.icon-tech)     { background: radial-gradient(circle at top center, #469586, #266d5b); }
:deep(.icon-military) { background: radial-gradient(circle at top center, #8b5d44, #683a22); }
:deep(.icon-none)     { background: radial-gradient(circle at top center, rgb(var(--v-theme-icon-background-highlight)), rgb(var(--v-theme-icon-background))); }
:deep(.icon-default)  { background: radial-gradient(circle at top center, #4b6382, #1d2432); }
:deep(.icon-landmark) { background: radial-gradient(circle at top center, #232e3e, #0c0f17); }

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
