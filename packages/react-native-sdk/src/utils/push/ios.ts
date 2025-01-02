import { Platform } from 'react-native';
import type { StreamVideoConfig } from '../StreamVideoRN/types';
import { pushNonRingingCallData$ } from './internal/rxSubjects';
import {
  ExpoNotification,
  getExpoNotificationsLib,
  getNotifeeLibThrowIfNotInstalledForPush,
  getPushNotificationIosLib,
  PushNotificationiOSType,
} from './libs';
import { StreamVideoClient, getLogger } from '@stream-io/video-client';
import { setPushLogoutCallback } from '../internal/pushLogoutCallback';
import type { Event } from '@notifee/react-native';
import { StreamVideoRN } from '../StreamVideoRN';
import { StreamPushPayload } from './utils';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

let lastApnToken = { token: '', userId: '' };

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
    const trigger = event.request.trigger;
    if (
      trigger &&
      typeof trigger === 'object' &&
      'type' in trigger &&
      trigger.type === 'push' &&
      trigger.payload?.stream
    ) {
      const streamPayload = trigger.payload.stream as StreamPushPayload;
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
  if (Platform.OS !== 'ios') return;
  const pushConfig = StreamVideoRN.getConfig().push;
  const { type, detail } = event;
  const notifeeLib = getNotifeeLibThrowIfNotInstalledForPush();
  if (pushConfig && type === notifeeLib.EventType.PRESS) {
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
  const streamPayload = data?.stream as StreamPushPayload;
  const isClicked = data.userInteraction === 1;
  const pushConfig = StreamVideoRN.getConfig().push;
  if (!streamPayload || !isClicked || !pushConfig) {
    notification.finish(pushNotificationIosLib.FetchResult.NoData);
    return;
  }
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
    const userId = client.streamClient._user?.id ?? '';
    if (lastApnToken.token === token && lastApnToken.userId === userId) {
      return;
    }
    lastApnToken = { token, userId };
    setPushLogoutCallback(async () => {
      lastApnToken = { token: '', userId: '' };
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
