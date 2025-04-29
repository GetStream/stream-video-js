import { getLogger } from '@stream-io/video-client';
import { PermissionsAndroid } from 'react-native';
import { lib, type Type } from './lib';

export type NotifeeLib = Type;

enum AndroidForegroundServiceType {
  FOREGROUND_SERVICE_TYPE_CAMERA = 64,
  FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE = 16,
  FOREGROUND_SERVICE_TYPE_DATA_SYNC = 1,
  FOREGROUND_SERVICE_TYPE_HEALTH = 256,
  FOREGROUND_SERVICE_TYPE_LOCATION = 8,
  FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK = 2,
  FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION = 32,
  FOREGROUND_SERVICE_TYPE_MEDIA_PROCESSING = 8192,
  FOREGROUND_SERVICE_TYPE_MICROPHONE = 128,
  FOREGROUND_SERVICE_TYPE_PHONE_CALL = 4,
  FOREGROUND_SERVICE_TYPE_REMOTE_MESSAGING = 512,
  FOREGROUND_SERVICE_TYPE_SHORT_SERVICE = 2048,
  FOREGROUND_SERVICE_TYPE_SPECIAL_USE = 1073741824,
  FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED = 1024,
  FOREGROUND_SERVICE_TYPE_MANIFEST = -1,
}

const INSTALLATION_INSTRUCTION =
  'Please see https://notifee.app/react-native/docs/installation for installation instructions';

export function getNotifeeLibThrowIfNotInstalledForPush() {
  if (!lib) {
    throw Error(
      '@notifee/react-native is not installed. It is required for implementing push notifications. ' +
        INSTALLATION_INSTRUCTION,
    );
  }
  return lib;
}

export function getNotifeeLibNoThrowForKeepCallAlive() {
  if (!lib) {
    const logger = getLogger(['getNotifeeLibNoThrow']);
    logger(
      'info',
      `${'@notifee/react-native library not installed. It is required to keep call alive in the background for Android. '}${INSTALLATION_INSTRUCTION}`,
    );
  }
  return lib;
}

export async function getKeepCallAliveForegroundServiceTypes() {
  const types: AndroidForegroundServiceType[] = [];
  const hasCameraPermission = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.CAMERA!,
  );
  if (hasCameraPermission) {
    types.push(AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CAMERA);
  }
  const hasMicrophonePermission = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO!,
  );
  if (hasMicrophonePermission) {
    types.push(AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE);
  }
  const hasConnectionPermission = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT!,
  );
  if (hasConnectionPermission) {
    types.push(
      AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE,
    );
  }
  if (types.length === 0) {
    types.push(AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
  }
  return types;
}

export function getIncomingCallForegroundServiceTypes() {
  const types: AndroidForegroundServiceType[] = [
    AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_SHORT_SERVICE,
  ];
  return types;
}
