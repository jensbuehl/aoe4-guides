import { aggregateVillagers } from "./villagerAggregator.js";

/**
 * Villager training time, used only when a build offers no measured span of its
 * own to derive a rate from. One constant, not a model: everything else in this
 * file measures the build rather than assuming anything about it.
 *
 * A build that falls back to this is one with almost no data, so it is also the
 * build whose estimates are trusted least anyway.
 */
const NOMINAL_SECONDS_PER_VILLAGER = 20;

/**
 * Above this, a build's villager count has stopped being a usable clock.
 *
 * A single town centre at full uptime produces one villager every ~20 s, so a
 * measured rate much slower than that means one of two things: the author left
 * resource cells blank across the span, or villager production has genuinely
 * stopped, as it does late in a game. Both make villagers a bad way to tell the
 * time — the first because the data is missing, the second because there is
 * nothing left to count.
 *
 * Faster rates are not capped: multiple town centres legitimately produce well
 * under 20 s per villager, and clamping that would misread a real boom.
 */
const PLAUSIBLE_MAX_SECONDS_PER_VILLAGER = 30;

/**
 * How far past its last measurement a build may be extended before an estimate
 * stops being worth more than an absence. Whichever binds first.
 *
 * These govern two things, not one: how far a line is drawn, and — through
 * getTimings() — whether a build can be autoplayed at all. Too tight loses
 * autoplay on builds that could have had it; too loose lets playback drift
 * further from the real game before giving up.
 *
 * The seconds bound is measured against the build's own span rather than fixed,
 * because a step is not a unit of time in this game. In Dark Age steps land
 * twenty seconds apart; by Imperial a single step can be four minutes. A flat
 * cap was calibrated for the opening and refused late-game builds on their very
 * first projected step — one position past a stamp at 18:00, where a
 * multi-minute gap is not a gap at all but the normal pace. Expressed as a share
 * of what the build actually measured, it scales with the era the build is in.
 *
 * The floor keeps short builds from getting a horizon of almost nothing.
 */
/**
 * Every dash a keyboard or a rich-text editor puts between the ends of a range:
 * ASCII hyphen, the Unicode hyphen block through the em dash, and the minus
 * sign. A build in the wild carries a non-breaking hyphen, so matching only the
 * ASCII one would leave the common case unparsed.
 */
const RANGE_SEPARATOR = /[-‐-―−]/;

const HORIZON_STEPS = 8;
const HORIZON_SECONDS_FLOOR = 120;
const HORIZON_SPAN_SHARE = 0.25;

/**
 * Resolves when every step of a build happens.
 *
 * The single place in the codebase where a step is assigned a time. Everything
 * that draws or announces a build order reads this, so the age timeline, the
 * economy plot and Focus mode cannot disagree about when a step happened.
 *
 * Four strategies, in order: the step's own stated time; interpolation between
 * two measured anchors; extrapolation past the last anchor at the build's own
 * observed rate; and, failing all three, nothing at all.
 *
 * A stated time the author hedged with a tilde — "~6:15" — is reported as
 * `approximate`. It anchors exactly as a precise one does, because it is still
 * a moment somebody measured; it simply is not offered to a reader as exact.
 *
 * The load-bearing idea is the anchor span. Between two stamped steps the
 * elapsed time is *measured*, so distributing it needs no villager production
 * rate — which is why this survives contact with sixteen civilizations, multiple
 * town centres and idle production without knowing about any of them. Only
 * extrapolation leaves that comfort, which is why it is bounded.
 *
 * @param {Array} steps - A flat, ordered step list. Callers flatten sections
 *   first; this function knows nothing about sections.
 * @return {Array<{seconds: number|null, provenance: string}>} One entry per
 *   input step, index-aligned, provenance being one of "stated", "approximate",
 *   "interpolated", "extrapolated" or "unresolved". Never null, never short,
 *   never throws.
 */
export function resolveStepTimes(steps) {
  try {
    if (!Array.isArray(steps) || !steps.length) return [];

    const entries = readEntries(steps);
    forceStartAtZero(entries);
    const anchors = findAnchors(entries);

    //Without a single measured moment there is nothing to interpolate between
    //and nothing to extrapolate from. A build like this stays unresolved rather
    //than being invented from a nominal rate end to end.
    if (!anchors.length) return entries.map(() => unresolved());

    const resolved = entries.map(() => unresolved());

    for (const anchor of anchors) {
      resolved[anchor.index] = {
        seconds: anchor.seconds,
        provenance: entries[anchor.index].approximate ? "approximate" : "stated",
      };
    }

    //An implicit 0:00 sits before the first anchor so that steps opening the
    //build have a left endpoint. It is a bound, never an anchor: an anchor needs
    //a villager count, and the count at 0:00 is the civ's starting population —
    //exactly the modelling this design promised not to do.
    interpolateSpan(entries, resolved, { index: -1, seconds: 0, villagers: null }, anchors[0]);

    for (let i = 0; i < anchors.length - 1; i++) {
      interpolateSpan(entries, resolved, anchors[i], anchors[i + 1]);
    }

    extrapolateTail(entries, resolved, anchors);

    return resolved;
  } catch (err) {
    console.error("timingsHelper.resolveStepTimes failed:", err.message);
    return Array.isArray(steps) ? steps.map(() => unresolved()) : [];
  }
}

const unresolved = () => ({ seconds: null, provenance: "unresolved" });

/**
 * Reads each step once into the shape the passes below need.
 *
 * Villager counts are *running*: a step that fills in no cells inherits the last
 * count that did. This is the rule the "N vils" markers already follow, and
 * getting it wrong is what let a cell-less step — an age-up click, a bare
 * comment — measure its villager gain against zero and claim the whole of the
 * next step's count as its own, throwing later steps minutes past the span they
 * live in.
 *
 * @param {Array} steps - The flat step list.
 * @return {Array<{note: boolean, stated: number|null, villagers: number|null}>}
 */
function readEntries(steps) {
  const entries = [];
  let running = null;

  for (const step of steps) {
    const note = !!step?.gameplan;

    //A note is not a step. It was never going to carry a time, and it says
    //nothing about the economy either, so it neither anchors nor inherits.
    if (note) {
      entries.push({ note: true, stated: null, villagers: null });
      continue;
    }

    const stated = toSeconds(toDateFromString(step?.time));
    const counted = aggregateVillagers(step);
    if (counted) running = counted;

    //Authors hedge two ways: "~6:15" for "about", and "9-12:00" for "somewhere
    //in here". Both parse — they are real measurements and must still anchor the
    //spans around them — but reporting either as stated would turn a hedge into
    //a fact and suppress the very uncertainty the author was expressing. Read
    //from the raw cell, before the sanitizer removes the evidence.
    const raw = String(step?.time ?? "");

    entries.push({
      note: false,
      stated,
      approximate: stated !== null && (/~/.test(raw) || RANGE_SEPARATOR.test(raw)),
      villagers: running,
    });
  }

  return entries;
}

/**
 * A build starts when the game starts. The first step is 0:00, always.
 *
 * This outranks every other rule here, including the author's own timestamp: a
 * build order describes a game from its opening, so the first step is the one
 * moment that needs no measuring and admits no estimate. Applied before anchors
 * are found, so every build gains a real left endpoint and the opening steps
 * interpolate against something instead of dangling.
 *
 * Recorded as "stated" rather than derived because it is a fact, not a guess —
 * which is why the first step never carries the "~".
 *
 * @param {Array} entries - Output of readEntries(), mutated in place.
 */
function forceStartAtZero(entries) {
  const first = entries.findIndex((entry) => !entry.note);
  if (first === -1) return;

  entries[first].stated = 0;
  //Whatever the author hedged about the opening, the game still starts when it
  //starts. This one is a fact by rule, so it is not approximate either.
  entries[first].approximate = false;
}

/**
 * The measured moments in a build: every step whose own timestamp parses.
 *
 * Deliberately wider than "a step that states both a time and a villager count".
 * A stamped step is a measured moment whether or not its author also filled in
 * the resource cells, and treating it as one is what lets a build stamped only
 * at its age-ups resolve at all — the common shape that previously produced
 * nothing. The villager count only decides whether the span it opens can be
 * divided proportionally; when it cannot, the span falls back to even spacing,
 * which is still anchored at both ends by a measured time.
 *
 * @param {Array} entries - Output of readEntries().
 * @return {Array<{index: number, seconds: number, villagers: number|null}>}
 */
function findAnchors(entries) {
  const anchors = [];

  entries.forEach((entry, index) => {
    if (!entry.note && entry.stated !== null) {
      anchors.push({ index, seconds: entry.stated, villagers: entry.villagers });
    }
  });

  return anchors;
}

/**
 * Places every unstated step between two anchors.
 *
 * The span's duration is measured, so this only has to decide how to divide it.
 * Each move through it is worth the villagers it added plus one for having
 * happened at all, which spreads the time toward where the work was without
 * ever charging a step nothing.
 *
 * That plus-one is doing real work. Weighting purely by villagers reads a step
 * that assigns nobody as instantaneous, so it lands on the exact second of the
 * step before it — two rows sharing a moment, which no build ever does. It also
 * covers the degenerate spans in the same arithmetic rather than as special
 * cases: no counts stated, no change across the span, or a count that goes down
 * all give every move a weight of one, which is even spacing.
 *
 * Every result is clamped into the span and forced non-decreasing, so no
 * arithmetic accident can put a step outside the two moments that bound it.
 *
 * @param {Array} entries - Output of readEntries().
 * @param {Array} resolved - Mutated in place.
 * @param {Object} from - Left anchor, or the implicit 0:00 bound.
 * @param {Object} to - Right anchor.
 */
function interpolateSpan(entries, resolved, from, to) {
  const interior = [];
  for (let index = from.index + 1; index < to.index; index++) {
    if (!entries[index].note && entries[index].stated === null) interior.push(index);
  }
  if (!interior.length) return;

  //A span running backwards means the author typed two times out of order. Their
  //times are kept as written (they are describing a game they played), so there
  //is nothing honest to spread — the interior collapses onto the left moment
  //rather than inventing a descending sequence.
  const duration = Math.max(0, to.seconds - from.seconds);
  const totalDelta =
    from.villagers != null && to.villagers != null ? to.villagers - from.villagers : 0;

  //Spreading the span proportionally assumes the villagers were produced steadily
  //across it. When the span implies a rate no town centre produces at, that
  //assumption is what is wrong, not the author's timestamps: the gap is the
  //author skipping ahead in their account, not twelve minutes of glacial
  //production. Place the villagers at the pace villagers are actually made,
  //starting from the measured left edge, and let the unexplained time sit where
  //it belongs — before the next thing the author chose to write down.
  const implausible =
    duration > 0 && totalDelta > 0 && duration / totalDelta > PLAUSIBLE_MAX_SECONDS_PER_VILLAGER;

  let previous = from.seconds;
  const place = (index, seconds) => {
    const bounded = clamp(seconds, previous, Math.max(to.seconds, from.seconds));
    previous = bounded;
    resolved[index] = { seconds: Math.round(bounded), provenance: "interpolated" };
  };

  //How much of the span the villagers actually account for. Normally all of it.
  //When the implied rate is impossible, only what the villagers justify at the
  //pace villagers are really made — the rest is the author's ellipsis and is
  //left as the gap before the next thing they wrote down.
  const explained = implausible
    ? Math.min(duration, totalDelta * NOMINAL_SECONDS_PER_VILLAGER)
    : duration;

  //Each move through the span is worth the villagers it added, plus one for
  //having happened at all.
  //
  //Weighting purely by villagers reads a step that assigns nobody as taking no
  //time, so it lands exactly on the step before it — two rows sharing a second,
  //which is not something a build ever does. The plus-one is what a step costs
  //by existing: reassigning, walking, building. It also folds the old
  //even-spacing fallback into the same arithmetic, since a span whose villagers
  //never move gives every move a weight of one, which is even spacing.
  const counts = [];
  let running = from.villagers ?? 0;
  counts.push(running);
  for (const index of interior) {
    running = entries[index].villagers ?? running;
    counts.push(running);
  }
  counts.push(to.villagers ?? running);

  const weights = counts
    .slice(1)
    .map((count, position) => Math.max(0, count - counts[position]) + 1);
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  let elapsed = 0;
  interior.forEach((index, position) => {
    elapsed += weights[position];
    place(index, from.seconds + (explained * elapsed) / total);
  });
}

/**
 * Places the steps that come after the last measured moment.
 *
 * The rate comes from the build itself — the seconds per villager it actually
 * ran at over its last usable span — which is why no civilization table is
 * needed here. A build that measured itself has already priced in its civ, its
 * town centre count and its real (not theoretical) production uptime. The
 * nominal constant is a last resort for builds that measured nothing.
 *
 * Stops at the horizon. Past it a step gets no time at all: a line that ends is
 * honest, a line that runs on for eight minutes of invention is not.
 *
 * @param {Array} entries - Output of readEntries().
 * @param {Array} resolved - Mutated in place.
 * @param {Array} anchors - All anchors, ascending.
 */
function extrapolateTail(entries, resolved, anchors) {
  //Every build now has at least the forced 0:00 anchor, which on its own has
  //measured nothing. Projecting an entire build from a nominal rate off a single
  //synthetic point is invention, not estimation, so extrapolation still requires
  //the author to have stamped something themselves.
  if (anchors.length < 2) return;

  const last = anchors[anchors.length - 1];
  if (last.index >= entries.length - 1) return;

  const rate = observeRate(anchors);
  const horizonSeconds = Math.max(
    HORIZON_SECONDS_FLOOR,
    (last.seconds - anchors[0].seconds) * HORIZON_SPAN_SHARE
  );

  let previous = last.seconds;
  let previousVillagers = last.villagers;
  let stepsOut = 0;

  for (let index = last.index + 1; index < entries.length; index++) {
    const entry = entries[index];
    if (entry.note) continue;

    //A stated time past the last anchor cannot happen — it would have been an
    //anchor itself — so everything from here is derived.
    stepsOut++;

    const villagers = entry.villagers;
    const gained =
      villagers != null && previousVillagers != null ? villagers - previousVillagers : 0;

    //Villagers drive the estimate whenever the build is still counting them: a
    //step that adds villagers took as long as those villagers took to make. At
    //the build's own measured pace when that pace is believable, at the nominal
    //one when it is not — charging a five-minute step cadence to a single
    //villager is the same implausibility this rule exists to reject.
    //
    //Only a step that adds nobody falls back to step cadence. That is the case
    //where villagers genuinely say nothing: production has stopped, or the author
    //stopped recording it, and the build's own rhythm is all that is left.
    const advance =
      gained > 0
        ? gained *
          (rate.villagerClockReliable ? rate.perVillager : NOMINAL_SECONDS_PER_VILLAGER)
        : rate.perStep;
    const seconds = previous + advance;

    //The step immediately after the last measurement is always placed. It is the
    //least speculative projection available — one step of rate error — and
    //refusing it costs the entire build its autoplay, because a single
    //unresolved step fails the gate. Only from the second step out does the
    //horizon start deciding.
    const beyond = stepsOut > HORIZON_STEPS || seconds - last.seconds > horizonSeconds;
    if (beyond && stepsOut > 1) return;

    resolved[index] = { seconds: Math.round(seconds), provenance: "extrapolated" };
    previous = seconds;
    if (villagers != null) previousVillagers = villagers;
  }
}

/**
 * The pace a build actually ran at, measured from its last usable span.
 *
 * @param {Array} anchors - All anchors, ascending.
 * @return {{perVillager: number, perStep: number, measured: boolean}}
 */
function observeRate(anchors) {
  for (let i = anchors.length - 1; i > 0; i--) {
    const from = anchors[i - 1];
    const to = anchors[i];
    const duration = to.seconds - from.seconds;
    const delta =
      from.villagers != null && to.villagers != null ? to.villagers - from.villagers : 0;

    if (duration > 0 && delta > 0) {
      const perVillager = duration / delta;

      return {
        perVillager,
        perStep: duration / Math.max(1, to.index - from.index),
        measured: true,
        //Whether villagers can be trusted to tell the time on this build. When
        //they cannot, extrapolation falls back to the span's step cadence rather
        //than to a nominal rate: the pacing is still measured from this build,
        //where a constant would be assumed about every build. That matters most
        //on exactly the shapes that trip this — a late-game tail projected at a
        //nominal 20 s per villager would run minutes fast.
        villagerClockReliable: perVillager <= PLAUSIBLE_MAX_SECONDS_PER_VILLAGER,
      };
    }
  }

  return {
    perVillager: NOMINAL_SECONDS_PER_VILLAGER,
    perStep: NOMINAL_SECONDS_PER_VILLAGER,
    measured: false,
    villagerClockReliable: true,
  };
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Whether a build can be played through automatically, and at what times.
 *
 * Deliberately all-or-nothing: Focus mode gates autoplay on this, and autoplay
 * is genuinely binary — a build either plays through or it does not, there being
 * no half-auto mode to degrade into. A chart is different, which is why the
 * charts read resolveStepTimes() directly and tolerate gaps this cannot.
 *
 * Notes are exempt. A gameplan entry is not a step and was never going to carry
 * a time; requiring one silently disabled autoplay on every legacy build that
 * contained a note.
 *
 * Extrapolated steps count as resolved, so a build stamped partway and blank
 * after is now playable. That widening comes with an obligation Focus mode must
 * honour: a time this returns is no longer necessarily one the author wrote, so
 * anything derived has to be shown as derived.
 *
 * @param {Array} steps - A flat, ordered step list.
 * @return {Array<{startTime: number}>|null} Index-aligned times, or null when
 *   any actual step could not be resolved.
 */
export function getTimings(steps) {
  const resolved = resolveStepTimes(steps);
  if (!resolved.length) return null;

  const timings = [];
  let previous = 0;

  for (const entry of resolved) {
    //A note carries the moment around it so the array stays index-aligned and
    //callers need no special case for it
    if (entry.provenance === "unresolved") {
      if (!isNoteAt(steps, timings.length)) return null;
      timings.push({ startTime: previous });
      continue;
    }

    previous = entry.seconds;
    timings.push({ startTime: entry.seconds });
  }

  return timings;
}

const isNoteAt = (steps, index) => !!steps?.[index]?.gameplan;

export function toDateFromString(timeString) {
  if (!timeString) {
    return null;
  }

  // Sanitize the time string to handle malformed values
  timeString = sanitizeTimeString(timeString);
  var selectExpr = /^(\d?\d:\d\d)$/;
  var match = timeString.match(selectExpr);

  if (!match) {
    return null;
  } else {
    var splitTime = match[0].split(":");
    var time = new Date();
    time.setMinutes(splitTime[0]);
    time.setSeconds(splitTime[1]);
    time.setHours(0);

    return time;
  }
}

export function toDateFromSeconds(secs) {
  var time = new Date();
  time.setHours(0);
  time.setMinutes(0);
  time.setSeconds(secs);
  return time;
}

export function getFormattedTime(time) {
  var timeString = time?.toTimeString();
  return timeString ? timeString.split(" ")[0].substring(3) : "";
}

function toSeconds(date) {
  if (!date) {
    return null;
  }
  return date.getMinutes() * 60 + date.getSeconds();
}

// The time cell is authored in the same rich-text editor as the description, so
// markup leaks into it — a trailing "<br>" is the common one, and it is invisible
// in the build order because that cell is rendered as HTML. Only the parser ever
// sees it, which is why a build can read "4:00" on screen and still resolve to no
// time at all. Stripped before the match rather than matched around, so every
// caller (timeline, economy plot, Focus mode autoplay) recovers the same step.
function sanitizeTimeString(timeString) {
  if (!timeString || typeof timeString !== 'string') {
    return '';
  }

  // Remove common problematic characters and whitespace
  return timeString
    .replace(/<[^>]*>/g, '')  // Remove HTML tags left by the rich-text editor
    .replace(/&nbsp;/gi, '')  // ...and the space entity it writes alongside them
    .replace(/[\n\r\t]/g, '') // Remove newlines, carriage returns, tabs
    .replace(/~+/g, '')       // Remove tildes
    .trim()                   // Remove leading/trailing whitespace
    .replace(/\s+/g, '')      // Remove any remaining whitespace
    // Authors type the separator as a dot or comma often enough to matter, and a
    // string that already parses cannot contain either, so this only ever turns a
    // rejected value into an accepted one
    .replace(/[.,]/g, ':')
    // Authors write ranges — "2:15-2:20", "9-12:00" — to mean "somewhere in
    // here". The left edge is when the step happens at the earliest, which is
    // the only end of a range a timeline can place. A time cannot otherwise
    // contain a dash, so nothing that already parsed is affected. Every dash the
    // editors and keyboards produce, not just the ASCII one: a build in the wild
    // carries a non-breaking hyphen.
    .split(RANGE_SEPARATOR)[0]
    // A bare number is minutes. "9" out of "9-12:00" means 9:00, never 9 seconds
    // — build orders are written in minutes and the other end of that range says
    // so out loud.
    .replace(/^(\d?\d)$/, '$1:00')
    .replace(/^0*(\d)/, '$1'); // Remove leading zeros except for single digit minutes
}
