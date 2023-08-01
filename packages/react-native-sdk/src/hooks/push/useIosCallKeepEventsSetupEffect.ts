import { useEffect } from 'react';
import { voipPushNotificationCallCId$ } from '../../utils/push/rxSubjects';
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

    callkeep.addEventListener('answerCall', ({ callUUID }) => {
      const call_cid = RxUtils.getCurrentValue(voipPushNotificationCallCId$);
      iosCallkeepAcceptCall(call_cid, callUUID);
    });
    callkeep.addEventListener('endCall', ({ callUUID }) => {
      const call_cid = RxUtils.getCurrentValue(voipPushNotificationCallCId$);
      iosCallkeepRejectCall(call_cid, callUUID, pushConfig);
    });

    callkeep.addEventListener(
      'didDisplayIncomingCall',
      ({
        error,
        callUUID,
        handle,
        localizedCallerName,
        hasVideo,
        fromPushKit,
        payload,
      }) => {
        // you might want to do following things when receiving this event:
        // - Start playing ringback if it is an outgoing call
        console.log('[didDisplayIncomingCall] ', { callUUID, payload });
      },
    );

    return () => {
      callkeep.removeEventListener('answerCall');
      callkeep.removeEventListener('endCall');
      callkeep.removeEventListener('didDisplayIncomingCall');
    };
  }, []);
};
