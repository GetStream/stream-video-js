// import { useCall } from '@stream-io/video-react-bindings';
import {
  pushAcceptedIncomingCallCId$,
  pushRejectedIncomingCallCId$,
} from '../../utils/push/rxSubjects';
import { useEffect } from 'react';
import { StreamVideoRN } from '../../utils';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import { StreamVideoClient } from '@stream-io/video-client';
import { filter } from 'rxjs/operators';

/**
 * This hook is used to process the incoming call data via push notifications.
 * It either joins or leaves the call based on the user's action.
 */
export const useProcessPushCallEffect = () => {
  const client = useStreamVideoClient();
  // The Effect to join/reject call automatically when incoming call was received and processed from push notification
  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    if (!pushConfig || !client) {
      return;
    }

    // if the user accepts the call from push notification we join the call
    const acceptedCallSubscription = pushAcceptedIncomingCallCId$
      .pipe(filter(cidIsNotUndefined))
      .subscribe(async (callCId) => {
        try {
          const activeCall = await getCall(client, callCId);
          await activeCall.join();
        } catch (e) {
          console.log('failed to join call from push notification', e);
        } finally {
          pushAcceptedIncomingCallCId$.next(undefined); // remove the current call id to avoid processing again
        }
      });
    // if the user rejects the call from push notification we leave the call
    const declinedCallSubscription = pushRejectedIncomingCallCId$
      .pipe(filter(cidIsNotUndefined))
      .subscribe(async (callCId) => {
        try {
          const activeCall = await getCall(client, callCId);
          await activeCall.leave({ reject: true });
        } catch (e) {
          console.log('failed to join call from push notification', e);
        } finally {
          pushRejectedIncomingCallCId$.next(undefined); // remove the current call id to avoid processing again
        }
      });
    return () => {
      acceptedCallSubscription.unsubscribe();
      declinedCallSubscription.unsubscribe();
    };
  }, [client]);
};

/**
 * This function is used to get the call from the client if present or create a new call
 * And then fetch the latest state of the call from the server if its not already in ringing state
 */
const getCall = async (client: StreamVideoClient, call_cid: string) => {
  const preExistingCall = client.readOnlyStateStore.calls.find(
    (call) => call.cid === call_cid,
  );
  // if the we find the call and is already ringing, we don't need to do anything
  // as client would have received the call.ring state because the app had WS alive when receiving push notifications
  if (preExistingCall?.ringing) {
    return preExistingCall;
  }
  // if not it means that WS is not alive when receiving the push notifications and we need to fetch the call
  const [callType, callId] = call_cid.split(':');
  const call = client.call(callType, callId, true);
  await call.get();
  return call;
};

/**
 * A type guard to check if the cid is not undefined
 */
function cidIsNotUndefined(cid: string | undefined): cid is string {
  return cid !== undefined;
}
