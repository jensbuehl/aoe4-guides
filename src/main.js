import { createApp } from "vue";
import App from "@/App.vue";
import { createVuetify } from "vuetify";
import router from "@/router/";

// global styles and icons
import "@/assets/main.css";
import "vuetify/dist/vuetify.min.css";
// The wordmark's face, served from our own origin. Latin at the one weight the
// header title uses; nothing else on the site is set in it.
import "@fontsource/eb-garamond/latin-600.css";

// import store
import store from "@/store";

// Tree-shaken SVG icons (replaces the full @mdi/font webfont)
import { iconOptions } from "@/plugins/vuetifyIcons";

// Kick off the signed-in user's avatar download before anything is mounted,
// so it is in the browser cache by the time the header asks for it.
import { preloadCachedAvatar } from "@/composables/auth/avatarCache";
preloadCachedAvatar();

// theme definition
const customDarkTheme = {
  dark: true,
  colors: {
    accent: "#e7c05e",
    //Skeleton placeholders. Do NOT fold this into another token: it equals
    //`surface-variant` here but `background` on the light theme, and matching
    //two *different* tokens is exactly what makes it its own. Collapsed into
    //surface-variant, light-mode skeletons would come out #E7C05E — gold, the
    //tooltip colour. Same shape of mistake as reading `age` off `accent`.
    //
    //The `#` was missing here and on the light theme's copy below until
    //22.08.2026, and nothing rendered wrong: Vuetify's parseColor does
    //`color.startsWith('#') ? color.slice(1) : color`, so a bare six-digit hex
    //resolves to the same colour with no warning. Written with the hash anyway
    //because anything reading a token as a CSS value — /brand's palette table
    //did — sees a string it cannot use.
    loading: "#3D516B",
    background: '#1D2432',
    surface: "#324156",
    "surface-variant": "#3D516B", //tooltips
    primary: "#e7c05e",
    "primary-darken-1": "#8D7B4B",
    secondary: "#294790",
    "secondary-darken-1": "#3D516B",
    //Alternatives — "gold means where you are in the build, blue means which way
    //you went". It needs its own token because `secondary` is not the same
    //colour in both themes: navy here, gold in the light palette below. Reading
    //alternatives off `secondary` would paint them gold in light mode, which is
    //the one thing that colour rule forbids.
    //
    //Lightened from the brand #294790 because that navy on this #324156 surface
    //is about 1.3:1 — invisible. This is 4.8:1.
    alternative: "#8AA9E8",
    //Ages — the other half of that same rule, and it needs its own token for the
    //mirror-image reason. `accent` is gold here but slate in the light palette
    //below, where it was changed for text contrast, so a rail read off `accent`
    //came out blue in light mode — next to `alternative`, and the age-up
    //phase and the alternatives phase became indistinguishable.
    //
    //Used for the age lane's rail and fills only, never for its text: this is
    //the "gold as a fill" half of the split, and gold text on the light surface
    //is what failed in the first place.
    age: "#e7c05e",
    //The brand gold as a *fill*, identical in both themes — the floating
    //create button, the filter dot. Exists because no other token is gold in
    //both: `primary` and `accent` are slate on the light theme, `secondary` is
    //navy on this one.
    gold: "#e7c05e",
    //Gold for *text*: author links and the like, where the dark theme writes in
    //gold. Equal to the fill here; the light theme needs a darker one to read.
    "gold-ink": "#e7c05e",
    "icon-background-highlight": "#646C79",
    "icon-background": "#4F5866",
    //success: '#e7c05e',
    //warning: '#e7c05e',
    //error: '#e7c05e',
    info: "#e7c05e",
  },
};

//Parchment, slate and gold — every value but the ground is taken from
//ageofempires.com's own stylesheets, as the dark theme's already were. The
//earlier light palette (#D8DCE0 grey, #294790 royal navy, #CCAA55 gold) shared
//none of them: AoE's blues are a desaturated slate and a petrol teal, nothing
//they ship leans violet, and their gold is #E7C067, which the dark theme's
//#e7c05e already matches. The header and bottom navigation do not use this
//theme at all — Header.vue renders them in the dark one, as the official site
//keeps its chrome dark over light content.
//
//Contrast figures are against `surface` #FBF8F1.
const customLightTheme = {
  dark: false,
  colors: {
    //Slate, not the brand gold, and deliberately identical to primary.
    //
    //Accent is what the app colours *text and icons* with — 96 components and
    //42 stylesheets read it. On the dark theme that is gold on #1D2432 and
    //reads fine. Gold text on a light surface cannot: the gold here would be
    //1.6:1 against the 4.5:1 normal text needs. Slate is 10.3:1.
    //
    //Set here rather than by rewriting the call sites: one token cannot drift,
    //where 143 hand edits would have. Gold keeps its place in light mode where
    //it is a *fill* and contrast is computed against it — tooltips
    //(surface-variant), info snackbars, `secondary`, `gold` — and as text only
    //through `gold-ink`, a darker bronze made for it.
    accent: "#2E3D55",
    //Equal to this theme's `background`, and to nothing on the dark theme —
    //see the note beside its dark counterpart for why it stays a token.
    loading: "#ECE6DA",
    //Warm stone rather than a cool grey: gold reads as gold only against
    //something with a little warmth in it. 1.17:1 to the cards on it.
    //
    //Must NOT equal the page frame outside the content column — #DDD4C2 in
    //index.html, App.vue and base.css (--vt-c-white). Set equal, the column's
    //edge disappears. The frame sits one step deeper, as #161A25 does behind
    //the dark theme's #1D2432.
    background: "#ECE6DA",
    surface: "#FBF8F1", //cards, footer
    "surface-variant": "#E7C05E", //tooltips; slate on it is 6.3:1
    //AoE's own slate (#2E3D55 on their sheet), a lighter cousin of the dark
    //theme's #1D2432 background, so the two themes share one blue.
    primary: "#2E3D55",
    //Hover and pressed: darker than primary, as a pressed state should be.
    "primary-darken-1": "#1D2432",
    secondary: "#E7C05E",
    //The dark end of AoE's gold gradient (#B8862D → #FFDF91).
    "secondary-darken-1": "#B8862D",
    //AoE's petrol blue, 6.0:1. Not the slate: with primary slate, alternatives
    //drawn in it would read as ordinary text. Still plainly blue, not gold.
    alternative: "#16668B",
    //The gold the ages keep in light mode, for rails and tints. The darker end
    //of the gradient rather than #E7C05E, because the age rail is a non-text
    //mark that has to reach 3:1 — this is 3.05:1, the fill gold only 1.6:1.
    //
    //This exists because `accent` is slate here — see the note at the top — so
    //an age rail read off `accent` would come out the same blue as
    //`alternative`, and the age-up phase and the alternatives phase would look
    //identical. Their text is still slate in this theme and has to be; the rail
    //and the fill are what tell the two phases apart.
    age: "#B8862D",
    //See the dark theme. The same gold as a fill in both themes.
    gold: "#E7C05E",
    //Bronze: the gold that passes as text here, 5.05:1. The site's own gold
    //would be 1.6:1 and its gradient's dark end 3.05:1, both under 4.5:1.
    "gold-ink": "#8A6420",
    "icon-background-highlight": "#EDE7DA",
    "icon-background": "#DDD5C4",
    //success: '#e7c05e',
    //warning: '#e7c05e',
    //error: '#e7c05e',
    info: "#E7C05E",
  },
};

// ── welcome banner ──────────────────────────────────────────────────────────
/* eslint-disable no-console */
console.log(
  "\n%c BO  AOE4 GUIDES %c",
  "font-size:22px;font-weight:900;color:#e7c05e;background:#1D2432;padding:6px 16px;border-radius:6px;border:1px solid #3D516B;",
  ""
);
console.log(
  "%c  AGE OF EMPIRES IV BUILD ORDERS",
  "font-size:12px;color:#8A99B0;letter-spacing:1.5px;"
);
console.log(
  "%c  Questions? Chat with us on Discord:  discord.gg/Nau9BN5E7J",
  "font-size:12px;color:#8A99B0;letter-spacing:1.5px;"
);
console.log(" ");
/* eslint-enable no-console */

// ── init app ─────────────────────────────────────────────────────────────────
const vuetify = createVuetify({
  components: {},
  icons: iconOptions,
  defaults: {
    // Hold tooltips back a beat so sweeping the mouse across toolbars and
    // icon rows doesn't flash a trail of them.
    //
    // And never open them on a device that cannot hover. Vuetify skips the
    // mouseenter a tap synthesises only by `sourceCapabilities.firesTouchEvents`,
    // which Safari and Firefox do not implement — so there a tap on Next in Focus
    // mode opened "Next Build Order Step" and left it over the resource strip
    // until the next tap landed somewhere else. VTooltip does not open on click,
    // so this makes them inert on touch rather than tap-toggles; anything a
    // touch user needs is written out where it is needed (StepInsertMenu, the
    // Play chooser, AlternativePathTabs). An unset openOnFocus follows
    // openOnHover, so focus stays quiet there too. Tooltips that pass their own
    // openOnHover or drive v-model (BuildListCard, the step-icon tooltip) are
    // unaffected: an explicit prop outranks a default. Read once at startup.
    VTooltip: {
      openDelay: 500,
      openOnHover:
        typeof window === "undefined" ||
        typeof window.matchMedia !== "function" ||
        window.matchMedia("(hover: hover)").matches,
    },
  },
  theme: {
    options: {
      customProperties: true,
    },
    defaultTheme: "customDarkTheme",
    themes: {
      customDarkTheme,
      customLightTheme
    },
  },
});
createApp(App).use(vuetify).use(router).use(store).mount("#app");
