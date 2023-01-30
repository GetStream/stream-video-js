import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import tsconfigPaths from 'vite-tsconfig-paths';


// https://vitejs.dev/config/
export default defineConfig({
  root: '.',
  plugins: [
    react(),
    // tsconfigPaths({
    //   root: '.',
    // }),
  ],
  resolve: {
    preserveSymlinks: true,
  },
});
