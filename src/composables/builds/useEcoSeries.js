//External
import { computed, unref } from "vue";

//Composables
import { flattenSections } from "@/composables/builds/useAgeTimings.js";
import { resolveStepTimes } from "@/composables/builds/timingsHelper.js";
import { redundantMask } from "@/composables/builds/stepVisibility.js";
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
 * How far a build's clock has to jump backwards before it is a second path
 * rather than a typo.
 *
 * Two minutes. A restart into a variation goes back whole minutes — one real
 * build returns from 6:15 to 4:00 — while a mistyped digit costs seconds, and a
 * span the resolver derived can never go backwards at all.
 */
const REWIND_SECONDS = 120;

/**
 * Whether the build's own order runs backwards far enough to be two builds.
 *
 * @param {Array} points - Points in step order, before sorting.
 * @return {boolean} True when the chart would draw two paths as one.
 */
function rewinds(points) {
  return points.some(
    (point, index) => index > 0 && points[index - 1].seconds - point.seconds >= REWIND_SECONDS
  );
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
 * Times come from resolveStepTimes(), which the age markers on the same card
 * also read, so the two cannot place a step at two different seconds. A step it
 * cannot place contributes no point — the line simply stops — but that is now
 * rare: a build whose author stopped stamping partway is extrapolated past the
 * last measurement rather than abandoned there.
 *
 * @param {Array} steps - A build's steps: the sections array.
 * @param {Object} [selection] - Which alternative each block is read down, so the
 *   chart plots the economy of the path the reader chose.
 * @return {{points: Array, coverage: number, lastStatedSeconds: number|null}|null}
 *   Points carry one count per column in RESOURCES, plus `stated` — whether the
 *   author recorded that moment or the site worked it out — and `stepIndex`,
 *   the step's position in the flattened list.
 *   Null whenever there is no chart worth drawing — never a sparse one.
 */
export function getEcoSeries(steps, selection) {
  try {
    if (!Array.isArray(steps) || !steps.length) return null;

    //Legacy flat builds have no sections, so no age markers and no card to hang
    //this off; getAgeTimings() bails on them for the same reason.
    if (!steps[0]?.type) return null;

    const flat = flattenSections(steps, selection);
    if (!flat.length) return null;

    //One read, shared with the age markers on the same card, so the two cannot
    //place the same step at two different seconds
    const times = resolveStepTimes(flat);

    //A step that restates the one before it and says nothing else is not a
    //moment in the economy. It draws a vertex on a flat run and, worse, pads the
    //coverage gate — a build with three real distributions and ten copies of
    //them would clear a floor written to reject exactly that shape. Dropped from
    //the points and from the counts alike, so the gate judges what the author
    //actually described.
    const redundant = redundantMask(flat);

    const points = [];
    let statedSteps = 0;
    let describedSteps = 0;

    flat.forEach((step, index) => {
      if (redundant[index]) return;
      describedSteps++;

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

      //Filled in, but with nothing in it. A cell can hold a "0", a dash, or
      //markup the editor left behind — all of which read as nobody, which is why
      //aggregateVillagers returns null here and the "N vils" marker beside the
      //row shows nothing. Plotting it anyway would drop all five lines to zero
      //and back, drawing a collapse the build never had. If the marker says
      //nothing, the plot says nothing.
      if (!RESOURCES.some((resource) => values[resource] > 0)) return;

      statedSteps++;

      //An unplaceable step still counts toward coverage — the author did fill it
      //in, they just gave it no time to hang it on
      const time = times[index];
      if (!time || time.seconds == null) return;

      //Carried per point rather than as one split position: the plot draws a
      //segment solid only when both its ends were measured, so it needs to know
      //about every moment, not just where the last stamp was.
      //
      //stepIndex is the flattened position, which is what lets the plot say
      //which row a moment came from. Note the sort below: it reorders the
      //points while the indices stay attached to their rows, so on a build with
      //timestamps typed out of order stepIndex is NOT monotonic. Array position
      //is never a step index.
      points.push({
        seconds: time.seconds,
        stated: time.provenance === "stated",
        stepIndex: index,
        ...values,
      });
    });

    const coverage = describedSteps ? statedSteps / describedSteps : 0;
    if (coverage < MIN_COVERAGE) return null;

    //Every point is a stated one now, so this is simply "is there a shape here"
    if (points.length < MIN_STATED_POINTS) return null;

    //A build that rewinds is not one economy. Authors describe variations by
    //writing them out one after another in the same list — play to 6:15, then
    //start again at 4:00 down a different path — and sorting the result by time
    //interleaves two games into a single line that reads as one. That is worse
    //than no chart: it looks like data.
    //
    //Checked before the sort, because the sort is what hides it. Only a rewind
    //large enough to be a restart counts; a mistyped digit is worth a few
    //seconds and should not cost an honest build its chart.
    if (rewinds(points)) return null;

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
export function useEcoSeries(steps, selection) {
  return computed(() => getEcoSeries(unref(steps), unref(selection)));
}
