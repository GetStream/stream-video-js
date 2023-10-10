import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
} from '@expo/config-plugins';
import { ConfigProps } from './common/types';
const { prefixAndroidKeys, getMainApplicationOrThrow, getMainActivityOrThrow } =
  AndroidConfig.Manifest;

// extract the type from array
type Unpacked<T> = T extends Array<infer U>
  ? U
  : T extends ReadonlyArray<infer U>
  ? U
  : T;
// extract the service type
type ManifestService = Unpacked<
  NonNullable<AndroidConfig.Manifest.ManifestApplication['service']>
>;

function getNotifeeService() {
  /*
    <service
        android:name="app.notifee.core.ForegroundService"
        android:stopWithTask="true"
        android:foregroundServiceType="microphone" />
 */
  const head = prefixAndroidKeys({
    name: 'app.notifee.core.ForegroundService',
    stopWithTask: 'true',
    foregroundServiceType: 'microphone',
  });
  return {
    $: head,
  } as ManifestService;
}

const withStreamVideoReactNativeSDKManifest: ConfigPlugin<ConfigProps> = (
  configuration,
  props,
) => {
  return withAndroidManifest(configuration, (config) => {
    try {
      const androidManifest = config.modResults;
      const mainApplication = getMainApplicationOrThrow(androidManifest);
      /* Add the notifeee Service */
      let services = mainApplication.service ?? [];
      // we filter out the existing notifee service (if any) so that we can override it
      services = services.filter(
        (service) =>
          service.$['android:name'] !== 'app.notifee.core.ForegroundService',
      );
      services.push(getNotifeeService());
      mainApplication.service = services;

      if (props.androidPictureInPicture) {
        const mainActivity = getMainActivityOrThrow(androidManifest);
        ('keyboard|keyboardHidden|orientation|screenSize|uiMode');
        const currentConfigChangesArray = mainActivity.$[
          'android:configChanges'
        ]
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
    } catch (error: any) {
      console.log(error);
      throw new Error(
        'Cannot setup StreamVideoReactNativeSDK because the AndroidManifest is malformed',
      );
    }
    return config;
  });
};

export default withStreamVideoReactNativeSDKManifest;
