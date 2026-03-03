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
      "/auth": "http://localhost:3000",
      "/courses": "http://localhost:3000",
      "/instructors": "http://localhost:3000",
      "/schedule/": "http://localhost:3000",
      "/year": "http://localhost:3000",
    },
  },  
})
