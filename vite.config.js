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
      },
      manifest: {
        name: "Age of Empires IV Build Orders | AOE4 GUIDES",
        short_name: "AOE4 GUIDES",
        description: "Create and share build orders for Age of Empires IV. Export and use any build order with the Overlay Tool for AoE4.",
        theme_color: "#e7c05e",
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
    }),
  ],
  resolve: {},
  build: { chunkSizeWarningLimit: 1600 },
};
