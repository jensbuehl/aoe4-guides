// Guards against a component returning something it never defined.
//
// `vite build` cannot catch this. The template compiles fine — the identifier
// only has to exist when setup() actually runs — so the failure arrives in the
// browser as `ReferenceError: x is not defined`, which throws during setup and
// renders the component as nothing at all. A whole page can go blank behind a
// green build.
//
// It happens most easily when a helper is removed by editing a range of lines
// and something else in that range goes with it.
//
// Usage:
//   node scripts/check-setup.mjs $(git ls-files '*.vue')
//
// Exits non-zero if any component returns an undefined name.
import fs from "fs";

// Globbing here rather than in the npm script: cmd.exe does not expand `**`, so
// the pattern arrives as a literal path and the script dies on the first read.
const args = process.argv.slice(2);
const files = args.length ? args : [...fs.globSync("src/**/*.vue")];

let bad = 0;

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const setupAt = src.indexOf("setup(props");
  if (setupAt < 0) continue;

  const body = src.slice(setupAt);
  const retAt = body.lastIndexOf("\n    return {");
  if (retAt < 0) continue;

  // setup's own parameters are in scope too
  const declared = new Set(["props", "context", "emit", "attrs", "slots", "expose"]);

  const scan = (text) => {
    for (const m of text.matchAll(/\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g)) {
      declared.add(m[1]);
    }
    for (const m of text.matchAll(/\b(?:const|let)\s*\{([^}]+)\}\s*=/g)) {
      m[1].split(",").forEach((part) => declared.add(part.split(":").pop().trim()));
    }
  };

  // module scope counts: imports and top-level consts are perfectly valid things
  // for setup() to hand back
  scan(src.slice(0, setupAt));
  scan(body.slice(0, retAt));
  for (const m of src.matchAll(/^import\s+(?:\{([^}]+)\}|([A-Za-z_$][\w$]*))/gm)) {
    if (m[2]) declared.add(m[2]);
    if (m[1]) m[1].split(",").forEach((n) => declared.add(n.split(" as ").pop().trim()));
  }

  const returned = [...body.slice(retAt).matchAll(/^\s{6}([A-Za-z_$][\w$]*),\s*$/gm)].map(
    (m) => m[1]
  );
  const missing = returned.filter((name) => !declared.has(name));

  if (missing.length) {
    bad++;
    console.log(`✗ ${file}`);
    console.log(`    returned but never defined: ${missing.join(", ")}`);
  }
}

if (bad) {
  console.log(`\n${bad} component(s) would throw during setup.`);
  process.exit(1);
}

console.log("All components return only names they define.");
