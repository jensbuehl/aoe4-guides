export function getTimings(steps) {
  var timings = [];

  timings = init(timings, steps);
  timings = interpolate(timings);

  return timings;
}

export function toDateFromString(timeString) {
  if (!timeString) {
    return null;
  }

  //TODO: support other string formats!
  let splitTime = timeString.split(":");

  let time = new Date();
  time.setMinutes(splitTime[0]);
  time.setSeconds(splitTime[1]);
  time.setHours(0);

  return time;
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
  return timeString ? timeString.split(" ")[0].substring(3) : "00:00";
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

function aggregateVillagers(step) {
  const builders = parseInt(step?.builders) || 0;
  const food = parseInt(step?.food) || 0;
  const wood = parseInt(step?.wood) || 0;
  const gold = parseInt(step?.gold) || 0;
  const stone = parseInt(step?.stone) || 0;

  return builders + food + wood + gold + stone || null;
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
      villagerOffsetNextValidStep: step.gameplan ? null : getVillagerDiffToNextTimeStamp(steps, index),
      type: step.gameplan ? "note" : "step",
    });
  });

  return timings;
}

function interpolate(timings, startIndex = 0) {
  //Find first timestamp with villagers
  const isStep = (element) => element.type == "step";
  const hasTimestamp = (element) => element.startTime !== null;
  const hasVillagers = (element) => element.villagers;
  const firstValidStepIndex = timings.findIndex(
    (element, index) =>
      index == startIndex && isStep(element) && hasTimestamp(element) && hasVillagers(element)
  );

  //Find second timestamp
  const secondValidStepIndex = timings.findIndex(
    (element, index) =>
      index > firstValidStepIndex &&
      isStep(element) &&
      hasTimestamp(element) &&
      hasVillagers(element)
  );

  if (secondValidStepIndex == -1) {
    //Stop recursion if no more valid elements found
    return timings;
  } else {
    //Interpolate in between first and second match
    for (let index = firstValidStepIndex + 1; index < secondValidStepIndex; index++) {
      if (timings[index].type == "step") {
        const element = timings[index];
        const timediff =
          timings[secondValidStepIndex].startTime - timings[firstValidStepIndex].startTime;
        const villagersThisStep = element.villagerOffsetNextStep;
        const villagersTotal = timings[firstValidStepIndex].villagerOffsetNextValidStep;
        const referenceTimestamp = timings[index-1].startTime ? timings[index-1].startTime : timings[firstValidStepIndex].startTime;
        element.startTime = referenceTimestamp + (timediff * villagersThisStep) / villagersTotal;
      }
    }
    interpolate(timings, secondValidStepIndex);
  }

  //TODO: Integrate notes
  //Find notes
  //Take the last 10 seconds from the previous step:
  //notesStep.startTime=nextStep.startTime - 10

  return timings;
}
