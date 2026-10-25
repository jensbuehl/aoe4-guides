// Renders the social preview cards (og:image, 1200×630): the site-wide card,
// public/og-image.png, and one per civ, public/assets/og/civ/<slug>.jpg.
//
// Run by hand, never on a deploy. It is not part of the build, and it is the
// one script here that may import from src/ and use a browser, because it runs
// on a developer's machine only (see CLAUDE.md on what runs on Netlify).
// Re-run it when a civ is added, renamed or gets a new flag, and commit the
// images; scripts/prerender.mjs points each page at its card if the file is
// there and falls back to the site card if it is not.
//
// Puppeteer is not a dependency of this project. It is resolved from the
// directory the script is started in, so install it somewhere throwaway:
//
//   cd <scratch dir> && npm i puppeteer
//   node <repo>/scripts/og-images.mjs            (every card)
//   node <repo>/scripts/og-images.mjs VIK SCO    (some civs; "site" for the site card)
//
// Cards are drawn as HTML so they use the real web font (EB Garamond, from
// @fontsource) and the same colours as the app, and screenshot at exactly
// 1200×630. Colours are the dark theme's (src/main.js) plus the existing
// card's background; keep them in step with the site, not with each other.

import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_SITE = join(ROOT, "public", "og-image.png");
const OUT_CIV = join(ROOT, "public", "assets", "og", "civ");

const { civs } = await import(pathToFileURL(join(ROOT, "src/composables/filter/civDefaultProvider.js")).href);

let puppeteer;
try {
  const require = createRequire(join(process.cwd(), "noop.js"));
  puppeteer = (await import(pathToFileURL(require.resolve("puppeteer")).href)).default;
} catch {
  console.error("og-images: puppeteer not found from the current directory. Run `npm i puppeteer` in a scratch folder and start this from there.");
  process.exit(1);
}

const file = (path) => pathToFileURL(join(ROOT, path)).href;
const FONT = file("node_modules/@fontsource/eb-garamond/files/eb-garamond-latin-600-normal.woff2");
const TILE = file("public/android-chrome-512x512.png");

const COLORS = { background: "#161a25", gold: "#e7c05e", text: "#ffffff", muted: "rgba(255, 255, 255, 0.62)" };

const escapeHtml = (text) =>
  String(text ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const page = (body) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: "EB Garamond"; font-weight: 600; src: url("${FONT}") format("woff2"); }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: ${COLORS.background}; }
  body { position: relative; font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif; color: ${COLORS.text}; }
  .bar { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: ${COLORS.gold}; }
  .wordmark { font-family: "EB Garamond", serif; font-weight: 600; color: ${COLORS.gold}; text-transform: uppercase; }
  .text { position: absolute; top: 0; bottom: 10px; display: flex; flex-direction: column; justify-content: center; }
</style></head><body>${body}<div class="bar"></div></body></html>`;

// The home banner's wash, navy behind the media and gold at the top right,
// stronger here because the card's background is darker. Without it a dark
// flag (Vikings, Abbasid) disappears into the background, and a frame was
// tried on the banner and dropped. Shared by every card, so they read as one
// family.
const WASH = `<div style="position:absolute;inset:0;background:radial-gradient(60% 85% at 24% 50%, rgba(41,71,144,0.42), transparent 70%),radial-gradient(55% 70% at 100% 0%, rgba(185,150,47,0.16), transparent 65%)"></div>`;
/** The site-wide card: the same composition as before, in the wordmark's face. */
const siteCard = () =>
  page(`
  ${WASH}
  <img src="${TILE}" style="position:absolute;left:96px;top:180px;width:260px;height:260px;border-radius:24px">
  <div class="text" style="left:418px;right:60px">
    <div class="wordmark" style="font-size:66px;letter-spacing:3px;line-height:1">AOE4 Guides</div>
    <div style="font-size:38px;line-height:1.3;margin-top:22px">Age of Empires IV<br>Build Orders</div>
    <div style="font-size:26px;color:${COLORS.muted};margin-top:22px">Create, share and follow builds in game</div>
  </div>`);

/**
 * A civ's card: its flag where the site card has the tile, and its name large.
 * Straight, not tilted: the banner fans two flags, which is what its tilt is
 * for; one flag tilted only looked arbitrary, and straight it lines up with the
 * text and with the site card. The flag's own waving render is the movement.
 */
const civCard = (civ) => {
  const flag = file(`public${civ.flagLarge.replace(/\?.*$/, "")}`);
  return page(`
  ${WASH}
  <img src="${flag}" style="position:absolute;left:78px;top:186px;width:440px;height:248px;object-fit:cover;border-radius:14px;box-shadow:0 22px 48px rgba(0,0,0,0.5)">
  <div class="text" style="left:590px;right:64px">
    <div style="display:flex;align-items:center;gap:14px">
      <img src="${TILE}" style="width:40px;height:40px;border-radius:6px">
      <span class="wordmark" style="font-size:26px;letter-spacing:2px">AOE4 Guides</span>
    </div>
    <div id="name" class="wordmark" style="text-transform:none;font-size:84px;line-height:1.05;margin-top:30px;white-space:nowrap">${escapeHtml(civ.title)}</div>
    <div style="font-size:40px;line-height:1.2;margin-top:8px">Build Orders</div>
    ${civ.tagLine ? `<div id="tag" style="font-size:26px;color:${COLORS.muted};margin-top:20px;white-space:nowrap">${escapeHtml(civ.tagLine.split(",").map((s) => s.trim()).join(" · "))}</div>` : ""}
  </div>`);
};

const wanted = process.argv.slice(2).map((arg) => arg.toUpperCase());
const all = wanted.length === 0;
const pages = civs.value.filter((civ) => civ.slug && (all || wanted.includes(civ.shortName)));

const browser = await puppeteer.launch();
const scratch = mkdtempSync(join(tmpdir(), "og-images-"));
try {
  const tab = await browser.newPage();
  await tab.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

  // JPEG for the civ cards: the flags are photographic, and as PNG each card was
  // ~280 KB. The site card is flat colour and stays a small PNG.
  const render = async (html, out) => {
    const htmlFile = join(scratch, "card.html");
    writeFileSync(htmlFile, html, "utf8");
    await tab.goto(pathToFileURL(htmlFile).href, { waitUntil: "load" });
    await tab.evaluate(() => document.fonts.ready);
    const fontOk = await tab.evaluate(() => document.fonts.check('600 40px "EB Garamond"'));
    if (!fontOk) throw new Error("EB Garamond did not load; the card would be set in a fallback face.");
    // A long name or tagline shrinks to fit its column on one line rather than
    // wrapping, which would push the block off centre.
    await tab.evaluate(() => {
      const fit = (id, size, min) => {
        const el = document.getElementById(id);
        if (!el) return;
        while (el.scrollWidth > el.parentElement.clientWidth && size > min) el.style.fontSize = `${(size -= 1)}px`;
      };
      fit("name", 84, 44);
      fit("tag", 26, 18);
    });
    mkdirSync(dirname(out), { recursive: true });
    const jpeg = out.endsWith(".jpg");
    await tab.screenshot({
      path: out,
      type: jpeg ? "jpeg" : "png",
      ...(jpeg ? { quality: 86 } : {}),
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });
    console.log(`og-images: ${out.slice(ROOT.length + 1).replaceAll("\\", "/")}`);
  };

  if (all || wanted.includes("SITE")) await render(siteCard(), OUT_SITE);
  for (const civ of pages) await render(civCard(civ), join(OUT_CIV, `${civ.slug}.jpg`));
} finally {
  await browser.close();
  rmSync(scratch, { recursive: true, force: true });
}
