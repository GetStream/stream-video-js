export type PushNotificationIosLib =
  typeof import('@react-native-community/push-notification-ios').default;

let pushNotificationIosLib: PushNotificationIosLib | undefined;

import type { PushNotification } from '@react-native-community/push-notification-ios';

export type PushNotificationiOSType = PushNotification;

try {
  pushNotificationIosLib =
    require('@react-native-community/push-notification-ios').default;
} catch (_e) {}

export function getPushNotificationIosLib() {
  if (!pushNotificationIosLib) {
    throw Error(
      '@react-native-community/push-notification-ios library is not installed. Please install it using "yarn add @react-native-community/push-notification-ios" or "npm i @react-native-community/push-notification-ios --save"'
    );
  }
  return pushNotificationIosLib;
}
