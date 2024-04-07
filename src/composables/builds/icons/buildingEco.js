//Composables
import { civs } from "@/composables/builds/icons/civs.js";

//Exported methods
export const buildingEco = [
  {
    title: "Farm",
    age: "1",
    imgSrc: "/assets/pictures/building_economy/farm.png",
    civ: civs.exceptMany(["MON", "BYZ"]),
    class: "default",
    shorthand: ["farm", "qa"]
  },
  {
    title: "Olive Grove",
    age: "1",
    imgSrc: "/assets/pictures/building_byzantines/olive-grove-1.png",
    civ: ["BYZ"],
    class: "default",
  },
  {
    title: "House",
    age: "1",
    imgSrc: "/assets/pictures/building_economy/house.png",
    civ: civs.exceptMany(["MON", "JAP"]),
    class: "default",
    shorthand: ["house", "qq"]
  },
  {
    title: "Lumber Camp",
    age: "1",
    imgSrc: "/assets/pictures/building_economy/lumber-camp.png",
    civ: civs.exceptMany(["MON"]),
    class: "default",
    shorthand: ["lumbercamp", "qe"]
  },
  {
    title: "Mining Camp",
    age: "1",
    imgSrc: "/assets/pictures/building_economy/mining-camp.png",
    civ: civs.exceptMany(["MON"]),
    class: "default",
    shorthand: ["miningcamp", "qr"]
  },
  {
    title: "Mill",
    age: "1",
    imgSrc: "/assets/pictures/building_economy/mill.png",
    civ: civs.exceptMany(["RUS", "MON"]),
    class: "default",
    shorthand: ["mill", "qw"]
  },
  {
    title: "Farmhouse",
    age: "1",
    imgSrc: "/assets/pictures/building_japanese/farmhouse-1.png",
    civ: ["JAP"],
    class: "default",
  },
  {
    title: "Cistern",
    age: "1",
    imgSrc: "/assets/pictures/building_byzantines/cistern-1.png",
    civ: ["BYZ"],
    class: "default",
  },
  {
    title: "Pit Mine",
    age: "1",
    imgSrc: "/assets/pictures/building_malians/pit-mine-1.png",
    civ: ["MAL"],
    class: "default",
  },
  {
    title: "Ger",
    age: "1",
    imgSrc: "/assets/pictures/building_mongols/ger.png",
    civ: ["MON"],
    class: "default",
    shorthand: ["ger", "qw"]
  },
  {
    title: "Pasture",
    age: "1",
    imgSrc: "/assets/pictures/building_mongols/pasture.png",
    civ: ["MON"],
    class: "default",
    shorthand: ["pasture", "qa"]
  },
  {
    title: "Ovoo",
    age: "1",
    imgSrc: "/assets/pictures/building_mongols/ovoo.png",
    civ: ["MON"],
    class: "default",
    shorthand: ["ovoo", "qq"]
  },
  {
    title: "Hunting Cabin",
    age: "1",
    imgSrc: "/assets/pictures/building_rus/hunting-cabin.png",
    civ: ["RUS"],
    class: "default",
  },
  {
    title: "Town Center",
    age: "2",
    imgSrc: "/assets/pictures/building_economy/town-center.png",
    civ: civs,
    class: "default",
    shorthand: ["tc", "we"]
  },
  {
    title: "Market",
    age: "2",
    imgSrc: "/assets/pictures/building_economy/market.png",
    civ: civs,
    class: "default",
    shorthand: ["market", "ww"]
  },
  {
    title: "Village",
    age: "2",
    imgSrc: "/assets/pictures/building_chinese/village.png",
    civ: ["CHI", "ZXL"],
    class: "default",
  },
  {
    title: "Granary",
    age: "2",
    imgSrc: "/assets/pictures/building_chinese/granary.png",
    civ: ["CHI", "ZXL"],
    class: "default",
  },
  {
    title: "Cattle Ranch",
    age: "2",
    imgSrc: "/assets/pictures/building_malians/cattle-ranch-2.png",
    civ: ["MAL"],
    class: "default",
  },
];
