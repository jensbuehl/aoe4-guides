import { ref } from "vue";

export const civs = ref([
  {
    title: "Any Civilization",
    shortName: "ANY",
    flagLarge: "assets/flags/any-large.webp",
    flagSmall: "assets/flags/any-small.webp",
  },
  {
    title: "Abbasid Dynasty",
    shortName: "ABB",
    tagLine: "Technology, Camels, City Planning",
    flagLarge: "assets/flags/abb-large.webp",
    flagSmall: "assets/flags/abb-small.webp",
  },
  {
    title: "Ayyubids",
    shortName: "AYY",
    tagLine: "Adaptable, Camels, City Planning",
    flagLarge: "assets/flags/ayy-large.webp",
    flagSmall: "assets/flags/ayy-small.webp",
  },
  {
    title: "Byzantines",
    shortName: "BYZ",
    tagLine: "City Planning, Mercenaries, Defense",
    flagLarge: "assets/flags/byz-large.webp",
    flagSmall: "assets/flags/byz-small.webp",
  },
  {
    title: "Chinese",
    shortName: "CHI",
    tagLine: "Dynasties, Gunpowder, Taxes",
    flagLarge: "assets/flags/chi-large.webp",
    flagSmall: "assets/flags/chi-small.webp",
  },
  {
    title: "Delhi Sultanate",
    shortName: "DEL",
    tagLine: "Elephants, Research, Religion",
    flagLarge: "assets/flags/del-large.webp",
    flagSmall: "assets/flags/del-small.webp",
  },
  {
    title: "English",
    shortName: "ENG",
    tagLine: "Defense, Longbows, Farming",
    flagLarge: "assets/flags/eng-large.webp",
    flagSmall: "assets/flags/eng-small.webp",
  },
  {
    title: "French",
    shortName: "FRE",
    tagLine: "Trade, Cavalry, Keeps",
    flagLarge: "assets/flags/fre-large.webp",
    flagSmall: "assets/flags/fre-small.webp",
  },
  {
    title: "Holy Roman Empire",
    shortName: "HRE",
    tagLine: "Infrantry, Religion, Defense",
    flagLarge: "assets/flags/hre-large.webp",
    flagSmall: "assets/flags/hre-small.webp",
  },
  {
    title: "House of Lancaster",
    shortName: "HOL",
    tagLine: "Manors, Economy, Versatility",
    flagLarge: "assets/flags/hol-large.webp",
    flagSmall: "assets/flags/hol-small.webp",
  },
  {
    title: "Japanese",
    shortName: "JAP",
    tagLine: "Agriculture, Bannermen, Infrantry",
    flagLarge: "assets/flags/jap-large.webp",
    flagSmall: "assets/flags/jap-small.webp",
  },
  {
    title: "Jeanne d'Arc",
    shortName: "JDA",
    tagLine: "Trade, Cavalry, Hero",
    flagLarge: "assets/flags/jda-large.webp",
    flagSmall: "assets/flags/jda-small.webp",
  },
  {
    title: "Knights Templar",
    shortName: "KTE",
    tagLine: "Diplomacy, Fortification, Commanderies",
    flagLarge: "assets/flags/kte-large.webp",
    flagSmall: "assets/flags/kte-small.webp",
  },
  {
    title: "Malian",
    shortName: "MAL",
    tagLine: "Gold Economy, Infantry, Cattle",
    flagLarge: "assets/flags/mal-large.webp",
    flagSmall: "assets/flags/mal-small.webp",
  },
  {
    title: "Mongols",
    shortName: "MON",
    tagLine: "Aggression, Cavalry, Nomadic",
    flagLarge: "assets/flags/mon-large.webp",
    flagSmall: "assets/flags/mon-small.webp",
  },
  {
    title: "Order of  the Dragon",
    shortName: "DRA",
    tagLine: "Quality, Infantry, Defense",
    flagLarge: "assets/flags/dra-large.webp",
    flagSmall: "assets/flags/dra-small.webp",
  },
  {
    title: "Ottomans",
    shortName: "OTT",
    tagLine: "Imperial Council, Military Schools, Siege",
    flagLarge: "assets/flags/ott-large.webp",
    flagSmall: "assets/flags/ott-small.webp",
  },
  {
    title: "Rus",
    shortName: "RUS",
    tagLine: "Expansion, Cavalry, Hunting",
    flagLarge: "assets/flags/rus-large.webp",
    flagSmall: "assets/flags/rus-small.webp",
  },
  {
    title: "Zhu Xi's Legacy",
    shortName: "ZXL",
    tagLine: "Dynasties, Taxes, Technology",
    flagLarge: "assets/flags/zxl-large.webp",
    flagSmall: "assets/flags/zxl-small.webp",
  },
]);

export function getCivById (id) {
  const civ = civs.value.find((civ) => civ.shortName === id);
  return civ
};