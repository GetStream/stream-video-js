import {
  ConfigPlugin,
  createRunOncePlugin,
  withPlugins,
} from '@expo/config-plugins';
import withStreamVideoReactNativeSDKAppDelegate from './withStreamVideoReactNativeSDKAppDelegate';
import withPushAppDelegate from './withPushAppDelegate';
import withMainApplication from './withMainApplication';
import withAndroidPermissions from './withAndroidPermissions';
import withAndroidManifest from './withAndroidManifest';
import withiOSInfoPlist from './withiOSInfoPlist';
import withMainActivity from './withMainActivity';
import { ConfigProps } from './common/types';

// path should be relative to dist
const pkg = require('../../package.json');

const withStreamVideoReactNativeSDK: ConfigPlugin<ConfigProps> = (
  config,
  props,
) => {
  return withPlugins(config, [
    // ios
    () => withPushAppDelegate(config, props),
    withStreamVideoReactNativeSDKAppDelegate,
    () => withiOSInfoPlist(config, props),
    // android
    withMainApplication,
    withAndroidPermissions,
    () => withAndroidManifest(config, props),
    () => withMainActivity(config, props),
  ]);
};

export default createRunOncePlugin(
  withStreamVideoReactNativeSDK,
  pkg.name,
  pkg.version,
);
