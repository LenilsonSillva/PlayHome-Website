import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // permite acesso externo (previews/sandbox)
    allowedHosts: true, // aceita o host do preview (dev apenas; não afeta o build)
  },
  resolve: {
    alias: [
      {
        find: "react",
        replacement: path.resolve(__dirname, "node_modules", "react"),
      },
      {
        find: "react-dom",
        replacement: path.resolve(__dirname, "node_modules", "react-dom"),
      },
    ],
  },
});
