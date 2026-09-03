/** @typedef {import('jest').Config} */
const config = {
  // referenced directly rather than via the deprecated 'react-native' preset
  // shim, which only resolves while react-native is hoisted to the root
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: [
    '<rootDir>/jest-setup.ts',
    require.resolve('react-native-gesture-handler/jestSetup'),
  ],
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/mocks/',
    '<rootDir>/__tests__/utils/',
    '<rootDir>/expo-config-plugin/__tests__',
  ],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  // the workspace-linked bindings resolve react from the repo root, which the
  // web side pins to a newer version; force everything onto this package's copy
  // so the tests do not load two react instances
  moduleNameMapper: {
    '^react$': require.resolve('react'),
    '^react/jsx-runtime$': require.resolve('react/jsx-runtime'),
    '^react/jsx-dev-runtime$': require.resolve('react/jsx-dev-runtime'),
  },
  transformIgnorePatterns: [
    // added as per the README in https://github.com/invertase/notifee/tree/main/packages/react-native
    'node_modules/(?!(jest-)?react-native|@react-native|@notifee)',
  ],
  testTimeout: 10000,
};

module.exports = config;
