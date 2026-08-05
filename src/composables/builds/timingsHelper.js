import { aggregateVillagers } from "@/composables/builds/villagerAggregator.js";

export function getTimings(steps) {
  var timings = [];

  timings = init(timings, steps);
  timings = interpolate(timings);

  const valid = timings.every((element) => element.startTime !== null);

  return valid ? timings : null;
}

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

function getVillagerDiffToNextStep(steps, stepIndex) {
  const isStep = (element) => !element?.gameplan;
  const hasVillagers = (element) => aggregateVillagers(element);
  const nextIndex = steps.findIndex(
    (element, index) => index > stepIndex && isStep(element) && hasVillagers(element)
  );

  if (nextIndex == -1) {
    return 0;
  }

  var currentStepVillagerCount = aggregateVillagers(steps[stepIndex]);
  var nextStepVillagerCount = aggregateVillagers(steps[nextIndex]);

  return nextStepVillagerCount - currentStepVillagerCount;
}

function getVillagerDiffToNextTimeStamp(steps, stepIndex) {
  const isStep = (element) => !element?.gameplan;
  const hasVillagers = (element) => aggregateVillagers(element);
  const hasTimestamp = (element) => element?.time;
  const nextIndex = steps.findIndex(
    (element, index) =>
      index > stepIndex && isStep(element) && hasVillagers(element) && hasTimestamp(element)
  );

  if (nextIndex == -1) {
    return 0;
  }

  var currentStepVillagerCount = aggregateVillagers(steps[stepIndex]);
  var nextStepVillagerCount = aggregateVillagers(steps[nextIndex]);

  return nextStepVillagerCount - currentStepVillagerCount;
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
    .replace(/^0*(\d)/, '$1'); // Remove leading zeros except for single digit minutes
}

function init(timings, steps) {
  steps.forEach((step, index) => {
    timings.push({
      startTime: toSeconds(toDateFromString(step.time)),
      villagers: aggregateVillagers(step),
      villagerOffsetNextStep: step.gameplan ? null : getVillagerDiffToNextStep(steps, index),
      villagerOffsetNextValidStep: step.gameplan
        ? null
        : getVillagerDiffToNextTimeStamp(steps, index),
      type: step.gameplan ? "note" : "step",
    });
  });

  return timings;
}

function interpolate(timings, startIndex = 0) {
  //Find first valid step
  
  const isStep = (element) => element.type == "step";
  const hasTimestamp = (element) => element.startTime !== null;
  const hasVillagers = (element) => element.villagers;
  const firstValidStepIndex = timings.findIndex(
    (element, index) =>
      index == startIndex && isStep(element) && hasTimestamp(element) && hasVillagers(element)
  );

  //No usable anchor at this position — the step at startIndex has no timestamp
  //or no villagers, which is ordinary (a first step like "0:00 build a house"
  //assigns nobody yet). Without an anchor there is nothing to interpolate from,
  //so stop here instead of walking backwards off the start of the array: the
  //loop below would otherwise read timings[-1] and throw.
  if (firstValidStepIndex === -1) {
    return timings;
  }

  //Find second valid step
  const secondValidStepIndex = timings.findIndex(
    (element, index) =>
      index > firstValidStepIndex &&
      isStep(element) &&
      hasTimestamp(element) &&
      hasVillagers(element)
  );

  //Stop recursion if no more valid steps found
  if (secondValidStepIndex == -1) {
    //ignore
  } else {
    //Interpolate in between first and second match    
    for (let index = firstValidStepIndex + 1; index < secondValidStepIndex; index++) {
      if (timings[index].type == "step" && timings[index].startTime == null) {
        const element = timings[index];
        const timediff =
          timings[secondValidStepIndex].startTime - timings[firstValidStepIndex].startTime;
        const villagersThisStep = timings[index - 1].villagerOffsetNextStep;
        const villagersTotal = timings[firstValidStepIndex].villagerOffsetNextValidStep;
        const referenceTimestamp = timings[index - 1].startTime
          ? timings[index - 1].startTime
          : timings[firstValidStepIndex].startTime;
        element.startTime = referenceTimestamp + (timediff * villagersThisStep) / villagersTotal;
      }
    }
    interpolate(timings, secondValidStepIndex);
  }

  return timings;
}
