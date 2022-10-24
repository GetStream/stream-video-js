const { makeMetroConfig } = require('@rnx-kit/metro-config');
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks');
const { getDefaultConfig } = require('metro-config');

const getConfig = async () => {
  const defaultConfig = await getDefaultConfig();
  const config = makeMetroConfig({
    resolver: {
      resolveRequest: MetroSymlinksResolver(),
      // add any custom asset options here (if any).. example "bin"
      assetExts: [...defaultConfig.resolver.assetExts],
    },
  });
  return config;
};

module.exports = getConfig();
