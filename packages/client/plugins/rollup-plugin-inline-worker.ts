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
 * Rollup plugin that bundles worker TypeScript files into inline strings.
 *
 * Only files whose path ends with one of the provided `include` patterns
 * are processed — all other modules are skipped with zero overhead.
 *
 * For each matched file, the plugin:
 * 1. Finds the corresponding `-impl.ts` entry (e.g. `worker.ts` → `worker/worker-impl.ts`)
 * 2. Bundles it with a nested Rollup + TypeScript build
 * 3. Formats with prettier, then exports as a `WORKER_SOURCE` template literal string
 */
export default function inlineWorker({ include }: InlineWorkerOptions): Plugin {
  const fileNames = new Set(include);

  return {
    name: 'inline-worker',

    async load(id: string) {
      const fileName = id.split('/').pop();
      if (!fileNames.has(fileName!)) return null;

      // worker.ts → worker/worker-impl.ts
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

      // Format with prettier to match project coding style, then escape
      // for safe embedding inside a template literal.
      const formatted = await format(output[0].code, {
        parser: 'babel',
        ...(await resolveConfig(implPath)),
        printWidth: 120,
      });
      const escaped = formatted
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');

      return `export const WORKER_SOURCE = \`${escaped}\`;\n`;
    },
  };
}
