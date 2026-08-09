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

// Anything a call site may legitimately resolve to without being declared in the
// file: language and browser builtins, plus the control-flow keywords that look
// like calls to a regex.
/**
 * Blanks comments, strings and regex literals so prose is never mistaken for
 * code — a docblock sentence like "…the age(…)" otherwise reads as a call.
 *
 * A single pass rather than a stack of regex replacements: those cannot tell an
 * apostrophe in a comment from the start of a string, and one mismatched quote
 * silently shifts every literal after it, which is how this reported a call to
 * `nearest` that does not exist.
 *
 * @param {string} text - Source.
 * @return {string} The same length, with everything that is not code blanked.
 */
function codeOnly(text) {
  const out = text.split("");
  const blank = (from, to) => {
    for (let i = from; i < to && i < out.length; i++) if (out[i] !== "\n") out[i] = " ";
  };
  // A `/` is a regex only where a value may begin, never after one
  const beforeRegex = /[([{,;:=!&|?+\-*%~^<>]$/;

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
    } else if (ch === "/" && beforeRegex.test(text.slice(0, i).trimEnd().slice(-1))) {
      let j = i + 1;
      let inClass = false;
      while (j < text.length && (inClass || text[j] !== "/")) {
        if (text[j] === "\\") j++;
        else if (text[j] === "[") inClass = true;
        else if (text[j] === "]") inClass = false;
        j++;
      }
      blank(i, j + 1);
      i = j + 1;
    } else {
      i++;
    }
  }

  return out.join("");
}

const GLOBALS = new Set([
  "setup", "async", "import", "new", "else", "do", "try", "yield", "void", "delete",
  "in", "of", "instanceof", "throw", "case",
  "if", "for", "while", "switch", "catch", "return", "typeof", "function", "await", "super",
  "Array", "Object", "String", "Number", "Boolean", "Math", "JSON", "Date", "Set", "Map",
  "Promise", "RegExp", "Error", "parseInt", "parseFloat", "isNaN", "Symbol",
  "setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame",
  "console", "window", "document", "navigator", "getComputedStyle", "structuredClone",
  "Image", "Blob", "File", "FileReader", "Audio", "AbortController", "IntersectionObserver",
  "encodeURIComponent", "decodeURIComponent", "fetch", "URL", "Intl",
]);

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
    // parameters are bindings too — `new Promise((resolve) => …)` declares one
    for (const m of text.matchAll(/\(([^()]*)\)\s*=>/g)) {
      m[1].split(",").forEach((n) => declared.add(n.trim().split(/[\s=:]/)[0]));
    }
    for (const m of text.matchAll(/function\s*[\w$]*\s*\(([^()]*)\)/g)) {
      m[1].split(",").forEach((n) => declared.add(n.trim().split(/[\s=:]/)[0]));
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

  // A helper the component only calls internally is just as fatal and does not
  // appear in the return block — `documentIndex` went that way. Every call whose
  // callee is a bare identifier has to resolve to something.
  const called = new Set();
  for (const m of codeOnly(body.slice(0, retAt)).matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
    called.add(m[2]);
  }
  const uncalled = [...called].filter((name) => !declared.has(name) && !GLOBALS.has(name));

  if (missing.length || uncalled.length) {
    bad++;
    console.log(`✗ ${file}`);
    if (missing.length) console.log(`    returned but never defined: ${missing.join(", ")}`);
    if (uncalled.length) console.log(`    called but never defined: ${uncalled.join(", ")}`);
  }
}

if (bad) {
  console.log(`\n${bad} component(s) would throw during setup.`);
  process.exit(1);
}

console.log("All components return only names they define.");
