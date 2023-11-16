import useIconService from "../builds/useIconService.js";

export default function useImportOverlayFormat() {
  const convert = (build) => {
    //Do not convert ages since "age up" is not supported and the roundtrip would break
    const buildSteps = [
      {
        type: "age",
        age: 0,
        steps: build.build_order?.map((step) => convertStep(step)),
      },
    ];
    var match_ups = [];
    match_ups = build.matchup?.map((matchup) => mapCivilizations[matchup]);

    return {
      description: build.description || "",
      civ: mapCivilizations[build.civilization],
      matchup: match_ups || [],
      title: build.name,
      author: build.author,
      steps: buildSteps,
      video: build.video || "",
      season: build.season || null,
      map: build.map || null,
      strategy: build.strategy || null,
    };
  };

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
    return {
      ...(step.time && { time: step.time }),
      food: convertResourceFromOverlayFormat(step.resources.food),
      wood: convertResourceFromOverlayFormat(step.resources.wood),
      gold: convertResourceFromOverlayFormat(step.resources.gold),
      stone: convertResourceFromOverlayFormat(step.resources.stone),
      builders: convertResourceFromOverlayFormat(step.builder),
      description: convertedNotes,
    };
  };

  function convertNotes(overlayNotes) {
    //Filter @imagePath@
    const regex = /@([^@]*)png@/g;
    const joinedNotes = overlayNotes.join("<br>");

    const convertedNotes = joinedNotes.replace(regex, function replacer(match) {
      return convertTextToImg(match);
    });

    return convertedNotes;
  }

  function convertTextToImg(imageText) {
    imageText = imageText.replaceAll("@", "");

    //Convert to aoe4guides path, if not from aoe4guides, then keep path as is. (e.g. from age4builder)
    const imagePath = imageText.includes("https")
      ? imageText
      : "/assets/pictures/" + imageText;

    //Get meta data
    const { getIconFromImgPath } = useIconService();
    const iconMetaData = getIconFromImgPath(imagePath);

    //Initialize image data with fallback values, so that broken images do get messed up (e.g. Valdemar used to copy from age4builder)
    //Create image element
    const iconPath = iconMetaData.imgSrc ? iconMetaData.imgSrc : imagePath;
    const tooltipText = iconMetaData.title
      ? iconMetaData.title
      : "Image not found. Please make sure to not copy and paste images from other sources.";
    const iconClass = iconMetaData.class
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
    "Order of the Dragon": "DRA"
  };

  return {
    convertNotes,
    convert,
  };
}
