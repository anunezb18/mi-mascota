import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // En Docker sobre Windows/macOS los cambios de archivos solo se detectan con polling
    watch: { usePolling: process.env.VITE_USE_POLLING === "true" },
  },
});
