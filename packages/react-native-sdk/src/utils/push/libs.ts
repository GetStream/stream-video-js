export type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

export type RNCallKeepType = typeof import('react-native-callkeep').default;
export type FirebaseMessagingType =
  typeof import('@react-native-firebase/messaging').default;
export type VoipPushNotificationType =
  typeof import('react-native-voip-push-notification').default;

let callkeep: RNCallKeepType | undefined;
let messaging: FirebaseMessagingType | undefined;
let voipPushNotification: VoipPushNotificationType | undefined;

try {
  callkeep = require('react-native-callkeep').default;
} catch (e) {}

try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (e) {}

try {
  voipPushNotification = require('react-native-voip-push-notification').default;
} catch (e) {}

export function getCallKeepLib() {
  if (!callkeep) {
    throw Error(
      "react-native-callkeep library is not installed. Please install it using 'yarn add react-native-callkeep' or 'npm install react-native-callkeep'",
    );
  }
  return callkeep;
}

export function getFirebaseMessagingLib() {
  if (!messaging) {
    throw Error(
      'react-native-firebase library is not installed. Please see https://rnfirebase.io/messaging/usage#installation for installation instructions',
    );
  }
  return messaging;
}

export function getVoipPushNotificationLib() {
  if (!voipPushNotification) {
    throw Error(
      "react-native-voip-push-notification library is not installed. Please install it using 'yarn add react-native-voip-push-notification' or 'npm install react-native-voip-push-notification'",
    );
  }
  return voipPushNotification;
}
