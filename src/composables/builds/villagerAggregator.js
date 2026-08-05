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
 * @param {string|null|undefined} villagerCountString - The raw cell value.
 * @return {number} The count, 0 when the cell says nothing.
 */
export function parseVillagerCountString(villagerCountString) {
  if (!villagerCountString) return 0;

  //Accumulate values separated by "+"
  var splitValues = villagerCountString.split("+");
  var villagerCount = 0;
  villagerCount += splitValues[0] ? parseInt(splitValues[0]) : 0;
  villagerCount += splitValues[1] ? parseInt(splitValues[1]) : 0;

  return villagerCount;
}
