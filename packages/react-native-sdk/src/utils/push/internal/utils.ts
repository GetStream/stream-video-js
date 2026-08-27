import {
  Call,
  CallingState,
  StreamVideoClient,
  videoLoggerSystem,
} from '@stream-io/video-client';
import type { StreamVideoConfig } from '../../StreamVideoRN/types';
import { pushUnsubscriptionCallbacks } from './constants';
import { AppState } from 'react-native';
import type { EndCallReason } from '@stream-io/react-native-callingx';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

const logger = videoLoggerSystem.getLogger('callingx');
type CanAddPushWSSubscriptionsRef = { current: boolean };

/**
 * How long `onBeforeCallJoin` may take before it is treated as failed.
 *
 * The hook runs inside the CallKit accept, which iOS gives a hard deadline of
 * roughly 30s before killing the app. Failing well short of that leaves room to
 * report the failure and end the native call cleanly, and a hook that legitimately
 * needs longer than this does not belong on the accept path at all.
 */
const ON_BEFORE_CALL_JOIN_TIMEOUT_MS = 5_000;

/**
 * Runs the app's `onBeforeCallJoin` hook, if any, bounded by a timeout.
 *
 * Rejects when the hook rejects or outruns the timeout. Callers must treat that as
 * fail-closed and skip the join: the hook is where a call gets its E2EE manager, and
 * joining without one would publish unencrypted media on a call the user believes is
 * private, with no UI on this path to reveal it.
 */
const runOnBeforeCallJoin = async (
  pushConfig: PushConfig,
  call: Call,
): Promise<void> => {
  if (!pushConfig.onBeforeCallJoin) {
    return;
  }
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      pushConfig.onBeforeCallJoin(call),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new Error(
                `onBeforeCallJoin did not settle within ${ON_BEFORE_CALL_JOIN_TIMEOUT_MS}ms`,
              ),
            ),
          ON_BEFORE_CALL_JOIN_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Calls the app's `onAfterCallLeave` hook once the call has left.
 *
 * Nothing is gated on it, so a sync throw and an async rejection are both merely
 * logged - but they are logged rather than escaping, since an unhandled rejection
 * here would surface as unrelated-looking noise far from its cause.
 */
const notifyAfterCallLeave = (pushConfig: PushConfig, call: Call): void => {
  if (!pushConfig.onAfterCallLeave) {
    return;
  }
  try {
    Promise.resolve(pushConfig.onAfterCallLeave(call)).catch((e) => {
      logger.warn(`onAfterCallLeave failed for callCid: ${call.cid}`, e);
    });
  } catch (e) {
    logger.warn(`onAfterCallLeave threw for callCid: ${call.cid}`, e);
  }
};

/**
 * Fires `onAfterCallLeave` the first time the call reaches LEFT.
 *
 * Deliberately driven off the call's own state rather than wired into each place
 * that ends a call - there are several (decline here, the iOS close-condition
 * watcher, the Android endCall listener) and a per-site hook would silently skip
 * whichever one was missed. Resources the app releases here, an E2EE manager above
 * all, have no other cleanup on this path: the call can end while the app is still
 * in the background, so no React unmount ever runs.
 */
const notifyAfterCallLeaveOnce = (
  pushConfig: PushConfig,
  call: Call,
):
  | {
      unsubscribe: () => void;
      /**
       * Fires the hook immediately, for the case where the call is finished with
       * without ever reaching LEFT - a join that throws after the pre-join hook
       * already ran, whose resources would otherwise never be released.
       */
      notifyNow: () => void;
    }
  | undefined => {
  if (!pushConfig.onAfterCallLeave) {
    return undefined;
  }
  let notified = false;
  const notifyOnce = () => {
    if (notified) {
      return;
    }
    notified = true;
    notifyAfterCallLeave(pushConfig, call);
  };
  const subscription = call.state.callingState$.subscribe((callingState) => {
    if (callingState === CallingState.LEFT) {
      notifyOnce();
    }
  });
  return {
    unsubscribe: () => subscription.unsubscribe(),
    notifyNow: notifyOnce,
  };
};

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

  if (callFromPush.state.endedAt) {
    mustEndCall = true;
    endCallReason = 'remote';
  } else if (created_by_id && rejected_by) {
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
  action: 'accept' | 'decline' | 'pressed' | 'backgroundDelivered',
  /**
   * Callback to inform iOS CallKit that the action can be fulfilled
   * Needed for iOS CallKit fullfillment of action
   * as per ios docs "Instead, wait until you establish a connection and then fulfill the object."
   * This means we wait until call.get() is done and call.join() or call.leave() is invoked (not completed) to fulfill the action
   */
  onIOSActionCanBeFulfilled: (didFail: boolean) => void,
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
    onIOSActionCanBeFulfilled(true);
    return;
  }

  let callFromPush: Call;
  try {
    callFromPush = await videoClient.onRingingCall(call_cid);
  } catch (e) {
    logger.error(
      'processCallFromPushInBackground: failed to fetch call from push notification',
      e,
    );
    onIOSActionCanBeFulfilled(true);
    return;
  }
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
      onIOSActionCanBeFulfilled(true);
      return;
    }
    // Fail closed: the join is the point of no return for per-call setup, so a hook
    // that throws or stalls aborts it rather than proceeding without whatever it was
    // meant to install.
    try {
      await runOnBeforeCallJoin(pushConfig, callFromPush);
    } catch (e) {
      logger.error(
        `processCallFromPushInBackground: onBeforeCallJoin failed, not joining callCid: ${callFromPush.cid}`,
        e,
      );
      onIOSActionCanBeFulfilled(true);
      return;
    }
    const afterCallLeave = notifyAfterCallLeaveOnce(pushConfig, callFromPush);
    if (afterCallLeave) {
      pushUnsubscriptionCallbacks.set(call_cid, [
        ...(pushUnsubscriptionCallbacks.get(call_cid) ?? []),
        afterCallLeave.unsubscribe,
      ]);
    }
    try {
      onIOSActionCanBeFulfilled(false);
      await callFromPush.join();
    } catch (e) {
      logger.warn(
        'processCallFromPushInBackground: failed to join call from push notification',
        e,
      );
      // The pre-join hook already ran, so anything it installed is live on a call
      // that will never join and may never reach LEFT. Release it here.
      afterCallLeave?.notifyNow();
    }
  } else if (action === 'decline') {
    const alreadyLeft = callFromPush.state.callingState === CallingState.LEFT;
    if (alreadyLeft) {
      onIOSActionCanBeFulfilled(false);
      return;
    }
    const canReject =
      callFromPush.state.callingState === CallingState.RINGING ||
      callFromPush.state.callingState === CallingState.IDLE;
    const isCurrentUserMember = callFromPush.state.members.some(
      (member) => member.user_id === callFromPush.currentUserId,
    );
    const reject = canReject && isCurrentUserMember;
    logger.debug(
      `declining call from push notification with callCid: ${callFromPush.cid} reject: ${reject}`,
    );
    try {
      await callFromPush.leave({ reject, reason: 'decline' });
      onIOSActionCanBeFulfilled(false);
    } catch (e) {
      logger.warn(
        'processCallFromPushInBackground: failed to decline call from push notification',
        e,
      );
      onIOSActionCanBeFulfilled(true);
    }
  }
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
