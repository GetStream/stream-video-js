import { getLogger } from '../../..';

export type NotifeeLib = typeof import('@notifee/react-native');

let notifeeLib: NotifeeLib | undefined;

try {
  notifeeLib = require('@notifee/react-native');
} catch (_e) {}

const INSTALLATION_INSTRUCTION =
  'Please see https://notifee.app/react-native/docs/installation for installation instructions';

export function getNotifeeLibThrowIfNotInstalledForPush() {
  if (!notifeeLib) {
    throw Error(
      '@notifee/react-native is not installed. It is required for implementing push notifications. ' +
        INSTALLATION_INSTRUCTION
    );
  }
  return notifeeLib;
}

export function getNotifeeLibNoThrowForKeepCallAlive() {
  if (!notifeeLib) {
    const logger = getLogger(['getNotifeeLibNoThrow']);
    logger(
      'info',
      `${'@notifee/react-native library not installed. It is required to keep call alive in the background for Android < 26. '}${INSTALLATION_INSTRUCTION}`
    );
  }
  return notifeeLib;
}
