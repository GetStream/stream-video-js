import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Any colocated `*.test.ts(x)` under src, not just the ones under a `__tests__` directory, so a
    // test written next to the module it covers is not silently skipped.
    include: ['src/**/*.test.ts?(x)'],
    // The i18n tests exercise the catalog and the translator, not the DOM, so the cheaper node
    // environment is enough — and it keeps jsdom out of this package's devDependencies.
    environment: 'node',
  },
});
