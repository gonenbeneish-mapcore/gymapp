import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Where the app is served from. "/" locally; "/gymapp/" on GitHub Pages
// (set by the deploy workflow). Must start and end with "/".
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: {
        id: base,
        name: "GymApp",
        short_name: "GymApp",
        description: "Personal workout and body-weight tracker",
        start_url: base,
        scope: base,
        display: "standalone",
        orientation: "portrait",
        background_color: "#0B0C0E",
        theme_color: "#0B0C0E",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2}"],
        navigateFallback: `${base}index.html`,
        // Machine photos are loaded from the maker's image CDN and kept on the phone for offline use.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === "images.ctfassets.net",
            handler: "CacheFirst",
            options: {
              cacheName: "machine-photos",
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  optimizeDeps: { include: ["dexie", "dexie-react-hooks"] },
  server: { host: true },
  preview: { host: true },
});
