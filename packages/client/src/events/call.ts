import { CallingState } from '../store';
import { Call } from '../Call';
import {
  CallAcceptedEvent,
  CallRejectedEvent,
  GetCallRingStateResponse,
  OwnCapability,
} from '../gen/coordinator';
import type { CallLeaveOptions } from '../types';
import { CallEnded } from '../gen/video/sfu/event/events';
import { CallEndedReason } from '../gen/video/sfu/models/models';

/**
 * Event handler that watched the delivery of `call.accepted`.
 * Once the event is received, the call is joined.
 */
export const watchCallAccepted = (call: Call) => {
  return async function onCallAccepted(event: CallAcceptedEvent) {
    // We want to discard the event if it's from the current user
    if (event.user.id === call.currentUserId) return;
    const { state } = call;
    if (
      event.call.created_by.id === call.currentUserId &&
      state.callingState === CallingState.RINGING
    ) {
      await call.join();
    }
  };
};

/**
 * Event handler that watches delivery of `call.rejected` Websocket event.
 * Once the event is received, the call is left.
 */
export const watchCallRejected = (call: Call) => {
  return async function onCallRejected(event: CallRejectedEvent) {
    // We want to discard the event if it's from the current user
    if (event.user.id === call.currentUserId) return;
    const { call: eventCall } = event;
    const { session: callSession } = eventCall;

    if (!callSession) {
      call.logger.warn(
        'No call session provided. Ignoring call.rejected event.',
        event,
      );
      return;
    }

    const rejectedBy = callSession.rejected_by;
    const { members, callingState } = call.state;
    if (callingState !== CallingState.RINGING) {
      call.logger.info(
        'Call is not in ringing mode (it is either accepted or rejected already). Ignoring call.rejected event.',
        event,
      );
      return;
    }
    if (call.isCreatedByMe) {
      const everyoneElseRejected = members
        .filter((m) => m.user_id !== call.currentUserId)
        .every((m) => rejectedBy[m.user_id]);
      if (everyoneElseRejected) {
        call.logger.info('everyone rejected, leaving the call');
        await call.leave({
          reject: true,
          reason: 'cancel',
          message: 'ring: everyone rejected',
        });
      }
    } else {
      if (rejectedBy[eventCall.created_by.id]) {
        call.logger.info('call creator rejected, leaving call');
        globalThis.streamRNVideoSDK?.callingX?.endCall(call, 'remote');
        await call.leave({ message: 'ring: creator rejected' });
      }
    }
  };
};

/**
 * Applies a polled ring state to a ringing call, taking the same decisions as
 * {@link watchCallAccepted}, {@link watchCallRejected} and the auto-drop.
 *
 * @param call the call to reconcile.
 * @param ringState the ring state as returned by the coordinator.
 * @returns whether the ring reached a terminal state.
 */
export const reconcileRingState = async (
  call: Call,
  ringState: GetCallRingStateResponse,
): Promise<boolean> => {
  // the outcome is already known
  if (call.state.callingState !== CallingState.RINGING) return true;

  call.state.updateFromRingState(ringState);

  const leave = async (options: CallLeaveOptions) => {
    await call.leave(options).catch((err) => {
      call.logger.error('Failed to leave the call after reconciling', err);
    });
  };

  // checked before `accepted_by`: an ended session cannot be joined
  if (ringState.call_ended_at || ringState.session_ended_at) {
    call.logger.info('ring state: the call has ended, leaving');
    globalThis.streamRNVideoSDK?.callingX?.endCall(call, 'remote');
    await leave({ reject: false, message: 'ring: reconciled - call ended' });
    return true;
  }

  const currentUserId = call.currentUserId;
  const acceptedByOther = Object.keys(ringState.accepted_by).some(
    (userId) => userId !== currentUserId,
  );
  if (acceptedByOther) {
    call.logger.info('ring state: the call was accepted, joining');
    await call.join().catch((err) => {
      call.logger.error('Failed to join the call after reconciling', err);
    });
    return true;
  }

  const otherMembers = call.state.members
    .filter((member) => member.user_id !== currentUserId)
    .map((member) => member.user_id);
  if (otherMembers.length === 0) return false;

  if (otherMembers.every((userId) => ringState.rejected_by[userId])) {
    call.logger.info('ring state: everyone rejected, leaving');
    await leave({
      reject: true,
      reason: 'cancel',
      message: 'ring: reconciled - everyone rejected',
    });
    return true;
  }

  const settled = (userId: string) =>
    ringState.rejected_by[userId] || ringState.missed_by[userId];
  if (otherMembers.every(settled)) {
    call.logger.info('ring state: no one accepted, leaving');
    await leave({
      reject: true,
      reason: 'timeout',
      message: 'ring: reconciled - no one accepted',
    });
    return true;
  }

  return false;
};

/**
 * Event handler that watches the delivery of `call.ended` Websocket event.
 */
export const watchCallEnded = (call: Call) => {
  return function onCallEnded() {
    globalThis.streamRNVideoSDK?.callingX?.endCall(call, 'remote');
    const { callingState } = call.state;
    if (
      callingState !== CallingState.IDLE &&
      callingState !== CallingState.LEFT
    ) {
      call.clientEventReporter.abort(call.cid, {
        code: 'BACKEND_LEAVE',
        reason: 'call.ended event received',
      });
      call
        .leave({ message: 'call.ended event received', reject: false })
        .catch((err) => {
          call.logger.error('Failed to leave call after call.ended ', err);
        });
    }
  };
};

/**
 * Watches for `callEnded` events.
 */
export const watchSfuCallEnded = (call: Call) => {
  return call.on('callEnded', async (e: CallEnded) => {
    if (call.state.callingState === CallingState.LEFT) return;
    try {
      if (e.reason === CallEndedReason.LIVE_ENDED) {
        call.state.setBackstage(true);

        // don't leave the call if the user has permission to join backstage
        const { hasPermission } = call.permissionsContext;
        if (hasPermission(OwnCapability.JOIN_BACKSTAGE)) return;
      }
      // `call.ended` event arrived after the call is already left
      // and all event handlers are detached. We need to manually
      // update the call state to reflect the call has ended.
      call.state.setEndedAt(new Date());
      const reason = CallEndedReason[e.reason];
      globalThis.streamRNVideoSDK?.callingX?.endCall(call, 'remote');
      call.clientEventReporter.abort(call.cid, {
        code: 'BACKEND_LEAVE',
        reason: `callEnded received: ${reason}`,
      });
      await call.leave({ message: `callEnded received: ${reason}` });
    } catch (err) {
      call.logger.error(
        'Failed to leave call after being ended by the SFU',
        err,
      );
    }
  });
};
