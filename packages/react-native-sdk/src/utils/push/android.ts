import {
  CallingState,
  StreamVideoClient,
  videoLoggerSystem,
} from '@stream-io/video-client';
import { AppState, Platform } from 'react-native';
import type { StreamVideoConfig } from '../StreamVideoRN/types';
import {
  type FirebaseMessagingTypes,
  getFirebaseMessagingLib,
  getFirebaseMessagingLibNoThrow,
} from './libs';
import { pushUnsubscriptionCallbacks } from './internal/constants';
import { canListenToWS, shouldCallBeClosed } from './internal/utils';
import { setPushLogoutCallback } from '../internal/pushLogoutCallback';
import { StreamVideoRN } from '../StreamVideoRN';
import { getCallingxLib } from './libs/callingx';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

let lastFirebaseToken = { token: '', userId: '' };

/** Send token to stream  */
export async function initAndroidPushToken(
  client: StreamVideoClient,
  pushConfig: PushConfig,
  setUnsubscribeListener: (unsubscribe: () => void) => void,
) {
  if (Platform.OS !== 'android' || !pushConfig.android.pushProviderName) {
    return;
  }
  const logger = videoLoggerSystem.getLogger('initAndroidPushToken');
  const setDeviceToken = async (token: string) => {
    const userId = client.streamClient._user?.id ?? '';
    if (client.streamClient.anonymous) {
      logger.debug('Skipped sending firebase token for anonymous user');
      return;
    }
    if (
      lastFirebaseToken.token === token &&
      lastFirebaseToken.userId === userId
    ) {
      logger.debug(
        `Skipping setting the same token again for userId: ${userId} and token: ${token}`,
      );
      return;
    }
    lastFirebaseToken = { token, userId };
    setPushLogoutCallback(async () => {
      lastFirebaseToken = { token: '', userId: '' };
      try {
        logger.debug(`Logout removeDeviceToken: ${token}`);
        await client.removeDevice(token);
      } catch (err) {
        logger.warn('Failed to remove firebase token from stream', err);
      }
    });
    const push_provider_name = pushConfig.android.pushProviderName;
    logger.debug(`sending firebase token: ${token} for userId: ${userId}`);
    await client.addDevice(token, 'firebase', push_provider_name);
  };

  const messaging = pushConfig.isExpo
    ? getFirebaseMessagingLibNoThrow(true)
    : getFirebaseMessagingLib();
  if (messaging) {
    logger.debug(`setting firebase token listeners`);
    const unsubscribe = messaging().onTokenRefresh((refreshedToken) =>
      setDeviceToken(refreshedToken),
    );
    setUnsubscribeListener(unsubscribe);
    const token = await messaging().getToken();
    await setDeviceToken(token);
  }
}

/**
 * Creates notification from the push message data.
 * For Ringing and Non-Ringing calls.
 */

export const firebaseDataHandler = async (
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

  const logger = videoLoggerSystem.getLogger('firebaseDataHandler');
  const pushConfig = StreamVideoRN.getConfig().push;
  if (!pushConfig || !data || data.sender !== 'stream.video') {
    return;
  }

  if (data.type === 'call.ring') {
    const call_cid = data.call_cid as string;
    const callingx = getCallingxLib();

    const client = await pushConfig.createStreamVideoClient();
    if (!client) {
      logger.debug(
        `video client not found, skipping the call.ring notification`,
      );
      await callingx.stopService();
      return;
    }

    const asForegroundService = canListenToWS();

    if (asForegroundService) {
      // Listen to call events from WS through fg service
      // note: this will replace the current empty fg service runner
      //we need to start service (e.g. by calling display incoming call) and than launch bg task, consider making those steps independent
      await callingx.startBackgroundTask((_: unknown, stopTask: () => void) => {
        return new Promise((resolve) => {
          const finishBackgroundTask = () => {
            callingx.log(
              `Finishing background task for callCid: ${call_cid}`,
              'debug',
            );
            resolve(undefined);
            stopTask();
          };

          (async () => {
            try {
              const _client = await pushConfig.createStreamVideoClient();
              if (!_client) {
                logger.debug(
                  `Closing fg service as there is no client to create from push config`,
                );
                finishBackgroundTask();
                return;
              }

              const callFromPush = await _client.onRingingCall(call_cid);
              const { mustEndCall, endCallReason } = shouldCallBeClosed(
                callFromPush,
                data,
              );
              if (mustEndCall) {
                logger.debug(
                  `Closing fg service callCid: ${call_cid} endCallReason: ${endCallReason}`,
                );

                callingx.log(
                  `Ending call with callCid: ${call_cid} endCallReason: ${endCallReason}`,
                  'debug',
                );
                callingx.endCallWithReason(call_cid, endCallReason);
                resolve(undefined);
                return;
              }

              const unsubscribeFunctions: Array<() => void> = [];
              // check if service needs to be closed if accept/decline event was done on another device
              const unsubscribe = callFromPush.on('all', (event) => {
                const _canListenToWS = canListenToWS();
                if (!_canListenToWS) {
                  logger.debug(
                    `Closing fg service from event callCid: ${call_cid} canListenToWS: ${_canListenToWS}`,
                    { event },
                  );
                  unsubscribeFunctions.forEach((fn) => fn());

                  finishBackgroundTask();
                  return;
                }

                const {
                  mustEndCall: mustEndCallFromEvent,
                  endCallReason: endCallReasonFromEvent,
                } = shouldCallBeClosed(callFromPush, data);
                if (mustEndCallFromEvent) {
                  logger.debug(
                    `Closing fg service from event callCid: ${call_cid} canListenToWS: ${_canListenToWS} shouldCallBeClosed`,
                    { event },
                  );
                  unsubscribeFunctions.forEach((fn) => fn());

                  callingx.endCallWithReason(call_cid, endCallReasonFromEvent);
                  resolve(undefined);
                }
              });

              // check if service needs to be closed if call was left
              const stateSubscription =
                callFromPush.state.callingState$.subscribe((callingState) => {
                  if (
                    callingState === CallingState.IDLE ||
                    callingState === CallingState.LEFT
                  ) {
                    logger.debug(
                      `Closing fg service from callingState callCid: ${call_cid} callingState: ${callingState}`,
                    );
                    unsubscribeFunctions.forEach((fn) => fn());
                    callingx.log(
                      `Ending call with callCid: ${call_cid} callingState: ${callingState}`,
                      'debug',
                    );
                    resolve(undefined);
                  }
                });

              const endCallSubscription = callingx.addEventListener(
                'endCall',
                async ({ callId }: { callId: string }) => {
                  unsubscribeFunctions.forEach((fn) => fn());
                  try {
                    await callFromPush.leave({
                      reject:
                        callFromPush.state.callingState ===
                        CallingState.RINGING,
                      reason: 'decline',
                    });
                  } catch (error) {
                    logger.error(
                      `Failed to leave call with callCid: ${call_cid} error: ${error}`,
                    );
                  } finally {
                    callingx.log(
                      `Ending call with callCid: ${call_cid} callId: ${callId}`,
                      'debug',
                    );
                    resolve(undefined);
                  }
                },
              );

              //stop background task when app comes to foreground
              const appStateSubscription = AppState.addEventListener(
                'change',
                (nextAppState) => {
                  const _canListenToWS = canListenToWS();
                  callingx.log(
                    `AppState changed to: ${nextAppState} for callCid: ${call_cid} canListenToWS: ${_canListenToWS}`,
                    'debug',
                  );
                  if (!_canListenToWS) {
                    unsubscribeFunctions.forEach((fn) => fn());
                    finishBackgroundTask();
                    return;
                  }
                },
              );

              unsubscribeFunctions.push(unsubscribe);
              unsubscribeFunctions.push(() => stateSubscription.unsubscribe());
              unsubscribeFunctions.push(() => endCallSubscription.remove());
              unsubscribeFunctions.push(() => appStateSubscription.remove());
              pushUnsubscriptionCallbacks.get(call_cid)?.forEach((cb) => cb());
              pushUnsubscriptionCallbacks.set(call_cid, unsubscribeFunctions);
            } catch (error) {
              callingx.log(
                `Failed to start background task with callCid: ${call_cid} error: ${error}`,
                'error',
              );
              finishBackgroundTask();
            }
          })();
        });
      });
    }

    if (asForegroundService) {
      // no need to check if call has be closed as that will be handled by the fg service
      return;
    }

    const callFromPush = await client.onRingingCall(call_cid);

    const { mustEndCall, endCallReason } = shouldCallBeClosed(
      callFromPush,
      data,
    );
    if (mustEndCall) {
      logger.debug(
        `Removing incoming call notification immediately with callCid: ${call_cid} as it should be closed`,
      );
      callingx.endCallWithReason(call_cid, endCallReason);
    }
  }
};
