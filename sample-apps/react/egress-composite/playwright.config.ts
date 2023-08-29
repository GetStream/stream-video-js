import { defineConfig } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  snapshotDir: './tests/snapshots',
  use: {
    headless: false,
    trace: 'on-first-retry',
    viewport: { width: 1920, height: 1080 },
  },
  webServer: [
    {
      timeout: 10000,
      command: 'yarn dev',
      reuseExistingServer: false,
      port: 5173,
    },
    {
      timeout: 30000,
      command: 'yarn buddy auth && yarn buddy server --port 4567',
      reuseExistingServer: false,
      port: 4567,
    },
  ],
});
