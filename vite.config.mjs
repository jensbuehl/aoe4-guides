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
      // sanitize-html → postcss → source-map-js tries to use Node-only APIs in
      // the browser; stub it out so Vite stops warning about externalisation.
      "source-map-js": fileURLToPath(new URL("./src/stubs/source-map-js.js", import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Split the big, always-loaded vendors into their own long-lived
        // chunks so they cache independently of app code. Everything else
        // (route-specific deps like jszip/easy-speech) keeps Rollup's default
        // per-route splitting, so it stays in the lazy chunk that uses it.
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("/firebase/") || id.includes("/@firebase/")) return "firebase";
            if (id.includes("/vuetify/")) return "vuetify";
          }
        },
      },
    },
  },
};
