import { blockId } from "@/composables/builds/useAgeTimings.js";

/**
 * Between the document's shape and the editor's.
 *
 * The build document stores an alternatives block as **one nested item**: paths
 * side by side, each owning its steps. That is the shape that cannot dangle —
 * there is no way to write an opening marker with no closing one, or steps that
 * outlive the block they belonged to.
 *
 * The editor needs the opposite. Authoring is insert-and-delete on a flat list:
 * a step goes above the merge line or below it, and *that is what decides* which
 * path it belongs to. Membership is a position, not a field, which means the
 * editor's working copy has to be a flat run with markers in it.
 *
 * So the two shapes are converted at the edges — expanded when the editor loads
 * a section, collapsed again on every change it emits. Nothing else in the app
 * ever sees the flat form.
 *
 * Only the **active** path's steps are inline. The others wait on the marker
 * until their tab is selected, which is why switching tabs is a splice rather
 * than a re-render of everything.
 */

export const ALT_START = "altStart";
export const ALT_END = "altEnd";
export const ALTERNATIVES = "alternatives";

/**
 * Which path a block opens on: the one flagged main, else the first.
 *
 * @param {Array} paths - The block's paths.
 * @return {number} Index of the path to show.
 */
export function defaultPathIndex(paths) {
  const flagged = (paths ?? []).findIndex((path) => path?.main);
  return flagged >= 0 ? flagged : 0;
}

/**
 * A path with nothing in it yet.
 *
 * No condition field. A path's condition is its **first note** — the thing that
 * says "take this one if they scouted you" is a note like any other, written
 * with the same field, the same icons and the same rules, and it is already
 * where the reader meets it: at the top of the path.
 *
 * Callers seed the note themselves (see seededPath) so the convention is made by
 * the tool rather than left to an author's discipline.
 */
export const emptyPath = () => ({ title: "", steps: [] });

/**
 * The condition an alternative is taken under, or null when its author has not
 * written one.
 *
 * Read positionally, which is how everything else in a build order is
 * identified. A path whose first item is not a note simply has no condition to
 * show — the pick control falls back to the title alone, which is a degradation
 * rather than a break.
 *
 * @param {Object} path - One path of a block.
 * @return {string|null} The condition's rich text.
 */
export function pathCondition(path) {
  const first = path?.steps?.[0];
  return first?.gameplan ? first.gameplan : null;
}

/**
 * Turns a section's items into the editor's flat working list.
 *
 * @param {Array} items - The section's steps, as stored.
 * @param {Object} [state] - Optional map of block position to active path, so a
 *   re-expansion keeps the tab the author was on.
 * @return {Array} The flat list: ordinary steps, notes, and marker pairs.
 */
export function expandBlocks(items, state = {}) {
  const flat = [];
  let blockCount = 0;

  for (const item of items ?? []) {
    if (item?.kind !== ALTERNATIVES) {
      flat.push(item);
      continue;
    }

    const paths = Array.isArray(item.paths) && item.paths.length ? item.paths : [emptyPath()];
    const active = state[blockCount] ?? defaultPathIndex(paths);
    const safeActive = paths[active] ? active : 0;

    flat.push({ kind: ALT_START, paths, active: safeActive });
    for (const step of paths[safeActive]?.steps ?? []) {
      //Blocks do not nest. One that somehow got into a path is dropped rather
      //than expanded, because expanding it would put a second marker pair inside
      //the first and there is no such thing as an inner bracket to close.
      if (step?.kind) continue;
      flat.push(step);
    }
    flat.push({ kind: ALT_END });

    blockCount++;
  }

  return flat;
}

/**
 * Turns the editor's flat working list back into storable items.
 *
 * The steps standing between the markers become the active path's steps; the
 * other paths keep whatever they were holding. An unclosed marker — which the
 * editor should never produce, since the pair is inserted and deleted together —
 * is closed at the end of the section rather than dropped, so an author cannot
 * lose work to a bug in here.
 *
 * @param {Array} flat - The editor's working list.
 * @return {Array} Items in the shape the document stores.
 */
export function collapseBlocks(flat) {
  const items = [];
  let open = null;
  let buffer = null;

  for (const entry of flat ?? []) {
    if (entry?.kind === ALT_START) {
      //A second opening marker without a close cannot happen through the UI;
      //if it somehow does, close the first rather than nest.
      if (open) items.push(sealed(open, buffer));

      open = entry;
      buffer = [];
      continue;
    }

    if (entry?.kind === ALT_END) {
      if (open) items.push(sealed(open, buffer));
      open = null;
      buffer = null;
      continue;
    }

    if (buffer) buffer.push(entry);
    else items.push(entry);
  }

  if (open) items.push(sealed(open, buffer));

  return items;
}

/**
 * One block, with the inline steps folded back into the path they belong to.
 *
 * @param {Object} marker - The opening marker.
 * @param {Array} steps - The steps that stood between the markers.
 * @return {Object} The block, in storable shape.
 */
function sealed(marker, steps) {
  const paths = (marker.paths ?? []).map((path, index) =>
    index === marker.active ? { ...path, steps: steps ?? [] } : { ...path, steps: path.steps ?? [] }
  );

  return { kind: ALTERNATIVES, paths: paths.length ? paths : [{ ...emptyPath(), steps: steps ?? [] }] };
}

/**
 * Where each marker pair sits in the flat list.
 *
 * @param {Array} flat - The editor's working list.
 * @return {Array<{start: number, end: number}>} One entry per block, in order.
 */
export function blockRanges(flat) {
  const ranges = [];
  let start = null;

  (flat ?? []).forEach((entry, index) => {
    if (entry?.kind === ALT_START) start = index;
    else if (entry?.kind === ALT_END && start != null) {
      ranges.push({ start, end: index });
      start = null;
    }
  });

  return ranges;
}

/**
 * Whether a position in the flat list falls inside a block.
 *
 * This is the whole of "membership is positional": above the merge line the step
 * belongs to the path being edited, below it the step is common to all of them.
 * Nothing is stored to say so.
 *
 * @param {Array} flat - The editor's working list.
 * @param {number} index - A position in it.
 * @return {boolean} True when the position is between two markers.
 */
export function isInsideBlock(flat, index) {
  return blockRanges(flat).some((range) => index > range.start && index < range.end);
}

/**
 * The selection an authored document already carries.
 *
 * A block records which of its paths the author has open as `active`. That is
 * not how a *reader's* views resolve a block — they take the main path, or the
 * first — but it is exactly what "the current selection" means on the editor
 * screen, where the author is looking at one path and expects to export it.
 *
 * @param {Array} sections - The build's sections, in document shape.
 * @return {Object} Map of blockId to path index, for blocks that name one.
 */
export function selectionFromActive(sections) {
  const selection = {};

  (sections ?? []).forEach((section, sectionIndex) => {
    (section?.steps ?? []).forEach((item, itemIndex) => {
      if (item?.kind !== "alternatives") return;
      if (!Number.isInteger(item.active)) return;

      selection[blockId(sectionIndex, itemIndex)] = item.active;
    });
  });

  return selection;
}
