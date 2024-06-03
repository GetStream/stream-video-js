export type ExpoTaskManagerLib = typeof import('expo-task-manager');

let expoTaskManagerLib: ExpoTaskManagerLib | undefined;

try {
  expoTaskManagerLib = require('expo-task-manager');
} catch (_e) {}

export function getExpoTaskManagerLib(): ExpoTaskManagerLib {
  if (!expoTaskManagerLib) {
    throw Error(
      'expo-task-manager library is not installed. Please see https://docs.expo.dev/versions/latest/sdk/task-manager/ for installation instructions'
    );
  }
  return expoTaskManagerLib;
}
