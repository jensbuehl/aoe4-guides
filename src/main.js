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
    anchor: '#cca741',
    secondary: '#cca741',
    accent: '#cca741',
    error: '#cca741',
    info: '#cca741',
    success: '#cca741',
    warning: '#cca741',
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
