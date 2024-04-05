//Composables
import { civs } from "@/composables/builds/icons/civs.js";

//Exported methods
export const buildingTech = [
  {
    title: "Blacksmith",
    age: "2",
    imgSrc: "/assets/pictures/building_technology/blacksmith.png",
    civ: civs.except("JAP"),
    class: "tech",
    shorthand: ["blacksmith", "wq"]
  },
  {
    title: "Forge",
    age: "2",
    imgSrc: "/assets/pictures/building_japanese/forge-1.png",
    civ: ["JAP"],
    class: "tech",
  },
  {
    title: "University",
    age: "2",
    imgSrc: "/assets/pictures/building_technology/university.png",
    civ: ["ENG", "FRE", "JDA", "RUS", "OTT", "CHI", "ZXL", "HRE", "DRA", "BYZ", "JAP"],
    class: "tech",
    shorthand: ["uni", "rq"]
  },
  {
    title: "Madrasa",
    age: "2",
    imgSrc: "/assets/pictures/building_technology/madrasa.png",
    civ: ["MAL", "ABB", "AYY", "DEL"],
    class: "tech",
  },
];
