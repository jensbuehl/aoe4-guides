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

  timeString = timeString.replace("~", "");
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
        const villagersThisStep = element.villagerOffsetNextStep;
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
