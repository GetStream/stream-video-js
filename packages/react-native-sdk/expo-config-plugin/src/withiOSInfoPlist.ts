import { ConfigPlugin, withInfoPlist } from '@expo/config-plugins';

const withStreamVideoReactNativeSDKiOSInfoPList: ConfigPlugin = (
  configuration,
) => {
  return withInfoPlist(configuration, (config) => {
    if (config.modResults.UIBackgroundModes) {
      delete config.modResults.UIBackgroundModes;
    }
    config.modResults.UIBackgroundModes = ['audio'];
    return config;
  });
};

export default withStreamVideoReactNativeSDKiOSInfoPList;
