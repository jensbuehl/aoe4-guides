<template>
  <!--
    Read-only summary of a build's age progression, shown above the build order
    so the reader gets the shape before the detail. Renders nothing at all when
    no ages are derivable — an empty card would be worse than no card.
  -->
  <v-card v-if="ages.length" flat rounded="lg" class="mt-4">
    <div class="build-card-section-header d-flex align-center px-4 ga-2">
      <v-icon color="accent" size="small">mdi-timer-sand</v-icon>
      <span class="text-caption text-uppercase font-weight-bold">Timeline</span>
    </div>

    <!--xs falls back to the same chips the list card uses: there is no room for
        a track worth reading at that width-->
    <div class="px-4 pb-4 d-md-none">
      <AgeChips :timings="ages" size="small" />
    </div>

    <div class="px-4 pb-4 d-none d-md-block">
      <!--Scale is 0–16:00 unless the build runs longer, so bars stay comparable
          across builds without clamping a late Imperial to the right edge-->
      <div class="age-track">
        <span
          v-for="segment in segments"
          :key="segment.key"
          :class="['age-seg', segment.key]"
          :style="{ width: segment.width + '%' }"
        ></span>
      </div>
      <div class="age-ticks">
        <v-tooltip v-for="age in ages" :key="age.age" location="top">
          <div class="agett" :style="{ color: $vuetify.theme.current.colors.primary }">
            <div class="agett-title font-weight-bold">{{ nameFor(age.age) }}</div>
            <!--No villager counts here: the marker below already carries one-->
            <template v-if="age.clickUp">
              <span>Clicked up</span>
              <b>{{ age.clickUp.derived ? "~" : "" }}{{ formatAgeTime(age.clickUp.seconds) }}</b>
            </template>
            <span>Reached</span>
            <b>{{ age.derived ? "~" : "" }}{{ formatAgeTime(age.seconds) }}</b>
            <template v-if="age.clickUp">
              <span>Age-up took</span>
              <b>{{ formatAgeTime(age.clickUp.duration) }}</b>
            </template>
            <div v-if="age.derived || age.clickUp?.derived" class="agett-note text-caption">
              ~ estimated from villager count
            </div>
          </div>
          <template v-slot:activator="{ props }">
            <div v-bind="props" class="age-tick" :style="{ left: percent(age.seconds) }">
              <img :src="crestFor(age.age)" alt="" class="age-crest" />
              <div :class="['age-time', { 'age-time--derived': age.derived }]">
                {{ age.derived ? "~" : "" }}{{ formatAgeTime(age.seconds) }}
              </div>
              <!--Pop at the moment of clicking up, which is the figure build
                  orders quote. Falls back to the arrival pop only when the build
                  has no age-up section, where the two are the same moment.-->
              <div v-if="popFor(age)" class="age-vils">{{ popFor(age) }} vils</div>
              <!--The crest names the age for sighted readers; this keeps it named
                  for everyone else, since no visible text carries it-->
              <span class="age-sr">{{ labelFor(age) }}</span>
            </div>
          </template>
        </v-tooltip>
      </div>
      <div class="age-axis">
        <span v-for="tick in axis" :key="tick">{{ tick }}</span>
      </div>
    </div>
  </v-card>
</template>

<script>
//External
import { computed } from "vue";

//Components
import AgeChips from "@/components/builds/AgeChips.vue";

//Composables
import {
  getAgeTimings,
  AGE_DISPLAY,
  formatAgeTime,
  ageTimingLabel,
  getAgeSegments,
} from "@/composables/builds/useAgeTimings.js";

/**
 * The track spans sixteen minutes by default, so the bars of two builds compared
 * in two tabs mean the same thing. It is a floor rather than a fixed size: a
 * build that runs past it extends the scale instead of having its last ages
 * clamped to the right edge, where a 20:00 Imperial and a 25:00 one would look
 * identical. Nearly every build sits at the default, so comparability holds
 * where it matters.
 */
const SCALE_MIN_SECONDS = 960;

/** Axis ticks every four minutes, so an extended scale keeps round labels */
const TICK_SECONDS = 240;

export default {
  name: "AgeTimeline",
  components: { AgeChips },
  props: {
    /** A build's steps — sections array or legacy flat list */
    steps: { type: Array, default: () => [] },
  },
  setup(props) {
    const ages = computed(() => getAgeTimings(props.steps));

    /**
     * Extends past the default only when the build needs it, rounded up to a
     * whole tick so the axis labels stay round. Reads the largest time rather
     * than the last entry, so odd data that runs backwards cannot shrink the
     * scale below a marker.
     */
    const scaleSeconds = computed(() => {
      const longest = ages.value.reduce((max, age) => Math.max(max, age.seconds), 0);
      return Math.max(SCALE_MIN_SECONDS, Math.ceil(longest / TICK_SECONDS) * TICK_SECONDS);
    });

    const clamp = (value) => Math.min(100, Math.max(0, value));

    const percent = (seconds) => `${clamp((seconds / scaleSeconds.value) * 100)}%`;

    const segments = computed(() => getAgeSegments(ages.value, scaleSeconds.value));

    const axis = computed(() => {
      const ticks = [];
      for (let seconds = 0; seconds <= scaleSeconds.value; seconds += TICK_SECONDS) {
        ticks.push(formatAgeTime(seconds));
      }
      return ticks;
    });

    const displayFor = (age) => AGE_DISPLAY.find((item) => item.age === age);
    const crestFor = (age) => displayFor(age)?.crest;
    const labelFor = (timing) => ageTimingLabel(displayFor(timing.age), timing);
    const nameFor = (age) => displayFor(age)?.name;
    const popFor = (timing) => timing.clickUpVillagers ?? timing.villagers;

    return { ages, segments, axis, percent, formatAgeTime, crestFor, labelFor, nameFor, popFor };
  },
};
</script>

<style scoped>
.build-card-section-header {
  letter-spacing: 0.05em;
  height: 36px;
}

/* Label left, time right — a two-column grid so the times line up under each
   other rather than trailing whatever the label's width happens to be */
.agett {
  display: grid;
  grid-template-columns: auto auto;
  column-gap: 18px;
  row-gap: 1px;
  align-items: baseline;
}

.agett-title,
.agett-note {
  grid-column: 1 / -1;
}

.agett b {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.agett-note {
  opacity: 0.7;
  margin-top: 2px;
}

.age-track {
  position: relative;
  height: 12px;
  border-radius: 6px;
  display: flex;
  overflow: hidden;
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.age-seg {
  height: 100%;
}

/* Bespoke ramp rather than theme tokens — these are four steps of one scale, and
   no token set spans them. Both themes are declared so neither is hardcoded. */
.age-seg-1 {
  background: #3d516b;
}
.age-seg-2 {
  background: #6d7fa6;
}
.age-seg-3 {
  background: #b99a4e;
}
.age-seg-4 {
  background: rgb(var(--v-theme-accent));
}

.v-theme--customLightTheme .age-seg-1 {
  background: #a9b2c2;
}
.v-theme--customLightTheme .age-seg-3 {
  background: #294790;
}

/* Tall enough to clear the crest plus its two lines of label */
.age-ticks {
  position: relative;
  height: 64px;
  margin-top: 8px;
}

.age-tick {
  position: absolute;
  top: 0;
  width: 96px;
  transform: translateX(-50%);
  text-align: center;
}

.age-crest {
  width: 22px;
  height: 22px;
  object-fit: contain;
  display: block;
  margin: 0 auto 4px;
}

.age-time {
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.age-time--derived {
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

/* Keeps the spoken label out of the layout without hiding it from readers */
.age-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.age-vils {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
  line-height: 1.3;
}

.age-axis {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
}
</style>
