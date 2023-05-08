export default function useOverlayConversion() {
  //Import AoE4_Overlay format
  const convertFromOverlayFormat = (build) => {
    const buildSteps = build.build_order?.map((step) =>
      convertStepFromOverlayFormat(step)
    );

    return {
      description: build.description || "",
      civ: mapCivilizations[build.civilization],
      title: build.name,
      author: build.author,
      steps: buildSteps,
      video: build.video || "",
      season: build.season || null,
      map: build.map || null,
      strategy: build.strategy || null
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

  const convertStepFromOverlayFormat = (step) => {
    //Filter @imagePath@
    const regex = /@([^@]*)@/g;
    const joinedNotes = step.notes.join("<br>");

    const convertedNotes = joinedNotes.replace(regex, function replacer(match) {
      return convertTextToImg(match);
    });

    return {
      ...(step.time && { time: step.time }),
      villagers: convertResourceFromOverlayFormat(step.villager_count),
      food: convertResourceFromOverlayFormat(step.resources.food),
      wood: convertResourceFromOverlayFormat(step.resources.wood),
      gold: convertResourceFromOverlayFormat(step.resources.gold),
      stone: convertResourceFromOverlayFormat(step.resources.stone),
      builders: convertResourceFromOverlayFormat(step.builder),
      description: convertedNotes,
    };
  };

  function convertTextToImg(imageText) {
    imageText = imageText.replaceAll("@", "");
    return '<img class="icon" src="/assets/pictures/' + imageText + '"></img>';
  }

  //Export AoE4_Overlay format
  const convertToOverlayFormat = (build) => {
    const overlay_steps = build.steps?.map((step) =>
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
      strategy: build.strategy || null
    };
  };

  function convertImagePathToText(imageElement) {
    //Get src
    const regex = /src\s*=\s*"(.+?)"/g;
    const matches = imageElement.match(regex);

    //Remove internal path extensions, ", and src=
    var imageSource = matches[0].replaceAll('"', "");
    imageSource = imageSource.replaceAll("src=", "");
    imageSource = imageSource.replace("https://aoe4guides.com", "");
    imageSource = imageSource.replace("/assets/pictures/", "");
    //Wrap with@
    return "@" + imageSource + "@";
  }

  const convertStepToOverlayFormat = (step) => {
    //Filter img elements
    step.description = step.description.replaceAll("&nbsp;", " ");
    step.description = step.description.replaceAll("</img>", "");
    const regex = /<img([\w\W]+?)>/g;
    const convertedDescription = step.description.replace(
      regex,
      function replacer(match) {
        return convertImagePathToText(match);
      }
    );

    const notes = convertedDescription.split("<br>").map((it) => it.trim());
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
        builder: parseInt(step.builders) || -1,
      },
      notes: notes,
    };
  };

  const download = (text, filename) => {
    const type = "text/plain";
    const blob = new Blob([text], { type });
    const e = document.createEvent("MouseEvents"),
      a = document.createElement("a");
    a.download = filename+".bo";
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
    e.initEvent(
      "click",
      true,
      false,
      window,
      0,
      0,
      0,
      0,
      0,
      false,
      false,
      false,
      false,
      0,
      null
    );
    a.dispatchEvent(e);
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

  return { convertToOverlayFormat, copyToClipboard, download, convertFromOverlayFormat };
}
