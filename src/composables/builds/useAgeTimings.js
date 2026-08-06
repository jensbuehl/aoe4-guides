//External
import { computed, unref } from "vue";

//Composables
import {
  resolveStepTimes,
  toDateFromSeconds,
  getFormattedTime,
} from "@/composables/builds/timingsHelper.js";
import { aggregateVillagers } from "@/composables/builds/villagerAggregator.js";

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
 * Flattens a build's sections into the ordered step list the timing helpers read.
 *
 * Section steps only, in order, and never the section gameplan — exactly as
 * FocusMode does, because the indices must line up with getTimings().
 *
 * Shared rather than repeated: every chart drawn from a build's steps has to
 * agree on which step is which, and two copies of this loop is how they would
 * quietly stop agreeing.
 *
 * @param {Array} steps - A build's sections array.
 * @return {Array} The flattened steps. Empty when there is nothing to flatten.
 */
export function flattenSections(steps) {
  const flat = [];

  for (const section of steps ?? []) {
    for (const step of section?.steps ?? []) flat.push(step);
  }

  return flat;
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
 * @return {Array<{age: number, seconds: number, derived: boolean, villagers: number|null}>}
 *   Ascending by age. Empty when no ages are derivable. Never null.
 */
export function getAgeTimings(steps) {
  try {
    if (!Array.isArray(steps) || !steps.length) return [];

    //Legacy flat builds have no sections, so no age boundaries exist to read
    if (!steps[0]?.type) return [];

    const flat = flattenSections(steps);
    const boundaries = [];
    //The "ageUp" section holds the steps performed while aging up, so its first
    //step is the moment the player clicked up. Held until the age section that
    //follows claims it.
    let pendingClickUpIndex = null;
    //Position in the flattened list at the start of the section being read. The
    //flatten used to happen in this same loop, which is where the boundaries
    //took their index from; this carries that running position now that it is
    //extracted for the other charts to share.
    let cursor = 0;

    for (const section of steps) {
      const sectionSteps = section?.steps ?? [];

      if (section?.type === "ageUp" && sectionSteps.length) {
        pendingClickUpIndex = cursor;
      }

      //Age n is reached at the first step of the first "age" section with that
      //age. A section without steps has no such step, so it cannot be a
      //boundary — recording one would silently attribute the next section's
      //time to this age.
      if (
        section?.type === "age" &&
        section.age > 1 &&
        sectionSteps.length &&
        !boundaries.some((boundary) => boundary.age === section.age)
      ) {
        boundaries.push({
          age: section.age,
          index: cursor,
          clickUpIndex: pendingClickUpIndex,
        });
        pendingClickUpIndex = null;
      }

      cursor += sectionSteps.length;
    }

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
 * Splits the timeline track into one filled run per age.
 *
 * Each run is coloured for the age the build is *in* during it: the first covers
 * the starting age up to the first age-up, and the last runs from the most
 * recent age reached to the end of the track, because from then on the build
 * simply stays in that age. That final run is not special to Imperial — a build
 * that stops at Feudal is in Feudal for the rest of its timeline just the same.
 *
 * @param {Array} ages - Result of getAgeTimings(), ascending by age.
 * @param {number} scaleSeconds - Full width of the track in seconds.
 * @return {Array<{key: string, width: number}>} Segments, widths as percentages.
 */
export function getAgeSegments(ages, scaleSeconds) {
  if (!ages?.length || !scaleSeconds) return [];

  const clamp = (value) => Math.min(100, Math.max(0, value));
  const segments = [];
  let previous = 0;

  ages.forEach((age, index) => {
    segments.push({
      key: `age-seg-${index + 1}`,
      width: clamp(((age.seconds - previous) / scaleSeconds) * 100),
    });
    previous = age.seconds;
  });

  segments.push({
    key: `age-seg-${ages.length + 1}`,
    width: clamp(((scaleSeconds - previous) / scaleSeconds) * 100),
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
