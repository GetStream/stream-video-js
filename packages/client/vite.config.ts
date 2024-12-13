import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
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
