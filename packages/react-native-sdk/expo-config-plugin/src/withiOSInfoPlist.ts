import { type ConfigPlugin, withInfoPlist } from '@expo/config-plugins';
import type { ConfigProps } from './common/types';

const withStreamVideoReactNativeSDKiOSInfoPList: ConfigPlugin<ConfigProps> = (
  configuration,
  props
) => {
  return withInfoPlist(configuration, (config) => {
    function addBackgroundMode(mode: string) {
      if (!Array.isArray(config.modResults.UIBackgroundModes)) {
        config.modResults.UIBackgroundModes = [];
      }
      if (!config.modResults.UIBackgroundModes.includes(mode)) {
        config.modResults.UIBackgroundModes.push(mode);
      }
    }
    addBackgroundMode('audio');
    if (props?.ringingPushNotifications) {
      addBackgroundMode('voip');
      addBackgroundMode('fetch');
    }
    if (props?.enableNonRingingPushNotifications) {
      addBackgroundMode('remote-notification');
    }
    return config;
  });
};

export default withStreamVideoReactNativeSDKiOSInfoPList;
