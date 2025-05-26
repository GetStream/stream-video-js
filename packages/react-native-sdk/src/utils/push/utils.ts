import type { Event } from '@notifee/react-native';
import type { FirebaseMessagingTypes } from './libs/firebaseMessaging';
import type { ExpoNotification } from './libs/expoNotifications';
import type { NonRingingPushEvent } from '../StreamVideoRN/types';
import type { PushNotificationiOSType } from './libs/iosPushNotification';

export type StreamPushPayload =
  | {
      call_cid: string;
      type: 'call.ring' | NonRingingPushEvent;
      sender: string;
    }
  | undefined;

export function isFirebaseStreamVideoMessage(
  message: FirebaseMessagingTypes.RemoteMessage,
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
  if (
    trigger &&
    typeof trigger === 'object' &&
    'type' in trigger &&
    trigger.type === 'push'
  ) {
    // iOS
    const streamPayload = trigger.payload?.stream as StreamPushPayload;
    // Android
    const remoteMessageData = trigger.remoteMessage?.data;
    return (
      streamPayload?.sender === 'stream.video' ||
      remoteMessageData?.sender === 'stream.video'
    );
  }
  return false;
}

export function isPushNotificationiOSStreamVideoEvent(
  notification: PushNotificationiOSType,
) {
  const data = notification.getData();
  const streamPayload = data?.stream as StreamPushPayload;
  return streamPayload?.sender === 'stream.video';
}
