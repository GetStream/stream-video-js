import { useEffect } from 'react';
import { useAppStateListener } from 'stream-chat-react-native';
import { Platform } from 'react-native';
import { StreamVideoRN } from '@stream-io/video-react-native-sdk';
import {
  checkMultiple,
  PERMISSIONS,
  PermissionStatus,
  requestMultiple,
  RESULTS,
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
  useAppStateListener(checkAndUpdatePermissions, () => {});
};

const requestAndUpdatePermissions = async () => {
  if (Platform.OS === 'ios') {
    const results = await requestMultiple([
      PERMISSIONS.IOS.CAMERA,
      PERMISSIONS.IOS.MICROPHONE,
    ]);
    iOSProcessResultsAndSetToConfig(results);
    return;
  } else if (Platform.OS === 'android') {
    const results = await requestMultiple([
      PERMISSIONS.ANDROID.CAMERA,
      PERMISSIONS.ANDROID.RECORD_AUDIO,
      PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
      PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
    ]);
    androidProcessResultsAndSetToConfig(results);
  }
};
const checkAndUpdatePermissions = async () => {
  if (Platform.OS === 'ios') {
    const results = await checkMultiple([
      PERMISSIONS.IOS.CAMERA,
      PERMISSIONS.IOS.MICROPHONE,
    ]);
    iOSProcessResultsAndSetToConfig(results);
  } else if (Platform.OS === 'android') {
    const results = await checkMultiple([
      PERMISSIONS.ANDROID.CAMERA,
      PERMISSIONS.ANDROID.RECORD_AUDIO,
    ]);
    androidProcessResultsAndSetToConfig(results);
  }
};

// The extracted type of the return value of `requestMultiple`
type Results = Awaited<ReturnType<typeof requestMultiple>>;

const androidProcessResultsAndSetToConfig = (results: Results) =>
  StreamVideoRN.setPermissions({
    isCameraPermissionGranted:
      results[PERMISSIONS.ANDROID.CAMERA] === RESULTS.GRANTED,
    isMicPermissionGranted:
      results[PERMISSIONS.ANDROID.RECORD_AUDIO] === RESULTS.GRANTED,
  });

const iOSProcessResultsAndSetToConfig = (
  results: Awaited<ReturnType<typeof requestMultiple>>,
) =>
  StreamVideoRN.setPermissions({
    isCameraPermissionGranted:
      results[PERMISSIONS.IOS.CAMERA] === RESULTS.GRANTED,
    isMicPermissionGranted:
      results[PERMISSIONS.IOS.MICROPHONE] === RESULTS.GRANTED,
  });
