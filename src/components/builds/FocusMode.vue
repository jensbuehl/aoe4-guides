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
        <!--The fork takes the step area and nothing else. Header, progress bars,
            resource dock and transport controls do not move: a player mid-game
            is holding the shape of this screen in their head, and a question is
            not a reason to rearrange it.-->
        <div class="fm-step-content fm-step-content--pick" v-if="pendingPick">
          <div class="fm-pick">
            <div class="fm-pick-ask">
              <v-icon size="18" class="fm-pick-mark">mdi-call-split</v-icon>
              <span class="fm-pick-ask-text">Which way?</span>
            </div>
            <!--Keyed on the deadline so a fresh question restarts the drain: the
                animation is what makes the bar move, and an element that is only
                restyled keeps playing the old one.-->
            <div
              class="fm-pick-timer"
              v-if="pickSeconds"
              :key="pickDeadline"
              :style="{ '--pick-secs': pickSeconds + 's' }"
            >
              <i></i>
            </div>
            <div class="fm-pick-options">
              <button
                v-for="(path, pathIndex) in pendingPick.paths"
                :key="'pick' + pathIndex"
                class="fm-pick-option"
                @click="choosePath(pendingPick.key, pathIndex)"
              >
                <span class="fm-pick-title">{{ path.title }}</span>
                <span
                  v-if="conditionOfPath(path)"
                  class="fm-pick-cond"
                  v-html="conditionOfPath(path)"
                ></span>
              </button>
            </div>
          </div>
        </div>
        <div class="fm-step-content" v-else>
          <div class="fm-notes" v-if="hasVisibleContent(currentStep?.gameplan)">
            Notes
            <v-icon color="accent" class="fm-notes-icon">mdi-information-outline</v-icon>
          </div>
          <span v-html="getContent()" />
        </div>

        <!--One token, never the next step's full spread. The player is looking
            at a game, so the preview is a glance: when does the next thing
            happen, and what is the one thing it asks for.-->
        <div class="fm-preview" v-if="nextPreview && !pendingPick">
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

      <!--Its own grid track, not an element slipped in: the shell states which
          row each part sits on, and an unplaced child would take the step area's
          1fr and stretch down the screen.-->
      <div class="fm-path-bar" v-if="activePathBar">
        <v-icon size="13" class="fm-path-bar-mark">mdi-call-split</v-icon>
        <span class="fm-path-bar-title">{{ activePathBar.title }}</span>
        <button
          v-if="activePathBar.paths.length > 1"
          class="fm-path-bar-switch"
          @click="reopenPick()"
        >
          change
        </button>
      </div>

      <div class="fm-dock">
        <!--Only what the step actually states, plus the two things always worth
            knowing. A column the author left blank is absent rather than empty:
            a row of dashes reads as data the build does not have.-->
        <!--Two lines wherever there is the height for them: where the build is,
            then what it should have. The villager count heads the second line
            rather than the first because it is the *sum* of the cells beside it
            — a total on a different line from its addends is a number the reader
            has to go looking for.

            Stated in the markup rather than left to wrapping, so the dock keeps
            one height for the whole build. The strip is built per step, so a
            build that states four columns early and six later grows a second
            line halfway through — and the dock is what the transport sits on, so
            that moves the buttons under the thumb reaching for them.

            The dense tiers dissolve both lines back into one row: see
            `display: contents` below. There the height is what is scarce.-->
        <div class="fm-resources">
          <div class="fm-res-line">
            <!--Crest only, no label, and never in the header. Age is the one
                thing on the dock that cannot be inferred from what is already on
                screen, so it is also the one that has to survive the micro tier
                — where the header is gone and .fm-res--extra is hidden, and age,
                time and villagers are the whole plan check.

                It is still the first cell to go once the lines are collapsed and
                the row runs out of width, because it is the only one that can
                go: time and villagers are what the strip is for, and dropping a
                resource column would leave the others reading as the whole
                distribution.-->
            <div class="fm-res fm-res--age" v-if="currentAge">
              <img class="fm-res-icon" :src="currentAge.crest" :alt="currentAge.name" />
            </div>
            <div class="fm-res">
              <img class="fm-res-icon" src="/assets/resources/time.webp" alt="Elapsed time" />
              <span class="fm-res-value fm-res-value--time" :class="{ 'fm-time--derived': currentStepDerived }">
                {{ currentStepDerived ? "~" : "" }}{{ totalElapsedTimeFormattedString }}
              </span>
            </div>
          </div>

          <div class="fm-res-line fm-res-line--eco">
            <div class="fm-res">
              <img class="fm-res-icon" src="/assets/resources/villager.webp" alt="Villagers" />
              <span class="fm-res-value">{{ currentStep ? aggregateVillagers(currentStep) : "" }}</span>
            </div>
            <div class="fm-res fm-res--extra" v-for="cell in dockCells" :key="cell.key">
              <img class="fm-res-icon" :src="cell.icon" :alt="cell.label" />
              <span class="fm-res-value" v-html="cell.value" />
            </div>
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
import { convertStepImagePaths, withWebpPaths } from "@/composables/builds/legacyImagePaths";
import { useStepPiP } from "@/composables/builds/useStepPiP.js";
import { useActivePath } from "@/composables/builds/useActivePath.js";
import { pathCondition } from "@/composables/builds/alternativesDraft.js";
import {
  AGE_DISPLAY,
  ageArt,
  blockId,
  flattenSections,
  sectionOffsets,
} from "@/composables/builds/useAgeTimings.js";
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
/**
 * The longest a fork may hold the screen before the clock answers for the
 * player. Ten seconds is long enough to read two titles and decide, short enough
 * that a question left hanging does not become the thing on screen.
 */
const PICK_TIMEOUT_SECONDS = 10;

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

    //Focus mode holds its own reading, not the page's. A choice made mid-game is
    //about the game being played; it must not reach back and change what the
    //build page below is showing, and the page's choice must not change the
    //queue under a player's feet.
    const focusSelection = useActivePath();

    //Index-aligned to the queue, like the age markers: the block that forks at
    //each step, or null.
    const stepPick = ref([]);
    //Seconds left before the clock answers for the player. Null when nothing is
    //being asked.
    //How long the drain lasts, in seconds — a CSS duration, not a number on
    //screen. The count used to be sampled from the clock once a second and
    //rounded up, which skips: setInterval drifts a few milliseconds a tick, and
    //ceil() of a drifting sample drops a value the moment the drift crosses an
    //integer. A bar animated by the browser has no sampling to drift.
    const pickSeconds = ref(null);
    //Elapsed-seconds moment at which the clock answers for the player.
    const pickDeadline = ref(null);
    //The block whose question the player asked for a second time, if any. It is
    //what separates "not answered yet" from "answered, and asked again" — only
    //the first counts down.
    const reopenedKey = ref(null);
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

    /**
     * Builds the playback queue for one reading of the build.
     *
     * Lifted out of onMounted so a path switch can run it again. It cannot be
     * patched in place: the five arrays below are index-aligned to each other,
     * `step.time` is stamped into the steps themselves, and the redundant filter
     * shortens all of them at once. Rebuilding is the only honest way to change
     * what is in the queue.
     *
     * The order is load-bearing and unchanged: flatten, then time, then mark,
     * then filter. Filtering first would shift every anchor the resolver used
     * and change the times of the steps that remain.
     *
     * @param {Object} [selection] - Which alternative each block is read down.
     *   Omitted, every block resolves to its first path.
     * @return {void} Assigns steps, stepsTimings, stepDerived, stepAgeUp, stepAge.
     */
    function buildQueue(selection) {
      //init steps
      if (!props.build.steps[0]?.type) {
        //For backwards compatibility
        steps.value = JSON.parse(JSON.stringify(props.build.steps));
      } else {
        //One flattener for the whole site. The indices produced here have to
        //line up with getTimings(), the resolver and the age markers below, and
        //every private copy of this loop was one more place they could quietly
        //stop agreeing. Cloned because the queue is mutated from here on —
        //step.time is stamped in place — and the flattener hands back the
        //build's own step objects.
        steps.value = JSON.parse(JSON.stringify(flattenSections(props.build.steps, selection)));

        //Legacy .png icon paths, over every field rather than `description`
        //alone: the flattened list carries notes too, and a note's text is its
        //`gameplan`. Safe to mutate — the clone above is ours.
        convertStepImagePaths(steps.value);

        //Section notes are folded into the step they follow, which is the last
        //step of their own section — or, for a section with no steps of its
        //own, the last step before it. Read from the offsets rather than from
        //a running total, so this cannot drift from the list above.
        const offsets = sectionOffsets(props.build.steps, selection);

        props.build.steps.forEach((section, index) => {
          //Guarded on visible content, not on the string: a note the author
          //emptied is "<br>", which would append two blank lines and a third
          //to a step that reads fine without them — or become the whole of a
          //step's content, leaving the player a card with nothing on it.
          if (!hasVisibleContent(section.gameplan)) return;

          //concat gameplan to current age's last step's description
          //
          //The separator only earns its place between two things. Appended
          //unconditionally it prefixed a step that had no description of its
          //own with two blank lines, which is invisible on a full screen and
          //ruinous in a 400px window: the note became a three-line block in a
          //row barely tall enough for one, and the centred content was sliced
          //through the middle so the reader got the second blank line and the
          //top half of the text.
          const end = (index + 1 < offsets.length ? offsets[index + 1] : steps.value.length) - 1;
          const last = steps.value[end];
          //A note before any step at all has nothing to attach to. Previously
          //this read steps[-1] and threw.
          if (!last) return;

          //Converted on the way in: this text comes from props, which the pass
          //above deliberately did not touch, so it still carries legacy paths.
          const note = withWebpPaths(section.gameplan);
          last.description = last.description ? last.description + " <br><br> " + note : note;
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
      stepPick.value = readPickMarkers(props.build.steps, steps.value.length, selection);
      stepAgeUp.value = readAgeUpMarkers(props.build.steps, steps.value.length, selection);
      stepAge.value = readAgeMarkers(props.build.steps, steps.value.length, selection);

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
      stepPick.value = stepPick.value.filter((marker, index) => !redundant[index]);

      //The step that carried the question may itself have been redundant. The
      //question still has to be asked, so it moves to whichever of the block's
      //steps survived first — otherwise the fork passes unasked and the player
      //silently plays path one.
      const asked = new Set();
      stepPick.value.forEach((marker) => {
        if (!marker) return;
        marker.first = !asked.has(marker.key);
        asked.add(marker.key);
      });
      stepAgeUp.value = stepAgeUp.value.filter((marker, index) => !redundant[index]);
      stepAge.value = stepAge.value.filter((marker, index) => !redundant[index]);
      if (stepsTimings.value) {
        stepsTimings.value = stepsTimings.value.filter((timing, index) => !redundant[index]);
      }

    }

    onMounted(async () => {
      buildQueue(focusSelection.paths.value);

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
        if (!autoplaySupported.value) announceStep();
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
     * The block the player is being asked about, or null.
     *
     * A block asks once: the marker is on its first step, and once a path has
     * been chosen for that block the question is answered and the queue simply
     * plays on.
     */
    const pendingPick = computed(() => {
      const marker = stepPick.value?.[currentStepIndex.value];
      if (!marker?.first && reopenedKey.value !== marker?.key) return null;

      if (focusSelection.pathFor(marker.key) != null) return null;
      return { ...marker, reopened: reopenedKey.value === marker.key };
    });

    /**
     * The path being played, while one is — for the bar that names it.
     *
     * Shown for every step of the block, not only the first, because that is
     * exactly how long the choice stays changeable: a read at 4:10 can be wrong,
     * and the player should be able to say so until the paths rejoin.
     */
    const activePathBar = computed(() => {
      const marker = stepPick.value?.[currentStepIndex.value];
      if (!marker || pendingPick.value) return null;

      const index = focusSelection.pathFor(marker.key) ?? 0;
      return { key: marker.key, index, paths: marker.paths, title: marker.paths[index]?.title };
    });

    /**
     * Asks the question again.
     *
     * Not a cycle to the next path: cycling is guesswork — the player is asked
     * to pick blind and, past two paths, to keep picking until the right one
     * comes round. Re-opening brings back the card they already answered once,
     * with the titles and conditions on it, and costs nothing to scale.
     *
     * The re-opened question does not count down. The countdown exists so a
     * live game never stalls on a question nobody saw; a player who deliberately
     * asked to be asked again has seen it, and answering it *for* them with the
     * first path is the blind behaviour this replaces.
     *
     * @return {void}
     */
    function reopenPick() {
      const bar = activePathBar.value;
      if (!bar) return;

      reopenedKey.value = bar.key;
      focusSelection.clear(bar.key);
      announceStep();
    }

    //Armed when a fork is on screen *and* the clock is running, disarmed the
    //moment either stops being true.
    //
    //Both, because a deadline is a point on the build clock: computing one while
    //that clock is stopped dates it to an anchor about to move, and the question
    //would arrive already expired the second play resumed. Paused, there is no
    //deadline and nothing is drawn — which is the truth, since nothing is
    //approaching.
    //
    //The guard against re-arming is what makes this safe to fire often:
    //pendingPick hands back a fresh object each time it is read, so this runs on
    //changes that are not changes, and an unguarded arm would restart the drain
    //under the player.
    watch(
      [pendingPick, timer],
      () => {
        const pick = pendingPick.value;
        if (!pick || pick.reopened || timer.value == null) {
          pickDeadline.value = null;
          pickSeconds.value = null;
          return;
        }
        if (pickDeadline.value != null) return;

        pickDeadline.value = pickDeadlineFor();
        pickSeconds.value = Math.max(0, pickDeadline.value - elapsedSecondsNow());
      },
      { immediate: true }
    );

    /**
     * A choice belongs to the pass through the block that made it.
     *
     * Step back past the fork and the decision is unmade, so walking forward
     * asks again — going back to try the other way is a real way to use this.
     * Stepping back *within* a block is not: that is still the same pass.
     *
     * No rebuild is needed. The queue is already provisional before an answer —
     * it is laid out with the author's default and rebuilt when the player
     * chooses — and every path shares the steps in front of the fork, so
     * nothing the player can currently see moves.
     */
    watch(currentStepIndex, (index) => {
      const firstSeen = new Map();
      stepPick.value.forEach((marker, at) => {
        if (marker && !firstSeen.has(marker.key)) firstSeen.set(marker.key, at);
      });

      for (const [key, at] of firstSeen) {
        if (index < at && focusSelection.pathFor(key) != null) focusSelection.clear(key);
      }
    });

    /**
     * Says the step the player is on.
     *
     * At a fork it says the question instead. There is no step to say: the one
     * under the question belongs to whichever path the author happened to write
     * first, and reading it out would tell a player looking at their game to do
     * something they may be about to decide against.
     *
     * Every arrival at a step routes through here — the tick's catch-up, the
     * transport, resuming, and answering a fork — so this is the one place that
     * decides what is said, and nothing can say it twice.
     *
     * @return {void}
     */
    function announceStep() {
      if (!audio.value) return;
      if (pendingPick.value) {
        announcePick(pendingPick.value);
        return;
      }

      speak(currentStep.value, announceVillagers.value);
    }

    /**
     * Says the question, as a question.
     *
     * Focus mode exists for a player whose eyes are on their game, and a fork
     * that passed in silence would auto-answer ten seconds later without them
     * ever knowing they had been asked. The path titles are read out because
     * they are what the buttons say — the conditions are not, since a spoken
     * paragraph outlasts the countdown.
     *
     * @param {Object|null} pick - The pending fork.
     * @return {void}
     */
    function announcePick(pick) {
      if (!audio.value || !pick) return;

      const titles = (pick.paths ?? []).map((path) => path.title).filter(Boolean);
      stop();
      speak({ description: `Which way? ${titles.join(", or ")}` }, false);
    }

    /** A path's condition, which is its first note — the thing being decided. */
    const conditionOfPath = (path) => pathCondition(path);

    /**
     * Takes a path mid-run.
     *
     * The queue is rebuilt rather than patched — see buildQueue — and then the
     * cursor is found again **by the clock**, not by its old index. The timer
     * has been running throughout and is the only thing that knows where the
     * game actually is; the path that was just chosen may be longer or shorter
     * than the one the queue was holding, so the index the player was on means
     * nothing once the steps behind it have changed.
     *
     * @param {string} key - The block's key.
     * @param {number} pathIndex - Which path to take.
     * @return {void}
     */
    function choosePath(key, pathIndex) {
      pickSeconds.value = null;
      pickDeadline.value = null;
      if (reopenedKey.value === key) reopenedKey.value = null;
      focusSelection.select(key, pathIndex);

      buildQueue(focusSelection.paths.value);
      reseekToClock();

      //The step the answer landed on, which is the first one down the chosen
      //path — and the first thing the player has not already been told.
      stop();
      announceStep();
    }

    /**
     * Puts the cursor where the clock says the build is.
     *
     * The last step whose start time has already passed. Falls back to holding
     * the current position when the build has no usable timings at all, which is
     * the same build that has no autoplay to keep in step with.
     *
     * @return {void}
     */
    function reseekToClock() {
      const timings = stepsTimings.value;

      if (!timings?.length) {
        currentStepIndex.value = Math.min(currentStepIndex.value, steps.value.length - 1);
        currentStep.value = steps.value[currentStepIndex.value];
        return;
      }

      const now = elapsedSecondsNow();
      let index = 0;
      for (let cursor = 0; cursor < timings.length; cursor++) {
        if (timings[cursor].startTime > now) break;
        index = cursor;
      }

      currentStepIndex.value = index;
      currentStep.value = steps.value[index];
    }

    /**
     * Marks the step at which each alternatives block begins.
     *
     * One entry per queue position, almost all null: at the first step a block
     * contributes, the block itself — so the player can be asked which way to
     * go at the moment the build forks, rather than after it has already taken
     * one of the paths.
     *
     * Counted the same way the flattener counts, from the steps each item ahead
     * of the block contributes rather than from the item count, so a section
     * holding a note and a block still marks the right step.
     *
     * @param {Array} sections - The build's sections array, or a legacy flat list.
     * @param {number} length - Length of the flattened step list.
     * @param {Object} [selection] - Which alternative each block is read down.
     * @return {Array<Object|null>} Index-aligned `{ key, paths }` entries.
     */
    function readPickMarkers(sections, length, selection) {
      const markers = new Array(length).fill(null);
      if (!Array.isArray(sections) || !sections[0]?.type) return markers;

      const offsets = sectionOffsets(sections, selection);

      sections.forEach((section, sectionIndex) => {
        let cursor = offsets[sectionIndex];

        (section?.steps ?? []).forEach((item, itemIndex) => {
          if (item?.kind !== "alternatives") {
            if (!item?.kind) cursor++;
            return;
          }

          const key = blockId(sectionIndex, itemIndex);
          const chosen = selection?.[key];
          const active = Number.isInteger(chosen) && item.paths?.[chosen] ? chosen : 0;
          const contributed = (item.paths?.[active]?.steps ?? []).filter((step) => !step?.kind).length;

          //Every step the block contributes carries it, not just the first: the
          //first is where the question is asked, and the rest are where the
          //answer can still be changed — the choice stays open until the paths
          //rejoin. A path with no steps of its own contributes nothing to stand
          //on, so there is nowhere to ask and the block passes silently, exactly
          //as it does in the reading view.
          for (let offset = 0; offset < contributed; offset++) {
            markers[cursor + offset] = { key, paths: item.paths ?? [], first: offset === 0 };
          }
          cursor += contributed;
        });
      });

      return markers;
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
    function readAgeUpMarkers(sections, length, selection) {
      const markers = new Array(length).fill(null);
      //Legacy flat builds have no sections, so no age boundaries exist to read
      if (!Array.isArray(sections) || !sections[0]?.type) return markers;

      //Where each section starts in the flattened list. Shared with the
      //flattening above rather than counted again here: two cursors over the
      //same sections is exactly how the markers and the steps drift apart.
      const offsets = sectionOffsets(sections, selection);

      sections.forEach((section, index) => {
        const start = offsets[index];
        const end = index + 1 < offsets.length ? offsets[index + 1] : length;

        if (section?.type === "ageUp" && end > start) {
          const arrival = sections
            .slice(index + 1)
            .find((later) => later?.type === "age" && later.age > 1);
          const display = AGE_DISPLAY.find((entry) => entry.age === arrival?.age);
          if (display) markers[start] = display.short;
        }
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
    function readAgeMarkers(sections, length, selection) {
      const markers = new Array(length).fill(null);
      if (!Array.isArray(sections) || !sections[0]?.type) return markers;

      const offsets = sectionOffsets(sections, selection);
      let current = null;

      sections.forEach((section, index) => {
        if (section?.type === "age" && section.age >= 1) {
          current = section.age;
        } else if (section?.type === "ageUp" && current == null && section.age >= 1) {
          //Only as a fallback: an ageUp section stores the age it starts from, so
          //it can name the current age for a build whose first section was left
          //at 0 but which is otherwise laid out in ages.
          current = section.age;
        }

        const end = index + 1 < offsets.length ? offsets[index + 1] : length;
        for (let cursor = offsets[index]; cursor < end; cursor++) markers[cursor] = current;
      });

      return markers;
    }

    /**
     * Counts the question down, and answers it if the player does not.
     *
     * The clock never waits for a decision. A player who is busy fighting gets
     * the author's first path and keeps going — an answer they can still change
     * until the paths rejoin — because a build that stops mid-game is worse than
     * one that guessed.
     *
     * Nothing is displayed from here — the drain is a CSS animation, and this is
     * only the threshold. One crossing, so sampling once a second is exact
     * enough; it was displaying a *count* from the same sample that made the
     * number skip.
     *
     * @return {void}
     */
    function tickPick() {
      const pick = pendingPick.value;
      if (!pick || pickDeadline.value == null) return;

      if (elapsedSecondsNow() >= pickDeadline.value) choosePath(pick.key, 0);
    }

    /**
     * How long the player has: until the next step is due, and never more than
     * ten seconds. The gap is the honest deadline — past it the build has moved
     * on — but a long gap should not leave a question hanging on screen.
     *
     * @return {number|null} Elapsed-seconds deadline, or null when nothing asks.
     */
    function pickDeadlineFor() {
      const timings = stepsTimings.value;
      const now = elapsedSecondsNow();
      const next = timings?.[currentStepIndex.value + 1]?.startTime;

      return Math.min(next == null ? now + PICK_TIMEOUT_SECONDS : next, now + PICK_TIMEOUT_SECONDS);
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
      tickPick();

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
            announceStep();
          }
        }
      }
    }

    function handleToggleAudio() {
      audio.value = !audio.value;
      if (!audio.value) {
        stop();
      } else {
        if (!autoplaySupported.value) announceStep();
      }
    }

    function handleToggleVillagerAnnouncements() {
      announceVillagers.value = !announceVillagers.value;
      if (audio.value) {
        stop();
        announceStep();
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
        announceStep();
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
        announceStep();
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
      pendingPick,
      activePathBar,
      reopenPick,
      pickSeconds,
      pickDeadline,
      choosePath,
      conditionOfPath,
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
  --fm-res-gap: 12px;
  --fm-dock-pad: 10px;
  --fm-title-type: 17px;
  --fm-title-lines: 2;
  --fm-counter-type: 13.5px;
  --fm-header-ctl: 36px;
  --fm-preview-type: 13.5px;
  --fm-preview-icon: 16px;
  --fm-icon-margin-y: 6px;
  --fm-gap: 8px;

  display: grid;
  /* header, bars, step, path bar, dock. The path bar's track collapses to
     nothing when no block is being played, so a build without alternatives is
     laid out exactly as before. */
  grid-template-rows: auto auto 1fr auto auto;
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
  font-size: var(--fm-counter-type);
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

/* Clips rather than spills. It is a flex item, so a step too tall for the space
   left shrinks — and a shrunk box does not shorten its text, it lets it out of
   the bottom, straight through the preview underneath. Two things painted over
   each other is worse than either one cut off, and the preview below is the one
   that must not move: it is the same 16px on every step. */
.fm-step-content {
  font-size: var(--fm-step-type);
  line-height: 1.35;
  min-height: 0;
  overflow: hidden;
}

/* A step is as tall as its text; the fork is as tall as the room. Without this
   the whole chain below it is content-sized, and `1fr` rows resolve to
   max-content — which is the fixed-height buttons all over again, by another
   route. `.fm-step` is a grid track, so claiming its space here is what makes
   every height beneath this definite. */
.fm-step-content--pick {
  flex: 1 1 auto;
  align-self: stretch;
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
  font-size: var(--fm-preview-type);
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-variant-numeric: tabular-nums;
}

.fm-preview-token {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.fm-preview-icon {
  width: var(--fm-preview-icon);
  height: var(--fm-preview-icon);
  object-fit: contain;
}

.fm-dock {
  grid-row: 5;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--fm-dock-pad);
  background: rgb(var(--v-theme-background));
}

.fm-resources {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

/* Wrapping is the net under the two lines, not the mechanism. Six cells of
   economy fit a 360px phone with room, but the row is centred — so a build that
   somehow overflowed one would be clipped at the first cell and the last, not
   just the last. A third line is the least bad thing left. */
.fm-res-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px var(--fm-res-gap);
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
  width: var(--fm-header-ctl);
  height: var(--fm-header-ctl);
  min-width: var(--fm-header-ctl);
}

:deep(.fm-transport .v-btn.fm-ghost) {
  background: rgba(var(--v-theme-primary), 0.12);
}

/* Where the full layout stops fitting rather than where it stops being roomy.
   It needs about 360x320: two dock lines and a transport come to 136px, the
   header 48 and the bars 6, which leaves a 320px box ~130 for the step — two
   lines of 48px icons — and the economy line is ~350 wide with every column a
   build can state.

   That is a long way below where this used to turn over. The old test asked for
   a box small in *both* directions, which was right for telling a phone from a
   floating window but wrong about the floating window itself: a player who
   drags one out to 900x500 has asked for the roomy layout, and a 600px-tall one
   was still getting the strip. Each dimension now fails on its own terms. */
@container focus ((max-width: 360px) or (max-height: 320px)) {
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
    --fm-counter-type: 12px;
    --fm-header-ctl: 32px;
    --fm-preview-type: 11.5px;
    --fm-preview-icon: 13px;
    --fm-res-gap: 8px;
    /* Back to what it was before the roomy tier asked for more. The margin is
       row spacing for wrapped lines of icons, and at 38px in a box this size
       there is rarely a second row to space — while 3px a line is 6px of step
       height, which is the difference between the preview fitting and not. */
    --fm-icon-margin-y: 3px;
    --fm-gap: 6px;
  }

}

/* One row again — and on height alone, because that is what the second line
   costs. A 400x230 window over a game cannot spend 24px of step text on it; a
   340x600 one has 600px of height and no reason to give the line up. Keyed off
   the scale above for exactly that reason: the two used to move together, so a
   box that was merely narrow lost a line it had the room for. */
@container focus (max-height: 320px) {
  .fm-resources {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px var(--fm-res-gap);
  }

  .fm-res-line {
    display: contents;
  }

  /* Collapsed into one row, the strip is back to needing more width than a
     narrow window has, and the crest goes first. How much it needs is not a
     property of the box though — it is a property of the build, which states
     between nothing and five resource columns — so this counts cells rather
     than measuring width: five on the economy line means villagers and four
     resources, which with the crest and the clock is seven across.

     A quantity query rather than a v-if, because whether the row is crowded
     depends on how wide its container is, and script is deliberately never told
     which tier is in force. */
  .fm-resources:has(.fm-res-line--eco .fm-res:nth-child(5)) .fm-res--age {
    display: none;
  }
}

/* The preview goes before the step does. Below this the chrome comes to ~130px
   — header 44, bars 6, collapsed dock 80 — and one line of step text with 38px
   icons is another 60, so the 22px the preview and its gap take is exactly the
   room the step needs to stay whole. It is a glance ahead; the step is the
   instruction. Height only: it is ~110px wide and has never been what a narrow
   box ran out of. */
@container focus (max-height: 260px) {
  .fm-preview {
    display: none;
  }
}

/* The fork, made to fit.
   
   Two things give way, in this order. First the conditions: they are what the
   author wrote to help a reader decide *before* the game, and mid-game on a
   small window the titles carry the decision on their own. Then the question text,
   which the split icon already says.
   
   The options themselves never give way past a thumb's width — a control too
   small to hit is worse than one that has to wrap. */
@container focus ((max-width: 420px) or (max-height: 320px)) {
  .fm-pick {
    gap: 6px;
  }
  .fm-pick-options {
    gap: 6px;
  }
  .fm-pick-cond {
    display: none;
  }
  .fm-pick-ask {
    font-size: 11px;
  }
  .fm-pick-title {
    font-size: 12px;
  }
  .fm-pick-timer {
    width: min(180px, 80%);
  }
}

/* Height alone, and after the tier above so it wins where both apply: the
   question row is the first thing to go when the window is short — the split
   icon on the options' own colour already says what is being asked — and width
   has no bearing on it, so a narrow tall phone keeps it. */
@container focus (max-height: 320px) {
  .fm-pick-ask {
    display: none;
  }
  .fm-pick,
  .fm-pick-options {
    gap: 4px;
  }
}

/* Narrower still. The options stay side by side rather than going full width —
   two to a row is half the height of two rows, and height is what runs out. */
/* Two columns once the box is too narrow to be trusted to find its own count,
   and — because the count is now known — the rule that stops an odd one out
   sitting off to the left. Auto-placement puts it in the first column of the
   last row; spanning lets it sit under the middle of the pair above. It keeps a
   sensible width rather than shrinking to its label, so the last option does
   not read as a different kind of control from the ones above it. */
@container focus (max-width: 360px) {
  .fm-pick-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .fm-pick-option:last-child:nth-child(odd) {
    grid-column: 1 / -1;
    justify-self: center;
    min-width: min(100%, 160px);
  }
}

@container focus (max-width: 300px) {
  .fm-pick-title {
    font-size: 11px;
  }
  .fm-path-bar-title {
    font-size: 11px;
  }
}

/* Below this the box is a strip beside a minimap. The OS window title already
   carries the build name, so the header row is redundant rather than merely
   tight, and the next-step preview is a luxury at this size.

   The resource split is not. It used to be the first thing dropped here, on the
   reasoning that time and villagers are what a player checks without reading —
   but the distribution is the thing they came for, and a dock that has shed
   everything else has room to keep it.

   Held off as long as the header can be read: a title, a counter and two 32px
   buttons still work across 300px, and the dock below needs ~250. */
@container focus ((max-width: 300px) or (max-height: 190px)) {
  .fm-shell {
    --fm-content-icon: 34px;
    --fm-step-type: 14px;
    --fm-play: 32px;
    --fm-ctl: 26px;
    --fm-ctl-icon: 15px;
    --fm-res-icon: 16px;
    --fm-res-type: 11px;
    --fm-res-gap: 8px;
    --fm-dock-pad: 5px;
    --fm-gap: 4px;
  }

  .fm-header {
    display: none;
  }

  /* Three items on two lines: the economy across the top, then the clock and the
     transport sharing the row below. The dock is the wrap container itself —
     .fm-resources dissolves — because the economy line has to span the full
     width, and a line held inside .fm-resources could only ever be as wide as
     the column beside the transport, which is not enough for six cells.

     Centred rather than pinned to the two edges. The clock and the transport
     only share a row while they both fit, and below roughly 250px they stop:
     pinned, they then break into two left-aligned lines under a centred economy
     line, which reads as three things that missed each other. Centred, every
     line is on the same axis whether the box breaks them or not — and the
     transport, which is what the player is aiming at, is where it is at every
     other size. */
  .fm-dock {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 4px 8px;
  }

  .fm-resources {
    display: contents;
  }

  /* Lines again, not the collapsed row the compact tier asked for. */
  .fm-res-line {
    display: flex;
  }

  /* A line of its own, and first. ~20px of dock for the one thing on screen a
     player cannot work out from the step text — and above the transport, so the
     controls stay on the bottom edge where every other tier puts them. */
  .fm-res-line--eco {
    order: -1;
    flex-basis: 100%;
  }

  /* The economy has its own line here, so the row that carries the crest is two
     cells wide and cannot be crowded — the crest stays however many columns the
     build states. Same selector as the compact tier's and later in the file,
     which is what overrides it. */
  .fm-resources:has(.fm-res-line--eco .fm-res:nth-child(5)) .fm-res--age {
    display: inline-flex;
  }
}

/* The clock while it is counting through a moment nobody wrote down. Same
   treatment as .age-time--derived on the timeline, so "estimated" looks the
   same wherever the reader meets it. */
.fm-time--derived {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

/* Inline content icons — shared square box; variants override background only.
   The vertical margin is the row spacing of the step text, not decoration: an
   icon is two and a half lines tall, so line-height alone leaves two wrapped
   rows of them touching. Kept off the padding, which is inside a fixed box and
   would shrink the artwork rather than space it. */
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
  margin: var(--fm-icon-margin-y) 4px var(--fm-icon-margin-y) 0;
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

/* ── The fork, mid-game ──────────────────────────────────────────────────────
   Blue, never gold. Gold in here is the transport: play, pause, the step clock.
   A gold button asking a question would be pressed by a player reaching for
   pause without reading it. */
.fm-pick {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  height: 100%;
  /* Without this the column cannot be shorter than its content, so a third
     alternative pushed the question itself off the top and clipped the last
     option under the dock. Now the options give way instead, and the thing
     being asked stays on screen. */
  min-height: 0;
}
.fm-pick-ask {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-alternative));
}
.fm-pick-mark {
  color: rgb(var(--v-theme-alternative));
}
/* The clock's own answer, counting down in the open. A question with a hidden
   deadline is worse than one with none. */
/* The whole deadline in one glance, and nothing to read. Driven by the browser
   rather than by the tick, so throttling a background window cannot make it
   stutter — and there is no number to skip. */
.fm-pick-timer {
  width: min(220px, 70%);
  height: 3px;
  border-radius: 2px;
  background: rgba(var(--v-theme-alternative), 0.25);
  overflow: hidden;
}
.fm-pick-timer i {
  display: block;
  height: 100%;
  background: rgb(var(--v-theme-alternative));
  transform-origin: left center;
  animation: fm-pick-drain var(--pick-secs) linear forwards;
}
@keyframes fm-pick-drain {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
/* The options divide the room they have; they do not ask for room.
   
   This was a wrapping flex row of fixed-height buttons, and every attempt to
   make three of them fit a floating window was a guess at a breakpoint — each
   one still overflowed into a scrollbar, which is the one control a player
   cannot use mid-game. A grid whose rows are bounded by the space available
   cannot overflow at any size: the columns fold from two to one when the box is
   narrow, the rows shrink to 28px when it is short, and on a phone they open
   out to a full thumb. No query decides any of it. */
.fm-pick-options {
  flex: 1 1 auto;
  display: grid;
  /* As many as fit, up to the box's width — three alternatives go across in one
     row on a monitor and fold to two-plus-one in a floating window. The column
     count is only left to the layout above 360px; below it the tier at the
     bottom of this file states two, because that is where the rule centring a
     lone last option needs to know how many there are. */
  grid-template-columns: repeat(auto-fit, minmax(116px, 1fr));
  /* 1fr, not a length. The rows divide a height that is already decided — the
     step area is a fixed grid track, so this box has a definite height before
     the rows are sized — which means three options fit a 90px floating window
     as three 26px rows and a phone as three tall ones. A length, any length, is
     a number that some window is smaller than. */
  grid-auto-rows: 1fr;
  gap: 6px;
  align-content: center;
  justify-content: center;
  width: 100%;
  max-width: 460px;
  /* The rows divide this box, and the box is never taller than the rows want to
     be. Both halves matter: without the cap, a full-height window gave two rows
     of six hundred pixels with a button floating in the middle of each, so the
     vertical gap read as ten times the horizontal one. With it, `1fr` still
     shrinks the rows when the window is too short for them — which is the whole
     reason they are `1fr` and not a length. */
  max-height: max-content;
  min-height: 0;
  overflow: hidden;
}
.fm-pick-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  /* Both zero, so the grid track decides the size and the button never pushes
     back. A thumb-sized target is the *track's* upper bound, not a floor the
     button insists on — insisting is what produced the scrollbar. */
  min-width: 0;
  min-height: 0;
  /* The thumb target is a ceiling here, not a floor: a tall row centres a 64px
     button rather than growing one to fill the screen. */
  max-height: 64px;
  align-self: center;
  padding: 4px 8px;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-alternative), 0.55);
  background: rgba(var(--v-theme-alternative), 0.18);
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
}
.fm-pick-option:hover {
  background: rgba(var(--v-theme-alternative), 0.3);
}
.fm-pick-title {
  font-size: 14px;
  font-weight: 700;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fm-pick-cond {
  font-size: 12px;
  opacity: 0.8;
}

/* Thin on purpose: it answers "which way am I going" and offers to change it,
   and it must not take room from the step a player is reading. */
/* Centred, because everything else on this screen is: the clock, the economy
   and the transport all sit on the middle line, and a label pinned left with a
   button pinned right was the one element that spread itself across a wide
   window. */
.fm-path-bar {
  grid-row: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 22px;
  padding: 0 10px;
  background: rgba(var(--v-theme-alternative), 0.16);
  color: rgb(var(--v-theme-alternative));
  font-size: 12px;
  font-weight: 700;
}
.fm-path-bar-mark {
  color: rgb(var(--v-theme-alternative));
}
.fm-path-bar-title {
  flex: 0 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgb(var(--v-theme-on-surface));
  font-weight: 600;
}
/* Explicit, because a read at 4:10 can be wrong and the player should not have
   to leave the game to correct it. */
.fm-path-bar-switch {
  border: 1px solid rgba(var(--v-theme-alternative), 0.6);
  border-radius: 6px;
  padding: 1px 8px;
  background: transparent;
  color: rgb(var(--v-theme-alternative));
  font: inherit;
  cursor: pointer;
}
.fm-path-bar-switch:hover {
  background: rgba(var(--v-theme-alternative), 0.25);
}
/* A 22px bar must not become a 44px one just to be tappable, so the target
   grows and the button does not. */
@media (pointer: coarse) {
  .fm-path-bar-switch {
    position: relative;
  }
  .fm-path-bar-switch::after {
    content: "";
    position: absolute;
    inset: -12px -10px;
  }
}
</style>
