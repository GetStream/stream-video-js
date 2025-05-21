import {
  pushAcceptedIncomingCallCId$,
  pushAndroidBackgroundDeliveredIncomingCallCId$,
  pushRejectedIncomingCallCId$,
  pushTappedIncomingCallCId$,
} from '../../utils/push/internal/rxSubjects';
import { useEffect } from 'react';
import { StreamVideoRN } from '../../utils';
import {
  useConnectedUser,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { processCallFromPush } from '../../utils/push/internal/utils';
import { getLogger, StreamVideoClient } from '@stream-io/video-client';
import type { StreamVideoConfig } from '../../utils/StreamVideoRN/types';

/**
 * This hook is used to process the incoming call data via push notifications using the relevant rxjs subjects
 * It either joins or leaves the call based on the user's action.
 * Note: this effect cannot work when push notifications are received when the app is in quit state or in other words when the client is not connected with a websocket.
 * So we essentially run this effect only when the client is connected with a websocket.
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

    getLogger(['useProcessPushCallEffect'])(
      'debug',
      `Adding subscriptions to process incoming call from push notification`,
    );

    // if the user accepts the call from push notification we join the call
    const acceptedCallSubscription = createCallSubscription(
      pushAcceptedIncomingCallCId$,
      client,
      pushConfig,
      'accept',
    );

    // if the user rejects the call from push notification we leave the call
    const declinedCallSubscription = createCallSubscription(
      pushRejectedIncomingCallCId$,
      client,
      pushConfig,
      'decline',
    );

    // if the user taps the call from push notification we do nothing as the only thing is to get the call which adds it to the client
    const pressedCallSubscription = createCallSubscription(
      pushTappedIncomingCallCId$,
      client,
      pushConfig,
      'pressed',
    );

    const backgroundIncomingDeliveredCallSubscription = createCallSubscription(
      pushAndroidBackgroundDeliveredIncomingCallCId$,
      client,
      pushConfig,
      'backgroundDelivered',
    );

    return () => {
      acceptedCallSubscription.unsubscribe();
      declinedCallSubscription.unsubscribe();
      pressedCallSubscription.unsubscribe();
      backgroundIncomingDeliveredCallSubscription.unsubscribe();
    };
  }, [client, connectedUserId]);
};

/**
 * A type guard to check if the cid is not undefined
 */
function cidIsNotUndefined(cid: string | undefined): cid is string {
  return cid !== undefined;
}

/**
 * The common logic to create a subscription for the given call cid and action
 */
const createCallSubscription = (
  behaviourSubjectWithCallCid: BehaviorSubject<string | undefined>,
  client: StreamVideoClient,
  pushConfig: NonNullable<StreamVideoConfig['push']>,
  action: 'accept' | 'decline' | 'pressed' | 'backgroundDelivered',
) => {
  return behaviourSubjectWithCallCid
    .pipe(distinctUntilChanged(), filter(cidIsNotUndefined))
    .subscribe(async (callCId) => {
      getLogger(['useProcessPushCallEffect'])(
        'debug',
        `Processing call from push notification with action: ${action} and callCId: ${callCId}`,
      );
      await processCallFromPush(client, callCId, action, pushConfig);
      behaviourSubjectWithCallCid.next(undefined); // remove the current call id to avoid processing again
    });
};
