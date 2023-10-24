import { ConfigPlugin } from '@expo/config-plugins';
import { ConfigProps } from '../common/types';
import withEntitlementsAndFiles from './withEntitlementsAndFiles';
import withIosBroadcastExtension from './withIosBroadcastExtension';

const withIosScreenCapture: ConfigPlugin<ConfigProps> = (config, props) => {
  config = withIosBroadcastExtension(config, props);
  config = withEntitlementsAndFiles(config, props);
  return config;
};

export default withIosScreenCapture;
