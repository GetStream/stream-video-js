import { useEffect } from 'react';
import { useAppStateListener } from 'stream-chat-react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import { StreamVideoRN } from '@stream-io/video-react-native-sdk';

/**
 * This hook is used to sync the permissions of the app with the Stream Video SDK.
 * We will ask for relevant permissions after the parent screen is mounted and when app state changes
 * to foreground. This ensures the latest permissions are synced with the Stream Video SDK
 * so the SDK will subscribe to audio/video devices as preparation for a call.
 */
export const useSyncPermissions = () => {
  useEffect(() => {
    checkAndUpdatePermissions();
  }, []);
  useAppStateListener(handleOnForeground, () => {});
};

const checkAndUpdatePermissions = async () => {
  // TODO(SG): ask with RN permissions
  if (Platform.OS === 'ios') {
    StreamVideoRN.setPermissions({
      isCameraPermissionGranted: true,
      isMicPermissionGranted: true,
    });
    return;
  }
  const results = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  ]);
  StreamVideoRN.setPermissions({
    isCameraPermissionGranted:
      results[PermissionsAndroid.PERMISSIONS.CAMERA] ===
      PermissionsAndroid.RESULTS.GRANTED,
    isMicPermissionGranted:
      results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
      PermissionsAndroid.RESULTS.GRANTED,
  });
};
const handleOnForeground = async () => {
  const isCameraPermissionGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.CAMERA,
  );
  const isMicPermissionGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  );
  StreamVideoRN.setPermissions({
    isCameraPermissionGranted,
    isMicPermissionGranted,
  });
};
