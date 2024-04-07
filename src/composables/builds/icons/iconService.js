//External
import { ref } from "vue";

//Composables
import { resources } from "@/composables/builds/icons/resources.js";
import { general } from "@/composables/builds/icons/general.js";

import unitEco from "@/composables/builds/icons/json/unitEco.json" with { type: "json" };
import unitReligious from "@/composables/builds/icons/json/unitReligious.json" with { type: "json" };
import unitMilitary from "@/composables/builds/icons/json/unitMilitary.json" with { type: "json" };
import unitHero from "@/composables/builds/icons/json/unitHero.json" with { type: "json" };

import techEco from "@/composables/builds/icons/json/techEco.json" with { type: "json" };
import techMilitary from "@/composables/builds/icons/json/techMilitary.json" with { type: "json" };

import landmarks from "@/composables/builds/icons/json/landmarks.json" with { type: "json" };
import buildingEco from "@/composables/builds/icons/json/buildingEco.json" with { type: "json" };
import buildingReligious from "@/composables/builds/icons/json/buildingReligious.json" with { type: "json" };
import buildingTech from "@/composables/builds/icons/json/buildingTech.json" with { type: "json" };
import buildingMilitary from "@/composables/builds/icons/json/buildingMilitary.json" with { type: "json" };

import abilityHero from "@/composables/builds/icons/json/abilityHero.json" with { type: "json" };

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
