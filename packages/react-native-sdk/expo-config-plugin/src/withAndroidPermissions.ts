import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';

const withStreamVideoReactNativeSDKAndroidPermissions: ConfigPlugin = (
  config,
) => {
  config = AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_MICROPHONE',
    'android.permission.BLUETOOTH',
    'android.permission.BLUETOOTH_CONNECT',
    'android.permission.BLUETOOTH_ADMIN',
  ]);
  return config;
};

export default withStreamVideoReactNativeSDKAndroidPermissions;
