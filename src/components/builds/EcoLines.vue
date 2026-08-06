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
    <!--Pointer tracking sits on the plot box rather than on the lines, because
        the question the crosshair answers — "what is everything at this moment?"
        — has an answer everywhere, not only where a line happens to run-->
    <div
      ref="plotEl"
      class="eco-plot"
      @pointermove="track($event)"
      @pointerleave="untrack()"
      @click="jumpToStep()"
    >
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
          :class="[
            'eco-line',
            'eco-line--' + line.resource,
            {
              'eco-line--projected': line.projected,
              'eco-line--active': active === line.resource,
              'eco-line--dim': active && active !== line.resource,
            },
          ]"
          :points="line.points"
          vector-effect="non-scaling-stroke"
        />

        <!--The lines are 2.25px wide, which is not something anybody can point
            at — least of all where several of them cross, which is exactly where
            a reader needs to grab one. So each drawn run gets an invisible
            companion carrying a stroke wide enough to aim for, and the visible
            lines take themselves out of hit testing entirely.

            Drawn after everything else, and in the same order, which means the
            singled-out resource's hit stroke is topmost as well as its line:
            once a line is held it keeps the pointer through a crossing instead
            of handing it to whichever line happens to be painted last.-->
        <polyline
          v-for="line in lines"
          :key="'hit-' + line.key"
          class="eco-hit"
          :points="line.points"
          vector-effect="non-scaling-stroke"
          @mouseenter="enter(line.resource)"
          @mouseleave="leave()"
        />
      </svg>

      <span
        v-for="cap in endCaps"
        :key="'cap-' + cap.resource"
        :class="[
          'eco-cap',
          'eco-cap--' + cap.resource,
          { 'eco-cap--dim': active && active !== cap.resource },
        ]"
        :style="{ left: cap.left, bottom: cap.bottom }"
      ></span>

      <!--The crosshair. Drawn at the snapped moment's own position, never at the
          pointer's: the straight run between two points is a drawing convention,
          so a rule resting between them would be pointing at nothing the build
          ever said. It jumps, and the jump is the honest part.-->
      <template v-if="shown">
        <span class="eco-rule" :style="{ left: percent(shown.seconds) }"></span>
        <!--Absent when the moment came from a row that assigns nobody: there is
            no reading to mark, and dots at zero would invent one-->
        <span
          v-for="dot in snapDots"
          :key="'snap-' + dot.resource"
          :class="[
            'eco-snap',
            'eco-snap--' + dot.resource,
            { 'eco-snap--dim': active && active !== dot.resource },
          ]"
          :style="{ left: dot.left, bottom: dot.bottom }"
        ></span>

        <!--Positioned inside the plot rather than floated over it.

            This was a v-tooltip, which was the right instinct and the wrong
            component: an overlay computes its anchor when it opens and does not
            recompute it when the anchor moves, so the readout stayed wherever
            the first snap put it while the rule walked away. Remounting it per
            snap would fix the position and reintroduce exactly the flicker the
            snapping exists to avoid.

            Placed on the side the rule is not, so it cannot cover the dots it
            describes — the plot is 140px tall and there is no room above or
            below them.-->
        <div
          v-if="shown.point"
          :class="['eco-readout', 'eco-readout--' + readoutSide]"
          :style="{ left: percent(shown.seconds) }"
          aria-hidden="true"
        >
          <div class="ecort-time">
            {{ shown.stated ? "" : "~" }}{{ formatAgeTime(shown.seconds) }}
          </div>
          <div
            v-for="resource in RESOURCES"
            :key="'read-' + resource.key"
            :class="['ecort-row', { 'ecort-row--dim': active && active !== resource.key }]"
          >
            <span :class="['eco-swatch', 'eco-swatch--' + resource.key]"></span>
            <!--The column header from the table below, in place of the word.
                The reader has already learned the colours from the legend, so
                the name is the least useful thing a row can carry — and it was
                the widest, on a panel floating over a 140px plot. A plain img
                like the age crests above: v-img's observer and placeholder are
                wasted on a 14px icon in something that mounts on every snap.-->
            <img :src="resource.icon" alt="" class="ecort-icon" />
            <!--Printed exactly as the author entered it. Nothing here rounds,
                averages or interpolates: the point IS the build's own statement-->
            <b class="ecort-value">{{ shown.point[resource.key] }}</b>
          </div>
        </div>
      </template>
    </div>


    <!--Set off from the plot rather than tucked under it: the entries are click
        targets, and one sitting a few pixels below the lines invites a click
        meant for the chart-->
    <div class="eco-legend d-flex align-center flex-wrap ga-4 mt-2">
      <!--Hover previews a resource, click holds it, so following a line across a
          crossing does not mean keeping the pointer parked on the legend.

          Deliberately not a <button>: the whole figure is aria-hidden, and a
          focusable control inside a hidden subtree is reachable by keyboard but
          unreadable once reached, which is worse than not offering it. Nothing
          is lost — every value this reveals is in the table below, and the plot
          only renders from md up, so there is no touch-only reader to strand.-->
      <span
        v-for="resource in RESOURCES"
        :key="resource.key"
        :class="[
          'eco-legend-item d-flex align-center ga-1',
          { 'eco-legend-item--dim': active && active !== resource.key },
        ]"
        @mouseenter="enter(resource.key)"
        @mouseleave="leave()"
        @click="togglePin(resource.key)"
      >
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
import { computed, inject, onBeforeUnmount, onMounted, ref } from "vue";
import { useEventListener } from "@vueuse/core";

//Composables
import { formatAgeTime } from "@/composables/builds/useAgeTimings.js";
import { STEP_HIGHLIGHT } from "@/composables/builds/useStepHighlight.js";

/**
 * Same order as the build order table's columns, so a reader moving between the
 * two scans them the same way. Builders draw first and therefore sit underneath
 * where lines cross, since they are the least often the point of the chart.
 *
 * Each carries both of the ways this app names a resource, because the two are
 * not interchangeable: the swatch says which *line* a row describes, the icon
 * says which *column* it will be found in below. The legend needs only the
 * first — mapping colour to name is the whole of its job — while the readout,
 * which restates table rows, needs both. The icons are the build order's own
 * column headers; builders are the repair icon there, and so here.
 */
const RESOURCES = [
  { key: "builders", label: "Builders", icon: "/assets/resources/repair.webp" },
  { key: "food", label: "Food", icon: "/assets/resources/food.webp" },
  { key: "wood", label: "Wood", icon: "/assets/resources/wood.webp" },
  { key: "gold", label: "Gold", icon: "/assets/resources/gold.webp" },
  { key: "stone", label: "Stone", icon: "/assets/resources/stone.webp" },
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

/**
 * How long a pointer has to settle on a legend entry before the chart responds.
 *
 * Long enough that crossing the legend on the way somewhere lights nothing,
 * short enough that a deliberate hover does not feel like it is buffering.
 */
const HOVER_DELAY_MS = 120;

/**
 * Where the plot's midpoint is, as a fraction of its width.
 *
 * The readout swaps sides here, so it is always on the side of the rule the
 * dots are not. Named rather than written as a bare 0.5 twice, because the two
 * uses have to agree: the side the readout is on and the point at which it
 * changes are the same decision.
 */
const READOUT_ANCHOR = 0.5;

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
     * Where the drawn line is solid, and where it is dashed.
     *
     * One rule, no exceptions: **a segment is solid only when both of its ends
     * are moments the author actually recorded.** Anything else is dashed —
     * whether the uncertainty comes from a gap between two stamps or from
     * running past the last one.
     *
     * Drawn this way rather than splitting at the final stamp because roughly
     * half of all builds are stamped sparsely, and a position-based rule drew
     * those as one confident solid line built from two measurements. The line
     * now shows how much of itself the author actually established, which is
     * also a quiet argument for stamping more.
     *
     * Runs of like segments merge into one polyline, and consecutive runs share
     * their boundary point rather than abutting it — otherwise the line would
     * break exactly where it most needs to read as continuous.
     *
     * @param {Array} points - The series points, ascending by seconds.
     * @return {Array<{from: number, to: number, projected: boolean}>} Index runs.
     */
    const runs = computed(() => {
      const points = props.series.points;
      if (points.length < 2) return [];

      const result = [];
      let start = 0;
      let projected = !(points[0].stated && points[1].stated);

      for (let i = 1; i < points.length - 1; i++) {
        const next = !(points[i].stated && points[i + 1].stated);
        if (next === projected) continue;

        result.push({ from: start, to: i, projected });
        start = i;
        projected = next;
      }

      result.push({ from: start, to: points.length - 1, projected });
      return result;
    });

    /**
     * Which resource the reader is currently singling out, if any.
     *
     * Hover wins over the pin while it lasts, so moving along the legend
     * previews each resource in turn without first having to clear the pin.
     */
    const hovered = ref(null);
    const pinned = ref(null);
    const active = computed(() => hovered.value || pinned.value);

    const togglePin = (resource) => {
      pinned.value = pinned.value === resource ? null : resource;
    };

    /**
     * Hover intent, both ways.
     *
     * The five legend entries sit next to each other, so a pointer travelling to
     * the far one crosses the three between it — and without this the chart
     * re-lit itself three times on the way past. Entering waits, so a pointer
     * merely passing through never lights anything; leaving waits too, so the
     * step between two entries does not flash back through the neutral state.
     *
     * Once something *is* lit the wait is skipped, because then the reader has
     * already shown intent and is comparing resources rather than travelling —
     * making them wait again for each one would read as lag, not as steadiness.
     */
    let timer = null;

    const enter = (resource) => {
      clearTimeout(timer);

      if (hovered.value) {
        hovered.value = resource;
        return;
      }
      timer = setTimeout(() => (hovered.value = resource), HOVER_DELAY_MS);
    };

    const leave = () => {
      clearTimeout(timer);
      timer = setTimeout(() => (hovered.value = null), HOVER_DELAY_MS);
    };

    //The plot unmounts whenever the reader collapses the card
    onBeforeUnmount(() => clearTimeout(timer));

    /** One polyline per run per resource; a fully-measured build draws five. */
    const drawn = computed(() =>
      RESOURCES.flatMap((resource) =>
        runs.value.map((run, index) => ({
          key: `${resource.key}-${index}`,
          resource: resource.key,
          points: plot(props.series.points.slice(run.from, run.to + 1), resource.key),
          projected: run.projected,
        }))
      )
    );

    /**
     * Draw order, with the singled-out resource moved last.
     *
     * SVG has no z-index: what is drawn last is on top, so following a line
     * through a crossing means reordering the elements themselves. The move is
     * a stable partition rather than a sort, so the four lines left behind keep
     * the deliberate ordering above — and with nothing active the list is the
     * untouched original, which is the state the chart spends most of its life in.
     *
     * Note that a resource is several polylines whenever the build is stamped
     * sparsely, so this lifts every run of it, not the one segment under the
     * pointer — a half-lifted line would read as a rendering fault.
     */
    const lines = computed(() => {
      if (!active.value) return drawn.value;

      return [
        ...drawn.value.filter((line) => line.resource !== active.value),
        ...drawn.value.filter((line) => line.resource === active.value),
      ];
    });

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

    /**
     * The crosshair.
     *
     * Absent where nothing provides it — the plot is also rendered from places
     * that have no build order to talk to, and a chart that throws there would
     * be a poor trade for a highlight.
     */
    const highlight = inject(STEP_HIGHLIGHT, null);

    const plotEl = ref(null);

    /**
     * The plot's box, read on mount and on resize rather than on every pointer
     * move. getBoundingClientRect forces layout, and doing that per move turns
     * a sweep across the chart into a few hundred synchronous reflows.
     */
    const box = ref(null);
    const measure = () => (box.value = plotEl.value?.getBoundingClientRect() ?? null);

    onMounted(measure);
    useEventListener(window, "resize", measure);
    //A page scroll moves the plot without resizing it, and the readout is
    //anchored in client coordinates. Only while something is actually shown,
    //so idle scrolling does not pay for a layout read per frame.
    useEventListener(window, "scroll", () => snapped.value && measure(), { passive: true });

    /**
     * The moment under the pointer, or null.
     *
     * Nearest by time with no maximum distance, so the plot's width partitions
     * into bands around the points and there is no position inside the drawn
     * range that answers with nothing. A linear scan: the series is gated to at
     * least four points and runs to a few dozen, and the cost worth avoiding
     * here was the layout read above, not the comparisons.
     */
    const snapped = ref(null);

    const nearest = (seconds) => {
      const points = props.series.points;
      let best = null;
      let bestGap = Infinity;

      for (const point of points) {
        const gap = Math.abs(point.seconds - seconds);
        //<= so that where two steps resolve to the same second the later one
        //wins: a later step describing the same moment is the author's own
        //correction, and the sort leaves it second
        if (gap <= bestGap) {
          best = point;
          bestGap = gap;
        }
      }

      return best;
    };

    const track = (event) => {
      if (!box.value?.width) measure();
      if (!box.value?.width) return;

      const points = props.series.points;
      if (points.length < 2) return;

      const ratio = (event.clientX - box.value.left) / box.value.width;
      const seconds = ratio * props.scaleSeconds;

      //Outside the drawn span there is nothing to point at. Snapping back to
      //the first or last point would put the rule somewhere the pointer is not,
      //claiming a moment the reader never asked about — and past the last point
      //the tail note already explains the emptiness.
      if (seconds < points[0].seconds || seconds > points[points.length - 1].seconds) {
        untrack();
        return;
      }

      const point = nearest(seconds);
      if (!point || point === snapped.value) return;

      snapped.value = point;
      highlight?.setFromPlot(point);
    };

    const untrack = () => {
      if (!snapped.value) return;

      snapped.value = null;
      highlight?.clear("plot");
    };

    /**
     * The moment actually drawn — which is not always the one this plot found.
     *
     * The shared highlight is authoritative whenever there is one, because the
     * reader can also point at a moment from the build order below, and a plot
     * that only ever drew its own pointer left that direction of the link
     * showing nothing at all.
     *
     * `point` may be absent: a row that assigns nobody still has a place in the
     * game, so it sets a time with no reading behind it. The rule is drawn, the
     * dots and the readout are not.
     */
    const shown = computed(() => {
      if (highlight) return highlight.moment.value;
      if (!snapped.value) return null;

      return {
        seconds: snapped.value.seconds,
        stated: snapped.value.stated,
        point: snapped.value,
      };
    });

    /** A dot on every line at the drawn moment, so all five read at once */
    const snapDots = computed(() => {
      const point = shown.value?.point;
      if (!point) return [];

      return RESOURCES.map((resource) => ({
        resource: resource.key,
        left: percent(point.seconds),
        bottom: `${clamp((point[resource.key] / yMax.value) * 100, 100)}%`,
      }));
    });

    /**
     * Which side of the rule the readout sits on.
     *
     * Always the side the rule is not, so it cannot cover the dots it is
     * describing — on a 140 px plot there is no room to put it above or below
     * them.
     */
    const readoutSide = computed(() =>
      (shown.value?.seconds ?? 0) / props.scaleSeconds < READOUT_ANCHOR ? "end" : "start"
    );

    /**
     * Take the reader to the row this moment came from.
     *
     * Any click inside the plot, not only one on a line: one surface, one
     * meaning. Pinning a resource is the legend's gesture — a click meaning two
     * different things six pixels apart is a coin toss, not an interface.
     */
    const jumpToStep = () => {
      if (!snapped.value) return;
      highlight?.requestScroll(snapped.value.stepIndex);
    };

    return {
      RESOURCES,
      gridlines,
      lines,
      endCaps,
      tailNote,
      percent,
      active,
      enter,
      leave,
      togglePin,
      formatAgeTime,
      plotEl,
      shown,
      snapDots,
      readoutSide,
      track,
      untrack,
      jumpToStep,
    };
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
  /* Hit testing belongs entirely to the .eco-hit strokes below. Left on, a
     visible line sitting above another line's hit stroke would swallow the
     pointer and answer with nothing */
  pointer-events: none;
  /* Short enough that sweeping along the legend does not lag behind the pointer,
     long enough that it does not read as the chart flickering */
  transition:
    stroke-opacity 120ms ease,
    stroke-width 120ms ease;
}

/* The singled-out line. The weight bump is small on purpose: what makes a line
   followable through a crossing is the four lines around it stepping back, not
   this — bolding alone against four equals barely registers. */
.eco-line--active {
  stroke-width: 3.25;
}

.eco-line--dim {
  stroke-opacity: 0.2;
}

/* Held higher than the solid lines: a dashed line is already half gaps, so the
   same opacity that leaves a solid line legibly present erases this one */
.eco-line--dim.eco-line--projected {
  stroke-opacity: 0.3;
}

/* A ±6px band to aim at, in screen pixels rather than plot units — the plot is
   stretched hard in x and squashed in y, so a stroke measured in user space
   would be a different target on a short build than on a long one.

   Solid even where the line it shadows is dashed: the gaps in a projected line
   are a statement about the data, not holes the pointer should fall through. */
.eco-hit {
  fill: none;
  stroke: transparent;
  stroke-width: 12;
  stroke-linejoin: round;
  stroke-linecap: round;
  pointer-events: stroke;
  cursor: pointer;
}

/* A segment with an end the author did not record. Roughly half of builds are
   stamped sparsely, so this is the common case rather than the exception — the
   dash is long and open-spaced so a mostly-dashed chart still reads as five
   lines rather than as shimmer. No opacity change: five half-faded lines
   crossing each other read as a rendering fault. */
.eco-line--projected {
  stroke-dasharray: 7 4;
}

.eco-cap {
  position: absolute;
  width: 2.6px;
  height: 2.6px;
  border-radius: 50%;
  transform: translate(-50%, 50%);
  transition: opacity 120ms ease;
  /* Sits above the SVG and lands exactly on the one spot where five hit strokes
     converge — the last place worth blocking */
  pointer-events: none;
}

.eco-cap--dim {
  opacity: 0.2;
}

.eco-swatch {
  width: 9px;
  height: 9px;
  border-radius: 2px;
}

/* The target is the padding box, not the words.

   Grown with padding rather than with a wider gap, and the horizontal half given
   straight back as negative margin: the labels sit where they always did, but
   their hit boxes meet exactly midway between them. Neither overlapping — which
   would let one entry steal a click aimed at its neighbour — nor leaving a dead
   strip, which swallows the click entirely and reads as the legend being broken
   rather than as having missed it. */
.eco-legend-item {
  cursor: pointer;
  padding: 6px 8px;
  margin: 0 -8px;
  border-radius: 4px;
  transition:
    opacity 120ms ease,
    background-color 120ms ease;
}

/* Immediate, unlike the emphasis it introduces. This says only "this is the
   thing you are about to click", which is worth nothing if it waits to find out
   whether you meant it — and showing the target is most of the fix for missing it */
.eco-legend-item:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
}

/* Heavier than the age guides it crosses, because it is the thing being read
   rather than context. Solid where those are dashed, for the same reason.

   MUST stay identical to `.age-rule` in AgeTimeline.vue — the two mark the same
   moment on two charts in the same card, and a difference between them reads as
   two things being pointed at. If this changes, change that. */
.eco-rule {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0;
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.55);
  pointer-events: none;
}

/* Larger than the end caps: those mark where a line stops, which a reader finds
   once, while these are read at a glance and then moved on from */
.eco-snap {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  transform: translate(-50%, 50%);
  /* Ringed in the surface colour so a dot landing on another line still reads
     as a dot rather than as a thickening of whatever it sits on */
  box-shadow: 0 0 0 1.5px rgb(var(--v-theme-surface));
  pointer-events: none;
  transition: opacity 120ms ease;
}

.eco-snap--dim {
  opacity: 0.2;
}

.eco-snap--builders {
  background: #8c6d4f;
}
.eco-snap--food {
  background: #c05c4a;
}
.eco-snap--wood {
  background: #6e8f55;
}
.eco-snap--gold {
  background: #d8b45c;
}
.eco-snap--stone {
  background: #8894a6;
}

.v-theme--customLightTheme .eco-snap--builders {
  background: #6b5133;
}
.v-theme--customLightTheme .eco-snap--food {
  background: #a8452f;
}
.v-theme--customLightTheme .eco-snap--wood {
  background: #4e6f3b;
}
.v-theme--customLightTheme .eco-snap--gold {
  background: #b8913a;
}
.v-theme--customLightTheme .eco-snap--stone {
  background: #6b7787;
}

/* Label left, value right, so five rows of digits line up under each other
   instead of trailing whatever each label's width happens to be — the same
   two-column shape the age tooltips above use */
/* Wears the app's tooltip skin exactly — the same surface-variant at the same
   0.9 that App.vue sets on every v-tooltip, and the primary text colour the age
   crest tooltips a few pixels above use. It has to be stated rather than
   inherited because this is a positioned element, not an overlay: Vuetify's
   own tooltip cannot follow an anchor that moves.
   Both values are load-bearing. Vuetify's computed on-surface-variant, which is
   what a tooltip would use unaided, is a washed-out grey that reads as a
   different component from every other tooltip on the page. */
.eco-readout {
  position: absolute;
  top: 50%;
  z-index: 2;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
  pointer-events: none;
  background: rgba(var(--v-theme-surface-variant), 0.9);
  color: rgb(var(--v-theme-primary));
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

/* The gap clears the rule and its dots; the rest of the offset is the readout's
   own width, which only the "start" side has to account for */
.eco-readout--end {
  transform: translate(12px, -50%);
}

.eco-readout--start {
  transform: translate(calc(-100% - 12px), -50%);
}

.ecort-time {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin-bottom: 2px;
}

/* Every row declares the same three columns rather than sharing a parent grid,
   which keeps the digits aligned without depending on subgrid. All three are
   fixed so the panel cannot change width as the reader moves between moments —
   a readout that breathes is hard to read from. The value column is sized for
   three digits, which no real build reaches but every clipped number would be
   a lie. */
.ecort-row {
  display: grid;
  grid-template-columns: 10px 20px 22px;
  align-items: center;
  column-gap: 7px;
  transition: opacity 120ms ease;
}

/* The icons set the row height, so this number is what decides whether the
   panel fits the plot: five rows plus the time line plus padding has to stay
   inside `.eco-plot`'s 140px, which puts the ceiling around 22px — the size of
   the age crests directly above, and the nearest thing to a matching pair.
   Held one step below that so a rounding difference cannot make the readout
   taller than the chart it sits in. The build order's own 28px column headers
   are simply out of reach here. */
.ecort-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  display: block;
}

/* Same fade the lines take, so the readout and the plot agree about which
   resource is being singled out */
.ecort-row--dim {
  opacity: 0.45;
}

.ecort-value {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Held well above the lines' 0.2: this text is already drawn at medium emphasis,
   and faded that far it stops being a label you can aim at — which is the one
   thing the legend has to keep being while a resource is singled out */
.eco-legend-item--dim {
  opacity: 0.45;
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
