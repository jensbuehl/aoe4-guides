//External
import { computed, nextTick, reactive, ref } from "vue";

/**
 * Injection key for the reordering channel shared by a build's sections.
 *
 * A Symbol rather than a string so an injection cannot silently collide with
 * anything else the app provides.
 */
export const STEP_REORDER = Symbol("stepReorder");

/**
 * The one channel that lets a step or note leave one age section and arrive in
 * another.
 *
 * ## Why this exists at all
 *
 * Every other editing action is local: a section owns its working list, splices
 * it, and emits. Reordering inside one section could have been the same. Moving
 * *between* two cannot, because a section builds its working list once in
 * `setup()` from its prop and nothing ever re-syncs it — the only watchers in
 * that component are on `focus` and `civ`. The parent can rewrite its own
 * `sections` array all it likes; two mounted children will keep rendering the
 * lists they built at mount.
 *
 * So the sections hand this object a small set of operations on themselves, and
 * it drives both ends of a move.
 *
 * **A factory, deliberately** — the same reason `useStepHighlight` is one.
 * Module-level state here would be simpler and wrong: preview cards and focus
 * mode can put a second build on screen, and both builds would then share one
 * drag. Called once per editor page, that cannot happen.
 *
 * ## What a position is
 *
 * Not an entry. A **gap** — the space between two entries, or before the first,
 * or after the last. That is the whole model, and it is what makes the awkward
 * cases disappear:
 *
 * - The gap above an alternatives block's merge marker and the gap below it are
 *   two different gaps separated by the marker. Moving from one to the other
 *   changes which path a step belongs to **without any entry changing places** —
 *   so joining a path costs its own press, and the author sees it happen.
 * - The gap after the last entry of one section and the gap before the first of
 *   the next are likewise two gaps, so crossing an age boundary is one press.
 * - Markers are passed *through*, never swapped *with*, so a bracket cannot be
 *   split by an arriving step and nothing has to check that it wasn't.
 *
 * Gaps are counted **after the moving entry is removed**, which is the only
 * counting that stays true while something is in flight.
 *
 * ## What this deliberately is not
 *
 * Not an undo stack — the reverse move is the undo. Not a validator: it does not
 * look at times, does not warn about order, does not renumber. A move relocates.
 * And it holds no policy — hit-testing, the lift, the scroll and a button's
 * disabled state all live with the components that own those events.
 *
 * @return {Object} The coordinator; see the returned shape at the bottom.
 */
export function useStepReorder() {
  /**
   * Section index to the operations that section offers.
   *
   * Reactive because `canMove()` is read during render to disable a button, and
   * a section arriving or leaving (an age-up added, a build reloaded) changes
   * what its neighbours can do.
   */
  const registry = reactive(new Map());

  /** The drag in flight, or null. Never persisted, never emitted. */
  const current = ref(null);

  const registerSection = (sectionIndex, handlers) => registry.set(sectionIndex, handlers);
  const unregisterSection = (sectionIndex) => registry.delete(sectionIndex);

  /**
   * Section indices in document order.
   *
   * Sorted rather than taken in registration order: sections register as they
   * mount, and an age-up inserted later would otherwise sit at the end of the
   * ordering while sitting in the middle of the build.
   */
  const ordered = () => [...registry.keys()].sort((a, b) => a - b);

  /**
   * How many gaps a section offers while `movingFrom` has an entry in flight.
   *
   * One more than it has entries — and one fewer entry than usual in the section
   * the moving entry came from, because it is not in the list any more.
   *
   * @param {number} index - The section being counted.
   * @param {number} movingFrom - The section the moving entry left.
   * @return {number} Gap count.
   */
  const gapsIn = (index, movingFrom) => {
    const handlers = registry.get(index);
    if (!handlers) return 0;

    return handlers.entryCount() - (index === movingFrom ? 1 : 0) + 1;
  };

  /** Every gap in the build, counted end to end. */
  const totalGaps = (movingFrom) =>
    ordered().reduce((sum, index) => sum + gapsIn(index, movingFrom), 0);

  /**
   * Where a gap sits in the build-wide ordering.
   *
   * @return {number|null} Its global index, or null if the section is unknown.
   */
  const toGlobal = (sectionIndex, gapIndex, movingFrom) => {
    let base = 0;

    for (const index of ordered()) {
      if (index === sectionIndex) return base + gapIndex;
      base += gapsIn(index, movingFrom);
    }

    return null;
  };

  /**
   * The gap a global index names.
   *
   * @return {{sectionIndex: number, gapIndex: number}|null}
   */
  const fromGlobal = (global, movingFrom) => {
    let base = 0;

    for (const index of ordered()) {
      const count = gapsIn(index, movingFrom);
      if (global < base + count) return { sectionIndex: index, gapIndex: global - base };
      base += count;
    }

    return null;
  };

  /**
   * Whether a move may land here.
   *
   * One rule, and it is a restraint rather than a correctness guard: a step may
   * not cross a section boundary *and* join a path in the same move. Nothing
   * breaks if it does — a block still lives entirely in its own section either
   * way — but a long drag that quietly deposits a step inside an alternative is
   * a decision the author did not visibly make. They arrive in the section
   * first, and join the path with the next move, having seen where they are.
   *
   * @return {boolean} True when the destination is offerable.
   */
  const allowed = (originSection, destination) => {
    if (!destination) return false;
    if (destination.sectionIndex === originSection) return true;

    return !registry.get(destination.sectionIndex)?.gapInsideBlock(destination.gapIndex);
  };

  /**
   * Performs the move, in the order that keeps an author's typing attached to
   * the row they typed it into.
   *
   * `syncEdits` first, on **both** sections — the editor holds what was typed in
   * contenteditable cells outside the model until something asks for it, and
   * both lists are addressed by index. Reorder before asking and the text lands
   * on whichever entry inherits the index.
   *
   * Then detach, then attach, and only then emit — once per section touched. A
   * section that emitted from inside `detach` would publish a build with the
   * entry missing from it and not yet anywhere else.
   *
   * The two emits in the cross-section case are independent: each writes a
   * different section's slot in the parent, so neither clobbers the other and
   * the order does not matter. **That holds because saving is manual.** If
   * autosave ever arrives, a save landing between them would persist a build
   * with the step duplicated or lost, and the fix is one batched emit — not a
   * different order.
   *
   * @return {Object|null} The entry moved, or null if it could not be.
   */
  const applyMove = (fromSection, fromIndex, toSection, toGap) => {
    const source = registry.get(fromSection);
    const destination = registry.get(toSection);
    if (!source || !destination) return null;

    source.syncEdits();
    if (toSection !== fromSection) destination.syncEdits();

    const entry = source.detach(fromIndex);
    if (!entry) return null;

    destination.attach(toGap, entry);

    source.emit();
    if (toSection !== fromSection) destination.emit();

    return entry;
  };

  /**
   * Puts focus back on the entry that just moved.
   *
   * Two ticks, following the precedent `addStep` already sets in the section
   * editor: the row has to exist and its ref has to have registered before
   * anything can be focused, and one tick is reliably not enough.
   */
  const restoreFocus = async (sectionIndex, gapIndex) => {
    await nextTick();
    await nextTick();
    registry.get(sectionIndex)?.focusEntry(gapIndex);
  };

  /**
   * Where a move by one press would land, without making it.
   *
   * @return {{sectionIndex: number, gapIndex: number}|null}
   */
  const destinationFor = (sectionIndex, draftIndex, delta) => {
    const handlers = registry.get(sectionIndex);
    //A marker answers null here, which is what stops a bracket being dragged
    //apart without anything having to check for one.
    if (!handlers?.entryAt(draftIndex)) return null;

    const from = toGlobal(sectionIndex, draftIndex, sectionIndex);
    if (from == null) return null;

    const to = from + delta;
    if (to < 0 || to >= totalGaps(sectionIndex)) return null;

    const destination = fromGlobal(to, sectionIndex);
    return allowed(sectionIndex, destination) ? destination : null;
  };

  /**
   * One press of move-up or move-down, and the arrow keys on a drag handle.
   *
   * @param {number} delta - -1 or 1. One **gap**, not one entry.
   * @return {Promise<Object|null>} Where it landed, or null if it could not.
   */
  const moveBy = async (sectionIndex, draftIndex, delta) => {
    const destination = destinationFor(sectionIndex, draftIndex, delta);
    if (!destination) return null;

    const moved = applyMove(
      sectionIndex,
      draftIndex,
      destination.sectionIndex,
      destination.gapIndex
    );
    if (!moved) return null;

    await restoreFocus(destination.sectionIndex, destination.gapIndex);
    return destination;
  };

  /** Whether that press would do anything. Drives a button's disabled state. */
  const canMove = (sectionIndex, draftIndex, delta) =>
    destinationFor(sectionIndex, draftIndex, delta) != null;

  /**
   * The gap a rendered insert line names, once the moving entry is out of the
   * list.
   *
   * The insert lines are drawn against the list as it stands, so the two lines
   * either side of the dragged row both mean "leave it where it is" — and both
   * have to resolve to the same gap, or a drop on one of them would look like a
   * move and emit like one.
   */
  const settled = (session, target) => {
    if (!target) return null;
    if (target.sectionIndex !== session.sectionIndex) return { ...target };

    const gapIndex =
      target.gapIndex > session.draftIndex ? target.gapIndex - 1 : target.gapIndex;

    return { sectionIndex: session.sectionIndex, gapIndex };
  };

  /**
   * Opens a drag.
   *
   * Refuses silently on a marker — no session, so every later step of the drag
   * is a no-op without needing its own guard.
   */
  const begin = (sectionIndex, draftIndex) => {
    const handlers = registry.get(sectionIndex);
    if (!handlers?.entryAt(draftIndex)) return;

    //Before anything moves, not after: what the author typed belongs to the row
    //they typed it into, and both working lists are addressed by index.
    handlers.syncEdits();

    current.value = { sectionIndex, draftIndex, target: null };
  };

  /**
   * Records the insert line under the pointer, in rendered terms.
   *
   * Rendered rather than settled, because this is what the indicator is drawn
   * against. A destination this move may not take is recorded as no target at
   * all, so the line simply does not light up.
   */
  const setTarget = (target) => {
    if (!current.value) return;

    const reachable = allowed(current.value.sectionIndex, settled(current.value, target));
    current.value = { ...current.value, target: reachable ? target : null };
  };

  /**
   * Records whichever insert line the pointer is nearest, anywhere in the build.
   *
   * The measuring is each section's own — it owns its DOM and answers about its
   * own lines, including whether the pointer is anywhere near them at all. All
   * that happens here is picking the closest of the answers, which is
   * arbitration between sections rather than policy about any one of them.
   *
   * A pointer over nothing — the page header, the space beside the table — gets
   * `null` from every section and therefore no target, which is what turns a
   * release out there into a cancel rather than into a move.
   */
  const setTargetFromPoint = (x, y) => {
    if (!current.value) return;

    let best = null;

    for (const [sectionIndex, handlers] of registry) {
      const candidate = handlers.gapNear?.(x, y);
      if (!candidate) continue;
      if (best && candidate.distance >= best.distance) continue;

      best = { sectionIndex, gapIndex: candidate.gapIndex, distance: candidate.distance };
    }

    setTarget(best ? { sectionIndex: best.sectionIndex, gapIndex: best.gapIndex } : null);
  };

  /**
   * Applies the drag.
   *
   * A release with no target, or onto the place it started, changes nothing and
   * emits nothing — an author who thinks better of a drag has not dirtied their
   * build.
   */
  const commit = async () => {
    const session = current.value;
    current.value = null;
    if (!session) return;

    const destination = settled(session, session.target);
    if (!destination) return;
    if (
      destination.sectionIndex === session.sectionIndex &&
      destination.gapIndex === session.draftIndex
    ) {
      return;
    }
    if (!allowed(session.sectionIndex, destination)) return;

    const moved = applyMove(
      session.sectionIndex,
      session.draftIndex,
      destination.sectionIndex,
      destination.gapIndex
    );
    if (!moved) return;

    await restoreFocus(destination.sectionIndex, destination.gapIndex);
  };

  /** Drops the drag. Nothing has been mutated yet, so there is nothing to undo. */
  const cancel = () => {
    current.value = null;
  };

  return {
    // ---- registration ----
    registerSection,
    unregisterSection,

    // ---- session ----
    session: computed(() => current.value),
    begin,
    setTarget,
    setTargetFromPoint,
    commit,
    cancel,

    // ---- discrete moves ----
    moveBy,
    canMove,
  };
}
