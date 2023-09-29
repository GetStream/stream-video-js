import { ConfigPlugin, withInfoPlist } from '@expo/config-plugins';
import { ConfigProps } from './common/types';

const withStreamVideoReactNativeSDKiOSInfoPList: ConfigPlugin<ConfigProps> = (
  configuration,
  props,
) => {
  return withInfoPlist(configuration, (config) => {
    if (!Array.isArray(config.modResults.UIBackgroundModes)) {
      config.modResults.UIBackgroundModes = [];
    }
    if (!config.modResults.UIBackgroundModes.includes('audio')) {
      config.modResults.UIBackgroundModes.push('audio');
    }
    if (props.enableNonRingingPushNotifications) {
      if (
        !config.modResults.UIBackgroundModes.includes('remote-notification')
      ) {
        config.modResults.UIBackgroundModes.push('remote-notification');
      }
    }
    return config;
  });
};

export default withStreamVideoReactNativeSDKiOSInfoPList;
