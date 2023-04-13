import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default {
  plugins: [
    vue(),
    vuetify(),
  ],
  resolve: {
    //ignore sanitize-html dependencies
    alias: {
      path: "",
      url: "",
      fs: "",
      'source-map-js': "",
    },
  },
  build: { chunkSizeWarningLimit: 1600, }
}