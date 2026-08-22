<!--
  Vertical rhythm, so the sections do not drift apart again. Three steps and
  no others: mt-4 on the first element after any heading, mt-6 on every later
  element in the same section, mt-8 on a sub-heading, and my-8 on the dividers
  between sections.

  The dividers were never the inconsistency - all six have always been my-8.
  What varied was the gap the last element of a section left in front of one,
  and that reads as uneven divider spacing even though the divider is not what
  changed.
-->
<template>
  <v-container>
    <div class="d-flex justify-center">
      <v-card flat class="py-6 px-10" rounded="lg" width="1024px" fluid>
        <h1>Brand assets</h1>
        <p class="mt-4 text-body-1">
          The marks, the wordmark and the colour tokens, in one place. This page exists for one
          reason: the API's
          <a class="text-primary" :href="apiDocsUrl" target="_blank" rel="noopener">fair use note</a>
          asks anyone building on the data to credit AoE4 Guides and link back, and that ask is
          worth little without saying what to link with.
        </p>

        <v-divider class="my-8" />

        <h2>Credit and link back</h2>
        <p class="mt-4">
          Naming the source is the minimum; the link is what actually sends a reader back to the
          people who wrote the build order. Any of these is fine, placed near the data rather than
          buried in a colophon:
        </p>
        <div class="mt-6">
          <div v-for="snippet in snippets" :key="snippet.label" class="mb-3">
            <div class="text-body-2 text-medium-emphasis mb-1">{{ snippet.label }}</div>
            <div class="d-flex align-center ga-2">
              <code class="brand-snippet flex-grow-1">{{ snippet.text }}</code>
              <v-btn
                :icon="copiedLabel === snippet.label ? 'mdi-check' : 'mdi-content-copy'"
                :color="copiedLabel === snippet.label ? 'accent' : undefined"
                variant="text"
                size="small"
                :aria-label="'Copy the ' + snippet.label + ' snippet'"
                @click="copy(snippet)"
              />
            </div>
          </div>
        </div>
        <p class="mt-6 text-body-2 text-medium-emphasis">
          The build orders themselves belong to the community members who wrote them, not to the
          site. Crediting AoE4 Guides is not a substitute for keeping an author's name on their
          build wherever you show one.
        </p>

        <v-divider class="my-8" />

        <h2>App icon</h2>
        <p class="mt-4">
          One mark — the monogram on the brand navy — shipped at the sizes browsers and platforms
          ask for. If you are placing it yourself, take the 512 and let your own layout scale it
          down. The icon already carries its own background, so it needs no plate behind it.
        </p>
        <div class="d-flex flex-wrap ga-8 mt-6">
          <div v-for="mark in marks" :key="mark.href" class="brand-mark d-flex flex-column">
            <div class="brand-mark-media d-flex align-end">
              <img
                :src="mark.href"
                :alt="mark.alt"
                :width="mark.renderWidth"
                :height="mark.renderHeight"
              />
            </div>
            <div class="text-body-2 font-weight-medium mt-3">{{ mark.label }}</div>
            <div v-if="mark.note" class="text-body-2 text-medium-emphasis">{{ mark.note }}</div>
            <a class="text-primary text-body-2 mt-auto pt-2" :href="mark.href" :download="mark.download">
              Download
            </a>
          </div>
        </div>
        <p class="mt-6 text-body-2 text-medium-emphasis">
          The two 512s are not the same file and are not interchangeable. The standard one is a
          rounded tile whose corners are transparent, so it sits correctly wherever a square icon
          is drawn as-is. The maskable one is full-bleed with the monogram pulled into the middle,
          because Android crops it to whatever shape the launcher uses — circle, squircle, teardrop
          — and anything near the edge is cut off. Use the maskable file only where a manifest asks
          for <code>purpose: maskable</code>; anywhere else it just looks like the logo shrank.
        </p>

        <v-divider class="my-8" />

        <h2>Wordmark</h2>
        <p class="mt-4">
          There is no lockup image to hand out, because the site does not use one — the wordmark in
          the header is live text, and this is its specification. Set it in
          <strong>{{ wordmark.font }}</strong>, uppercase, {{ wordmark.tracking }} letter-spacing,
          in the theme's <code>primary</code>. Anything close in a humanist sans will look right;
          the tracking matters more than the face.
        </p>
        <v-card variant="outlined" rounded="lg" class="mt-6 pa-6">
          <div class="brand-wordmark" :style="{ color: currentColors.primary }">
            {{ wordmark.title }}
          </div>
          <div class="brand-wordmark-sub" :style="{ color: currentColors.primary }">
            {{ wordmark.subtitle }}
          </div>
        </v-card>

        <v-divider class="my-8" />

        <h2>Colours</h2>
        <p class="mt-4">
          Four colours carry the brand. Everything else in the theme is joinery — the token list
          further down is there if you are working on the site itself, but if you are putting AoE4
          Guides on something of your own, these are the ones that mean anything.
        </p>

        <v-row class="mt-6">
          <v-col v-for="colour in brandColours" :key="colour.name" cols="12" sm="6" md="3">
            <v-card variant="outlined" rounded="lg" class="h-100">
              <div class="brand-colour-chip" :style="{ backgroundColor: colour.hex }" />
              <div class="pa-4">
                <div class="text-subtitle-1 font-weight-medium">{{ colour.name }}</div>
                <code>{{ colour.hex }}</code>
                <div
                  v-for="shade in colour.shades"
                  :key="shade.label"
                  class="mt-2 d-flex align-center ga-2"
                >
                  <div
                    class="brand-swatch brand-swatch--sm"
                    :style="{ backgroundColor: shade.hex }"
                  />
                  <div>
                    <code>{{ shade.hex }}</code>
                    <div class="text-caption text-medium-emphasis">{{ shade.label }}</div>
                  </div>
                </div>
                <div class="text-body-2 text-medium-emphasis mt-3">{{ colour.note }}</div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <p class="mt-6 text-body-2 text-medium-emphasis">
          Gold on the dark ground is the pairing people recognise; if you can only use one, use
          that. The gold is a fill and a highlight, never body text on a light ground — at
          {{ goldOnLightRatio }}:1 against white it fails every legibility threshold there is,
          which is why the light theme sets its text in the navy instead.
        </p>

        <h3 class="text-h6 mt-8">The rest of the palette</h3>
        <p class="mt-4 text-body-2 text-medium-emphasis">
          Read live from the running theme rather than copied here, so it cannot drift out of step
          with the app the way a hand-maintained list would. Status and skeleton colours are left
          out — this is reference for working on the site, not part of the brand.
        </p>
        <v-alert
          type="info"
          variant="tonal"
          icon="mdi-information-outline"
          class="mt-6"
          density="comfortable"
        >
          Several tokens change meaning between the two themes, which is exactly why they exist
          separately. <code>accent</code> is gold on dark and navy on light; <code>age</code> and
          <code>alternative</code> exist so the age-up phase and the alternatives phase stay
          distinguishable in both. Two tokens sharing a value in one theme are not necessarily the
          same thing — check both before treating either as an alias for the other.
        </v-alert>

        <v-expansion-panels variant="accordion" multiple class="mt-6">
          <v-expansion-panel
            v-for="palette in palettes"
            :key="palette.name"
            :value="palette.name"
            :elevation="0"
          >
          <v-expansion-panel-title>{{ palette.name }}</v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-table density="compact" class="brand-table">
              <thead>
                <tr>
                  <th style="width: 56px"></th>
                  <th>Token</th>
                  <th>Hex</th>
                  <th class="hidden-sm-and-down">Role</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="token in palette.tokens" :key="token.name">
                  <td>
                    <div class="brand-swatch" :style="{ backgroundColor: token.css }" />
                  </td>
                  <td>
                    <code>{{ token.name }}</code>
                  </td>
                  <td>
                    <code>{{ token.hex }}</code>
                  </td>
                  <td class="text-body-2 text-medium-emphasis hidden-sm-and-down">
                    {{ token.role }}
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <v-divider class="my-8" />

        <h2>Game assets are not ours</h2>
        <v-alert
          type="warning"
          variant="tonal"
          icon="mdi-alert-circle-outline"
          class="mt-4"
          density="comfortable"
        >
          The civilization flags and the unit, building and resource icons this site renders are Age
          of Empires IV assets owned by Microsoft, used under the
          <a class="text-primary" :href="gameContentRulesUrl" target="_blank" rel="noopener"
            >Game Content Usage Rules</a
          >. Nothing on this page covers them: they are not ours to license, there are no downloads
          for them here, and their location on this site is not an invitation to hotlink them. If
          you need Age of Empires IV artwork, your permission comes from those rules directly, and
          the files should come from your own copy of them.
        </v-alert>
        <v-divider class="my-8" />

        <h2>Questions</h2>
        <p class="mt-4">
          If you are building something and none of the above fits — a print piece, a video overlay,
          a shirt for your clan — just ask. Discord and email are on the
          <router-link class="text-primary" to="/about">about page</router-link>.
        </p>
      </v-card>
    </div>
  </v-container>
</template>

<script>
//External
import { computed, ref } from "vue";
import { useTheme } from "vuetify";

//Composables
import useCopyToClipboard from "@/composables/converter/useCopyToClipboard";

const SITE_ORIGIN = "https://aoe4guides.com";

const apiDocsUrl = SITE_ORIGIN + "/api/api-docs/";
const gameContentRulesUrl = "https://www.xbox.com/en-us/developers/rules";

// Mirrors Header.vue's wordmark - its title/subtitle refs and its .title and
// .subtitle rules. Restated rather than imported on purpose: this is
// documentation *of* the mark, so if the header ever changes, this page should
// be updated as a deliberate act rather than silently following it.
const wordmark = {
  title: "AOE4 GUIDES",
  subtitle: "Age of Empires IV Build Orders",
  font: "Segoe UI",
  tracking: "2px",
};

// Every file here is already in public/ and already served to every visitor;
// the download attribute only saves a right-click.
//
// `width`/`height` are each file's real pixel size and `renderWidth` is how
// wide it is shown; the displayed height is derived from those rather than set
// by hand, so a non-square file could never be squashed into a square box.
//
// No plate or chequerboard behind these. Every one of them carries its own
// navy ground, and the only transparency any of them has is the four rounded
// corners of the standard tile - a detail, not a feature, and not worth a
// chequerboard whose only visible effect is to put a second border around an
// icon that already looks like it has one.
//
// Deliberately absent: og-image.png, which is a social preview card the site
// generates for itself rather than a mark; and apple-touch-icon.png, which is
// the same artwork at a size that exists only to satisfy iOS. Listing every
// file in public/ would make the page an inventory - it is meant to answer
// "what do I put on my page", and for that the 512 is the answer.
const marks = [
  {
    label: "512×512 PNG",
    note: "Rounded tile. The default.",
    href: "/android-chrome-512x512.png",
    download: "aoe4guides-icon-512.png",
    alt: "AoE4 Guides app icon at 512 pixels",
    width: 512,
    height: 512,
    renderWidth: 128,
  },
  {
    label: "512×512 PNG",
    note: "Maskable. Android launchers only.",
    href: "/maskable-icon-512x512.png",
    download: "aoe4guides-icon-maskable-512.png",
    alt: "AoE4 Guides maskable app icon at 512 pixels",
    width: 512,
    height: 512,
    renderWidth: 128,
  },
  {
    label: "192×192 PNG",
    note: "Rounded tile.",
    href: "/android-chrome-192x192.png",
    download: "aoe4guides-icon-192.png",
    alt: "AoE4 Guides app icon at 192 pixels",
    width: 192,
    height: 192,
    renderWidth: 96,
  },
  {
    label: "32×32 PNG",
    note: "Favicon.",
    href: "/favicon-32x32.png",
    download: "aoe4guides-icon-32.png",
    alt: "AoE4 Guides favicon at 32 pixels",
    width: 32,
    height: 32,
    renderWidth: 32,
  },
  {
    label: "Monochrome SVG",
    note: "Safari pinned tab silhouette.",
    href: "/safari-pinned-tab.svg",
    download: "aoe4guides-icon-mono.svg",
    alt: "AoE4 Guides monochrome silhouette mark",
    width: 512,
    height: 512,
    renderWidth: 32,
  },
].map((mark) => ({
  ...mark,
  renderHeight: Math.round((mark.renderWidth * mark.height) / mark.width),
}));

const snippets = [
  { label: "Plain text", text: "Build orders from AoE4 Guides — https://aoe4guides.com" },
  { label: "HTML", text: '<a href="https://aoe4guides.com">Build orders from AoE4 Guides</a>' },
  { label: "Markdown", text: "Build orders from [AoE4 Guides](https://aoe4guides.com)" },
];

// What each token is *for*. The argument for why they are split this way lives
// in main.js; this is the short form for someone reading the palette rather
// than the theme definition. A token absent from this map still renders - see
// buildPalette - so a newly added one shows up undocumented rather than
// silently missing.
const TOKEN_ROLES = {
  primary: "Wordmark, primary buttons, emphasis.",
  accent: "Text and icon colour throughout the app. Gold on dark, navy on light.",
  background: "The page behind every card.",
  surface: "Cards, header and footer.",
  "surface-variant": "Tooltips.",
  secondary: "The second brand colour: navy on dark, gold on light.",
  "primary-darken-1": "Hover and pressed states for primary.",
  "secondary-darken-1": "Hover and pressed states for secondary.",
  alternative: "The alternatives phase of a build — which way you went.",
  age: "The age-up phase of a build — fills and rails only, never its text.",
};

// Tokens the table leaves out. Two groups, hidden for the same reason - they
// are machinery, and this page documents the palette:
//
// - Status and state colours. error/success/warning are Vuetify's stock values
//   the site never chose; info and loading are the site's own but say nothing
//   about how it looks - one paints a snackbar, the other a skeleton.
// - surface-bright and surface-light arrive from the default theme Vuetify
//   merges under every custom one, still at its stock values.
// - The icon-background pair. They are the site's own and they are used, but
//   they colour the plate behind a build-order step icon - internal furniture
//   nobody reproducing the brand has any use for.
//
// This is an explicit list rather than a heuristic so the drift guard in
// buildPalette keeps working: a token added to main.js and not named here
// still appears, undocumented, rather than silently vanishing.
const HIDDEN_TOKENS = [
  "surface-bright",
  "surface-light",
  "info",
  "loading",
  "error",
  "success",
  "warning",
  "icon-background",
  "icon-background-highlight",
];

// The four colours that actually carry the brand, each read live out of the
// theme rather than restated, so they cannot drift from main.js.
//
// Which token to read is not obvious and is the point of the `token` field:
// the brand gold is `primary` on the dark theme but `secondary` on the light
// one, and the brand navy is the reverse. Reading either from `accent` - the
// token that sounds like it means "the brand colour" - would give gold in one
// theme and navy in the other. See the notes in main.js for why accent flips.
//
// `shades` carry a label rather than just a swatch because the two colours'
// extra values are not the same kind of thing: the gold's second value is the
// *other theme's* gold, while both darken-1s are an interaction state. Shown
// as bare swatches they would read as one series, which is what a brand page
// must not do - someone would pick the hover colour as a second brand colour.
const BRAND_COLOURS = [
  {
    name: "Gold",
    theme: "customDarkTheme",
    token: "primary",
    shades: [
      { label: "Light theme, fills only", theme: "customLightTheme", token: "secondary" },
      { label: "Hover, pressed", theme: "customDarkTheme", token: "primary-darken-1" },
    ],
    note: "The signature colour. The wordmark, highlights, and anything that should read as ours. The light theme runs the same gold about 12% darker and uses it only as a fill — tooltips, the age lane — because gold type on a light ground fails contrast.",
  },
  {
    name: "Navy",
    theme: "customLightTheme",
    token: "primary",
    shades: [{ label: "Hover, pressed", theme: "customLightTheme", token: "primary-darken-1" }],
    note: "The counterweight, and the light theme's text colour. Unlike the gold it does not change between themes.",
  },
  {
    name: "Surface (dark theme)",
    theme: "customDarkTheme",
    token: "surface",
    note: "Cards, header and footer on the dark theme, and the ground the gold is meant to sit against.",
  },
  {
    name: "Surface (light theme)",
    theme: "customLightTheme",
    token: "surface",
    note: "The same on the light theme, where the navy rather than the gold carries the text.",
  },
];

// Brand colours first, then structure, then the build-order lanes. Anything
// in the theme that is neither listed here nor in HIDDEN_TOKENS is appended
// alphabetically, so a token added to main.js shows up undocumented rather
// than silently missing.
const TOKEN_ORDER = [
  "primary",
  "accent",
  "secondary",
  "primary-darken-1",
  "secondary-darken-1",
  "background",
  "surface",
  "surface-variant",
  "alternative",
  "age",
];

/**
 * Normalises a raw theme value to `#rrggbb`, tolerating a missing leading `#`
 * exactly as Vuetify's own parseColor does — it slices the hash off when
 * present and parses the rest either way, so a bare six-digit hex is a valid
 * token value and must not be reported here as a broken one. Anything that is
 * not a hex colour returns null and the table says so rather than rendering a
 * swatch it cannot honestly fill.
 *
 * @param {string} value - A raw token value from the theme.
 * @returns {string|null} Six-digit `#rrggbb`, or null if it is not a hex colour.
 */
function toHex(value) {
  if (typeof value !== "string") return null;
  const body = value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(body)) {
    return ("#" + body.split("").map((c) => c + c).join("")).toLowerCase();
  }
  if (/^[0-9a-f]{6}$/i.test(body)) return ("#" + body).toLowerCase();
  return null;
}

/**
 * WCAG 2.1 relative luminance.
 *
 * @param {string} hex - A `#rrggbb` colour.
 * @returns {number} Luminance in 0..1.
 */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio between two colours, order-independent.
 *
 * @param {string} a - A `#rrggbb` colour.
 * @param {string} b - A `#rrggbb` colour.
 * @returns {number} Ratio from 1 to 21.
 */
function contrast(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Turns one theme's colour map into the rows the table renders.
 *
 * @param {Record<string, string>} colors - A Vuetify theme's `colors` map.
 * @returns {Array<object>} One row per token, ordered by TOKEN_ORDER.
 */
function buildPalette(colors) {
  // `on-*` counterparts are derived from their base colour rather than
  // designed, so they are not part of the palette this page documents. Most
  // are added later, on computedThemes, but `on-surface-variant` ships in
  // Vuetify's defaults and so is already here.
  const names = Object.keys(colors).filter(
    (name) => !name.startsWith("on-") && !HIDDEN_TOKENS.includes(name)
  );
  const ordered = [
    ...TOKEN_ORDER.filter((name) => names.includes(name)),
    ...names.filter((name) => !TOKEN_ORDER.includes(name)).sort(),
  ];
  return ordered.map((name) => {
    const hex = toHex(colors[name]);
    return {
      name,
      // Falling back to the raw value rather than hiding it: if a token ever
      // holds something that is not a colour, the Hex column showing that
      // string beside an empty swatch is the only thing on the page that would
      // say so.
      hex: hex ?? colors[name],
      css: hex ?? "transparent",
      role: TOKEN_ROLES[name] ?? "",
    };
  });
}

export default {
  name: "Brand",
  setup() {
    window.scrollTo(0, 0);

    const theme = useTheme();
    const { copyToClipboard } = useCopyToClipboard();
    const copiedLabel = ref(null);

    const palettes = computed(() => [
      {
        name: "Dark theme (the default)",
        tokens: buildPalette(theme.themes.value.customDarkTheme.colors),
      },
      {
        name: "Light theme",
        tokens: buildPalette(theme.themes.value.customLightTheme.colors),
      },
    ]);

    const read = (themeName, token) => toHex(theme.themes.value[themeName].colors[token]);

    const brandColours = computed(() =>
      BRAND_COLOURS.map((colour) => ({
        name: colour.name,
        note: colour.note,
        hex: read(colour.theme, colour.token),
        shades: (colour.shades ?? []).map((shade) => ({
          label: shade.label,
          hex: read(shade.theme, shade.token),
        })),
      }))
    );

    // Stated rather than asserted: the claim that the gold cannot be text on a
    // light ground is the one rule on this page most likely to be ignored, and
    // a measured number argues better than an instruction.
    const goldOnLightRatio = computed(() => {
      const light = theme.themes.value.customLightTheme.colors;
      const gold = toHex(light.secondary);
      const paper = toHex(light.surface);
      return gold && paper ? contrast(gold, paper).toFixed(1) : null;
    });

    // The wordmark preview follows whichever theme the visitor is in, so it
    // shows the colour they would actually get rather than a fixed one.
    const currentColors = computed(() => theme.current.value.colors);

    const copy = async (snippet) => {
      const ok = await copyToClipboard(snippet.text);
      if (!ok) return;
      copiedLabel.value = snippet.label;
      setTimeout(() => {
        if (copiedLabel.value === snippet.label) copiedLabel.value = null;
      }, 2000);
    };

    return {
      apiDocsUrl,
      gameContentRulesUrl,
      wordmark,
      marks,
      snippets,
      palettes,
      brandColours,
      goldOnLightRatio,
      currentColors,
      copiedLabel,
      copy,
    };
  },
};
</script>

<style scoped>
/* Fixed, not max-width: the columns have to be equal, and a caption must never
   be what sets one. When the width came from the caption, anything box-like
   inside - a frame, a plate - stretched with it and put a square icon in a
   wide rectangle. */
.brand-mark {
  width: 160px;
}

/* The marks are shown at their relative sizes, so each column would otherwise
   be as tall as its own icon and the row would step down like a staircase -
   captions starting at five different heights. A box the height of the tallest
   mark, with the images sitting on its floor, puts every icon on one baseline
   and therefore starts every caption on the same line. Keep in step with the
   largest renderWidth in `marks`. */
.brand-mark-media {
  height: 128px;
}

.brand-swatch {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgb(var(--v-theme-icon-background));
}

.brand-swatch--sm {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

/* The bottom edge is load-bearing, not decoration: the light theme's surface
   is #fafafa on a card that is very nearly the same white, so without a line
   the swatch reads as empty space rather than as the colour it is showing.
   Any swatch that can be near the card colour needs an edge. */
.brand-colour-chip {
  height: 88px;
  border-bottom: 1px solid rgb(var(--v-theme-icon-background));
}

.brand-snippet {
  padding: 8px 12px;
  border-radius: 6px;
  /* `background`, not `surface`: this block sits on a surface card, so it has
     to recede from it rather than match it. */
  background: rgb(var(--v-theme-background));
  border: 1px solid rgb(var(--v-theme-icon-background));
  font-size: 0.85rem;
  overflow-x: auto;
  white-space: nowrap;
}

.brand-table :deep(code) {
  font-size: 0.85rem;
}

/* The same three declarations as Header.vue's .title and .subtitle. Copied
   rather than shared for the reason given on the `wordmark` object above. */
.brand-wordmark {
  font-size: 1.5rem;
  font-family: "Segoe UI";
  text-transform: uppercase;
  letter-spacing: 2px;
}

.brand-wordmark-sub {
  font-size: 0.8rem;
  font-family: "Segoe UI";
  text-transform: uppercase;
}
</style>
