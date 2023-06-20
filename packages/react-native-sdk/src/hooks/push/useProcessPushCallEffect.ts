import {
  pushAcceptedIncomingCallCId$,
  pushRejectedIncomingCallCId$,
} from '../../utils/push/rxSubjects';
import { useEffect } from 'react';
import { StreamVideoRN } from '../../utils';
import {
  useConnectedUser,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { filter } from 'rxjs/operators';
import { processCallFromPush } from '../../utils/push/utils';

/**
 * This hook is used to process the incoming call data via push notifications using the relevant rxjs subjects
 * It either joins or leaves the call based on the user's action.
 * Note: this effect cannot work when push notifications are received when the app is in quit state this is only if app is in background state
 */
export const useProcessPushCallEffect = () => {
  const client = useStreamVideoClient();
  const connectedUserId = useConnectedUser()?.id;
  // The Effect to join/reject call automatically when incoming call was received and processed from push notification
  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    if (!pushConfig || !client || !connectedUserId) {
      return;
    }

    // if the user accepts the call from push notification we join the call
    const acceptedCallSubscription = pushAcceptedIncomingCallCId$
      .pipe(filter(cidIsNotUndefined))
      .subscribe(async (callCId) => {
        await processCallFromPush(client, callCId, 'accept');
        pushAcceptedIncomingCallCId$.next(undefined); // remove the current call id to avoid processing again
      });
    // if the user rejects the call from push notification we leave the call
    const declinedCallSubscription = pushRejectedIncomingCallCId$
      .pipe(filter(cidIsNotUndefined))
      .subscribe(async (callCId) => {
        await processCallFromPush(client, callCId, 'decline');
        pushRejectedIncomingCallCId$.next(undefined); // remove the current call id to avoid processing again
      });
    return () => {
      acceptedCallSubscription.unsubscribe();
      declinedCallSubscription.unsubscribe();
    };
  }, [client, connectedUserId]);
};

/**
 * A type guard to check if the cid is not undefined
 */
function cidIsNotUndefined(cid: string | undefined): cid is string {
  return cid !== undefined;
}
