import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  root: '.',
  server: {
    https: true,
  },
  plugins: [react(), mkcert(), splitVendorChunkPlugin()],
  resolve: {
    preserveSymlinks: true,
  },
  optimizeDeps: {
    include: ['stream-video-js'],
  },
  build: {
    commonjsOptions: {
      include: ['tailwind-config.cjs', /stream-video-js/],
    },
  },
});
