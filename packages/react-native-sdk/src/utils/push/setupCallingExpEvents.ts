import { pushAcceptedIncomingCallCId$ } from './internal/rxSubjects';
import { videoLoggerSystem } from '@stream-io/video-client';
import type { StreamVideoConfig } from '../StreamVideoRN/types';
import {
  clearPushWSEventSubscriptions,
  processCallFromPushInBackground,
} from './internal/utils';
import { setPushLogoutCallback } from '../internal/pushLogoutCallback';

import { getCallingxLib, getCallingxLibIfAvailable } from './libs/callingx';

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
    callingExpAcceptCall,
  );
  const { remove: removeEndCall } = callingx.addEventListener(
    'endCall',
    callingExpRejectCall(pushConfig),
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
  });
}

const callingExpAcceptCall = ({ callId: call_cid }: { callId: string }) => {
  videoLoggerSystem
    .getLogger('callingExpAcceptCall')
    .debug(`callingExpAcceptCall event callId: ${call_cid}`);

  if (!call_cid) {
    getCallingxLibIfAvailable()?.log(
      `call_cid is undefined, so returning early`,
      'debug',
    );
    return;
  }

  clearPushWSEventSubscriptions(call_cid);
  // to process the call in the app
  pushAcceptedIncomingCallCId$.next(call_cid);
};

const callingExpRejectCall =
  (pushConfig: PushConfig) =>
  async ({ callId: call_cid }: { callId: string }) => {
    getCallingxLibIfAvailable()?.log(
      `callingExpRejectCall call_cid: ${call_cid}`,
      'debug',
    );
    videoLoggerSystem
      .getLogger('callingExpRejectCall')
      .debug(`call_cid: ${call_cid}`);

    if (!call_cid) {
      videoLoggerSystem
        .getLogger('callingExpRejectCall')
        .debug('call_cid is undefined, so returning early');
      return;
    }

    clearPushWSEventSubscriptions(call_cid);
    // remove the references if the call_cid matches

    videoLoggerSystem
      .getLogger('callingExpRejectCall')
      .debug(`ending call with call_cid: ${call_cid}`);
    await processCallFromPushInBackground(pushConfig, call_cid, 'decline');
  };
