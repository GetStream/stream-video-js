import { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import {
  PERMISSIONS,
  requestMultiple,
  requestNotifications,
} from 'react-native-permissions';

/**
 * This hook is used to sync the permissions of the app with the Stream Video SDK.
 * We will ask for relevant permissions after the parent screen is mounted and when app state changes
 * to foreground. This ensures the latest permissions are synced with the Stream Video SDK
 * so the SDK will subscribe to audio/video devices as preparation for a call.
 */
export const useSyncPermissions = () => {
  useEffect(() => {
    requestAndUpdatePermissions().then(() => {
      hasCameraRollAndroidPermission();
    });
  }, []);
};

async function hasCameraRollAndroidPermission() {
  const getCheckPermissionPromise = () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      return Promise.all([
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        ),
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        ),
      ]).then(
        ([hasReadMediaImagesPermission, hasReadMediaVideoPermission]) =>
          hasReadMediaImagesPermission && hasReadMediaVideoPermission,
      );
    } else {
      return PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );
    }
  };

  const hasPermission = await getCheckPermissionPromise();
  if (hasPermission) {
    return true;
  }
  const getRequestPermissionPromise = () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      return PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
      ]).then(
        (statuses) =>
          statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] ===
            PermissionsAndroid.RESULTS.GRANTED,
      );
    } else {
      return PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ).then((status) => status === PermissionsAndroid.RESULTS.GRANTED);
    }
  };

  return await getRequestPermissionPromise();
}

const requestAndUpdatePermissions = async () => {
  if (Platform.OS === 'ios') {
    await requestMultiple([PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.MICROPHONE]);
  } else if (Platform.OS === 'android') {
    await requestMultiple([
      PERMISSIONS.ANDROID.CAMERA,
      PERMISSIONS.ANDROID.RECORD_AUDIO,
      PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
    ]);
  }
  await requestNotifications(['alert', 'sound']);
};
