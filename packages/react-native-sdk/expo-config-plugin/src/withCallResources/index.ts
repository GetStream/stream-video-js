import { type ConfigPlugin, withPlugins } from '@expo/config-plugins';
import type { ConfigProps } from '../common/types';
import withIosRingtone from './withIosRingtone';
import withIosCallkitIcon from './withIosCallkitIcon';
import withAndroidRingtone from './withAndroidRingtone';

const withCallResources: ConfigPlugin<ConfigProps> = (config, props) => {
  //we don't need to add call resources if ringing is not enabled, or if no custom resources are provided
  if (
    !props?.ringing ||
    (!props?.iosRingtone && !props?.iosCallKitIcon && !props?.androidRingtone)
  ) {
    return config;
  }

  return withPlugins(config, [
    () => withIosRingtone(config, props),
    () => withIosCallkitIcon(config, props),
    () => withAndroidRingtone(config, props),
  ]);
};

export default withCallResources;
