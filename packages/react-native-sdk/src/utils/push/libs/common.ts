export type RNCallKeepType = typeof import('react-native-callkeep').default;
export type VoipPushNotificationType =
  typeof import('react-native-voip-push-notification').default;

let callkeep: RNCallKeepType | undefined;
let voipPushNotification: VoipPushNotificationType | undefined;

try {
  voipPushNotification = require('react-native-voip-push-notification').default;
} catch (_e) {}

export function getCallKeepLib() {
  if (!callkeep) {
    throw Error(
      'react-native-callkeep library is not installed. Please see https://github.com/react-native-webrtc/react-native-callkeep#Installation for installation instructions',
    );
  }
  return callkeep;
}

export function getVoipPushNotificationLib() {
  if (!voipPushNotification) {
    throw Error(
      "react-native-voip-push-notification library is not installed. Please install it using 'yarn add react-native-voip-push-notification' or 'npm i react-native-voip-push-notification --save'",
    );
  }
  return voipPushNotification;
}
