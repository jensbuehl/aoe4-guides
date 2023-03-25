import { createApp } from 'vue'
import App from './App.vue'
import { createVuetify } from 'vuetify'
import router from './router/'

// global styles and icons
import './assets/main.css'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/dist/vuetify.min.css'

// import store
import store from './store'

// theme definition
const customDarkTheme = {
  dark: true,
  colors: {
    primary: '#cca741',
    secondary: '#174087',
  }
}

// init app
const vuetify = createVuetify({
  components: {
  },
  theme: {
    options: {
      customProperties: true
    },
    defaultTheme: 'customDarkTheme',
    themes: {
      customDarkTheme
    }
  }
})
createApp(App).use(vuetify).use(router).use(store).mount('#app');
