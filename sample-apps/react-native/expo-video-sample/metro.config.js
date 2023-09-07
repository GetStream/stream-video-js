const path = require('path');
const { makeMetroConfig } = require('@rnx-kit/metro-config');
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks');
const { getDefaultConfig } = require('expo/metro-config');

const reactNativeSdkPak = require('@stream-io/video-react-native-sdk/package.json');
const reactNativeSdkModules = Object.keys({
  ...reactNativeSdkPak.peerDependencies,
});

const getConfig = async () => {
  const defaultConfig = getDefaultConfig(__dirname);
  const config = makeMetroConfig({
    resolver: {
      resolveRequest: MetroSymlinksResolver(),
      // add any custom asset options here (if any).. example "bin"
      assetExts: [...defaultConfig.resolver.assetExts],

      // We need to make sure that only one version is loaded for peerDependencies of rn sdk
      // So we block them at the root, and alias them to the versions in the app's node_modules
      extraNodeModules: reactNativeSdkModules.reduce((acc, name) => {
        acc[name] = path.join(__dirname, 'node_modules', name);
        return acc;
      }, {}),
    },
  });
  return config;
};

module.exports = getConfig();
