import { createApp } from "vue";
import App from "@/App.vue";
import { createVuetify } from "vuetify";
import router from "@/router/";

// global styles and icons
import "@/assets/main.css";
import "vuetify/dist/vuetify.min.css";

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
    loading: "3D516B",
    anchor: "#e7c05e",
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
    //mirror-image reason. `accent` is gold here but navy in the light palette
    //below, where it was changed for text contrast, so a rail read off `accent`
    //came out navy in light mode — identical to `alternative`, and the age-up
    //phase and the alternatives phase became indistinguishable.
    //
    //Used for the age lane's rail and fills only, never for its text: this is
    //the "gold as a fill" half of the split, and gold text on the light surface
    //is what failed in the first place.
    age: "#e7c05e",
    "surface-container": "#324156", //nested card surfaces (step cards, inset panels)
    "icon-background-highlight": "#646C79",
    "icon-background": "#4F5866",
    //success: '#e7c05e',
    //warning: '#e7c05e',
    //error: '#e7c05e',
    info: "#e7c05e",
  },
};

const customLightTheme = {
  dark: false,
  colors: {
    //Navy, not the brand gold, and deliberately identical to primary.
    //
    //Accent is what the app colours *text and icons* with — 96 components and
    //42 stylesheets read it. On the dark theme that is gold on #1D2432 and
    //reads fine, which is why this went unnoticed: accent and primary are the
    //same gold there, so the two tokens are indistinguishable. On the light
    //theme it was #CCAA55 on a #FAFAFA surface — a contrast ratio of 2.1:1,
    //against the 4.5:1 normal text needs. Every gold label, icon and link in
    //light mode was failing it. Navy on the same surface is 8.4:1.
    //
    //Set here rather than by rewriting the call sites: one token cannot drift,
    //where 143 hand edits would have, and it leaves the accent/primary split
    //intact for whenever the light palette wants a readable gold of its own.
    //Gold keeps its place in light mode where it is a *fill* and contrast is
    //computed against it — tooltips (surface-variant), info snackbars, and the
    //secondary token — so the brand does not drain out of the theme.
    accent: "#294790",
    loading: "D8DCE0",
    //Links are text too, and were failing the same 2.1:1 as everything above.
    anchor: "#294790",
    background: '#D8DCE0',
    surface: "#FAFAFA", //footer and header
    "surface-variant": "#CCAA55", //tooltips
    primary: "#294790",
    "primary-darken-1": "#3D516B",
    secondary: "#CCAA55",
    "secondary-darken-1": "#8D7B4B",
    //The brand navy itself here: 8.4:1 on this surface. Same role as the dark
    //theme's lighter blue.
    alternative: "#294790",
    //The gold the ages keep in light mode, as a *fill*: the same #CCAA55 the
    //tooltips, info snackbars and `secondary` use, where contrast is computed
    //against it rather than for text sitting on it.
    //
    //This exists because `accent` is navy here — see the note at the top — so an
    //age rail read off `accent` came out the same navy as `alternative`, and the
    //age-up phase and the alternatives phase looked identical. Their text is
    //still navy in this theme and has to be; the rail and the fill are what tell
    //the two phases apart, which is exactly the division the light palette
    //already draws between gold and navy.
    age: "#CCAA55",
    "surface-container": "#FAFAFA", //nested card surfaces — light blue-grey, echoes navy palette
    "icon-background-highlight": "#DEDEDF",
    "icon-background": "#C5C5C6",
    //success: '#e7c05e',
    //warning: '#e7c05e',
    //error: '#e7c05e',
    info: "#CCAA55",
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
    VTooltip: {
      openDelay: 500,
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
