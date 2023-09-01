import type { Config } from 'jest';

const config: Config = {
  preset: 'react-native',
  setupFilesAfterEnv: [
    '<rootDir>/jest-setup.ts',
    '<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/mocks/',
    '<rootDir>/__tests__/utils/',
    '<rootDir>/dist/',
  ],
  transformIgnorePatterns: [
    // added as per the README in https://github.com/invertase/notifee/tree/main/packages/react-native
    'node_modules/(?!(jest-)?react-native|@react-native|@notifee)',
  ],
  testTimeout: 10000,
};

export default config;
