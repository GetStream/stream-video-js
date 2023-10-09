import { pushNonRingingCallData$ } from '../../utils/push/rxSubjects';
import { useEffect } from 'react';
import { StreamVideoRN } from '../../utils';
import {
  useConnectedUser,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { filter } from 'rxjs/operators';
import { processNonIncomingCallFromPush } from '../../utils/push/utils';

/**
 * This hook is used to process the non ringing call data via push notifications using the relevant rxjs subject
 * Note: this effect cannot work when push notifications are received when the app is in quit state or in other words when the client is not connected with a websocket.
 * So we essentially run this effect only when the client is connected with a websocket.
 */
export const useProcessPushNonRingingCallEffect = () => {
  const client = useStreamVideoClient();
  const connectedUserId = useConnectedUser()?.id;
  // The Effect to join/reject call automatically when incoming call was received and processed from push notification
  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    if (!pushConfig || !client || !connectedUserId) {
      return;
    }

    const subscription = pushNonRingingCallData$
      .pipe(filter(NotUndefined))
      .subscribe(async ({ cid, type }) => {
        await processNonIncomingCallFromPush(client, cid, type);
        pushNonRingingCallData$.next(undefined); // remove the current data to avoid processing again
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [client, connectedUserId]);
};

/**
 * A type guard to check if the data is not undefined
 */
function NotUndefined<T>(data: T | undefined): data is T {
  return data !== undefined;
}
