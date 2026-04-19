/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setup.js',
  },
  server: {
    port: 3000,
    proxy: {
      '/admin': {
        target: 'http://localhost:5005',
        changeOrigin: true,
      },
      '/presentations': {
        target: 'http://localhost:5005',
        changeOrigin: true,
      },
      '/store': {
        target: 'http://localhost:5005',
        changeOrigin: true,
      },
    },
  },
})
