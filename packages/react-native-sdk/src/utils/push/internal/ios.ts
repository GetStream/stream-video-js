import { Platform } from 'react-native';
import { pushUnsubscriptionCallbacks } from './constants';
import { canListenToWS, shouldCallBeClosed } from './utils';
import { StreamVideoConfig } from '../../StreamVideoRN/types';
import { videoLoggerSystem } from '@stream-io/video-client';
import { getCallingxLib } from '../libs/callingx';

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
  const logger = videoLoggerSystem.getLogger(
    'callingx - onVoipNotificationReceived',
  );

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

  const callingx = getCallingxLib();
  if (callingx.isCallTracked(call_cid)) {
    //same call_cid is already tracked, so we skip the notification
    logger.debug(
      `the same call_cid ${call_cid} is already tracked, skipping the call.ring notification`,
    );
    return;
  }

  const client = await pushConfig.createStreamVideoClient();
  if (!client) {
    logger.debug(
      'client not found, not processing call.ring voip push notification',
    );
    return;
  }

  const callFromPush = await client.onRingingCall(call_cid);

  function closeCallIfNecessary() {
    const { mustEndCall, endCallReason } = shouldCallBeClosed(
      callFromPush,
      notification?.stream,
    );
    if (mustEndCall) {
      logger.debug(
        `callingx.endCallWithReason for call_cid: ${call_cid} endCallReason: ${endCallReason}`,
      );
      callingx.endCallWithReason(call_cid, endCallReason);
      return true;
    }
    return false;
  }

  const closed = closeCallIfNecessary();
  if (!closed && canListenToWS()) {
    const unsubscribe = callFromPush.on('all', (event) => {
      const _canListenToWS = canListenToWS();
      if (!_canListenToWS) {
        logger.debug(
          `unsubscribe due to event callCid: ${call_cid} canListenToWS: ${_canListenToWS}`,
          event,
        );
        unsubscribe();
        return;
      }
      const _closed = closeCallIfNecessary();
      if (_closed) {
        logger.debug(
          `unsubscribe due to event callCid: ${call_cid} canListenToWS: ${_canListenToWS} shouldCallBeClosed: ${_closed}`,
          event,
        );
        unsubscribe();
      }
    });

    pushUnsubscriptionCallbacks.get(call_cid)?.forEach((cb) => cb());
    pushUnsubscriptionCallbacks.set(call_cid, [unsubscribe]);
  }

  // callingx event listeners (setupCallingExpEvents) will handle accept/reject
  logger.debug(
    `call_cid:${call_cid} received and processed from call.ring push notification`,
  );
};
