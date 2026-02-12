import { videoLoggerSystem } from '@stream-io/video-client';
import type { StreamVideoConfig } from '../StreamVideoRN/types';
import {
  clearPushWSEventSubscriptions,
  processCallFromPushInBackground,
} from './internal/utils';
import { setPushLogoutCallback } from '../internal/pushLogoutCallback';
import { resolvePendingAudioSession } from '../internal/callingx/audioSessionPromise';
import {
  getCallingxLib,
  type EventData,
  type EventParams,
} from './libs/callingx';
import { Platform } from 'react-native';
import { resolveDisplayIncomingCall } from '../internal/callingx/displayIncomingCallPromise';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

const logger = videoLoggerSystem.getLogger('callingx');

/**
 * Sets up callingx event listeners for handling call actions from the native calling UI.
 */
export function setupCallingExpEvents(pushConfig: NonNullable<PushConfig>) {
  const hasPushProvider =
    (Platform.OS === 'android' && pushConfig.android?.pushProviderName) ||
    (Platform.OS === 'ios' && pushConfig.ios?.pushProviderName);

  if (!hasPushProvider) {
    return;
  }

  const callingx = getCallingxLib();

  const { remove: removeAnswerCall } = callingx.addEventListener(
    'answerCall',
    (params) => {
      onAcceptCall(pushConfig)(params).catch((err) => {
        logger.error('Failed to process answerCall event', err);
      });
    },
  );

  const { remove: removeEndCall } = callingx.addEventListener(
    'endCall',
    (params) => {
      onEndCall(pushConfig)(params).catch((err) => {
        logger.error('Failed to process endCall event', err);
      });
    },
  );

  const { remove: removeDidActivateAudioSession } = callingx.addEventListener(
    'didActivateAudioSession',
    onDidActivateAudioSession,
  );
  const { remove: removeDidDeactivateAudioSession } = callingx.addEventListener(
    'didDeactivateAudioSession',
    onDidDeactivateAudioSession,
  );

  const { remove: removeDidDisplayIncomingCall } = callingx.addEventListener(
    'didDisplayIncomingCall',
    onDidDisplayIncomingCall,
  );

  //NOTE: until getInitialEvents invocation, events are delayed and won't be sent to event listeners, this is a way to make sure none of required events are missed
  //in most cases there will be no delayed answers or ends, but it we don't want to miss any of them
  const events = callingx.getInitialEvents();
  events.forEach((event: EventData) => {
    const { eventName, params } = event;
    if (eventName === 'answerCall') {
      logger.debug(`answerCall delayed event callId: ${params?.callId}`);
      onAcceptCall(pushConfig)(params as EventParams['answerCall']).catch(
        (err) => {
          logger.error('Failed to process delayed answerCall event', err);
        },
      );
    } else if (eventName === 'endCall') {
      logger.debug(`endCall delayed event callId: ${params?.callId}`);
      onEndCall(pushConfig)(params as EventParams['endCall']).catch((err) => {
        logger.error('Failed to process delayed endCall event', err);
      });
    } else if (eventName === 'didActivateAudioSession') {
      onDidActivateAudioSession();
    } else if (eventName === 'didDeactivateAudioSession') {
      onDidDeactivateAudioSession();
    } else if (eventName === 'didDisplayIncomingCall') {
      onDidDisplayIncomingCall();
    }
  });

  setPushLogoutCallback(async () => {
    removeAnswerCall();
    removeEndCall();
    removeDidActivateAudioSession();
    removeDidDeactivateAudioSession();
    removeDidDisplayIncomingCall();
  });
}

const onDidActivateAudioSession = () => {
  logger.debug('callingExpDidActivateAudioSession');
  resolvePendingAudioSession();
};

const onDidDeactivateAudioSession = () => {
  logger.debug('callingExpDidDeactivateAudioSession');
};

const onDidDisplayIncomingCall = () => {
  logger.debug('callingExpDidDisplayIncomingCall');
  resolveDisplayIncomingCall();
};

const onAcceptCall =
  (pushConfig: PushConfig) =>
  async ({ callId: call_cid, source }: EventParams['answerCall']) => {
    logger.debug(`onAcceptCall event callId: ${call_cid} source: ${source}`);

    if (source === 'app' || !call_cid) {
      //we only need to process the call if the call was answered from the system
      return;
    }

    clearPushWSEventSubscriptions(call_cid);
    // to process the call in the app
    await processCallFromPushInBackground(pushConfig, call_cid, 'accept');
  };

const onEndCall =
  (pushConfig: PushConfig) =>
  async ({ callId: call_cid, source }: EventParams['endCall']) => {
    logger.debug(`onEndCall event callId: ${call_cid} source: ${source}`);

    if (source === 'app' || !call_cid) {
      //we only need to process the call if the call was rejected from the system
      return;
    }

    clearPushWSEventSubscriptions(call_cid);

    await processCallFromPushInBackground(pushConfig, call_cid, 'decline');
  };
