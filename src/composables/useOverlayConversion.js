export default function useOverlayConversion() {
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

  const convertStepToOverlayFormat = (step) => {
    return {
      age: -1, //not supported
      population_count: -1, //not supported
      ...(step.time && {time: step.time}),
      villager_count: parseInt(step.villagers) || -1,
      resources: {
        food: parseInt(step.food) || 0,
        wood: parseInt(step.wood) || 0,
        gold: parseInt(step.gold) || 0,
        stone: parseInt(step.stone) || 0,
        builders: parseInt(step.builders) || -1,
      },     
      notes: [step.description],
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
  };

  return { convertToOverlayFormat, copyToClipboard };
}
