import { pushAcceptedIncomingCallCId$ } from './internal/rxSubjects';
import { videoLoggerSystem } from '@stream-io/video-client';
import type { StreamVideoConfig } from '../StreamVideoRN/types';
import {
  clearPushWSEventSubscriptions,
  processCallFromPushInBackground,
} from './internal/utils';
import { setPushLogoutCallback } from '../internal/pushLogoutCallback';
import {
  getCallingxLib,
  type EventData,
  type EventParams,
} from './libs/callingx';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

/**
 * This hook is used to listen to callkeep events and do the necessary actions
 */
export function setupCallingExpEvents(pushConfig: NonNullable<PushConfig>) {
  if (
    !(pushConfig.android.pushProviderName && pushConfig.ios.pushProviderName)
  ) {
    return;
  }

  const callingx = getCallingxLib();

  const { remove: removeAnswerCall } = callingx.addEventListener(
    'answerCall',
    onAcceptCall,
  );
  const { remove: removeEndCall } = callingx.addEventListener(
    'endCall',
    onEndCall(pushConfig),
  );
  const { remove: removeDidActivateAudioSession } = callingx.addEventListener(
    'didActivateAudioSession',
    onDidActivateAudioSession,
  );
  const { remove: removeDidDeactivateAudioSession } = callingx.addEventListener(
    'didDeactivateAudioSession',
    onDidDeactivateAudioSession,
  );

  //NOTE: until getInitialEvents invocation, events are delayed and won't be sent to event listeners, this is a way to make sure none of required events are missed
  //in most cases there will be no delayed answers or ends, but it we don't want to miss any of them
  const events = callingx.getInitialEvents();
  events.forEach((event: EventData) => {
    const { eventName, params } = event;
    if (eventName === 'answerCall') {
      videoLoggerSystem
        .getLogger('setupCallingExpEvents')
        .debug(`answerCall delayed event callId: ${params?.callId}`);
      onAcceptCall(params as EventParams['answerCall']);
    } else if (eventName === 'endCall') {
      videoLoggerSystem
        .getLogger('setupCallingExpEvents')
        .debug(`endCall delayed event callId: ${params?.callId}`);
      onEndCall(pushConfig)(params as EventParams['endCall']);
    }
  });

  setPushLogoutCallback(async () => {
    removeAnswerCall();
    removeEndCall();
    removeDidActivateAudioSession();
    removeDidDeactivateAudioSession();
  });
}

const onAcceptCall = ({
  callId: call_cid,
  source,
}: EventParams['answerCall']) => {
  videoLoggerSystem
    .getLogger('callingExpAcceptCall')
    .debug(`callingExpAcceptCall event callId: ${call_cid} source: ${source}`);

  if (source === 'app' || !call_cid) {
    //we only need to process the call if the call was answered from the system
    return;
  }

  clearPushWSEventSubscriptions(call_cid);
  // to process the call in the app
  pushAcceptedIncomingCallCId$.next(call_cid);
};

const onEndCall =
  (pushConfig: PushConfig) =>
  async ({ callId: call_cid, source }: EventParams['endCall']) => {
    videoLoggerSystem
      .getLogger('callingExpRejectCall')
      .debug(
        `callingExpRejectCall event callId: ${call_cid} source: ${source}`,
      );

    if (source === 'app' || !call_cid) {
      //we only need to process the call if the call was rejected from the system
      return;
    }

    clearPushWSEventSubscriptions(call_cid);

    await processCallFromPushInBackground(pushConfig, call_cid, 'decline');
  };

const onDidActivateAudioSession = () => {
  //TODO: start audio session here
};

const onDidDeactivateAudioSession = () => {
  //TODO: end audio session here
};
