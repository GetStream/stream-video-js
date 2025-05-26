export type VoipPushNotificationType =
  typeof import('react-native-voip-push-notification').default;

let voipPushNotification: VoipPushNotificationType | undefined;

try {
  voipPushNotification = require('react-native-voip-push-notification').default;
} catch {}

export function getVoipPushNotificationLib() {
  if (!voipPushNotification) {
    throw Error(
      "react-native-voip-push-notification library is not installed. Please install it using 'yarn add react-native-voip-push-notification' or 'npm i react-native-voip-push-notification --save'",
    );
  }
  return voipPushNotification;
}
