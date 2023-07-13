import { ref } from "vue";

export default function useIconService(civArg) {
  const civ = ref(civArg);

  //Exported methods
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
      case "resource":
        allIcons = resource;
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

  const getIconFromImgPath = (imgPath) => {
    var allIcons = getIcons();
    const match = allIcons.find(icon => icon.imgSrc == imgPath);
    console.log(match)
    return match;
  };

  //Internal methods
  const general = [
    {
      title: "Dark Age",
      age: "1",
      imgSrc: "/assets/pictures/age/age_1.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Feudal Age",
      age: "2",
      imgSrc: "/assets/pictures/age/age_2.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Castle Age",
      age: "3",
      imgSrc: "/assets/pictures/age/age_3.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Imperial Age",
      age: "4",
      imgSrc: "/assets/pictures/age/age_4.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Unknown Age",
      age: "1",
      imgSrc: "/assets/pictures/age/age_unknown.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Golden Age Tier 1",
      age: "1",
      imgSrc: "/assets/pictures/age/goldenagetier1.png",
      civ: ["ABB"],
      class: "none"
    },
    {
      title: "Golden Age Tier 2",
      age: "4",
      imgSrc: "/assets/pictures/age/goldenagetier2.png",
      civ: ["ABB"],
      class: "none"
    },
    {
      title: "Golden Age Tier 3",
      age: "1",
      imgSrc: "/assets/pictures/age/goldenagetier3.png",
      civ: ["ABB"],
      class: "none"
    },
    {
      title: "Vizier Point",
      age: "1",
      imgSrc: "/assets/pictures/age/vizier_point.png",
      civ: ["OTT"],
      class: "none"
    },
    {
      title: "Build or Repair",
      age: "1",
      imgSrc: "/assets/pictures/abilities/repair.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Attack",
      age: "1",
      imgSrc: "/assets/pictures/abilities/attack-move.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Abbasid Dynasty",
      age: "1",
      imgSrc: "/assets/pictures/civilization_flag/abb.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "China",
      age: "1",
      imgSrc: "/assets/pictures/civilization_flag/chi.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Delhi Sultanate",
      age: "1",
      imgSrc: "/assets/pictures/civilization_flag/del.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "English",
      age: "1",
      imgSrc: "/assets/pictures/civilization_flag/eng.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "French",
      age: "1",
      imgSrc: "/assets/pictures/civilization_flag/fre.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Holy Roman Empire",
      age: "1",
      imgSrc: "/assets/pictures/civilization_flag/hre.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Malians",
      age: "1",
      imgSrc: "/assets/pictures/civilization_flag/mal.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Mongols",
      age: "1",
      imgSrc: "/assets/pictures/civilization_flag/mon.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Ottomans",
      age: "1",
      imgSrc: "/assets/pictures/civilization_flag/ott.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Rus",
      age: "1",
      imgSrc: "/assets/pictures/civilization_flag/rus.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    }
  ];

  const resource = [
    {
      title: "Food",
      age: "1",
      imgSrc: "/assets/pictures/resource/resource_food.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Wood",
      age: "1",
      imgSrc: "/assets/pictures/resource/resource_wood.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Gold",
      age: "1",
      imgSrc: "/assets/pictures/resource/resource_gold.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Stone",
      age: "1",
      imgSrc: "/assets/pictures/resource/resource_stone.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Cattle",
      age: "1",
      imgSrc: "/assets/pictures/resource/cattle.png",
      civ: [
        "MAL",
      ],
      class: "none"
    },
    {
      title: "Sheep",
      age: "1",
      imgSrc: "/assets/pictures/resource/sheep.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Deer",
      age: "1",
      imgSrc: "/assets/pictures/resource/deer.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Berries",
      age: "1",
      imgSrc: "/assets/pictures/resource/berrybush.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Boar",
      age: "1",
      imgSrc: "/assets/pictures/resource/boar.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Bounty",
      age: "1",
      imgSrc: "/assets/pictures/resource/bounty.png",
      civ: [
        "RUS"
      ],
      class: "none"
    },
    {
      title: "Rally",
      age: "1",
      imgSrc: "/assets/pictures/resource/rally.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Fish",
      age: "1",
      imgSrc: "/assets/pictures/resource/fish.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    {
      title: "Straggler Tree",
      age: "1",
      imgSrc: "/assets/pictures/resource/gaiatreeprototypetree.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    },
    ,
    {
      title: "Wolf",
      age: "1",
      imgSrc: "/assets/pictures/resource/wolf.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "none"
    }
  ];

  const landmark = [
    {
      title: "Abbey of Kings",
      age: "1",
      imgSrc: "/assets/pictures/landmark_english/abbey-of-kings.png",
      civ: ["ENG"],
      class: "landmark"
    },
    {
      title: "Council Hall",
      age: "1",
      imgSrc: "/assets/pictures/landmark_english/council-hall.png",
      civ: ["ENG"],
      class: "landmark"
    },
    {
      title: "King's Palace",
      age: "2",
      imgSrc: "/assets/pictures/landmark_english/kings-palace.png",
      civ: ["ENG"],
      class: "landmark"
    },
    {
      title: "The White Tower",
      age: "2",
      imgSrc: "/assets/pictures/landmark_english/the-white-tower.png",
      civ: ["ENG"],
      class: "landmark"
    },
    {
      title: "Wynguard Palace",
      age: "3",
      imgSrc: "/assets/pictures/landmark_english/wynguard-palace.png",
      civ: ["ENG"],
      class: "landmark"
    },
    {
      title: "Berkshire Palace",
      age: "3",
      imgSrc: "/assets/pictures/landmark_english/berkshire-palace.png",
      civ: ["ENG"],
      class: "landmark"
    },
    {
      title: "Cathedral of St. Thomas",
      age: "4",
      imgSrc: "/assets/pictures/landmark_english/cathedral-of-st-thomas.png",
      civ: ["ENG"],
      class: "landmark"
    },
    {
      title: "Chamber of Commerce",
      age: "1",
      imgSrc: "/assets/pictures/landmark_french/chamber-of-commerce.png",
      civ: ["FRE"],
      class: "landmark"
    },
    {
      title: "School of Cavalry",
      age: "1",
      imgSrc: "/assets/pictures/landmark_french/school-of-cavalry.png",
      civ: ["FRE"],
      class: "landmark"
    },
    {
      title: "Guild Hall",
      age: "2",
      imgSrc: "/assets/pictures/landmark_french/guild-hall.png",
      civ: ["FRE"],
      class: "landmark"
    },
    {
      title: "Royal Institute",
      age: "2",
      imgSrc: "/assets/pictures/landmark_french/royal-institute.png",
      civ: ["FRE"],
      class: "landmark"
    },
    {
      title: "College of Artillery",
      age: "3",
      imgSrc: "/assets/pictures/landmark_french/college-of-artillery.png",
      civ: ["FRE"],
      class: "landmark"
    },
    {
      title: "Red Palace",
      age: "3",
      imgSrc: "/assets/pictures/landmark_french/red-palace.png",
      civ: ["FRE"],
      class: "landmark"
    },
    {
      title: "Notre Dame",
      age: "4",
      imgSrc: "/assets/pictures/landmark_french/notre-dame.png",
      civ: ["FRE"],
      class: "landmark"
    },
    {
      title: "Aachen Chapel",
      age: "1",
      imgSrc: "/assets/pictures/landmark_hre/aachen-chapel.png",
      civ: ["HRE"],
      class: "landmark"
    },
    {
      title: "Meinwerk Palace",
      age: "1",
      imgSrc: "/assets/pictures/landmark_hre/meinwerk-palace.png",
      civ: ["HRE"],
      class: "landmark"
    },
    {
      title: "Burgrave Palace",
      age: "2",
      imgSrc: "/assets/pictures/landmark_hre/burgrave-palace.png",
      civ: ["HRE"],
      class: "landmark"
    },
    {
      title: "Regnitz Cathedral",
      age: "2",
      imgSrc: "/assets/pictures/landmark_hre/regnitz-cathedral.png",
      civ: ["HRE"],
      class: "landmark"
    },
    {
      title: "Elzbach Palace",
      age: "3",
      imgSrc: "/assets/pictures/landmark_hre/elzbach-palace.png",
      civ: ["HRE"],
      class: "landmark"
    },
    {
      title: "Palace of Swabia",
      age: "3",
      imgSrc: "/assets/pictures/landmark_hre/palace-of-swabia.png",
      civ: ["HRE"],
      class: "landmark"
    },
    {
      title: "Great Palace of Flensburg",
      age: "4",
      imgSrc: "/assets/pictures/landmark_hre/great-palace-of-flensburg.png",
      civ: ["HRE"],
      class: "landmark"
    },
    {
      title: "Saharan Trade Network",
      age: "1",
      imgSrc: "/assets/pictures/landmark_malians/saharan-trade-network-1.png",
      civ: ["MAL"],
      class: "landmark"
    },
    {
      title: "Mansa Quarry",
      age: "1",
      imgSrc: "/assets/pictures/landmark_malians/mansa-quarry-2.png",
      civ: ["MAL"],
      class: "landmark"
    },
    {
      title: "Grand Fulani Corral",
      age: "2",
      imgSrc: "/assets/pictures/landmark_malians/grand-fulani-corral-2.png",
      civ: ["MAL"],
      class: "landmark"
    },
    {
      title: "Farimba Garrison",
      age: "2",
      imgSrc: "/assets/pictures/landmark_malians/farimba-garrison-2.png",
      civ: ["MAL"],
      class: "landmark"
    },
    {
      title: "Fort of the Huntress",
      age: "3",
      imgSrc: "/assets/pictures/landmark_malians/fort-of-the-huntress-3.png",
      civ: ["MAL"],
      class: "landmark"
    },
    {
      title: "Griot Bara",
      age: "3",
      imgSrc: "/assets/pictures/landmark_malians/griot-bara-3.png",
      civ: ["MAL"],
      class: "landmark"
    },
    {
      title: "Great Mosque",
      age: "4",
      imgSrc: "/assets/pictures/landmark_malians/great-mosque-4.png",
      civ: ["MAL"],
      class: "landmark"
    },
    {
      title: "Deer Stones",
      age: "1",
      imgSrc: "/assets/pictures/landmark_mongols/deer-stones.png",
      civ: ["MON"],
      class: "landmark"
    },
    {
      title: "The Silver Tree",
      age: "1",
      imgSrc: "/assets/pictures/landmark_mongols/the-silver-tree.png",
      civ: ["MON"],
      class: "landmark"
    },
    {
      title: "Kurultai",
      age: "2",
      imgSrc: "/assets/pictures/landmark_mongols/kurultai.png",
      civ: ["MON"],
      class: "landmark"
    },
    {
      title: "Steppe Redoubt",
      age: "2",
      imgSrc: "/assets/pictures/landmark_mongols/steppe-redoubt.png",
      civ: ["MON"],
      class: "landmark"
    },
    {
      title: "Khaganate Palace",
      age: "3",
      imgSrc: "/assets/pictures/landmark_mongols/khaganate-palace.png",
      civ: ["MON"],
      class: "landmark"
    },
    {
      title: "The White Stupa",
      age: "3",
      imgSrc: "/assets/pictures/landmark_mongols/the-white-stupa.png",
      civ: ["MON"],
      class: "landmark"
    },
    {
      title: "Monument of the Great Khan",
      age: "4",
      imgSrc:
        "/assets/pictures/landmark_mongols/monument-of-the-great-khan.png",
      civ: ["MON"],
      class: "landmark"
    },
    {
      title: "Twin Minaret Medrese",
      age: "1",
      imgSrc: "/assets/pictures/landmark_ottomans/twin-minaret-medrese-1.png",
      civ: ["OTT"],
      class: "landmark"
    },
    {
      title: "Sultanhani Trade Network",
      age: "1",
      imgSrc:
        "/assets/pictures/landmark_ottomans/sultanhani-trade-network-1.png",
      civ: ["OTT"],
      class: "landmark"
    },
    {
      title: "Istanbul Imperial Palace",
      age: "2",
      imgSrc:
        "/assets/pictures/landmark_ottomans/istanbul-imperial-palace-2.png",
      civ: ["OTT"],
      class: "landmark"
    },
    {
      title: "Mehmed Imperial Armory",
      age: "2",
      imgSrc: "/assets/pictures/landmark_ottomans/mehmed-imperial-armory-2.png",
      civ: ["OTT"],
      class: "landmark"
    },
    {
      title: "Istanbul Observatory",
      age: "3",
      imgSrc: "/assets/pictures/landmark_ottomans/istanbul-observatory-3.png",
      civ: ["OTT"],
      class: "landmark"
    },
    {
      title: "Sea Gate Castle",
      age: "3",
      imgSrc: "/assets/pictures/landmark_ottomans/sea-gate-castle-3.png",
      civ: ["OTT"],
      class: "landmark"
    },
    {
      title: "Azure Mosque",
      age: "4",
      imgSrc: "/assets/pictures/landmark_ottomans/azure-mosque-4.png",
      civ: ["OTT"],
      class: "landmark"
    },
    {
      title: "Kremlin",
      age: "1",
      imgSrc: "/assets/pictures/landmark_rus/kremlin.png",
      civ: ["RUS"],
      class: "landmark"
    },
    {
      title: "The Golden Gate",
      age: "1",
      imgSrc: "/assets/pictures/landmark_rus/the-golden-gate.png",
      civ: ["RUS"],
      class: "landmark"
    },
    {
      title: "Abbey of the Trinity",
      age: "2",
      imgSrc: "/assets/pictures/landmark_rus/abbey-of-the-trinity.png",
      civ: ["RUS"],
      class: "landmark"
    },
    {
      title: "High Trade House",
      age: "2",
      imgSrc: "/assets/pictures/landmark_rus/high-trade-house.png",
      civ: ["RUS"],
      class: "landmark"
    },
    {
      title: "High Armory",
      age: "3",
      imgSrc: "/assets/pictures/landmark_rus/high-armory.png",
      civ: ["RUS"],
      class: "landmark"
    },
    {
      title: "Spasskaya Tower",
      age: "3",
      imgSrc: "/assets/pictures/landmark_rus/spasskaya-tower.png",
      civ: ["RUS"],
      class: "landmark"
    },
    {
      title: "Cathedral of the Tsar",
      age: "4",
      imgSrc: "/assets/pictures/landmark_rus/cathedral-of-the-tsar.png",
      civ: ["RUS"],
      class: "landmark"
    },
    {
      title: "House of Wisdom",
      age: "1",
      imgSrc: "/assets/pictures/landmark_abbasid/house-of-wisdom.png",
      civ: ["ABB"],
      class: "landmark"
    },
    {
      title: "Culture Wing",
      age: "1",
      imgSrc: "/assets/pictures/landmark_abbasid/culture-wing.png",
      civ: ["ABB"],
      class: "landmark"
    },
    {
      title: "Economic Wing",
      age: "1",
      imgSrc: "/assets/pictures/landmark_abbasid/economic-wing.png",
      civ: ["ABB"],
      class: "landmark"
    },
    {
      title: "Military Wing",
      age: "1",
      imgSrc: "/assets/pictures/landmark_abbasid/military-wing.png",
      civ: ["ABB"],
      class: "landmark"
    },
    {
      title: "Trade Wing",
      age: "1",
      imgSrc: "/assets/pictures/landmark_abbasid/trade-wing.png",
      civ: ["ABB"],
      class: "landmark"
    },
    {
      title: "Imperial Academy",
      age: "1",
      imgSrc: "/assets/pictures/landmark_chinese/imperial-academy.png",
      civ: ["CHI"],
      class: "landmark"
    },
    {
      title: "Barbican of the Sun",
      age: "1",
      imgSrc: "/assets/pictures/landmark_chinese/barbican-of-the-sun.png",
      civ: ["CHI"],
      class: "landmark"
    },
    {
      title: "Astronomical Clocktower",
      age: "2",
      imgSrc: "/assets/pictures/landmark_chinese/astronomical-clocktower.png",
      civ: ["CHI"],
      class: "landmark"
    },
    {
      title: "Imperial Palace",
      age: "2",
      imgSrc: "/assets/pictures/landmark_chinese/imperial-palace.png",
      civ: ["CHI"],
      class: "landmark"
    },
    {
      title: "Great Wall Gatehouse",
      age: "3",
      imgSrc: "/assets/pictures/landmark_chinese/great-wall-gatehouse.png",
      civ: ["CHI"],
      class: "landmark"
    },
    {
      title: "Spirit Way",
      age: "3",
      imgSrc: "/assets/pictures/landmark_chinese/spirit-way.png",
      civ: ["CHI"],
      class: "landmark"
    },
    {
      title: "Dome of the Faith",
      age: "1",
      imgSrc: "/assets/pictures/landmark_delhi/dome-of-the-faith.png",
      civ: ["DEL"],
      class: "landmark"
    },
    {
      title: "Tower of Victory",
      age: "1",
      imgSrc: "/assets/pictures/landmark_delhi/tower-of-victory.png",
      civ: ["DEL"],
      class: "landmark"
    },
    {
      title: "Compound of the Defender",
      age: "2",
      imgSrc: "/assets/pictures/landmark_delhi/compound-of-the-defender.png",
      civ: ["DEL"],
      class: "landmark"
    },
    {
      title: "House of Learning",
      age: "2",
      imgSrc: "/assets/pictures/landmark_delhi/house-of-learning.png",
      civ: ["DEL"],
      class: "landmark"
    },
    {
      title: "Hisar Academy",
      age: "3",
      imgSrc: "/assets/pictures/landmark_delhi/hisar-academy.png",
      civ: ["DEL"],
      class: "landmark"
    },
    {
      title: "Palace of the Sultan",
      age: "3",
      imgSrc: "/assets/pictures/landmark_delhi/palace-of-the-sultan.png",
      civ: ["DEL"],
      class: "landmark"
    },
    {
      title: "Great Palace of Agra",
      age: "4",
      imgSrc: "/assets/pictures/landmark_delhi/great-palace-of-agra.png",
      civ: ["DEL"],
      class: "landmark"
    },
    {
      title: "Enclave of the Emperor",
      age: "4",
      imgSrc: "/assets/pictures/landmark_chinese/enclave-of-the-emperor.png",
      civ: ["CHI"],
      class: "landmark"
    },
    {
      title: "Great Mosque of Kairouan",
      age: "4",
      imgSrc: "/assets/pictures/landmark_abbasid/prayer-hall-of-uqba.png",
      civ: ["ABB"],
      class: "landmark"
    },
  ];

  const tech_eco = [
    {
      title: "Double Broadax",
      age: "2",
      imgSrc: "/assets/pictures/technology_economy/double-broadaxe.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Lumber Preservation",
      age: "3",
      imgSrc: "/assets/pictures/technology_economy/lumber-preservation.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Crosscut Saw",
      age: "4",
      imgSrc: "/assets/pictures/technology_economy/crosscut-saw.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Forestry",
      age: "1",
      imgSrc: "/assets/pictures/technology_economy/forestry.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Horticulture",
      age: "2",
      imgSrc: "/assets/pictures/technology_economy/horticulture.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Fertilization",
      age: "3",
      imgSrc: "/assets/pictures/technology_economy/fertilization.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Precision Cross-Breeding",
      age: "4",
      imgSrc:
        "/assets/pictures/technology_economy/precision-cross-breeding.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Wheelbarrow",
      age: "1",
      imgSrc: "/assets/pictures/technology_economy/wheelbarrow.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Specialized Pick",
      age: "2",
      imgSrc: "/assets/pictures/technology_economy/specialized-pick.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Acid Distillation",
      age: "3",
      imgSrc: "/assets/pictures/technology_economy/acid-distilization.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Cupellation",
      age: "4",
      imgSrc: "/assets/pictures/technology_economy/cupellation.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Textiles",
      age: "2",
      imgSrc: "/assets/pictures/technology_economy/textiles.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Survival Techniques",
      age: "1",
      imgSrc: "/assets/pictures/technology_economy/survival-techniques.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Professional Scouts",
      age: "2",
      imgSrc: "/assets/pictures/technology_economy/professional-scouts.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Extended Lines",
      age: "2",
      imgSrc: "/assets/pictures/technology_economy/extended-lines.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Drift Nets",
      age: "3",
      imgSrc: "/assets/pictures/technology_economy/drift-nets.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Improved Processing",
      age: "1",
      imgSrc: "/assets/pictures/technology_abbasid/improved-processing.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Agriculture",
      age: "3",
      imgSrc: "/assets/pictures/technology_abbasid/agriculture.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Preservation of Knowledge",
      age: "2",
      imgSrc:
        "/assets/pictures/technology_abbasid/preservation-of-knowledge.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Armored Caravans",
      age: "3",
      imgSrc: "/assets/pictures/technology_abbasid/armored-caravans.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Grand Bazaar",
      age: "2",
      imgSrc: "/assets/pictures/technology_abbasid/grand-bazaar.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Spice Roads",
      age: "4",
      imgSrc: "/assets/pictures/technology_abbasid/spice-roads.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Fresh Foodstuffs",
      age: "2",
      imgSrc: "/assets/pictures/technology_abbasid/fresh-foodstuffs.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Fertile Crescent",
      age: "2",
      imgSrc: "/assets/pictures/technology_abbasid/fertile-crescent-2.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Extra Materials",
      age: "3",
      imgSrc: "/assets/pictures/technology_chinese/extra-materials.png",
      civ: ["CHI"],
      class: "tech"
    },
    {
      title: "Ancient Techniques",
      age: "4",
      imgSrc: "/assets/pictures/technology_chinese/ancient-techniques.png",
      civ: ["CHI"],
      class: "tech"
    },
    {
      title: "Imperial Examinations",
      age: "2",
      imgSrc: "/assets/pictures/technology_chinese/imperial-examination.png",
      civ: ["CHI"],
      class: "tech"
    },
    {
      title: "Village Fortresses",
      age: "3",
      imgSrc: "/assets/pictures/technology_delhi/village-fortresses.png",
      civ: ["DEL"],
      class: "tech"
    },
    {
      title: "Reinforced Foundations",
      age: "3",
      imgSrc: "/assets/pictures/technology_delhi/reinforced-foundations.png",
      civ: ["DEL"],
      class: "tech"
    },
    {
      title: "All-Seeing Eye",
      age: "2",
      imgSrc: "/assets/pictures/technology_delhi/all-seeing-eye.png",
      civ: ["DEL"],
      class: "tech"
    },
    {
      title: "Sanctity",
      age: "2",
      imgSrc: "/assets/pictures/technology_delhi/sanctity.png",
      civ: ["DEL"],
      class: "tech"
    },
    {
      title: "Swiftness",
      age: "3",
      imgSrc: "/assets/pictures/technology_delhi/swiftness.png",
      civ: ["DEL"],
      class: "tech"
    },
    {
      title: "Hearty Rations",
      age: "3",
      imgSrc: "/assets/pictures/technology_delhi/hearty-rations.png",
      civ: ["DEL"],
      class: "tech"
    },
    {
      title: "Enclosures",
      age: "4",
      imgSrc: "/assets/pictures/technology_english/enclosures.png",
      civ: ["ENG"],
      class: "tech"
    },
    {
      title: "Enlistment Incentives",
      age: "4",
      imgSrc: "/assets/pictures/technology_french/enlistment-incentives.png",
      civ: ["FRE"],
      class: "tech"
    },
    //{
    //  title: "Merchant Guilds",
    //  age: "4",
    //  imgSrc: "/assets/pictures/technology_french/merchant-guilds.png",
    //  civ: ["FRE"],
    //  class: "tech"
    //},
    {
      title: "Benediction",
      age: "3",
      imgSrc: "/assets/pictures/technology_hre/benediction.png",
      civ: ["HRE"],
      class: "tech"
    },
    {
      title: "Devoutness",
      age: "3",
      imgSrc: "/assets/pictures/technology_hre/devoutness.png",
      civ: ["HRE"],
      class: "tech"
    },
    {
      title: "Piracy",
      age: "2",
      imgSrc: "/assets/pictures/technology_mongols/piracy.png",
      civ: ["MON"],
      class: "tech"
    },
    {
      title: "Superior Mobility",
      age: "1",
      imgSrc: "/assets/pictures/technology_mongols/superior-mobility.png",
      civ: ["MON"],
      class: "tech"
    },
    {
      title: "Raid Bounty",
      age: "2",
      imgSrc: "/assets/pictures/technology_mongols/raid-bounty.png",
      civ: ["MON"],
      class: "tech"
    },
    {
      title: "Stone Bounty",
      age: "4",
      imgSrc: "/assets/pictures/technology_mongols/stone-bounty.png",
      civ: ["MON"],
      class: "tech"
    },
    {
      title: "Stone Commerce",
      age: "4",
      imgSrc: "/assets/pictures/technology_mongols/stone-commerce.png",
      civ: ["MON"],
      class: "tech"
    },
    {
      title: "Anatolian Hills",
      age: "1",
      imgSrc: "/assets/pictures/technology_ottomans/anatolian-hills-1.png",
      civ: ["OTT"],
      class: "tech"
    },
    {
      title: "Trade Bags",
      age: "1",
      imgSrc: "/assets/pictures/technology_ottomans/trade-bags-1.png",
      civ: ["OTT"],
      class: "tech"
    },
  ];

  const tech_military = [
    {
      title: "Bloomery",
      age: "2",
      imgSrc: "/assets/pictures/technology_military/bloomery.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Decarbonization",
      age: "3",
      imgSrc: "/assets/pictures/technology_military/decarbonization.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Damascus Steel",
      age: "4",
      imgSrc: "/assets/pictures/technology_military/damascus-steel.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Siege Engineering",
      age: "2",
      imgSrc: "/assets/pictures/technology_military/siege-engineering.png",
      civ: [
        "ENG",
        "RUS",
        "MAL",
        "FRE",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Steeled Arrow",
      age: "2",
      imgSrc: "/assets/pictures/technology_military/steeled-arrow.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Balanced Projectiles",
      age: "3",
      imgSrc: "/assets/pictures/technology_military/balanced-projectiles.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Platecutter Point",
      age: "4",
      imgSrc: "/assets/pictures/technology_military/platecutter-point.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Military Academy",
      age: "4",
      imgSrc: "/assets/pictures/technology_military/military-academy.png",
      civ: ["ENG", "RUS", "MAL", "FRE", "MON", "ABB", "CHI", "DEL", "HRE"],
      class: "tech"
    },
    {
      title: "Fitted Leatherwork",
      age: "2",
      imgSrc: "/assets/pictures/technology_military/fitted-leatherwork.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Insulated Helm",
      age: "3",
      imgSrc: "/assets/pictures/technology_military/insulated-helm.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Master Smiths",
      age: "4",
      imgSrc: "/assets/pictures/technology_military/master-smiths.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Elite Army Tactics",
      age: "4",
      imgSrc: "/assets/pictures/technology_military/elite-army-tactics.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Iron Undermesh",
      age: "2",
      imgSrc: "/assets/pictures/technology_military/iron-undermesh.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Wedge Rivets",
      age: "3",
      imgSrc: "/assets/pictures/technology_military/wedge-rivets.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Angled Surfaces",
      age: "4",
      imgSrc: "/assets/pictures/technology_military/angled-surfaces.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Incendiary Arrows",
      age: "4",
      imgSrc: "/assets/pictures/technology_military/incendiary-arrows.png",
      civ: ["ENG", "FRE", "RUS", "MON", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "tech"
    },
    {
      title: "Biology",
      age: "4",
      imgSrc: "/assets/pictures/technology_military/biology.png",
      civ: ["ENG", "RUS", "MAL", "MON", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "tech"
    },
    {
      title: "Chemistry",
      age: "4",
      imgSrc: "/assets/pictures/technology_military/chemistry.png",
      civ: [
        "ENG",
        "RUS",
        "MAL",
        "FRE",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Geometry",
      age: "4",
      imgSrc: "/assets/pictures/technology_military/geometry.png",
      civ: [
        "ENG",
        "RUS",
        "MAL",
        "FRE",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Greased Axles",
      age: "2",
      imgSrc: "/assets/pictures/technology_military/greased-axles.png",
      civ: [
        "ENG",
        "RUS",
        "MAL",
        "FRE",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Roller Shutter Triggers",
      age: "4",
      imgSrc: "/assets/pictures/technology_units/roller-shutter-triggers.png",
      civ: [
        "ENG",
        "RUS",
        "MAL",
        "FRE",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Adjustable Crossbars",
      age: "4",
      imgSrc: "/assets/pictures/technology_units/adjustable-crossbars.png",
      civ: ["ENG", "RUS", "MAL", "FRE", "MON", "ABB", "OTT", "DEL", "HRE"],
      class: "tech"
    },
    {
      title: "Siege Works",
      age: "4",
      imgSrc: "/assets/pictures/technology_military/siege-works.png",
      civ: [
        "ENG",
        "RUS",
        "MAL",
        "FRE",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Arrowslits",
      age: "2",
      imgSrc: "/assets/pictures/technology_defensive/arrow-slits.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Springald Emplacement",
      age: "3",
      imgSrc: "/assets/pictures/technology_defensive/springald-emplacement.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Cannon Emplacement",
      age: "3",
      imgSrc: "/assets/pictures/technology_defensive/cannon-emplacement.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Boiling Oil",
      age: "3",
      imgSrc: "/assets/pictures/technology_defensive/boiling-oil.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Court Architects",
      age: "4",
      imgSrc: "/assets/pictures/technology_defensive/court-architects.png",
      civ: ["ENG", "FRE", "RUS", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "tech"
    },
    {
      title: "Fortify Outpost",
      age: "2",
      imgSrc: "/assets/pictures/technology_defensive/fortify-outpost.png",
      civ: ["ENG", "FRE", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "tech"
    },
    {
      title: "Extra Hammocks",
      age: "31",
      imgSrc: "/assets/pictures/technology_chinese/extra-hammocks.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Naval Arrowslits",
      age: "2",
      imgSrc: "/assets/pictures/technology_naval/naval-arrow-slits.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    //{
    //  title: "Spyglasses",
    //  age: "4",
    //  imgSrc: "/assets/pictures/technology_military/Spyglasses.png",
    //  civ: [
    //    "ENG",
    //    "FRE",
    //    "RUS",
    //    "MAL",
    //    "MON",
    //    "ABB",
    //    "OTT",
    //    "CHI",
    //    "DEL",
    //    "HRE",
    //  ],
    //  class: "tech"
    //},
    {
      title: "Composite Bows",
      age: "3",
      imgSrc: "/assets/pictures/technology_abbasid/composite-bows.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Camel Rider Barding",
      age: "4",
      imgSrc: "/assets/pictures/technology_abbasid/camel-rider-barding-4.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Camel Handling",
      age: "3",
      imgSrc: "/assets/pictures/technology_abbasid/camel-handling.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Camel Support",
      age: "4",
      imgSrc: "/assets/pictures/technology_abbasid/camel-support.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Camel Rider Shields",
      age: "3",
      imgSrc: "/assets/pictures/technology_abbasid/camel-rider-shields.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Medical Centers",
      age: "3",
      imgSrc: "/assets/pictures/technology_abbasid/medical-centers.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Boot Camp",
      age: "2",
      imgSrc: "/assets/pictures/technology_abbasid/boot-camp.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Teak Masts",
      age: "3",
      imgSrc: "/assets/pictures/technology_abbasid/teak-masts.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Proselytization",
      age: "4",
      imgSrc: "/assets/pictures/technology_abbasid/faith.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Phalanx",
      age: "2",
      imgSrc: "/assets/pictures/technology_abbasid/phalanx.png",
      civ: ["ABB"],
      class: "tech"
    },
    {
      title: "Pyrotechnics",
      age: "4",
      imgSrc: "/assets/pictures/technology_chinese/pyrotechnics.png",
      civ: ["CHI"],
      class: "tech"
    },
    {
      title: "Reload Drills",
      age: "4",
      imgSrc: "/assets/pictures/technology_chinese/reload-drills.png",
      civ: ["CHI"],
      class: "tech"
    },
    {
      title: "Reusable Barrels",
      age: "4",
      imgSrc: "/assets/pictures/technology_chinese/reusable-barrels.png",
      civ: ["CHI"],
      class: "tech"
    },
    {
      title: "Battle Hardened",
      age: "4",
      imgSrc: "/assets/pictures/technology_chinese/battle-hardened.png",
      civ: ["CHI"],
      class: "tech"
    },
    {
      title: "Handcannon Slits",
      age: "2",
      imgSrc: "/assets/pictures/technology_chinese/handcannon-slits.png",
      civ: ["CHI"],
      class: "tech"
    },
    {
      title: "Thunderclap Bombs",
      age: "4",
      imgSrc: "/assets/pictures/technology_chinese/thunderclap-bombs-4.png",
      civ: ["CHI"],
      class: "tech"
    },
    {
      title: "Armored Beasts",
      age: "4",
      imgSrc: "/assets/pictures/technology_delhi/armored-beasts.png",
      civ: ["DEL"],
      class: "tech"
    },
    {
      title: "Efficient Production",
      age: "1",
      imgSrc: "/assets/pictures/technology_delhi/efficient-production.png",
      civ: ["DEL"],
      class: "tech"
    },
    {
      title: "Howdahs",
      age: "4",
      imgSrc: "/assets/pictures/technology_delhi/siege-elephant.png",
      civ: ["DEL"],
      class: "tech"
    },
    {
      title: "Forced March",
      age: "3",
      imgSrc: "/assets/pictures/technology_delhi/forced-march.png",
      civ: ["DEL"],
      class: "tech"
    },
    {
      title: "Zeal",
      age: "4",
      imgSrc: "/assets/pictures/technology_delhi/zeal.png",
      civ: ["DEL"],
      class: "tech"
    },
    {
      title: "Honed Blades",
      age: "3",
      imgSrc: "/assets/pictures/technology_delhi/honed-blades.png",
      civ: ["DEL"],
      class: "tech"
    },
    {
      title: "Tranquil Venue",
      age: "3",
      imgSrc: "/assets/pictures/technology_delhi/tranquil-venue.png",
      civ: ["DEL"],
      class: "tech"
    },
    {
      title: "Lookout Towers",
      age: "3",
      imgSrc: "/assets/pictures/technology_delhi/lookout-towers.png",
      civ: ["DEL"],
      class: "tech"
    },
    {
      title: "Slow-Burning Defenses",
      age: "4",
      imgSrc: "/assets/pictures/technology_delhi/slow-burning-defenses.png",
      civ: ["DEL"],
      class: "tech"
    },
    {
      title: "Manuscript Trade",
      age: "1",
      imgSrc: "/assets/pictures/technology_delhi/manuscript-trade-1.png",
      civ: ["DEL"],
      class: "tech"
    },
    {
      title: "Crossbow Stirrups",
      age: "4",
      imgSrc: "/assets/pictures/technology_french/crossbow-stirrups.png",
      civ: ["FRE"],
      class: "tech"
    },
    {
      title: "Gambesons",
      age: "3",
      imgSrc: "/assets/pictures/technology_french/gambesons.png",
      civ: ["FRE"],
      class: "tech"
    },
    {
      title: "Chivalry ",
      age: "2",
      imgSrc: "/assets/pictures/technology_french/chivalry.png",
      civ: ["FRE"],
      class: "tech"
    },
    {
      title: "Royal Bloodlines",
      age: "4",
      imgSrc: "/assets/pictures/technology_french/royal-bloodlines.png",
      civ: ["FRE"],
      class: "tech"
    },
    {
      title: "Cantled Saddles",
      age: "3",
      imgSrc: "/assets/pictures/technology_french/cantled-saddles.png",
      civ: ["FRE"],
      class: "tech"
    },
    {
      title: "Long Guns",
      age: "3",
      imgSrc: "/assets/pictures/technology_french/long-guns.png",
      civ: ["FRE"],
      class: "tech"
    },
    {
      title: "Slate and Stone Construction",
      age: "3",
      imgSrc:
        "/assets/pictures/technology_hre/slate-and-stone-construction.png",
      civ: ["HRE"],
      class: "tech"
    },
    {
      title: "Reinforced Defenses",
      age: "4",
      imgSrc: "/assets/pictures/technology_hre/reinforced-defenses.png",
      civ: ["HRE"],
      class: "tech"
    },
    {
      title: "Marching Drills",
      age: "2",
      imgSrc: "/assets/pictures/technology_hre/marching-drills.png",
      civ: ["HRE"],
      class: "tech"
    },
    {
      title: "Heavy Maces",
      age: "3",
      imgSrc: "/assets/pictures/technology_hre/heavy-maces.png",
      civ: ["HRE"],
      class: "tech"
    },
    {
      title: "Two-Handed Weapons",
      age: "3",
      imgSrc: "/assets/pictures/technology_hre/two-handed-weapon.png",
      civ: ["HRE"],
      class: "tech"
    },
    {
      title: "Fire Stations",
      age: "2",
      imgSrc: "/assets/pictures/technology_hre/fire-stations.png",
      civ: ["HRE"],
      class: "tech"
    },
    {
      title: "Inspired Warriors",
      age: "3",
      imgSrc: "/assets/pictures/technology_hre/inspired-warriors.png",
      civ: ["HRE"],
      class: "tech"
    },
    {
      title: "Riveted Chain Mail",
      age: "4",
      imgSrc: "/assets/pictures/technology_hre/riveted-chain-mail-2.png",
      civ: ["HRE"],
      class: "tech"
    },
    {
      title: "Steel Barding",
      age: "4",
      imgSrc: "/assets/pictures/technology_hre/steel-barding-3.png",
      civ: ["HRE"],
      class: "tech"
    },
    {
      title: "Network of Citadels",
      age: "3",
      imgSrc: "/assets/pictures/technology_english/network-of-citadels.png",
      civ: ["ENG"],
      class: "tech"
    },
    {
      title: "Arrow Volley",
      age: "4",
      imgSrc: "/assets/pictures/technology_english/arrow-volley.png",
      civ: ["ENG"],
      class: "tech"
    },
    {
      title: "Setup Camp",
      age: "2",
      imgSrc: "/assets/pictures/technology_english/setup-camp.png",
      civ: ["ENG"],
      class: "tech"
    },
    {
      title: "Armor Clad",
      age: "3",
      imgSrc: "/assets/pictures/technology_english/armor-clad.png",
      civ: ["ENG"],
      class: "tech"
    },
    {
      title: "Admiralty",
      age: "2",
      imgSrc: "/assets/pictures/technology_english/admiralty-2.png",
      civ: ["ENG"],
      class: "tech"
    },
    {
      title: "Shattering Projectiles",
      age: "4",
      imgSrc: "/assets/pictures/technology_english/shattering-projectiles.png",
      civ: ["ENG"],
      class: "tech"
    },
    {
      title: "Banco Repairs",
      age: "2",
      imgSrc: "/assets/pictures/technology_malians/banco-repairs-2.png",
      civ: ["MAL"],
      class: "tech"
    },
    {
      title: "Farima Leadership",
      age: "4",
      imgSrc: "/assets/pictures/technology_malians/farima-leadership-4.png",
      civ: ["MAL"],
      class: "tech"
    },
    {
      title: "Imported Armor",
      age: "3",
      imgSrc: "/assets/pictures/technology_malians/imported-armor-3.png",
      civ: ["MAL"],
      class: "tech"
    },
    {
      title: "Local Knowledge",
      age: "3",
      imgSrc: "/assets/pictures/technology_malians/local-knowledge-4.png",
      civ: ["MAL"],
      class: "tech"
    },
    {
      title: "Poisoned Arrows",
      age: "3",
      imgSrc: "/assets/pictures/technology_malians/poisoned-arrows-3.png",
      civ: ["MAL"],
      class: "tech"
    },
    {
      title: "Precision Training",
      age: "3",
      imgSrc: "/assets/pictures/technology_malians/precision-training-4.png",
      civ: ["MAL"],
      class: "tech"
    },
    {
      title: "Canoe Tactics",
      age: "2",
      imgSrc: "/assets/pictures/technology_malians/canoe-tactics-2.png",
      civ: ["MAL"],
      class: "tech"
    },
    {
      title: "Whistling Arrows",
      age: "2",
      imgSrc: "/assets/pictures/technology_mongols/whistling-arrows.png",
      civ: ["MON"],
      class: "tech"
    },
    {
      title: "Yam Network",
      age: "3",
      imgSrc: "/assets/pictures/technology_mongols/yam-network.png",
      civ: ["MON"],
      class: "tech"
    },
    //{
    //  title: "Improved Yam Network",
    //  age: "4",
    //  imgSrc: "/assets/pictures/technology_mongols/improved-yam-network.png",
    //  civ: ["MON"],
    //  class: "tech"
    //},
    {
      title: "Additional Torches",
      age: "3",
      imgSrc: "/assets/pictures/technology_mongols/additional-torches.png",
      civ: ["MON"],
      class: "tech"
    },
    {
      title: "Steppe Lancers",
      age: "4",
      imgSrc: "/assets/pictures/technology_mongols/steppe-lancers.png",
      civ: ["MON"],
      class: "tech"
    },
    {
      title: "Monastic Shrines",
      age: "4",
      imgSrc: "/assets/pictures/technology_mongols/monastic-shrines.png",
      civ: ["MON"],
      class: "tech"
    },
    {
      title: "Siha Bow Limbs",
      age: "3",
      imgSrc: "/assets/pictures/technology_mongols/siha-bow-limbs.png",
      civ: ["MON"],
      class: "tech"
    },
    {
      title: "Armored Hull",
      age: "3",
      imgSrc: "/assets/pictures/technology_naval/armored-hull.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Shipwrights",
      age: "3",
      imgSrc: "/assets/pictures/technology_naval/shipwrights-4.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Herbal Medicine",
      age: "3",
      imgSrc: "/assets/pictures/technology_religious/herbal-medicine.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Piety",
      age: "4",
      imgSrc: "/assets/pictures/technology_religious/piety.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Tithe Barns",
      age: "4",
      imgSrc: "/assets/pictures/technology_religious/tithe-barns.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "Janissary Guns",
      age: "4",
      imgSrc: "/assets/pictures/technology_ottomans/janissary-guns-4.png",
      civ: ["OTT"],
      class: "tech"
    },
    {
      title: "Imperial Fleet",
      age: "4",
      imgSrc: "/assets/pictures/technology_ottomans/imperial-fleet-4.png",
      civ: ["OTT"],
      class: "tech"
    },
    {
      title: "Advanced Academy",
      age: "1",
      imgSrc: "/assets/pictures/technology_ottomans/advanced-academy-1.png",
      civ: ["OTT"],
      class: "tech"
    },
    {
      title: "Fast Training",
      age: "1",
      imgSrc: "/assets/pictures/technology_ottomans/fast-training-1.png",
      civ: ["OTT"],
      class: "tech"
    },
    {
      title: "Field Work",
      age: "1",
      imgSrc: "/assets/pictures/technology_ottomans/field-work-1.png",
      civ: ["OTT"],
      class: "tech"
    },
    {
      title: "Janissary Company",
      age: "1",
      imgSrc: "/assets/pictures/technology_ottomans/janissary-company-1.png",
      civ: ["OTT"],
      class: "tech"
    },
    {
      title: "Mehter Drums",
      age: "1",
      imgSrc: "/assets/pictures/technology_ottomans/mehter-drums-1.png",
      civ: ["OTT"],
      class: "tech"
    },
    {
      title: "Military Campus",
      age: "1",
      imgSrc: "/assets/pictures/technology_ottomans/military-campus-1.png",
      civ: ["OTT"],
      class: "tech"
    },
    {
      title: "Siege Crews",
      age: "1",
      imgSrc: "/assets/pictures/technology_ottomans/siege-crews-1.png",
      civ: ["OTT"],
      class: "tech"
    },
    {
      title: "Great Bombard Emplacement",
      age: "4",
      imgSrc: "/assets/pictures/technology_ottomans/great-bombard-emplacement.png",
      civ: ["OTT"],
      class: "tech"
    },
    {
      title: "Fine Tuned Guns",
      age: "4",
      imgSrc: "/assets/pictures/technology_rus/fine-tuned-guns.png",
      civ: ["RUS"],
      class: "tech"
    },
    {
      title: "Boyar's Fortitude",
      age: "3",
      imgSrc: "/assets/pictures/technology_rus/boyars-fortitude.png",
      civ: ["RUS"],
      class: "tech"
    },
    {
      title: "Mounted Training",
      age: "4",
      imgSrc: "/assets/pictures/technology_rus/mounted-training.png",
      civ: ["RUS"],
      class: "tech"
    },
    {
      title: "Knight Sabers",
      age: "4",
      imgSrc: "/assets/pictures/technology_rus/knight-sabers.png",
      civ: ["RUS"],
      class: "tech"
    },
    {
      title: "Siege Crew Training",
      age: "4",
      imgSrc: "/assets/pictures/technology_rus/siege-crew-training.png",
      civ: ["RUS"],
      class: "tech"
    },
    {
      title: "Wandering Town",
      age: "4",
      imgSrc: "/assets/pictures/technology_rus/wandering-town.png",
      civ: ["RUS"],
      class: "tech"
    },
    {
      title: "Warrior Scout",
      age: "2",
      imgSrc: "/assets/pictures/technology_rus/warrior_scout_2.png",
      civ: ["RUS"],
      class: "tech"
    },
    {
      title: "Divine Light",
      age: "3",
      imgSrc: "/assets/pictures/technology_rus/blessing-duration.png",
      civ: ["RUS"],
      class: "tech"
    },
    {
      title: "Fervor",
      age: "3",
      imgSrc: "/assets/pictures/technology_rus/improved-blessing.png",
      civ: ["RUS"],
      class: "tech"
    },
    {
      title: "Saint's Veneration",
      age: "4",
      imgSrc: "/assets/pictures/technology_rus/saints-veneration-4.png",
      civ: ["RUS"],
      class: "tech"
    },
    {
      title: "Banded Arms",
      age: "4",
      imgSrc: "/assets/pictures/technology_rus/banded-arms.png",
      civ: ["RUS"],
      class: "tech"
    },
    {
      title: "Double Time",
      age: "4",
      imgSrc: "/assets/pictures/technology_rus/double-time.png",
      civ: ["RUS"],
      class: "tech"
    },
    {
      title: "Castle Watch",
      age: "2",
      imgSrc: "/assets/pictures/technology_rus/castle-watch.png",
      civ: ["RUS"],
      class: "tech"
    },
    {
      title: "Castle Turret",
      age: "2",
      imgSrc: "/assets/pictures/technology_rus/castle-turret.png",
      civ: ["RUS"],
      class: "tech"
    },
    {
      title: "Adaptable Hulls",
      age: "2",
      imgSrc: "/assets/pictures/technology_rus/adaptable-hulls-3.png",
      civ: ["RUS"],
      class: "tech"
    },
  ];

  const building_religious = [
    {
      title: "Monastery",
      age: "3",
      imgSrc: "/assets/pictures/building_religious/monastery.png",
      civ: ["ENG", "FRE", "RUS", "CHI", "HRE"],
      class: "default"
    },
    {
      title: "Mosque",
      age: "3",
      imgSrc: "/assets/pictures/building_religious/mosque.png",
      civ: ["ABB", "DEL", "MAL", "OTT"],
      class: "default"
    },
    {
      title: "Prayer Tent",
      age: "3",
      imgSrc: "/assets/pictures/building_mongols/prayer-tent.png",
      civ: ["MON"],
      class: "default"
    },
    {
      title: "Pagoda",
      age: "3",
      imgSrc: "/assets/pictures/building_chinese/pagoda.png",
      civ: ["CHI"],
      class: "default"
    },
  ];

  const building_eco = [
    {
      title: "Farm",
      age: "1",
      imgSrc: "/assets/pictures/building_economy/farm.png",
      civ: ["ENG", "FRE", "RUS", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "default"
    },
    {
      title: "House",
      age: "1",
      imgSrc: "/assets/pictures/building_economy/house.png",
      civ: ["ENG", "FRE", "RUS", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "default"
    },
    {
      title: "Lumber Camp",
      age: "1",
      imgSrc: "/assets/pictures/building_economy/lumber-camp.png",
      civ: ["ENG", "FRE", "RUS", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "default"
    },
    {
      title: "Mining Camp",
      age: "1",
      imgSrc: "/assets/pictures/building_economy/mining-camp.png",
      civ: ["ENG", "FRE", "RUS", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "default"
    },
    {
      title: "Mill",
      age: "1",
      imgSrc: "/assets/pictures/building_economy/mill.png",
      civ: ["ENG", "FRE", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "default"
    },
    {
      title: "Pit Mine",
      age: "1",
      imgSrc: "/assets/pictures/building_malians/pit-mine-1.png",
      civ: ["MAL"],
      class: "default"
    },
    {
      title: "Ger",
      age: "1",
      imgSrc: "/assets/pictures/building_mongols/ger.png",
      civ: ["MON"],
      class: "default"
    },
    {
      title: "Pasture",
      age: "1",
      imgSrc: "/assets/pictures/building_mongols/pasture.png",
      civ: ["MON"],
      class: "default"
    },
    {
      title: "Ovoo",
      age: "1",
      imgSrc: "/assets/pictures/building_mongols/ovoo.png",
      civ: ["MON"],
      class: "default"
    },
    {
      title: "Hunting Cabin",
      age: "1",
      imgSrc: "/assets/pictures/building_rus/hunting-cabin.png",
      civ: ["RUS"],
      class: "default"
    },
    {
      title: "Town Center (TC)",
      age: "2",
      imgSrc: "/assets/pictures/building_economy/town-center.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MON",
        "MAL",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "default"
    },
    {
      title: "Market",
      age: "2",
      imgSrc: "/assets/pictures/building_economy/market.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MON",
        "MAL",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "default"
    },
    {
      title: "Village",
      age: "2",
      imgSrc: "/assets/pictures/building_chinese/village.png",
      civ: ["CHI"],
      class: "default"
    },
    {
      title: "Granary",
      age: "2",
      imgSrc: "/assets/pictures/building_chinese/granary.png",
      civ: ["CHI"],
      class: "default"
    },
    {
      title: "Cattle Ranch",
      age: "2",
      imgSrc: "/assets/pictures/building_malians/cattle-ranch-2.png",
      civ: ["MAL"],
      class: "default"
    },
  ];

  const building_tech = [
    {
      title: "Ovoo",
      age: "1",
      imgSrc: "/assets/pictures/building_mongols/ovoo.png",
      civ: ["MON"],
      class: "tech"
    },
    {
      title: "Blacksmith",
      age: "2",
      imgSrc: "/assets/pictures/building_technology/blacksmith.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "tech"
    },
    {
      title: "University",
      age: "2",
      imgSrc: "/assets/pictures/building_technology/university.png",
      civ: ["ENG", "FRE", "RUS", "OTT", "CHI", "HRE"],
      class: "tech"
    },
    {
      title: "Madrasa",
      age: "2",
      imgSrc: "/assets/pictures/building_technology/madrasa.png",
      civ: ["MAL", "ABB", "DEL"],
      class: "tech"
    },
  ];

  const building_military = [
    {
      title: "Barracks",
      age: "1",
      imgSrc: "/assets/pictures/building_military/barracks.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "military"
    },
    {
      title: "Military School",
      age: "1",
      imgSrc: "/assets/pictures/building_ottomans/military-school-1.png",
      civ: ["OTT"],
      class: "military"
    },
    {
      title: "Archery Range",
      age: "2",
      imgSrc: "/assets/pictures/building_military/archery-range.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "military"
    },
    {
      title: "Stable",
      age: "2",
      imgSrc: "/assets/pictures/building_military/stable.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "military"
    },
    {
      title: "Siege Workshop",
      age: "3",
      imgSrc: "/assets/pictures/building_military/siege-workshop.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "military"
    },
    {
      title: "Dock",
      age: "1",
      imgSrc: "/assets/pictures/building_military/dock.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "military"
    },
    {
      title: "Keep",
      age: "3",
      imgSrc: "/assets/pictures/building_defensive/keep.png",
      civ: ["ENG", "FRE", "RUS", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "default"
    },
    {
      title: "Outpost",
      age: "1",
      imgSrc: "/assets/pictures/building_defensive/outpost.png",
      civ: ["ENG", "FRE", "MON", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "default"
    },
    {
      title: "Toll Outpost",
      age: "1",
      imgSrc: "/assets/pictures/building_malians/toll-outpost-1.png",
      civ: ["MAL"],
      class: "default"
    },
    {
      title: "Palisade Gate",
      age: "1",
      imgSrc: "/assets/pictures/building_defensive/palisade-gate.png",
      civ: ["ENG", "FRE", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "default"
    },
    {
      title: "Palisade Wall",
      age: "1",
      imgSrc: "/assets/pictures/building_defensive/palisade-wall.png",
      civ: ["ENG", "FRE", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "default"
    },
    {
      title: "Wooden Fortress",
      age: "1",
      imgSrc: "/assets/pictures/building_rus/wooden-fortress.png",
      civ: ["RUS"],
      class: "default"
    },
    {
      title: "Fortified Palisade Gate",
      age: "1",
      imgSrc: "/assets/pictures/building_rus/fortified-palisade-gate.png",
      civ: ["RUS"],
      class: "default"
    },
    {
      title: "Fortified Palisade Wall",
      age: "1",
      imgSrc: "/assets/pictures/building_rus/fortified-palisade-wall.png",
      civ: ["RUS"],
      class: "default"
    },
    {
      title: "Stone Wall Gate",
      age: "3",
      imgSrc: "/assets/pictures/building_defensive/stone-wall-gate.png",
      civ: ["ENG", "FRE", "RUS", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "default"
    },
    {
      title: "Stone Wall Tower",
      age: "3",
      imgSrc: "/assets/pictures/building_defensive/stone-wall-tower.png",
      civ: ["ENG", "FRE", "RUS", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "default"
    },
  ];

  const unit_religious = [
    {
      title: "Monk",
      age: "3",
      imgSrc: "/assets/pictures/unit_religious/monk-3.png",
      civ: ["ENG", "FRE", "RUS", "MAL", "MON", "CHI", "HRE"],
      class: "military"
    },
    {
      title: "Imam",
      age: "3",
      imgSrc: "/assets/pictures/unit_abbasid/imam.png",
      civ: ["ABB", "OTT"],
      class: "military"
    },
    {
      title: "Scholar",
      age: "1",
      imgSrc: "/assets/pictures/unit_delhi/scholar.png",
      civ: ["DEL"],
      class: "military"
    },
    {
      title: "Prelate",
      age: "1",
      imgSrc: "/assets/pictures/unit_hre/prelate.png",
      civ: ["HRE"],
      class: "military"
    },
    {
      title: "Shaman",
      age: "1",
      imgSrc: "/assets/pictures/unit_mongols/shaman.png",
      civ: ["MON"],
      class: "military"
    },
  ];

  const unit_military = [
    {
      title: "Scout",
      age: "1",
      imgSrc: "/assets/pictures/unit_cavalry/scout.png",
      civ: ["ENG", "FRE", "RUS", "MON", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "military"
    },
    {
      title: "Archer",
      age: "2",
      imgSrc: "/assets/pictures/unit_infantry/archer-2.png",
      civ: ["FRE", "RUS", "MAL", "MON", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "military"
    },
    {
      title: "Crossbowman",
      age: "3",
      imgSrc: "/assets/pictures/unit_infantry/crossbowman-3.png",
      civ: ["ENG", "RUS", "MON", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "military"
    },
    {
      title: "Handcannoneer",
      age: "4",
      imgSrc: "/assets/pictures/unit_infantry/handcannoneer-4.png",
      civ: ["ENG", "FRE", "MON", "ABB", "CHI", "DEL", "HRE"],
      class: "military"
    },
    {
      title: "Spearman",
      age: "1",
      imgSrc: "/assets/pictures/unit_infantry/spearman-1.png",
      civ: ["ENG", "FRE", "RUS", "MON", "ABB", "OTT", "CHI", "DEL", "HRE"],
      class: "military"
    },
    {
      title: "Man-at-Arms (MAA)",
      age: "3",
      imgSrc: "/assets/pictures/unit_infantry/man-at-arms-1.png",
      civ: ["ENG", "FRE", "RUS", "MON", "OTT", "DEL", "HRE"],
      class: "military"
    },
    {
      title: "Ghulam",
      age: "3",
      imgSrc: "/assets/pictures/unit_abbasid/ghulam-3.png",
      civ: ["ABB"],
      class: "military"
    },
    {
      title: "Horseman",
      age: "2",
      imgSrc: "/assets/pictures/unit_cavalry/horseman-1.png",
      civ: ["ENG", "FRE", "RUS", "MON", "OTT", "CHI", "HRE"],
      class: "military"
    },
    {
      title: "Ghazi Raider",
      age: "2",
      imgSrc: "/assets/pictures/unit_delhi/ghazi-raider-2.png",
      civ: ["DEL"],
      class: "military"
    },
    {
      title: "Knight",
      age: "3",
      imgSrc: "/assets/pictures/unit_cavalry/knight-2.png",
      civ: ["ENG", "RUS", "HRE"],
      class: "military"
    },
    {
      title: "Lancer",
      age: "3",
      imgSrc: "/assets/pictures/unit_cavalry/lancer-3.png",
      civ: ["ABB", "OTT", "CHI", "DEL"],
      class: "military"
    },
    {
      title: "Camel Rider",
      age: "3",
      imgSrc: "/assets/pictures/unit_abbasid/camel-rider-3.png",
      civ: ["ABB"],
      class: "military"
    },
    {
      title: "Camel Archer",
      age: "2",
      imgSrc: "/assets/pictures/unit_abbasid/camel-archer-2.png",
      civ: ["ABB"],
      class: "military"
    },
    {
      title: "Zhuge Nu",
      age: "2",
      imgSrc: "/assets/pictures/unit_chinese/zhuge-nu-2.png",
      civ: ["CHI"],
      class: "military"
    },
    {
      title: "Palace Guard",
      age: "3",
      imgSrc: "/assets/pictures/unit_chinese/palace-guard-3.png",
      civ: ["CHI"],
      class: "military"
    },
    {
      title: "Nest of Bees",
      age: "3",
      imgSrc: "/assets/pictures/unit_chinese/nest-of-bees.png",
      civ: ["CHI"],
      class: "military"
    },
    {
      title: "Fire Lancer",
      age: "3",
      imgSrc: "/assets/pictures/unit_chinese/fire-lancer-3.png",
      civ: ["CHI"],
      class: "military"
    },
    {
      title: "Grenadier",
      age: "4",
      imgSrc: "/assets/pictures/unit_chinese/grenadier-4.png",
      civ: ["CHI"],
      class: "military"
    },
    {
      title: "Tower Elephant",
      age: "3",
      imgSrc: "/assets/pictures/unit_delhi/tower-elephant-3.png",
      civ: ["DEL"],
      class: "military"
    },
    {
      title: "Sultan's Elite Tower Elephant",
      age: "4",
      imgSrc: "/assets/pictures/unit_delhi/sultans-elite-tower-elephant-4.png",
      civ: ["DEL"],
      class: "military"
    },
    {
      title: "War Elephant",
      age: "3",
      imgSrc: "/assets/pictures/unit_delhi/war-elephant.png",
      civ: ["DEL"],
      class: "military"
    },
    {
      title: "Longbowman",
      age: "2",
      imgSrc: "/assets/pictures/unit_english/longbowman-2.png",
      civ: ["ENG"],
      class: "military"
    },
    {
      title: "King",
      age: "2",
      imgSrc: "/assets/pictures/unit_english/king-2.png",
      civ: ["ENG"],
      class: "military"
    },
    {
      title: "Wynguard Ranger",
      age: "4",
      imgSrc: "/assets/pictures/unit_english/wynguard-ranger-4.png",
      civ: ["ENG"],
      class: "military"
    },
    {
      title: "Wynguard Footmen",
      age: "4",
      imgSrc: "/assets/pictures/unit_english/wynguard-footmen-1.png",
      civ: ["ENG"],
      class: "military"
    },
    {
      title: "Wynguard Army",
      age: "4",
      imgSrc: "/assets/pictures/unit_english/wynguard-army-1.png",
      civ: ["ENG"],
      class: "military"
    },
    {
      title: "Wynguard Raiders",
      age: "4",
      imgSrc: "/assets/pictures/unit_english/wynguard-raiders-1.png",
      civ: ["ENG"],
      class: "military"
    },
    {
      title: "Royal Knight",
      age: "2",
      imgSrc: "/assets/pictures/unit_french/royal-knight-2.png",
      civ: ["FRE"],
      class: "military"
    },
    {
      title: "Arbalétrier",
      age: "3",
      imgSrc: "/assets/pictures/unit_french/arbaletrier-3.png",
      civ: ["FRE"],
      class: "military"
    },
    {
      title: "Galleass",
      age: "3",
      imgSrc: "/assets/pictures/unit_french/galleass.png",
      civ: ["FRE"],
      class: "military"
    },
    {
      title: "Cannon",
      age: "4",
      imgSrc: "/assets/pictures/unit_french/cannon-4.png",
      civ: ["FRE"],
      class: "military"
    },
    {
      title: "Landsknecht",
      age: "4",
      imgSrc: "/assets/pictures/unit_hre/landsknecht-3.png",
      civ: ["HRE"],
      class: "military"
    },
    {
      title: "Donso",
      age: "1",
      imgSrc: "/assets/pictures/unit_malians/donso-1.png",
      civ: ["MAL"],
      class: "military"
    },
    {
      title: "Musofadi Warrior",
      age: "2",
      imgSrc: "/assets/pictures/unit_malians/musofadi-warrior-2.png",
      civ: ["MAL"],
      class: "military"
    },
    {
      title: "Javelin Thrower",
      age: "2",
      imgSrc: "/assets/pictures/unit_malians/javelin-thrower-2.png",
      civ: ["MAL"],
      class: "military"
    },
    {
      title: "Warrior Scout",
      age: "1",
      imgSrc: "/assets/pictures/unit_malians/warrior-scout-2.png",
      civ: ["MAL"],
      class: "military"
    },
    {
      title: "Sofa",
      age: "2",
      imgSrc: "/assets/pictures/unit_malians/sofa-2.png",
      civ: ["MAL"],
      class: "military"
    },
    {
      title: "Musofadi Gunner",
      age: "4",
      imgSrc: "/assets/pictures/unit_malians/musofadi-gunner-4.png",
      civ: ["MAL"],
      class: "military"
    },
    {
      title: "Khan",
      age: "1",
      imgSrc: "/assets/pictures/unit_mongols/khan-1.png",
      civ: ["MON"],
      class: "military"
    },
    {
      title: "Mangudai",
      age: "2",
      imgSrc: "/assets/pictures/unit_mongols/mangudai.png",
      civ: ["MON"],
      class: "military"
    },
    {
      title: "Keshik",
      age: "3",
      imgSrc: "/assets/pictures/unit_mongols/keshik-2.png",
      civ: ["MON"],
      class: "military"
    },
    {
      title: "Traction Trebuchet",
      age: "2",
      imgSrc: "/assets/pictures/unit_mongols/traction-trebuchet.png",
      civ: ["MON"],
      class: "military"
    },
    {
      title: "Huihui Pao",
      age: "4",
      imgSrc: "/assets/pictures/unit_mongols/huihui-pao-1.png",
      civ: ["MON"],
      class: "military"
    },
    {
      title: "Sipahi",
      age: "2",
      imgSrc: "/assets/pictures/unit_ottomans/sipahi-2.png",
      civ: ["OTT"],
      class: "military"
    },
    {
      title: "Mehter",
      age: "2",
      imgSrc: "/assets/pictures/unit_ottomans/mehter-2.png",
      civ: ["OTT"],
      class: "military"
    },
    {
      title: "Janissary",
      age: "3",
      imgSrc: "/assets/pictures/unit_ottomans/janissary-3.png",
      civ: ["OTT"],
      class: "military"
    },
    {
      title: "Great Bombard",
      age: "4",
      imgSrc: "/assets/pictures/unit_ottomans/great-bombard-4.png",
      civ: ["OTT"],
      class: "military"
    },
    {
      title: "Grand Galley",
      age: "4",
      imgSrc: "/assets/pictures/unit_ottomans/grand-galley-4.png",
      civ: ["OTT"],
      class: "military"
    },
    {
      title: "Lodya Transport Ship",
      age: "1",
      imgSrc: "/assets/pictures/unit_rus/lodya-transport-ship.png",
      civ: ["RUS"],
      class: "military"
    },
    {
      title: "Lodya Trade Ship",
      age: "2",
      imgSrc: "/assets/pictures/unit_rus/lodya-trade-ship.png",
      civ: ["RUS"],
      class: "default"
    },
    {
      title: "Lodya Galley",
      age: "2",
      imgSrc: "/assets/pictures/unit_rus/lodya-galley-3.png",
      civ: ["RUS"],
      class: "military"
    },
    {
      title: "Lodya Demolition Ship",
      age: "2",
      imgSrc: "/assets/pictures/unit_rus/lodya-demolition-ship.png",
      civ: ["RUS"],
      class: "military"
    },
    {
      title: "Lodya Attack Ship",
      age: "2",
      imgSrc: "/assets/pictures/unit_rus/lodya-attack-ship.png",
      civ: ["RUS"],
      class: "military"
    },
    {
      title: "Warrior Monk",
      age: "3",
      imgSrc: "/assets/pictures/unit_rus/warrior-monk.png",
      civ: ["RUS"],
      class: "military"
    },
    {
      title: "Horse Archer",
      age: "3",
      imgSrc: "/assets/pictures/unit_rus/horse-archer-3.png",
      civ: ["RUS"],
      class: "military"
    },
    {
      title: "Streltsy",
      age: "3",
      imgSrc: "/assets/pictures/unit_rus/streltsy.png",
      civ: ["RUS"],
      class: "military"
    },
    {
      title: "Militia",
      age: "2",
      imgSrc: "/assets/pictures/unit_rus/militia-2.png",
      civ: ["RUS"],
      class: "military"
    },
    {
      title: "Siege Tower",
      age: "2",
      imgSrc: "/assets/pictures/unit_siege/siege-tower.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "military"
    },
    {
      title: "Battering Ram",
      age: "2",
      imgSrc: "/assets/pictures/unit_siege/battering-ram.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "military"
    },
    {
      title: "Springald",
      age: "3",
      imgSrc: "/assets/pictures/unit_siege/springald.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "military"
    },
    {
      title: "Mangonel",
      age: "3",
      imgSrc: "/assets/pictures/unit_siege/mangonel-3.png",
      civ: ["ENG", "FRE", "RUS", "MAL", "MON", "ABB", "OTT", "DEL", "HRE"],
      class: "military"
    },
    {
      title: "Counterweight Trebuchet",
      age: "3",
      imgSrc: "/assets/pictures/unit_siege/trebuchet.png",
      civ: ["ENG", "FRE", "RUS", "MAL", "CHI", "ABB", "OTT", "DEL", "HRE"],
      class: "military"
    },
    {
      title: "Bombard",
      age: "3",
      imgSrc: "/assets/pictures/unit_siege/bombard.png",
      civ: ["ENG", "RUS", "MAL", "MON", "ABB", "CHI", "DEL", "HRE"],
      class: "military"
    },
    {
      title: "Ribauldequin",
      age: "4",
      imgSrc: "/assets/pictures/unit_siege/ribauldequin-4.png",
      civ: ["ENG", "FRE", "OTT"],
      class: "military"
    },
    {
      title: "Culverin",
      age: "4",
      imgSrc: "/assets/pictures/unit_siege/culverin-4.png",
      civ: ["ABB", "HRE", "FRE", "MAL"],
      class: "military"
    },
    {
      title: "Dhow",
      age: "2",
      imgSrc: "/assets/pictures/unit_ship/dhow.png",
      civ: ["ABB", "DEL", "OTT"],
      class: "military"
    },
    {
      title: "Galley",
      age: "2",
      imgSrc: "/assets/pictures/unit_ship/dhow.png",
      civ: ["ENG", "HRE", "FRE"],
      class: "military"
    },
    {
      title: "Junk",
      age: "2",
      imgSrc: "/assets/pictures/unit_ship/dhow.png",
      civ: ["CHI"],
      class: "military"
    },
    {
      title: "Light Junk",
      age: "2",
      imgSrc: "/assets/pictures/unit_ship/dhow.png",
      civ: ["MON"],
      class: "military"
    },
    {
      title: "Hunting Canoe",
      age: "2",
      imgSrc: "/assets/pictures/unit_ship/dhow.png",
      civ: ["MAL"],
      class: "military"
    },
    {
      title: "Baghlah",
      age: "2",
      imgSrc: "/assets/pictures/unit_ship/baghlah.png",
      civ: ["ABB", "DEL"],
      class: "military"
    },
    {
      title: "Hulk",
      age: "2",
      imgSrc: "/assets/pictures/unit_ship/baghlah.png",
      civ: ["ENG", "HRE", "OTT"],
      class: "military"
    },
    {
      title: "War Cog",
      age: "2",
      imgSrc: "/assets/pictures/unit_french/war-cog.png",
      civ: ["FRE"],
      class: "military"
    },
    {
      title: "War Junk",
      age: "2",
      imgSrc: "/assets/pictures/unit_ship/baghlah.png",
      civ: ["CHI", "MON"],
      class: "military"
    },
    {
      title: "War Canoe",
      age: "2",
      imgSrc: "/assets/pictures/unit_ship/baghlah.png",
      civ: ["MAL"],
      class: "military"
    },
    {
      title: "Explosive Dhow",
      age: "2",
      imgSrc: "/assets/pictures/unit_ship/explosive-dhow.png",
      civ: ["ABB", "DEL"],
      class: "military"
    },
    {
      title: "Demolition Ship",
      age: "2",
      imgSrc: "/assets/pictures/unit_ship/explosive-dhow.png",
      civ: ["ENG", "FRE", "HRE", "MAL", "OTT"],
      class: "military"
    },
    {
      title: "Explosive Junk",
      age: "2",
      imgSrc: "/assets/pictures/unit_ship/explosive-dhow.png",
      civ: ["CHI", "MON"],
      class: "military"
    },
    {
      title: "Xebec",
      age: "4",
      imgSrc: "/assets/pictures/unit_ship/xebec.png",
      civ: ["ABB", "DEL"],
      class: "military"
    },
    {
      title: "Carrack",
      age: "4",
      imgSrc: "/assets/pictures/unit_ship/xebec.png",
      civ: ["ENG", "FRE", "HRE", "OTT"],
      class: "military"
    },
    {
      title: "Baochuan",
      age: "4",
      imgSrc: "/assets/pictures/unit_ship/xebec.png",
      civ: ["CHI", "MON"],
      class: "military"
    },
  ];

  const unit_eco = [
    {
      title: "Villager",
      age: "1",
      imgSrc: "/assets/pictures/unit_worker/villager.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "HRE",
      ],
      class: "default"
    },
    {
      title: "Villager",
      age: "1",
      imgSrc: "/assets/pictures/unit_worker/villager-delhi.png",
      civ: [
        "DEL",
      ],
      class: "default"
    },
    {
      title: "Villager",
      age: "1",
      imgSrc: "/assets/pictures/unit_worker/villager-malians.png",
      civ: [
        "MAL",
      ],
      class: "default"
    },
    {
      title: "Villager",
      age: "1",
      imgSrc: "/assets/pictures/unit_worker/villager-china.png",
      civ: [
        "CHI",
      ],
      class: "default"
    },
    {
      title: "Villager",
      age: "1",
      imgSrc: "/assets/pictures/unit_worker/villager-abbasid.png",
      civ: [
        "ABB",
      ],
      class: "default"
    },
    {
      title: "Villager",
      age: "1",
      imgSrc: "/assets/pictures/unit_worker/villager-ottomans.png",
      civ: [
        "OTT",
      ],
      class: "default"
    },
    {
      title: "Villager",
      age: "1",
      imgSrc: "/assets/pictures/unit_worker/villager-mongols.png",
      civ: [
        "MON",
      ],
      class: "default"
    },
    {
      title: "Lodya Fishing Boat",
      age: "1",
      imgSrc: "/assets/pictures/unit_rus/lodya-fishing-boat.png",
      civ: ["RUS"],
      class: "default"
    },
    {
      title: "Fishing Boat",
      age: "1",
      imgSrc: "/assets/pictures/unit_ship/fishing-boat.png",
      civ: [
        "ENG",
        "FRE",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "default"
    },
    {
      title: "Trader",
      age: "2",
      imgSrc: "/assets/pictures/unit_worker/trader.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
      class: "default"
    },
    {
      title: "Imperial Official",
      age: "1",
      imgSrc: "/assets/pictures/unit_chinese/imperial-official.png",
      civ: ["CHI"],
      class: "default"
    },
  ];

  return { getIcons, getIconFromImgPath };
}
