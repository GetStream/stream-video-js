import { useEffect } from 'react';
import {
  voipCallkeepCallOnForegroundMap$,
  voipPushNotificationCallCId$,
} from '../../utils/push/rxSubjects';
import { RxUtils } from '@stream-io/video-client';
import {
  iosCallkeepAcceptCall,
  iosCallkeepRejectCall,
} from '../../utils/push/ios';
import { getCallKeepLib } from '../../utils/push/libs';
import { StreamVideoRN } from '../../utils';
import { Platform } from 'react-native';

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
        iosCallkeepAcceptCall(call_cid, callUUID);
      },
    );
    const { remove: removeEndCall } = callkeep.addEventListener(
      'endCall',
      ({ callUUID }) => {
        const call_cid = RxUtils.getCurrentValue(voipPushNotificationCallCId$);
        iosCallkeepRejectCall(call_cid, callUUID, pushConfig);
      },
    );

    const { remove: removeDisplayIncomingCall } = callkeep.addEventListener(
      'didDisplayIncomingCall',
      ({ callUUID, payload }) => {
        // you might want to do following things when receiving this event:
        // - Start playing ringback if it is an outgoing call
        // @ts-expect-error
        const call_cid = payload?.call_cid as string | undefined;
        if (!call_cid) {
          return;
        }
        voipCallkeepCallOnForegroundMap$.next({
          uuid: callUUID,
          cid: call_cid,
        });
      },
    );

    return () => {
      removeAnswerCall();
      removeEndCall();
      removeDisplayIncomingCall();
    };
  }, []);
};
