export type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
export type FirebaseMessagingType =
  typeof import('@react-native-firebase/messaging').default;

let messaging: FirebaseMessagingType | undefined;

try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (_e) {}

export function getFirebaseMessagingLib() {
  if (!messaging) {
    throw Error(
      'react-native-firebase library is not installed. Please see https://rnfirebase.io/messaging/usage#installation for installation instructions',
    );
  }
  return messaging;
}
