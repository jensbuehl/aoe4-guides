import { createApp } from "vue";
import App from "./App.vue";
import { createVuetify } from "vuetify";
import router from "./router/";

// global styles and icons
import "./assets/main.css";
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/dist/vuetify.min.css";

// import store
import store from "./store";

// theme definition
const customDarkTheme = {
  dark: true,
  colors: {
    accent: "#e7c05e",
    anchor: "#e7c05e",
    background: '#1D2432',
    surface: "#324156",
    "surface-variant": "#3D516B", //tooltips
    primary: "#e7c05e",
    "primary-darken-1": "#8D7B4B",
    secondary: "#294790",
    "secondary-darken-1": "#3D516B",
    //success: '#e7c05e',
    //warning: '#e7c05e',
    //error: '#e7c05e',
    info: "#e7c05e",
  },
};

const customLightTheme = {
  dark: false,
  colors: {
    accent: "#e7c05e",
    anchor: "#e7c05e",
    background: '#BEC5CD',
    surface: "#A4ADB9",
    "surface-variant": "#cca741", //tooltips
    primary: "#294790",
    "primary-darken-1": "#3D516B",
    secondary: "#e7c05e",
    "secondary-darken-1": "#8D7B4B",
    //success: '#e7c05e',
    //warning: '#e7c05e',
    //error: '#e7c05e',
    info: "#e7c05e",
  },
};

// init app
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
