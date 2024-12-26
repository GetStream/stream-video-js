import type { Event } from '@notifee/react-native';
import { FirebaseMessagingTypes } from './libs/firebaseMessaging';
import { ExpoNotification } from './libs/expoNotifications';
import { NonRingingPushEvent } from '../StreamVideoRN/types';
import { PushNotificationiOSType } from './libs/iosPushNotification';
import {
  NotificationTrigger,
  PushNotificationTrigger,
} from 'expo-notifications';

export type StreamPushPayload =
  | {
      call_cid: string;
      type: 'call.ring' | NonRingingPushEvent;
      sender: string;
    }
  | undefined;

export function isFirebaseStreamVideoMessage(
  message: FirebaseMessagingTypes.RemoteMessage
) {
  return message.data?.sender === 'stream.video';
}

export function isNotifeeStreamVideoEvent(event: Event) {
  const { detail } = event;
  const { notification } = detail;
  return notification?.data?.sender === 'stream.video';
}

export function isExpoNotificationStreamVideoEvent(event: ExpoNotification) {
  const trigger = event.request.trigger;
  if (isPushNotification(trigger)) {
    // iOS
    const streamPayload = trigger.payload?.stream as StreamPushPayload;
    // Android
    const remoteMessageData = trigger.remoteMessage?.data;
    return (
      streamPayload?.sender === 'stream.video' ||
      remoteMessageData?.sender === 'stream.video'
    );
  }
}

export function isPushNotification(
  trigger: NotificationTrigger
): trigger is PushNotificationTrigger {
  return (
    typeof trigger === 'object' &&
    trigger !== null &&
    'type' in trigger &&
    (trigger as PushNotificationTrigger).type === 'push'
  );
}

export function isPushNotificationiOSStreamVideoEvent(
  notification: PushNotificationiOSType
) {
  const data = notification.getData();
  const streamPayload = data?.stream as StreamPushPayload;
  return streamPayload?.sender === 'stream.video';
}
