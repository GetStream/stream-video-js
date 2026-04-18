/**
 * E2EE worker — populated at build time.
 *
 * The actual implementation lives in `e2ee-worker/e2ee-worker-impl.ts` and its
 * sibling modules (`constants.ts`, `codec.ts`, `crypto.ts`, `utils.ts`,
 * `types.ts`), all written as real TypeScript with full type checking
 * and import support.
 *
 * ## How it works
 *
 * 1. You edit files in `e2ee-worker/` as normal TypeScript
 * 2. `yarn build` runs Rollup, which invokes `rollup-plugin-inline-worker`
 * 3. The plugin bundles `e2ee-worker/e2ee-worker-impl.ts` (and its imports)
 *    into a single function via a nested Rollup + TypeScript build
 * 4. The function replaces this file's export at build time
 * 5. `EncryptionManager.create()` creates a Worker from `e2eeWorker.toString()`
 *
 * In tests, this module is mocked (see `__tests__/EncryptionManager.test.ts`),
 * so the placeholder is never evaluated.
 *
 * @see e2ee-worker/e2ee-worker-impl.ts — the entry point
 * @see ../../plugins/rollup-plugin-inline-worker.ts — the Rollup plugin
 * @see EncryptionManager.ts — consumes e2eeWorker
 */
export function e2eeWorker() {
  // will be populated at build time
}
