// Guards against an orphaned irregular plural.
//
// src/composables/builds/icons/plurals.js holds the icon titles the regular
// pluralisation rules get wrong. Its keys are matched against icon titles, and
// the icon JSON under icons/json/ is regenerated from an upstream source — so
// an upstream rename does not break anything loudly. It leaves a key here
// pointing at a title that no longer exists, the exception silently lapses back
// to the regular rule, and "Nest of Bees" starts reading "Nest of Beess" on a
// page nobody is looking at.
//
// This script fails when any key in plurals.js matches no icon title. Run it in
// CI and locally:  node scripts/check-plurals.mjs
//
// A failure is a decision, not a chore: either the title was renamed (rekey the
// entry) or the icon is gone (delete it).

import iconService from "../src/composables/builds/icons/iconService.js";
import { IRREGULAR_PLURALS } from "../src/composables/builds/icons/plurals.js";

const titles = new Set(iconService().getIcons().map((icon) => icon.title));
const keys = Object.keys(IRREGULAR_PLURALS);
const orphaned = keys.filter((title) => !titles.has(title)).sort();

if (orphaned.length) {
  console.error(
    `✗ ${orphaned.length} entr${orphaned.length === 1 ? "y" : "ies"} in ` +
      `src/composables/builds/icons/plurals.js match no icon title.\n` +
      `  Each one is a pluralisation exception that has silently stopped applying.\n` +
      `  Rekey it if the icon was renamed, delete it if the icon is gone:\n  ${orphaned.join("\n  ")}`
  );
  process.exit(1);
}

console.log(`✓ plurals OK — all ${keys.length} irregular plurals match a live icon title.`);
