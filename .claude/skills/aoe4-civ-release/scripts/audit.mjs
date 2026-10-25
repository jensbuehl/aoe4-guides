// Audits every VIK/SCO icon entry against the AoE4World branch data.
import { readFileSync, existsSync } from "node:fs";
//   node audit.mjs <repo> <dataDir> --civs=VIK:vik,SCO:sco
// <dataDir> holds opt/ (all-optimized) and all/ (all.json) for the four types.
// Prints only problems; "audited N entries" and nothing else is a clean pass.
const [REPO, DATA] = process.argv.slice(2);
const civArg = process.argv.find((a) => a.startsWith("--civs="))?.slice(7);
if (!civArg) throw new Error("--civs=OUR:aoe4world,... is required, e.g. --civs=VIK:vik,SCO:sco");
const keys = ["unitEco","unitReligious","unitMilitary","unitHero","buildingEco","buildingMilitary","buildingReligious","buildingTech","landmarks","techEco","techMilitary","abilityHero"];
const J = (k) => JSON.parse(readFileSync(`${REPO}/src/composables/builds/icons/json/${k}.json`, "utf8"));
const L = (dir, n) => { const j = JSON.parse(readFileSync(`${DATA}/${dir}/${n}.json`, "utf8")); return Array.isArray(j) ? j : j.data; };
const types = ["units", "buildings", "technologies", "abilities"];
const opt = types.flatMap((t) => L("opt", t));
const all = types.flatMap((t) => L("all", t));
const allIds = new Set(all.map((x) => x.id));
const SLUG = Object.fromEntries(civArg.split(",").map((p) => p.split(":")));
const CIVS = Object.keys(SLUG);

const issues = {};
const add = (kind, msg) => (issues[kind] ??= []).push(msg);
let n = 0;
for (const k of keys) for (const e of J(k)) {
  if (!Array.isArray(e.civ) || !e.civ.some((c) => CIVS.includes(c))) continue;
  n++;
  const label = `${e.title} [${k}]`;
  const isNew = /_(vikings|scots)\//.test(e.imgSrc);
  // images
  if (!existsSync(`${REPO}/public${e.imgSrc}`)) add("missing webp", label + " " + e.imgSrc);
  const orig = `${REPO}/src/assets/pictures_original_size${e.imgSrc.replace("/assets/pictures", "").replace(".webp", ".png")}`;
  if (!existsSync(orig)) add(isNew ? "missing original (new)" : "missing original (shared icon)", label + " " + e.imgSrc);
  // fields
  for (const f of ["title", "imgSrc", "civ", "class", "type"]) if (e[f] == null || e[f] === "") add("missing field " + f, label);
  if (!e.description) add("no description", label);
  if (!e.id) add("no id", label);
  // Units/buildings/techs use all.json's per-age ids; abilities use the optimized ids (no suffix)
  else if (!allIds.has(e.id) && !opt.some((s) => s.id === e.id || s.id === e.id.replace(/-\d+$/, "") || s.baseId === e.id.replace(/-\d+$/, ""))) add("id unknown to AoE4World", `${label} ${e.id}`);
  if (!e.exploreUrl) add("no exploreUrl", label);
  if (e.type !== "ability" && e.age == null) add("no age", label);
  if (e.type !== "ability" && !e.costs) add("no costs", label);
  if (k === "unitMilitary" && !e.unitGroup) add("no unitGroup (picker grouping)", label);
  // source cross-check: does AoE4World list this civ for this item?
  const base = e.id?.replace(/-\d+$/, "");
  const src = opt.filter((s) => s.id === e.id || s.id === base || s.baseId === base || s.name === e.title);
  for (const c of e.civ.filter((c) => CIVS.includes(c))) {
    if (src.length && !src.some((s) => s.civs.includes(SLUG[c]))) add("civ not in source", `${c} ${label}`);
  }
  if (!src.length) add("no source match", label);
  // explore url resolves to an item id
  const slug = e.exploreUrl?.split("/").pop();
  if (slug && !opt.some((s) => s.id === slug || s.baseId === slug)) add("exploreUrl slug unknown", `${label} ${slug}`);
}
// coverage: every source item for VIK/SCO has a local entry for that civ
const localAll = keys.flatMap((k) => J(k).map((e) => ({ ...e, k })));
const ignore = new Set(JSON.parse(readFileSync(`${REPO}/src/composables/builds/icons/json/syncIgnore.json`, "utf8")));
for (const s of opt) for (const c of CIVS) {
  if (!s.civs.includes(SLUG[c]) || ignore.has(s.id)) continue;
  const hit = localAll.some((e) => Array.isArray(e.civ) && e.civ.includes(c) &&
    (e.id === s.id || e.id?.replace(/-\d+$/, "") === (s.baseId || s.id) || e.title === s.name));
  if (!hit) add("source item without local entry", `${c} ${s.name} (${s.type})`);
}
console.log(`audited ${n} entries`);
for (const [k, v] of Object.entries(issues)) console.log(`\n## ${k} (${v.length})\n  ` + v.slice(0, 40).join("\n  "));
