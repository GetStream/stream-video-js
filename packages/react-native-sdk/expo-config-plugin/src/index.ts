import { ConfigPlugin, withPlugins } from '@expo/config-plugins';
import withStreamVideoReactNativeSDKAppDelegate from './withAppDelegate';
import withStreamVideoReactNativeSDKMainApplication from './withMainApplication';
import withStreamVideoReactNativeSDKAndroidPermissions from './withAndroidPermissions';

const withStreamVideoReactNativeSDK: ConfigPlugin = (config) => {
  return withPlugins(config, [
    withStreamVideoReactNativeSDKAppDelegate,
    withStreamVideoReactNativeSDKMainApplication,
    withStreamVideoReactNativeSDKAndroidPermissions,
  ]);
};

export default withStreamVideoReactNativeSDK;
