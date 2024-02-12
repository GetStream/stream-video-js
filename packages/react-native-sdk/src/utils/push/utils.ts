import { Call, RxUtils, StreamVideoClient } from '@stream-io/video-client';
import type {
  NonRingingPushEvent,
  StreamVideoConfig,
} from '../StreamVideoRN/types';
import { onNewCallNotification } from '../internal/newNotificationCallbacks';
import { pushUnsubscriptionCallbacks$ } from './rxSubjects';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

type CanAddPushWSSubscriptionsRef = { current: boolean };

/**
 * This function is used to check if the call should be ended based on the push notification
 * Useful for callkeep management to end the call if necessary (with reportEndCallWithUUID)
 */
export const shouldCallBeEnded = (
  callFromPush: Call,
  created_by_id: string | undefined,
  receiver_id: string | undefined,
) => {
  /* callkeep reasons for ending a call
    FAILED: 1,
    REMOTE_ENDED: 2,
    UNANSWERED: 3,
    ANSWERED_ELSEWHERE: 4,
    DECLINED_ELSEWHERE: 5,
    MISSED: 6
  */
  const callSession = callFromPush.state.session;
  const rejected_by = callSession?.rejected_by;
  const accepted_by = callSession?.accepted_by;
  let mustEndCall = false;
  let callkeepReason = 0;
  if (created_by_id && rejected_by) {
    if (rejected_by[created_by_id]) {
      // call was cancelled by the caller
      mustEndCall = true;
      callkeepReason = 2;
    }
  } else if (receiver_id && rejected_by) {
    if (rejected_by[receiver_id]) {
      // call was rejected by the receiver in some other device
      mustEndCall = true;
      callkeepReason = 5;
    }
  } else if (receiver_id && accepted_by) {
    if (accepted_by[receiver_id]) {
      // call was accepted by the receiver in some other device
      mustEndCall = true;
      callkeepReason = 4;
    }
  }
  return { mustEndCall, callkeepReason };
};

/* An action for the notification or callkeep and app does not have JS context setup yet, so we need to do two steps:
  1. we need to create a new client and connect the user to decline the call
  2. this is because the app is in background state and we don't have a client to get the call and do an action
*/
export const processCallFromPushInBackground = async (
  pushConfig: PushConfig,
  call_cid: string,
  action: Parameters<typeof processCallFromPush>[2],
) => {
  let videoClient: StreamVideoClient | undefined;

  try {
    videoClient = await pushConfig.createStreamVideoClient();
    if (!videoClient) {
      return;
    }
  } catch (e) {
    console.log('failed to create video client and connect user', e);
    return;
  }
  await processCallFromPush(videoClient, call_cid, action);
};

/**
 * This function is used process the call from push notifications due to incoming call
 * It does the following steps:
 * 1. Get the call from the client if present or create a new call
 * 2. Fetch the latest state of the call from the server if its not already in ringing state
 * 3. Join or leave the call based on the user's action.
 */
export const processCallFromPush = async (
  client: StreamVideoClient,
  call_cid: string,
  action: 'accept' | 'decline' | 'pressed',
) => {
  let callFromPush: Call;
  try {
    callFromPush = await client.onRingingCall(call_cid);
  } catch (e) {
    console.log('failed to fetch call from push notification', e);
    return;
  }
  // note: when action was pressed, we dont need to do anything as the only thing is to do is to get the call which adds it to the client
  try {
    if (action === 'accept') {
      await callFromPush.join();
    } else if (action === 'decline') {
      await callFromPush.leave({ reject: true });
    }
  } catch (e) {
    console.log('failed to process call from push notification', e, action);
  }
};

/**
 * This function is used process the call from push notifications due to non ringing calls
 * It does the following steps:
 * 1. Get the call from the client if present or create a new call
 * 2. Fetch the latest state of the call from the server if its not already in ringing state
 * 3. Call all the callbacks to inform the app about the call
 */
export const processNonIncomingCallFromPush = async (
  client: StreamVideoClient,
  call_cid: string,
  nonRingingNotificationType: NonRingingPushEvent,
) => {
  let callFromPush: Call;
  try {
    const _callFromPush = client.state.calls.find((c) => c.cid === call_cid);
    if (_callFromPush) {
      callFromPush = _callFromPush;
    } else {
      // if not it means that WS is not alive when receiving the push notifications and we need to fetch the call
      const [callType, callId] = call_cid.split(':');
      callFromPush = client.call(callType, callId);
      await callFromPush.get();
    }
  } catch (e) {
    console.log('failed to fetch call from push notification', e);
    return;
  }
  onNewCallNotification(callFromPush, nonRingingNotificationType);
};

/**
 * This function is used to clear all the push related WS subscriptions
 * note: events are subscribed in push for accept/decline through WS
 */
export const clearPushWSEventSubscriptions = () => {
  const unsubscriptionCallbacks = RxUtils.getCurrentValue(
    pushUnsubscriptionCallbacks$,
  );
  if (unsubscriptionCallbacks) {
    unsubscriptionCallbacks.forEach((cb) => cb());
  }
  pushUnsubscriptionCallbacks$.next(undefined);
};

/**
 * This ref is used to check if the push WS subscriptions can be added
 * It is used to avoid adding the push WS subscriptions when the client is connected to WS in the foreground
 */
export const canAddPushWSSubscriptionsRef: CanAddPushWSSubscriptionsRef = {
  current: true,
};
