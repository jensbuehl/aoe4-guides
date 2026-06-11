import { createApp } from "vue";
import App from "@/App.vue";
import { createVuetify } from "vuetify";
import router from "@/router/";

// global styles and icons
import "@/assets/main.css";
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/dist/vuetify.min.css";

// import store
import store from "@/store";

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
    "surface-container": "#1D2432", //nested card surfaces (step cards, inset panels)
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
    accent: "#CCAA55",
    loading: "D8DCE0",
    anchor: "#CCAA55",
    background: '#D8DCE0',
    surface: "#FAFAFA", //footer and header
    "surface-variant": "#CCAA55", //tooltips
    primary: "#294790",
    "primary-darken-1": "#3D516B",
    secondary: "#CCAA55",
    "secondary-darken-1": "#8D7B4B",
    "surface-container": "#F0F2F5", //nested card surfaces — light blue-grey, echoes navy palette
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
