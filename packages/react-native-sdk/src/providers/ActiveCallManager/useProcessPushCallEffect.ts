import { useCall } from '@stream-io/video-react-bindings';
import {
  pushAcceptedIncomingCallCId$,
  pushRejectedIncomingCallCId$,
} from '../../utils/push/rxSubjects';
import { useEffect } from 'react';
import { StreamVideoRN } from '../../utils';
/**
 * This hook is used to process the incoming call via push notifications.
 * It starts a foreground service to keep the call alive as soon as the call is joined
 * and stops the foreground Service when the call is left.
 */
export const useProcessPushCallEffect = () => {
  const activeCall = useCall();
  // The Effect to join/reject call automatically when incoming call was received and processed from push notification
  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    if (!pushConfig || !activeCall) {
      return;
    }
    const acceptedCallSubscription = pushAcceptedIncomingCallCId$.subscribe(
      (callCId) => {
        if (!activeCall || !callCId || activeCall.cid !== callCId) {
          return;
        }
        activeCall
          .join()
          .catch((e) =>
            console.log('failed to join call from push notification', e),
          );
        pushAcceptedIncomingCallCId$.next(undefined); // remove the current call id to avoid rejoining when coming back to this component
      },
    );
    const declinedCallSubscription = pushRejectedIncomingCallCId$.subscribe(
      (callCId) => {
        if (!activeCall || !callCId || activeCall.cid !== callCId) {
          return;
        }
        activeCall
          .leave({ reject: true })
          .catch((e) =>
            console.log('failed to reject call from push notification', e),
          );
        pushRejectedIncomingCallCId$.next(undefined); // remove the current call id to avoid rejoining when coming back to this component
      },
    );
    return () => {
      acceptedCallSubscription.unsubscribe();
      declinedCallSubscription.unsubscribe();
    };
  }, [activeCall]);
};
