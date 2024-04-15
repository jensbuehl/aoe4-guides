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

function parseVillagerCountString(villagerCountString) {
  if (!villagerCountString) return 0;

  //Accumulate values separated by "+"
  var splitValues = villagerCountString.split("+");
  var villagerCount = 0;
  villagerCount += splitValues[0] ? parseInt(splitValues[0]) : 0;
  villagerCount += splitValues[1] ? parseInt(splitValues[1]) : 0;

  return villagerCount;
}
