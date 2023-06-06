export type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

export type RNCallKeepType = typeof import('react-native-callkeep').default;
export type FirebaseMessagingType =
  typeof import('@react-native-firebase/messaging').default;
export type NotifeeType = typeof import('@notifee/react-native').default;
export type VoipPushNotificationType =
  typeof import('react-native-voip-push-notification').default;

let callkeep: RNCallKeepType | undefined;
let messaging: FirebaseMessagingType | undefined;
let notifee: NotifeeType | undefined;
let voipPushNotification: VoipPushNotificationType | undefined;

try {
  callkeep = require('react-native-callkeep').default;
} catch (e) {}

try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (e) {}

try {
  notifee = require('@notifee/react-native').default;
} catch (e) {}

try {
  voipPushNotification = require('react-native-voip-push-notification').default;
} catch (e) {}

export function notifeeIsInstalled(
  n: NotifeeType | undefined,
): n is NotifeeType {
  if (!n) {
    throw Error(
      "notifee library is not installed. Please install it using 'yarn add @notifee/react-native' or 'npm install @notifee/react-native'",
    );
  }
  return !!n;
}

export function callkeepIsInstalled(
  ck: RNCallKeepType | undefined,
): ck is RNCallKeepType {
  if (!ck) {
    throw Error(
      "react-native-callkeep library is not installed. Please install it using 'yarn add react-native-callkeep' or 'npm install react-native-callkeep'",
    );
  }
  return !!ck;
}

export function messagingIsInstalled(
  m: FirebaseMessagingType | undefined,
): m is FirebaseMessagingType {
  if (!m) {
    throw Error(
      'react-native-firebase library is not installed. Please see https://rnfirebase.io/messaging/usage#installation for installation instructions',
    );
  }
  return !!m;
}

export function voipPushNotificationIsInstalled(
  v: VoipPushNotificationType | undefined,
): v is VoipPushNotificationType {
  if (!v) {
    throw Error(
      "react-native-voip-push-notification library is not installed. Please install it using 'yarn add react-native-voip-push-notification' or 'npm install react-native-voip-push-notification'",
    );
  }
  return !!v;
}

const defaultExport = {
  callkeep,
  messaging,
  notifee,
  voipPushNotification,
};

export default defaultExport;
