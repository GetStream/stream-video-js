import type { Config } from 'jest';

const config: Config = {
  preset: 'react-native',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest-setup.ts',
  ],
  testPathIgnorePatterns: ['<rootDir>/__tests__/mocks/', '<rootDir>/dist/'],
};

export default config;
