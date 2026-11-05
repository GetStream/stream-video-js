import { resolve } from 'path';
import { defineConfig } from 'vite';
import { dependencies, name, version } from './package.json';

const external = [...Object.keys(dependencies ?? {})];

export default defineConfig({
  define: {
    'process.env.PKG_NAME': JSON.stringify(name),
    'process.env.PKG_VERSION': JSON.stringify(version),
  },
  plugins: [
    // Rolldown ignores `dynamicImportInCjs` for internal chunks and emits
    // `Promise.resolve().then(() => require("./x.js"))`, which makes consumers'
    // bundlers inline the ~5 MB lazy chunk. Rewrite it to a real `import()`.
    // The regex matches double-quoted specifiers only; `generateBundle` fails
    // the build if any dynamic import was left as `require()`.
    {
      name: 'cjs-real-dynamic-import',
      renderChunk(code) {
        return code.replace(
          /Promise\.resolve\(\)\.then\(\(\) => require\(("[^"]+")\)\)/g,
          'import($1)',
        );
      },
      generateBundle(_, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== 'chunk') continue;
          for (const file of chunk.dynamicImports) {
            const specifier = `"./${file.replace(/^cjs\//, '')}"`;
            if (
              !chunk.code.includes(`import(${specifier})`) ||
              chunk.code.includes(`require(${specifier})`)
            ) {
              this.error(
                `${chunk.fileName}: dynamic import of ${file} was not emitted as a real import(); the cjs-real-dynamic-import rewrite no longer matches`,
              );
            }
          }
        }
      },
    },
  ],
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
    target: 'es2022',
    rollupOptions: {
      external,
      output: {
        dynamicImportInCjs: true,
        chunkFileNames: 'cjs/[name].js',
      },
    },
  },
});
