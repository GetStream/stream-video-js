import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',
  plugins: [react(), splitVendorChunkPlugin()],
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
