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
    //background: '#161925',
    surface: "#1D2432",
    "surface-variant": "#47587F", //tooltips
    primary: "#e7c05e",
    "primary-darken-1": "#cca741",
    secondary: "#e7c05e",
    "secondary-darken-1": "#cca741",
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
    //background: '#161925',
    surface: "#1D2432",
    "surface-variant": "#47587F", //tooltips
    primary: "#e7c05e",
    "primary-darken-1": "#cca741",
    secondary: "#e7c05e",
    "secondary-darken-1": "#cca741",
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
