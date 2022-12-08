import { defineConfig } from 'vitest/config';

export default defineConfig({
  // TODO: move build process to Vite
  build: {},
  test: {
    coverage: {
      reporter: ['lcov'],
    },
  },
});
