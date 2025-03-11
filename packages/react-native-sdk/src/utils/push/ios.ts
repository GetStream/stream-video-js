import { AppState, NativeModules, Platform } from 'react-native';
import type { StreamVideoConfig } from '../StreamVideoRN/types';
import {
  pushNonRingingCallData$,
  pushUnsubscriptionCallbacks$,
  voipPushNotificationCallCId$,
} from './internal/rxSubjects';
import {
  type ExpoNotification,
  getCallKeepLib,
  getExpoNotificationsLib,
  getNotifeeLibThrowIfNotInstalledForPush,
  getPushNotificationIosLib,
  getVoipPushNotificationLib,
  type PushNotificationiOSType,
} from './libs';
import { RxUtils, StreamVideoClient, getLogger } from '@stream-io/video-client';
import { setPushLogoutCallback } from '../internal/pushLogoutCallback';
import type { Event } from '@notifee/react-native';
import { StreamVideoRN } from '../StreamVideoRN';
import type { StreamPushPayload } from './utils';
import {
  shouldCallBeEnded,
  canAddPushWSSubscriptionsRef,
} from './internal/utils';

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
    const logger = getLogger(['processNonRingingNotificationStreamPayload']);
    logger('trace', `cid, type - ${cid}, ${type}`);
    pushNonRingingCallData$.next({ cid, type });
    return { cid, type };
  }
  return undefined;
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
      const logger = getLogger(['processNonRingingNotificationStreamPayload']);
      logger(
        'trace',
        `processNonRingingNotificationStreamPayload - ${JSON.stringify(streamPayload)}`
      );
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
      const logger = getLogger(['oniOSNotifeeEvent']);
      logger(
        'debug',
        `onTapNonRingingCallNotification?.(${result.cid}, ${result.type})`
      );
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
  const logger = getLogger(['onPushNotificationiOSStreamVideoEvent']);
  if (!streamPayload) {
    logger(
      'trace',
      `skipping process: no stream payload found in notification data - ${JSON.stringify(data)}`
    );
    return;
  }
  const isClicked = data.userInteraction === 1;
  const pushConfig = StreamVideoRN.getConfig().push;
  if (!isClicked || !pushConfig) {
    logger(
      'debug',
      `notification.finish called and returning - isClicked: ${isClicked}, pushConfig: ${!!pushConfig}`
    );
    notification.finish(pushNotificationIosLib.FetchResult.NoData);
    return;
  }
  // listen to foreground notifications
  const result = processNonRingingNotificationStreamPayload(streamPayload);
  if (result) {
    logger(
      'debug',
      `onTapNonRingingCallNotification?.(${result.cid}, ${result.type})`
    );
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

  const logger = getLogger(['initIosNonVoipToken']);
  const setDeviceToken = async (token: string) => {
    const userId = client.streamClient._user?.id ?? '';
    if (lastApnToken.token === token && lastApnToken.userId === userId) {
      logger(
        'debug',
        'Skipped sending device token to stream as it was already sent',
        token
      );
      return;
    }
    setPushLogoutCallback(async () => {
      lastApnToken = { token: '', userId: '' };
      try {
        logger('debug', 'Remove device token - setPushLogoutCallback', token);
        await client.removeDevice(token);
      } catch (err) {
        logger(
          'warn',
          'setPushLogoutCallback - Failed to remove apn token from stream',
          err
        );
      }
    });
    const push_provider_name = pushConfig.ios.pushProviderName;
    logger('debug', 'Add device token to stream', token);
    await client
      .addDevice(token, 'apn', push_provider_name)
      .then(() => {
        lastApnToken = { token, userId };
      })
      .catch((err) => {
        logger('warn', 'Failed to add apn token to stream', err);
      });
  };
  if (pushConfig.isExpo) {
    const expoNotificationsLib = getExpoNotificationsLib();
    expoNotificationsLib.getDevicePushTokenAsync().then((devicePushToken) => {
      logger(
        'debug',
        'Got device token - expoNotificationsLib.getDevicePushTokenAsync',
        devicePushToken.data
      );
      setDeviceToken(devicePushToken.data);
    });
    const subscription = expoNotificationsLib.addPushTokenListener(
      (devicePushToken) => {
        logger(
          'debug',
          'Got device token - expoNotificationsLib.addPushTokenListener',
          devicePushToken.data
        );
        setDeviceToken(devicePushToken.data);
      }
    );
    setUnsubscribeListener(() => {
      logger('debug', `removed expo addPushTokenListener`);
      subscription.remove();
    });
  } else {
    const pushNotificationIosLib = getPushNotificationIosLib();
    pushNotificationIosLib.addEventListener('register', (token) => {
      logger(
        'debug',
        `Got device token - pushNotificationIosLib.addEventListener('register')`,
        token
      );
      setDeviceToken(token);
    });
    setUnsubscribeListener(() => {
      logger('debug', `pushNotificationIosLib.removeEventListener('register')`);
      pushNotificationIosLib.removeEventListener('register');
    });
  }
}

export const onVoipNotificationReceived = async (notification: any) => {
  /* --- Example payload ---
  {
    "aps": {
      "alert": {
        "body": "",
        "title": "Vishal Narkhede is calling you"
      },
      "badge": 0,
      "category": "stream.video",
      "mutable-content": 1
    },
    "stream": {
      "call_cid": "default:ixbm7y0k74pbjnq",
      "call_display_name": "",
      "created_by_display_name": "Vishal Narkhede",
      "created_by_id": "vishalexpo",
      "receiver_id": "santhoshexpo",
      "sender": "stream.video",
      "type": "call.ring",
      "version": "v2"
    }
  } */
  const sender = notification?.stream?.sender;
  const type = notification?.stream?.type;
  // do not process any other notifications other than stream.video or ringing
  if (sender !== 'stream.video' && type !== 'call.ring') {
    return;
  }
  const call_cid = notification?.stream?.call_cid;
  const pushConfig = StreamVideoRN.getConfig().push;
  if (!call_cid || Platform.OS !== 'ios' || !pushConfig) {
    return;
  }
  const logger = getLogger(['setupIosVoipPushEvents']);
  const client = await pushConfig.createStreamVideoClient();
  if (!client) {
    logger(
      'debug',
      'client not found, not processing call.ring voip push notification'
    );
    return;
  }
  const callFromPush = await client.onRingingCall(call_cid);
  let uuid = '';
  try {
    uuid =
      await NativeModules?.StreamVideoReactNative?.getIncomingCallUUid(
        call_cid
      );
  } catch (error) {
    logger('error', 'Error in getting call uuid from native module', error);
  }
  if (!uuid) {
    logger(
      'error',
      `Not processing call.ring push notification, as no uuid found for call_cid: ${call_cid}`
    );
    return;
  }
  const created_by_id = notification?.stream?.created_by_id;
  const receiver_id = notification?.stream?.receiver_id;
  function closeCallIfNecessary() {
    const { mustEndCall, callkeepReason } = shouldCallBeEnded(
      callFromPush,
      created_by_id,
      receiver_id
    );
    if (mustEndCall) {
      const callkeep = getCallKeepLib();
      logger(
        'debug',
        `callkeep.reportEndCallWithUUID for uuid: ${uuid}, call_cid: ${call_cid}, reason: ${callkeepReason}`
      );
      callkeep.reportEndCallWithUUID(uuid, callkeepReason);
      const voipPushNotification = getVoipPushNotificationLib();
      voipPushNotification.onVoipNotificationCompleted(uuid);
      return true;
    }
    return false;
  }
  const closed = closeCallIfNecessary();
  const canListenToWS = () =>
    canAddPushWSSubscriptionsRef.current && AppState.currentState !== 'active';
  if (!closed && canListenToWS()) {
    const unsubscribe = callFromPush.on('all', (event) => {
      const _canListenToWS = canListenToWS();
      if (!_canListenToWS) {
        logger(
          'debug',
          `unsubscribe due to event callCid: ${call_cid} canListenToWS: ${_canListenToWS}`,
          event
        );
        unsubscribe();
        return;
      }
      const _closed = closeCallIfNecessary();
      if (_closed) {
        logger(
          'debug',
          `unsubscribe due to event callCid: ${call_cid} canListenToWS: ${_canListenToWS} shouldCallBeClosed: ${_closed}`,
          event
        );
        unsubscribe();
      }
    });
    const unsubscriptionCallbacks =
      RxUtils.getCurrentValue(pushUnsubscriptionCallbacks$) ?? [];
    pushUnsubscriptionCallbacks$.next([
      ...unsubscriptionCallbacks,
      unsubscribe,
    ]);
  }
  // send the info to this subject, it is listened by callkeep events
  // callkeep events will then accept/reject the call
  logger(
    'debug',
    `call_cid:${call_cid} uuid:${uuid} received and processed from call.ring push notification`
  );
  voipPushNotificationCallCId$.next(call_cid);
};
