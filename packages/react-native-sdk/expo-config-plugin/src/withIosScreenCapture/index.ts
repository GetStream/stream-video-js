import { ConfigPlugin, withPlugins } from '@expo/config-plugins';
import { ConfigProps } from '../common/types';
import withPlistUpdates from './withPlistUpdates';
import withFilesMod from './withFilesMod';
import withTarget from './withTarget';

const withIosScreenCapture: ConfigPlugin<ConfigProps> = (config, props) => {
  return withPlugins(config, [
    () => withFilesMod(config, props),
    () => withTarget(config, props),
    () => withPlistUpdates(config, props),
  ]);
};

export default withIosScreenCapture;
