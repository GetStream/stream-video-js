import {
  AndroidConfig,
  type ConfigPlugin,
  withAndroidManifest,
} from '@expo/config-plugins';
import { type ConfigProps } from './common/types';

const { getMainActivityOrThrow } = AndroidConfig.Manifest;

const withStreamVideoReactNativeSDKManifest: ConfigPlugin<ConfigProps> = (
  configuration,
  props,
) => {
  return withAndroidManifest(configuration, (config) => {
    const androidManifest = config.modResults;
    if (props?.androidPictureInPicture) {
      const mainActivity = getMainActivityOrThrow(androidManifest);
      const currentConfigChangesArray = mainActivity.$['android:configChanges']
        ? mainActivity.$['android:configChanges'].split('|')
        : [];
      const neededConfigChangesArray =
        'screenSize|smallestScreenSize|screenLayout|orientation'.split('|');
      // Create a Set from the two arrays.
      const set = new Set([
        ...currentConfigChangesArray,
        ...neededConfigChangesArray,
      ]);
      const mergedConfigChanges = [...set];
      mainActivity.$['android:configChanges'] = mergedConfigChanges.join('|');
      mainActivity.$['android:supportsPictureInPicture'] = 'true';
    }
    config.modResults = androidManifest;
    return config;
  });
};

export default withStreamVideoReactNativeSDKManifest;
