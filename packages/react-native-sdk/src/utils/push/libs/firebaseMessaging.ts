export type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
export type FirebaseMessagingType =
  typeof import('@react-native-firebase/messaging').default;

let messaging: FirebaseMessagingType | undefined;

try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (_e) {}

const INSTALLATION_INSTRUCTION =
  'Please see https://rnfirebase.io/messaging/usage#installation for installation instructions';
export function getFirebaseMessagingLib() {
  if (!messaging) {
    throw Error(
      '@react-native-firebase/messaging is not installed. ' +
        INSTALLATION_INSTRUCTION,
    );
  }
  return messaging;
}

export function getFirebaseMessagingLibNoThrow(isExpo: boolean) {
  if (!messaging) {
    console.warn(
      `${
        isExpo
          ? 'In Expo, @react-native-firebase/messaging library is required to receive ringing notifications in app killed state for Android.'
          : ''
      }${INSTALLATION_INSTRUCTION}`,
    );
  }
  return messaging;
}
