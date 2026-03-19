import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/auth": { target: "http://localhost:3000", changeOrigin: true },
      "/courses": { target: "http://localhost:3000", changeOrigin: true },
      "/instructors": { target: "http://localhost:3000", changeOrigin: true },
      "/schedule/": { target: "http://localhost:3000", changeOrigin: true },
      "/year": { target: "http://localhost:3000", changeOrigin: true },
    },
  },  
})
