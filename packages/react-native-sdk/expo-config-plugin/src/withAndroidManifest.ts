import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
} from '@expo/config-plugins';
import { ConfigProps } from './common/types';
const {
  prefixAndroidKeys,
  getMainApplicationOrThrow,
  getMainActivityOrThrow,
  ensureToolsAvailable,
} = AndroidConfig.Manifest;

// extract the type from array
type Unpacked<T> =
  T extends Array<infer U> ? U : T extends ReadonlyArray<infer U> ? U : T;
// extract the service type
type ManifestService = Unpacked<
  NonNullable<AndroidConfig.Manifest.ManifestApplication['service']>
>;

function getNotifeeService(isKeepCallAliveEnabled = false) {
  /* We add this service to the AndroidManifest.xml:
    <service
        android:name="app.notifee.core.ForegroundService"
        android:stopWithTask="true"
        android:foregroundServiceType="shortService" />
 */
  let foregroundServiceType = 'shortService';
  if (isKeepCallAliveEnabled) {
    foregroundServiceType =
      'dataSync|camera|microphone|connectedDevice|' + foregroundServiceType;
  }
  let head = prefixAndroidKeys({
    name: 'app.notifee.core.ForegroundService',
    stopWithTask: 'true',
    foregroundServiceType,
  });
  head = { ...head, 'tools:replace': 'android:foregroundServiceType' };
  return {
    $: head,
  } as ManifestService;
}

const withStreamVideoReactNativeSDKManifest: ConfigPlugin<ConfigProps> = (
  configuration,
  props
) => {
  return withAndroidManifest(configuration, (config) => {
    const androidManifest = config.modResults;
    const mainApplication = getMainApplicationOrThrow(androidManifest);
    if (props?.ringingPushNotifications || props?.androidKeepCallAlive) {
      ensureToolsAvailable(androidManifest);
      /* Add the notifee foreground Service */
      let services = mainApplication.service ?? [];
      // we filter out the existing notifee service (if any) so that we can override it
      services = services.filter(
        (service) =>
          service.$['android:name'] !== 'app.notifee.core.ForegroundService'
      );
      services.push(getNotifeeService(!!props?.androidKeepCallAlive));
      mainApplication.service = services;
    }

    if (props?.androidPictureInPicture) {
      const mainActivity = getMainActivityOrThrow(androidManifest);
      ('keyboard|keyboardHidden|orientation|screenSize|uiMode');
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

    if (props?.ringingPushNotifications?.showWhenLockedAndroid) {
      const mainActivity = getMainActivityOrThrow(androidManifest);
      mainActivity.$['android:showWhenLocked'] = 'true';
      mainActivity.$['android:turnScreenOn'] = 'true';
    }
    config.modResults = androidManifest;
    return config;
  });
};

export default withStreamVideoReactNativeSDKManifest;
