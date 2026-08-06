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
      <!--Scale fits the build in four-minute brackets above an 8:00 floor, and
          reaches only as far as something is drawn: the later of the last age
          and the last step that assigns anybody. Trailing steps that assign
          nobody used to stretch the axis past anything it had to show.-->
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
              {{ footnoteFor(age) }}
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

      <!--Collapsed by default: this card sits above the build order, so the
          reader who only wants age times pays one row of chrome and nothing
          more. Absent entirely when the build's cells cannot support a chart-->
      <template v-if="eco">
        <v-btn
          variant="text"
          block
          height="38"
          class="eco-row px-0 mt-2"
          :aria-expanded="ecoOpen ? 'true' : 'false'"
          @click="toggleEco"
        >
          <!--Own flex row rather than relying on the button's content box to
              fill the width, which is what a bare v-spacer here would need-->
          <span class="d-flex align-center w-100 ga-2">
            <v-icon size="small">mdi-chart-line</v-icon>
            <span class="text-caption font-weight-medium">Economy</span>
            <!--Fixed, not swapped on open: the row reads as a heading, and a
                heading that rewrites itself when clicked is just movement-->
            <span class="text-caption text-medium-emphasis text-lowercase">
              villagers per resource
            </span>
            <v-spacer />
            <v-icon size="small" :class="['eco-chevron', { 'eco-chevron--open': ecoOpen }]">
              mdi-chevron-down
            </v-icon>
          </span>
        </v-btn>

        <!--No "appear", so a reader whose stored preference is open sees it
            already open rather than watching it unfold on every page load-->
        <v-expand-transition>
          <EcoLines
            v-if="ecoOpen"
            :series="eco"
            :scale-seconds="scaleSeconds"
            :ages="ages"
          />
        </v-expand-transition>
      </template>
    </div>
  </v-card>
</template>

<script>
//External
import { computed, ref } from "vue";

//Components
import AgeChips from "@/components/builds/AgeChips.vue";
import EcoLines from "@/components/builds/EcoLines.vue";

//Composables
import {
  getAgeTimings,
  AGE_DISPLAY,
  formatAgeTime,
  ageTimingLabel,
  getAgeSegments,
  flattenSections,
} from "@/composables/builds/useAgeTimings.js";
import { resolveStepTimes } from "@/composables/builds/timingsHelper.js";
import { aggregateVillagers } from "@/composables/builds/villagerAggregator.js";
import { getEcoSeries } from "@/composables/builds/useEcoSeries.js";

/**
 * The narrowest the track is ever drawn: eight minutes, two ticks.
 *
 * This was sixteen, chosen so that two builds compared in two tabs shared a
 * scale. The comparison is real but it was being paid for by every short build
 * on the site — a Feudal all-in ending at 5:00 spent two thirds of the track on
 * empty space and drew its whole economy squeezed into the left third.
 *
 * The floor now only stops the track collapsing to something with no room to
 * read. Above it the scale fits the build in four-minute brackets, so most land
 * on 8:00, 12:00 or 16:00 and like-for-like comparison largely survives — and
 * where it does not, the axis is labelled.
 */
const SCALE_MIN_SECONDS = 480;

/** Axis ticks every four minutes, so an extended scale keeps round labels */
const TICK_SECONDS = 240;

/**
 * Whether the economy plot is open is a preference of the reader's, not of the
 * build's — someone who wants to see eco shape wants it on every build. Kept
 * device-local next to the theme choice rather than on the account: it is view
 * state, and reading it back would cost a document read on every build page.
 */
const ECO_OPEN_STORAGE_KEY = "aoe4-guides-eco-open";

/**
 * Storage can be unavailable — private windows, disabled cookies, a full quota.
 * None of that is worth breaking a card over, so the preference degrades to
 * "collapsed, does not persist" instead of throwing during render.
 */
function readEcoOpen() {
  try {
    return localStorage.getItem(ECO_OPEN_STORAGE_KEY) === "true";
  } catch (err) {
    return false;
  }
}

function writeEcoOpen(open) {
  try {
    localStorage.setItem(ECO_OPEN_STORAGE_KEY, open ? "true" : "false");
  } catch (err) {
    //Preference is lost, the plot still works
  }
}

export default {
  name: "AgeTimeline",
  components: { AgeChips, EcoLines },
  props: {
    /** A build's steps — sections array or legacy flat list */
    steps: { type: Array, default: () => [] },
  },
  setup(props) {
    const ages = computed(() => getAgeTimings(props.steps));

    /**
     * The last moment the track has to reach: something drawn on it, not merely
     * something in the build.
     *
     * Two things are drawn — the age crests and the economy lines — so the track
     * has to cover the later of them. Everything else is padding. A build often
     * trails off in steps that assign nobody: a closing comment, a reminder, a
     * step left behind by an edit. Measuring to those stretched the axis past
     * anything it had to show and drew the whole build squeezed into the left of
     * an empty box.
     *
     * "Assigns somebody" is asked through aggregateVillagers, which reads a
     * blank, a typed "0" and a stray dash all as nobody — the same reading that
     * decides whether the economy series plots a step at all, so the lines can
     * never run past the end of the track or stop short of it.
     *
     * The largest value rather than the last one, so timestamps typed out of
     * order cannot shrink the track below something drawn on it.
     */
    const lastMoment = computed(() => {
      const flat = flattenSections(props.steps);
      const times = resolveStepTimes(flat);

      const lastAssigned = flat.reduce(
        (max, step, index) =>
          aggregateVillagers(step) ? Math.max(max, times[index]?.seconds ?? 0) : max,
        0
      );
      const lastAge = ages.value.reduce((max, age) => Math.max(max, age.seconds), 0);

      return Math.max(lastAssigned, lastAge);
    });

    /**
     * Rounded up to a whole tick so the axis labels stay round.
     *
     * Fitted in four-minute brackets rather than pinned to one width. A fixed
     * 16:00 made every build directly comparable, which is worth something —
     * but it spent two thirds of the track on emptiness for a build that ends
     * at 5:00, squashing the part anyone came to read. Most builds land on
     * 8:00, 12:00 or 16:00, so like-for-like comparison mostly survives, and
     * the axis is labelled for when it does not.
     */
    const scaleSeconds = computed(() =>
      Math.max(SCALE_MIN_SECONDS, Math.ceil(lastMoment.value / TICK_SECONDS) * TICK_SECONDS)
    );

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

    const eco = computed(() => getEcoSeries(props.steps));

    const ecoOpen = ref(readEcoOpen());

    const toggleEco = () => {
      ecoOpen.value = !ecoOpen.value;
      writeEcoOpen(ecoOpen.value);
    };

    const displayFor = (age) => AGE_DISPLAY.find((item) => item.age === age);
    const crestFor = (age) => displayFor(age)?.crest;
    const labelFor = (timing) => ageTimingLabel(displayFor(timing.age), timing);
    const nameFor = (age) => displayFor(age)?.name;
    const popFor = (timing) => timing.clickUpVillagers ?? timing.villagers;

    /**
     * Explains the "~" beside a derived time, and which kind of derivation it was.
     *
     * The marker itself is the same for both tiers on purpose — "~" already means
     * "not stated by the author" everywhere on the site, and a reader's decision
     * is identical either way: do not quote this as fact. What differs is how far
     * the estimate reaches, and that is a sentence rather than a symbol, so it
     * lives here.
     *
     * When a row mixes the two — a projected arrival after an interpolated click
     * up, or the reverse — the weaker claim wins, so the note never credits the
     * build with more evidence than it has.
     *
     * @param {Object} age - One getAgeTimings() entry.
     * @return {string} The footnote text.
     */
    const footnoteFor = (age) => {
      const tiers = [age.provenance, age.clickUp?.provenance];

      //Weakest claim wins, so the note never credits the build with more
      //evidence than it has
      if (tiers.includes("extrapolated")) return "~ projected past the last stated time";
      if (tiers.includes("interpolated")) return "~ estimated from villager count";

      return "~ approximate, as the author wrote it";
    };

    return {
      ages,
      segments,
      axis,
      scaleSeconds,
      percent,
      formatAgeTime,
      crestFor,
      labelFor,
      nameFor,
      popFor,
      footnoteFor,
      eco,
      ecoOpen,
      toggleEco,
    };
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
  background: #e7c05e;
}

.v-theme--customLightTheme .age-seg-1 {
  background: #a9b2c2;
}
.v-theme--customLightTheme .age-seg-3 {
  background: #294790;
}
/* Imperial read the accent token until that token went navy for contrast, at
   which point it collided with Castle above and the last two ages of a build
   became one band. Stated literally like the three segments beside it: this is
   a decorative fill nothing is read against, so it keeps the brand gold the
   ladder was designed around. */
.v-theme--customLightTheme .age-seg-4 {
  background: #ccaa55;
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

/* Reads as part of the card rather than as a button dropped into it — the rule
   above it is the same divider the card already uses elsewhere */
.eco-row {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 0;
  letter-spacing: normal;
  text-transform: none;
}

/* Rotated rather than swapped, so the chevron turns with the disclosure the way
   the app's other expanders behave */
.eco-chevron {
  transition: transform 0.2s ease;
}

.eco-chevron--open {
  transform: rotate(180deg);
}
</style>
