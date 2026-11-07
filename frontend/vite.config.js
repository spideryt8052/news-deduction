import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@designcodeio/threeui/style.css': path.resolve(__dirname, './src/shaders/threeui.css'),
      '@designcodeio/threeui': path.resolve(__dirname, './src/shaders/dark-souls-holo-card/DarkSoulsHoloCard.tsx'),
    }
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-charts': ['recharts'],
          'vendor-axios': ['axios'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  }
})
