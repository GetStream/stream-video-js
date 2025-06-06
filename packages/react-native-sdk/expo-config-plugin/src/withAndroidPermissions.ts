import { AndroidConfig, type ConfigPlugin } from '@expo/config-plugins';
import type { ConfigProps } from './common/types';

const withStreamVideoReactNativeSDKAndroidPermissions: ConfigPlugin<
  ConfigProps
> = (configuration, props) => {
  const permissions = [
    'android.permission.BLUETOOTH',
    'android.permission.BLUETOOTH_CONNECT',
    'android.permission.BLUETOOTH_ADMIN',
    'android.permission.WAKE_LOCK',
  ];
  if (
    props?.androidKeepCallAlive ||
    props?.ringingPushNotifications ||
    props?.enableScreenshare
  ) {
    permissions.push(
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.FOREGROUND_SERVICE',
    );
    if (props?.enableScreenshare) {
      permissions.push(
        'android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION',
      );
    }
  }
  if (props?.androidKeepCallAlive || props?.ringingPushNotifications) {
    permissions.push(
      'android.permission.FOREGROUND_SERVICE_CAMERA',
      'android.permission.FOREGROUND_SERVICE_MICROPHONE',
      'android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE',
      'android.permission.FOREGROUND_SERVICE_DATA_SYNC',
    );
  }
  if (props?.ringingPushNotifications?.showWhenLockedAndroid) {
    permissions.push('android.permission.USE_FULL_SCREEN_INTENT');
  }
  const config = AndroidConfig.Permissions.withPermissions(
    configuration,
    permissions,
  );
  return config;
};

export default withStreamVideoReactNativeSDKAndroidPermissions;
