import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';
import { ConfigProps } from './common/types';

const withStreamVideoReactNativeSDKAndroidPermissions: ConfigPlugin<
  ConfigProps
> = (configuration, props) => {
  const foregroundServicePermissions = [
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_DATA_SYNC',
  ];
  if (props?.enableScreenshare) {
    foregroundServicePermissions.push(
      'android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION'
    );
  }
  const config = AndroidConfig.Permissions.withPermissions(configuration, [
    'android.permission.POST_NOTIFICATIONS',
    ...foregroundServicePermissions,
    'android.permission.BLUETOOTH',
    'android.permission.BLUETOOTH_CONNECT',
    'android.permission.BLUETOOTH_ADMIN',
  ]);
  return config;
};

export default withStreamVideoReactNativeSDKAndroidPermissions;
