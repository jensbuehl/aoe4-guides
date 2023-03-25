import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default {
  plugins: [
    vue(),
    vuetify(),
  ],
  build: { chunkSizeWarningLimit: 1600, }
}