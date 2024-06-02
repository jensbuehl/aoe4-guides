import { fileURLToPath, URL } from "url";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { nodePolyfills } from "vite-plugin-node-polyfills";

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
    nodePolyfills(),
    vue({
      template: {
        compilerOptions: {
          //
          isCustomElement: (tag) => ["v-list-item-content"].includes(tag),
        },
      },
    }),
    vuetify(),
  ],
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: { chunkSizeWarningLimit: 1600 },
};
