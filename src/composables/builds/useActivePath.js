//External
import { computed, ref } from "vue";

/**
 * Injection key for the path selection a build page shares between its halves.
 *
 * A Symbol rather than a string so an injection cannot silently collide with
 * anything else the app provides.
 */
export const ACTIVE_PATH = Symbol("activePath");

const STORAGE_KEY = "aoe4-guides-active-path";

/**
 * Which alternative a reader is following, per block.
 *
 * ## Why this is not in the build document
 *
 * A choice is a property of the reading, not of the build. Two people reading
 * the same build take different paths, and the author's document must not
 * record either. So this is view state: persisted for the reader who made it,
 * never written to Firestore, and never sent anywhere.
 *
 * ## Why one selection is shared
 *
 * The economy plot and the step list both key on position in the flattened step
 * list, and under alternatives that space depends on which path is being read —
 * step 14 down one path is a different step from step 14 down another. One
 * selection across both is what keeps an index taken in one half meaningful in
 * the other. It is also why `onSwitch` exists: anything holding an index from
 * before the switch has to let go of it.
 *
 * ## A factory, deliberately
 *
 * Module-level state here would be simpler and wrong, for the same reason
 * useStepHighlight is a factory: preview cards and focus mode can put a second
 * build on screen, and both builds would then share one selection. Called once
 * per page, that cannot happen.
 *
 * Focus mode holds its own instance for the session rather than reading this
 * one — a playback choice made mid-game is not a change to what the page below
 * is showing.
 *
 * @param {string|null} buildId - The build being read. Persistence is keyed on
 *   it; passing null keeps the selection for the session only.
 * @return {Object} `paths` and `pathFor` to read; `select` to write; `onSwitch`
 *   to be told when the reader changed their mind.
 */
export function useActivePath(buildId = null) {
  const selection = ref(readStored(buildId));

  const paths = computed(() => selection.value);

  /**
   * The path index in force for one block. Never null — a block with no stored
   * choice reads down its main path, or its first, and the flattener resolves
   * that itself.
   *
   * @param {string} id - The block's key, from blockId().
   * @return {number|null} The chosen index, or null to mean "the default".
   */
  const pathFor = (id) => selection.value[id] ?? null;

  const listeners = new Set();

  /**
   * Chooses a path, and tells anyone holding a step index to drop it.
   *
   * A no-op when the choice has not changed, so a control that re-emits on
   * every render cannot clear a highlight the reader is looking at.
   *
   * @param {string} id - The block's key, from blockId().
   * @param {number} pathIndex - Which path to read.
   * @return {void}
   */
  const select = (id, pathIndex) => {
    if (selection.value[id] === pathIndex) return;

    selection.value = { ...selection.value, [id]: pathIndex };
    writeStored(buildId, selection.value);

    for (const listener of listeners) listener(id, pathIndex);
  };

  /**
   * Subscribes to path switches.
   *
   * A set rather than a single handler: the plot, the table and the age track
   * all have reason to care, and the last one to register must not silently
   * replace the others.
   *
   * @param {Function} listener - Called with (blockId, pathIndex).
   * @return {Function} Unsubscribe.
   */
  const onSwitch = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { paths, pathFor, select, onSwitch };
}

/**
 * The selection stored for a build, or an empty one.
 *
 * Stored per build under a single key rather than one key per build, so a
 * reader who browses fifty builds does not leave fifty entries behind.
 *
 * @param {string|null} buildId - The build being read.
 * @return {Object} Map of blockId to path index.
 */
function readStored(buildId) {
  if (!buildId) return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed?.[buildId] ?? {};
  } catch {
    // Private mode, a full quota, or a shape written by an older build.
    return {};
  }
}

/**
 * Remembers the selection for a build.
 *
 * Failure is silent and harmless: the reader keeps their choice for this visit
 * and starts from the default on the next one.
 *
 * @param {string|null} buildId - The build being read.
 * @param {Object} selection - Map of blockId to path index.
 * @return {void}
 */
function writeStored(buildId, selection) {
  if (!buildId) return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) ?? {} : {};

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...all, [buildId]: selection }));
  } catch {
    // Storage unavailable — the choice simply does not survive the visit.
  }
}
