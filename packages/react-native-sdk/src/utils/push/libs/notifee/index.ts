import { lib, type Type } from './lib';
import { videoLoggerSystem } from '@stream-io/video-client';

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
  return lib;
}

export function getIncomingCallForegroundServiceTypes() {
  const types: AndroidForegroundServiceType[] = [
    AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_SHORT_SERVICE,
  ];
  return types;
}
