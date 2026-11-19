/**
 * Jest config for the push tests in `e2e/push/`, which run without Detox. Detox can't test an app
 * that was killed: its runner lives in the app's process, and when that process dies Android
 * force-stops the app and drops its pushes. These tests drive the device with adb instead.
 *
 * Local only: they need a device with Google Play services. See `e2e/README.md`.
 */
/** @type {import('jest').Config} */
module.exports = {
  rootDir: '../..',
  testMatch: ['<rootDir>/e2e/push/**/*.e2e.ts'],
  // A call that rings, gets accepted and then stays locked for E2E_AWAY_SECONDS.
  testTimeout: 600000,
  maxWorkers: 1,
  reporters: [
    'default',
    [
      'jest-allure2-reporter',
      { resultsDir: 'allure-results', overwrite: false },
    ],
  ],
  testEnvironment: 'jest-allure2-reporter/environment-node',
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
