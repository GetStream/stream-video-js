// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;

const monorepoRoot = path.resolve(projectRoot, '../../..');

// 1. Watch all files within the monorepo
config.watchFolders = [
  path.join(monorepoRoot, 'node_modules'),
  path.join(monorepoRoot, 'packages/client'),
  path.join(monorepoRoot, 'packages/react-bindings'),
  path.join(monorepoRoot, 'packages/react-native-sdk'),
];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
