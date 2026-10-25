// Replays the Icon Gap Sync for a civ that already shipped: strip it from the
// local JSONs, run the real Admin.vue functions against live AOE4World data,
// and diff the outcome against what the files hold today.
//
//   node replay.mjs <repo> <dataDir> <CIV>      e.g. JIN, with <dataDir>/opt/*.json
//
// Run it after any change to the gap sync in Admin.vue. Baseline (Oct 2026):
// JIN 133/137 exact on the May data, 132 on the Raiders of the North branch
// (upstream moved Emissary from age 1 to 3); category rules ~95% over all
// entries. Known misses: Villager variant (a UI choice) and Rally/Build/Attack
// (hand-kept, not in AOE4World). A drop below that is a regression.
import { readFileSync } from "node:fs";

const REPO = process.argv[2];
const SCR = process.argv[3];
const CIV = process.argv[4] ?? "JIN";
const admin = readFileSync(`${REPO}/src/views/Admin.vue`, "utf8");

function extract(startRe) {
  const m = admin.match(startRe);
  if (!m) throw new Error("not found: " + startRe);
  let i = admin.indexOf("{", m.index);
  let depth = 0;
  for (let j = i; j < admin.length; j++) {
    if (admin[j] === "{") depth++;
    else if (admin[j] === "}" && --depth === 0) return admin.slice(m.index, j + 1);
  }
}

const json = (n) => JSON.parse(readFileSync(`${REPO}/src/composables/builds/icons/json/${n}.json`, "utf8"));
const keys = ["unitEco","unitReligious","unitMilitary","unitHero","buildingEco","buildingMilitary","buildingReligious","buildingTech","landmarks","techEco","techMilitary","abilityHero"];
const truth = Object.fromEntries(keys.map((k) => [k, json(k)]));
const stripped = Object.fromEntries(keys.map((k) => [k,
  JSON.parse(JSON.stringify(truth[k]))
    .map((e) => (Array.isArray(e.civ) ? { ...e, civ: e.civ.filter((c) => c !== CIV) } : e))
    .filter((e) => !Array.isArray(e.civ) || e.civ.length > 0)]));
const syncIgnoreData = json("syncIgnore");

const src = (n) => { const j = JSON.parse(readFileSync(`${SCR}/opt/${n}.json`, "utf8")); return Array.isArray(j) ? j : j.data; };
const sourceData = { units: src("units"), buildings: src("buildings"), technologies: src("technologies"), abilities: src("abilities") };

const code = [
  extract(/const CIV_SLUG_MAP = /) + ";",
  extract(/const CIV_FOLDER_SLUG = /) + ";",
  extract(/const TYPE_PLURAL = /) + ";",
  extract(/function buildGapList\(/),
  extract(/function suggestCategory\(/),
  extract(/function resolveImageFolder\(/),
  extract(/function initAssignment\(/),
  extract(/const CATEGORY_ENTRY_CLASS = /) + ";",
  extract(/function entryClassFor\(/),
  extract(/function unitGroupFor\(/),
  extract(/async function downloadGapJsons\(/),
  "return { buildGapList, initAssignment, downloadGapJsons, suggestCategory };",
].join("\n");

const CATEGORY_CONFIG = keys.map((k) => ({ key: k, filename: k + ".json", data: stripped[k] }));
const ref = (v) => ({ value: v });
const gapItems = ref([]), gapAssignments = ref({}), gapUnmappedCivs = ref([]), gapSourceCount = ref(0), gapJsonSaved = ref({}), gapMergeMisses = ref([]);
const gapSyncIgnore = ref([...(Array.isArray(syncIgnoreData) ? syncIgnoreData : syncIgnoreData.ids ?? [])]);
const out = {};
const downloadObjectAsJSONFile = async (arr, filename) => { out[filename.replace(".json", "")] = arr; };

const api = new Function("CATEGORY_CONFIG","gapItems","gapAssignments","gapUnmappedCivs","gapSourceCount","gapJsonSaved","gapMergeMisses","gapSyncIgnore","downloadObjectAsJSONFile","console", code)(
  CATEGORY_CONFIG, gapItems, gapAssignments, gapUnmappedCivs, gapSourceCount, gapJsonSaved, gapMergeMisses, gapSyncIgnore, downloadObjectAsJSONFile, { warn() {} });

gapItems.value = api.buildGapList(sourceData);
gapItems.value.forEach((g) => api.initAssignment(g));
await api.downloadGapJsons();

const ignored = new Set(gapSyncIgnore.value);
const live = gapItems.value.filter((g) => !ignored.has(g.id));
const civGaps = live.filter((g) => g.civCode === CIV);
const by = (arr, f) => arr.reduce((a, x) => ((a[f(x)] = (a[f(x)] ?? 0) + 1), a), {});
console.log(`gaps total (after syncIgnore): ${live.length}, for ${CIV}: ${civGaps.length}, other civs (noise): ${live.length - civGaps.length}`);
console.log("by kind for", CIV, by(civGaps, (g) => g.kind));
const unconfirmed = civGaps.filter((g) => !gapAssignments.value[g.id + ":" + g.civ]?.confirmed);
console.log(`needs manual category: ${unconfirmed.length}`, unconfirmed.map((g) => `${g.name} [${g.type}]`).join(", "));

// What the result holds for CIV vs. what the files hold today.
const result = Object.fromEntries(keys.map((k) => [k, out[k] ?? stripped[k]]));
const label = (e) => `${e.title}${e.age ? " (age " + e.age + ")" : ""}`;
const sig = (e) => [e.imgSrc, e.title, e.class, e.age, e.id, e.unitGroup].join("|");
const has = (set, k) => set[k].filter((e) => Array.isArray(e.civ) && e.civ.includes(CIV));
let ok = 0; const missing = [], wrongFile = [], wrongImg = [], extra = [];
const resAll = keys.flatMap((k) => has(result, k).map((e) => ({ k, e })));
const truAll = keys.flatMap((k) => has(truth, k).map((e) => ({ k, e })));
for (const { k, e } of truAll) {
  const exact = resAll.find((r) => r.k === k && sig(r.e) === sig(e));
  if (exact) { ok++; continue; }
  const sameTitleOther = resAll.find((r) => r.e.title === e.title);
  if (sameTitleOther && sameTitleOther.k !== k) wrongFile.push(`${label(e)}: ${k} → landed in ${sameTitleOther.k}`);
  else if (sameTitleOther) {
    const r = sameTitleOther.e, d = [];
    for (const f of ["imgSrc", "class", "age", "id", "unitGroup"]) if (r[f] !== e[f]) d.push(`${f}: want ${e[f]}, got ${r[f]}`);
    wrongImg.push(`${label(e)} in ${k}: ${d.join("; ")}`);
  }
  else missing.push(`${label(e)} [${k}]`);
}
for (const { k, e } of resAll) {
  if (!truAll.some((t) => t.e.title === e.title)) extra.push(`${label(e)} [${k}] ${e.imgSrc}`);
}
console.log(`\ntoday's ${CIV} entries: ${truAll.length}; reproduced exactly: ${ok}`);
console.log(`\nMISSING (${missing.length}):\n  ` + missing.join("\n  "));
console.log(`\nWRONG FILE (${wrongFile.length}):\n  ` + wrongFile.join("\n  "));
console.log(`\nWRONG IMAGE PATH (${wrongImg.length}):\n  ` + wrongImg.join("\n  "));
console.log(`\nEXTRA, not in today's files (${extra.length}):\n  ` + extra.join("\n  "));
const newOnes = civGaps.filter((g) => g.kind === "new");
console.log(`\nnew entries without age: ${newOnes.filter((g) => g.age == null).map((g) => g.name).join(", ")}`);

console.log("\nmerge misses reported in UI:", gapMergeMisses.value);
// Category rules against every existing entry, not just this civ's.
const allSrc = [...sourceData.units, ...sourceData.buildings, ...sourceData.technologies, ...sourceData.abilities];
let hit = 0, n = 0; const wrong = {};
for (const k of keys) for (const e of truth[k]) {
  const b = e.id?.replace(/-\d+$/, "");
  const s = allSrc.find((x) => x.id === e.id || x.baseId === b || x.id === b) ?? allSrc.find((x) => x.name === e.title);
  if (!s) continue;
  n++;
  const got = api.suggestCategory({ kind: "new", name: s.name, type: s.type, classes: s.classes, displayClasses: s.displayClasses });
  if (got === k) hit++; else { const key = k + " -> " + got; (wrong[key] ??= []).push(e.title); }
}
console.log(`\ncategory rules vs. all existing entries: ${hit}/${n} (${(100 * hit / n).toFixed(1)}%)`);
for (const [k, v] of Object.entries(wrong).sort((a, b) => b[1].length - a[1].length)) console.log(`  ${k}: ${v.length}  ${v.slice(0, 6).join(", ")}`);
