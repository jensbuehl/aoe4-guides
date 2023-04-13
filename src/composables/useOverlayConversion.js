export default function useOverlayConversion() {
  const convertFromOverlayFormat = (build) => {
    const buildSteps = build.build_order?.map((step) =>
      convertStepFromOverlayFormat(step)
    );

    return {
      civ: mapCivilizations[build.civilization],
      title: build.name,
      author: build.author,
      steps: buildSteps,
    };
  };

  const convertStepFromOverlayFormat = (step) => {
    //TODO: Parse and add images to description
    const regex = /@([^@]*)@/g
    const joinedNotes = step.notes.join("<br>")
    const matches = joinedNotes.match(regex);
    console.log("matches", matches)

    //console.log("joinedNotes", joinedNotes)
    const convertedNotes = joinedNotes.replace(regex, function replacer(match, p1, p2, /* …, */ pN, offset, string, groups) {
      //console.log(match)
      const replacement = convertTextToImg(match);
      return replacement;
    })
    return {
      ...(step.time && { time: step.time }),
      villagers: step.villager_count?.toString(),
      food: step.resources.food?.toString(),
      wood: step.resources.wood?.toString(),
      gold: step.resources.gold?.toString(),
      stone: step.resources.stone?.toString(),
      builders: step.resources.builders?.toString() || "",
      description: convertedNotes,
    };
  };

  const convertToOverlayFormat = (build) => {
    const overlay_steps = build.steps?.map((step) =>
      convertStepToOverlayFormat(step)
    );

    return {
      civilization: mapCivilizations[build.civ],
      name: build.title,
      author: build.author,
      source: window.location.href,
      build_order: overlay_steps,
    };
  };

  function convertImageToText(imagePath) {
    //TODO
  }

  function convertImagePathToText(imagePath) {

    return " @" + imagePath + "@ ";
  }

  function convertTextToImg(imageText) {
    return "<img class=\"icon\" src=/assets/pictures/"+imageText.replaceAll('@', '')+"></img>";
  }

  const convertStepToOverlayFormat = (step) => {
    //TODO: Parse and replace images from notes

    const notes = step.description.split("<br>").map((it) => it.trim());
    return {
      age: -1, //not supported
      population_count: -1, //not supported
      ...(step.time && { time: step.time }),
      villager_count: parseInt(step.villagers) || -1,
      resources: {
        food: parseInt(step.food) || 0,
        wood: parseInt(step.wood) || 0,
        gold: parseInt(step.gold) || 0,
        stone: parseInt(step.stone) || 0,
        builders: parseInt(step.builders) || -1,
      },
      notes: notes,
    };
  };

  const copyToClipboard = (text) => {
    navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
      if (result.state === "granted") {
        const type = "text/plain";
        const blob = new Blob([text], { type });
        let data = [new ClipboardItem({ [type]: blob })];
        navigator.clipboard.write(data).then(
          function () {
            console.log("Copied to clipboard successfully!");
          },
          function (err) {
            console.error("Unable to write to clipboard.", err);
          }
        );
      }
    });
  };

  const mapCivilizations = {
    ENG: "English",
    FRE: "French",
    RUS: "Rus",
    MAL: "Malians",
    DEL: "Delhi Sultanate",
    HRE: "Holy Roman Empire",
    ABB: "Abbasid Dynasty",
    OTT: "Ottomans",
    CHI: "Chinese",
    MON: "Mongols",
    English: "ENG",
    French: "FRE",
    Rus: "RUS",
    Malians: "MAL",
    "Delhi Sultanate": "DEL",
    "Holy Roman Empire": "HRE",
    "Abbasid Dynasty": "ABB",
    Ottomans: "OTT",
    Chinese: "CHI",
    Mongols: "MON",
  };

  return { convertToOverlayFormat, copyToClipboard, convertFromOverlayFormat };
}
