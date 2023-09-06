import { ConfigPlugin, withPlugins } from '@expo/config-plugins';
import withStreamVideoReactNativeSDKAppDelegate from './withAppDelegate';
import withStreamVideoReactNativeSDKMainApplication from './withMainApplication';

const withStreamVideoReactNativeSDK: ConfigPlugin = (config) => {
  return withPlugins(config, [
    withStreamVideoReactNativeSDKAppDelegate,
    withStreamVideoReactNativeSDKMainApplication,
  ]);
};

export default withStreamVideoReactNativeSDK;
