import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // ⭐ important
    port: 5173,
    open: false,
    strictPort: false,
    hmr: {
      host: "localhost",
    },
    proxy: {
      "/chat": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },

      "/auth": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },

      "/login": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },

      "/analyze": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    strictPort: false,
  },
});
