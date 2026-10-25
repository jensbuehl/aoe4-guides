import { ref } from "vue";

export const civs = ref([
  // Sorted alphabetically by title
  //
  // `slug` is the civ page's address, /civ/<slug>. Written out rather than
  // derived from the title so that renaming a civ, or fixing a typo in its
  // name, never moves a URL that search engines and links already hold. A new
  // civ gets one when it is added; "Any Civilization" has none, because it is a
  // filter value and not a civ with a page.
  //
  // ?v=2 on the Scots and Vikings flags: they replaced placeholder art under
  // the same filenames, and public/_headers lets a browser reuse a flag for a
  // week without asking, so returning visitors kept the old images through
  // any reload. Bump it whenever a flag file is replaced in place.
  {
    title: "Abbasid Dynasty",
    shortName: "ABB",
    slug: "abbasid-dynasty",
    tagLine: "Technology, Camels, City Planning",
    flagLarge: "/assets/flags/abb-large.webp",
    flagSmall: "/assets/flags/abb-small.webp",
  },
  {
    title: "Any Civilization",
    shortName: "ANY",
    flagLarge: "/assets/flags/any-large.webp",
    flagSmall: "/assets/flags/any-small.webp",
  },
  {
    title: "Ayyubids",
    shortName: "AYY",
    slug: "ayyubids",
    tagLine: "Adaptable, Camels, City Planning",
    flagLarge: "/assets/flags/ayy-large.webp",
    flagSmall: "/assets/flags/ayy-small.webp",
  },
  {
    title: "Byzantines",
    shortName: "BYZ",
    slug: "byzantines",
    tagLine: "City Planning, Mercenaries, Defense",
    flagLarge: "/assets/flags/byz-large.webp",
    flagSmall: "/assets/flags/byz-small.webp",
  },
  {
    title: "Chinese",
    shortName: "CHI",
    slug: "chinese",
    tagLine: "Dynasties, Gunpowder, Taxes",
    flagLarge: "/assets/flags/chi-large.webp",
    flagSmall: "/assets/flags/chi-small.webp",
  },
  {
    title: "Delhi Sultanate",
    shortName: "DEL",
    slug: "delhi-sultanate",
    tagLine: "Elephants, Research, Religion",
    flagLarge: "/assets/flags/del-large.webp",
    flagSmall: "/assets/flags/del-small.webp",
  },
  {
    title: "English",
    shortName: "ENG",
    slug: "english",
    tagLine: "Defense, Longbows, Farming",
    flagLarge: "/assets/flags/eng-large.webp",
    flagSmall: "/assets/flags/eng-small.webp",
  },
  {
    title: "French",
    shortName: "FRE",
    slug: "french",
    tagLine: "Trade, Cavalry, Keeps",
    flagLarge: "/assets/flags/fre-large.webp",
    flagSmall: "/assets/flags/fre-small.webp",
  },
  {
    title: "Golden Horde",
    shortName: "GOH",
    slug: "golden-horde",
    tagLine: "Influence, Mass Recruitment, Heroic Leadership",
    flagLarge: "/assets/flags/goh-large.webp",
    flagSmall: "/assets/flags/goh-small.webp",
  },
  {
    title: "Holy Roman Empire",
    shortName: "HRE",
    slug: "holy-roman-empire",
    tagLine: "Infrantry, Religion, Defense",
    flagLarge: "/assets/flags/hre-large.webp",
    flagSmall: "/assets/flags/hre-small.webp",
  },
  {
    title: "House of Lancaster",
    shortName: "HOL",
    slug: "house-of-lancaster",
    tagLine: "Manors, Economy, Versatility",
    flagLarge: "/assets/flags/hol-large.webp",
    flagSmall: "/assets/flags/hol-small.webp",
  },
  {
    title: "Japanese",
    shortName: "JAP",
    slug: "japanese",
    tagLine: "Agriculture, Bannermen, Infrantry",
    flagLarge: "/assets/flags/jap-large.webp",
    flagSmall: "/assets/flags/jap-small.webp",
  },
  {
    title: "Jin Dynasty",
    shortName: "JIN",
    slug: "jin-dynasty",
    tagLine: "Cavalry, Crossbows, Fortification",
    flagLarge: "/assets/flags/jin-large.webp",
    flagSmall: "/assets/flags/jin-small.webp",
  },
  {
    title: "Jeanne d'Arc",
    shortName: "JDA",
    slug: "jeanne-darc",
    tagLine: "Trade, Cavalry, Hero",
    flagLarge: "/assets/flags/jda-large.webp",
    flagSmall: "/assets/flags/jda-small.webp",
  },
  {
    title: "Knights Templar",
    shortName: "KTE",
    slug: "knights-templar",
    tagLine: "Diplomacy, Fortification, Commanderies",
    flagLarge: "/assets/flags/kte-large.webp",
    flagSmall: "/assets/flags/kte-small.webp",
  },
  {
    title: "Macedonian Dynasty",
    shortName: "MAC",
    slug: "macedonian-dynasty",
    tagLine: "Silver Economy, Reinforcements, Morality",
    flagLarge: "/assets/flags/mac-large.webp",
    flagSmall: "/assets/flags/mac-small.webp",
  },
  {
    title: "Malian",
    shortName: "MAL",
    slug: "malian",
    tagLine: "Gold Economy, Infantry, Cattle",
    flagLarge: "/assets/flags/mal-large.webp",
    flagSmall: "/assets/flags/mal-small.webp",
  },
  {
    title: "Mongols",
    shortName: "MON",
    slug: "mongols",
    tagLine: "Aggression, Cavalry, Nomadic",
    flagLarge: "/assets/flags/mon-large.webp",
    flagSmall: "/assets/flags/mon-small.webp",
  },
  {
    title: "Order of the Dragon",
    shortName: "DRA",
    slug: "order-of-the-dragon",
    tagLine: "Quality, Infantry, Defense",
    flagLarge: "/assets/flags/dra-large.webp",
    flagSmall: "/assets/flags/dra-small.webp",
  },
  {
    title: "Ottomans",
    shortName: "OTT",
    slug: "ottomans",
    tagLine: "Imperial Council, Military Schools, Siege",
    flagLarge: "/assets/flags/ott-large.webp",
    flagSmall: "/assets/flags/ott-small.webp",
  },
  {
    title: "Rus",
    shortName: "RUS",
    slug: "rus",
    tagLine: "Expansion, Cavalry, Hunting",
    flagLarge: "/assets/flags/rus-large.webp",
    flagSmall: "/assets/flags/rus-small.webp",
  },
  {
    title: "Scots",
    shortName: "SCO",
    slug: "scots",
    tagLine: "Infantry, Defense, Mustering",
    flagLarge: "/assets/flags/sco-large.webp?v=2",
    flagSmall: "/assets/flags/sco-small.webp?v=2",
  },
  {
    title: "Sengoku Daimyo",
    shortName: "SEN",
    slug: "sengoku-daimyo",
    tagLine: "Clans, Economic Scaling, Inspiration",
    flagLarge: "/assets/flags/sen-large.webp",
    flagSmall: "/assets/flags/sen-small.webp",
  },
  {
    title: "Tughlaq Dynasty",
    shortName: "TUG",
    slug: "tughlaq-dynasty",
    tagLine: "Mobile Economy, Elephants, Reginal Control",
    flagLarge: "/assets/flags/tug-large.webp",
    flagSmall: "/assets/flags/tug-small.webp",
  },
  {
    title: "Vikings",
    shortName: "VIK",
    slug: "vikings",
    tagLine: "Longhouses, Infantry, Sagas",
    flagLarge: "/assets/flags/vik-large.webp?v=2",
    flagSmall: "/assets/flags/vik-small.webp?v=2",
  },
  {
    title: "Zhu Xi's Legacy",
    shortName: "ZXL",
    slug: "zhu-xis-legacy",
    tagLine: "Dynasties, Taxes, Technology",
    flagLarge: "/assets/flags/zxl-large.webp",
    flagSmall: "/assets/flags/zxl-small.webp",
  },
]);

export function getCivById(id) {
  const civ = civs.value.find((civ) => civ.shortName === id);
  return civ;
}

/**
 * The civ whose page is /civ/<slug>, or undefined.
 *
 * @param {string} slug - E.g. "vikings".
 * @return {Object|undefined}
 */
export function getCivBySlug(slug) {
  return civs.value.find((civ) => civ.slug && civ.slug === slug);
}

/**
 * The route to a civ's page: /civ/<slug> when it has one, otherwise the
 * dashboard filtered to it, which the router forwards wherever it can.
 *
 * @param {string} code - The civ's short name, e.g. "VIK".
 * @return {Object} A vue-router location.
 */
export function civPageRoute(code) {
  const civ = getCivById(code);
  return civ?.slug ? { name: "Civ", params: { slug: civ.slug } } : { name: "Dashboard", query: { civ: code } };
}
