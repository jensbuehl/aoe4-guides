//Composables
import { toDateFromString } from "@/composables/builds/timingsHelper.js";
import { parseVillagerCountString } from "@/composables/builds/villagerAggregator.js";

/**
 * The five cells that describe where villagers are, in the build order's own
 * column order.
 */
const RESOURCES = ["builders", "food", "wood", "gold", "stone"];

/**
 * Whether a step adds nothing to the account of the build.
 *
 * Authors pad build orders with rows that restate the previous distribution and
 * say nothing else — a row carried along so a later one lines up, or left behind
 * when an edit removed its text. On screen they read as steps that happened,
 * which is worse than not being there: a reader counts them, and the plot draws
 * a vertex for each one on a flat run.
 *
 * A step is kept when it does *any* of:
 *
 * - carry a timestamp its author typed. They recorded that moment deliberately,
 *   perhaps to mark something completing, and it is not this function's place to
 *   decide they were wrong. A derived time is different — nobody chose it.
 * - say something, in words or in icons. On a site whose build orders are mostly
 *   pictures, a lone `<img>` is content and an empty `<br>` is not.
 * - move a villager. Any of the five cells differing from the step before.
 *
 * The first step of a build is always kept: it has no predecessor to be
 * redundant against, and it establishes the distribution everything else is a
 * change from.
 *
 * @param {Object} step - The step to judge.
 * @param {Object|null} previous - The step before it, crossing section
 *   boundaries; null for the first step of the build.
 * @return {boolean} True when the step can be hidden without losing anything.
 */
export function saysNothing(step, previous) {
  if (!step || !previous) return false;

  //A note is content by definition — it is nothing but content
  if (step.gameplan) return false;

  //Only a time the author typed counts. An estimate is the site talking.
  if (toDateFromString(step.time)) return false;

  if (hasContent(step.description)) return false;

  return RESOURCES.every((resource) => cell(step[resource]) === cell(previous[resource]));
}

/**
 * Whether a description says anything once the editor's leavings are stripped.
 *
 * The rich-text editor allows `img` and `br`, so an "empty" description is
 * routinely `<br>`, `<br><br>` or a stray `&nbsp;` — invisible on screen and
 * indistinguishable from blank to a reader. An `img` is the opposite: on this
 * site the icons usually *are* the instruction.
 *
 * @param {string|null|undefined} description - The raw description HTML.
 * @return {boolean} True when something would actually be read.
 */
function hasContent(description) {
  if (!description) return false;
  if (/<img\b/i.test(description)) return true;

  return (
    description
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .trim().length > 0
  );
}

/**
 * One resource cell as a number, so the comparison matches how the rest of the
 * site reads these: a blank and a typed "0" both mean nobody, and must not
 * register as a change from one another.
 *
 * @param {string|number|null|undefined} value - The raw cell.
 * @return {number} The villager count it states.
 */
const cell = (value) => parseVillagerCountString(value == null ? "" : String(value));

/**
 * Marks every step of a flat build as worth showing or not, index-aligned.
 *
 * Returns a mask rather than a filtered list on purpose: the resolver, the age
 * boundaries and the economy series are all keyed by position in the flattened
 * list, and handing them a shorter array would silently shift every one of them.
 * Callers drop steps at render, never before.
 *
 * @param {Array} flat - The flattened step list.
 * @return {Array<boolean>} True where the step says nothing.
 */
export function redundantMask(flat) {
  if (!Array.isArray(flat)) return [];

  return flat.map((step, index) => saysNothing(step, index === 0 ? null : flat[index - 1]));
}
