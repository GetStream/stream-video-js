import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      // Only TypeScript sources: the v8 remapper tries to parse everything it is
      // given, so a stray .md / .json under src/ makes it throw.
      include: ['src/**/*.ts'],
      exclude: ['**/__tests__/**', 'src/gen/**'],
      reportsDirectory: './coverage',
      reporter: ['lcov'],
    },
  },
});
