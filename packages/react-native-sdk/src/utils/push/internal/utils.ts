import {
  Call,
  CallingState,
  StreamVideoClient,
  videoLoggerSystem,
} from '@stream-io/video-client';
import type {
  NonRingingPushEvent,
  StreamVideoConfig,
} from '../../StreamVideoRN/types';
import { onNewCallNotification } from '../../internal/newNotificationCallbacks';
import { pushUnsubscriptionCallbacks } from './constants';
import { AppState } from 'react-native';
import type { EndCallReason } from '@stream-io/react-native-callingx';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

const logger = videoLoggerSystem.getLogger('callingx');
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
  const callSession = callFromPush.state.session;
  const rejected_by = callSession?.rejected_by;
  const accepted_by = callSession?.accepted_by;
  let mustEndCall = false;
  let endCallReason: EndCallReason = 'unknown';

  if (created_by_id && rejected_by) {
    if (rejected_by[created_by_id]) {
      // call was cancelled by the caller before the receiver could answer
      mustEndCall = true;
      endCallReason = 'canceled';
    }
  } else if (receiver_id && rejected_by) {
    if (rejected_by[receiver_id]) {
      // call was rejected by the receiver in some other device
      mustEndCall = true;
      endCallReason = 'rejected';
    }
  } else if (receiver_id && accepted_by) {
    if (accepted_by[receiver_id]) {
      // call was accepted by the receiver in some other device
      mustEndCall = true;
      endCallReason = 'answeredElsewhere';
    }
  }
  videoLoggerSystem
    .getLogger('shouldCallBeEnded')
    .debug(
      `callCid: ${callFromPush.cid} mustEndCall: ${mustEndCall} endCallReason: ${endCallReason}`,
    );
  return { mustEndCall, endCallReason };
};

/* An action for the notification or callkeep and app does not have JS context setup yet, so we need to do two steps:
  1. we need to create a new client and connect the user to decline the call
  2. this is because the app is in background state and we don't have a client to get the call and do an action
*/
export const processCallFromPushInBackground = async (
  pushConfig: PushConfig,
  call_cid: string,
  action: Parameters<typeof processCallFromPush>[1],
  /**
   * Callback to inform the app that the connection to the server was established
   * Needed for iOS CallKit fullfillment of action
   * as per ios docs "Instead, wait until you establish a connection and then fulfill the object."
   * This means we wait until call.get() is done and call.join() or call.leave() is invoked (not completed) to fulfill the action
   */
  onConnectionEstablishedToServer: (didFail: boolean) => void,
) => {
  let videoClient: StreamVideoClient | undefined;

  try {
    videoClient = await pushConfig.createStreamVideoClient();
    if (!videoClient) {
      throw new Error('createStreamVideoClient returned null');
    }
  } catch (e) {
    logger.error(
      'processCallFromPushInBackground: failed to create video client',
      e,
    );
    onConnectionEstablishedToServer(true);
    return;
  }

  try {
    const callFromPush = await videoClient.onRingingCall(call_cid);
    processCallFromPush(callFromPush, action, pushConfig);
    onConnectionEstablishedToServer(false);
  } catch (e) {
    logger.error(
      'processCallFromPushInBackground: failed to fetch call from push notification',
      e,
    );
    onConnectionEstablishedToServer(true);
  }
};

/**
 * This function is used process the call from push notifications due to incoming call
 * It does the following steps:
 * 1. Get the call from the client if present or create a new call
 * 2. Fetch the latest state of the call from the server if its not already in ringing state
 * 3. Join or leave the call based on the user's action.
 */
const processCallFromPush = async (
  callFromPush: Call,
  action: 'accept' | 'decline' | 'pressed' | 'backgroundDelivered',
  pushConfig: PushConfig,
) => {
  // note: when action was pressed or delivered, we dont need to do anything as the only thing is to do is to get the call which adds it to the client
  try {
    if (action === 'accept') {
      if (pushConfig.publishOptions) {
        callFromPush.updatePublishOptions(pushConfig.publishOptions);
      }
      logger.debug(
        `joining call from push notification with callCid: ${callFromPush.cid}`,
      );
      const callingState = callFromPush.state.callingState;
      if (
        callingState !== CallingState.RINGING &&
        callingState !== CallingState.IDLE
      ) {
        logger.debug(
          `skipping join call as it is not in ringing or idle state from push notification. callCid: ${callFromPush.cid}`,
        );
        return;
      }

      await callFromPush.join();
    } else if (action === 'decline') {
      const canReject =
        callFromPush.state.callingState === CallingState.RINGING ||
        callFromPush.state.callingState === CallingState.IDLE;
      logger.debug(
        `declining call from push notification with callCid: ${callFromPush.cid} reject: ${canReject}`,
      );
      await callFromPush.leave({ reject: canReject, reason: 'decline' });
    }
  } catch (e) {
    logger.warn(
      `processCallFromPush: failed to process ${action} call from push notification`,
      e,
    );
  }
};

/**
 * This function is used process the call from push notifications due to non ringing calls
 * It does the following steps:
 * 1. Get the call from the client if present or create a new call
 * 2. Fetch the latest state of the call from the server
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
      callFromPush = client.call(callType as string, callId as string);
      await callFromPush.get();
    }
  } catch (e) {
    const nonRingingCallLogger = videoLoggerSystem.getLogger(
      'processNonIncomingCallFromPush',
    );
    nonRingingCallLogger.error(
      'failed to fetch call from push notification',
      e,
    );
    return;
  }
  onNewCallNotification(callFromPush, nonRingingNotificationType);
};

/**
 * This function is used to clear all the push related WS subscriptions
 * note: events are subscribed in push for accept/decline through WS
 */
export const clearPushWSEventSubscriptions = (call_cid: string) => {
  const unsubscriptionCallbacks = pushUnsubscriptionCallbacks.get(call_cid);
  if (unsubscriptionCallbacks) {
    unsubscriptionCallbacks.forEach((cb) => cb());
    pushUnsubscriptionCallbacks.delete(call_cid);
  }
};

/**
 * This ref is used to check if the push WS subscriptions can be added
 * It is used to avoid adding the push WS subscriptions when the client is connected to WS in the foreground
 */
export const canAddPushWSSubscriptionsRef: CanAddPushWSSubscriptionsRef = {
  current: true,
};

export const canListenToWS = () =>
  canAddPushWSSubscriptionsRef.current && AppState.currentState !== 'active';

export const shouldCallBeClosed = (
  call: Call,
  pushData: { [key: string]: string | object },
) => {
  const created_by_id = pushData?.created_by_id as string;
  const receiver_id = pushData?.receiver_id as string;

  const { mustEndCall, endCallReason } = shouldCallBeEnded(
    call,
    created_by_id,
    receiver_id,
  );
  return { mustEndCall, endCallReason };
};
