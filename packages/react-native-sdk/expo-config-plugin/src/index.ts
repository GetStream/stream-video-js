import { ConfigPlugin, withPlugins } from '@expo/config-plugins';
import withStreamVideoReactNativeSDKAppDelegate from './withAppDelegate';
import withStreamVideoReactNativeSDKMainApplication from './withMainApplication';
import withStreamVideoReactNativeSDKAndroidPermissions from './withAndroidPermissions';
import withStreamVideoReactNativeSDKManifest from './withAndroidManifest';

const withStreamVideoReactNativeSDK: ConfigPlugin = (config) => {
  return withPlugins(config, [
    withStreamVideoReactNativeSDKAppDelegate,
    withStreamVideoReactNativeSDKMainApplication,
    withStreamVideoReactNativeSDKAndroidPermissions,
    withStreamVideoReactNativeSDKManifest,
  ]);
};

export default withStreamVideoReactNativeSDK;
