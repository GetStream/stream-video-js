const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
  // The SDK is bundled from source, so its unhoisted deps resolve here. Last,
  // so react/react-native stay single-copy.
  path.resolve(workspaceRoot, 'packages/react-native-sdk/node_modules'),
];

config.resolver.disableHierarchicalLookup = true;

module.exports = config;
