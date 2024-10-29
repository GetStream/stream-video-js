import { Platform } from 'react-native';
import type { StreamVideoConfig } from '../StreamVideoRN/types';
import { pushNonRingingCallData$ } from './internal/rxSubjects';
import {
  ExpoNotification,
  getExpoNotificationsLib,
  getPushNotificationIosLib,
  PushNotificationiOSType,
} from './libs';
import { StreamVideoClient, getLogger } from '@stream-io/video-client';
import { setPushLogoutCallback } from '../internal/pushLogoutCallback';
import { EventType, Event } from '@notifee/react-native';
import { StreamVideoRN } from '../StreamVideoRN';
import { StreamPushPayload } from './utils';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

function processNonRingingNotificationStreamPayload(
  streamPayload: StreamPushPayload
) {
  if (
    streamPayload?.sender === 'stream.video' &&
    streamPayload?.type !== 'call.ring'
  ) {
    const cid = streamPayload.call_cid;
    const type = streamPayload.type;
    pushNonRingingCallData$.next({ cid, type });
    return { cid, type };
  }
}

export const oniOSExpoNotificationEvent = (event: ExpoNotification) => {
  const pushConfig = StreamVideoRN.getConfig().push;
  if (pushConfig) {
    if (event.request.trigger.type === 'push') {
      const streamPayload = event.request.trigger.payload
        ?.stream as StreamPushPayload;
      processNonRingingNotificationStreamPayload(streamPayload);
    }
  }
};

export const oniOSNotifeeEvent = ({
  event,
}: {
  event: Event;
  isBackground: boolean;
}) => {
  const pushConfig = StreamVideoRN.getConfig().push;
  const { type, detail } = event;
  if (pushConfig && type === EventType.PRESS) {
    const streamPayload = detail.notification?.data?.stream as
      | StreamPushPayload
      | undefined;
    const result = processNonRingingNotificationStreamPayload(streamPayload);
    if (result) {
      pushConfig.onTapNonRingingCallNotification?.(result.cid, result.type);
    }
  }
};

export function onPushNotificationiOSStreamVideoEvent(
  notification: PushNotificationiOSType
) {
  const pushNotificationIosLib = getPushNotificationIosLib();
  const data = notification.getData();
  const isClicked = data.userInteraction === 1;
  const pushConfig = StreamVideoRN.getConfig().push;
  if (!isClicked || !pushConfig) {
    notification.finish(pushNotificationIosLib.FetchResult.NoData);
    return;
  }
  const streamPayload = data?.stream as StreamPushPayload;
  // listen to foreground notifications
  const result = processNonRingingNotificationStreamPayload(streamPayload);
  if (result) {
    pushConfig.onTapNonRingingCallNotification?.(result.cid, result.type);
  }
  notification.finish(pushNotificationIosLib.FetchResult.NoData);
}

/** Send token to stream */
export async function initIosNonVoipToken(
  client: StreamVideoClient,
  pushConfig: PushConfig,
  setUnsubscribeListener: (unsubscribe: () => void) => void
) {
  if (
    Platform.OS !== 'ios' ||
    !pushConfig.ios.pushProviderName ||
    !pushConfig.onTapNonRingingCallNotification
  ) {
    return;
  }
  const setDeviceToken = async (token: string) => {
    setPushLogoutCallback(async () => {
      try {
        await client.removeDevice(token);
      } catch (err) {
        const logger = getLogger(['initIosNonVoipToken']);
        logger('warn', 'Failed to remove apn token from stream', err);
      }
    });
    const push_provider_name = pushConfig.ios.pushProviderName;
    await client.addDevice(token, 'apn', push_provider_name);
  };
  if (pushConfig.isExpo) {
    const expoNotificationsLib = getExpoNotificationsLib();
    expoNotificationsLib.getDevicePushTokenAsync().then((devicePushToken) => {
      setDeviceToken(devicePushToken.data);
    });
    const subscription = expoNotificationsLib.addPushTokenListener(
      (devicePushToken) => {
        setDeviceToken(devicePushToken.data);
      }
    );
    setUnsubscribeListener(() => {
      subscription.remove();
    });
  } else {
    const pushNotificationIosLib = getPushNotificationIosLib();
    pushNotificationIosLib.addEventListener('register', (token) => {
      setDeviceToken(token);
    });
    setUnsubscribeListener(() => {
      pushNotificationIosLib.removeEventListener('register');
    });
  }
}
