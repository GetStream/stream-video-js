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

/**
 * Main entrypoint configuration
 */
const mainConfig = {
  input: 'index.ts',
  output: [
    {
      dir: 'dist',
      entryFileNames: 'index.es.js',
      format: 'es',
      sourcemap: true,
      chunkFileNames,
    },
    {
      dir: 'dist',
      entryFileNames: 'index.cjs.js',
      format: 'cjs',
      sourcemap: true,
      chunkFileNames,
    },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
  ],
  plugins: [
    ...commonPlugins,
    typescript({
      tsconfig:
        process.env.NODE_ENV === 'production'
          ? './tsconfig.production.json'
          : './tsconfig.json',
    }),
  ],
};

/**
 * Embedded entrypoint configuration
 */
const embeddedConfig = {
  input: 'embedded.ts',
  output: [
    {
      dir: 'dist',
      entryFileNames: 'embedded.es.js',
      format: 'es',
      sourcemap: true,
      chunkFileNames: (chunkInfo) =>
        `embedded-${chunkInfo.name}-[hash].[format].js`,
    },
    {
      dir: 'dist',
      entryFileNames: 'embedded.cjs.js',
      format: 'cjs',
      sourcemap: true,
      chunkFileNames: (chunkInfo) =>
        `embedded-${chunkInfo.name}-[hash].[format].js`,
    },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    '@stream-io/audio-filters-web',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
  ],
  plugins: [
    ...commonPlugins,
    typescript({
      tsconfig:
        process.env.NODE_ENV === 'production'
          ? './tsconfig.production.json'
          : './tsconfig.json',
    }),
  ],
};

export default [mainConfig, embeddedConfig];
