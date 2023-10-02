export type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
export type RNCallKeepType = typeof import('react-native-callkeep').default;
export type FirebaseMessagingType =
  typeof import('@react-native-firebase/messaging').default;
export type VoipPushNotificationType =
  typeof import('react-native-voip-push-notification').default;
export type ExpoNotificationsLib = typeof import('expo-notifications');
export type ExpoTaskManagerLib = typeof import('expo-task-manager');
export type PushNotificationIosLib =
  typeof import('@react-native-community/push-notification-ios').default;

let callkeep: RNCallKeepType | undefined;
let messaging: FirebaseMessagingType | undefined;
let voipPushNotification: VoipPushNotificationType | undefined;
let expoNotificationsLib: ExpoNotificationsLib | undefined;
let expoTaskManagerLib: ExpoTaskManagerLib | undefined;
let pushNotificationIosLib: PushNotificationIosLib | undefined;

try {
  callkeep = require('react-native-callkeep').default;
} catch (e) {}

try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (e) {}

try {
  voipPushNotification = require('react-native-voip-push-notification').default;
} catch (e) {}

try {
  expoNotificationsLib = require('expo-notifications');
} catch (e) {}

try {
  expoTaskManagerLib = require('expo-task-manager');
} catch (e) {}

try {
  pushNotificationIosLib =
    require('@react-native-community/push-notification-ios').default;
} catch (e) {}

export function getExpoNotificationsLib() {
  if (!expoNotificationsLib) {
    throw Error(
      'expo-notifications library is not installed. Please see https://docs.expo.dev/versions/latest/sdk/notifications/ for installation instructions',
    );
  }
  return expoNotificationsLib;
}

export function getExpoTaskManagerLib() {
  if (!expoTaskManagerLib) {
    throw Error(
      'expo-task-manager library is not installed. Please see https://docs.expo.dev/versions/latest/sdk/task-manager/ for installation instructions',
    );
  }
  return expoTaskManagerLib;
}

export function getPushNotificationIosLib() {
  if (!pushNotificationIosLib) {
    throw Error(
      '@react-native-community/push-notification-ios library is not installed. Please install it using "yarn add @react-native-community/push-notification-ios" or "npm i @react-native-community/push-notification-ios --save"',
    );
  }
  return pushNotificationIosLib;
}

export function getCallKeepLib() {
  if (!callkeep) {
    throw Error(
      'react-native-callkeep library is not installed. Please see https://github.com/react-native-webrtc/react-native-callkeep#Installation for installation instructions',
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
      "react-native-voip-push-notification library is not installed. Please install it using 'yarn add react-native-voip-push-notification' or 'npm i react-native-voip-push-notification --save'",
    );
  }
  return voipPushNotification;
}
