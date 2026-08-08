import { aggregateVillagers } from "@/composables/builds/villagerAggregator.js";
import { flattenSections } from "@/composables/builds/useAgeTimings.js";

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

    return {
      description: build.description,
      civilization: mapCivilizations[build.civ],
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

  //Stamp each step with the age of the section it sits in, then flatten through
  //the shared flattener rather than a private loop. A step carries no age of its
  //own, so the stamping has to happen while the sections are still in view — but
  //that is the only thing this needs the sections for, which leaves flattening
  //to the one function that owns it.
  function convertSectionsToSteps(sections) {
    sections?.forEach((section) => {
      section.steps?.forEach((step) => {
        if (section.age && section.age > 0) step.age = section.age;
      });
    });

    return flattenSections(sections);
  }

  function convertImagePathToText(imageElement) {
    //Get src
    const regex = /src\s*=\s*"(.+?)"/g;
    const matches = imageElement.match(regex);
    if (matches[0]) {
      //Remove internal path extensions, ", and src=
      var imageSource = matches[0].replaceAll('"', "");
      imageSource = imageSource.replaceAll("src=", "");

      imageSource = imageSource.replace("http://localhost:5173", "");
      imageSource = imageSource.replace("https://aoe4guides.com", "");
      imageSource = imageSource.replace("/assets/pictures/", "");
      //Wrap with@
      return "@" + imageSource + "@";
    }
  }

  const convertStepToOverlayFormat = (step) => {
    //A note carries its text in `gameplan` and has no description at all, so
    //reading only the description exported it as a blank step: no time, no
    //villagers, and empty notes. The overlay has no notion of a note, but it
    //does have notes, which is where the text belongs.
    const notes = convertDescription(step.description || step.gameplan || "");
    const time = step.time?.replaceAll("<br>", "");
    return {
      age: step.age > 0 ? step.age : -1,
      population_count: -1, //not supported
      ...(time && { time: time }),
      villager_count: aggregateVillagers(step) || -1,
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
    description = description.replaceAll(".png", ".webp");
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
  DRA: "Order of the Dragon",
  //Knights of Cross and Rose
  HOL: "House of Lancaster",
  KTE: "Knights Templar",
  //Dynasties of the East
  GOH: "Golden Horde",
  MAC: "Macedonian Dynasty",
  SEN: "Sengoku Daimyo",
  TUG: "Tughlaq Dynasty",
  //Jin Dynasty
  JIN: "Jin Dynasty",
  };

  return {
    convertDescription,
    convert,
  };
}
