<template>
  <!--
    Villagers per resource over time. Hidden from assistive technology on
    purpose: every number drawn here is already in the build order table below,
    in a form that reads aloud, so the graphic is a visual restatement rather
    than new information.

    Gridlines, guides and end caps are positioned HTML rather than SVG, matching
    how the age track above places its crests, and leaving the SVG holding only
    the four polylines — which is what lets it stretch to any width without
    distorting text or dots.
  -->
  <div class="eco" aria-hidden="true">
    <div class="eco-plot">
      <span
        v-for="line in gridlines"
        :key="'grid-' + line.value"
        class="eco-grid"
        :style="{ bottom: line.offset }"
      ></span>
      <span
        v-for="line in gridlines"
        :key="'label-' + line.value"
        class="eco-grid-label"
        :style="{ bottom: line.offset }"
        >{{ line.value }}</span
      >

      <!--Same seconds the crests above are placed from, never a time derived
          here, so the two charts cannot drift apart by even a pixel-->
      <span
        v-for="age in ages"
        :key="'guide-' + age.age"
        class="eco-guide"
        :style="{ left: percent(age.seconds) }"
      ></span>

      <svg class="eco-svg" viewBox="0 0 1000 100" preserveAspectRatio="none">
        <!--Straight segments between stated points. No smoothing: a build order
            is a list of snapshots, and a spline would draw values the author
            never wrote — and would erase a two-step excursion onto stone-->
        <polyline
          v-for="line in lines"
          :key="line.key"
          :class="['eco-line', 'eco-line--' + line.resource]"
          :points="line.points"
          vector-effect="non-scaling-stroke"
        />
      </svg>

      <span
        v-for="cap in endCaps"
        :key="'cap-' + cap.resource"
        :class="['eco-cap', 'eco-cap--' + cap.resource]"
        :style="{ left: cap.left, bottom: cap.bottom }"
      ></span>
    </div>

    <div class="eco-legend d-flex align-center flex-wrap ga-3 mt-1">
      <span v-for="resource in RESOURCES" :key="resource.key" class="d-flex align-center ga-1">
        <span :class="['eco-swatch', 'eco-swatch--' + resource.key]"></span>
        <span class="text-caption text-medium-emphasis">{{ resource.label }}</span>
      </span>
      <!--Without this a carried-forward tail reads as "the economy stopped
          changing" rather than "the author stopped writing"-->
      <span v-if="tailNote" class="text-caption text-medium-emphasis ml-auto">{{ tailNote }}</span>
    </div>
  </div>
</template>

<script>
//External
import { computed } from "vue";

//Composables
import { formatAgeTime } from "@/composables/builds/useAgeTimings.js";

/**
 * Same order as the build order table's columns, so a reader moving between the
 * two scans them the same way. Builders draw first and therefore sit underneath
 * where lines cross, since they are the least often the point of the chart.
 */
const RESOURCES = [
  { key: "builders", label: "Builders" },
  { key: "food", label: "Food" },
  { key: "wood", label: "Wood" },
  { key: "gold", label: "Gold" },
  { key: "stone", label: "Stone" },
];

/**
 * The y-axis starts at 16 villagers and grows in whole steps rather than fitting
 * each build, so two builds compared in two tabs are read against the same
 * scale. A plot that always fills its box makes every economy look identical.
 *
 * The floor is sized to what one resource actually reaches — a peak much past
 * 16 on a single line is rare. An earlier draft used 24, which was sized for the
 * total-villager line the design later dropped, and left most builds drawing in
 * the bottom third of an empty box.
 *
 * The step widens once fours would draw more than MAX_GRIDLINES rows: a late-game
 * build peaking near 48 was ruling twelve lines behind five polylines, and the
 * grid started reading as the chart. Widening the step rather than dropping every
 * other label keeps the top gridline on a round number and on the axis top.
 */
const Y_FLOOR = 16;
const Y_STEPS = [4, 8, 16];
const MAX_GRIDLINES = 6;

export default {
  name: "EcoLines",
  props: {
    /** useEcoSeries() output. Never null — the parent does not render us then */
    series: { type: Object, required: true },
    /** Full width of the track in seconds, owned by AgeTimeline */
    scaleSeconds: { type: Number, required: true },
    /** getAgeTimings() output, so guides land under the crests */
    ages: { type: Array, default: () => [] },
  },
  setup(props) {
    const clamp = (value, max) => Math.min(max, Math.max(0, value));

    const highest = computed(() =>
      props.series.points.reduce(
        (max, point) => RESOURCES.reduce((rowMax, r) => Math.max(rowMax, point[r.key]), max),
        0
      )
    );

    /** The narrowest step that keeps the grid inside its row budget */
    const yStep = computed(() => {
      const ceiling = Math.max(Y_FLOOR, highest.value);
      return (
        Y_STEPS.find((step) => Math.ceil(ceiling / step) <= MAX_GRIDLINES) ||
        Y_STEPS[Y_STEPS.length - 1]
      );
    });

    //Rounded to the step in use, so the axis top is always a labelled gridline
    const yMax = computed(() =>
      Math.max(Y_FLOOR, Math.ceil(highest.value / yStep.value) * yStep.value)
    );

    const gridlines = computed(() => {
      const lines = [];
      for (let value = yStep.value; value <= yMax.value; value += yStep.value) {
        lines.push({ value, offset: `${(value / yMax.value) * 100}%` });
      }
      return lines;
    });

    const percent = (seconds) => `${clamp((seconds / props.scaleSeconds) * 100, 100)}%`;

    const toX = (seconds) => clamp((seconds / props.scaleSeconds) * 1000, 1000);
    //SVG y runs downward; villagers run upward
    const toY = (value) => 100 - clamp((value / yMax.value) * 100, 100);

    const plot = (points, resource) =>
      points.map((point) => `${toX(point.seconds)},${toY(point[resource])}`).join(" ");

    /**
     * One polyline per resource. Every point is a moment the build actually
     * described, so there is nothing carried and nothing to draw faded — the
     * line simply stops where the author stopped assigning villagers.
     */
    const lines = computed(() =>
      RESOURCES.map((resource) => ({
        key: resource.key,
        resource: resource.key,
        points: plot(props.series.points, resource.key),
      }))
    );

    /** A dot at each resource's final value, so the last reading is unambiguous */
    const endCaps = computed(() => {
      const last = props.series.points[props.series.points.length - 1];
      if (!last) return [];

      return RESOURCES.map((resource) => ({
        resource: resource.key,
        left: percent(last.seconds),
        bottom: `${clamp((last[resource.key] / yMax.value) * 100, 100)}%`,
      }));
    });

    /**
     * Only worth saying when the build carries on past the point it stops
     * describing its economy — otherwise the line ending is just the build
     * ending, and needs no explanation.
     */
    const tailNote = computed(() => {
      const { lastStatedSeconds } = props.series;
      if (lastStatedSeconds == null) return "";

      const continuesAfter = props.ages.some((age) => age.seconds > lastStatedSeconds);
      return continuesAfter ? `No villagers assigned after ${formatAgeTime(lastStatedSeconds)}` : "";
    });

    return { RESOURCES, gridlines, lines, endCaps, tailNote, percent };
  },
};
</script>

<style scoped>
.eco-plot {
  position: relative;
  height: 140px;
  margin-top: 4px;
}

.eco-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.eco-grid {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(var(--v-theme-on-surface), 0.13);
}

.eco-grid-label {
  position: absolute;
  left: 0;
  transform: translateY(50%);
  padding-right: 4px;
  font-size: 9px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
  background: rgb(var(--v-theme-surface));
}

.eco-guide {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0;
  border-left: 1px dashed rgba(var(--v-theme-on-surface), 0.22);
}

.eco-line {
  fill: none;
  stroke-width: 2.25;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.eco-cap {
  position: absolute;
  width: 2.6px;
  height: 2.6px;
  border-radius: 50%;
  transform: translate(-50%, 50%);
}

.eco-swatch {
  width: 9px;
  height: 9px;
  border-radius: 2px;
}

/* Bespoke, like the .age-seg-* ramp above: these are the resource icon hues
   pulled toward that ramp's weight, and no theme token spans them. Both themes
   are declared so neither is hardcoded — full-saturation game colours overpower
   the light surface. */
.eco-line--builders {
  stroke: #8c6d4f;
}
.eco-line--food {
  stroke: #c05c4a;
}
.eco-line--wood {
  stroke: #6e8f55;
}
.eco-line--gold {
  stroke: #d8b45c;
}
.eco-line--stone {
  stroke: #8894a6;
}

.eco-cap--builders,
.eco-swatch--builders {
  background: #8c6d4f;
}
.eco-cap--food,
.eco-swatch--food {
  background: #c05c4a;
}
.eco-cap--wood,
.eco-swatch--wood {
  background: #6e8f55;
}
.eco-cap--gold,
.eco-swatch--gold {
  background: #d8b45c;
}
.eco-cap--stone,
.eco-swatch--stone {
  background: #8894a6;
}

.v-theme--customLightTheme .eco-line--builders {
  stroke: #6b5133;
}
.v-theme--customLightTheme .eco-line--food {
  stroke: #a8452f;
}
.v-theme--customLightTheme .eco-line--wood {
  stroke: #4e6f3b;
}
.v-theme--customLightTheme .eco-line--gold {
  stroke: #b8913a;
}
.v-theme--customLightTheme .eco-line--stone {
  stroke: #6b7787;
}

.v-theme--customLightTheme .eco-cap--builders,
.v-theme--customLightTheme .eco-swatch--builders {
  background: #6b5133;
}
.v-theme--customLightTheme .eco-cap--food,
.v-theme--customLightTheme .eco-swatch--food {
  background: #a8452f;
}
.v-theme--customLightTheme .eco-cap--wood,
.v-theme--customLightTheme .eco-swatch--wood {
  background: #4e6f3b;
}
.v-theme--customLightTheme .eco-cap--gold,
.v-theme--customLightTheme .eco-swatch--gold {
  background: #b8913a;
}
.v-theme--customLightTheme .eco-cap--stone,
.v-theme--customLightTheme .eco-swatch--stone {
  background: #6b7787;
}
</style>
