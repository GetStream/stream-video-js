import { pushAcceptedIncomingCallCId$ } from './internal/rxSubjects';
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

/**
 * This hook is used to listen to callkeep events and do the necessary actions
 */
export function setupCallingExpEvents(pushConfig: NonNullable<PushConfig>) {
  const hasPushProvider =
    (Platform.OS === 'android' && pushConfig.android?.pushProviderName) ||
    (Platform.OS === 'ios' && pushConfig.ios?.pushProviderName);

  if (!hasPushProvider) {
    return;
  }

  const callingx = getCallingxLib();

  // Defined inside setupCallingExpEvents so closures capture `callingx`
  const onAcceptCall = ({
    callId: call_cid,
    source,
  }: EventParams['answerCall']) => {
    logger.debug(`onAcceptCall event callId: ${call_cid} source: ${source}`);

    if (source === 'app' || !call_cid) {
      // App initiated this action -- no downstream processing needed.
      // Fulfill immediately so CallKit completes the action.
      if (call_cid) {
        callingx.fulfillAnswerCallAction(call_cid, false);
      }
      return;
    }

    clearPushWSEventSubscriptions(call_cid);
    // Downstream: useProcessPushCallEffect subscribes, calls processCallFromPush('accept'),
    // and fulfills/fails the action after call.join() completes or errors.
    pushAcceptedIncomingCallCId$.next(call_cid);
  };

  const onEndCall = async ({
    callId: call_cid,
    source,
  }: EventParams['endCall']) => {
    logger.debug(`onEndCall event callId: ${call_cid} source: ${source}`);

    if (source === 'app' || !call_cid) {
      // App initiated this action -- fulfill immediately.
      if (call_cid) {
        callingx.fulfillEndCallAction(call_cid, false);
      }
      return;
    }

    clearPushWSEventSubscriptions(call_cid);
    const didFail = !(await processCallFromPushInBackground(
      pushConfig,
      call_cid,
      'decline',
    ));
    callingx.fulfillEndCallAction(call_cid, didFail);
  };

  const { remove: removeAnswerCall } = callingx.addEventListener(
    'answerCall',
    onAcceptCall,
  );
  const { remove: removeEndCall } = callingx.addEventListener(
    'endCall',
    onEndCall,
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
      onAcceptCall(params as EventParams['answerCall']);
    } else if (eventName === 'endCall') {
      logger.debug(`endCall delayed event callId: ${params?.callId}`);
      onEndCall(params as EventParams['endCall']);
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
