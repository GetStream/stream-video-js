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
      // Recents redial: the system hands the app an INStartCallIntent activity
      if (!Array.isArray(config.modResults.NSUserActivityTypes)) {
        config.modResults.NSUserActivityTypes = [];
      }
      for (const type of [
        'INStartCallIntent',
        'INStartAudioCallIntent',
        'INStartVideoCallIntent',
      ]) {
        if (!config.modResults.NSUserActivityTypes.includes(type)) {
          config.modResults.NSUserActivityTypes.push(type);
        }
      }
      addBackgroundMode('fetch');
      addBackgroundMode('processing');
      config.modResults['BGTaskSchedulerPermittedIdentifiers'] = [
        '$(PRODUCT_BUNDLE_IDENTIFIER)',
      ];
    }
    if (props?.enableNonRingingPushNotifications || props?.ringing) {
      addBackgroundMode('remote-notification');
    }
    return config;
  });
};

export default withStreamVideoReactNativeSDKiOSInfoPList;
