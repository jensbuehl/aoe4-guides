//External
import { ref } from "vue";

//Composables
import { resources } from "@/composables/builds/icons/resources.js";
import { general } from "@/composables/builds/icons/general.js";
import { landmarks } from "@/composables/builds/icons/landmarks.js";

import { unitEco } from "@/composables/builds/icons/unitEco.js";
import { unitReligious } from "@/composables/builds/icons/unitReligious.js";
import { unitMilitary } from "@/composables/builds/icons/unitMilitary.js";
import { unitHero } from "@/composables/builds/icons/unitHero.js";

import { techEco } from "@/composables/builds/icons/techEco.js";
import { techMilitary } from "@/composables/builds/icons/techMilitary.js";

import { buildingEco } from "@/composables/builds/icons/buildingEco.js";
import { buildingReligious } from "@/composables/builds/icons/buildingReligious.js";
import { buildingTech } from "@/composables/builds/icons/buildingTech.js";
import { buildingMilitary } from "@/composables/builds/icons/buildingMilitary.js";

import { abilityHero } from "@/composables/builds/icons/abilityHero.js";

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
        allIcons = resources.concat(
          general,
          landmarks,
          techEco,
          techMilitary,
          buildingEco,
          buildingTech,
          buildingMilitary,
          buildingReligious,
          unitEco,
          unitMilitary,
          unitReligious,
          unitHero,
          abilityHero
        );
        break;
    }

    if (civ.value && civ.value != "ANY") {
      return allIcons.filter((icon) => icon.civ.includes(civ.value));
    } else {
      return allIcons.filter(() => true);
    }
  };

  const getIconFromImgPath = (imgPath) => {
    var allIcons = getIcons();
    var match = imgPath;
    allIcons.forEach((element) => {
      if (element.imgSrc === imgPath) match = element;
    });
    return match;
  };

  return { getIcons, getIconFromImgPath };
}
