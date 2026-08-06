//External
import { computed, ref, shallowRef } from "vue";

/**
 * Injection key for the highlight a build page shares between its two halves.
 *
 * A Symbol rather than a string so an injection cannot silently collide with
 * anything else the app provides.
 */
export const STEP_HIGHLIGHT = Symbol("stepHighlight");

/**
 * The one channel between the timeline card and the build order below it.
 *
 * The two are siblings on the build page and neither imports the other. Passing
 * this down as a prop would mean threading it through BuildOrderEditor and
 * BuildOrderSectionEditor — components with no interest in it — and a matching
 * chain of emits back, so it travels by provide/inject instead.
 *
 * **A factory, deliberately.** Module-level refs here would be simpler and
 * wrong: preview cards and focus mode can put a second build on screen, and
 * both builds would then share one highlight. Called once per page, that cannot
 * happen.
 *
 * ## What a highlight is
 *
 * A moment in the game, which is a **time** — everything else is optional. That
 * is not a technicality: roughly half of a build's steps say nothing about
 * villagers (a comment, an age-up, a lone timestamp) so the economy series has
 * no point for them, while the time resolver places them fine. Keyed on points,
 * hovering those rows would do nothing and read as broken. Keyed on time, they
 * still light up their moment on the age track, which is a real answer to
 * "where in the game is this?".
 *
 * So a moment carries `point` and `stepIndex` when it has them, and consumers
 * branch on `point` rather than assuming counts exist.
 *
 * ## What this deliberately is not
 *
 * Not a step-selection bus, and not a home for focus mode's current step —
 * that is a playback position, this is a hover, and merging them would make
 * reading the chart move the player. Not a home for the plot's resource
 * emphasis either: nothing outside the plot reads it.
 *
 * It also holds no policy. The hover delay, the viewport gate and the scroll
 * latch all live in the components that own those events; this is a channel.
 *
 * @return {Object} The highlight: `moment`, `stepIndex`, `source` to read;
 *   `setFromPlot`, `setFromTable`, `clear` to write; `requestScroll` and
 *   `onScrollRequest` for navigation.
 */
export function useStepHighlight() {
  //shallowRef: the point inside is a frozen-in-practice series entry, and deep
  //reactivity over five counts per point buys nothing
  const current = shallowRef(null);
  const holder = ref(null);

  const moment = computed(() => current.value);
  const stepIndex = computed(() => current.value?.stepIndex ?? null);
  const source = computed(() => holder.value);

  /**
   * Highlights a moment the reader pointed at on the economy plot.
   *
   * Everything is derived from the point rather than passed alongside it, so
   * the plot cannot set a moment that disagrees with itself.
   *
   * @param {Object} point - One useEcoSeries() point.
   * @return {void}
   */
  const setFromPlot = (point) => {
    if (!point) return;

    current.value = {
      seconds: point.seconds,
      stated: point.stated,
      stepIndex: point.stepIndex ?? null,
      point,
    };
    holder.value = "plot";
  };

  /**
   * Highlights the moment a build order row sits at.
   *
   * Produces a time-only moment: the row may well have no economy point, and
   * the rule on the age track is the answer either way.
   *
   * Callers own the gates — the viewport check and the scroll latch — because
   * they own the events those gates watch.
   *
   * @param {number} seconds - The step's resolved time.
   * @param {boolean} stated - Whether the author wrote that time.
   * @param {number} stepIndex - Position in the FLATTENED step list, never a
   *   section-local index.
   * @return {void}
   */
  const setFromTable = (seconds, stated, stepIndex) => {
    if (seconds == null) return;

    current.value = { seconds, stated, stepIndex, point: null };
    holder.value = "table";
  };

  /**
   * Releases the highlight, if the caller is the one holding it.
   *
   * The guard is the point: a mouseleave from the table arriving after the plot
   * has taken over must not wipe what the plot is showing.
   *
   * @param {string} from - "plot" or "table".
   * @return {void}
   */
  const clear = (from) => {
    if (holder.value !== from) return;

    current.value = null;
    holder.value = null;
  };

  /**
   * Asks the build order to scroll a step into view.
   *
   * An event rather than state. Folded into `moment` it would fire again on
   * every unrelated re-render, scrolling the page out from under the reader.
   * One handler, because there is one build order.
   */
  let scrollHandler = null;

  const requestScroll = (index) => {
    if (index == null) return;
    scrollHandler?.(index);
  };

  const onScrollRequest = (handler) => {
    scrollHandler = handler;
  };

  return {
    moment,
    stepIndex,
    source,
    setFromPlot,
    setFromTable,
    clear,
    requestScroll,
    onScrollRequest,
  };
}
