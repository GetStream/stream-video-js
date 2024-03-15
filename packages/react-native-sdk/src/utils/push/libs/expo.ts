export type ExpoNotificationsLib = typeof import('expo-notifications');
export type ExpoTaskManagerLib = typeof import('expo-task-manager');

let expoNotificationsLib: ExpoNotificationsLib | undefined;
let expoTaskManagerLib: ExpoTaskManagerLib | undefined;

try {
  expoNotificationsLib = require('expo-notifications');
} catch (_e) {}
try {
  expoTaskManagerLib = require('expo-task-manager');
} catch (_e) {}

export function getExpoNotificationsLib() {
  if (!expoNotificationsLib) {
    throw Error(
      'expo-notifications library is not installed. Please see https://docs.expo.dev/versions/latest/sdk/notifications/ for installation instructions',
    );
  }
  return expoNotificationsLib;
}

export function getExpoTaskManagerLib(): ExpoTaskManagerLib {
  if (!expoTaskManagerLib) {
    throw Error(
      'expo-task-manager library is not installed. Please see https://docs.expo.dev/versions/latest/sdk/task-manager/ for installation instructions',
    );
  }
  return expoTaskManagerLib;
}
