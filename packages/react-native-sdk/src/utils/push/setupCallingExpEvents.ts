import { pushAcceptedIncomingCallCId$ } from './internal/rxSubjects';
import { videoLoggerSystem } from '@stream-io/video-client';
import type { StreamVideoConfig } from '../StreamVideoRN/types';
import {
  clearPushWSEventSubscriptions,
  processCallFromPushInBackground,
} from './internal/utils';
import { setPushLogoutCallback } from '../internal/pushLogoutCallback';
import { getCallingxLib, type EventParams } from './libs/callingx';

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
  // const logger = videoLoggerSystem.getLogger('setupCallingExpEvents');

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

  //TODO: need to find cases where delayed events can appear
  // const events = callingx.getInitialEvents();
  // events.forEach((event: EventData) => {
  //   const { eventName, params } = event;
  //   if (eventName === 'didDisplayIncomingCall') {
  //     logger.debug(`[delayed] didDisplayIncomingCall event callId: ${params.callId}`);
  //   } else if (eventName === 'answerCall') {
  //     logger.debug(`[delayed] answerCall event callId: ${params.callId}`);
  //     callingExpAcceptCall(params);
  //   } else if (eventName === 'endCall') {
  //     logger.debug(`[delayed] endCall event callId: ${params.callId}`);
  //     callingExpRejectCall(pushConfig)(params);
  //   }
  // });

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
