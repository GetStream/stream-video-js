import {
  type ConfigPlugin,
  createRunOncePlugin,
  withPlugins,
} from '@expo/config-plugins';
import withAppDelegate from './withAppDelegate';
import withAndroidPermissions from './withAndroidPermissions';
import withAndroidManifest from './withAndroidManifest';
import withiOSInfoPlist from './withiOSInfoPlist';
import withMainActivity from './withMainActivity';
import withMainApplication from './withMainApplication';
import withBuildProperties from './withBuildProperties';
import withAppBuildGradle from './withAppBuildGradle';
import withIosScreenCapture from './withIosScreenCapture';
import { type ConfigProps } from './common/types';

// path should be relative to dist
const pkg = require('../../package.json');

const withStreamVideoReactNativeSDK: ConfigPlugin<ConfigProps> = (
  config,
  props,
) => {
  return withPlugins(config, [
    // ios
    () => withAppDelegate(config, props),
    () => withiOSInfoPlist(config, props),
    () => withIosScreenCapture(config, props),
    // android
    () => withAndroidPermissions(config, props),
    withAppBuildGradle,
    withBuildProperties,
    () => withAndroidManifest(config, props),
    () => withMainActivity(config, props),
    () => withMainApplication(config, props),
  ]);
};

export default createRunOncePlugin(
  withStreamVideoReactNativeSDK,
  pkg.name,
  pkg.version,
);
