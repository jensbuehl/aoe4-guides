<template>
  <!--The element that gets moved into the floating window, and the element the
      density tiers are measured from. Those are deliberately the same element:
      Focus mode renders in a full-screen dialog, on a phone and in a 320px box,
      and only its own container describes all three. A viewport query would
      describe the wrong document entirely once it is floating.-->
  <div ref="focusRoot" class="fm-root">
    <div class="fm-shell">
      <div class="fm-header">
        <!--Only on the page. While floating there is nothing for it to do that
            the window's own chrome does not already do twice — its close and its
            "back to tab" both hand Focus mode back here — so it was a third
            control competing for a 400px row to say what two OS buttons already
            say. Deviates from FR-013, which asked for a return control while
            active; that was written before it was clear the platform supplies
            two of them.-->
        <v-tooltip location="bottom" :attach="focusRoot">
          <span :style="{ color: $vuetify.theme.current.colors.primary }"
            >Open Focus Mode in a floating window</span
          >
          <template v-slot:activator="{ props }">
            <v-btn
              v-if="pipSupported && !pipActive"
              v-bind="props"
              class="fm-ctl-btn fm-ctl-btn--small"
              color="accent"
              variant="text"
              icon="mdi-picture-in-picture-bottom-right"
              aria-label="Open in a floating window"
              @click="handlePopOut"
            ></v-btn>
          </template>
        </v-tooltip>

        <div class="fm-title">{{ build.title }}</div>
        <div class="fm-counter">{{ currentStepIndex + 1 }}/{{ steps.length }}</div>

        <!--Kept while floating, even though the OS window has a close of its own
            a few pixels above it, because the two are not the same action and
            only this one can be the one it is.

            The window's own chrome offers close *and* "back to tab", and both
            reach us as the same pagehide — indistinguishable. So pagehide has to
            mean the safer of the two, "hand Focus mode back to the page", or
            back-to-tab would end the session it exists to preserve. That leaves
            no way for the OS chrome to say "I am done with this build", and this
            is it: one click from the floating window to the build page, instead
            of closing the window and then finding the dialog still open behind
            the game.-->
        <v-tooltip location="bottom" :attach="focusRoot">
          <span :style="{ color: $vuetify.theme.current.colors.primary }"
            >Close Focus Mode and return to the build</span
          >
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              class="fm-ctl-btn fm-ctl-btn--small"
              color="accent"
              variant="text"
              icon="mdi-close"
              aria-label="Close Focus Mode and return to the build"
              @click="handleClose"
            ></v-btn>
          </template>
        </v-tooltip>
      </div>

      <!--Two tones, not one. The upper bar is how far through the build the
          player is and the lower is how far through the current step — the same
          colour on both read as one striped bar rather than two facts, and the
          step bar is the one that resets every few seconds, so it is the one
          that steps back.-->
      <div class="fm-bars">
        <v-progress-linear
          class="fm-bar"
          color="primary"
          height="3"
          :model-value="getProgress()"
        />
        <v-progress-linear
          v-if="autoplaySupported"
          class="fm-bar fm-bar--dim"
          color="primary"
          height="3"
          :model-value="currentStepProgress"
        />
      </div>

      <div
        class="fm-step"
        v-touch="{
          left: () => handleNextStep(),
          right: () => handlePreviousStep(),
        }"
      >
        <div class="fm-step-content">
          <div class="fm-notes" v-if="hasVisibleContent(currentStep?.gameplan)">
            Notes
            <v-icon color="accent" class="fm-notes-icon">mdi-information-outline</v-icon>
          </div>
          <span v-html="getContent()" />
        </div>

        <!--One token, never the next step's full spread. The player is looking
            at a game, so the preview is a glance: when does the next thing
            happen, and what is the one thing it asks for.-->
        <div class="fm-preview" v-if="nextPreview">
          <span>next {{ nextPreview.time }}</span>
          <span v-if="nextPreview.token" class="fm-preview-token">
            <template v-if="nextPreview.token.ageUp">&#8593;</template>
            <img
              v-else-if="nextPreview.token.icon"
              class="fm-preview-icon"
              :src="nextPreview.token.icon"
              alt=""
            />
            {{ nextPreview.token.text }}
          </span>
        </div>
      </div>

      <div class="fm-dock">
        <!--Only what the step actually states, plus the two things always worth
            knowing. A column the author left blank is absent rather than empty:
            a row of dashes reads as data the build does not have.-->
        <div class="fm-resources">
          <!--Crest only, no label, and never in the header. Age is the one thing
              on the dock that cannot be inferred from what is already on screen,
              so it is also the one that has to survive the micro tier — where the
              header is gone and .fm-res--extra is hidden, and age, time and
              villagers are the whole plan check.-->
          <div class="fm-res" v-if="currentAge">
            <img class="fm-res-icon" :src="currentAge.crest" :alt="currentAge.name" />
          </div>
          <div class="fm-res">
            <img class="fm-res-icon" src="/assets/resources/time.webp" alt="Elapsed time" />
            <span class="fm-res-value fm-res-value--time" :class="{ 'fm-time--derived': currentStepDerived }">
              {{ currentStepDerived ? "~" : "" }}{{ totalElapsedTimeFormattedString }}
            </span>
          </div>
          <div class="fm-res">
            <img class="fm-res-icon" src="/assets/resources/villager.webp" alt="Villagers" />
            <span class="fm-res-value">{{ currentStep ? aggregateVillagers(currentStep) : "" }}</span>
          </div>
          <div class="fm-res fm-res--extra" v-for="cell in dockCells" :key="cell.key">
            <img class="fm-res-icon" :src="cell.icon" :alt="cell.label" />
            <span class="fm-res-value" v-html="cell.value" />
          </div>
        </div>

        <div class="fm-transport">
          <v-tooltip location="top" :attach="focusRoot">
            <span :style="{ color: $vuetify.theme.current.colors.primary }"
              >Previous Build Order Step (ARROW LEFT)</span
            >
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                class="fm-ctl-btn fm-ghost"
                color="accent"
                variant="text"
                icon="mdi-chevron-left"
                aria-label="Previous step"
                @click="handlePreviousStep()"
              ></v-btn>
            </template>
          </v-tooltip>

          <v-tooltip location="top" :attach="focusRoot">
            <span :style="{ color: $vuetify.theme.current.colors.primary }"
              >Toggle voice over sound</span
            >
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                class="fm-ctl-btn fm-ghost"
                color="accent"
                variant="text"
                :icon="audio ? 'mdi-volume-medium' : 'mdi-volume-off'"
                aria-label="Toggle voice over sound"
                @click="handleToggleAudio"
              ></v-btn>
            </template>
          </v-tooltip>

          <v-tooltip location="top" :attach="focusRoot">
            <span :style="{ color: $vuetify.theme.current.colors.primary }"
              >Toggle auto-playback</span
            >
            <template v-slot:activator="{ props }">
              <v-btn
                v-if="autoplaySupported"
                v-bind="props"
                class="fm-ctl-btn fm-play"
                color="primary"
                variant="flat"
                :icon="timer ? 'mdi-pause' : 'mdi-play'"
                aria-label="Toggle auto-playback"
                @click="handleTogglePlayback"
              ></v-btn>
            </template>
          </v-tooltip>

          <!--One click at every tier, no overflow. The spec moved this into a
              v-menu below the full tier so it could not push the transport off
              the row — but the button that opens an overflow is exactly as wide
              as the button it hides, so it bought no room and cost a click. It
              also flickered: Vuetify re-measures an attached overlay against its
              container, and in a 320px box there is nowhere to put it.-->
          <v-tooltip location="top" :attach="focusRoot">
            <span :style="{ color: $vuetify.theme.current.colors.primary }"
              >Toggle villager distribution announcements</span
            >
            <template v-slot:activator="{ props }">
              <v-btn
                v-if="audio"
                v-bind="props"
                class="fm-ctl-btn fm-ghost"
                color="accent"
                variant="text"
                :icon="announceVillagers ? 'mdi-account-check' : 'mdi-account-off-outline'"
                aria-label="Toggle villager distribution announcements"
                @click="handleToggleVillagerAnnouncements"
              ></v-btn>
            </template>
          </v-tooltip>

          <v-tooltip location="top" :attach="focusRoot">
            <span :style="{ color: $vuetify.theme.current.colors.primary }"
              >Next Build Order Step (ARROW RIGHT)</span
            >
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                class="fm-ctl-btn fm-ghost"
                color="accent"
                variant="text"
                icon="mdi-chevron-right"
                aria-label="Next step"
                @click="handleNextStep()"
              ></v-btn>
            </template>
          </v-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
//External
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useStore } from "vuex";
import { useEventListener, useWakeLock } from "@vueuse/core";

//Components

//Composables
import {
  aggregateVillagers,
  hasResourceValue,
  parseVillagerCountString,
} from "@/composables/builds/villagerAggregator.js";

import {
  initTextToSpeech,
  speak,
  stop,
  onSpeechRefused,
} from "@/composables/builds/textToSpeechHelper.js";
import { redundantMask, hasVisibleContent } from "@/composables/builds/stepVisibility.js";
import { useStepPiP } from "@/composables/builds/useStepPiP.js";
import { AGE_DISPLAY, ageArt } from "@/composables/builds/useAgeTimings.js";
import {
  getTimings,
  resolveStepTimes,
  toDateFromString,
  toDateFromSeconds,
  getFormattedTime,
} from "@/composables/builds/timingsHelper.js";

/**
 * The resource columns the dock can show, in the order it shows them. Builders
 * keep the repair icon the build order table already uses for them.
 */
const RESOURCE_COLUMNS = [
  { key: "builders", icon: "/assets/resources/repair.webp", label: "Builders" },
  { key: "food", icon: "/assets/resources/food.webp", label: "Food" },
  { key: "wood", icon: "/assets/resources/wood.webp", label: "Wood" },
  { key: "gold", icon: "/assets/resources/gold.webp", label: "Gold" },
  { key: "stone", icon: "/assets/resources/stone.webp", label: "Stone" },
];

export default {
  name: "FocusMode",
  props: ["build", "popOut"],
  emits: ["closeDialog", "poppedOut", "popOutFailed"],
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
    //Per-step: the age this step arrives in, when it is an age-up. Read only by
    //the next-step preview, which promotes it over any resource change.
    const stepAgeUp = ref([]);
    //Per-step: the age the build is *in* at this step. The one piece of state a
    //player cannot read off the rest of the dock — the clock and the villager
    //count are on screen, and the step text stops mentioning the age the moment
    //the age-up is done.
    const stepAge = ref([]);
    const totalElapsedTime = ref(null);
    const totalElapsedTimeFormattedString = ref(null);
    //The clock's anchor: an elapsed time, and the wall-clock moment we were at it.
    //Elapsed time is *read* from these on every tick, never accumulated into.
    //
    //Counting ticks made the tick the clock, so a throttled tab did not fall
    //behind the game — it silently rewrote how long the game had been going.
    //A hidden tab is clamped to roughly one tick per second, and after five
    //minutes hidden Chrome checks timers about once a minute; a build played
    //behind a game therefore lost minutes without ever looking wrong. Reading a
    //wall clock instead makes a late tick produce a late render and nothing else.
    const anchorElapsedSeconds = ref(0);
    const anchorWallClock = ref(0);
    const currentStepElapsedTime = ref(null);
    const currentStepDuration = ref(null);
    const currentStepProgress = ref(0);
    const { request, release } = useWakeLock();
    const store = useStore();

    const focusRoot = ref(null);

    //Which document schedules the tick, and which one owns the handle we hold.
    //Not refs: nothing renders from either, and the interval handle is only ever
    //meaningful to the window that issued it.
    let scheduler = window;
    let timerOwner = null;

    const {
      supported: pipSupported,
      active: pipActive,
      open: openPiP,
      close: closePiP,
    } = useStepPiP({
      rootRef: focusRoot,
      onKeyup: (event) => handleKeyPressed(event),
      onEnter: handleEnterFloating,
      onLeave: handleLeaveFloating,
    });

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
          //Guarded on visible content, not on the string: a note the author
          //emptied is "<br>", which would append two blank lines and a third
          //to a step that reads fine without them — or become the whole of a
          //step's content, leaving the player a card with nothing on it.
          if (hasVisibleContent(section.gameplan)) {
            //concat gameplan to current age's last step's description
            //
            //The separator only earns its place between two things. Appended
            //unconditionally it prefixed a step that had no description of its
            //own with two blank lines, which is invisible on a full screen and
            //ruinous in a 400px window: the note became a three-line block in a
            //row barely tall enough for one, and the centred content was sliced
            //through the middle so the reader got the second blank line and the
            //top half of the text.
            const last = steps.value[steps.value.length - 1];
            last.description = last.description
              ? last.description + " <br><br> " + section.gameplan
              : section.gameplan;
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
      stepAgeUp.value = readAgeUpMarkers(props.build.steps, steps.value.length);
      stepAge.value = readAgeMarkers(props.build.steps, steps.value.length);

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
      stepAgeUp.value = stepAgeUp.value.filter((marker, index) => !redundant[index]);
      stepAge.value = stepAge.value.filter((marker, index) => !redundant[index]);
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

      //Before the awaits below, and deliberately: requesting a floating window
      //needs the click that opened this dialog to still count as a user gesture,
      //and that permission expires in seconds. Speech initialisation is slower
      //than that on a cold voice list.
      if (props.popOut) await requestFloatingWindow();

      //keep screen awake — deliberately before voice-over init so a speech
      //failure cannot leave the screen free to dim mid-build. Skipped while
      //floating: the page behind is not what the player is looking at, and the
      //floating window holds its own.
      if (!pipActive.value) {
        try {
          await request("screen");
        } catch {
          //Refused (battery saver, page not fully active). Degrade silently.
        }
      }

      //init speak
      //
      //Said once per session, and only when the browser actually turns an
      //utterance down. Voice-over failing is otherwise indistinguishable from
      //voice-over being off, and the player is looking at a speaker icon that
      //says it is on.
      let refusalReported = false;
      onSpeechRefused(() => {
        if (refusalReported) return;
        refusalReported = true;
        store.dispatch("showSnackbar", {
          text: "Your browser would not play the voice-over. Try Chrome, or install the site as an app.",
          type: "info",
        });
      });

      await initTextToSpeech();
      if (audio.value) {
        stop();
        if (!autoplaySupported.value) speak(currentStep.value, announceVillagers.value);
      }
    });

    onBeforeUnmount(() => {
      clearTimer();
      stop();
      onSpeechRefused(null);
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

    /**
     * Marks the steps at which the build arrives in a new age.
     *
     * Read from the sections rather than the steps, because a step carries no
     * age of its own — the section it sits in does. The moment worth previewing
     * is the click-up, which is the first step of an "ageUp" section, labelled
     * with the age that transition lands in.
     *
     * @param {Array} sections - The build's sections array, or a legacy flat list.
     * @param {number} length - Length of the flattened step list.
     * @return {Array<string|null>} Index-aligned age short names, mostly null.
     */
    function readAgeUpMarkers(sections, length) {
      const markers = new Array(length).fill(null);
      //Legacy flat builds have no sections, so no age boundaries exist to read
      if (!Array.isArray(sections) || !sections[0]?.type) return markers;

      let cursor = 0;

      sections.forEach((section, index) => {
        const count = section?.steps?.length ?? 0;

        if (section?.type === "ageUp" && count) {
          const arrival = sections
            .slice(index + 1)
            .find((later) => later?.type === "age" && later.age > 1);
          const display = AGE_DISPLAY.find((entry) => entry.age === arrival?.age);
          if (display) markers[cursor] = display.short;
        }

        cursor += count;
      });

      return markers;
    }

    /**
     * The age the build is in at each step.
     *
     * Read from the sections for the same reason as the markers above: a step
     * carries no age of its own. An "age" section sets the age from its first
     * step onwards; an "ageUp" section keeps the one already in force, because a
     * player who has clicked up is still in the old age until they arrive — the
     * same reading the timeline's coloured segments use, so the two agree.
     *
     * Stays null where a build says nothing: legacy flat builds, and the `age: 0`
     * that migrated sections carry to mean "no particular age". An age icon that
     * guesses is worse than no age icon, so those get none.
     *
     * @param {Array} sections - The build's sections array, or a legacy flat list.
     * @param {number} length - Length of the flattened step list.
     * @return {Array<number|null>} Index-aligned age numbers.
     */
    function readAgeMarkers(sections, length) {
      const markers = new Array(length).fill(null);
      if (!Array.isArray(sections) || !sections[0]?.type) return markers;

      let cursor = 0;
      let current = null;

      sections.forEach((section) => {
        const count = section?.steps?.length ?? 0;

        if (section?.type === "age" && section.age >= 1) {
          current = section.age;
        } else if (section?.type === "ageUp" && current == null && section.age >= 1) {
          //Only as a fallback: an ageUp section stores the age it starts from, so
          //it can name the current age for a build whose first section was left
          //at 0 but which is otherwise laid out in ages.
          current = section.age;
        }

        for (let offset = 0; offset < count; offset++) markers[cursor + offset] = current;

        cursor += count;
      });

      return markers;
    }

    /**
     * Seconds into the build a Date produced by the timing helpers represents.
     * They all carry today's date with the hour zeroed, so only minutes and
     * seconds mean anything.
     *
     * @param {Date|null} date - A time from toDateFromString/toDateFromSeconds.
     * @return {number} Seconds since the build started, 0 for an unreadable time.
     */
    function toElapsedSeconds(date) {
      return date ? date.getMinutes() * 60 + date.getSeconds() : 0;
    }

    /**
     * Pins the clock: from here on, elapsed time is this value plus however long
     * the wall clock says we have been sitting here.
     *
     * Every moment the session's elapsed time is *set* rather than *advanced*
     * has to come through here — session start, a manual step change, and
     * resuming from a pause. Miss one and the clock keeps counting from the old
     * anchor, which is how a naive wall-clock difference breaks prev/next.
     *
     * Moving between windows is deliberately *not* on that list: the anchor is
     * exactly what makes the swap invisible, and re-taking it would show up as a
     * jump in elapsed time at the moment the player pops out.
     *
     * @param {number} elapsedSeconds - Where the build is, in seconds.
     */
    function anchorClock(elapsedSeconds) {
      anchorElapsedSeconds.value = elapsedSeconds;
      anchorWallClock.value = Date.now();
    }

    function elapsedSecondsNow() {
      return anchorElapsedSeconds.value + (Date.now() - anchorWallClock.value) / 1000;
    }

    function updateStepProgress() {
      totalElapsedTime.value = toDateFromSeconds(Math.floor(elapsedSecondsNow()));
      totalElapsedTimeFormattedString.value = getFormattedTime(totalElapsedTime.value);
      updateProgress();

      //A tick that arrives late finds the build further along than one step, and
      //the build is where the clock says it is — so catch up rather than
      //advancing one step per tick and taking a minute to cover a minute. Each
      //pass stops the pending utterance before starting the next, so a catch-up
      //speaks the step it lands on and not the ones it passed through.
      while (currentStepIndex.value < steps.value.length - 1) {
        const nextStepTime = toDateFromString(steps.value[currentStepIndex.value + 1].time);
        if (!nextStepTime || totalElapsedTime.value < nextStepTime) break;
        handleNextStep(false);
      }
    }

    function initTimer() {
      clearTimer();
      timerOwner = scheduler;
      timer.value = scheduler.setInterval(() => {
        updateStepProgress();
      }, 1000);
    }

    /**
     * Moves the tick to another document without disturbing the session.
     *
     * The opener's timers are throttled while the player is in their game — to
     * roughly one a second when hidden, and about one a minute once it has been
     * hidden a while. The floating window is on screen, so its timers are not.
     * Only the schedule moves: the anchor, the step index and the queued speech
     * are untouched, so the swap costs nothing and is invisible either way.
     *
     * @param {Window} next - The window that should schedule the tick from now on.
     */
    function swapScheduler(next) {
      const wasRunning = timer.value != null;
      scheduler = next;
      if (wasRunning) initTimer();
    }

    function handleEnterFloating(pipWindow) {
      swapScheduler(pipWindow);
      //The player is looking at the floating window, not at this page.
      release().catch(() => {});
    }

    function handleLeaveFloating() {
      //Whatever the floating window had scheduled died with it.
      swapScheduler(window);
      request("screen").catch(() => {});
    }

    /**
     * Opens the floating window on the caller's behalf and reports which way it
     * went, so the page can persist the choice only once it has actually worked.
     *
     * Swallows the failure rather than rethrowing: the fallback is already
     * happening — the full-screen dialog is open and the session is running in
     * it — so there is nothing for a caller to recover from, only something to
     * tell the player about.
     */
    async function requestFloatingWindow() {
      if (!pipSupported || pipActive.value) return;

      try {
        await openPiP();
        context.emit("poppedOut");
      } catch {
        //Refused by permissions policy, or the click that got us here has
        //already stopped counting as a user gesture. Either way the dialog is
        //the fallback, and it is already open.
        context.emit("popOutFailed");
      }
    }

    //Choosing the floating window again after coming back to the page does not
    //re-mount this component, so the request cannot be read once at setup. The
    //prop counts requests rather than describing a state for exactly that reason.
    watch(
      () => props.popOut,
      (requests, previous) => {
        if (requests > (previous ?? 0)) requestFloatingWindow();
      }
    );

    /**
     * The header's pop-out control. Distinct from requestFloatingWindow() in
     * that it does not report success: this is the player moving a session they
     * already started, not choosing where to start one, so it must not rewrite
     * the remembered play target behind their back.
     */
    async function handlePopOut() {
      try {
        await openPiP();
      } catch {
        context.emit("popOutFailed");
      }
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
      anchorClock(toElapsedSeconds(totalElapsedTime.value));
    }

    function clearTimer() {
      if (timer.value != null && timerOwner) {
        try {
          timerOwner.clearInterval(timer.value);
        } catch {
          //The window that owned this handle is gone, and so is its interval.
        }
      }
      timer.value = null;
      timerOwner = null;
    }

    function handleTogglePlayback() {
      autoplay.value = !autoplay.value;
      if (timer.value) {
        stop();
        clearTimer();
      } else {
        if (autoplay.value) {
          //Re-anchor before restarting: the wall clock ran through the pause and
          //the build did not, so resuming off the old anchor would hand the
          //player back a session that had skipped ahead while they were away.
          anchorClock(toElapsedSeconds(totalElapsedTime.value));
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

    /**
     * The crest for the age the player is in right now, or null when the build
     * does not say. Null is the whole guard: the dock cell is absent rather than
     * showing a placeholder age nobody wrote down.
     */
    const currentAge = computed(() => ageArt(stepAge.value[currentStepIndex.value]));

    function getProgress() {
      return ((currentStepIndex.value + 1) / steps.value.length) * 100;
    }

    /**
     * The step whose resource cells describe the position at a given index.
     *
     * A gameplan note states no economy of its own — it is commentary sitting
     * between two steps — so it shows the position it was written about, which
     * is the step before it.
     *
     * @param {number} index - Position in the step list.
     * @return {Object|null} The step to read cells from.
     */
    function resourceSource(index) {
      const step = steps.value[index];
      if (!step) return null;
      return step.gameplan ? steps.value[index - 1] ?? null : step;
    }

    /**
     * The resource columns this step actually states.
     *
     * Time and villagers are rendered separately and always; everything here is
     * conditional. A build that says nothing about stone gets no stone column,
     * rather than a column of blanks that reads as "zero on stone".
     */
    const dockCells = computed(() => {
      const source = resourceSource(currentStepIndex.value);

      return RESOURCE_COLUMNS.filter((column) => hasResourceValue(source?.[column.key])).map(
        (column) => ({ ...column, value: source[column.key] })
      );
    });

    /**
     * The one thing worth knowing about the next step, and when it happens.
     *
     * At most one token by design. The player is watching a game; a full second
     * spread in the corner of their screen is something to read rather than
     * something to glance at, and the step row already carries the detail once
     * they get there.
     */
    const nextPreview = computed(() => {
      if (!autoplaySupported.value) return null;

      const nextIndex = currentStepIndex.value + 1;
      const next = steps.value[nextIndex];
      if (!next) return null;

      return { time: next.time, token: previewToken(nextIndex) };
    });

    /**
     * Resolves the preview token by priority: an age-up beats everything, then
     * the largest villager reassignment the next step asks for, then nothing.
     *
     * @param {number} nextIndex - Position of the next step.
     * @return {Object|null} The token, or null when the next step asks for nothing.
     */
    function previewToken(nextIndex) {
      const ageUp = stepAgeUp.value[nextIndex];
      if (ageUp) return { ageUp: true, text: ageUp };

      const from = resourceSource(currentStepIndex.value);
      const to = resourceSource(nextIndex);
      if (!from || !to) return null;

      let best = null;
      for (const column of RESOURCE_COLUMNS) {
        const delta = parseVillagerCountString(to[column.key]) - parseVillagerCountString(from[column.key]);
        if (delta !== 0 && (!best || Math.abs(delta) > Math.abs(best.delta))) {
          best = { delta, column };
        }
      }
      if (!best) return null;

      return {
        ageUp: false,
        icon: best.column.icon,
        text: `${best.delta > 0 ? "+" : ""}${best.delta}`,
      };
    }

    /**
     * Move to the next step.
     *
     * @param {boolean} [seek=true] - Whether to move the clock to the step's own
     *   start time. True whenever a player navigated — by button, key or swipe —
     *   because the step is then what the clock should follow. False when the
     *   timer advanced on its own: there the clock is what the step follows, and
     *   re-anchoring it to the moment just reached would stall playback.
     *
     *   This was a bare `event` parameter, so "a player navigated" was inferred
     *   from a DOM event being passed along. Two of the three navigations do not
     *   pass one — the swipe handler wraps this in an arrow function, and the
     *   key handler calls it bare — so neither moved the clock. The visible half
     *   was a step time that stayed put while the step changed; the other half
     *   was the anchor going unset, which left autoplay counting from wherever
     *   the player had been before the swipe.
     */
    function handleNextStep(seek = true) {
      currentStepIndex.value = Math.min(++currentStepIndex.value, steps.value.length - 1);
      currentStep.value = steps.value[currentStepIndex.value];

      clearTimer();
      if (seek) {
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

    /**
     * Move to the previous step. Nothing but a player ever steps backwards, so
     * `seek` is true at every call site; it stays a parameter to keep the pair
     * symmetrical rather than because anything passes false.
     *
     * @param {boolean} [seek=true] - See handleNextStep.
     */
    function handlePreviousStep(seek = true) {
      currentStepIndex.value = Math.max(--currentStepIndex.value, 0);
      currentStep.value = steps.value[currentStepIndex.value];

      clearTimer();
      if (seek) {
        setElapsedTimeToCurrentStepStartTime();
      }
      updateProgress();
      if (autoplay.value) {
        initTimer();
      }
      if (audio.value) {
        stop();
        //Stated, not left to the default. speak()'s second parameter defaults to
        //*true*, so omitting it here — the only one of six call sites that did —
        //announced the villager distribution on every step backwards no matter
        //what the toggle said. Silent, because forwards playback was correct and
        //nobody steps back on purpose while listening.
        speak(currentStep.value, announceVillagers.value);
      }
    }

    function handleClose() {
      //The window is a view onto this session, so closing the session closes it.
      if (pipActive.value) closePiP();
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
      //Guards the Notes heading — see the concat above
      hasVisibleContent,
      steps,
      focusRoot,
      getProgress,
      totalElapsedTimeFormattedString,
      currentStepDerived,
      currentAge,
      currentStep,
      currentStepProgress,
      getFormattedTime,
      handleNextStep,
      handlePreviousStep,
      handleTogglePlayback,
      handleToggleAudio,
      handleToggleVillagerAnnouncements,
      handlePopOut,
      closePiP,
      pipSupported,
      pipActive,
      timer,
      audio,
      announceVillagers,
      autoplaySupported,
      currentStepIndex,
      handleClose,
      aggregateVillagers,
      getContent,
      dockCells,
      nextPreview,
    };
  },
};
</script>
<style scoped>
/* Four fixed rows, one of which flexes. The step is the only thing that should
   grow into spare space, and nothing anywhere scrolls: a scrollbar in a 320px
   floating window is a control the player has to find and use mid-game. */
.fm-root {
  container-type: size;
  container-name: focus;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-surface));
}

/* The tier variables live here, one element inside the container, because a
   container query styles descendants and never the container itself. */
.fm-shell {
  --fm-content-icon: 48px;
  --fm-step-type: 19px;
  --fm-play: 56px;
  --fm-ctl: 44px;
  --fm-ctl-icon: 20px;
  --fm-res-icon: 24px;
  --fm-res-type: 14px;
  --fm-dock-pad: 10px;
  --fm-title-type: 15px;
  --fm-title-lines: 2;
  --fm-gap: 8px;

  display: grid;
  grid-template-rows: auto auto 1fr auto;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/* Every row states which track it is on.
   Without this the rows are placed implicitly, in order — so hiding the header
   at the micro tier shifted the other three up one track each, handing the step
   row the header's `auto` (it collapsed to its text) and the dock the step's
   `1fr` (it swallowed the window). Stated explicitly, a hidden row collapses
   its own track and its siblings do not move. */
.fm-header {
  grid-row: 1;
  display: flex;
  align-items: center;
  gap: var(--fm-gap);
  padding: 6px 10px;
  min-width: 0;
}

.fm-title {
  flex: 1 1 auto;
  min-width: 0;
  font-size: var(--fm-title-type);
  line-height: 1.25;
  font-weight: 500;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--fm-title-lines);
  line-clamp: var(--fm-title-lines);
}

.fm-counter {
  flex: 0 0 auto;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-variant-numeric: tabular-nums;
}

.fm-bars {
  grid-row: 2;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

/* The unfilled part of both bars is a faint wash of the text colour, not a
   tint of the fill — a track in the fill's own colour makes an empty bar look
   like a full one at a glance, which is the one thing a progress bar must
   never do. */
:deep(.fm-bar .v-progress-linear__background) {
  background: rgb(var(--v-theme-on-surface));
  opacity: 0.08;
}

/* Step progress, held back so the build's overall progress reads first. */
:deep(.fm-bar--dim .v-progress-linear__determinate) {
  opacity: 0.4;
}

.fm-step {
  grid-row: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Centred while it fits, top-aligned the moment it does not.
     Plain `center` spills an overlong step equally past both edges, so it is
     clipped at the top as well as the bottom and the reader is handed its
     middle rather than its beginning. `safe` drops to start-alignment exactly
     when that would happen. The unprefixed value stays underneath as the
     fallback for browsers that do not know the keyword — they keep today's
     behaviour rather than losing centring altogether. */
  justify-content: center;
  justify-content: safe center;
  gap: 6px;
  text-align: center;
  padding: 8px 12px;
  min-height: 0;
  overflow: hidden;
  background: rgba(var(--v-theme-surface), 0.4);
}

.fm-step-content {
  font-size: var(--fm-step-type);
  line-height: 1.35;
  min-height: 0;
}

.fm-notes {
  margin-bottom: 6px;
  font-size: max(11px, calc(var(--fm-step-type) - 4px));
}

.fm-notes-icon {
  vertical-align: middle;
}

.fm-preview {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-variant-numeric: tabular-nums;
}

.fm-preview-token {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.fm-preview-icon {
  width: 13px;
  height: 13px;
  object-fit: contain;
}

.fm-dock {
  grid-row: 4;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--fm-dock-pad);
  background: rgb(var(--v-theme-background));
}

.fm-resources {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-width: 0;
}

.fm-res {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--fm-res-type);
  font-variant-numeric: tabular-nums;
}

.fm-res-icon {
  width: var(--fm-res-icon);
  height: var(--fm-res-icon);
  object-fit: contain;
}

.fm-res-value--time {
  color: rgb(var(--v-theme-primary));
}

.fm-transport {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--fm-gap);
}

/* The transport reads as one primary action and four helpers, at every tier.
   Sized here rather than through Vuetify's size prop because the tier is CSS
   state — script never learns which one is in force. */
:deep(.fm-transport .v-btn.fm-ctl-btn) {
  width: var(--fm-ctl);
  height: var(--fm-ctl);
  min-width: var(--fm-ctl);
}

:deep(.fm-transport .v-btn.fm-ctl-btn .v-icon) {
  font-size: var(--fm-ctl-icon);
}

:deep(.fm-transport .v-btn.fm-play) {
  width: var(--fm-play);
  height: var(--fm-play);
  min-width: var(--fm-play);
}

:deep(.fm-transport .v-btn.fm-play .v-icon) {
  font-size: calc(var(--fm-play) * 0.45);
}

:deep(.fm-header .v-btn.fm-ctl-btn--small) {
  width: 32px;
  height: 32px;
  min-width: 32px;
}

:deep(.fm-transport .v-btn.fm-ghost) {
  background: rgba(var(--v-theme-primary), 0.12);
}

@container focus ((max-width: 520px) or (max-height: 300px)) {
  .fm-shell {
    --fm-content-icon: 38px;
    --fm-step-type: 16px;
    --fm-play: 40px;
    --fm-ctl: 30px;
    --fm-ctl-icon: 17px;
    --fm-res-icon: 20px;
    --fm-res-type: 12.5px;
    --fm-dock-pad: 7px;
    --fm-title-type: 13px;
    --fm-title-lines: 1;
    --fm-gap: 6px;
  }
}

/* Below this the box is a strip beside a minimap. The OS window title already
   carries the build name, so the header row is redundant rather than merely
   tight, and the resource strip drops to the two numbers a player checks
   without reading. */
@container focus ((max-width: 340px) or (max-height: 190px)) {
  .fm-shell {
    --fm-content-icon: 34px;
    --fm-step-type: 14px;
    --fm-play: 32px;
    --fm-ctl: 26px;
    --fm-ctl-icon: 15px;
    --fm-res-icon: 16px;
    --fm-res-type: 11px;
    --fm-dock-pad: 5px;
    --fm-gap: 4px;
  }

  .fm-header {
    display: none;
  }

  .fm-preview {
    display: none;
  }

  .fm-dock {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .fm-resources {
    gap: 8px;
  }

  .fm-res--extra {
    display: none;
  }
}

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
  width: var(--fm-content-icon);
  height: var(--fm-content-icon);
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
</style>
