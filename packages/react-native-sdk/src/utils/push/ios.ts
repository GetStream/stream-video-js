import { Platform } from 'react-native';
import type {
  NonRingingPushEvent,
  StreamVideoConfig,
} from '../StreamVideoRN/types';
import {
  pushAcceptedIncomingCallCId$,
  voipPushNotificationCallCId$,
  voipCallkeepCallOnForegroundMap$,
  voipCallkeepAcceptedCallOnNativeDialerMap$,
  pushNonRingingCallData$,
} from './rxSubjects';
import {
  clearPushWSEventSubscriptions,
  processCallFromPushInBackground,
} from './utils';
import {
  getExpoNotificationsLib,
  getNotifeeLibThrowIfNotInstalledForPush,
  getPushNotificationIosLib,
} from './libs';
import { StreamVideoClient, getLogger } from '@stream-io/video-client';
import { setPushLogoutCallback } from '../internal/pushLogoutCallback';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

type StreamPayload =
  | {
      call_cid: string;
      type: 'call.ring' | NonRingingPushEvent;
      sender: string;
    }
  | undefined;

let lastApnToken = { token: '', userId: '' };

function processNonRingingNotificationStreamPayload(
  streamPayload: StreamPayload
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

export const iosCallkeepAcceptCall = (
  call_cid: string | undefined,
  callUUIDFromCallkeep: string
) => {
  if (!shouldProcessCallFromCallkeep(call_cid, callUUIDFromCallkeep)) {
    return;
  }
  clearPushWSEventSubscriptions();
  // to call end callkeep later if ended in app and not through callkeep
  voipCallkeepAcceptedCallOnNativeDialerMap$.next({
    uuid: callUUIDFromCallkeep,
    cid: call_cid,
  });
  // to process the call in the app
  pushAcceptedIncomingCallCId$.next(call_cid);
  // no need to keep these references anymore
  voipCallkeepCallOnForegroundMap$.next(undefined);
};

export const iosCallkeepRejectCall = async (
  call_cid: string | undefined,
  callUUIDFromCallkeep: string,
  pushConfig: PushConfig
) => {
  if (!shouldProcessCallFromCallkeep(call_cid, callUUIDFromCallkeep)) {
    return;
  }
  clearPushWSEventSubscriptions();
  // no need to keep these references anymore
  voipCallkeepAcceptedCallOnNativeDialerMap$.next(undefined);
  voipCallkeepCallOnForegroundMap$.next(undefined);
  voipPushNotificationCallCId$.next(undefined);
  await processCallFromPushInBackground(pushConfig, call_cid, 'decline');
};

/**
 * Helper function to determine if the answer/end call event from callkeep must be processed
 * Just checks if we have a valid call_cid and acts as a type guard for call_cid
 */
const shouldProcessCallFromCallkeep = (
  call_cid: string | undefined,
  callUUIDFromCallkeep: string
): call_cid is string => {
  if (!call_cid || !callUUIDFromCallkeep) {
    return false;
  }
  return true;
};

export const setupRemoteNotificationsHandleriOS = (pushConfig: PushConfig) => {
  if (Platform.OS !== 'ios') {
    return;
  }
  const notifeeLib = getNotifeeLibThrowIfNotInstalledForPush();

  notifeeLib.default.onForegroundEvent(({ type, detail }) => {
    if (type === notifeeLib.EventType.PRESS) {
      const streamPayload = detail.notification?.data?.stream as
        | StreamPayload
        | undefined;
      const result = processNonRingingNotificationStreamPayload(streamPayload);
      if (result) {
        pushConfig.onTapNonRingingCallNotification?.(result.cid, result.type);
      }
    }
  });
  if (pushConfig.isExpo) {
    const Notifications = getExpoNotificationsLib();

    // foreground handler (just to show the notifications on foreground)
    Notifications.setNotificationHandler({
      handleNotification: async () => {
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        };
      },
    });
  }
};

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
    const subscriptionForReceive =
      expoNotificationsLib.addNotificationReceivedListener((event) => {
        // listen to foreground notifications
        if (event.request.trigger.type === 'push') {
          const streamPayload = event.request.trigger.payload
            ?.stream as StreamPayload;
          processNonRingingNotificationStreamPayload(streamPayload);
        }
      });
    setUnsubscribeListener(() => {
      subscription.remove();
      subscriptionForReceive.remove();
    });
  } else {
    const pushNotificationIosLib = getPushNotificationIosLib();
    pushNotificationIosLib.addEventListener('register', (token) => {
      setDeviceToken(token);
    });
    pushNotificationIosLib.addEventListener('notification', (notification) => {
      const data = notification.getData();
      const streamPayload = data?.stream as StreamPayload;
      // listen to foreground notifications
      processNonRingingNotificationStreamPayload(streamPayload);
      notification.finish(pushNotificationIosLib.FetchResult.NoData);
    });
    setUnsubscribeListener(() => {
      pushNotificationIosLib.removeEventListener('register');
      pushNotificationIosLib.removeEventListener('notification');
    });
  }
}
