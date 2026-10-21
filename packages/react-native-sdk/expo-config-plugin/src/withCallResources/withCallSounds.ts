import { type ConfigPlugin, withPlugins } from '@expo/config-plugins';
import type { ConfigProps } from '../common/types';
import withAndroidSoundFile from './withAndroidSoundFile';
import withIosSoundFile from './withIosSoundFile';

const toArray = (value: string | string[]): string[] =>
  Array.isArray(value) ? value : [value];

const withCallSounds: ConfigPlugin<ConfigProps> = (config, props) => {
  const plugins: ConfigPlugin[] = [];

  for (const sourcePath of toArray(props?.iosCallSounds ?? [])) {
    plugins.push(() => withIosSoundFile(config, sourcePath));
  }

  for (const sourcePath of toArray(props?.androidCallSounds ?? [])) {
    plugins.push(() => withAndroidSoundFile(config, sourcePath));
  }

  if (plugins.length === 0) {
    return config;
  }

  return withPlugins(config, plugins);
};

export default withCallSounds;
