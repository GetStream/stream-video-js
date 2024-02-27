import withStreamVideoReactNativeSDKAndroidPermissions from '../src/withAndroidPermissions';
import { ExpoConfig } from '@expo/config-types';

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

    const updatedConfig =
      withStreamVideoReactNativeSDKAndroidPermissions(inputConfig);

    // Assert that the necessary permissions are added to the Android config
    expect(updatedConfig?.android?.permissions).toEqual(
      expect.arrayContaining([
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_MICROPHONE',
        'android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION',
        'android.permission.BLUETOOTH',
        'android.permission.BLUETOOTH_CONNECT',
        'android.permission.BLUETOOTH_ADMIN',
      ]),
    );
  });
});
