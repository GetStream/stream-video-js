import {
  ConfigPlugin,
  createRunOncePlugin,
  withPlugins,
} from '@expo/config-plugins';
import withPushAppDelegate from './withPushAppDelegate';
import withAndroidPermissions from './withAndroidPermissions';
import withAndroidManifest from './withAndroidManifest';
import withiOSInfoPlist from './withiOSInfoPlist';
import withMainActivity from './withMainActivity';
import withBuildProperties from './withBuildProperties';
import withAppBuildGradle from './withAppBuildGradle';
import withIosScreenCapture from './withIosScreenCapture';
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
    () => withiOSInfoPlist(config, props),
    () => withIosScreenCapture(config, props),
    // android
    withAndroidPermissions,
    withAppBuildGradle,
    withBuildProperties,
    () => withAndroidManifest(config, props),
    () => withMainActivity(config, props),
  ]);
};

export default createRunOncePlugin(
  withStreamVideoReactNativeSDK,
  pkg.name,
  pkg.version,
);
