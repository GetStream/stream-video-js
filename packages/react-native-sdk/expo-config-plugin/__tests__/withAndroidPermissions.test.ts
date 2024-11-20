import withStreamVideoReactNativeSDKAndroidPermissions from '../src/withAndroidPermissions';
import { ExpoConfig } from '@expo/config-types';
import { ConfigProps } from '../src/common/types';

describe('withStreamVideoReactNativeSDKAndroidPermissions', () => {
  it('should add specified permissions to Android config', () => {
    const inputConfig: ExpoConfig = {
      // Your initial configuration here
      name: 'test-app',
      slug: 'test-app',
      android: {
        permissions: [],
      },
    };
    const props: ConfigProps = {
      enableScreenshare: true,
      ringingPushNotifications: { disableVideoIos: false },
      androidKeepCallAlive: true,
    };

    const updatedConfig = withStreamVideoReactNativeSDKAndroidPermissions(
      inputConfig,
      props
    );

    // Assert that the necessary permissions are added to the Android config
    expect(updatedConfig?.android?.permissions).toEqual(
      expect.arrayContaining([
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION',
        'android.permission.BLUETOOTH',
        'android.permission.BLUETOOTH_CONNECT',
        'android.permission.BLUETOOTH_ADMIN',
        'android.permission.FOREGROUND_SERVICE_CAMERA',
        'android.permission.FOREGROUND_SERVICE_MICROPHONE',
        'android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE',
        'android.permission.FOREGROUND_SERVICE_DATA_SYNC',
      ])
    );
  });
});
