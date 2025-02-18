import { useEffect } from 'react';
import {
  voipCallkeepCallOnForegroundMap$,
  voipPushNotificationCallCId$,
} from '../../utils/push/internal/rxSubjects';
import { getLogger, RxUtils } from '@stream-io/video-client';
import {
  getCallKeepLib,
  getVoipPushNotificationLib,
} from '../../utils/push/libs';
import { StreamVideoRN } from '../../utils/StreamVideoRN';
import type { StreamVideoConfig } from '../../utils/StreamVideoRN/types';
import {
  clearPushWSEventSubscriptions,
  processCallFromPushInBackground,
} from '../../utils/push/internal/utils';
import {
  pushAcceptedIncomingCallCId$,
  voipCallkeepAcceptedCallOnNativeDialerMap$,
} from '../../utils/push/internal/rxSubjects';
import { Platform } from 'react-native';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

const logger = getLogger(['useIosCallKeepEventsSetupEffect']);

/**
 * This hook is used to listen to callkeep events and do the necessary actions
 */
export const useIosCallKeepEventsSetupEffect = () => {
  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    if (Platform.OS !== 'ios' || !pushConfig) {
      return;
    }
    const callkeep = getCallKeepLib();

    const { remove: removeAnswerCall } = callkeep.addEventListener(
      'answerCall',
      ({ callUUID }) => {
        const call_cid = RxUtils.getCurrentValue(voipPushNotificationCallCId$);
        logger('debug', `answerCall event with call_cid: ${call_cid}`);
        iosCallkeepAcceptCall(call_cid, callUUID);
      }
    );
    const { remove: removeEndCall } = callkeep.addEventListener(
      'endCall',
      ({ callUUID }) => {
        const call_cid = RxUtils.getCurrentValue(voipPushNotificationCallCId$);
        logger('debug', `endCall event with call_cid: ${call_cid}`);
        iosCallkeepRejectCall(call_cid, callUUID, pushConfig);
      }
    );

    const { remove: removeDisplayIncomingCall } = callkeep.addEventListener(
      'didDisplayIncomingCall',
      ({ callUUID, payload }) => {
        const voipPushNotification = getVoipPushNotificationLib();
        // you might want to do following things when receiving this event:
        // - Start playing ringback if it is an outgoing call
        // @ts-expect-error
        const call_cid = payload?.call_cid as string | undefined;
        logger(
          'debug',
          `didDisplayIncomingCall event with callUUID: ${callUUID} call_cid: ${call_cid}`
        );
        if (call_cid) {
          voipCallkeepCallOnForegroundMap$.next({
            uuid: callUUID,
            cid: call_cid,
          });
        }
        voipPushNotification.onVoipNotificationCompleted(callUUID);
      }
    );

    return () => {
      removeAnswerCall();
      removeEndCall();
      removeDisplayIncomingCall();
    };
  }, []);
};

const iosCallkeepAcceptCall = (
  call_cid: string | undefined,
  callUUIDFromCallkeep: string
) => {
  if (!shouldProcessCallFromCallkeep(call_cid, callUUIDFromCallkeep)) {
    return;
  }
  clearPushWSEventSubscriptions();
  // to call end callkeep later if ended in app and not through callkeep
  voipCallkeepAcceptedCallOnNativeDialerMap$.next({
    uuid: callUUIDFromCallkeep,
    cid: call_cid,
  });
  // to process the call in the app
  pushAcceptedIncomingCallCId$.next(call_cid);
  // no need to keep these references anymore
  voipCallkeepCallOnForegroundMap$.next(undefined);
};

const iosCallkeepRejectCall = async (
  call_cid: string | undefined,
  callUUIDFromCallkeep: string,
  pushConfig: PushConfig
) => {
  if (!shouldProcessCallFromCallkeep(call_cid, callUUIDFromCallkeep)) {
    return;
  }
  clearPushWSEventSubscriptions();
  // no need to keep these references anymore
  voipCallkeepAcceptedCallOnNativeDialerMap$.next(undefined);
  voipCallkeepCallOnForegroundMap$.next(undefined);
  voipPushNotificationCallCId$.next(undefined);
  await processCallFromPushInBackground(pushConfig, call_cid, 'decline');
};

/**
 * Helper function to determine if the answer/end call event from callkeep must be processed
 * Just checks if we have a valid call_cid and acts as a type guard for call_cid
 */
const shouldProcessCallFromCallkeep = (
  call_cid: string | undefined,
  callUUIDFromCallkeep: string
): call_cid is string => {
  if (!call_cid || !callUUIDFromCallkeep) {
    return false;
  }
  return true;
};
