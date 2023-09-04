import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default {
  plugins: [
    vue(),
    vuetify(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        cleanupOutdatedCaches: false,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}']
      }
    }),
  ],
  resolve: {},
  manaifest: {
    name: "Test",
    short_name: "Test_Short",
    description: "Description",
    theme_color: "#ff0000",
    background_color: "#000000",
    display: "standalone",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  build: { chunkSizeWarningLimit: 1600 },
};
