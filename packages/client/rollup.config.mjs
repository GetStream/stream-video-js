import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';

import pkg from './package.json' assert { type: 'json' };

// these modules are used only in nodejs and are not needed in the browser
const browserIgnoredModules = [
  'jsonwebtoken',
  'https',
  'crypto',
  'util',
  'stream',
];

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

/**
 * @type {import('rollup').RollupOptions}
 */
const browserConfig = {
  input: 'index.ts',
  output: {
    file: 'dist/index.browser.es.js',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.PKG_VERSION': JSON.stringify(pkg.version),
    }),
    browserIgnorePlugin,
    typescript(),
  ],
};

const nodeConfig = {
  input: 'index.ts',
  output: [
    {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.es.js',
      format: 'es',
      sourcemap: true,
    },
  ],
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.PKG_VERSION': JSON.stringify(pkg.version),
    }),
    typescript(),
  ],
};

export default [browserConfig, nodeConfig];
