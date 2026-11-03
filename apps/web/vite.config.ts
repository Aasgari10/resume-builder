import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Forward API calls, published sites and their assets to the backend during development
    proxy: {
      "/api": "http://localhost:4000",
      "/s/": "http://localhost:4000",
      "/_assets": "http://localhost:4000",
      "/_uploads": "http://localhost:4000",
    },
  },
});
