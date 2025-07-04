import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 15000,
    coverage: {
      ignoreEmptyLines: true,
      provider: 'v8',
      include: ['src/**'],
      exclude: ['**/__tests__/**', 'src/gen/**'],
      reportsDirectory: './coverage',
      reporter: ['lcov'],
    },
  },
});
