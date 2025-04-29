import { getLogger } from '@stream-io/video-client';
import { lib, type Type } from './lib';

export type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
export type FirebaseMessagingType = Type;

const INSTALLATION_INSTRUCTION =
  'Please see https://rnfirebase.io/messaging/usage#installation for installation instructions';

export function getFirebaseMessagingLib() {
  if (!lib) {
    throw Error(
      '@react-native-firebase/messaging is not installed. ' +
        INSTALLATION_INSTRUCTION,
    );
  }
  return lib;
}

export function getFirebaseMessagingLibNoThrow(isExpo: boolean) {
  if (!lib) {
    const logger = getLogger(['getFirebaseMessagingLibNoThrow']);
    logger(
      'debug',
      `${
        isExpo
          ? 'In Expo, @react-native-firebase/messaging library is required to receive ringing notifications in app killed state for Android.'
          : ''
      }${INSTALLATION_INSTRUCTION}`,
    );
  }
  return lib;
}
