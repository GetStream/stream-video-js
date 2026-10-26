import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { dependencies, name, version } from './package.json';

const external = [...Object.keys(dependencies ?? {})];

export default defineConfig({
  define: {
    'process.env.PKG_NAME': JSON.stringify(name),
    'process.env.PKG_VERSION': JSON.stringify(version),
  },
  worker: { format: 'iife' },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./index.ts', import.meta.url)),
      formats: ['es', 'cjs'],
    },
    outDir: 'dist',
    emptyOutDir: false,
    minify: false,
    sourcemap: true,
    target: 'es2022',
    rollupOptions: {
      external,
      output: [
        {
          format: 'es',
          dir: 'dist/esm',
          preserveModules: true,
          preserveModulesRoot: '.',
          entryFileNames: '[name].js',
        },
        {
          format: 'cjs',
          dir: 'dist',
          entryFileNames: 'index.cjs.js',
          chunkFileNames: '[name].cjs.js',
        },
      ],
    },
  },
});
