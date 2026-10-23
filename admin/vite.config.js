import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@pictures': path.resolve(rootDir, '../Pictures'),
    },
  },
  server: {
    port: 5175,
    fs: {
      allow: [path.resolve(rootDir, '..')],
    },
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: (p) => p.replace(
          /^\/api/,
          '/AI-Based%20Drone%20Waste%20Detection%20and%20Geospatial%20Mapping%20System%20for%20Smart%20Campus%20Monitoring/backend/api',
        ),
      },
    },
  },
})
