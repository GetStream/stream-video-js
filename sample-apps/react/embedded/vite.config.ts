import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      include: /\.(jsx?|tsx?)$/,
    }),
  ],
  resolve: {
    alias: {
      '@stream-io/video-react-shared/styles.scss': path.resolve(
        __dirname,
        '../shared/src/style/index.scss',
      ),
    },
  },
  optimizeDeps: {
    exclude: ['@stream-io/video-react-shared'],
  },
});
