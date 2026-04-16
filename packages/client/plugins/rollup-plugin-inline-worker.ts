import type { Plugin } from 'rollup';
import { rollup } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { format, resolveConfig } from 'prettier';
import { dirname, resolve } from 'path';

interface InlineWorkerOptions {
  /** File names (not paths) that trigger the plugin, e.g. `['worker.ts']`. */
  include: string[];
}

/**
 * Rollup plugin that bundles worker TypeScript files into inline functions.
 *
 * Only files whose path ends with one of the provided `include` patterns
 * are processed — all other modules are skipped with zero overhead.
 *
 * For each matched file, the plugin:
 * 1. Finds the corresponding `-impl.ts` entry (e.g. `worker.ts` → `worker/worker-impl.ts`)
 * 2. Bundles it with a nested Rollup + TypeScript build
 * 3. Wraps the result in an exported function and formats with prettier
 *
 * The consumer creates a Worker from the function via:
 *   `new Worker(\`data:text/javascript,(\${fn.toString()})()\`)`
 * or via a Blob URL.
 */
export default function inlineWorker({ include }: InlineWorkerOptions): Plugin {
  const fileNames = new Set(include);

  return {
    name: 'inline-worker',

    async load(id: string) {
      const fileName = id.split('/').pop();
      if (!fileNames.has(fileName!)) return null;

      // e2ee-worker.ts → e2ee-worker/e2ee-worker-impl.ts
      const dir = dirname(id);
      const name = fileName!.replace(/\.ts$/, '');
      const implPath = resolve(dir, name, `${name}-impl.ts`);

      const bundle = await rollup({
        input: implPath,
        plugins: [
          typescript({
            tsconfig: false,
            compilerOptions: {
              target: 'ES2020',
              module: 'ES2020',
              moduleResolution: 'node',
              strict: true,
              declaration: false,
              sourceMap: false,
            },
          }),
        ],
      });

      const { output } = await bundle.generate({
        format: 'es',
        indent: false,
        sourcemap: false,
      });
      await bundle.close();

      // Wrap bundled code in an exported function, then format with prettier.
      return await format(
        `export function e2eeWorker() {\n${output[0].code}\n}\n`,
        {
          parser: 'babel',
          ...(await resolveConfig(implPath)),
        },
      );
    },
  };
}
