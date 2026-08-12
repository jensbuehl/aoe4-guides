//External
import { computed, unref } from "vue";

//Composables
import {
  resolveStepTimes,
  toDateFromSeconds,
  getFormattedTime,
} from "./timingsHelper.js";
import { aggregateVillagers } from "./villagerAggregator.js";

/**
 * The ages this feature surfaces, in the order they are always displayed. Shared
 * by the list card rail, the age chips and the details timeline so none of them
 * can drift on naming or artwork.
 */
export const AGE_DISPLAY = [
  { age: 2, name: "Feudal Age", short: "Feudal", crest: "/assets/pictures/age/age_2.webp" },
  { age: 3, name: "Castle Age", short: "Castle", crest: "/assets/pictures/age/age_3.webp" },
  { age: 4, name: "Imperial Age", short: "Imperial", crest: "/assets/pictures/age/age_4.webp" },
];

/**
 * Every age a build can be *in*, which is one more than the list above: a build
 * starts in the Dark Age without ever "reaching" it.
 *
 * Deliberately not folded into AGE_DISPLAY. The chips and the list card rail
 * iterate that list whole to answer "which ages does this build reach, and
 * when" — a Dark Age entry there would print "Dark Age not reached" on every
 * build on the site.
 */
const AGE_ART = [
  { age: 1, name: "Dark Age", short: "Dark", crest: "/assets/pictures/age/age_1.webp" },
  ...AGE_DISPLAY,
];

/**
 * The crest and name for the age a build is currently in.
 *
 * @param {number|null} age - Age number as stored on an "age" section, 1-4.
 * @return {Object|null} The art, or null for an age nothing is stored for —
 *   including the 0 that migrated builds carry to mean "no particular age".
 */
export function ageArt(age) {
  return AGE_ART.find((entry) => entry.age === age) ?? null;
}

/**
 * Formats an age arrival time as m:ss.
 *
 * Runs through the same helper the build order and Focus mode use, so the three
 * always agree to the second; only the padding zero on the minutes is dropped.
 *
 * @param {number} seconds - Arrival time in seconds.
 * @return {string} The time as m:ss, e.g. "3:40".
 */
export function formatAgeTime(seconds) {
  return getFormattedTime(toDateFromSeconds(seconds)).replace(/^0(?=\d:)/, "");
}

/**
 * Builds the label assistive technology reads for one age, so a timing is never
 * conveyed by crest artwork and a bare number alone.
 *
 * @param {Object} display - An AGE_DISPLAY entry.
 * @param {Object|null} timing - The matching timing, or null if never reached.
 * @return {string} A spoken-language description of the row.
 */
export function ageTimingLabel(display, timing) {
  if (!timing) return `${display.name} not reached`;

  return timing.derived
    ? `${display.name} about ${formatAgeTime(timing.seconds)}, estimated`
    : `${display.name} ${formatAgeTime(timing.seconds)}`;
}

/**
 * Age section numbering as stored on `age` sections: 1 Dark, 2 Feudal, 3 Castle,
 * 4 Imperial. `ageUp` sections number differently (they carry the count of ages
 * already completed), which is why only `age` sections are read as boundaries.
 */
const AGE_KEYS = { 2: "feudal", 3: "castle", 4: "imperial" };

/**
 * The one item kind that is not a step. Everything else in a section's `steps`
 * array is an ordinary step, which is why absence of `kind` is the discriminator:
 * no build written before this feature carries the field, so every existing
 * document flattens exactly as it always did.
 */
const ALTERNATIVES = "alternatives";

/**
 * Identity of an alternatives block, for looking up which path is being read.
 *
 * Positional, like every other identity in a build order — a block carries no id
 * of its own. A selection whose block has since moved resolves to the default
 * rather than to the wrong path, because the lookup below falls through.
 *
 * @param {number} sectionIndex - Position of the section in the build.
 * @param {number} itemIndex - Position of the block within that section.
 * @return {string} The key a selection is stored under.
 */
export const blockId = (sectionIndex, itemIndex) => `${sectionIndex}:${itemIndex}`;

/**
 * The path a block is currently being read down.
 *
 * In order: what the reader chose, then the path its author marked as the main
 * line, then the first one. The fall-through is what makes flattening total —
 * there is always an answer, so no caller ever has to handle "no path".
 *
 * @param {Object} block - The alternatives block.
 * @param {Object|null|undefined} selection - Map of blockId to path index.
 * @param {string} id - This block's key.
 * @return {Object|null} The active path, or null when the block has none.
 */
function activePath(block, selection, id) {
  const paths = Array.isArray(block?.paths) ? block.paths : [];
  if (!paths.length) return null;

  const chosen = selection?.[id];
  if (Number.isInteger(chosen) && paths[chosen]) return paths[chosen];

  //Admission A-3: one main at most, and the first wins if an edit left two.
  return paths.find((path) => path?.main) ?? paths[0];
}

/**
 * The steps one section contributes to the flattened list.
 *
 * The single place a block turns back into a straight run of steps. Both
 * flattenSections() and sectionOffsets() are built on this rather than each
 * walking the section themselves, so the list and the offsets into it cannot
 * disagree about how long a section is — which is the whole reason
 * sectionOffsets() exists.
 *
 * @param {Object} section - One section of the build.
 * @param {number} sectionIndex - Its position, for block identity.
 * @param {Object|null|undefined} selection - Map of blockId to path index.
 * @return {Array} The steps, blocks already resolved to one path.
 */
function sectionStepList(section, sectionIndex, selection) {
  const items = section?.steps ?? [];
  const steps = [];

  items.forEach((item, itemIndex) => {
    //An ordinary step, which is anything without the discriminator. Pushed
    //as-is, by reference, including the nulls a malformed document may hold —
    //dropping those here would shift every index after them.
    if (!item?.kind) {
      steps.push(item);
      return;
    }

    if (item.kind !== ALTERNATIVES) return;

    const path = activePath(item, selection, blockId(sectionIndex, itemIndex));

    for (const step of path?.steps ?? []) {
      //Admission A-4: blocks do not nest. An inner one is ignored rather than
      //reported — the editor is where a human can be told why.
      if (step?.kind) continue;
      steps.push(step);
    }
  });

  return steps;
}

/**
 * Visits every step the document holds — down every path, not just the one
 * being read.
 *
 * The other half of flattenSections(), and the half that is easy to forget
 * exists. Flattening answers "what is being read", so it resolves each block to
 * one path; that is exactly wrong for anything acting on the *document* rather
 * than on a reading. Sanitising, validating, migrating and counting all have to
 * reach the paths nobody chose, because those get saved too.
 *
 * Steps are handed over by reference, so a visitor may write to them.
 *
 * @param {Array} sections - The build's sections.
 * @param {Function} visit - Called with (step, {sectionIndex, itemIndex,
 *   pathIndex}). `pathIndex` is null for a step on the main line.
 * @return {void}
 */
export function forEachStep(sections, visit) {
  (sections ?? []).forEach((section, sectionIndex) => {
    (section?.steps ?? []).forEach((item, itemIndex) => {
      if (!item?.kind) {
        visit(item, { sectionIndex, itemIndex, pathIndex: null });
        return;
      }

      if (item.kind !== ALTERNATIVES) return;

      (item.paths ?? []).forEach((path, pathIndex) => {
        (path?.steps ?? []).forEach((step) => {
          //Admission A-4 again: blocks do not nest, and an inner one is skipped
          //rather than descended into.
          if (step?.kind) return;
          visit(step, { sectionIndex, itemIndex, pathIndex });
        });
      });
    });
  });
}

/**
 * Flattens a build's sections into the ordered step list the timing helpers read.
 *
 * Section steps only, in order, and never the section gameplan — exactly as
 * FocusMode does, because the indices must line up with getTimings().
 *
 * Shared rather than repeated: every chart drawn from a build's steps has to
 * agree on which step is which, and two copies of this loop is how they would
 * quietly stop agreeing.
 *
 * **This is also where a branching build becomes a linear one.** An alternatives
 * block is replaced in place by the steps of the path being read, so nothing
 * downstream — the resolver, the redundancy mask, the economy series, focus
 * mode's queue — ever learns that a build could fork. They keep receiving one
 * ordered list of steps and keep being right about it.
 *
 * The cost of that is worth stating: the flat index space is **relative to a
 * selection**. Step 14 down one path and step 14 down another are different
 * steps, so an index may only be read against the selection it was taken under.
 *
 * @param {Array} steps - A build's sections array.
 * @param {Object} [selection] - Map of blockId to chosen path index. Omitted,
 *   every block resolves to its main path, or its first.
 * @return {Array} The flattened steps. Empty when there is nothing to flatten.
 */
export function flattenSections(steps, selection) {
  const flat = [];

  (steps ?? []).forEach((section, sectionIndex) => {
    for (const step of sectionStepList(section, sectionIndex, selection)) flat.push(step);
  });

  return flat;
}

/**
 * Where each section begins in the flattened list.
 *
 * The other half of flattenSections(): everything that reads a build's steps
 * works on the flat list, while the table renders them back in section slices.
 * Anything that has to cross between the two — "which flat step is this row?",
 * "which slice of the resolver output belongs to this section?" — needs the
 * offset, and every caller that computed it for itself was one more place the
 * two index spaces could quietly disagree.
 *
 * A section with no `steps` contributes zero, so an empty or malformed section
 * shifts nothing and cannot desynchronise the sections after it.
 *
 * A section containing an alternatives block contributes the **active path's**
 * step count — not one, and not the total across paths. Counted through the same
 * helper flattenSections() uses, so the two cannot disagree; pass both the same
 * selection or the offsets will point into a list nobody produced.
 *
 * @param {Array} steps - A build's sections array.
 * @param {Object} [selection] - Map of blockId to chosen path index. Must match
 *   the one given to flattenSections().
 * @return {Array<number>} One flat index per section, in section order. The
 *   first is always 0. Empty when there are no sections.
 */
export function sectionOffsets(steps, selection) {
  const offsets = [];
  let cursor = 0;

  (steps ?? []).forEach((section, sectionIndex) => {
    offsets.push(cursor);
    cursor += sectionStepList(section, sectionIndex, selection).length;
  });

  return offsets;
}

/**
 * Derives the times at which a build reaches each age beyond the first.
 *
 * Builds on getTimings() unchanged, including its contract of returning null
 * when the build has no usable timestamps — in that case there is nothing
 * honest to show, so this returns an empty list rather than placeholders.
 *
 * An age whose own first step carries a readable timestamp is always reported
 * from that timestamp, even when the rest of the build has gaps that stop
 * getTimings() from resolving. Interpolation only covers the ages that state
 * nothing themselves, and those are flagged so they are never shown as fact.
 *
 * @param {Array} steps - A build's steps: either the sections array or, for
 *   builds saved before sections existed, a flat step array.
 * @param {Object} [selection] - Which alternative each block is read down. The
 *   timings belong to the path in front of the reader, not to the first one.
 * @return {Array<{age: number, seconds: number, derived: boolean, villagers: number|null}>}
 *   Ascending by age. Empty when no ages are derivable. Never null.
 */
export function getAgeTimings(steps, selection) {
  try {
    if (!Array.isArray(steps) || !steps.length) return [];

    //Legacy flat builds have no sections, so no age boundaries exist to read
    if (!steps[0]?.type) return [];

    const flat = flattenSections(steps, selection);
    const boundaries = [];
    //The "ageUp" section holds the steps performed while aging up, so its first
    //step is the moment the player clicked up. Held until the age section that
    //follows claims it.
    let pendingClickUpIndex = null;
    //Where each section starts in the flattened list. Read from sectionOffsets
    //rather than counted here: an alternatives block is *one* entry in
    //`section.steps` but contributes its active path's steps to the flat list,
    //so a running total of `section.steps.length` drifts from the list these
    //indices point into the moment a build contains one.
    const offsets = sectionOffsets(steps, selection);

    steps.forEach((section, sectionIndex) => {
      const sectionSteps = section?.steps ?? [];
      const cursor = offsets[sectionIndex];
      const contributed =
        (sectionIndex + 1 < offsets.length ? offsets[sectionIndex + 1] : flat.length) - cursor;

      if (section?.type === "ageUp" && contributed) {
        pendingClickUpIndex = cursor;
      }

      //Age n is reached at the first step of the first "age" section with that
      //age. A section without steps has no such step, so it cannot be a
      //boundary — recording one would silently attribute the next section's
      //time to this age.
      if (
        section?.type === "age" &&
        section.age > 1 &&
        contributed &&
        !boundaries.some((boundary) => boundary.age === section.age)
      ) {
        boundaries.push({
          age: section.age,
          index: cursor,
          clickUpIndex: pendingClickUpIndex,
        });
        pendingClickUpIndex = null;
      }
    });

    if (!boundaries.length || !flat.length) return [];

    //One read, and it never gives up on a whole build for one unresolvable step.
    //This used to call getTimings() inside a try/catch and work around its
    //all-or-nothing contract; the leniency now lives in the resolver, where both
    //charts get it for free and cannot drift apart.
    const times = resolveStepTimes(flat);

    /**
     * The villager count in force at a step. Counts are running totals, so a step
     * that does not restate them inherits the last one that did — the step that
     * clicks up is usually just a timestamp with no cells filled in, and reading
     * only that step would report no pop at all.
     *
     * @param {number} index - Position in the flattened step list.
     * @return {number|null} The count, or null if none was ever stated.
     */
    const villagersAt = (index) => {
      for (let cursor = index; cursor >= 0; cursor--) {
        const count = aggregateVillagers(flat[cursor]);
        if (count) return count;
      }
      return null;
    };

    /**
     * Reads one moment in the flattened list.
     *
     * `derived` is kept alongside the finer `provenance` rather than replaced by
     * it: five places across the age chips, the list card and the timeline read
     * that boolean to decide whether to print "~", and all of them are right to
     * treat both derived tiers the same way. Only the timeline's footnote cares
     * which tier it is.
     *
     * @param {number|null} index - Position in the flattened step list.
     * @return {Object|null} The moment, or null when it cannot be resolved.
     */
    const resolveAt = (index) => {
      if (index == null) return null;

      const time = times[index];
      if (!time || time.seconds == null) return null;

      return {
        seconds: time.seconds,
        derived: time.provenance !== "stated",
        provenance: time.provenance,
        villagers: villagersAt(index),
      };
    };

    return boundaries
      .map((boundary) => {
        const reached = resolveAt(boundary.index);
        if (!reached) return null;

        const clickUp = resolveAt(boundary.clickUpIndex);

        return {
          age: boundary.age,
          ...reached,
          //Pop when the player clicked up — the number build orders quote, and
          //resolved separately from clickUp because it is knowable even when
          //that step states no time of its own.
          clickUpVillagers:
            boundary.clickUpIndex != null ? villagersAt(boundary.clickUpIndex) : null,
          //When the player started aging up, and how long the transition took.
          //Absent when the build has no ageUp section for this age, or when that
          //section's own timing could not be resolved.
          clickUp:
            clickUp && clickUp.seconds <= reached.seconds
              ? { ...clickUp, duration: reached.seconds - clickUp.seconds }
              : null,
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error("useAgeTimings.getAgeTimings failed:", err.message);
    return [];
  }
}

/**
 * The second a transition band starts at, or null where none can be drawn.
 *
 * Every rule here is a refusal rather than a repair. A click-up that cannot be
 * placed is never approximated, clamped into range or inferred from a duration:
 * the absence of one is information about the build, and a band drawn from a
 * moment nobody described would be the one claim this card has never made — its
 * width would assert a measurement out of nothing.
 *
 * @param {Object} age - One getAgeTimings() entry.
 * @param {number} previous - The previous age's arrival, or 0 for the first age.
 * @return {number|null} The click-up second, or null when no band is drawable.
 */
function bandStart(age, previous) {
  //No ageUp section for this age, or one whose timing resolved to nothing
  if (!age.clickUp) return null;

  //Strictly before, not merely not-after. getAgeTimings admits a click-up at
  //the arrival second itself, so a build that stamps its age-up step and its
  //age step with one timestamp carries a real clickUp of zero duration. Drawing
  //it yields a zero-width run rather than anything a reader could see; the
  //tooltip still reports it, which is where a 0:00 age-up belongs.
  if (age.clickUp.seconds >= age.seconds) return null;

  //A band cannot eat into an age it does not belong to. Timestamps typed out of
  //order can resolve a click-up before the previous age even arrived — that is
  //a build that needs fixing, not a transition that ran backwards.
  if (age.clickUp.seconds < previous) return null;

  return age.clickUp.seconds;
}

/**
 * Splits the timeline track into runs: one per age, and one per transition.
 *
 * Each age run is coloured for the age the build is *in* during it: the first
 * covers the starting age up to the first age-up, and the last runs from the
 * most recent age reached to the end of the track, because from then on the
 * build simply stays in that age. That final run is not special to Imperial — a
 * build that stops at Feudal is in Feudal for the rest of its timeline just the
 * same.
 *
 * Between them sit the transitions. An age-up is a span, not an instant, and a
 * band is that span drawn at the same scale as everything else on the track, so
 * its width is its duration and two bands can be compared by eye. The duration
 * was always computed; until now it existed only inside a tooltip, which meant
 * only for a reader who already suspected it was there.
 *
 * The band is cut out of the ages either side rather than laid over them. The
 * runs are sliced from [0, scaleSeconds] in order, so they account for every
 * second exactly once by construction — no run is measured against another, and
 * there is no arithmetic that could leave a seam or double-count a second.
 *
 * The index is positional, not the age number: run n is the nth age of this
 * build's life. A band leading into ages[i] therefore carries index i + 2 — the
 * index of the run that follows it — which is what keeps a band and the age it
 * leads into from ever drifting apart in colour.
 *
 * Bands say nothing about how their ends were arrived at. Every band is drawn
 * the same striped way whether the build stated its times or the site worked
 * them out, because the crest a band leads to already carries "~" on its face
 * and names both moments in its tooltip — a second provenance signal on the
 * track would say the same thing twice, in a different language, on the one
 * part of the card with no room to explain itself.
 *
 * @param {Array} ages - Result of getAgeTimings(), ascending by age.
 * @param {number} scaleSeconds - Full width of the track in seconds.
 * @return {Array<{key: string, width: number}>} Runs in time order, widths as
 *   percentages.
 */
export function getAgeSegments(ages, scaleSeconds) {
  if (!ages?.length || !scaleSeconds) return [];

  const clamp = (value) => Math.min(100, Math.max(0, value));
  const widthOf = (seconds) => clamp((seconds / scaleSeconds) * 100);
  const segments = [];
  let previous = 0;

  ages.forEach((age, index) => {
    const clickUp = bandStart(age, previous);

    //Where a band is drawn the age stops at the click-up instead of the
    //arrival, so the pair still covers exactly the stretch the single run
    //covered before. Where none is, this is the run this function always made.
    segments.push({
      key: `age-seg-${index + 1}`,
      width: widthOf((clickUp ?? age.seconds) - previous),
    });

    if (clickUp != null) {
      segments.push({
        key: `age-band-${index + 2}`,
        width: widthOf(age.seconds - clickUp),
      });
    }

    previous = age.seconds;
  });

  segments.push({
    key: `age-seg-${ages.length + 1}`,
    width: widthOf(scaleSeconds - previous),
  });

  return segments;
}

/**
 * Converts derived age timings into the map stored on the build document.
 *
 * Ages the build never reaches are omitted entirely rather than written as a
 * zero or null, so those builds drop out of an age-time ordering instead of
 * sorting to the front of it.
 *
 * @param {Array} ageTimings - Result of getAgeTimings().
 * @return {Object} Map keyed by age name; empty when nothing is derivable.
 */
export function toStoredAgeTimings(ageTimings) {
  const stored = {};

  for (const timing of ageTimings ?? []) {
    const key = AGE_KEYS[timing.age];
    if (key) stored[key] = { t: timing.seconds, e: timing.derived };
  }

  return stored;
}

/**
 * Converts the stored map back into the derived shape the UI renders.
 *
 * @param {Object} stored - The build document's ageTimings field.
 * @return {Array|null} The timings, or null when the field is absent or empty
 *   so the caller can fall back to deriving from steps.
 */
export function fromStoredAgeTimings(stored) {
  if (!stored || typeof stored !== "object") return null;

  const ageTimings = [];

  for (const age of Object.keys(AGE_KEYS)) {
    const entry = stored[AGE_KEYS[age]];
    if (entry && typeof entry.t === "number") {
      //One stored bit cannot tell the two derived tiers apart, and widening it
      //would mean a schema change on 4k documents plus the home snapshot's copy
      //— to separate two tiers that render identically everywhere but one
      //footnote. A stored estimate therefore reports as interpolated, which errs
      //toward the humbler claim.
      ageTimings.push({
        age: Number(age),
        seconds: entry.t,
        derived: !!entry.e,
        provenance: entry.e ? "interpolated" : "stated",
      });
    }
  }

  return ageTimings.length ? ageTimings : null;
}

/**
 * Memoized age timings for a build, preferring the stored field over deriving.
 *
 * Home lane cards come from a pre-generated summary that carries no steps, so
 * the stored field is the only source there; everywhere else steps are present
 * and act as the fallback.
 *
 * @param {Object|Ref} build - The build to read.
 * @return {ComputedRef<Array>} The build's age timings.
 */
export function useAgeTimings(build) {
  return computed(() => {
    const value = unref(build);
    if (!value || value.loading) return [];

    return fromStoredAgeTimings(value.ageTimings) ?? getAgeTimings(value.steps);
  });
}
