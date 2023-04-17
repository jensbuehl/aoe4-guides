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
    },
  ];
  
  const resource = [
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
    },
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
    }
    ,
    {
      title: "Build or Repair",
      age: "1",
      imgSrc: "/assets/pictures/resource/repair.png",
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
    }
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
      title: "Chamber of Commerce",
      age: "1",
      imgSrc: "/assets/pictures/landmark_french/chamber-of-commerce.png",
      civ: ["FRE"],
    },
    {
      title: "School of Cavalry",
      age: "1",
      imgSrc: "/assets/pictures/landmark_french/school-of-cavalry.png",
      civ: ["FRE"],
    },
    {
      title: "Guild Hall",
      age: "2",
      imgSrc: "/assets/pictures/landmark_french/guild-hall.png",
      civ: ["FRE"],
    },
    {
      title: "Royal Institute",
      age: "2",
      imgSrc: "/assets/pictures/landmark_french/royal-institute.png",
      civ: ["FRE"],
    },
    {
      title: "College of Artillery",
      age: "3",
      imgSrc: "/assets/pictures/landmark_french/college-of-artillery.png",
      civ: ["FRE"],
    },
    {
      title: "Red Palace",
      age: "3",
      imgSrc: "/assets/pictures/landmark_french/red-palace.png",
      civ: ["FRE"],
    },
    {
      title: "Notre Dame",
      age: "4",
      imgSrc: "/assets/pictures/landmark_french/notre-dame.png",
      civ: ["FRE"],
    },
    {
      title: "Aachen Chapel",
      age: "1",
      imgSrc: "/assets/pictures/landmark_hre/aachen-chapel.png",
      civ: ["HRE"],
    },
    {
      title: "Meinwerk Palace",
      age: "1",
      imgSrc: "/assets/pictures/landmark_hre/meinwerk-palace.png",
      civ: ["HRE"],
    },
    {
      title: "Burgrave Palace",
      age: "2",
      imgSrc: "/assets/pictures/landmark_hre/burgrave-palace.png",
      civ: ["HRE"],
    },
    {
      title: "Regnitz Cathedral",
      age: "2",
      imgSrc: "/assets/pictures/landmark_hre/regnitz-cathedral.png",
      civ: ["HRE"],
    },
    {
      title: "Elzbach Palace",
      age: "3",
      imgSrc: "/assets/pictures/landmark_hre/elzbach-palace.png",
      civ: ["HRE"],
    },
    {
      title: "Palace of Swabia",
      age: "3",
      imgSrc: "/assets/pictures/landmark_hre/palace-of-swabia.png",
      civ: ["HRE"],
    },
    {
      title: "Great Palace of Flensburg",
      age: "4",
      imgSrc: "/assets/pictures/landmark_hre/great-palace-of-flensburg.png",
      civ: ["HRE"],
    },
    {
      title: "Saharan Trade Network",
      age: "1",
      imgSrc: "/assets/pictures/landmark_malians/saharan-trade-network-1.png",
      civ: ["MAL"],
    },
    {
      title: "Mansa Quarry",
      age: "1",
      imgSrc: "/assets/pictures/landmark_malians/mansa-quarry-2.png",
      civ: ["MAL"],
    },
    {
      title: "Grand Fulani Corral",
      age: "2",
      imgSrc: "/assets/pictures/landmark_malians/grand-fulani-corral-2.png",
      civ: ["MAL"],
    },
    {
      title: "Farimba Garrison",
      age: "2",
      imgSrc: "/assets/pictures/landmark_malians/farimba-garrison-2.png",
      civ: ["MAL"],
    },
    {
      title: "Fort of the Huntress",
      age: "3",
      imgSrc: "/assets/pictures/landmark_malians/fort-of-the-huntress-3.png",
      civ: ["MAL"],
    },
    {
      title: "Griot Bara",
      age: "3",
      imgSrc: "/assets/pictures/landmark_malians/griot-bara-3.png",
      civ: ["MAL"],
    },
    {
      title: "Great Mosque",
      age: "4",
      imgSrc: "/assets/pictures/landmark_malians/great-mosque-4.png",
      civ: ["MAL"],
    },
    {
      title: "Deer Stones",
      age: "1",
      imgSrc: "/assets/pictures/landmark_mongols/deer-stones.png",
      civ: ["MON"],
    },
    {
      title: "The Silver Tree",
      age: "1",
      imgSrc: "/assets/pictures/landmark_mongols/the-silver-tree.png",
      civ: ["MON"],
    },
    {
      title: "Kurultai",
      age: "2",
      imgSrc: "/assets/pictures/landmark_mongols/kurultai.png",
      civ: ["MON"],
    },
    {
      title: "Steppe Redoubt",
      age: "2",
      imgSrc: "/assets/pictures/landmark_mongols/steppe-redoubt.png",
      civ: ["MON"],
    },
    {
      title: "Khaganate Palace",
      age: "3",
      imgSrc: "/assets/pictures/landmark_mongols/khaganate-palace.png",
      civ: ["MON"],
    },
    {
      title: "The White Stupa",
      age: "3",
      imgSrc: "/assets/pictures/landmark_mongols/the-white-stupa.png",
      civ: ["MON"],
    },
    {
      title: "Monument of the Great Khan",
      age: "4",
      imgSrc:
        "/assets/pictures/landmark_mongols/monument-of-the-great-khan.png",
      civ: ["MON"],
    },
    {
      title: "Twin Minaret Medrese",
      age: "1",
      imgSrc: "/assets/pictures/landmark_ottomans/twin-minaret-medrese-1.png",
      civ: ["OTT"],
    },
    {
      title: "Sultanhani Trade Network",
      age: "1",
      imgSrc:
        "/assets/pictures/landmark_ottomans/sultanhani-trade-network-1.png",
      civ: ["OTT"],
    },
    {
      title: "Istanbul Imperial Palace",
      age: "2",
      imgSrc:
        "/assets/pictures/landmark_ottomans/istanbul-imperial-palace-2.png",
      civ: ["OTT"],
    },
    {
      title: "Mehmed Imperial Armory",
      age: "2",
      imgSrc: "/assets/pictures/landmark_ottomans/mehmed-imperial-armory-2.png",
      civ: ["OTT"],
    },
    {
      title: "Istanbul Observatory",
      age: "3",
      imgSrc: "/assets/pictures/landmark_ottomans/istanbul-observatory-3.png",
      civ: ["OTT"],
    },
    {
      title: "Sea Gate Castle",
      age: "3",
      imgSrc: "/assets/pictures/landmark_ottomans/sea-gate-castle-3.png",
      civ: ["OTT"],
    },
    {
      title: "Azure Mosque",
      age: "4",
      imgSrc: "/assets/pictures/landmark_ottomans/azure-mosque-4.png",
      civ: ["OTT"],
    },
    {
      title: "Kremlin",
      age: "1",
      imgSrc: "/assets/pictures/landmark_rus/kremlin.png",
      civ: ["RUS"],
    },
    {
      title: "The Golden Gate",
      age: "1",
      imgSrc: "/assets/pictures/landmark_rus/the-golden-gate.png",
      civ: ["RUS"],
    },
    {
      title: "Abbey of the Trinity",
      age: "2",
      imgSrc: "/assets/pictures/landmark_rus/abbey-of-the-trinity.png",
      civ: ["RUS"],
    },
    {
      title: "High Trade House",
      age: "2",
      imgSrc: "/assets/pictures/landmark_rus/high-trade-house.png",
      civ: ["RUS"],
    },
    {
      title: "High Armory",
      age: "3",
      imgSrc: "/assets/pictures/landmark_rus/high-armory.png",
      civ: ["RUS"],
    },
    {
      title: "Spasskaya Tower",
      age: "3",
      imgSrc: "/assets/pictures/landmark_rus/spasskaya-tower.png",
      civ: ["RUS"],
    },
    {
      title: "Cathedral of the Tsar",
      age: "4",
      imgSrc: "/assets/pictures/landmark_rus/cathedral-of-the-tsar.png",
      civ: ["RUS"],
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
    },
    {
      title: "Improved Processing",
      age: "1",
      imgSrc: "/assets/pictures/technology_abbasid/improved-processing.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Agriculture",
      age: "3",
      imgSrc: "/assets/pictures/technology_abbasid/agriculture.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Preservation of Knowledge",
      age: "2",
      imgSrc: "/assets/pictures/technology_abbasid/preservation-of-knowledge.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Armored Caravans",
      age: "3",
      imgSrc: "/assets/pictures/technology_abbasid/armored-caravans.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Grand Bazaar",
      age: "2",
      imgSrc: "/assets/pictures/technology_abbasid/grand-bazaar.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Spice Roads",
      age: "4",
      imgSrc: "/assets/pictures/technology_abbasid/spice-roads.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Fresh Foodstuffs",
      age: "2",
      imgSrc: "/assets/pictures/technology_abbasid/fresh-foodstuffs.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Fertile Crescent",
      age: "2",
      imgSrc: "/assets/pictures/age/age_unknown.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Extra Materials",
      age: "3",
      imgSrc: "/assets/pictures/technology_chinese/extra-materials.png",
      civ: [
        "CHI"
      ],
    },
    {
      title: "Ancient Techniques",
      age: "4",
      imgSrc: "/assets/pictures/technology_chinese/ancient-techniques.png",
      civ: [
        "CHI"
      ],
    },
    {
      title: "Imperial Examinations",
      age: "2",
      imgSrc: "/assets/pictures/technology_chinese/imperial-examination.png",
      civ: [
        "CHI"
      ],
    },
  ];

  const tech_military = [
    {
      title: "Angled Surfaces",
      age: "1",
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
    },
    {
      title: "Court Architects",
      age: "4",
      imgSrc: "/assets/pictures/technology_defensive/court-architects.png",
      civ: [
        "ENG",
        "FRE",
        "RUS",
        "MAL",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
    },
    {
      title: "Fortify Outpost",
      age: "2",
      imgSrc: "/assets/pictures/technology_defensive/fortify-outpost.png",
      civ: [
        "ENG",
        "FRE",
        "MAL",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
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
    },
    {
      title: "Naval Arrowslits",
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
    },
    {
      title: "Composite Bows",
      age: "3",
      imgSrc: "/assets/pictures/technology_abbasid/composite-bows.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Camel Rider Barding",
      age: "4",
      imgSrc: "/assets/pictures/technology_abbasid/camel-rider-barding-4.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Camel Handling",
      age: "3",
      imgSrc: "/assets/pictures/technology_abbasid/camel-handling.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Camel Support",
      age: "4",
      imgSrc: "/assets/pictures/technology_abbasid/camel-support.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Camel Rider Shields",
      age: "3",
      imgSrc: "/assets/pictures/technology_abbasid/camel-rider-shields.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Medical Centers",
      age: "3",
      imgSrc: "/assets/pictures/technology_abbasid/medical-centers.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Boot Camp",
      age: "2",
      imgSrc: "/assets/pictures/technology_abbasid/boot-camp.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Teak Masts",
      age: "3",
      imgSrc: "/assets/pictures/technology_abbasid/teak-masts.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Proselytization",
      age: "4",
      imgSrc: "/assets/pictures/technology_abbasid/faith.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Phalanx",
      age: "2",
      imgSrc: "/assets/pictures/technology_abbasid/phalanx.png",
      civ: [
        "ABB"
      ],
    },
    {
      title: "Pyrotechnics",
      age: "4",
      imgSrc: "/assets/pictures/technology_chinese/pyrotechnics.png",
      civ: [
        "CHI"
      ],
    },
    {
      title: "Reload Drills",
      age: "4",
      imgSrc: "/assets/pictures/technology_chinese/reload-drills.png",
      civ: [
        "CHI"
      ],
    },
    {
      title: "Reusable Barrels",
      age: "4",
      imgSrc: "/assets/pictures/technology_chinese/reusable-barrels.png",
      civ: [
        "CHI"
      ],
    },
    {
      title: "Battle Hardened",
      age: "4",
      imgSrc: "/assets/pictures/technology_chinese/battle-hardened.png",
      civ: [
        "CHI"
      ],
    },
    {
      title: "Handcannon Slits",
      age: "2",
      imgSrc: "/assets/pictures/technology_chinese/handcannon-slits.png",
      civ: [
        "CHI"
      ],
    },
    {
      title: "Thunderclap Bombs",
      age: "4",
      imgSrc: "/assets/pictures/technology_chinese/thunderclap-bombs-4.png",
      civ: [
        "CHI"
      ],
    },
  ];

  const building_religious = [
    {
      title: "Monastery",
      age: "3",
      imgSrc: "/assets/pictures/building_religious/monastery.png",
      civ: ["ENG", "FRE", "RUS", "CHI", "HRE"],
    },
    {
      title: "Mosque",
      age: "3",
      imgSrc: "/assets/pictures/building_religious/mosque.png",
      civ: ["ABB", "DEL", "MAL", "OTT"],
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
      civ: ["ENG", "FRE", "RUS", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
    },
    {
      title: "House",
      age: "1",
      imgSrc: "/assets/pictures/building_economy/house.png",
      civ: ["ENG", "FRE", "RUS", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
    },
    {
      title: "Lumber Camp",
      age: "1",
      imgSrc: "/assets/pictures/building_economy/lumber-camp.png",
      civ: ["ENG", "FRE", "RUS", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
    },
    {
      title: "Mining Camp",
      age: "1",
      imgSrc: "/assets/pictures/building_economy/mining-camp.png",
      civ: ["ENG", "FRE", "RUS", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
    },
    {
      title: "Mill",
      age: "1",
      imgSrc: "/assets/pictures/building_economy/mill.png",
      civ: ["ENG", "FRE", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
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
    },
    {
      title: "University",
      age: "2",
      imgSrc: "/assets/pictures/building_technology/university.png",
      civ: ["ENG", "FRE", "RUS", "OTT", "CHI", "HRE"],
    },
    {
      title: "Madrasa",
      age: "2",
      imgSrc: "/assets/pictures/building_technology/madrasa.png",
      civ: ["MAL", "ABB", "DEL"],
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
    },
    {
      title: "Keep",
      age: "3",
      imgSrc: "/assets/pictures/building_defensive/keep.png",
      civ: ["ENG", "FRE", "RUS", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
    },
    {
      title: "Outpost",
      age: "1",
      imgSrc: "/assets/pictures/building_defensive/outpost.png",
      civ: ["ENG", "FRE", "MON", "ABB", "OTT", "CHI", "DEL", "HRE"],
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
      civ: ["ENG", "FRE", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
    },
    {
      title: "Palisade Wall",
      age: "1",
      imgSrc: "/assets/pictures/building_defensive/palisade-wall.png",
      civ: ["ENG", "FRE", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
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
      civ: ["ENG", "FRE", "RUS", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
    },
    {
      title: "Stone Wall Tower",
      age: "3",
      imgSrc: "/assets/pictures/building_defensive/stone-wall-tower.png",
      civ: ["ENG", "FRE", "RUS", "MAL", "ABB", "OTT", "CHI", "DEL", "HRE"],
    },
  ];

  const unit_religious = [
    {
      title: "Monk",
      age: "3",
      imgSrc: "/assets/pictures/unit_religious/monk-3.png",
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
    },
  ];

  const unit_military = [
    {
      title: "Archer",
      age: "2",
      imgSrc: "/assets/pictures/unit_infantry/archer-2.png",
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
        "MAL",
        "MON",
        "ABB",
        "OTT",
        "CHI",
        "DEL",
        "HRE",
      ],
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
    },
  ];

  return { getIcons };
}
