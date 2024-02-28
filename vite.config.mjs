import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default {
  server: {
    proxy: {
      "/api": {
        target: "https://dog.ceo/api/",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    vue(),
    vuetify(),
    ],
  resolve: {

  },
  build: { chunkSizeWarningLimit: 1600, }
}