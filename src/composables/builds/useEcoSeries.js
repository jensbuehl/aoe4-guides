//External
import { computed, unref } from "vue";

//Composables
import { flattenSections } from "@/composables/builds/useAgeTimings.js";
import { getTimings, toDateFromString } from "@/composables/builds/timingsHelper.js";
import { parseVillagerCountString } from "@/composables/builds/villagerAggregator.js";

/**
 * The columns the plot draws, in the order the build order table lists them.
 *
 * Builders are here despite being transient — they are villagers pulled off
 * gathering, so a build that keeps four of them on construction has a different
 * economy from one that keeps none, and leaving them out made that invisible.
 * Read the dips as villagers returning to resources rather than as eco lost.
 */
const RESOURCES = ["builders", "food", "wood", "gold", "stone"];

/**
 * Half the steps must say something about resources before the build has an
 * economy worth charting. Below this the author wrote the build in prose, and
 * four points spread over sixteen minutes reads as a bug rather than as a shape.
 */
const MIN_COVERAGE = 0.5;

/**
 * And enough of those must actually land on the chart. The ratio alone passes a
 * six-step build with three filled cells, which draws a three-point line — the
 * same "looks broken" outcome the ratio exists to prevent, arrived at from the
 * other direction.
 */
const MIN_STATED_POINTS = 4;

/**
 * Places one step on the time axis.
 *
 * A stated timestamp always wins, which is the same rule the age markers follow,
 * so the two charts on this card cannot disagree about when a step happened.
 * Interpolation only fills in for steps that state nothing themselves.
 *
 * @param {Object} step - The step to place.
 * @param {Array|null} timings - getTimings() output, or null when it gave up.
 * @param {number} index - Position in the flattened step list.
 * @return {number|null} Seconds, or null when the step cannot be placed at all.
 */
function resolveSeconds(step, timings, index) {
  const stated = toDateFromString(step?.time);
  if (stated) return stated.getMinutes() * 60 + stated.getSeconds();

  const interpolated = timings?.[index]?.startTime;
  return interpolated == null ? null : interpolated;
}

/**
 * Derives villagers per resource over time, for the economy plot.
 *
 * A step that assigns anybody states the whole distribution: its blank cells
 * mean nobody is on that resource, not that the previous number still stands.
 * This is what aggregateVillagers() already does for the "N vils" markers — it
 * sums the five cells and reads a blank as zero — so carrying values forward
 * here would put the plot and those markers in open disagreement about the same
 * step.
 *
 * A step that assigns nobody at all is a different thing: an age-up, a comment,
 * a lone timestamp. It says nothing about the economy, so it contributes no
 * point rather than dragging every line to zero.
 *
 * getTimings() is a bonus rather than a precondition. It discards a whole build
 * when any single step is unresolvable — including every build whose author
 * stops stamping before the end, which is common — and refusing those a chart
 * would hide this feature on the builds it was written for. Each step is placed
 * on its own instead. Its all-or-nothing contract is left alone, because Focus
 * mode's autoplay depends on it and playback really is all-or-nothing.
 *
 * @param {Array} steps - A build's steps: the sections array.
 * @return {{points: Array, coverage: number, lastStatedSeconds: number|null}|null}
 *   Points carry one count per column in RESOURCES.
 *   Null whenever there is no chart worth drawing — never a sparse one.
 */
export function getEcoSeries(steps) {
  try {
    if (!Array.isArray(steps) || !steps.length) return null;

    //Legacy flat builds have no sections, so no age markers and no card to hang
    //this off; getAgeTimings() bails on them for the same reason.
    if (!steps[0]?.type) return null;

    const flat = flattenSections(steps);
    if (!flat.length) return null;

    let timings = null;
    try {
      timings = getTimings(flat);
    } catch (err) {
      timings = null;
    }

    const points = [];
    let statedSteps = 0;

    flat.forEach((step, index) => {
      const values = { builders: 0, food: 0, wood: 0, gold: 0, stone: 0 };
      let stated = false;

      for (const resource of RESOURCES) {
        const raw = step?.[resource];
        if (raw == null || String(raw).trim() === "") continue;

        values[resource] = parseVillagerCountString(String(raw));
        stated = true;
      }

      //Says nothing about villagers, so it is not a moment in the economy
      if (!stated) return;
      statedSteps++;

      //An unplaceable step still counts toward coverage — the author did fill it
      //in, they just gave it no time to hang it on
      const seconds = resolveSeconds(step, timings, index);
      if (seconds == null) return;

      points.push({ seconds, ...values });
    });

    const coverage = statedSteps / flat.length;
    if (coverage < MIN_COVERAGE) return null;

    //Every point is a stated one now, so this is simply "is there a shape here"
    if (points.length < MIN_STATED_POINTS) return null;

    //Sorted by time rather than by step order, so a build with timestamps typed
    //out of sequence draws left to right instead of doubling back on itself.
    points.sort((a, b) => a.seconds - b.seconds);

    return {
      points,
      coverage,
      //The last moment the build says anything about its economy. Read after
      //sorting, because the latest in time is not always the last one typed.
      lastStatedSeconds: points[points.length - 1].seconds,
    };
  } catch (err) {
    console.error("useEcoSeries.getEcoSeries failed:", err.message);
    return null;
  }
}

/**
 * Memoized economy series for a build's steps.
 *
 * @param {Array|Ref} steps - The steps, or a ref to them.
 * @return {ComputedRef<Object|null>} The series, or null when there is none.
 */
export function useEcoSeries(steps) {
  return computed(() => getEcoSeries(unref(steps)));
}
