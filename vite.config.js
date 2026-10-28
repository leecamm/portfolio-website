import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // three.js (WebGLRenderer + shader chunks) is ~590 kB minified; it lives in its own lazy chunk.
  build: { chunkSizeWarningLimit: 650 },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
});
