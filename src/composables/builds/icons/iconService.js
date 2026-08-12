//External
import { ref } from "vue";

//Composables
import { resources } from "./resources.js";
import { general } from "./general.js";

import unitEco from "./json/unitEco.json" with { type: "json" };
import unitReligious from "./json/unitReligious.json" with { type: "json" };
import unitMilitary from "./json/unitMilitary.json" with { type: "json" };
import unitHero from "./json/unitHero.json" with { type: "json" };

import techEco from "./json/techEco.json" with { type: "json" };
import techMilitary from "./json/techMilitary.json" with { type: "json" };

import landmarks from "./json/landmarks.json" with { type: "json" };
import buildingEco from "./json/buildingEco.json" with { type: "json" };
import buildingReligious from "./json/buildingReligious.json" with { type: "json" };
import buildingTech from "./json/buildingTech.json" with { type: "json" };
import buildingMilitary from "./json/buildingMilitary.json" with { type: "json" };

import abilityHero from "./json/abilityHero.json" with { type: "json" };

//The whole vocabulary, concatenated once at module load rather than per call.
//The lists behind it are module constants, so it can never go stale.
const ALL_ICONS = resources.concat(
  general,
  unitEco,
  unitMilitary,
  unitReligious,
  unitHero,
  buildingEco,
  buildingTech,
  buildingMilitary,
  buildingReligious,
  abilityHero,
  landmarks,
  techEco,
  techMilitary,
);

//imgSrc -> icon, one index per civ filter, built on first lookup and kept.
//
//What it replaces: a rebuild-and-scan of ~1,000 entries per image, measured at
//0.021 ms each. A page renders a handful and never notices; converting a whole
//site's steps does it hundreds of thousands of times, which is ~8 s of pure
//lookup. Keyed by civ because getIcons() filters by it, so one shared map would
//answer for the wrong civilisation.
const indexByCiv = new Map();

/**
 * Ten imgSrc values are shared by several icons — civ-variant names over the
 * same artwork ("Dhow" / "Galley" / "Junk"). The scan this index replaces
 * assigned on every match and so returned the *last* one; setting in list order
 * does the same, which is what keeps the app saying today what it said before.
 */
function indexFor(civKey, buildIcons) {
  let index = indexByCiv.get(civKey);
  if (index) return index;

  //buildIcons is a thunk on purpose: getIcons() filters the whole vocabulary,
  //so calling it on a cache hit would keep most of the cost this index exists
  //to remove.
  index = new Map();
  for (const icon of buildIcons()) index.set(icon.imgSrc, icon);
  indexByCiv.set(civKey, index);
  return index;
}

/**
 * Reduces an image src to the site-relative path the vocabulary is keyed on.
 *
 * Strips *any* scheme and host rather than the two that used to be hardcoded
 * (aoe4guides.com and localhost:5173). A description authored on a deploy
 * preview, a staging host or a custom local port carries that origin in its
 * `src`, and every one of those icons failed to resolve.
 *
 * @param {string} imgPath - An absolute or site-relative image path.
 * @return {string} The path with scheme and host removed.
 */
function stripOrigin(imgPath) {
  return String(imgPath ?? "").replace(/^(?:[a-z][a-z0-9+.-]*:)?\/\/[^/]*/i, "");
}

export default function iconService(civArg) {
  const civ = ref(civArg);

  //Exported methods
  const getIcons = (category) => {
    var allIcons = [];

    switch (category) {
      case "general":
        allIcons = general;
        break;
      case "resource":
        allIcons = resources;
        break;
      case "landmark":
        allIcons = landmarks;
        break;
      case "techEco":
        allIcons = techEco;
        break;
      case "techMilitary":
        allIcons = techMilitary;
        break;
      case "buildingReligious":
        allIcons = buildingReligious;
        break;
      case "buildingEco":
        allIcons = buildingEco;
        break;
      case "buildingTech":
        allIcons = buildingTech;
        break;
      case "buildingMilitary":
        allIcons = buildingMilitary;
        break;
      case "unitReligious":
        allIcons = unitReligious;
        break;
      case "unitMilitary":
        allIcons = unitMilitary;
        break;
      case "unitEco":
        allIcons = unitEco;
        break;
      case "unitHero":
        allIcons = unitHero;
        break;
      case "abilityHero":
        allIcons = abilityHero;
        break;
      default:
        allIcons = ALL_ICONS;
        break;
    }

    if (civ.value && civ.value != "ANY") {
      return allIcons.filter((icon) => icon.civ.includes(civ.value));
    } else {
      return allIcons.filter(() => true);
    }
  };

  /**
   * Resolves an image src to its icon metadata.
   *
   * @param {string} imgPath - The `src` off an <img>, with or without an origin.
   * @return {Object|null} The icon, or **null** when nothing matches.
   *
   * Null on a miss, not the input string. Returning the path used to look like
   * a graceful fallback and was the opposite: callers read `.title` off it,
   * got `undefined`, and printed it — which is what focus mode read aloud.
   * A caller that wants a fallback can now choose one; a caller that wants to
   * drop the image can tell that it should.
   */
  const getIconFromImgPath = (imgPath) => {
    const civKey = civ.value ?? "";
    return indexFor(civKey, getIcons).get(stripOrigin(imgPath)) ?? null;
  };

  return { getIcons, getIconFromImgPath };
}
