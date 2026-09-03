import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Allow the iOS WKWebView sample to reach this dev server via a tunnel.
    // Leading dots match any subdomain; the tunnel URL rotates each run.
    allowedHosts: [
      'localhost',
      '.trycloudflare.com',
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok.app',
    ],
  },
});
