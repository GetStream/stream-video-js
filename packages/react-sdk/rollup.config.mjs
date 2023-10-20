import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';

import pkg from './package.json' assert { type: 'json' };

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: 'index.ts',
  output: [
    {
      file: 'dist/index.es.js',
      format: 'es',
      sourcemap: true,
    },
    {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
  ],
  plugins: [
    json(),
    replace({
      preventAssignment: true,
      'process.env.PKG_VERSION': JSON.stringify(pkg.version),
    }),
    typescript({
      tsconfig:
        process.env.NODE_ENV === 'production'
          ? './tsconfig.production.json'
          : './tsconfig.json',
    }),
  ],
};

export default [config];
