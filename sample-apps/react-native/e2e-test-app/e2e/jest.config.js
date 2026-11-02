/** @type {import('jest').Config} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/tests/**/*.e2e.ts'],
  // Calls take a while to connect, and buddy participants join from a browser.
  testTimeout: 300000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: [
    'detox/runners/jest/reporter',
    // Kept across Detox's `--retries` runs; the `test_e2e` lane clears it before the first one.
    [
      'jest-allure2-reporter',
      { resultsDir: 'allure-results', overwrite: false },
    ],
  ],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  testEnvironmentOptions: {
    eventListeners: [
      'jest-metadata/environment-listener',
      'jest-allure2-reporter/environment-listener',
    ],
  },
  verbose: true,
  transform: {
    '\\.ts$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: ['module:@react-native/babel-preset'],
      },
    ],
  },
};
