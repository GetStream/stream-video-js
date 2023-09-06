import { ConfigPlugin, withInfoPlist } from '@expo/config-plugins';

const withStreamVideoReactNativeSDKiOSInfoPList: ConfigPlugin = (
  configuration,
) => {
  return withInfoPlist(configuration, (config) => {
    if (!Array.isArray(config.modResults.UIBackgroundModes)) {
      config.modResults.UIBackgroundModes = [];
    }
    if (!config.modResults.UIBackgroundModes.includes('audio')) {
      config.modResults.UIBackgroundModes.push('audio');
    }
    return config;
  });
};

export default withStreamVideoReactNativeSDKiOSInfoPList;
