import type { Config } from 'jest';

const config: Config = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/mocks/',
    '<rootDir>/__tests__/utils/',
    '<rootDir>/dist/',
  ],
  testTimeout: 10000,
};

export default config;
