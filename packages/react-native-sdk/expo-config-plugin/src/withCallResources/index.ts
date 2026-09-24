import { type ConfigPlugin, withPlugins } from '@expo/config-plugins';
import type { ConfigProps } from '../common/types';
import withIosRingtone from './withIosRingtone';
import withIosCallkitIcon from './withIosCallkitIcon';
import withAndroidRingtone from './withAndroidRingtone';
import withCallSounds from './withCallSounds';

const withCallResources: ConfigPlugin<ConfigProps> = (config, props) => {
  const plugins: ConfigPlugin[] = [];
  if (props?.iosCallSounds || props?.androidCallSounds) {
    plugins.push(() => withCallSounds(config, props));
  }

  if (props?.ringing) {
    if (props?.iosRingtone) {
      plugins.push(() => withIosRingtone(config, props));
    }

    if (props?.iosCallKitIcon) {
      plugins.push(() => withIosCallkitIcon(config, props));
    }

    if (props?.androidRingtone) {
      plugins.push(() => withAndroidRingtone(config, props));
    }
  }

  //if no plugins are added, return the config
  if (plugins.length === 0) {
    return config;
  }

  return withPlugins(config, plugins);
};

export default withCallResources;
