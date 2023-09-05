import { ConfigPlugin, withPlugins } from '@expo/config-plugins';
import withStreamVideoReactNativeSDKAppDelegate from './withAppDelegate';

const withStreamVideoReactNativeSDK: ConfigPlugin = (config) => {
  return withPlugins(config, [withStreamVideoReactNativeSDKAppDelegate]);
};

export default withStreamVideoReactNativeSDK;
