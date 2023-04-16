import { ref } from "vue";

export default function useIconService(civArg) {
  const civ = ref(civArg);
  const getIcons = (category) => {
    var allIcons = [];
    //TODO: Filter
    switch (category) {
      case "general":
        allIcons = general;
        break;
      case "landmark":
        allIcons = landmark;
        break;
      case "tech_eco":
        allIcons = tech_eco;
        break;
      case "tech_military":
        allIcons = tech_military;
        break;
      case "building_religious":
        allIcons = building_religious;
        break;
      case "building_eco":
        allIcons = building_eco;
        break;
      case "building_tech":
        allIcons = building_tech;
        break;
      case "building_military":
        allIcons = building_military;
        break;
      case "unit_religious":
        allIcons = unit_religious;
        break;
      case "unit_military":
        allIcons = unit_military;
        break;
      case "unit_eco":
        allIcons = unit_eco;
        break;
      default:
        allIcons = general
          .concat(landmark)
          .concat(tech_eco)
          .concat(tech_military)
          .concat(building_religious)
          .concat(building_eco)
          .concat(building_tech)
          .concat(building_military)
          .concat(unit_religious)
          .concat(unit_military)
          .concat(unit_eco);
          break;
    }

    if (civ.value) {
      return allIcons.filter((icon) => icon.civ.includes(civ.value));
    } else {
      return allIcons;
    }
  };

  const general = [
    {
      title: "Dark Age",
      age: "1",
      imgSrc: "/assets/pictures/age/age_1.png",
      civ: ["ENG"],
    },
    {
      title: "Feudal Age",
      age: "2",
      imgSrc: "/assets/pictures/age/age_2.png",
      civ: ["ENG"],
    },
    {
      title: "Castle Age",
      age: "3",
      imgSrc: "/assets/pictures/age/age_3.png",
      civ: ["ENG"],
    },
    {
      title: "Imperial Age",
      age: "4",
      imgSrc: "/assets/pictures/age/age_4.png",
      civ: ["ENG"],
    },
    {
      title: "Unknown Age",
      age: "1",
      imgSrc: "/assets/pictures/age/age_unknown.png",
      civ: ["ENG"],
    },
  ];

  const landmark = [
    {
      title: "Abbey of Kings",
      age: "1",
      imgSrc: "/assets/pictures/landmark_english/abbey-of-kings.png",
      civ: ["ENG"],
    },
  ];

  const tech_eco = [
    {
      title: "Wheelbarrow",
      age: "1",
      imgSrc: "/assets/pictures/technology_economy/wheelbarrow.png",
      civ: ["ENG"],
    },
  ];

  const tech_military = [
    {
      title: "Angled Surfaces",
      age: "1",
      imgSrc: "/assets/pictures/technology_military/angled-surfaces.png",
      civ: ["ENG"],
    },
  ];

  const building_religious = [
    {
      title: "Dark Age",
      age: "1",
      imgSrc: "/assets/pictures/building_religious/monastery.png",
      civ: ["ENG"],
    },
  ];

  const building_eco = [
    {
      title: "Dark Age",
      age: "1",
      imgSrc: "/assets/pictures/building_economy/farm.png",
      civ: ["ENG"],
    },
  ];

  const building_tech = [
    {
      title: "Dark Age",
      age: "1",
      imgSrc: "/assets/pictures/building_technology/blacksmith.png",
      civ: ["ENG"],
    },
  ];

  const building_military = [
    {
      title: "Archery Range",
      age: "2",
      imgSrc: "/assets/pictures/building_military/archery-range.png",
      civ: ["ENG"],
    },
    {
      title: "Barracks",
      age: "1",
      imgSrc: "/assets/pictures/building_military/barracks.png",
      civ: ["ENG"],
    },
    {
      title: "Dock",
      age: "1",
      imgSrc: "/assets/pictures/building_military/dock.png",
      civ: ["ENG"],
    },
    {
      title: "Siege Workshop",
      age: "3",
      imgSrc: "/assets/pictures/building_military/siege-workshop.png",
      civ: ["ENG"],
    },
    {
      title: "Stable",
      age: "2",
      imgSrc: "/assets/pictures/building_military/stable.png",
      civ: ["ENG"],
    },
  ];

  const unit_religious = [
    {
      title: "Monk",
      age: "3",
      imgSrc: "/assets/pictures/unit_religious/monk-3.png",
      civ: ["ENG"],
    },
  ];

  const unit_military = [
    {
      title: "Archer",
      age: "2",
      imgSrc: "/assets/pictures/unit_infantry/archer-2.png",
      civ: ["ENG"],
    },
  ];

  const unit_eco = [
    {
      title: "Villager",
      age: "1",
      imgSrc: "/assets/pictures/unit_worker/villager.png",
      civ: ["ENG"],
    },
  ];

  return { getIcons };
}
