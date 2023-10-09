import {
  ConfigPlugin,
  createRunOncePlugin,
  withPlugins,
} from '@expo/config-plugins';
import withStreamVideoReactNativeSDKAppDelegate from './withStreamVideoReactNativeSDKAppDelegate';
import withPushAppDelegate from './withPushAppDelegate';
import withStreamVideoReactNativeSDKMainApplication from './withMainApplication';
import withStreamVideoReactNativeSDKAndroidPermissions from './withAndroidPermissions';
import withStreamVideoReactNativeSDKManifest from './withAndroidManifest';
import withStreamVideoReactNativeSDKiOSInfoPList from './withiOSInfoPlist';
import withStreamVideoReactNativeSDKMainActivity from './withMainActivity';
import { ConfigProps } from './common/types';

// path should be relative to dist
const pkg = require('../../package.json');

const withStreamVideoReactNativeSDK: ConfigPlugin<ConfigProps> = (
  config,
  props,
) => {
  return withPlugins(config, [
    () => withPushAppDelegate(config, props),
    withStreamVideoReactNativeSDKAppDelegate,
    withStreamVideoReactNativeSDKMainApplication,
    withStreamVideoReactNativeSDKAndroidPermissions,
    withStreamVideoReactNativeSDKManifest,
    () => withStreamVideoReactNativeSDKMainActivity(config, props),
    () => withStreamVideoReactNativeSDKiOSInfoPList(config, props),
  ]);
};

export default createRunOncePlugin(
  withStreamVideoReactNativeSDK,
  pkg.name,
  pkg.version,
);
