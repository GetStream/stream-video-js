import { useEffect } from 'react';
import { getCallKeepLib } from '../../utils/push/libs';
import {
  pushAcceptedIncomingCallCId$,
  pushRejectedIncomingCallCId$,
} from '../../utils/push/rxSubjects';
import { Platform } from 'react-native';
import { StreamVideoRN } from '../../utils';

/**
 * This hook is used to listen to callkeep events and do the necessary actions
 */
export const useIosCallKeepEffect = () => {
  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    if (Platform.OS !== 'ios' || !pushConfig) {
      return;
    }
    const callkeep = getCallKeepLib();
    callkeep.addEventListener(
      'didReceiveStartCallAction',
      ({ handle, callUUID, name }) => {
        console.log('didReceiveStartCallAction', { handle, callUUID, name });
      },
    );
    callkeep.addEventListener('answerCall', ({ callUUID }) => {
      console.log('answerCall', { callUUID });
      callkeep.backToForeground();
      // close the dialer screen so that the app can be seen (only android needs this)
      // callkeep.endCall(callUUID);
      pushAcceptedIncomingCallCId$.next(callUUID);
      pushConfig.navigateAcceptCall();
    });
    callkeep.addEventListener('endCall', ({ callUUID }) => {
      if (callUUID) {
        callkeep.endCall(callUUID);
      }
      pushRejectedIncomingCallCId$.next(callUUID);
      console.log('endCall', { callUUID });
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
        console.log('didDisplayIncomingCall', {
          error,
          callUUID,
          handle,
          localizedCallerName,
          hasVideo,
          fromPushKit,
          payload,
        });
      },
    );
    callkeep.addEventListener(
      'didPerformSetMutedCallAction',
      ({ muted, callUUID }) => {
        console.log('didPerformSetMutedCallAction', { muted, callUUID });
      },
    );
    callkeep.addEventListener(
      'didToggleHoldCallAction',
      ({ hold, callUUID }) => {
        console.log('didToggleHoldCallAction', { hold, callUUID });
      },
    );
    callkeep.addEventListener(
      'didPerformDTMFAction',
      ({ digits, callUUID }) => {
        console.log('didPerformDTMFAction', { digits, callUUID });
      },
    );
    callkeep.addEventListener('didActivateAudioSession', () => {
      console.log('didActivateAudioSession');
    });
    callkeep.addEventListener('checkReachability', () => {
      /*
       * On Android when the application is in background, after a certain delay the OS will close every connection with informing about it. So we have to check if the application is reachable before making a call from the native phone application.
       */
      callkeep.setReachable();
    });

    return () => {
      callkeep.removeEventListener('didReceiveStartCallAction');
      callkeep.removeEventListener('answerCall');
      callkeep.removeEventListener('endCall');
      callkeep.removeEventListener('didDisplayIncomingCall');
      callkeep.removeEventListener('didPerformSetMutedCallAction');
      callkeep.removeEventListener('didToggleHoldCallAction');
      callkeep.removeEventListener('didPerformDTMFAction');
      callkeep.removeEventListener('didActivateAudioSession');
      callkeep.removeEventListener('checkReachability');
    };
  }, []);
};
