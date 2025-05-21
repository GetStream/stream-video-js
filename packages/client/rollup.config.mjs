import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';

import pkg from './package.json' with { type: 'json' };

// these modules are used only in nodejs and are not needed in the browser
const browserIgnoredModules = ['https', 'util', 'stream'];

/**
 * A plugin which converts the nodejs modules to empty modules for the browser.
 *
 * @type {import('rollup').Plugin}
 */
const browserIgnorePlugin = {
  name: 'browser-remapper',
  resolveId: (importee) =>
    browserIgnoredModules.includes(importee) ? importee : null,
  load: (id) =>
    browserIgnoredModules.includes(id) ? 'export default null;' : null,
};

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

/**
 * @type {import('rollup').RollupOptions}
 */
const browserConfig = {
  input: 'index.ts',
  output: {
    file: 'dist/index.browser.es.js',
    format: 'esm',
    sourcemap: true,
  },
  external: external.filter((dep) => !browserIgnoredModules.includes(dep)),
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.PKG_VERSION': JSON.stringify(pkg.version),
      'process.env.CLIENT_BUNDLE': JSON.stringify('browser-esm'),
    }),
    browserIgnorePlugin,
    typescript(),
  ],
};

/**
 * @return {import('rollup').RollupOptions}
 */
const createNodeConfig = (outputFile, format) => ({
  input: 'index.ts',
  output: {
    file: outputFile,
    format: format,
    sourcemap: true,
  },
  external,
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.PKG_VERSION': JSON.stringify(pkg.version),
      'process.env.CLIENT_BUNDLE': JSON.stringify(`node-${format}`),
    }),
    typescript(),
  ],
});

const rollupConfig = [
  browserConfig,
  createNodeConfig('dist/index.cjs.js', 'cjs'),
  createNodeConfig('dist/index.es.js', 'esm'),
];

export default rollupConfig;
