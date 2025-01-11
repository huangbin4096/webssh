import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8001,
    host: '0.0.0.0',
    proxy: {
      '/upload/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/storage/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/ssh': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/hb1': {
        target: 'http://localhost:19902',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
