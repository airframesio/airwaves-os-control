import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    // Local only by default: through the proxy the dev server reaches the
    // manager, including /api/v1/system/exec. Set DEV_HOST=0.0.0.0 to open it
    // to the LAN on purpose.
    host: process.env.DEV_HOST || "127.0.0.1",
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      // Proxy API and WebSocket requests to the airwaves-manager container
      // Run: docker compose -f docker-compose.dev.yml up -d  (in airwaves-os repo)
      '/api/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
});
