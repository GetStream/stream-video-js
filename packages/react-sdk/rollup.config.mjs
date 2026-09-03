import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';

import pkg from './package.json' with { type: 'json' };

/**
 * @type {import('rollup').OutputOptions['chunkFileNames']}
 */
const chunkFileNames = (chunkInfo) => {
  if (chunkInfo.name.includes('CallStatsLatencyChart')) {
    return 'latency-chart-[hash].[format].js';
  }
  if (chunkInfo.name.includes('BackgroundFilters')) {
    return 'background-filters-[hash].[format].js';
  }
  return '[name]-[hash].[format].js';
};

const commonPlugins = [
  json(),
  replace({
    preventAssignment: true,
    'process.env.PKG_NAME': JSON.stringify(pkg.name),
    'process.env.PKG_VERSION': JSON.stringify(pkg.version),
  }),
];

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
];

const createTypescriptPlugin = (options) =>
  typescript({
    tsconfig:
      process.env.NODE_ENV === 'production'
        ? './tsconfig.production.json'
        : './tsconfig.json',
    ...options,
  });

/**
 * Per-module ESM output for both entrypoints.
 *
 * Emitting one file per source module is what lets the consumer's bundler drop
 * the modules it doesn't reach - a single fat bundle cannot be pruned below
 * module granularity. Both entrypoints share one config so the modules they
 * have in common are emitted once instead of written twice into `dist/esm`.
 *
 * @type {import('rollup').RollupOptions}
 */
const esmConfig = {
  input: {
    index: 'index.ts',
    embedded: 'embedded.ts',
  },
  output: {
    dir: 'dist/esm',
    format: 'es',
    sourcemap: true,
    preserveModules: true,
    preserveModulesRoot: '.',
    entryFileNames: '[name].js',
  },
  external: [...external, '@stream-io/audio-filters-web'],
  plugins: [
    ...commonPlugins,
    createTypescriptPlugin({ outDir: 'dist/esm', declaration: false }),
  ],
};

/**
 * Main entrypoint, CommonJS. Bundlers do not tree-shake CommonJS, so this stays
 * a single bundle (plus the lazily loaded chunks).
 *
 * @type {import('rollup').RollupOptions}
 */
const mainCjsConfig = {
  input: 'index.ts',
  output: {
    dir: 'dist',
    entryFileNames: 'index.cjs.js',
    format: 'cjs',
    sourcemap: true,
    chunkFileNames,
  },
  external,
  plugins: [...commonPlugins, createTypescriptPlugin()],
};

/**
 * Embedded entrypoint, CommonJS.
 *
 * @type {import('rollup').RollupOptions}
 */
const embeddedCjsConfig = {
  input: 'embedded.ts',
  output: {
    dir: 'dist',
    entryFileNames: 'embedded.cjs.js',
    format: 'cjs',
    sourcemap: true,
    chunkFileNames: (chunkInfo) =>
      `embedded-${chunkInfo.name}-[hash].[format].js`,
  },
  external: [...external, '@stream-io/audio-filters-web'],
  plugins: [...commonPlugins, createTypescriptPlugin()],
};

export default [esmConfig, mainCjsConfig, embeddedCjsConfig];
