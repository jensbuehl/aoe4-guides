// Guards against walking a section's entries as though they were all steps.
//
// `section.steps` stopped being a list of steps when alternatives arrived. It
// now holds ordinary steps, notes, and block objects whose own steps live one
// level down, inside each path. Code that iterates it directly reads a block as
// a step: it gets an object with no time, no villagers and no description, and
// it misses everything inside — which is most of the build, down whichever path
// the reader chose.
//
// Nothing catches this. It compiles, it runs, and the damage is quiet: a chart
// that stops at the fork, a time that drifts by however many steps a path has,
// a sanitiser that leaves half a document uncleaned. Seven of these have been
// found by hand, each one after it shipped.
//
// The sanctioned ways in:
//
//   flattenSections(sections, selection)  the build as one reading
//   sectionOffsets(sections, selection)   where each section starts in it
//   forEachStep(sections, visit)          every step in the document, all paths
//
// Which to use follows from the question. "What is being read" resolves each
// block to one path; anything acting on the document rather than on a reading —
// sanitising, validating, counting, migrating — has to reach the paths nobody
// chose, because those are saved too.
//
// Usage:
//   node scripts/check-steps.mjs
//
// Exits non-zero on an unsanctioned walk.
import fs from "fs";

// The modules that are allowed to do this, because they are what everything
// else is supposed to call. Keep this list short; a file added here is a file
// that has to be reviewed by hand forever.
const OWNERS = [
  "src/composables/builds/useAgeTimings.js",
  "src/composables/builds/alternativesDraft.js",
];

// `.steps` followed by an array operation. `.length` is included deliberately:
// slicing a resolver's output by `section.steps.length` is the specific way
// this has gone wrong most often, because a section with a block contributes
// the active path's step count and not its entry count.
const WALK = /\.steps\s*(?:\?\.)?\s*\.?\s*(forEach|map|filter|reduce|some|every|find|findIndex|flatMap|slice|length|at|\[)/g;

// A section's entries are reached through a *section*. `build.steps` and
// `props.build.steps` are the sections array itself — iterating that is the
// normal way to render a build and is not what this is looking for.
const SECTIONS_ARRAY = /(?:^|[^.\w$])(?:build|props\.build|value|build\.value|doc|data)\.steps\s*(?:\?\.)?\s*\.?\s*(?:forEach|map|filter|length)/;

// `steps[0]?.type` asks which format a build is in — sections, or the flat list
// the site used before them. It reads the sections array, never a section's
// entries, and it is the one idiom that looks like an index into the wrong
// thing while being the right thing.
const FORMAT_PROBE = /\.steps\s*(?:\?\.)?\[0\]\s*\??\.\s*type/;

/**
 * Blanks comments and strings so prose is never read as code — this file's own
 * header would otherwise report a dozen violations.
 *
 * @param {string} text - Source.
 * @return {string} The same length, with everything that is not code blanked.
 */
function codeOnly(text) {
  const out = text.split("");
  const blank = (from, to) => {
    for (let i = from; i < to && i < out.length; i++) if (out[i] !== "\n") out[i] = " ";
  };

  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === "/" && next === "/") {
      const end = text.indexOf("\n", i);
      blank(i, end < 0 ? text.length : end);
      i = end < 0 ? text.length : end;
    } else if (ch === "/" && next === "*") {
      const end = text.indexOf("*/", i + 2);
      blank(i, end < 0 ? text.length : end + 2);
      i = end < 0 ? text.length : end + 2;
    } else if (ch === '"' || ch === "'" || ch === "`") {
      let j = i + 1;
      while (j < text.length && text[j] !== ch) j += text[j] === "\\" ? 2 : 1;
      blank(i, j + 1);
      i = j + 1;
    } else {
      i++;
    }
  }

  // HTML comments too — a .vue template carries its reasoning in them.
  return out
    .join("")
    .replace(/<!--[\s\S]*?-->/g, (match) => match.replace(/[^\n]/g, " "));
}

const files = [...fs.globSync("src/**/*.{js,vue}")].map((file) => file.replaceAll("\\", "/"));
const findings = [];

for (const file of files) {
  if (OWNERS.includes(file)) continue;

  const lines = codeOnly(fs.readFileSync(file, "utf8")).split("\n");
  lines.forEach((line, index) => {
    WALK.lastIndex = 0;
    if (!WALK.test(line)) return;
    // Iterating the sections array itself is how a build is rendered.
    if (SECTIONS_ARRAY.test(line)) return;
    if (FORMAT_PROBE.test(line)) return;

    findings.push({ file, line: index + 1, text: line.trim() });
  });
}

if (findings.length) {
  console.log("Unsanctioned walk over a section's entries:\n");
  for (const finding of findings) {
    console.log(`  ${finding.file}:${finding.line}`);
    console.log(`    ${finding.text}`);
  }
  console.log(
    "\nA section's entries are steps, notes and alternatives blocks. Use" +
      "\nflattenSections/sectionOffsets to read one path, or forEachStep to" +
      "\nvisit every step in the document."
  );
  process.exit(1);
}

console.log("No unsanctioned walks over a section's entries.");
