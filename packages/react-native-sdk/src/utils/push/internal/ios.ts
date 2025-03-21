import { getLogger, RxUtils } from '@stream-io/video-client';
import { AppState, NativeModules, Platform } from 'react-native';
import { getCallKeepLib, getVoipPushNotificationLib } from '../libs';
import {
  pushUnsubscriptionCallbacks$,
  voipPushNotificationCallCId$,
} from './rxSubjects';
import { canAddPushWSSubscriptionsRef, shouldCallBeEnded } from './utils';
import { StreamVideoConfig } from '../../StreamVideoRN/types';

export const onVoipNotificationReceived = async (
  notification: any,
  pushConfig: NonNullable<StreamVideoConfig['push']>,
) => {
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
  if (!call_cid || Platform.OS !== 'ios' || !pushConfig.ios.pushProviderName) {
    return;
  }
  const logger = getLogger(['setupIosVoipPushEvents']);
  const client = await pushConfig.createStreamVideoClient();
  if (!client) {
    logger(
      'debug',
      'client not found, not processing call.ring voip push notification',
    );
    return;
  }
  const callFromPush = await client.onRingingCall(call_cid);
  let uuid = '';
  try {
    uuid =
      await NativeModules?.StreamVideoReactNative?.getIncomingCallUUid(
        call_cid,
      );
  } catch (error) {
    logger('error', 'Error in getting call uuid from native module', error);
  }
  if (!uuid) {
    logger(
      'error',
      `Not processing call.ring push notification, as no uuid found for call_cid: ${call_cid}`,
    );
    return;
  }
  const created_by_id = notification?.stream?.created_by_id;
  const receiver_id = notification?.stream?.receiver_id;
  function closeCallIfNecessary() {
    const { mustEndCall, callkeepReason } = shouldCallBeEnded(
      callFromPush,
      created_by_id,
      receiver_id,
    );
    if (mustEndCall) {
      const callkeep = getCallKeepLib();
      logger(
        'debug',
        `callkeep.reportEndCallWithUUID for uuid: ${uuid}, call_cid: ${call_cid}, reason: ${callkeepReason}`,
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
          event,
        );
        unsubscribe();
        return;
      }
      const _closed = closeCallIfNecessary();
      if (_closed) {
        logger(
          'debug',
          `unsubscribe due to event callCid: ${call_cid} canListenToWS: ${_canListenToWS} shouldCallBeClosed: ${_closed}`,
          event,
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
    `call_cid:${call_cid} uuid:${uuid} received and processed from call.ring push notification`,
  );
  voipPushNotificationCallCId$.next(call_cid);
};
