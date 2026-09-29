import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages'te site /<depo-adı>/ altında yayınlanır; yayın iş akışı BASE_PATH'i ayarlar
  base: process.env.BASE_PATH || '/',
  server: { port: 5173 },
})
