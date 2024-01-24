const { getDefaultConfig } = require('expo/metro-config');

const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../../..');

const config = getDefaultConfig(projectRoot);

// Watch all files within the mono repo
config.watchFolders = [workspaceRoot];

/* START workaround for https://github.com/react-native-webrtc/react-native-webrtc/issues/1488 */
const rnWebrtcPath = path.resolve(
  projectRoot,
  'node_modules/@stream-io/react-native-webrtc',
);

const monorepoPackages = {
  'event-target-shim': path.resolve(
    rnWebrtcPath,
    'node_modules/event-target-shim',
  ),
};

// blocklist event-target-shim paths that do not match a path starting with react-native-webrtc path
const blockList = [
  new RegExp(`(?<!${rnWebrtcPath})/node_modules/event-target-shim`),
];

config.resolver.extraNodeModules = monorepoPackages;

config.resolver.blockList = blockList;

/* END */

module.exports = config;
