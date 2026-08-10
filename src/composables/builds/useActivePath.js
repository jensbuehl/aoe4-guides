//External
import { computed, ref } from "vue";

/**
 * Injection key for the path selection a build page shares between its halves.
 *
 * A Symbol rather than a string so an injection cannot silently collide with
 * anything else the app provides.
 */
export const ACTIVE_PATH = Symbol("activePath");

/**
 * Which alternative a reader is following, per block.
 *
 * ## Why this is not in the build document
 *
 * A choice is a property of the reading, not of the build. Two people reading
 * the same build take different paths, and the author's document must not
 * record either. So this is view state: held for as long as the page is open,
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
 * ## Not remembered between visits, deliberately
 *
 * A choice depends on the matchup and on the game in front of you, so carrying
 * the last one forward would answer a question the reader has not been asked
 * yet — and answer it with a stale reading. Every visit and every run starts
 * from the author's first path.
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
 * @return {Object} `paths` and `pathFor` to read; `select` and `clear` to
 *   write; `onSwitch` to be told when the reader changed their mind.
 */
export function useActivePath() {
  const selection = ref({});

  const paths = computed(() => selection.value);

  /**
   * The path index in force for one block. A block nobody has chosen for reads
   * down its first path, which the flattener resolves itself.
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

    for (const listener of listeners) listener(id, pathIndex);
  };

  /**
   * Unmakes a choice, putting the block back to unanswered.
   *
   * Not the same as choosing the first path: the flattener reads both as "the
   * default", but a reader looking at the block is asked again rather than told
   * what they picked. Focus mode needs the difference — a player who rewinds
   * past a fork has undone the decision, not remade it.
   *
   * @param {string} id - The block's key, from blockId().
   * @return {void}
   */
  const clear = (id) => select(id, null);

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

  return { paths, pathFor, select, clear, onSwitch };
}
