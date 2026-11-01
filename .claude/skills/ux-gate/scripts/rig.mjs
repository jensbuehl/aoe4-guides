// Throwaway UI rig for AoE4 Guides. Copy it into the session scratchpad next
// to a `npm i puppeteer@23` — Node resolves packages from the importing file,
// so it cannot run from here. Import the helpers into a short probe script:
//
//   import { launch, open, visible, measure, ink } from "./rig.mjs";
//   const browser = await launch();
//   const page = await open(browser, "/builds", { width: 393, theme: "dark" });
//
// Or run it directly for a quick edge/colour/radius report of one selector:
//
//   node rig.mjs builds ".fl-toolbar-btn"             (all widths, both themes)
//   node rig.mjs https://aoe4guides.com/builds ".x"   (production, for "before")
//
// Paths go without the leading slash: Git Bash rewrites an argument like
// "/builds" into "C:/Program Files/Git/builds" before node sees it.

import puppeteer from "puppeteer";

export const BASE = "http://localhost:5173";

// 360 and 393 are the plan's phones (393×851 is a Pixel 5); 960 is md's first
// pixel, where the sidebar layouts switch; 1280 is the desktop check.
export const WIDTHS = [360, 393, 960, 1280];
export const PHONE_MAX = 599;

// The bottom navigation, Play → Focus and the hidden hamburger key off the
// *platform* (Vuetify's android/ios), not the width. Without a phone user
// agent a 393px page renders the narrow desktop layout, which no phone sees.
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export const launch = () => puppeteer.launch({ headless: true });

export async function open(browser, path, { width = 1280, height = 900, theme = "light", phone = width <= PHONE_MAX, scale = 2 } = {}) {
  const page = await browser.newPage();
  if (phone) await page.setUserAgent(ANDROID_UA);
  await page.setViewport({ width, height, isMobile: phone, hasTouch: phone, deviceScaleFactor: scale });
  // useThemePreference.js reads this key before first paint
  await page.evaluateOnNewDocument((t) => localStorage.setItem("aoe4-guides-theme", t), theme);
  await page.goto(path.startsWith("http") ? path : `${BASE}/${path.replace(/^\//, "")}`, { waitUntil: "networkidle2", timeout: 60000 });
  await wait(1500); // snapshot data, fonts, lazy flags
  return page;
}

// Pages render some components twice — a phone instance and a sidebar one,
// one of them hidden by a display class — so the first match is often the
// invisible copy. Always pick from what is rendered. checkVisibility(), not
// offsetParent: offsetParent is null for every position: fixed element, so
// it reports the bottom navigation and the FAB as hidden.
export const visible = (page, selector) =>
  page.evaluateHandle((s) => [...document.querySelectorAll(s)].find((e) => e.checkVisibility()) ?? null, selector);

// Box, fill, radius and font of the first visible match, plus page overflow.
export const measure = (page, selector) =>
  page.evaluate((s) => {
    const el = [...document.querySelectorAll(s)].find((e) => e.checkVisibility());
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height,
      bg: cs.backgroundColor, radius: cs.borderTopLeftRadius, font: `${cs.fontSize} ${cs.fontWeight}`,
      color: cs.color,
      // Meaningful on a text element (a clamped name, a truncated label). On a
      // control it is usually the 44px hit area's ::before overhang instead.
      clipped: el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1,
      pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  }, selector);

// The drawn extent of an icon's glyph, not its 24px box: mdi glyphs carry
// side bearings (▾ has ~7px each side), so "the arrow is on the edge" has to
// be measured from the path.
export const ink = (page, selector) =>
  page.evaluate((s) => {
    const host = [...document.querySelectorAll(s)].find((e) => e.checkVisibility());
    const path = host?.querySelector("path");
    if (!path) return null;
    const b = path.getBBox(), m = path.getScreenCTM();
    return { left: m.a * b.x + m.e, right: m.a * (b.x + b.width) + m.e, top: m.d * b.y + m.f, bottom: m.d * (b.y + b.height) + m.f };
  }, selector);

// Direct use: a report of one selector at every width in both themes.
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/").replace(/^\//, "")}`) {
  const [path = "/", selector = "body"] = process.argv.slice(2);
  const browser = await launch();
  for (const theme of ["light", "dark"]) {
    for (const width of WIDTHS) {
      const page = await open(browser, path, { width, theme });
      console.log(theme, width, JSON.stringify(await measure(page, selector)));
      await page.close();
    }
  }
  await browser.close();
}
