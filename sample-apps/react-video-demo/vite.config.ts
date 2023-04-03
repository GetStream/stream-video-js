import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
  },
  build: {
    commonjsOptions: {
      include: ['tailwind-config.cjs'],
    },
  },
});
