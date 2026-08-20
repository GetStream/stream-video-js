import {
  AllCallEvents,
  AllClientEventTypes,
  CallingState,
  StreamVideoClient,
} from '@stream-io/video-client';
import { AppState, Platform } from 'react-native';
import {
  type FirebaseMessagingTypes,
  getCallingxLib,
  getCallingxLibIfAvailable,
} from '../libs';
import { StreamVideoRN } from '../../StreamVideoRN';
import { pushUnsubscriptionCallbacks } from './constants';
import { canListenToWS, shouldCallBeClosed } from './utils';

/**
 * Handles a Stream Video `call.ring` push payload: connects the WS to watch the ringing call
 * and auto-dismisses it if it has already ended/been handled elsewhere. Non-ringing types are
 * ignored (their display is app responsibility). Android-only; a no-op on other platforms.
 */
export const onRingNotificationReceived = async (
  data: FirebaseMessagingTypes.RemoteMessage['data'],
) => {
  /* Example data from firebase
    "message": {
        "data": {
          call_cid: 'audio_room:dcc1638c-e90d-4dcb-bf3b-8fa7767bfbb0',
          call_display_name: '',
          created_by_display_name: 'tommaso',
          created_by_id: 'tommaso-03dcddb7-e9e2-42ec-b2f3-5043aac666ee',
          receiver_id: 'martin-21824f17-319b-401b-a61b-fcab646f0d3f',
          sender: 'stream.video',
          type: 'call.live_started',
          version: 'v2'
        },
        // other stuff
    }
  */
  if (Platform.OS !== 'android') return;

  const nativeLog = (
    message: string,
    level: 'debug' | 'info' | 'warn' | 'error' = 'debug',
  ) =>
    getCallingxLibIfAvailable()?.log(
      `[callingx - onRingNotificationReceived]: ${message}`,
      level,
    );

  const pushConfig = StreamVideoRN.getConfig().push;
  if (
    !pushConfig ||
    !data ||
    data.sender !== 'stream.video' ||
    data.type !== 'call.ring'
  ) {
    return;
  }

  const call_cid = data.call_cid as string;
  const callingx = getCallingxLib();

  if (pushUnsubscriptionCallbacks.has(call_cid)) {
    nativeLog(
      `call_cid ${call_cid} is already being watched, skipping the duplicate call.ring notification`,
    );
    return;
  }

  const asForegroundService = canListenToWS();
  const backgroundTaskOwner = `push:${call_cid}`;
  nativeLog(
    `call.ring for callCid: ${call_cid} asForegroundService=${asForegroundService}`,
  );

  const finishBackgroundTask = () => {
    nativeLog(`Finishing background task for callCid: ${call_cid}`);
    callingx.releaseBackgroundTask(backgroundTaskOwner);
  };

  if (asForegroundService) {
    // initialize the callback array immediately to avoid race condition
    pushUnsubscriptionCallbacks.set(call_cid, []);
    // The owner is added synchronously inside acquireBackgroundTask (before its own await), so it
    // is registered immediately even though we don't await the returned promise here.
    nativeLog(`acquiring background task for callCid: ${call_cid}`);
    callingx.acquireBackgroundTask(backgroundTaskOwner).catch((e) => {
      nativeLog(
        `Failed to acquire background task for callCid: ${call_cid} error: ${e}`,
        'error',
      );
    });
  }

  let client: StreamVideoClient | undefined;
  try {
    client = await pushConfig.createStreamVideoClient();
    if (!client) {
      nativeLog(`video client not found, skipping the call.ring notification`);
      if (asForegroundService) {
        finishBackgroundTask();
      }
      await callingx.stopService();
      pushUnsubscriptionCallbacks.delete(call_cid);
      return;
    }
  } catch (error) {
    //we need to release the background task and stop the service to avoid stale owner
    nativeLog(`Failed to create video client: ${error}`, 'error');
    if (asForegroundService) {
      finishBackgroundTask();
    }
    await callingx.stopService();
    pushUnsubscriptionCallbacks.delete(call_cid);
    return;
  }

  if (asForegroundService) {
    // Listen to call events from WS with the keep-alive headless task, bound to the call service.
    (async () => {
      try {
        nativeLog(`onRingingCall (fg service) for callCid: ${call_cid}`);
        const callFromPush = await client.onRingingCall(call_cid);
        const { mustEndCall, endCallReason } = shouldCallBeClosed(
          callFromPush,
          data,
        );
        if (mustEndCall) {
          nativeLog(
            `Closing fg service callCid: ${call_cid} endCallReason: ${endCallReason}`,
          );
          callingx.endCallWithReason(call_cid, endCallReason);
          callFromPush.leave({ reject: false }).catch((error) => {
            nativeLog(
              `Failed to leave already-ended ringing call ${call_cid}: ${error}`,
              'error',
            );
          });
          finishBackgroundTask();
          pushUnsubscriptionCallbacks.delete(call_cid);
          return;
        }

        // prevent subscriptions in case of call being left and subscriptions being already cleared
        const unsubscribeFunctions = pushUnsubscriptionCallbacks.get(call_cid);
        if (!unsubscribeFunctions) {
          nativeLog(
            `ring cancelled during onRingingCall for callCid: ${call_cid}, releasing background task`,
          );
          finishBackgroundTask();
          return;
        }
        nativeLog(`watching WS for ringing callCid: ${call_cid}`);
        // check if service needs to be closed if accept/decline event was done on another device
        const unsubscribe = callFromPush.on(
          'all',
          (event: AllCallEvents[AllClientEventTypes]) => {
            const _canListenToWS = canListenToWS();
            if (!_canListenToWS) {
              nativeLog(
                `Closing fg service from event ${event.type} callCid: ${call_cid} canListenToWS: ${_canListenToWS}`,
              );
              unsubscribeFunctions.forEach((fn) => fn());
              return;
            }

            const {
              mustEndCall: mustEndCallFromEvent,
              endCallReason: endCallReasonFromEvent,
            } = shouldCallBeClosed(callFromPush, data);
            if (mustEndCallFromEvent) {
              nativeLog(
                `Closing fg service from event ${event.type} callCid: ${call_cid} shouldCallBeClosed`,
              );
              callingx.endCallWithReason(call_cid, endCallReasonFromEvent);
              unsubscribeFunctions.forEach((fn) => fn());
            }
          },
        );

        // check if service needs to be closed if call was left
        const stateSubscription = callFromPush.state.callingState$.subscribe(
          (callingState) => {
            if (
              callingState === CallingState.IDLE ||
              callingState === CallingState.LEFT
            ) {
              nativeLog(
                `Closing fg service from callingState callCid: ${call_cid} callingState: ${callingState}`,
              );
              unsubscribeFunctions.forEach((fn) => fn());
            }
          },
        );

        //stop background task when app comes to foreground
        const appStateSubscription = AppState.addEventListener(
          'change',
          (nextAppState) => {
            const _canListenToWS = canListenToWS();
            nativeLog(
              `AppState changed to: ${nextAppState} for callCid: ${call_cid} canListenToWS: ${_canListenToWS}`,
            );
            if (!_canListenToWS) {
              unsubscribeFunctions.forEach((fn) => fn());
              return;
            }
          },
        );

        unsubscribeFunctions.push(unsubscribe);
        unsubscribeFunctions.push(() => stateSubscription.unsubscribe());
        unsubscribeFunctions.push(() => appStateSubscription.remove());
        unsubscribeFunctions.push(finishBackgroundTask);
        unsubscribeFunctions.push(() =>
          pushUnsubscriptionCallbacks.delete(call_cid),
        );
        nativeLog(`WS subscriptions registered for callCid: ${call_cid}`);
      } catch (error) {
        nativeLog(
          `Failed to start background task with callCid: ${call_cid} error: ${error}`,
          'error',
        );
        pushUnsubscriptionCallbacks.delete(call_cid);
        finishBackgroundTask();
      }
    })();
  }

  if (asForegroundService) {
    // no need to check if call has be closed as that will be handled by the fg service
    return;
  }

  nativeLog(`onRingingCall (foreground) for callCid: ${call_cid}`);
  const callFromPush = await client.onRingingCall(call_cid);

  const { mustEndCall, endCallReason } = shouldCallBeClosed(callFromPush, data);
  if (mustEndCall) {
    nativeLog(
      `Removing incoming call notification immediately with callCid: ${call_cid} as it should be closed`,
    );
    callingx.endCallWithReason(call_cid, endCallReason);
    callFromPush.leave({ reject: false }).catch((error) => {
      nativeLog(
        `Failed to leave already-ended ringing call ${call_cid}: ${error}`,
        'error',
      );
    });
  }
};
