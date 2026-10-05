/** @type {import('jest').Config} */
module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    // Workspace dependencies must use the same React copy as the app and renderer.
    '^react($|/.*)': '<rootDir>/node_modules/react$1',
  },
};
