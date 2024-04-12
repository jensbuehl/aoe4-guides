export function getTimings(steps) {
  var timings = [];

  timings = init(timings, steps);

  return timings;
}

export function toDate(timeString) {
  timeString = timeString ? timeString : "00:00"; //TODO: support other string formats!
  let splitTime = timeString.split(":");
  let dateTime = new Date();
  dateTime.setMinutes(splitTime[0]);
  dateTime.setSeconds(splitTime[1]);
  return dateTime;
}

export function getFormattedTime(time) {
  var timeString = time?.toTimeString();
  return timeString ? timeString.split(" ")[0].substring(3) : "00:00";
}

function getVillagerDiffToNext(steps, stepIndex) {
  //skip notes
  var offset = 1;
  if(steps[stepIndex + offset]?.gameplan){
    offset = 2
  }

  var currentStepVillagerCount = aggregateVillagers(steps[stepIndex]);
  var nextStepVillagerCount = aggregateVillagers(steps[stepIndex + offset]);
  
  return nextStepVillagerCount - currentStepVillagerCount;
}

function getVillagerDiffToNextTimeStamp(steps, stepIndex) {}

function getTimeDiffToNextTimeStamp(steps, stepIndex) {}

function isLastStep(stepIndex) {}

function findNextTimeStamp(steps, stepIndex) {}

function aggregateVillagers(step) {
  const builders = parseInt(step?.builders) || 0;
  const food = parseInt(step?.food) || 0;
  const wood = parseInt(step?.wood) || 0;
  const gold = parseInt(step?.gold) || 0;
  const stone = parseInt(step?.stone) || 0;

  return builders + food + wood + gold + stone || "";
}

function toSeconds(date) {
  return date.getMinutes() * 60 + date.getSeconds();
}

function init(timings, steps) {
  steps.forEach((step, index) => {
    timings.push({
      startTime: toSeconds(toDate(step.time)),
      totalTime: 0,
      type: step.gameplan ? "note" : "step",
      timeDiff: step.gameplan ? 0 : getTimeDiffToNextTimeStamp(steps, index),
      vilDiffNext: step.gameplan ? 0 : getVillagerDiffToNext(steps, index),
      villDiff: step.gameplan ? 0 : getVillagerDiffToNextTimeStamp(steps, index),
    });
  });
  for (const step in steps) {
    
  }

  return timings;
}
