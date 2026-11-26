import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    rollupOptions: {
      output: {
        // Dependencias en chunks separados: se cachean entre despliegues
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          data: ["@tanstack/react-query", "axios", "zod", "react-hook-form", "@hookform/resolvers"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-popover",
            "@radix-ui/react-tooltip",
            "sonner",
          ],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    // En Docker sobre Windows/macOS los cambios de archivos solo se detectan con polling
    watch: { usePolling: process.env.VITE_USE_POLLING === "true" },
  },
});
