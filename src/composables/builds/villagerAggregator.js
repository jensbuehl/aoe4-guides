/**
 * Aggregates the count of villagers across different resources for a given step.
 *
 * @param {Object} step - The step object containing counts of builders, food gatherers, wood gatherers, gold gatherers, and stone gatherers.
 * @return {number|null} The total count of villagers across all resources, or null if the step is not valid.
 */
export function aggregateVillagers(step) {
  if (!step) return null;

  const builders = parseVillagerCountString(step.builders);
  const food = parseVillagerCountString(step.food);
  const wood = parseVillagerCountString(step.wood);
  const gold = parseVillagerCountString(step.gold);
  const stone = parseVillagerCountString(step.stone);

  return builders + food + wood + gold + stone || null;
}

/**
 * Whether a resource cell holds an actual villager assignment. A cell that is
 * empty and one that is explicitly "0" (or "0+0") mean the same thing — nobody
 * is assigned — so both are treated as unset for display purposes.
 *
 * @param {string|number|null|undefined} value - The raw resource cell value.
 * @return {boolean} True if at least one villager is assigned.
 */
export function hasResourceValue(value) {
  return parseVillagerCountString(value != null ? String(value) : "") > 0;
}

/**
 * Reads a resource cell into a villager count.
 *
 * Shared with the economy plot so the lines and the "N vils" markers can never
 * contradict each other — which means its two known defects are shared too: it
 * reads only the first two "+" operands ("4+1+2" drops the 2), and a fishing
 * boat counts as a villager. Both are deliberate here. Fixing them is its own
 * feature, because it moves every villager number on the site at once.
 *
 * @param {string|number|null|undefined} villagerCountString - The raw cell value.
 * @return {number} The count, 0 when the cell says nothing — never NaN.
 */
export function parseVillagerCountString(villagerCountString) {
  if (!villagerCountString) return 0;

  //Resource cells are plain-text fields edited through a contenteditable div, so
  //markup leaks into them exactly as it does into the time cell: builds are
  //persisted with stone: "<br>". The editor strips this when it loads a build,
  //but nothing on the read path did, so the value reached parseInt() intact and
  //came back NaN — and NaN spreads. One bad cell blanked the whole economy plot,
  //because Math.max() carries NaN into the axis maximum and every plotted point
  //then resolves to NaN. Stripped here rather than at each caller, since every
  //caller reads cells through this function.
  const text = String(villagerCountString)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, "")
    //"~5" is five villagers the author is rounding, not none. Stripped rather
    //than parsed around, because parseInt gives up on a leading tilde and
    //returns nothing — the hedge was costing the whole number. The time cell has
    //read tildes this way for as long as it has existed; the cells beside it now
    //agree.
    .replace(/[~≈]/g, "")
    .trim();

  //Accumulate values separated by "+"
  const splitValues = text.split("+");

  return toCount(splitValues[0]) + toCount(splitValues[1]);
}

/**
 * One "+" operand as a number. A cell holding text rather than digits states no
 * villagers, which is 0 — the same as blank, and the same as the "–" the build
 * order already draws for it.
 *
 * @param {string|undefined} operand - One side of the "+", or nothing.
 * @return {number} The count it states.
 */
function toCount(operand) {
  const parsed = parseInt(operand, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}
