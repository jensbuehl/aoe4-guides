import { aggregateVillagers } from "@/composables/builds/villagerAggregator.js";
import { flattenSections, sectionOffsets } from "@/composables/builds/useAgeTimings.js";
import { hasVisibleContent } from "@/composables/builds/stepVisibility.js";

export default function useExportOverlayFormat() {
  /**
   * @param {Object} build - The build, in document shape.
   * @param {Object} [selection] - Map of blockId to chosen path index. The
   *   overlay has no notion of a fork, so one path has to be picked before the
   *   build leaves the site; omitted, every block exports its main path or its
   *   first, which is what a reader who chose nothing was shown.
   */
  const convert = (build, selection) => {
    var steps;
    if (build.steps[0]?.type) {
      steps = convertSectionsToSteps(build.steps, selection);
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

  /**
   * The build as one straight run of steps, with the age of the section each sits
   * in stamped on it.
   *
   * Flatten first, then stamp. Stamping first walked `section.steps` as though
   * every entry were a step, so a block was stamped as an object — and the steps
   * *inside* it, which are the ones that get exported, were never stamped at all
   * and left with the overlay's "no age". That is the same trap the flattener
   * exists to close, so this reads the flat list and slices it by section.
   *
   * Slicing to the next offset, never to `section.steps.length`: with a block in
   * it a section contributes the active path's step count, not its entry count.
   *
   * Nothing here mutates the build. The old loop wrote `age` onto the author's
   * own step objects as a side effect of exporting.
   *
   * @param {Array} sections - The build's sections.
   * @param {Object} [selection] - Map of blockId to chosen path index.
   * @return {Array} Flat steps, aged, blocks resolved to one path.
   */
  function convertSectionsToSteps(sections, selection) {
    const flat = flattenSections(sections, selection);
    const offsets = sectionOffsets(sections, selection);
    const aged = [];

    (sections ?? []).forEach((section, sectionIndex) => {
      const end = offsets[sectionIndex + 1] ?? flat.length;
      for (let index = offsets[sectionIndex]; index < end; index++) {
        const step = flat[index];
        aged.push(section?.age > 0 ? { ...step, age: section.age } : step);
      }
    });

    //A path's condition is a note, and an author who never wrote one leaves an
    //empty note behind. It would export as a step with no time, no villagers and
    //no text — a row the overlay counts and the player cannot use.
    return aged.filter((step) => !isEmptyNote(step));
  }

  /**
   * Whether an entry is a note with nothing in it.
   *
   * Only notes are tested. A *step* with no description is still a step — its
   * villager distribution is the instruction — but a note is nothing but its
   * text, so an empty one is nothing at all.
   *
   * @param {Object} step - A flattened entry.
   * @return {boolean} True when it would export as a blank row.
   */
  function isEmptyNote(step) {
    if (step?.gameplan === undefined || step?.description !== undefined) return false;

    return !hasVisibleContent(step.gameplan);
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
