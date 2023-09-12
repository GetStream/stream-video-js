import { defineConfig } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  // custom path to omit architecture/system from file name (darwin-amd64/darwin-arm64/linux-amd64...)
  snapshotPathTemplate: './tests/__screenshots__/{testFilePath}/{arg}{ext}',
  use: {
    headless: !!process.env.CI,
    trace: 'on-first-retry',
    viewport: { width: 1920, height: 1080 },
    baseURL: 'http://localhost:5173',
    // TODO: find out why custom data-test-id does not work
    // testIdAttribute: 'data-testid',
  },
  webServer: [
    {
      timeout: 10000,
      command: 'yarn buddy server --port 4567',
      reuseExistingServer: false,
      port: 4567,
    },
    {
      timeout: 10000,
      command: 'yarn dev',
      reuseExistingServer: false,
      port: 5173,
    },
  ],
});
