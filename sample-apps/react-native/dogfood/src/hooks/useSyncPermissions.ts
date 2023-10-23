import { useEffect } from 'react';
import { Platform } from 'react-native';
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
    requestAndUpdatePermissions();
  }, []);
};

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
