// Serialises like the repo's icon JSONs: 2-space indent, arrays of primitives on one line.
const PRIM = String.raw`(?:"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?|true|false|null)`;
const ARRAY = new RegExp(String.raw`\[\n((?:[ ]*${PRIM},?\n)+)[ ]*\]`, "g");

module.exports = function fmt(obj) {
  return JSON.stringify(obj, null, 2).replace(ARRAY, (m, body) =>
    "[" + body.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => l.replace(/,$/, "")).join(", ") + "]");
};
