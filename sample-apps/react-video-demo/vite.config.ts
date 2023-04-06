import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  root: '.',
  server: {
    https: true,
  },
  plugins: [react(), mkcert()],
  resolve: {
    preserveSymlinks: true,
  },
  build: {
    commonjsOptions: {
      include: ['tailwind-config.cjs'],
    },
  },
});
