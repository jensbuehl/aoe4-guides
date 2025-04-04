import { ref } from "vue";

export const civs = ref([
  {
    title: "Any Civilization",
    shortName: "ANY",
    flagLarge: "assets/flags/any-large.png",
    flagSmall: "assets/flags/any-small.png",
  },
  {
    title: "Abbasid Dynasty",
    shortName: "ABB",
    tagLine: "Technology, Camels, City Planning",
    flagLarge: "assets/flags/abb-large.png",
    flagSmall: "assets/flags/abb-small.png",
  },
  {
    title: "Ayyubids",
    shortName: "AYY",
    tagLine: "Adaptable, Camels, City Planning",
    flagLarge: "assets/flags/ayy-large.png",
    flagSmall: "assets/flags/ayy-small.png",
  },
  {
    title: "Byzantines",
    shortName: "BYZ",
    tagLine: "City Planning, Mercenaries, Defense",
    flagLarge: "assets/flags/byz-large.png",
    flagSmall: "assets/flags/byz-small.png",
  },
  {
    title: "Chinese",
    shortName: "CHI",
    tagLine: "Dynasties, Gunpowder, Taxes",
    flagLarge: "assets/flags/chi-large.png",
    flagSmall: "assets/flags/chi-small.png",
  },
  {
    title: "Delhi Sultanate",
    shortName: "DEL",
    tagLine: "Elephants, Research, Religion",
    flagLarge: "assets/flags/del-large.png",
    flagSmall: "assets/flags/del-small.png",
  },
  {
    title: "English",
    shortName: "ENG",
    tagLine: "Defense, Longbows, Farming",
    flagLarge: "assets/flags/eng-large.png",
    flagSmall: "assets/flags/eng-small.png",
  },
  {
    title: "French",
    shortName: "FRE",
    tagLine: "Trade, Cavalry, Keeps",
    flagLarge: "assets/flags/fre-large.png",
    flagSmall: "assets/flags/fre-small.png",
  },
  {
    title: "Holy Roman Empire",
    shortName: "HRE",
    tagLine: "Infrantry, Religion, Defense",
    flagLarge: "assets/flags/hre-large.png",
    flagSmall: "assets/flags/hre-small.png",
  },
  {
    title: "House of Lancaster",
    shortName: "HOL",
    tagLine: "Manors, Economy, Versatility",
    flagLarge: "assets/flags/hol-large.png",
    flagSmall: "assets/flags/hol-small.png",
  },
  {
    title: "Japanese",
    shortName: "JAP",
    tagLine: "Agriculture, Bannermen, Infrantry",
    flagLarge: "assets/flags/jap-large.png",
    flagSmall: "assets/flags/jap-small.png",
  },
  {
    title: "Jeanne d'Arc",
    shortName: "JDA",
    tagLine: "Trade, Cavalry, Hero",
    flagLarge: "assets/flags/jda-large.png",
    flagSmall: "assets/flags/jda-small.png",
  },
  {
    title: "Knights Templar",
    shortName: "KTE",
    tagLine: "Diplomacy, Fortification, Commanderies",
    flagLarge: "assets/flags/kte-large.png",
    flagSmall: "assets/flags/kte-small.png",
  },
  {
    title: "Malian",
    shortName: "MAL",
    tagLine: "Gold Economy, Infantry, Cattle",
    flagLarge: "assets/flags/mal-large.png",
    flagSmall: "assets/flags/mal-small.png",
  },
  {
    title: "Mongols",
    shortName: "MON",
    tagLine: "Aggression, Cavalry, Nomadic",
    flagLarge: "assets/flags/mon-large.png",
    flagSmall: "assets/flags/mon-small.png",
  },
  {
    title: "Order of  the Dragon",
    shortName: "DRA",
    tagLine: "Quality, Infantry, Defense",
    flagLarge: "assets/flags/dra-large.png",
    flagSmall: "assets/flags/dra-small.png",
  },
  {
    title: "Ottomans",
    shortName: "OTT",
    tagLine: "Imperial Council, Military Schools, Siege",
    flagLarge: "assets/flags/ott-large.png",
    flagSmall: "assets/flags/ott-small.png",
  },
  {
    title: "Rus",
    shortName: "RUS",
    tagLine: "Expansion, Cavalry, Hunting",
    flagLarge: "assets/flags/rus-large.png",
    flagSmall: "assets/flags/rus-small.png",
  },
  {
    title: "Zhu Xi's Legacy",
    shortName: "ZXL",
    tagLine: "Dynasties, Taxes, Technology",
    flagLarge: "assets/flags/zxl-large.png",
    flagSmall: "assets/flags/zxl-small.png",
  },
]);

export function getCivById (id) {
  const civ = civs.value.find((civ) => civ.shortName === id);
  return civ
};