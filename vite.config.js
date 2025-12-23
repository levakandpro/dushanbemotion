import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, './src/editorV2/assets'),
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'editor': ['zustand', 'react-colorful'],
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true, // чтобы тестировать с телефона по локальной сети
    proxy: {
      // Прокси для R2 bucket (стикеры) чтобы обойти CORS при экспорте
      '/r2-proxy': {
        target: 'https://pub-78c4a70555844788bca12cc4cee974d4.r2.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/r2-proxy/, ''),
      },
      // Прокси для R2 bucket (фоны/люди)
      '/r2-people': {
        target: 'https://pub-b69ef7c5697c44e2ab311a83cae5c18a.r2.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/r2-people/, ''),
      }
    }
  },
})


