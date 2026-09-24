import { type ConfigPlugin } from '@expo/config-plugins';
import type { ConfigProps } from '../common/types';
import withIosSoundFile from './withIosSoundFile';

const withIosRingtone: ConfigPlugin<ConfigProps> = (config, props) => {
  if (!props?.iosRingtone) {
    return config;
  }

  return withIosSoundFile(config, props.iosRingtone);
};

export default withIosRingtone;
