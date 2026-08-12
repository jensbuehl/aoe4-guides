// Emits one static HTML file per public build, carrying that build's own head
// tags, so a crawler or a link unfurler sees the build rather than the SPA
// shell's site-wide defaults.
//
// ─────────────────────────────────────────────────────────────────────────────
// THIS SCRIPT MAY NEVER FAIL A BUILD. IT EXITS 0 IN EVERY CASE, INCLUDING ERROR.
//
// It runs as `postbuild`, which means it runs after every `npm run build` a
// developer types and every deploy Netlify performs. Absent pages degrade
// exactly to today's behaviour — the SPA catch-all serves the shell and the
// site works — so there is no failure here worth breaking a deploy over. A
// generator that can turn a red deploy out of a working site is worse than no
// generator at all. (FR-018, FR-019, FR-020)
// ─────────────────────────────────────────────────────────────────────────────
//
// It also reads NO database. The build data is data/seo-snapshot.ndjson,
// committed to the repository and refreshed by a scheduled Action. So a deploy
// costs zero Firestore reads, needs no credential, and reproduces from a
// checkout alone. firebase-admin is imported by scripts/refresh-snapshot.mjs
// and must never be imported here. (FR-025, research R11)
//
// Usage:
//   node scripts/prerender.mjs [--force] [--limit=N] [--dry-run]
//
// Environment:
//   NETLIFY   set by Netlify. Its presence is what distinguishes a deploy from
//             a local build or a CI run, and is why neither generates pages.

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT NOTHING HERE BUT node: BUILTINS. NOT src/, NOT A DEPENDENCY.
//
// This is what makes the promise above true rather than aspirational. The
// try/catch at the bottom cannot help with a *static import* — that throws
// during module instantiation, before any of this file's code runs, and takes
// the whole deploy with it. It has happened: importing one named export from a
// src/ module turned a green build into `Build failed` with exit code 2.
//
// It failed only on Netlify, which is the trap. Netlify pins Node 22.1.0, and
// automatic module-syntax detection did not land until 22.7.0 — so a src/ .js
// file, in a package with no "type": "module", is plain CommonJS there and its
// named exports do not exist. Locally (22.22) and in CI (`22.x`, latest) the
// same import resolves fine. engines.node "22.x" permits all three.
//
// Anything this script needs from the application must arrive through the
// snapshot instead, which is also what keeps it to string assembly over a file
// it could read on a machine with no network. (FR-025)
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATIC_SITEMAP = join(ROOT, "public", "sitemap.xml");
const ROBOTS = join(ROOT, "public", "robots.txt");
const SNAPSHOT = join(ROOT, "data", "seo-snapshot.ndjson");
const DIST = join(ROOT, "dist");
const TEMPLATE = join(DIST, "index.html");
const OUTPUT_DIR = join(DIST, "builds");

//The built shell must contain both of these or it cannot boot the application.
//Asserted rather than assumed: emitting thousands of pages from a template that
//loads nothing would be far worse than emitting none, and a changed Vite output
//shape is a code defect that has to be visible in the deploy log.
const HEAD_CLOSE = "</head>";

//Captures the indentation so the injected block lands in column with the rest
//of the head and </head> keeps its own. Matched with a *function* replacer
//everywhere it is used: String.replace expands `$&` and `$1` inside a
//replacement string, so a build titled "50$&100" would otherwise splice the
//matched text into its own page.
const HEAD_CLOSE_INDENTED = /([ \t]*)<\/head>/i;
const HASHED_MODULE = /<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["']\/assets\/[^"']+["']/i;

const LOG = "prerender:";

//Must match src/router/index.js. The router writes a canonical tag once the app
//boots, over the one this script bakes in — so if the two rules ever disagree,
//every page silently changes its own canonical a second after loading.
const SITE_ORIGIN = "https://aoe4guides.com";

//Google truncates around here. Not a hard limit, and the tag is valid at any
//length; going long just wastes the part nobody reads.
const DESCRIPTION_LIMIT = 160;

//Firestore document ids are 20 alphanumeric characters. This is deliberately
//wider than that and still cannot express a path: no dot, no slash, no
//separator of any kind. Whatever an id turns out to contain, the generator
//cannot be made to write outside its own output directory. (T046)
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

//Civ code -> display name, read from the snapshot's _meta rather than imported
//from src/ (see the header). Still the app's own list, just carried here by the
//refresh instead of resolved at generation time.
let civNames = {};

/**
 * @param {string} code - A civ short name such as "ABB".
 * @return {string} Its display name, or the code itself when unknown.
 *
 * Falling back to the code matters: a snapshot written before _meta.civs
 * existed, or a civ added to the game since, must still produce a page. "ABB
 * Build Order" is worse than "Abbasid Dynasty Build Order" and far better than
 * a crash or a blank.
 */
function civName(code) {
  return civNames[code] ?? code ?? "";
}

/**
 * Escapes text for use inside a double-quoted HTML attribute.
 *
 * All five, not just the quote: a title containing `<` would otherwise open a
 * tag when the attribute is later read, and an unescaped `&` can start an
 * entity that swallows what follows it. (FR-011)
 *
 * @param {string} text
 * @return {string}
 */
function escapeAttribute(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Serialises structured data for embedding in a <script> block.
 *
 * `<` becomes its JSON < escape, NOT the HTML entity `&lt;`.
 *
 * The contract asked for `&lt;`, and that is wrong: the content of a
 * `<script type="application/ld+json">` block is parsed as JSON, not as HTML,
 * so entities in it are never decoded. `&lt;` would survive into the parsed
 * data as those four literal characters and quietly corrupt any title
 * containing a `<`. `<` is JSON's own escape — it parses back to `<`,
 * while leaving no `<` in the byte stream for the HTML parser to mistake for
 * `</script>`. Same goal, and it actually works. (FR-011)
 *
 * @param {Object} data
 * @return {string}
 */
function escapeJsonLd(data) {
  return JSON.stringify(data).replaceAll("<", "\\u003C");
}

/**
 * The canonical URL for a path.
 *
 * Deliberately the same expression as `setCanonical` in src/router/index.js —
 * no trailing slash, no query string. The router overwrites this tag when the
 * app boots, so any disagreement between the two shows up as a page whose
 * canonical changes a moment after it loads. (FR-007)
 *
 * @param {string} path - A route path, e.g. "/builds/abc".
 * @return {string}
 */
function canonicalFor(path) {
  const trimmed = path.length > 1 ? path.replace(/\/+$/, "") : "";
  return `${SITE_ORIGIN}/${trimmed.replace(/^\//, "")}`;
}

/**
 * Cuts text to a length without splitting a word or ending on punctuation.
 *
 * @param {string} text
 * @param {number} max
 * @return {string}
 */
function truncate(text, max = DESCRIPTION_LIMIT) {
  if (text.length <= max) return text;

  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  //Only break at a space if one falls late enough to be a word boundary rather
  //than the start of the string — a 160-character word would otherwise vanish.
  const body = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;

  return body.replace(/[\s,;:.!?-]+$/, "") + "…";
}

/**
 * The page title for a build.
 *
 * @param {Object} record - A snapshot record.
 * @return {string}
 */
function titleFor(record) {
  const title = (record.title ?? "").trim();
  if (title) return title;

  //Blank titles exist. A page called "| AOE4 GUIDES" is worse than one naming
  //the civilisation it is about. (FR-008)
  const civ = civName(record.civ);
  return civ ? `${civ} Build Order` : "Build Order";
}

/**
 * The meta description for a build.
 *
 * @param {Object} record - A snapshot record.
 * @return {string}
 */
function descriptionFor(record) {
  const description = (record.description ?? "").trim();
  if (description) return truncate(description);

  //46% of published builds have no description at all, measured over the
  //sample in T022 — so this is the common path, not the edge case, and it has
  //to read like a sentence rather than a field dump. (FR-009)
  const civ = civName(record.civ);
  const parts = [civ && `${civ} build order`, (record.strategy ?? "").trim(), (record.season ?? "").trim()]
    .filter(Boolean)
    .join(" · ");
  const author = (record.author ?? "").trim();

  return truncate([parts || "Age of Empires IV build order", author && `by ${author}`].filter(Boolean).join(" "));
}

/**
 * Removes the shell's own page-level tags from the template.
 *
 * They describe the site, and would otherwise sit beside the per-build ones
 * contradicting them — two titles, two descriptions, two og:urls. What stays is
 * everything that is genuinely page-independent: og:site_name, the images,
 * twitter:card and twitter:domain. (contracts/generated-page.md)
 *
 * @param {string} template - The built shell.
 * @return {string}
 */
function stripShellTags(template) {
  return template
    //The shell's comment explaining why it carries no canonical. True of the
    //shell, and false of every file this script writes — they each get one. A
    //comment that contradicts the markup three lines below it is worse than no
    //comment, and this one would sit in four thousand files.
    .replace(/^[ \t]*<!--\s*No <link rel="canonical">[\s\S]*?-->[ \t]*\r?\n?/im, "")
    .replace(/^[ \t]*<title>[\s\S]*?<\/title>[ \t]*\r?\n?/im, "")
    .replace(/^[ \t]*<meta\s+name=["']description["'][^>]*>[ \t]*\r?\n?/im, "")
    .replace(
      /^[ \t]*<meta\s+(?:property|name)=["'](?:og:(?:type|url|title|description)|twitter:(?:url|title|description))["'][^>]*>[ \t]*\r?\n?/gim,
      ""
    );
}

/**
 * The head block injected before </head>.
 *
 * @param {Object} record - A snapshot record.
 * @return {string}
 */
function headBlock(record) {
  const title = titleFor(record);
  const description = descriptionFor(record);
  const canonical = canonicalFor(`/builds/${record.id}`);
  //The suffix is part of the title as displayed, so it belongs in og:title too
  //— an unfurled card reading only the build's name looks like a broken quote.
  const fullTitle = `${title} | AOE4 GUIDES`;

  const attr = { title: escapeAttribute(fullTitle), description: escapeAttribute(description), canonical: escapeAttribute(canonical) };

  const structured = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: title,
    description,
    ...(record.author ? { author: { "@type": "Person", name: record.author } } : {}),
    ...(record.civ ? { about: { "@type": "Thing", name: `Age of Empires IV — ${civName(record.civ)}` } } : {}),
    ...(record.created ? { dateModified: new Date(record.created * 1000).toISOString().slice(0, 10) } : {}),
    //Omitted entirely when there are none. An empty array is a claim that the
    //build has no steps, which is a different and false statement. (FR-010)
    ...(record.steps?.length
      ? { step: record.steps.map((text, index) => ({ "@type": "HowToStep", position: index + 1, text })) }
      : {}),
  };

  return [
    `    <title>${escapeAttribute(fullTitle)}</title>`,
    `    <meta name="description" content="${attr.description}">`,
    `    <link rel="canonical" href="${attr.canonical}">`,
    "",
    //article, not the shell's website: a build order is a document with an
    //author and a date, and unfurlers present the two differently.
    `    <meta property="og:type" content="article">`,
    `    <meta property="og:url" content="${attr.canonical}">`,
    `    <meta property="og:title" content="${attr.title}">`,
    `    <meta property="og:description" content="${attr.description}">`,
    "",
    `    <meta property="twitter:url" content="${attr.canonical}">`,
    `    <meta name="twitter:title" content="${attr.title}">`,
    `    <meta name="twitter:description" content="${attr.description}">`,
    "",
    `    <script type="application/ld+json">${escapeJsonLd(structured)}</script>`,
    "",
  ].join("\n");
}

//────────────────────────────────────────────────────────────────────────────
// Sitemap
//
// THE NAMESPACE URI IS http:// AND IS COMPARED LITERALLY. Writing https:// puts
// the document in a namespace no search engine recognises and the whole file is
// rejected. It is an identifier, not a link — do not "fix" the scheme. The same
// warning is in public/sitemap.xml, and it is repeated here because this is now
// the file that actually ships. (T054)
//────────────────────────────────────────────────────────────────────────────
const SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";

//The protocol caps a single sitemap at 50,000 URLs / 50 MB. Guarded well below
//it: at ~4,000 builds this is far out of reach, but "far out of reach" is what
//everyone says right up until a file silently truncates. (FR-017)
const MAX_URLS_PER_FILE = 45_000;

/**
 * @param {string} text
 * @return {string} XML-escaped.
 */
function escapeXml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/**
 * The paths robots.txt tells crawlers not to visit.
 *
 * A sitemap that advertises a disallowed URL is a document contradicting
 * itself, and search consoles report it as an error. Read rather than restated,
 * so a future robots.txt edit cannot silently create that contradiction.
 *
 * @return {Array<string>} Disallowed path prefixes.
 */
function disallowedPaths() {
  try {
    return [...readFileSync(ROBOTS, "utf8").matchAll(/^\s*Disallow:\s*(\S+)\s*$/gim)]
      .map((match) => match[1])
      .filter((path) => path !== "/");
  } catch {
    //No robots.txt is not a reason to emit nothing.
    return [];
  }
}

/**
 * The `<url>` blocks already in public/sitemap.xml, carried through verbatim.
 *
 * Read rather than restated so that file stays the single place the static
 * routes are declared — adding one there reaches the generated sitemap with no
 * second edit, and their hand-set <priority> values survive.
 *
 * @return {Array<string>} Raw XML for each static <url> block.
 */
function staticUrlBlocks() {
  try {
    const xml = readFileSync(STATIC_SITEMAP, "utf8");
    //Comments stripped first: the file's own explanation mentions URLs.
    //Re-indented: the match starts at "<url>" and so drops the leading spaces
    //of that one line, which would leave it out of column with its own
    //closing tag and with every build block below it.
    return [...xml.replace(/<!--[\s\S]*?-->/g, "").matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => `    ${m[0]}`);
  } catch (error) {
    console.warn(`${LOG} could not read public/sitemap.xml (${error.message}); emitting build URLs only`);
    return [];
  }
}

/**
 * @param {Array<string>} blocks - Raw <url> blocks.
 * @return {string} A complete urlset document.
 */
function urlsetDocument(blocks) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${SITEMAP_NS}">\n${blocks.join("\n")}\n</urlset>\n`;
}

/**
 * Writes dist/sitemap.xml, replacing the 5-URL static copy Vite put there.
 *
 * On a skipped run this is never reached, so that copy survives untouched and
 * the site keeps the sitemap it has today — FR-016 with no code to implement
 * it, which is why the skip is a plain early return rather than a flag.
 *
 * @param {Array<Object>} records - The builds that got pages.
 * @return {{urls: number, files: number}}
 */
function writeSitemap(records) {
  const disallowed = disallowedPaths();
  const blocks = [...staticUrlBlocks()];
  let excluded = 0;

  for (const record of records) {
    const path = `/builds/${record.id}`;
    if (disallowed.some((prefix) => path.startsWith(prefix))) {
      excluded++;
      continue;
    }

    const lastmod = record.created
      ? `<lastmod>${new Date(record.created * 1000).toISOString().slice(0, 10)}</lastmod>`
      : "";

    blocks.push(`    <url>\n        <loc>${escapeXml(canonicalFor(path))}</loc>\n${lastmod ? `        ${lastmod}\n` : ""}    </url>`);
  }

  if (excluded) console.log(`${LOG}   ${excluded} url(s) omitted from the sitemap — disallowed by robots.txt`);

  //One file while it fits. Above the guard, split into numbered files behind a
  //sitemapindex — the alternative is a document that silently stops at 50,000
  //and takes every URL after it with no error anywhere.
  if (blocks.length <= MAX_URLS_PER_FILE) {
    writeFileSync(join(DIST, "sitemap.xml"), urlsetDocument(blocks), "utf8");
    return { urls: blocks.length, files: 1 };
  }

  const chunks = [];
  for (let i = 0; i < blocks.length; i += MAX_URLS_PER_FILE) {
    chunks.push(blocks.slice(i, i + MAX_URLS_PER_FILE));
  }

  chunks.forEach((chunk, index) => {
    writeFileSync(join(DIST, `sitemap-${index + 1}.xml`), urlsetDocument(chunk), "utf8");
  });

  const index = chunks
    .map((_, i) => `    <sitemap>\n        <loc>${SITE_ORIGIN}/sitemap-${i + 1}.xml</loc>\n    </sitemap>`)
    .join("\n");
  writeFileSync(
    join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="${SITEMAP_NS}">\n${index}\n</sitemapindex>\n`,
    "utf8"
  );

  return { urls: blocks.length, files: chunks.length + 1 };
}

/**
 * Parses the snapshot's records, skipping anything unusable.
 *
 * Per-line rather than fatal on purpose: one malformed record should cost one
 * page, not four thousand. (contracts/prerender-cli.md, case 4)
 *
 * @param {string} snapshot - The whole file.
 * @param {number|null} limit
 * @param {Object} counters - Mutated with `unparseable` and `unsafeId` counts.
 * @return {Array<Object>}
 */
function readRecords(snapshot, limit, counters) {
  const records = [];

  //Line 0 is _meta, already read by decide().
  for (const line of snapshot.split("\n").slice(1)) {
    if (!line.trim()) continue;
    if (limit && records.length >= limit) break;

    let record;
    try {
      record = JSON.parse(line);
    } catch {
      counters.unparseable++;
      continue;
    }

    if (!SAFE_ID.test(record?.id ?? "")) {
      counters.unsafeId++;
      continue;
    }

    records.push(record);
  }

  return records;
}

/**
 * @param {Array<string>} argv - process.argv.slice(2).
 * @return {{force: boolean, limit: number|null, dryRun: boolean}}
 */
function parseArgs(argv) {
  const options = { force: false, limit: null, dryRun: false };

  for (const arg of argv) {
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    const limit = arg.match(/^--limit=(\d+)$/);
    if (limit) {
      options.limit = Number(limit[1]);
      continue;
    }

    //Not fatal. An unknown flag is a typo, and a typo must not cost a deploy
    //its pages — it is reported and the run continues with what it understood.
    console.warn(`${LOG} ignoring unrecognised argument: ${arg}`);
  }

  return options;
}

/**
 * The snapshot's `_meta` line, or null when the file cannot be used.
 *
 * Only the first line is read here. The records behind it are the generator's
 * business and are parsed one at a time, so a single malformed record costs one
 * page rather than four thousand.
 *
 * @param {string} text - The whole snapshot.
 * @return {Object|null}
 */
function readMeta(text) {
  const firstLine = text.slice(0, text.indexOf("\n") + 1 || undefined).trim();
  if (!firstLine) return null;

  try {
    return JSON.parse(firstLine)?._meta ?? null;
  } catch {
    return null;
  }
}

/**
 * How stale the snapshot is, in whole days.
 *
 * @param {string} generated - ISO-8601 timestamp from `_meta`.
 * @return {number|null}
 */
function ageInDays(generated) {
  const at = Date.parse(generated ?? "");
  if (Number.isNaN(at)) return null;
  return Math.floor((Date.now() - at) / 86_400_000);
}

/**
 * Decides whether to run, and reports why not.
 *
 * The order is the contract (contracts/prerender-cli.md): first match wins, and
 * every outcome exits 0.
 *
 * @param {Object} options - Parsed arguments.
 * @return {{run: boolean, snapshot?: string, meta?: Object, template?: string}}
 */
function decide(options) {
  //1 — not a deploy. The common case by far: every local build lands here, and
  //it has to be cheap and quiet enough that nobody minds it running.
  if (!process.env.NETLIFY && !options.force) {
    console.log(`${LOG} skipped — not a Netlify build (pass --force to run anyway)`);
    return { run: false };
  }

  //2 — no data. Not an error: a fresh clone before the first refresh, or a
  //branch predating the snapshot, both land here legitimately.
  if (!existsSync(SNAPSHOT)) {
    console.log(`${LOG} skipped — data/seo-snapshot.ndjson not found`);
    return { run: false };
  }

  let snapshot;
  try {
    snapshot = readFileSync(SNAPSHOT, "utf8");
  } catch (error) {
    console.log(`${LOG} skipped — data/seo-snapshot.ndjson unreadable: ${error.message}`);
    return { run: false };
  }

  const meta = readMeta(snapshot);
  if (!meta) {
    console.log(`${LOG} skipped — data/seo-snapshot.ndjson has no readable _meta line`);
    return { run: false };
  }

  //3 — the template. Loud, because unlike the two above this is a defect and
  //not a condition: dist/index.html is always present after a successful vite
  //build, so its absence or a changed shape means something is wrong with the
  //build itself and someone has to look.
  if (!existsSync(TEMPLATE)) {
    console.error(`${LOG} NOT GENERATING — dist/index.html is missing. Did vite build run?`);
    return { run: false };
  }

  const template = readFileSync(TEMPLATE, "utf8");
  if (!template.includes(HEAD_CLOSE)) {
    console.error(`${LOG} NOT GENERATING — dist/index.html has no ${HEAD_CLOSE} to inject before.`);
    return { run: false };
  }
  if (!HASHED_MODULE.test(template)) {
    console.error(
      `${LOG} NOT GENERATING — dist/index.html has no hashed <script type="module" ` +
        `src="/assets/…">. Pages built from it would render nothing. This is a build ` +
        `defect, not a missing snapshot.`
    );
    return { run: false };
  }

  return { run: true, snapshot, meta, template };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const decision = decide(options);
  if (!decision.run) return;

  const { meta } = decision;
  const age = ageInDays(meta.generated);
  civNames = meta.civs ?? {};

  //The one line every successful run prints, and the only observability this
  //has. Both facts on it earn their place: the project id catches a refresh
  //that ran against aoe4-guides-dev, which would otherwise produce a plausible
  //set of pages for builds that do not exist in production; the age catches a
  //scheduled refresh that has quietly stopped running, which is the failure
  //FR-028 exists to prevent. (FR-023)
  console.log(
    `${LOG} snapshot ${meta.project} @ ${(meta.generated ?? "?").slice(0, 10)}` +
      `${age === null ? "" : ` (${age} day${age === 1 ? "" : "s"} old)`} · ` +
      `${meta.builds ?? "?"} build${meta.builds === 1 ? "" : "s"}`
  );

  if (meta.project !== "aoe4-guides") {
    console.warn(
      `${LOG} WARNING — snapshot came from "${meta.project}", not "aoe4-guides". ` +
        `These pages would describe builds that do not exist in production.`
    );
  }
  if (age !== null && age > 45) {
    console.warn(
      `${LOG} WARNING — snapshot is ${age} days old. The refresh runs monthly, so ` +
        `it has probably stopped: check the Refresh SEO snapshot workflow.`
    );
  }

  if (options.limit) console.log(`${LOG} limit: ${options.limit} builds`);
  if (options.dryRun) console.log(`${LOG} dry run — nothing will be renamed into place`);

  const started = Date.now();
  const counters = { unparseable: 0, unsafeId: 0 };
  const records = readRecords(decision.snapshot, options.limit, counters);
  const template = stripShellTags(decision.template);

  //Written into a sibling temp directory and renamed into place as the very
  //last step, so a run that dies halfway leaves the previous state intact
  //rather than publishing a partial set. (FR-021)
  const staging = mkdtempSync(join(DIST, ".builds-"));
  let written = 0;

  try {
    for (const record of records) {
      const block = headBlock(record);
      const page = template.replace(HEAD_CLOSE_INDENTED, (_match, indent) => `${block}${indent}${HEAD_CLOSE}`);
      writeFileSync(join(staging, `${record.id}.html`), page, "utf8");
      written++;
    }

    if (options.dryRun) {
      console.log(`${LOG} dry run — would have written ${written} pages to dist/builds/`);
      rmSync(staging, { recursive: true, force: true });
      return;
    }

    //Cleared rather than merged. vite build empties dist/ anyway, but a
    //standalone `npm run prerender` does not, and a page left behind from a
    //build that no longer exists would go on being served. (FR-004)
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
    renameSync(staging, OUTPUT_DIR);
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }

  const skipped = counters.unparseable + counters.unsafeId;
  console.log(
    `${LOG}   ${written} page${written === 1 ? "" : "s"} written` +
      (skipped
        ? ` · ${skipped} skipped (${counters.unsafeId} unsafe id, ${counters.unparseable} unparseable)`
        : "") +
      ` · ${((Date.now() - started) / 1000).toFixed(1)}s`
  );

  //Last, and only once the pages are in place: a sitemap advertising pages that
  //failed to write would be worse than the 5-URL copy it replaces.
  const sitemap = writeSitemap(records);
  console.log(`${LOG}   sitemap: ${sitemap.urls} urls, ${sitemap.files} file${sitemap.files === 1 ? "" : "s"}`);
}

//Nothing below this line may throw past it. A crash here is still a green
//deploy serving the site exactly as it does today.
try {
  main();
} catch (error) {
  console.error(`${LOG} failed, continuing anyway — ${error?.message ?? error}`);
  if (error?.stack) console.error(error.stack);
}

process.exit(0);
