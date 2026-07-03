// Guards against a forgotten icon-list regeneration.
//
// The app no longer ships the full @mdi/font webfont — instead only the icons
// listed in src/plugins/mdiIcons.js are tree-shaken in from @mdi/js. If a
// component references an `mdi-*` icon that isn't in that list, it silently
// renders nothing in production (there's only a dev-mode console warning).
//
// This script fails when any `mdi-*` used under src/ is missing from
// mdiIcons.js. Run it in CI and locally:  node scripts/check-icons.mjs
// After adding/removing icons, regenerate the list per the header comment in
// src/plugins/mdiIcons.js.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, "..", "src");
const ICONS_FILE = join(SRC_DIR, "plugins", "mdiIcons.js");
// Icon-infrastructure files: they reference `mdi-*` tokens (the generated list,
// the "vuetify/iconsets/mdi-svg" import, placeholder comments) but are not icon
// *consumers*, so scanning them would produce false positives.
const EXCLUDED = new Set([ICONS_FILE, join(SRC_DIR, "plugins", "vuetifyIcons.js")]);
const ICON_RE = /mdi-[a-z0-9-]+/g;

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if ([".vue", ".js"].includes(extname(full))) {
      files.push(full);
    }
  }
  return files;
}

// Collect every mdi-* referenced under src/ (excluding the generated list itself).
const used = new Set();
for (const file of walk(SRC_DIR)) {
  if (EXCLUDED.has(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(ICON_RE)) used.add(match[0]);
}

// Collect the icons the generated list defines (its object keys).
const iconsSource = readFileSync(ICONS_FILE, "utf8");
const defined = new Set(
  [...iconsSource.matchAll(/"(mdi-[a-z0-9-]+)":/g)].map((m) => m[1])
);

const missing = [...used].filter((icon) => !defined.has(icon)).sort();
const unused = [...defined].filter((icon) => !used.has(icon)).sort();

if (unused.length) {
  console.warn(
    `⚠ ${unused.length} icon(s) in src/plugins/mdiIcons.js are no longer used (safe to prune):\n  ${unused.join(
      "\n  "
    )}`
  );
}

if (missing.length) {
  console.error(
    `✗ ${missing.length} icon(s) are used in src/ but missing from src/plugins/mdiIcons.js.\n` +
      `  These will silently fail to render in production. Add them, then regenerate:\n  ${missing.join(
        "\n  "
      )}`
  );
  process.exit(1);
}

console.log(
  `✓ icons OK — all ${used.size} mdi-* icons used in src/ are defined in mdiIcons.js.`
);
