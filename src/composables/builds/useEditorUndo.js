import { ref, nextTick } from "vue";

/**
 * A value serialised with its keys sorted, so two equal documents compare
 * equal however their objects were built. A section's emitted steps come out
 * of collapseBlocks(), a restored build out of JSON.parse(), and the two need
 * not list their keys in the same order.
 */
const canonical = (value) =>
  JSON.stringify(value, (key, inner) =>
    inner && typeof inner === "object" && !Array.isArray(inner)
      ? Object.fromEntries(Object.keys(inner).sort().map((k) => [k, inner[k]]))
      : inner
  );

/**
 * Undo for the editor's removals: deleting a step, a note, an alternative or
 * an age-up.
 *
 * Removals used to ask first, in a dialog that said "The action cannot be
 * undone". A question before every delete trains people to confirm without
 * reading, and Enter confirmed it. Now the removal happens at once and a
 * message offers to put it back.
 *
 * **Snapshots, not inverse operations.** Before a removal the whole build is
 * recorded, and undo puts that record back. A removal can lift steps out of a
 * block, drop a path or take two sections with it, and writing the inverse of
 * each is where an undo goes subtly wrong. The cost is a copy of a document of
 * a few kilobytes per removal.
 *
 * **Only while nothing else has changed.** Each entry also records the build
 * as the removal left it. Undo restores an entry only while the build still
 * looks exactly like that, and any other edit clears the history. Without that
 * rule, undoing a delete after typing elsewhere would silently throw the
 * typing away, because the snapshot predates it. Consecutive removals stack,
 * since each one starts from where the last one left the build, so several
 * deletes can be taken back one after another.
 *
 * Text editing is not part of this. Inside a field Ctrl+Z is the browser's own
 * text undo, and it stays that.
 *
 * @param {Object} options
 * @param {() => any} options.read - The build as it is now.
 * @param {(value: any) => void} options.restore - Puts a recorded build back.
 * @param {number} [options.limit=20] - Removals kept.
 * @return {Object} See the returned shape at the bottom.
 */
export function useEditorUndo({ read, restore, limit = 20 }) {
  const entries = [];

  /** The message offering to undo the latest removal. */
  const notice = ref({ open: false, text: "" });

  const clear = () => {
    entries.length = 0;
    notice.value = { ...notice.value, open: false };
  };

  /**
   * Records the build just before a removal. Call it synchronously before the
   * removal is made: the state afterwards is taken on the next tick, once the
   * removal has reached the build.
   *
   * @param {string} label - What the message says, e.g. "Step deleted".
   * @return {void}
   */
  const checkpoint = (label) => {
    const entry = { before: canonical(read()), after: null, label };
    entries.push(entry);
    if (entries.length > limit) entries.shift();

    nextTick(() => {
      if (!entries.includes(entry)) return;
      entry.after = canonical(read());
      //Nothing was removed after all (a guard inside the removal returned
      //early), so there is nothing to offer back.
      if (entry.after === entry.before) {
        entries.splice(entries.indexOf(entry), 1);
        return;
      }
      notice.value = { open: true, text: label };
    });
  };

  /**
   * Tells the history the build has changed. A change that is not the removal
   * itself means the snapshots are out of date, and they are dropped.
   *
   * @return {void}
   */
  const changed = () => {
    const top = entries.at(-1);
    if (!top || top.after === null) return;
    if (canonical(read()) !== top.after) clear();
  };

  /** Whether undo would do anything right now. */
  const canUndo = () => {
    const top = entries.at(-1);
    return !!top && top.after !== null && canonical(read()) === top.after;
  };

  /**
   * Puts the build back as it was before the latest removal.
   *
   * @return {boolean} Whether anything was restored.
   */
  const undo = () => {
    if (!canUndo()) {
      clear();
      return false;
    }
    const top = entries.pop();
    restore(JSON.parse(top.before));
    notice.value = { ...notice.value, open: false };
    return true;
  };

  return { notice, checkpoint, changed, canUndo, undo, clear };
}
