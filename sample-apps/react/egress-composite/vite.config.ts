import { defineConfig } from 'vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '',

  plugins: [
    react(),
    sentryVitePlugin({
      org: 'stream',
      project: 'video-composite-layout-app',
    }),
  ],

  build: {
    sourcemap: true,
  },
});
