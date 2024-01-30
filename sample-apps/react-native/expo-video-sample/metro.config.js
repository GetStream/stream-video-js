const { exclusionList, resolveUniqueModule } = require('@rnx-kit/metro-config');
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks');

const { getDefaultConfig } = require('expo/metro-config');

const path = require('path');
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Start, find what all modules need to be unique for the app
const dependencyPackageNames = Object.keys(
  require('./package.json').dependencies,
);

const uniqueModules = dependencyPackageNames.map((packageName) => {
  const [modulePath, blockPattern] = resolveUniqueModule(
    packageName,
    projectRoot,
  );
  return {
    packageName, // name of the package
    modulePath, // actual path to the module in the project's node modules
    blockPattern, // paths that match this pattern will be blocked from being resolved
  };
});

// provide the path for the unique modules
const extraNodeModules = uniqueModules.reduce((acc, item) => {
  acc[item.packageName] = item.modulePath;
  return acc;
}, {});

// block the other paths for unique modules from being resolved
const blockList = uniqueModules.map(({ blockPattern }) => blockPattern);

const workspaceRoot = path.resolve(projectRoot, '../../..');

// watch all folders in the workspace
config.watchFolders = [workspaceRoot];

config.resolver.resolveRequest = MetroSymlinksResolver();

config.resolver.extraNodeModules = extraNodeModules;

config.resolver.blockList = exclusionList(blockList);

module.exports = config;
