export type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
export type FirebaseMessagingType =
  typeof import('@react-native-firebase/messaging').default;
export type PushNotificationIosLib =
  typeof import('@react-native-community/push-notification-ios').default;

let messaging: FirebaseMessagingType | undefined;
let pushNotificationIosLib: PushNotificationIosLib | undefined;

try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (_e) {}

try {
  pushNotificationIosLib =
    require('@react-native-community/push-notification-ios').default;
} catch (_e) {}

export function getPushNotificationIosLib() {
  if (!pushNotificationIosLib) {
    throw Error(
      '@react-native-community/push-notification-ios library is not installed. Please install it using "yarn add @react-native-community/push-notification-ios" or "npm i @react-native-community/push-notification-ios --save"',
    );
  }
  return pushNotificationIosLib;
}

export function getFirebaseMessagingLib() {
  if (!messaging) {
    throw Error(
      'react-native-firebase library is not installed. Please see https://rnfirebase.io/messaging/usage#installation for installation instructions',
    );
  }
  return messaging;
}
