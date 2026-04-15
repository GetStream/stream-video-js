const { exclusionList, resolveUniqueModule } = require('@rnx-kit/metro-config');
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks');

const { getDefaultConfig } = require('expo/metro-config');

const path = require('path');
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// find what all modules need to be unique for the app
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

// Filter out expo from unique modules to avoid blocking expo virtual files
// Expo virtual files are in the workspace root's node_modules and must be accessible
const uniqueModulesFiltered = uniqueModules.filter(
  ({ packageName }) => packageName !== 'expo',
);

// provide the path for the unique modules
// Exclude expo from extraNodeModules to allow it to resolve from workspace root
// (needed for Expo virtual files)
const extraNodeModules = uniqueModulesFiltered.reduce((acc, item) => {
  acc[item.packageName] = item.modulePath;
  return acc;
}, {});

// block the other paths for unique modules from being resolved
const blockList = uniqueModulesFiltered.map(({ blockPattern }) => blockPattern);

const workspaceRoot = path.resolve(projectRoot, '../../..');

config.watchFolders = [
  path.join(workspaceRoot, 'node_modules'),
  path.join(workspaceRoot, 'packages/client'),
  path.join(workspaceRoot, 'packages/react-bindings'),
  path.join(workspaceRoot, 'packages/react-native-sdk'),
  path.join(workspaceRoot, 'packages/react-native-callingx'),
  path.join(workspaceRoot, 'packages/noise-cancellation-react-native'),
  path.join(workspaceRoot, 'packages/video-filters-react-native'),
];

// using rnx-kit symlinks resolver to solve https://github.com/react-native-webrtc/react-native-webrtc/issues/1503
config.resolver.resolveRequest = MetroSymlinksResolver();

config.resolver.extraNodeModules = extraNodeModules;

config.resolver.blockList = exclusionList(blockList);

module.exports = config;
