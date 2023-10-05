import { ref } from "vue";

const civs = ref([
  {
    title: "Any Civilization",
    shortName: "ANY",
    flagLarge: "assets/flags/any-large.png",
    flagSmall: "assets/flags/any-small.png",
  },
  {
    title: "Abbasid Dynasty",
    shortName: "ABB",
    flagLarge: "assets/flags/abb-large.png",
    flagSmall: "assets/flags/abb-small.png",
  },
  {
    title: "Ayyubids",
    shortName: "AYY",
    flagLarge: "assets/flags/ayy-large.png",
    flagSmall: "assets/flags/ayy-small.png",
  },
  {
    title: "Byzantines",
    shortName: "BYZ",
    flagLarge: "assets/flags/byz-large.png",
    flagSmall: "assets/flags/byz-small.png",
  },
  {
    title: "Chinese",
    shortName: "CHI",
    flagLarge: "assets/flags/chi-large.png",
    flagSmall: "assets/flags/chi-small.png",
  },
  {
    title: "Delhi Sultanate",
    shortName: "DEL",
    flagLarge: "assets/flags/del-large.png",
    flagSmall: "assets/flags/del-small.png",
  },
  {
    title: "English",
    shortName: "ENG",
    flagLarge: "assets/flags/eng-large.png",
    flagSmall: "assets/flags/eng-small.png",
  },
  {
    title: "French",
    shortName: "FRE",
    flagLarge: "assets/flags/fre-large.png",
    flagSmall: "assets/flags/fre-small.png",
  },
  {
    title: "Holy Roman Empire",
    shortName: "HRE",
    flagLarge: "assets/flags/hre-large.png",
    flagSmall: "assets/flags/hre-small.png",
  },
  {
    title: "Japanese",
    shortName: "JAP",
    flagLarge: "assets/flags/jap-large.png",
    flagSmall: "assets/flags/jap-small.png",
  },
  {
    title: "Jeanne d'Arc",
    shortName: "JDA",
    flagLarge: "assets/flags/jda-large.png",
    flagSmall: "assets/flags/jda-small.png",
  },
  {
    title: "Malian",
    shortName: "MAL",
    flagLarge: "assets/flags/mal-large.png",
    flagSmall: "assets/flags/mal-small.png",
  },
  {
    title: "Mongols",
    shortName: "MON",
    flagLarge: "assets/flags/mon-large.png",
    flagSmall: "assets/flags/mon-small.png",
  },
  {
    title: "Order of  the Dragon",
    shortName: "DRA",
    flagLarge: "assets/flags/dra-large.png",
    flagSmall: "assets/flags/dra-small.png",
  },
  {
    title: "Ottomans",
    shortName: "OTT",
    flagLarge: "assets/flags/ott-large.png",
    flagSmall: "assets/flags/ott-small.png",
  },
  {
    title: "Rus",
    shortName: "RUS",
    flagLarge: "assets/flags/rus-large.png",
    flagSmall: "assets/flags/rus-small.png",
  },
  {
    title: "Zhu Xi's Legacy",
    shortName: "ZXL",
    flagLarge: "assets/flags/zxl-large.png",
    flagSmall: "assets/flags/zxl-small.png",
  },
]);

const getCivs = () => {
  return {
    civs,
  };
};

export default getCivs;
