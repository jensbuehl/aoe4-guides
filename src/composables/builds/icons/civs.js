export const civs = [
  "ENG",
  "FRE",
  "RUS",
  "MON",
  "ABB",
  "CHI",
  "DEL",
  "HRE",
  //Anniversairy
  "MAL",
  "OTT",
  //The Sultans Ascend
  "AYY",
  "JDA",
  "ZXL",
  "BYZ",
  "JAP",
  "DRA",
];

 //Internal methods
 Array.prototype.except = function (val) {
  return this.filter(function (x) {
    return x !== val;
  });
};

Array.prototype.exceptMany = function (val) {
  return this.filter(function (x) {
    return !val.includes(x);
  });
};