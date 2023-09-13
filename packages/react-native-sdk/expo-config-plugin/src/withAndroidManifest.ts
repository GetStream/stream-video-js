import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
} from '@expo/config-plugins';
const { prefixAndroidKeys, getMainApplicationOrThrow } = AndroidConfig.Manifest;

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

const withStreamVideoReactNativeSDKManifest: ConfigPlugin = (configuration) => {
  return withAndroidManifest(configuration, (config) => {
    try {
      const androidManifest = config.modResults;
      const mainApplication = getMainApplicationOrThrow(androidManifest);
      let services = mainApplication.service ?? [];
      // we filter out the existing notifee service (if any) so that we can override it
      services = services.filter(
        (service) =>
          service.$['android:name'] !== 'app.notifee.core.ForegroundService',
      );
      services.push(getNotifeeService());
      mainApplication.service = services;
      config.modResults = androidManifest;
    } catch (error: any) {
      throw new Error(
        'Cannot setup StreamVideoReactNativeSDK because the AndroidManifest is malformed',
      );
    }
    return config;
  });
};

export default withStreamVideoReactNativeSDKManifest;
