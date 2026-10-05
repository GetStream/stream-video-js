import { type ConfigPlugin } from '@expo/config-plugins';
import type { ConfigProps } from '../common/types';
import withAndroidSoundFile, {
  normalizeAndroidResourceName,
} from './withAndroidSoundFile';

const withAndroidRingtone: ConfigPlugin<ConfigProps> = (config, props) => {
  if (!props?.androidRingtone) {
    return config;
  }

  return withAndroidSoundFile(config, props.androidRingtone);
};

export default withAndroidRingtone;
export { normalizeAndroidResourceName };
