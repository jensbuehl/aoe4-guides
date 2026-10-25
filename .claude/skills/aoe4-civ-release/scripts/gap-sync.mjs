// Runs the Admin.vue Icon Gap Sync headless against a data directory — the
// tool's own functions, extracted from Admin.vue, so a fix there applies here.
//
//   node gap-sync.mjs <repo> <dataDir> --civs=VIK,SCO [--branch=<data branch>]
//        [--apply --sharp=<dir with node_modules/sharp>] [--overrides=f.json] [--variants=f.json]
//
// <dataDir>/opt/{units,buildings,technologies,abilities}.json are AOE4World's
// all-optimized files. Dry run writes <dataDir>/report.json and prints a summary.
// --apply writes the JSONs (only gaps for --civs) and the icons: the untouched
// original to src/assets/pictures_original_size, a 48px lanczos3 WebP q85 to public.
// --branch rewrites icon URLs to raw.githubusercontent for a branch not yet on
// data.aoe4world.com (which serves main only; new items 404 there until merge).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const [REPO, DATA] = process.argv.slice(2);
const APPLY = process.argv.includes("--apply");
const CIVS = (arg("civs") ?? "").split(",").filter(Boolean);
if (!CIVS.length) throw new Error("--civs=<CODE,CODE> is required");
const VARIANTS_FILE = arg("variants");
const BRANCH = arg("branch");
const IMG_BASE = BRANCH ? `https://raw.githubusercontent.com/aoe4world/data/${BRANCH}/images/` : "https://data.aoe4world.com/images/";
const require = createRequire(import.meta.url);
const fmt = require("./fmt.cjs");

const admin = readFileSync(`${REPO}/src/views/Admin.vue`, "utf8");
function extract(startRe) {
  const m = admin.match(startRe);
  if (!m) throw new Error("not found: " + startRe);
  let depth = 0;
  for (let j = admin.indexOf("{", m.index); j < admin.length; j++) {
    if (admin[j] === "{") depth++;
    else if (admin[j] === "}" && --depth === 0) return admin.slice(m.index, j + 1);
  }
}

const JSON_DIR = `${REPO}/src/composables/builds/icons/json`;
const keys = ["unitEco","unitReligious","unitMilitary","unitHero","buildingEco","buildingMilitary","buildingReligious","buildingTech","landmarks","techEco","techMilitary","abilityHero"];
const rawText = Object.fromEntries(keys.map((k) => [k, readFileSync(`${JSON_DIR}/${k}.json`, "utf8")]));
const local = Object.fromEntries(keys.map((k) => [k, JSON.parse(rawText[k])]));
const syncIgnore = JSON.parse(readFileSync(`${JSON_DIR}/syncIgnore.json`, "utf8"));

const src = (n) => { const j = JSON.parse(readFileSync(`${DATA}/opt/${n}.json`, "utf8")); return Array.isArray(j) ? j : j.data; };
const rewrite = (items) => items.map((i) => ({ ...i, icon: i.icon?.replace("https://data.aoe4world.com/images/", IMG_BASE) }));
const sourceData = Object.fromEntries(["units", "buildings", "technologies", "abilities"].map((n) => [n, rewrite(src(n))]));

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
  "return { buildGapList, initAssignment, downloadGapJsons };",
].join("\n");

const CATEGORY_CONFIG = keys.map((k) => ({ key: k, filename: k + ".json", data: local[k] }));
const ref = (v) => ({ value: v });
const gapItems = ref([]), gapAssignments = ref({}), gapUnmappedCivs = ref([]), gapSourceCount = ref(0), gapJsonSaved = ref({}), gapMergeMisses = ref([]);
const gapSyncIgnore = ref([...syncIgnore]);
const out = {};
const downloadObjectAsJSONFile = async (arr, filename) => { out[filename.replace(".json", "")] = arr; };
const api = new Function("CATEGORY_CONFIG","gapItems","gapAssignments","gapUnmappedCivs","gapSourceCount","gapJsonSaved","gapMergeMisses","gapSyncIgnore","downloadObjectAsJSONFile","console", code)(
  CATEGORY_CONFIG, gapItems, gapAssignments, gapUnmappedCivs, gapSourceCount, gapJsonSaved, gapMergeMisses, gapSyncIgnore, downloadObjectAsJSONFile, { warn() {} });

gapItems.value = api.buildGapList(sourceData);
gapItems.value.forEach((g) => api.initAssignment(g));
const ignored = new Set(gapSyncIgnore.value);
const live = gapItems.value.filter((g) => !ignored.has(g.id));
const key = (g) => g.id + ":" + g.civ;

const mine = live.filter((g) => CIVS.includes(g.civCode));
const other = live.filter((g) => !CIVS.includes(g.civCode));
const by = (arr, f) => arr.reduce((a, x) => ((a[f(x)] = (a[f(x)] ?? 0) + 1), a), {});
console.log("unmapped civ codes:", gapUnmappedCivs.value);
console.log(`gaps for ${CIVS}: ${mine.length}`, by(mine, (g) => g.civCode + " " + g.kind));
console.log(`gaps for other civs: ${other.length}`, by(other, (g) => g.kind));

const report = {
  unconfirmed: mine.filter((g) => !gapAssignments.value[key(g)]?.confirmed).map((g) => `${g.civCode} ${g.name} [${g.type}] ${g.displayClasses?.join("/")}`),
  variants: [...new Map(mine.filter((g) => g.variants).map((g) => [g.id + g.civCode, { civ: g.civCode, id: g.id, name: g.name, icon: g.icon, options: g.variants.map((v) => v.imgSrc), current: gapAssignments.value[key(g)].imgSrc }])).values()],
  newItems: [...new Map(mine.filter((g) => g.kind === "new").map((g) => [g.id, g])).values()].map((g) => ({
    id: g.id, name: g.name, type: g.type, age: g.age, civs: mine.filter((x) => x.id === g.id).map((x) => x.civCode),
    otherCivsInSource: other.filter((x) => x.id === g.id).map((x) => x.civCode),
    category: gapAssignments.value[key(g)].categoryKey, folder: gapAssignments.value[key(g)].imageFolder, dc: g.displayClasses?.join("/"),
  })),
  extensions: [...new Map(mine.filter((g) => g.kind === "civ-extension").map((g) => [g.id + g.civCode, g])).values()].map((g) =>
    `${g.civCode} ${g.name} -> ${g.localCategory?.key} ${g.localEntry?.imgSrc}${g.variants ? " (VARIANTS)" : ""}`),
  other: other.map((g) => `${g.kind} ${g.civCode} ${g.name} [${g.type}]`),
};
writeFileSync(`${DATA}/report.json`, JSON.stringify(report, null, 2));
console.log(`unconfirmed: ${report.unconfirmed.length}, variant decisions: ${report.variants.length}, new items: ${report.newItems.length}, extensions: ${report.extensions.length}`);

if (!APPLY) process.exit(0);

// Variant decisions: { "<id>:<CIV>": "<imgSrc>" }
if (VARIANTS_FILE) {
  const choice = JSON.parse(readFileSync(VARIANTS_FILE, "utf8"));
  for (const g of mine) {
    const c = choice[g.id + ":" + g.civCode];
    if (c) gapAssignments.value[key(g)].imgSrc = c;
  }
}
// Category overrides by item name, for what displayClasses cannot tell
// (e.g. eco techs filed under "Longhouse Upgrades"): { "<name>": "<categoryKey>" }
const OVERRIDES_FILE = process.argv.find((a) => a.startsWith("--overrides="))?.slice(12);
if (OVERRIDES_FILE) {
  const ov = JSON.parse(readFileSync(OVERRIDES_FILE, "utf8"));
  for (const g of mine) {
    if (g.kind === "new" && ov[g.name]) gapAssignments.value[key(g)] = { ...gapAssignments.value[key(g)], categoryKey: ov[g.name], confirmed: true };
  }
}
// Only the selected civs' gaps go into the files.
for (const g of other) gapAssignments.value[key(g)].confirmed = false;

// Images first, so an existing local icon is reused (the tool's findLocalIconByName
// is DOM-free but needs the category data; we only download what is missing on disk).
// sharp is not a repo dependency on purpose: install it in a scratch dir and pass --sharp
if (!arg("sharp")) throw new Error("--apply needs --sharp=<dir containing node_modules/sharp>");
const sharp = createRequire(`${arg("sharp")}/package.json`)("sharp");
const done = new Set();
const failed = [];
for (const g of mine) {
  if (g.kind !== "new" || done.has(g.id)) continue;
  const a = gapAssignments.value[key(g)];
  if (!a.confirmed || !a.imageFolder) continue;
  done.add(g.id);
  const fileId = g.sourceId ?? g.id; // g.id is type-qualified when AOE4World reuses an id
  const rel = `${a.imageFolder}/${fileId}.webp`;
  const file = `${REPO}/public/assets/pictures/${rel}`;
  // The untouched AOE4World original is kept beside the others, mirrored folder.
  const orig = `${REPO}/src/assets/pictures_original_size/${a.imageFolder}/${fileId}.png`;
  a.imgSrc = `/assets/pictures/${rel}`;
  if (existsSync(file) && existsSync(orig)) continue;
  try {
    const r = await fetch(g.icon);
    if (!r.ok) throw new Error(`HTTP ${r.status} ${g.icon}`);
    const buf = Buffer.from(await r.arrayBuffer());
    mkdirSync(dirname(file), { recursive: true });
    mkdirSync(dirname(orig), { recursive: true });
    if (!existsSync(orig)) writeFileSync(orig, buf);
    // Matches the existing icons: lanczos3 to 48x48, WebP quality 85
    if (!existsSync(file)) await sharp(buf).resize(48, 48, { kernel: "lanczos3" }).webp({ quality: 85 }).toFile(file);
  } catch (e) { failed.push(`${g.name}: ${e.message}`); }
}
// Propagate the image path to the other civ's assignment of the same item.
for (const g of mine) {
  const first = mine.find((x) => x.id === g.id && gapAssignments.value[key(x)].imgSrc);
  if (g.kind === "new" && first) gapAssignments.value[key(g)].imgSrc = gapAssignments.value[key(first)].imgSrc;
}

await api.downloadGapJsons();

// Serialise like the tool (JSON.stringify, 2 spaces) but keep the original text
// of every entry that did not change, so the diff shows only real changes.
function spans(text) {
  const res = []; let depth = 0, start = -1, inStr = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (c === "\\") i++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === "{") { if (depth++ === 0) start = i; }
    else if (c === "}") { if (--depth === 0) res.push(text.slice(start, i + 1)); }
  }
  return res;
}
// Top-level `"key": value` texts of one entry, keyed by name.
function fieldSpans(entryText) {
  const res = new Map(); let depth = 0, inStr = false, start = -1;
  for (let i = 0; i < entryText.length; i++) {
    const c = entryText[i];
    if (inStr) { if (c === "\\") i++; else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; if (depth === 1 && start === -1) start = i; continue; }
    if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") {
      if (depth === 1 && start !== -1) { const s = entryText.slice(start, i).trimEnd(); res.set(JSON.parse(s.slice(0, s.indexOf('"', 1) + 1)), s); start = -1; }
      depth--;
    } else if (c === "," && depth === 1 && start !== -1) {
      const s = entryText.slice(start, i).trimEnd(); res.set(JSON.parse(s.slice(0, s.indexOf('"', 1) + 1)), s); start = -1;
    }
  }
  return res;
}
for (const [k, arr] of Object.entries(out)) {
  const text = rawText[k].replace(/\r\n/g, "\n");
  const pool = new Map();
  for (const s of spans(text)) {
    const c = JSON.stringify(JSON.parse(s));
    if (!pool.has(c)) pool.set(c, []);
    pool.get(c).push(s);
  }
  // Original text per entry identity, to keep a changed entry in its old array style.
  const byIdentity = new Map(spans(text).map((s) => { const o = JSON.parse(s); return [o.title + "|" + o.id + "|" + o.imgSrc, s]; }));
  const parts = arr.map((e) => {
    const reuse = pool.get(JSON.stringify(e))?.shift();
    if (reuse) return "  " + reuse;
    const before = byIdentity.get(e.title + "|" + e.id + "|" + e.imgSrc);
    if (!before) return "  " + JSON.stringify(e, null, 2).replace(/\n/g, "\n  ");
    // Changed entry: every unchanged field keeps its original text; a changed
    // field is written in the style the entry already uses for arrays.
    const fields = fieldSpans(before);
    const oneLine = /"civ": \["/.test(before);
    const lines = Object.entries(e).map(([key, val]) => {
      const old = fields.get(key);
      // Reused text carries the file's absolute indent; make it entry-relative
      // like the rest, the outer join adds the array's two spaces back.
      if (old && JSON.stringify(JSON.parse("{" + old + "}")[key]) === JSON.stringify(val)) return "  " + old.replace(/\n  /g, "\n");
      const s = oneLine ? fmt({ [key]: val }) : JSON.stringify({ [key]: val }, null, 2);
      return s.slice(2, -2); // drop "{\n" and "\n}"; inner indent is already the entry's
    });
    return "  " + ("{\n" + lines.join(",\n") + "\n}").replace(/\n/g, "\n  ");
  });
  const trailing = text.endsWith("\n") ? "\n" : "";
  writeFileSync(`${JSON_DIR}/${k}.json`, "[\n" + parts.join(",\n") + "\n]" + trailing);
}
console.log("written:", Object.keys(out).join(", "));
console.log("merge misses:", gapMergeMisses.value);
console.log("image failures:", failed);
