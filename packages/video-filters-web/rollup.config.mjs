import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';

import pkg from './package.json' with { type: 'json' };

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
  ],
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.PKG_NAME': JSON.stringify(pkg.name),
      'process.env.PKG_VERSION': JSON.stringify(pkg.version),
    }),
    typescript(),
  ],
};

export default [config];
