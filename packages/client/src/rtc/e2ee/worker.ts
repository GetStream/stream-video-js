/**
 * E2EE worker source — populated at build time.
 *
 * The actual implementation lives in `worker/worker-impl.ts` and its
 * sibling modules (`constants.ts`, `codec.ts`, `crypto.ts`, `utils.ts`,
 * `types.ts`), all written as real TypeScript with full type checking
 * and import support.
 *
 * ## How it works
 *
 * 1. You edit files in `worker/` as normal TypeScript
 * 2. `yarn build` runs Rollup, which invokes `rollup-plugin-inline-worker`
 * 3. The plugin bundles `worker/worker-impl.ts` (and its imports) into
 *    a single ES module string via a nested Rollup + TypeScript build
 * 4. The string replaces this file's export at build time
 * 5. `EncryptionManager.create()` turns the string into a Blob URL worker
 *
 * In tests, this module is mocked (see `__tests__/EncryptionManager.test.ts`),
 * so the empty string is never evaluated.
 *
 * @see worker/worker-impl.ts — the entry point
 * @see ../../rollup-plugin-inline-worker.mjs — the Rollup plugin
 * @see EncryptionManager.ts — consumes WORKER_SOURCE
 */
export const WORKER_SOURCE: string = '';
