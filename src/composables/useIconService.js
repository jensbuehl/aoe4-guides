import { ref } from "vue";

export default function useIconService(civArg) {
  const civ = ref(civArg);

  const getIcons = (category) => {
    var allIcons = [];

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
      civ: ["ENG","FRE","RUS","MAL","MON","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Feudal Age",
      age: "2",
      imgSrc: "/assets/pictures/age/age_2.png",
      civ: ["ENG","FRE","RUS","MAL","MON","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Castle Age",
      age: "3",
      imgSrc: "/assets/pictures/age/age_3.png",
      civ: ["ENG","FRE","RUS","MAL","MON","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Imperial Age",
      age: "4",
      imgSrc: "/assets/pictures/age/age_4.png",
      civ: ["ENG","FRE","RUS","MAL","MON","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Unknown Age",
      age: "1",
      imgSrc: "/assets/pictures/age/age_unknown.png",
      civ: ["ENG","FRE","RUS","MAL","MON","ABB","OTT","CHI","DEL","HRE"],
    },
  ];

  const landmark = [
    {
      title: "Abbey of Kings",
      age: "1",
      imgSrc: "/assets/pictures/landmark_english/abbey-of-kings.png",
      civ: ["ENG"],
    },
    {
      title: "Council Hall",
      age: "1",
      imgSrc: "/assets/pictures/landmark_english/council-hall.png",
      civ: ["ENG"],
    },
    {
      title: "King's Palace",
      age: "2",
      imgSrc: "/assets/pictures/landmark_english/kings-palace.png",
      civ: ["ENG"],
    },
    {
      title: "The White Tower",
      age: "2",
      imgSrc: "/assets/pictures/landmark_english/the-white-tower.png",
      civ: ["ENG"],
    },
    {
      title: "Wynguard Palace",
      age: "3",
      imgSrc: "/assets/pictures/landmark_english/wynguard-palace.png",
      civ: ["ENG"],
    },
    {
      title: "Berkshire Palace",
      age: "3",
      imgSrc: "/assets/pictures/landmark_english/berkshire-palace.png",
      civ: ["ENG"],
    },
    {
      title: "Cathedral of St. Thomas",
      age: "4",
      imgSrc: "/assets/pictures/landmark_english/cathedral-of-st-thomas.png",
      civ: ["ENG"],
    },
    {
      title: "House of Wisdom",
      age: "1",
      imgSrc: "/assets/pictures/landmark_abbasid/house-of-wisdom.png",
      civ: ["ABB"],
    },
    {
      title: "Culture Wing",
      age: "1",
      imgSrc: "/assets/pictures/landmark_abbasid/culture-wing.png",
      civ: ["ABB"],
    },
    {
      title: "Economic Wing",
      age: "1",
      imgSrc: "/assets/pictures/landmark_abbasid/economic-wing.png",
      civ: ["ABB"],
    },
    {
      title: "Military Wing",
      age: "1",
      imgSrc: "/assets/pictures/landmark_abbasid/military-wing.png",
      civ: ["ABB"],
    },
    {
      title: "Trade Wing",
      age: "1",
      imgSrc: "/assets/pictures/landmark_abbasid/trade-wing.png",
      civ: ["ABB"],
    },
    {
      title: "Imperial Academy",
      age: "1",
      imgSrc: "/assets/pictures/landmark_chinese/imperial-academy.png",
      civ: ["CHI"],
    },
    {
      title: "Barbican of the Sun",
      age: "1",
      imgSrc: "/assets/pictures/landmark_chinese/barbican-of-the-sun.png",
      civ: ["CHI"],
    },
    {
      title: "Astronomical Clocktower",
      age: "2",
      imgSrc: "/assets/pictures/landmark_chinese/astronomical-clocktower.png",
      civ: ["CHI"],
    },
    {
      title: "Imperial Palace",
      age: "2",
      imgSrc: "/assets/pictures/landmark_chinese/imperial-palace.png",
      civ: ["CHI"],
    },
    {
      title: "Great Wall Gatehouse",
      age: "3",
      imgSrc: "/assets/pictures/landmark_chinese/great-wall-gatehouse.png",
      civ: ["CHI"],
    },
    {
      title: "Spirit Way",
      age: "3",
      imgSrc: "/assets/pictures/landmark_chinese/spirit-way.png",
      civ: ["CHI"],
    },
    {
      title: "Dome of the Faith",
      age: "1",
      imgSrc: "/assets/pictures/landmark_delhi/dome-of-the-faith.png",
      civ: ["DEL"],
    },
    {
      title: "Tower of Victory",
      age: "1",
      imgSrc: "/assets/pictures/landmark_delhi/tower-of-victory.png",
      civ: ["DEL"],
    },
    {
      title: "Compound of the Defender",
      age: "2",
      imgSrc: "/assets/pictures/landmark_delhi/compound-of-the-defender.png",
      civ: ["DEL"],
    },
    {
      title: "House of Learning",
      age: "2",
      imgSrc: "/assets/pictures/landmark_delhi/house-of-learning.png",
      civ: ["DEL"],
    },
    {
      title: "Hisar Academy",
      age: "3",
      imgSrc: "/assets/pictures/landmark_delhi/hisar-academy.png",
      civ: ["DEL"],
    },
    {
      title: "Palace of the Sultan",
      age: "3",
      imgSrc: "/assets/pictures/landmark_delhi/palace-of-the-sultan.png",
      civ: ["DEL"],
    },
    {
      title: "Great Palace of Agra",
      age: "4",
      imgSrc: "/assets/pictures/landmark_delhi/great-palace-of-agra.png",
      civ: ["DEL"],
    },
    {
      title: "Enclave of the Emperor",
      age: "4",
      imgSrc: "/assets/pictures/landmark_chinese/enclave-of-the-emperor.png",
      civ: ["CHI"],
    },
    {
      title: "Great Mosque of Kairouan",
      age: "4",
      imgSrc: "/assets/pictures/landmark_abbasid/prayer-hall-of-uqba.png",
      civ: ["ABB"],
    },
  ];

  const tech_eco = [
    {
      title: "Wheelbarrow",
      age: "1",
      imgSrc: "/assets/pictures/technology_economy/wheelbarrow.png",
      civ: ["ENG","FRE","RUS","MAL","MON","ABB","OTT","CHI","DEL","HRE"],
    },
  ];

  const tech_military = [
    {
      title: "Angled Surfaces",
      age: "1",
      imgSrc: "/assets/pictures/technology_military/angled-surfaces.png",
      civ: ["ENG","FRE","RUS","MAL","MON","ABB","OTT","CHI","DEL","HRE"],
    },
  ];

  const building_religious = [
    {
      title: "Monastery",
      age: "3",
      imgSrc: "/assets/pictures/building_religious/monastery.png",
      civ: ["ENG","FRE","RUS","CHI","HRE"],
    },
    {
      title: "Mosque",
      age: "3",
      imgSrc: "/assets/pictures/building_religious/mosque.png",
      civ: ["ABB","DEL","MAL","OTT"],
    },
    {
      title: "Prayer Tent",
      age: "3",
      imgSrc: "/assets/pictures/building_mongols/prayer-tent.png",
      civ: ["MON"],
    },
    {
      title: "Pagoda",
      age: "3",
      imgSrc: "/assets/pictures/building_chinese/pagoda.png",
      civ: ["CHI"],
    },
  ];

  const building_eco = [
    {
      title: "Farm",
      age: "1",
      imgSrc: "/assets/pictures/building_economy/farm.png",
      civ: ["ENG","FRE","RUS","MAL","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "House",
      age: "1",
      imgSrc: "/assets/pictures/building_economy/house.png",
      civ: ["ENG","FRE","RUS","MAL","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Lumber Camp",
      age: "1",
      imgSrc: "/assets/pictures/building_economy/lumber-camp.png",
      civ: ["ENG","FRE","RUS","MAL","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Mining Camp",
      age: "1",
      imgSrc: "/assets/pictures/building_economy/mining-camp.png",
      civ: ["ENG","FRE","RUS","MAL","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Mill",
      age: "1",
      imgSrc: "/assets/pictures/building_economy/mill.png",
      civ: ["ENG","FRE","MAL","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Pit Mine",
      age: "1",
      imgSrc: "/assets/pictures/building_malians/pit-mine-1.png",
      civ: ["MAL"],
    },
    {
      title: "Ger",
      age: "1",
      imgSrc: "/assets/pictures/building_mongols/ger.png",
      civ: ["MON"],
    },
    {
      title: "Pasture",
      age: "1",
      imgSrc: "/assets/pictures/building_mongols/pasture.png",
      civ: ["MON"],
    },
    {
      title: "Ovoo",
      age: "1",
      imgSrc: "/assets/pictures/building_mongols/ovoo.png",
      civ: ["MON"],
    },
    {
      title: "Hunting Cabin",
      age: "1",
      imgSrc: "/assets/pictures/building_rus/hunting-cabin.png",
      civ: ["RUS"],
    },
    {
      title: "Town Center",
      age: "2",
      imgSrc: "/assets/pictures/building_economy/town-center.png",
      civ: ["ENG","FRE","RUS","MON","MAL","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Market",
      age: "2",
      imgSrc: "/assets/pictures/building_economy/market.png",
      civ: ["ENG","FRE","RUS","MON","MAL","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Village",
      age: "2",
      imgSrc: "/assets/pictures/building_chinese/village.png",
      civ: ["CHI"],
    },
    {
      title: "Granary",
      age: "2",
      imgSrc: "/assets/pictures/building_chinese/granary.png",
      civ: ["CHI"],
    },
    {
      title: "Cattle Ranch",
      age: "2",
      imgSrc: "/assets/pictures/building_malians/cattle-ranch-2.png",
      civ: ["MAL"],
    },
  ];

  const building_tech = [
    {
      title: "Ovoo",
      age: "1",
      imgSrc: "/assets/pictures/building_mongols/ovoo.png",
      civ: ["MON"],
    },
    {
      title: "Blacksmith",
      age: "2",
      imgSrc: "/assets/pictures/building_technology/blacksmith.png",
      civ: ["ENG","FRE","RUS","MAL","MON","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "University",
      age: "2",
      imgSrc: "/assets/pictures/building_technology/university.png",
      civ: ["ENG","FRE","RUS","OTT","CHI","HRE"],
    },
    {
      title: "Madrasa",
      age: "2",
      imgSrc: "/assets/pictures/building_technology/madrasa.png",
      civ: ["MAL","ABB","DEL"],
    },
  ];

  const building_military = [
    {
      title: "Barracks",
      age: "1",
      imgSrc: "/assets/pictures/building_military/barracks.png",
      civ: ["ENG","FRE","RUS","MAL","MON","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Military School",
      age: "1",
      imgSrc: "/assets/pictures/building_ottomans/military-school-1.png",
      civ: ["OTT"],
    },
    {
      title: "Dock",
      age: "1",
      imgSrc: "/assets/pictures/building_military/dock.png",
      civ: ["ENG","FRE","RUS","MAL","MON","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Archery Range",
      age: "2",
      imgSrc: "/assets/pictures/building_military/archery-range.png",
      civ: ["ENG","FRE","RUS","MAL","MON","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Stable",
      age: "2",
      imgSrc: "/assets/pictures/building_military/stable.png",
      civ: ["ENG","FRE","RUS","MAL","MON","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Siege Workshop",
      age: "3",
      imgSrc: "/assets/pictures/building_military/siege-workshop.png",
      civ: ["ENG","FRE","RUS","MAL","MON","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Keep",
      age: "3",
      imgSrc: "/assets/pictures/building_defensive/keep.png",
      civ: ["ENG","FRE","RUS","MAL","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Outpost",
      age: "1",
      imgSrc: "/assets/pictures/building_defensive/outpost.png",
      civ: ["ENG","FRE","MON","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Toll Outpost",
      age: "1",
      imgSrc: "/assets/pictures/building_malians/toll-outpost-1.png",
      civ: ["MAL"],
    },
    {
      title: "Palisade Gate",
      age: "1",
      imgSrc: "/assets/pictures/building_defensive/palisade-gate.png",
      civ: ["ENG","FRE","MAL","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Palisade Wall",
      age: "1",
      imgSrc: "/assets/pictures/building_defensive/palisade-wall.png",
      civ: ["ENG","FRE","MAL","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Wooden Fortress",
      age: "1",
      imgSrc: "/assets/pictures/building_rus/wooden-fortress.png",
      civ: ["RUS"],
    },
    {
      title: "Fortified Palisade Gate",
      age: "1",
      imgSrc: "/assets/pictures/building_rus/fortified-palisade-gate.png",
      civ: ["RUS"],
    },
    {
      title: "Fortified Palisade Wall",
      age: "1",
      imgSrc: "/assets/pictures/building_rus/fortified-palisade-wall.png",
      civ: ["RUS"],
    },
    {
      title: "Stone Wall Gate",
      age: "3",
      imgSrc: "/assets/pictures/building_defensive/stone-wall-gate.png",
      civ: ["ENG","FRE","RUS","MAL","ABB","OTT","CHI","DEL","HRE"],
    },
    {
      title: "Stone Wall Tower",
      age: "3",
      imgSrc: "/assets/pictures/building_defensive/stone-wall-tower.png",
      civ: ["ENG","FRE","RUS","MAL","ABB","OTT","CHI","DEL","HRE"],
    },
  ];

  const unit_religious = [
    {
      title: "Monk",
      age: "3",
      imgSrc: "/assets/pictures/unit_religious/monk-3.png",
      civ: ["ENG","FRE","RUS","MAL","MON","ABB","OTT","CHI","DEL","HRE"],
    },
  ];

  const unit_military = [
    {
      title: "Archer",
      age: "2",
      imgSrc: "/assets/pictures/unit_infantry/archer-2.png",
      civ: ["ENG","FRE","RUS","MAL","MON","ABB","OTT","CHI","DEL","HRE"],
    },
  ];

  const unit_eco = [
    {
      title: "Villager",
      age: "1",
      imgSrc: "/assets/pictures/unit_worker/villager.png",
      civ: ["ENG","FRE","RUS","MAL","MON","ABB","OTT","CHI","DEL","HRE"],
    },
  ];

  return { getIcons };
}
