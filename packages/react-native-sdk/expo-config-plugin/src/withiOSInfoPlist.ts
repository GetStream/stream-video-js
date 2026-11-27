import { type ConfigPlugin, withInfoPlist } from '@expo/config-plugins';
import type { ConfigProps } from './common/types';

const withStreamVideoReactNativeSDKiOSInfoPList: ConfigPlugin<ConfigProps> = (
  configuration,
  props,
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
    if (props?.ringing || props?.iosKeepCallAlive) {
      addBackgroundMode('voip');
    }
    if (props?.ringing) {
      addBackgroundMode('fetch');
      addBackgroundMode('processing');
      config.modResults['BGTaskSchedulerPermittedIdentifiers'] = [
        '$(PRODUCT_BUNDLE_IDENTIFIER)',
      ];
      // CallKit Recents call-backs arrive as an INStartCallIntent user activity.
      const activityTypes = Array.isArray(config.modResults.NSUserActivityTypes)
        ? (config.modResults.NSUserActivityTypes as string[])
        : [];
      if (!activityTypes.includes('INStartCallIntent')) {
        activityTypes.push('INStartCallIntent');
      }
      config.modResults.NSUserActivityTypes = activityTypes;
    }
    if (props?.enableNonRingingPushNotifications || props?.ringing) {
      addBackgroundMode('remote-notification');
    }
    return config;
  });
};

export default withStreamVideoReactNativeSDKiOSInfoPList;
