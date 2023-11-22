export default function useExportOverlayFormat() {
  const convert = (build) => {
    var steps;
    if (build.steps[0]?.type) {
      steps = convertSectionsToSteps(build.steps);
    } else {
      steps = build.steps;
    }
    const overlay_steps = steps?.map((step) =>
      convertStepToOverlayFormat(step)
    );

    const match_ups = build.matchup?.map(
      (matchup) => mapCivilizations[matchup]
    );

    return {
      description: build.description,
      civilization: mapCivilizations[build.civ],
      matchup: match_ups,
      name: build.title,
      author: build.author,
      source: window.location.href,
      build_order: overlay_steps,
      video: build.video,
      season: build.season || null,
      map: build.map || null,
      strategy: build.strategy || null,
    };
  };

  function convertSectionsToSteps(sections) {
    var steps = [];
    sections?.forEach((section) => {
      section.steps?.forEach((step) => {
        if (section.age && section.age > 0) step.age = section.age;
      });
      steps = steps.concat(section.steps);
    });
    return steps;
  }

  function convertImagePathToText(imageElement) {
    //Get src
    const regex = /src\s*=\s*"(.+?)"/g;
    const matches = imageElement.match(regex);

    //Remove internal path extensions, ", and src=
    var imageSource = matches[0].replaceAll('"', "");
    imageSource = imageSource.replaceAll("src=", "");

    imageSource = imageSource.replace("http://localhost:5173", "");
    imageSource = imageSource.replace("https://aoe4guides.com", "");
    imageSource = imageSource.replace("/assets/pictures/", "");
    //Wrap with@
    return "@" + imageSource + "@";
  }

  const aggregateVillagers = (step) => {
    const builders = parseInt(step.builders) || 0;
    const food = parseInt(step.food) || 0;
    const wood = parseInt(step.wood) || 0;
    const gold = parseInt(step.gold) || 0;
    const stone = parseInt(step.stone) || 0;

    return builders + food + wood + gold + stone || -1;
  };

  const convertStepToOverlayFormat = (step) => {
    const notes = convertDescription(step.description);
    return {
      age: step.age > 0 ? step.age : -1,
      population_count: -1, //not supported
      ...(step.time && { time: step.time }),
      villager_count: aggregateVillagers(step),
      resources: {
        food: parseInt(step.food) || 0,
        wood: parseInt(step.wood) || 0,
        gold: parseInt(step.gold) || 0,
        stone: parseInt(step.stone) || 0,
        builder: parseInt(step.builders) || -1,
      },
      notes: notes,
    };
  };

  function convertDescription(description) {
    //Filter img elements
    description = description.replaceAll("&amp;", "&");
    description = description.replaceAll("&nbsp;", " ");
    description = description.replaceAll("&gt;", ">");
    description = description.replaceAll("</img>", "");
    const regex = /<img([\w\W]+?)>/g;
    const convertedDescription = description.replace(
      regex,
      function replacer(match) {
        return convertImagePathToText(match);
      }
    );

    //deprecated versions, keep for compatibility
    var notes = convertedDescription.split("<br>").map((it) => it.trim());
    notes = convertedDescription.split("\n").map((it) => it.trim());
    //new versions
    var notes = convertedDescription.split("<br />").map((it) => it.trim());
    return notes;
  }

  const mapCivilizations = {
    ANY: "Any Civilization",
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
    //Sultans Ascend
    BYZ: "Byzantines",
    JAP: "Japanese",
    AYY: "Ayyubids",
    JDA: "Jeanne d'Arc",
    ZXL: "Zhu Xi's Legacy",
    DRA: "Order of the Dragon"
  };

  return {
    convertDescription,
    convert,
  };
}
