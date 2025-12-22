import { resolve } from 'path';
import { defineConfig } from 'vite';
import { dependencies, name, version } from './package.json';

const external = [...Object.keys(dependencies ?? {})];

export default defineConfig({
  define: {
    'process.env.PKG_NAME': JSON.stringify(name),
    'process.env.PKG_VERSION': JSON.stringify(version),
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, './src/index.ts'),
      },
      fileName(format, entryName) {
        return `${format}/${entryName}.${format === 'cjs' ? 'js' : 'mjs'}`;
      },
      name,
      formats: [
        // 'es', // ES does not work with Krisp SDK
        'cjs',
      ],
    },
    emptyOutDir: false,
    outDir: 'dist',
    minify: false,
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      external,
    },
  },
});
