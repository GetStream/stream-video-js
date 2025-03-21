import { getLogger } from '@stream-io/video-client';
import type { Notification } from 'expo-notifications';

export type ExpoNotificationsLib = typeof import('expo-notifications');

export type ExpoNotification = Notification;

let expoNotificationsLib: ExpoNotificationsLib | undefined;

try {
  expoNotificationsLib = require('expo-notifications');
} catch {}

export function getExpoNotificationsLib() {
  if (!expoNotificationsLib) {
    throw Error(
      'expo-notifications library is not installed. Please see https://docs.expo.dev/versions/latest/sdk/notifications/ for installation instructions. It is required for non ringing push notifications.',
    );
  }
  return expoNotificationsLib;
}

export function getExpoNotificationsLibNoThrow() {
  if (!expoNotificationsLib) {
    getLogger(['getExpoNotificationsLibNoThrow'])(
      'debug',
      'expo-notifications library is not installed. It is required for non ringing push notifications and not for ringing',
    );
  }
  return expoNotificationsLib;
}
