import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  base: "/french/icas/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    proxy: {
      "/french/icas/auth": { target: "http://localhost:3000", changeOrigin: true, rewrite: (p) => p.replace(/^\/french\/icas/, "") },
      "/french/icas/courses": { target: "http://localhost:3000", changeOrigin: true, rewrite: (p) => p.replace(/^\/french\/icas/, "") },
      "/french/icas/instructors": { target: "http://localhost:3000", changeOrigin: true, rewrite: (p) => p.replace(/^\/french\/icas/, "") },
      "/french/icas/schedule/": { target: "http://localhost:3000", changeOrigin: true, rewrite: (p) => p.replace(/^\/french\/icas/, "") },
      "/french/icas/year": { target: "http://localhost:3000", changeOrigin: true, rewrite: (p) => p.replace(/^\/french\/icas/, "") },
      "/french/icas/faculty": { target: "http://localhost:3000", changeOrigin: true, rewrite: (p) => p.replace(/^\/french\/icas/, "") },
      "/french/icas/users": { target: "http://localhost:3000", changeOrigin: true, rewrite: (p) => p.replace(/^\/french\/icas/, "") },
    },
  },  
})
