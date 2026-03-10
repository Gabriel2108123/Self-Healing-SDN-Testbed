import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api calls to Flask backend so you can develop without CORS issues
// during local Windows dev (when Flask is also running locally on port 5000).
// When connecting to Ubuntu, update API_BASE in src/config.js instead.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
