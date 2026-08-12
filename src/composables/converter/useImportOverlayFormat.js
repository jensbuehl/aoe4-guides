//Composables
import iconService from "@/composables/builds/icons/iconService.js";

export default function useImportOverlayFormat() {
  const convert = (build) => {
    const buildSteps = convertBuildOrder(build.build_order);

    return {
      description: build.description || "",
      civ: mapCivilizations[build.civilization],
      title: build.name,
      author: build.author,
      authorUid: "",
      sortTitle: "",
      steps: buildSteps,
      video: build.video || "",
      creatorId: null,
      creatorName: "",
      season: build.season || null,
      map: build.map || null,
      strategy: build.strategy || null,
      views: 0,
      likes: 0,
      upvotes: 0,
      downvotes: 0,
      score: 0,
      comments: 0,
      scoreAllTime: 0,
      isDraft: false,
      timeCreated: null,
      timeUpdated: null,
    };
  };

  /**
   * Turn the flat overlay step list into the internal section format.
   *
   * The overlay format tags each step with the age it belongs to, but it has no
   * notion of the steps performed *while* aging up. So the ages are recreated as
   * "age" sections and the "ageUp" sections between them are left empty for the
   * author to fill in. Exports without any age information keep the legacy shape
   * (one ageless section), so their roundtrip stays unchanged.
   *
   * Nothing is invented to fill an empty section: ages the export left blank stay
   * blank, and blank ages at the end are dropped rather than imported as a
   * trailing age with nothing in it.
   *
   * @param {Array} buildOrder - Steps in overlay format.
   * @return {Array} Sections in internal format.
   */
  function convertBuildOrder(buildOrder) {
    const overlaySteps = buildOrder ?? [];
    const legacySection = () => [
      {
        type: "age",
        age: 0,
        gameplan: "",
        steps: overlaySteps.map((step) => convertStep(step)),
      },
    ];

    if (!overlaySteps.some((step) => normalizeAge(step?.age))) return legacySection();

    //A step without an age of its own stays with the age it follows, and leading
    //ones fall back to the first age.
    const stepsByAge = new Map();
    let currentAge = 1;
    for (const step of overlaySteps) {
      currentAge = normalizeAge(step?.age) || currentAge;
      if (!stepsByAge.has(currentAge)) stepsByAge.set(currentAge, []);
      stepsByAge.get(currentAge).push(convertStep(step));
    }

    //Exports commonly end on an age the author never filled in — a bare "age 4"
    //entry with no notes. The build ends at the last age that actually says
    //something.
    const lastAge = Math.max(
      0,
      ...[...stepsByAge.entries()]
        .filter(([, steps]) => steps.some((step) => !isBlankStep(step)))
        .map(([age]) => age)
    );
    if (!lastAge) return legacySection();

    //The editor derives the current age from the number of "age" sections, so
    //the ages have to run 1..n without gaps even if the export skipped one. A
    //skipped age becomes an empty section rather than one holding a blank step.
    const sections = [];
    for (let age = 1; age <= lastAge; age++) {
      if (age > 1) {
        sections.push({ type: "ageUp", age: age - 1, gameplan: "", steps: [] });
      }
      sections.push({
        type: "age",
        age: age,
        gameplan: "",
        steps: stepsByAge.get(age) ?? [],
      });
    }
    return sections;
  }

  /**
   * A step the export carries but that holds nothing — no time, no resources, no
   * note. The overlay format writes one of these for an age the author only
   * opened.
   *
   * @param {Object} step - Step in internal format.
   * @return {boolean} True when the step says nothing at all.
   */
  function isBlankStep(step) {
    if (["time", "food", "wood", "gold", "stone", "builders"].some((field) => step[field])) {
      return false;
    }
    //Only line breaks are stripped — a note that is nothing but an icon is content
    return !(step.description ?? "")
      .replace(/<br\s*\/?>/gi, "")
      .replace(/&nbsp;/gi, " ")
      .trim();
  }

  /**
   * @param {*} age - Age as found on an overlay step.
   * @return {number} 1-4, or 0 when the step carries no usable age (the overlay
   * format writes -1 for "unknown").
   */
  function normalizeAge(age) {
    const parsed = Number(age);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 4 ? parsed : 0;
  }

  const convertResourceFromOverlayFormat = (resource) => {
    if (resource) {
      if (resource < 0) {
        //convert -1 to 0
        return "";
      }
      return resource.toString();
    } else {
      return "";
    }
  };

  const convertStep = (step) => {
    const convertedNotes = convertNotes(step.notes);
    const resources = step.resources ?? {};
    return {
      ...(step.time && { time: step.time }),
      food: convertResourceFromOverlayFormat(resources.food),
      wood: convertResourceFromOverlayFormat(resources.wood),
      gold: convertResourceFromOverlayFormat(resources.gold),
      stone: convertResourceFromOverlayFormat(resources.stone),
      //Builders live inside "resources" in the overlay format, next to the rest
      builders: convertResourceFromOverlayFormat(resources.builder),
      description: convertedNotes,
    };
  };

  function convertNotes(overlayNotes) {
    //Filter @imagePath@
    const regex = /@([^@]*)(?:webp|png)@/g;
    const joinedNotes = (overlayNotes ?? []).join("<br>");

    const convertedNotes = joinedNotes.replace(regex, function replacer(match) {
      return convertTextToImg(match);
    });

    return convertedNotes;
  }

  function convertTextToImg(imageText) {
    imageText = imageText.replaceAll("@", "");

    //Convert to aoe4guides path, if not from aoe4guides, then keep path as is. (e.g. from age4builder)
    const imagePath = imageText.includes("https")
      ? imageText.replace(/\.png\b/i, ".webp")
      : "/assets/pictures/" + imageText;

    //Get meta data
    const { getIconFromImgPath } = iconService();
    const iconMetaData = getIconFromImgPath(imagePath);

    //Initialize image data with fallback values, so that broken images do get messed up (e.g. Valdemar used to copy from age4builder)
    //getIconFromImgPath returns null when the path is in no vocabulary — an
    //import from another site is the normal way that happens, and this is the
    //caller that wants to keep the image rather than drop it.
    //Create image element
    const iconPath = iconMetaData?.imgSrc ? iconMetaData.imgSrc : imagePath;
    const tooltipText = iconMetaData?.title
      ? iconMetaData.title
      : "Image not found. Please make sure to not copy and paste images from other sources.";
    const iconClass = iconMetaData?.class
      ? "icon-" + iconMetaData.class
      : "icon";

    const img =
      '<img src="' +
      iconPath +
      '" class=' +
      iconClass +
      ' title="' +
      tooltipText +
      '"></img>';

    return img;
  }

  const mapCivilizations = {
  "Any Civilization": "ANY",
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
  //Sultans Ascend
  Byzantines: "BYZ",
  Japanese: "JAP",
  Ayyubids: "AYY",
  "Jeanne d'Arc": "JDA",
  "Zhu Xi's Legacy": "ZXL",
  "Order of the Dragon": "DRA",
  //Knights of Cross and Rose
  "House of Lancaster": "HOL",
  "Knights Templar": "KTE",
  //Dynasties of the East
  "Golden Horde": "GOH",
  "Macedonian Dynasty": "MAC",
  "Sengoku Daimyo": "SEN",
  "Tughlaq Dynasty": "TUG",
  //Jin Dynasty
  "Jin Dynasty": "JIN",
  };

  return {
    convertNotes,
    convert,
  };
}
