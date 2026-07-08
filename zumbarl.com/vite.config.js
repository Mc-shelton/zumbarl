import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// HTTPS with a self-signed dev certificate so camera/microphone (WebRTC)
// work when the app is opened from another device on the LAN. The API and
// uploaded files are proxied same-origin to avoid mixed-content blocking.
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api': { target: 'http://localhost:4100', changeOrigin: true },
      '/files': { target: 'http://localhost:4100', changeOrigin: true },
    },
  },
})
