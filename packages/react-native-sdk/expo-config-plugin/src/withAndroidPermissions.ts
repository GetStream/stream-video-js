import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';
import { ConfigProps } from './common/types';

const withStreamVideoReactNativeSDKAndroidPermissions: ConfigPlugin<
  ConfigProps
> = (configuration, props) => {
  const permissions = [
    'android.permission.BLUETOOTH',
    'android.permission.BLUETOOTH_CONNECT',
    'android.permission.BLUETOOTH_ADMIN',
  ];
  if (props?.ringingPushNotifications || props?.enableScreenshare) {
    permissions.push(
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.FOREGROUND_SERVICE'
    );
    if (props?.enableScreenshare) {
      permissions.push(
        'android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION'
      );
    }
  }
  const config = AndroidConfig.Permissions.withPermissions(
    configuration,
    permissions
  );
  return config;
};

export default withStreamVideoReactNativeSDKAndroidPermissions;
