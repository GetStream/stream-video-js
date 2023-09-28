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
import { processCallFromPushInBackground } from './utils';
import { getExpoNotificationsLib } from './libs';
import { StreamVideoClient } from '@stream-io/video-client';
import { setPushLogoutCallback } from '../internal/pushLogoutCallback';
import notifee, { EventType } from '@notifee/react-native';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

export const iosCallkeepAcceptCall = (
  call_cid: string | undefined,
  callUUIDFromCallkeep: string,
) => {
  if (!shouldProcessCallFromCallkeep(call_cid, callUUIDFromCallkeep)) {
    return;
  }
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
  pushConfig: PushConfig,
) => {
  if (!shouldProcessCallFromCallkeep(call_cid, callUUIDFromCallkeep)) {
    return;
  }
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
  callUUIDFromCallkeep: string,
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
  if (pushConfig.isExpo) {
    const Notifications = getExpoNotificationsLib();

    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const streamPayload = detail.notification?.data?.stream as
          | { call_cid: string; type: string; sender: string }
          | undefined;
        if (streamPayload) {
          if (
            streamPayload.sender === 'stream.video' &&
            streamPayload.type !== 'call.ring'
          ) {
            const cid = streamPayload.call_cid;
            const _type = streamPayload.type as NonRingingPushEvent;
            pushNonRingingCallData$.next({ cid, type: _type });
            pushConfig.onTapNonRingingCallNotification?.(cid, _type);
          }
        }
      }
    });

    // foreground handler
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
  setUnsubscribeListener: (unsubscribe: () => void) => void,
) {
  if (Platform.OS !== 'ios') {
    return;
  }
  const setDeviceToken = async (token: string) => {
    setPushLogoutCallback(() => {
      client.removeDevice(token).catch((err) => {
        console.warn('Failed to remove voip token from stream', err);
      });
    });
    const push_provider_name = pushConfig.ios.pushProviderName;
    await client.addDevice(token, 'apn', push_provider_name);
  };
  if (pushConfig.isExpo) {
    const expoNotificationsLib = getExpoNotificationsLib();
    const subscription = expoNotificationsLib.addPushTokenListener(
      (devicePushToken) => {
        setDeviceToken(devicePushToken.data);
      },
    );
    const subscriptionForReceive =
      expoNotificationsLib.addNotificationReceivedListener((event) => {
        // listen to foreground notifications
        if (event.request.trigger.type === 'push') {
          const streamPayload = event.request.trigger.payload?.stream as
            | { call_cid: string; type: string; sender: string }
            | undefined;
          if (streamPayload) {
            if (
              streamPayload.sender === 'stream.video' &&
              streamPayload.type !== 'call.ring'
            ) {
              const cid = streamPayload.call_cid;
              const type = streamPayload.type as NonRingingPushEvent;
              pushNonRingingCallData$.next({ cid, type });
            }
          }
        }
      });
    setUnsubscribeListener(() => {
      subscription.remove();
      subscriptionForReceive.remove();
    });
  } else {
    // TODO: apn lib for ios
  }
}
