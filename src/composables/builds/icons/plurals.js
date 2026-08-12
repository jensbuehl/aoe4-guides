/**
 * Irregular plurals for icon titles — and only the irregular ones.
 *
 * WHY THIS IS NOT A FIELD IN THE ICON JSON
 * ----------------------------------------
 * The files under `icons/json/` are regenerated from an upstream source, and
 * carry a `syncSkip` marker to say which entries a sync must leave alone. A
 * `plural` field added to a synced record has no such protection: the next
 * regeneration would drop it, silently, and the only symptom would be "Nest of
 * Beess" appearing on a page nobody was looking at. A separate module is
 * outside the sync's reach entirely.
 *
 * The remaining gap is the reverse one — an upstream *rename* leaves an entry
 * here pointing at a title that no longer exists, and the exception quietly
 * lapses back to the regular rule. `npm run check:plurals` fails CI on exactly
 * that, which is why every key below must match a real icon title.
 *
 * WHAT BELONGS HERE
 * -----------------
 * Nothing the ordered rules in iconText.js already get right. They are:
 *   -man → -men   ·   consonant + y → -ies   ·   s/x/z/ch/sh → -es   ·   else +s
 * Between them those cover Crossbowmen, Emissaries, Dervishes and Universities,
 * so none of those appear here. Three families do not fit a rule:
 *
 *   1. Titles that are already plural, or are invariant in English usage.
 *   2. Loanwords the game itself never inflects (Japanese, Chinese, Mongolian).
 *   3. Head-noun compounds, where the noun to inflect is not the last word.
 *
 * Only ever consulted when a count immediately precedes the icon, so an entry
 * here can never change how a title reads on its own.
 */

export const IRREGULAR_PLURALS = {
  // --- Already plural, or invariant ------------------------------------------
  // The regular rules would double the inflection: "Barrackses", "Streltsies",
  // "Wynguard Footmens".
  Barracks: "Barracks",
  Streltsy: "Streltsy",
  Runestones: "Runestones",
  "Wynguard Footmen": "Wynguard Footmen",
  "Wynguard Raiders": "Wynguard Raiders",
  "Ranged Specialists": "Ranged Specialists",
  "Palatine Cataphracts": "Palatine Cataphracts",
  Limitanei: "Limitanei",
  Militia: "Militia",
  "Szlachta Cavalry": "Szlachta Cavalry",

  // --- Loanwords the game does not inflect ------------------------------------
  // Japanese, Chinese and Mongolian unit names are used unchanged in the game's
  // own text and by players. "2 Samurai", never "2 Samurais".
  Samurai: "Samurai",
  "Kanabo Samurai": "Kanabo Samurai",
  "Mounted Samurai": "Mounted Samurai",
  "Naginata Samurai": "Naginata Samurai",
  "Yumi Ashigaru": "Yumi Ashigaru",
  "Tanegashima Ashigaru": "Tanegashima Ashigaru",
  "Handcannon Ashigaru": "Handcannon Ashigaru",
  "Onna-Bugeisha": "Onna-Bugeisha",
  "Onna-Musha": "Onna-Musha",
  Shinobi: "Shinobi",
  Yari: "Yari",
  Daimyo: "Daimyo",
  Yatai: "Yatai",
  Matsuri: "Matsuri",
  Ozutsu: "Ozutsu",
  "Zhuge Nu": "Zhuge Nu",
  "Huihui Pao": "Huihui Pao",
  Mangudai: "Mangudai",
  "Khaganate Elite Mangudai": "Khaganate Elite Mangudai",
  Riddari: "Riddari",
  "Hippodrome Riddari": "Hippodrome Riddari",
  Sofa: "Sofa",

  // --- The -man rule misfiring ------------------------------------------------
  // "Shaman" ends in the letters "man" without being one, so the rule that
  // correctly produces Spearmen would produce "Shamen".
  Shaman: "Shamans",

  // --- Head-noun compounds ----------------------------------------------------
  // The noun to inflect is not the last word, so every rule reaches the wrong
  // end of the string.
  "Man-at-Arms": "Men-at-Arms",
  "Gilded Man-at-Arms": "Gilded Men-at-Arms",
  "Jeanne d'Arc - Woman-at-Arms": "Jeanne d'Arc - Women-at-Arms",
  "Nest of Bees": "Nests of Bees",
  "Clocktower Nest of Bees": "Clocktower Nests of Bees",
  "Khaganate Nest of Bees": "Khaganate Nests of Bees",
  "Tower of the Sultan": "Towers of the Sultan",
  "Lord of Lancaster": "Lords of Lancaster",
  Condottiero: "Condottieri",
};
