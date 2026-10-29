import { fileURLToPath, URL } from "url";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// The wordmark's face is requested from CSS that main.js imports, so the
// browser asks for it only once the header is already being laid out — even on
// a reload with the file in cache. Fontsource sets `font-display: swap`, so that
// first frame is Georgia, which is wider, and the title visibly jumps to EB
// Garamond. A preload starts the fetch while the HTML is parsed, in parallel
// with the bundle, so the face is ready before Vue mounts the header. The file
// name is content-hashed, so it is read from the bundle rather than written out.
const preloadWordmarkFont = {
  name: "preload-wordmark-font",
  transformIndexHtml: {
    order: "post",
    handler(html, ctx) {
      const font = Object.keys(ctx.bundle ?? {}).find((file) =>
        /eb-garamond-latin-600-normal-[\w-]+\.woff2$/.test(file)
      );
      if (!font) return html;
      return [
        {
          tag: "link",
          attrs: { rel: "preload", href: `/${font}`, as: "font", type: "font/woff2", crossorigin: "" },
          injectTo: "head",
        },
      ];
    },
  },
};

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
    preloadWordmarkFont,
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
