import {
  CallingState,
  videoLoggerSystem,
  type StreamVideoClient,
} from '@stream-io/video-client';
import type { StreamVideoConfig } from '../StreamVideoRN/types';
import {
  clearPushWSEventSubscriptions,
  processCallFromPushInBackground,
} from './internal/utils';
import {
  getCallingxLib,
  type EventData,
  type EventParams,
} from './libs/callingx';
import { Platform } from 'react-native';
import { onRingNotificationReceived } from './internal/android';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

const logger = videoLoggerSystem.getLogger('callingx');

/**
 * Sets up callingx event listeners for handling call actions from the native calling UI.
 */
export function setupCallingExpEvents(pushConfig: NonNullable<PushConfig>) {
  const hasPushProvider =
    (Platform.OS === 'android' && pushConfig.android?.pushProviderName) ||
    (Platform.OS === 'ios' && pushConfig.ios?.pushProviderName);
  const hasOngoingCalls =
    (Platform.OS === 'android' && pushConfig.android?.enableOngoingCalls) ||
    (Platform.OS === 'ios' && pushConfig.ios?.enableOngoingCalls);

  if (!hasPushProvider && !hasOngoingCalls) {
    return;
  }

  const callingx = getCallingxLib();

  callingx.addEventListener('answerCall', (params) => {
    onAcceptCall(pushConfig)(params);
  });

  callingx.addEventListener('endCall', (params) => {
    onEndCall(pushConfig)(params);
  });

  callingx.addEventListener(
    'didActivateAudioSession',
    onDidActivateAudioSession,
  );
  callingx.addEventListener(
    'didDeactivateAudioSession',
    onDidDeactivateAudioSession,
  );

  callingx.addEventListener('providerReset', (params) => {
    onProviderReset(pushConfig)(params);
  });

  callingx.addEventListener('didReceiveStartCallIntent', (params) => {
    onStartCallIntent(pushConfig)(params);
  });

  //NOTE: until getInitialEvents invocation, events are delayed and won't be sent to event listeners, this is a way to make sure none of required events are missed
  //in most cases there will be no delayed answers or ends, but if so we don't want to miss any of them
  const events = callingx.getInitialEvents();
  events.forEach((event: EventData) => {
    const { eventName, params } = event;
    logger.debug(`${eventName} delayed event`);
    if (eventName === 'answerCall') {
      onAcceptCall(pushConfig)(params as EventParams['answerCall']);
    } else if (eventName === 'endCall') {
      onEndCall(pushConfig)(params as EventParams['endCall']);
    } else if (eventName === 'didActivateAudioSession') {
      onDidActivateAudioSession();
    } else if (eventName === 'didDeactivateAudioSession') {
      onDidDeactivateAudioSession();
    } else if (eventName === 'providerReset') {
      onProviderReset(pushConfig)(params as EventParams['providerReset']);
    } else if (eventName === 'didReceiveStartCallIntent') {
      onStartCallIntent(pushConfig)(
        params as EventParams['didReceiveStartCallIntent'],
      );
    } else if (eventName === 'ringCallPushReceived') {
      onRingNotificationReceived(params, pushConfig).catch((error) => {
        logger.error(`Error in onRingNotificationReceived: ${error}`);
      });
    }
  });
}

const onDidActivateAudioSession = () => {
  logger.debug('callingExpDidActivateAudioSession');
};

const onDidDeactivateAudioSession = () => {
  logger.debug('callingExpDidDeactivateAudioSession');
};

const onProviderReset =
  (pushConfig: PushConfig) =>
  async ({ callCids }: EventParams['providerReset']) => {
    logger.debug(`onProviderReset event callCids: ${callCids?.join(', ')}`);

    if (!callCids?.length) {
      return;
    }

    let videoClient: StreamVideoClient | undefined;
    try {
      videoClient = await pushConfig.createStreamVideoClient();
    } catch (e) {
      logger.error('onProviderReset: failed to resolve video client', e);
      return;
    }
    if (!videoClient) {
      return;
    }

    for (const cid of callCids) {
      const call = videoClient.state.calls.find((c) => c.cid === cid);
      if (call && call.state.callingState !== CallingState.LEFT) {
        call?.leave().catch((error: unknown) => {
          logger.error(`onProviderReset: error leaving call ${cid}`, error);
        });
      }
    }
  };

const generateCallId = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

/**
 * Recents redial (iOS): rings the user ids found in the handle of the start-call intent.
 */
export const onStartCallIntent =
  (pushConfig: PushConfig) =>
  async ({ handle, isVideo }: EventParams['didReceiveStartCallIntent']) => {
    logger.debug(`onStartCallIntent event handle: ${handle} video: ${isVideo}`);

    const callsHistory = pushConfig.ios?.callsHistory;
    if (Platform.OS !== 'ios' || !callsHistory?.enabled) {
      return;
    }

    try {
      const videoClient = await pushConfig.createStreamVideoClient();
      const currentUserId = videoClient?.state.connectedUser?.id;
      if (!videoClient || !currentUserId) {
        logger.debug('onStartCallIntent: no connected user, skipping redial');
        return;
      }

      const userIds = (handle ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0 && id !== currentUserId);
      if (userIds.length === 0) {
        return;
      }

      const call = videoClient.call(
        callsHistory.callType ?? 'default',
        generateCallId(),
      );
      await call.getOrCreate({
        ring: true,
        video: isVideo,
        data: {
          members: [currentUserId, ...userIds].map((user_id) => ({ user_id })),
        },
      });
    } catch (error) {
      logger.error('onStartCallIntent: failed to start the call', error);
    }
  };

const onAcceptCall =
  (pushConfig: PushConfig) =>
  ({ callId: call_cid, source }: EventParams['answerCall']) => {
    logger.debug(`onAcceptCall event call_cid: ${call_cid} source: ${source}`);

    if (source === 'app' || !call_cid) {
      // App-initiated actions are fulfilled on the native side immediately — nothing to do here
      return;
    }

    const callingx = getCallingxLib();
    clearPushWSEventSubscriptions(call_cid);
    processCallFromPushInBackground(
      pushConfig,
      call_cid,
      'accept',
      (didFail) => {
        callingx.fulfillAnswerCallAction(call_cid, didFail);
      },
    );
  };

const onEndCall =
  (pushConfig: PushConfig) =>
  ({ callId: call_cid, source }: EventParams['endCall']) => {
    logger.debug(`onEndCall event call_cid: ${call_cid} source: ${source}`);

    if (source === 'app' || !call_cid) {
      // App-initiated actions are fulfilled on the native side immediately — nothing to do here
      return;
    }

    const callingx = getCallingxLib();
    clearPushWSEventSubscriptions(call_cid);
    processCallFromPushInBackground(
      pushConfig,
      call_cid,
      'decline',
      (didFail) => {
        callingx.fulfillEndCallAction(call_cid, didFail);
      },
    );
  };
