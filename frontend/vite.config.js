import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on 0.0.0.0 so GitHub Codespaces can access the dev server
    port: 5173,
    allowedHosts: true, // Allow GitHub Codespaces host header
  },
})
