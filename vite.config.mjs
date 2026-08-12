import { fileURLToPath, URL } from "url";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default {
  server: {
    proxy: {
      // Mirrors the /api/* rule in public/_redirects, so a dev server behaves
      // like the deployed site instead of 404ing every API call. It previously
      // pointed at https://dog.ceo/api/ — a placeholder that answered every
      // request with a 404 and made any local test of an API path meaningless.
      //
      // Note the asymmetry this creates: the app talks to aoe4-guides-DEV
      // through Firebase, while this proxy reaches the PROD database through
      // Cloud Run. The two hold different builds, so an id that exists on one
      // side may not exist on the other. Fine for checking that a call is made
      // and parsed; useless for checking that both paths return the same build
      // — do that on a deploy preview.
      "/api": {
        target: "https://aoe4-guides-api-7h2vti5ckq-ey.a.run.app",
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
