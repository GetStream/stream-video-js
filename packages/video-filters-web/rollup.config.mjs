import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';

import pkg from './package.json' with { type: 'json' };

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

const createReplacePlugin = () =>
  replace({
    preventAssignment: true,
    'process.env.PKG_NAME': JSON.stringify(pkg.name),
    'process.env.PKG_VERSION': JSON.stringify(pkg.version),
  });

/**
 * Per-module ESM output. Emitting one file per source module is what lets the
 * consumer's bundler drop the modules it doesn't reach - a single fat bundle
 * cannot be pruned below module granularity. Declarations come from the
 * CommonJS pass, so this one only emits JavaScript.
 *
 * @type {import('rollup').RollupOptions}
 */
const esmConfig = {
  input: 'index.ts',
  output: {
    dir: 'dist/esm',
    format: 'es',
    sourcemap: true,
    preserveModules: true,
    preserveModulesRoot: '.',
    entryFileNames: '[name].js',
  },
  external,
  plugins: [
    createReplacePlugin(),
    typescript({ outDir: 'dist/esm', declaration: false }),
  ],
};

/**
 * Bundlers do not tree-shake CommonJS, so this stays a single bundle.
 *
 * @type {import('rollup').RollupOptions}
 */
const cjsConfig = {
  input: 'index.ts',
  output: {
    file: 'dist/index.cjs.js',
    format: 'cjs',
    sourcemap: true,
  },
  external,
  plugins: [createReplacePlugin(), typescript()],
};

export default [esmConfig, cjsConfig];
